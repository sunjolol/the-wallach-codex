/**
 * state/ocr.ts — native OCR pipeline (image → ScanLabel)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Turns a label image (data URL) into a ScanLabel the verdict engine can score.
 * Ported faithfully (Chunk 6c) from legacy-dashboard.js — the page no longer
 * loads legacy, so loadTesseract · preprocessImage · runOcr · the OCR fuzzy-
 * correction pass · parseOcrText · the lcScanImage orchestrator all live here.
 *
 * Pipeline (scanImage):
 *   preprocessImage (canvas upscale → grayscale → gentle contrast) → runOcr
 *   (vendored Tesseract.js, PSM 6, local worker/core/lang — zero network) →
 *   ocrPostProcess (Levenshtein snap to the food/ingredient dictionary) →
 *   parseOcrText (nutrition-panel + ingredient-line heuristics → name / amount /
 *   unit + ingredients string + container hint) → parseLabel (→ ScanLabel) →
 *   runScan (state/scanner.ts — verdict + gap-fill + history + view re-render).
 *
 * The dictionaries (OCR_FUZZY_DICT + KNOWN_NUTRIENT_NAMES) are migrated VERBATIM
 * to assets/data/ocr-dict-data.json (Zod OcrDictSchema). §00.A: every term is
 * the legacy value unchanged; nothing here authors corpus data. The parser
 * regexes are case-insensitive (/i) ports; their character classes are written
 * lowercase + bounded so they read clean and cannot backtrack super-linearly,
 * which does not change which labels they match.
 *
 * Tesseract is the global `window.Tesseract` installed by the vendored script;
 * it is typed through a narrow interface and loaded lazily on first scan, so the
 * ~22MB WASM never loads until a label is actually dropped.
 *
 * The bridge: window.lcScanImage = scanImage (legacy-style + drop/paste/upload
 * callers); window.lcParseLabel = parseLabel (lets a headless probe feed raw OCR
 * text straight to the parser and assert the ScanLabel, with no WASM at all).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import ocrDictData from '../../../data/ocr-dict-data.json';
import { OcrDictSchema, type ScanLabel } from '../core/schemas/index.js';
import { runScan, type ScanResult } from './scanner.js';

// ─── Narrow Tesseract + window typings (the vendored global) ───────────────

interface TesseractLoggerMsg {
  status?: string;
  progress?: number;
}

interface TesseractWorker {
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  recognize: (image: string) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
}

interface TesseractGlobal {
  createWorker: (
    lang: string,
    oem: number,
    opts: {
      corePath: string;
      langPath: string;
      logger: (m: TesseractLoggerMsg) => void;
      workerPath: string;
    },
  ) => Promise<TesseractWorker>;
}

interface OcrWindow extends Window {
  Tesseract?: TesseractGlobal;
  lcParseLabel?: (rawText: string) => ScanLabel;
  lcScanImage?: (dataUrl: string) => Promise<ScanResult | null>;
}

type ProgressFn = (message: string, progress: number) => void;

interface ParsedOcr {
  containerHint: string;
  ingredients: string;
  nutrients: Array<{ amount: number; name: string; unit: string }>;
}

// ─── Dictionary load (esbuild JSON import + Zod, cached) ───────────────────

interface OcrDicts {
  fuzzy: Set<string>;
  known: string[];
}

let cachedDict: OcrDicts | null = null;

/** The food/ingredient + known-nutrient dictionaries, validated then cached. */
function loadDict(): OcrDicts {
  if (cachedDict === null) {
    const parsed = OcrDictSchema.parse(ocrDictData);
    cachedDict = {
      fuzzy: new Set(parsed.fuzzyDict.map(w => w.toLowerCase())),
      known: parsed.knownNutrientNames,
    };
  }
  return cachedDict;
}

// ─── Tesseract loader + image preprocessing + OCR run ──────────────────────

/** Lazily inject the vendored Tesseract script (zero external runtime fetch). */
async function loadTesseract(): Promise<void> {
  const w = window as OcrWindow;
  if (w.Tesseract !== undefined) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './assets/vendor/tesseract/tesseract.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load local OCR engine. Run `node tools/vendor-tesseract.js` once to vendor Tesseract files into dashboard/assets/vendor/tesseract/.'));
    document.head.appendChild(script);
  });
}

/** Upscale + grayscale + gentle contrast — makes Tesseract dramatically sharper. */
async function preprocessImage(dataUrl: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const target = 2000;
        const scale = Math.max(1, Math.min(3, target / Math.max(img.naturalWidth, img.naturalHeight)));
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
          reject(new Error('2D canvas context unavailable'));
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = id.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = (d[i] ?? 0) * 0.299 + (d[i + 1] ?? 0) * 0.587 + (d[i + 2] ?? 0) * 0.114;
          const v = Math.max(0, Math.min(255, (gray - 128) * 1.25 + 128));
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
        ctx.putImageData(id, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      }
      catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
    img.src = dataUrl;
  });
}

/** Run vendored Tesseract over a (preprocessed) image; PSM 6 single text block. */
async function runOcr(imageData: string, progress: ProgressFn): Promise<string> {
  progress('Preprocessing image...', 0);
  let processed: string;
  try {
    processed = await preprocessImage(imageData);
  }
  catch {
    processed = imageData;
  }
  progress('Warming up high-accuracy OCR...', 0.05);
  await loadTesseract();
  progress('Starting recognition...', 0.1);
  const tesseract = (window as OcrWindow).Tesseract;
  if (tesseract === undefined) {
    throw new Error('OCR engine did not initialize');
  }
  const worker = await tesseract.createWorker('eng', 1, {
    corePath: './assets/vendor/tesseract/',
    langPath: './assets/vendor/tesseract/lang-data',
    logger: (m) => {
      if (m.status === 'recognizing text') {
        progress('Reading text carefully...', 0.1 + (m.progress ?? 0) * 0.9);
      }
      else if (m.status === 'loading language traineddata') {
        progress('Loading language model from local vendor...', m.progress ?? 0);
      }
      else if (typeof m.status === 'string' && m.status.length < 40) {
        progress(m.status, m.progress ?? 0);
      }
    },
    workerPath: './assets/vendor/tesseract/worker.min.js',
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: '1', tessedit_pageseg_mode: '6' });
  }
  catch {
    // setParameters is best-effort — some builds reject unknown keys.
  }
  const result = await worker.recognize(processed);
  await worker.terminate();
  return result.data.text;
}

// ─── OCR fuzzy correction (Levenshtein snap to the food dictionary) ────────

/** Classic two-row Levenshtein edit distance. */
function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (a.length === 0) {
    return b.length;
  }
  if (b.length === 0) {
    return a.length;
  }
  let prev = Array.from({ length: b.length + 1 }, () => 0);
  let curr = Array.from({ length: b.length + 1 }, () => 0);
  for (let j = 0; j <= b.length; j++) {
    prev[j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min((curr[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length] ?? 0;
}

/** Snap a single OCR word onto the nearest known food term within 1–2 edits. */
function ocrFuzzyFix(word: string): string {
  if (word.length < 3) {
    return word;
  }
  if (/[\d()]/.test(word)) {
    return word;
  }
  const dict = loadDict();
  const lower = word.toLowerCase();
  if (dict.fuzzy.has(lower)) {
    return word;
  }
  let best: string | null = null;
  let bestDist = Infinity;
  const maxDist = lower.length <= 4 ? 1 : 2;
  for (const candidate of dict.fuzzy) {
    if (Math.abs(candidate.length - lower.length) > 2) {
      continue;
    }
    const dist = levenshtein(lower, candidate);
    if (dist <= maxDist && dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  if (best === null) {
    return word;
  }
  if (word === word.toUpperCase()) {
    return best.toUpperCase();
  }
  const firstChar = word.charAt(0);
  if (firstChar === firstChar.toUpperCase()) {
    return best.charAt(0).toUpperCase() + best.slice(1);
  }
  return best;
}

/** Fuzzy-correct every alphabetic run in the OCR text, preserving punctuation. */
function ocrPostProcess(text: string): string {
  return text.replace(/[a-z]+/gi, m => ocrFuzzyFix(m));
}

// ─── Label parser (OCR text → ingredients · nutrients · container hint) ────

/** Parse raw OCR text into structured label fields (legacy parseOcrText port). */
function parseOcrText(rawTextInput: string): ParsedOcr {
  const out: ParsedOcr = { containerHint: '', ingredients: '', nutrients: [] };
  const rawText = ocrPostProcess(rawTextInput);

  // Ingredients — relaxed (bounded) whitespace + a wide set of stop conditions.
  const ingMatch = rawText.match(/INGREDIENTS?\s{0,8}[:.]?\s{0,8}([\s\S]+?)(?:\n\s*\n|NUTRITION\s+FACTS|SUPPLEMENT\s+FACTS|DIRECTIONS|SUGGESTED\s+USE|OTHER\s+INGREDIENTS|CONTAINS\s*:|WARNING|ALLERGEN|MANUFACTURED|DISTRIBUTED|$)/i);
  if (ingMatch !== null && ingMatch[1] !== undefined) {
    const ing = ingMatch[1].trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
    if (ing.length > 8) {
      out.ingredients = ing;
    }
  }
  // Fallback — comma-rich text with no NUTRITION header reads as an ingredient list.
  if (out.ingredients === '') {
    const trimmed = rawText.trim().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
    const commas = (trimmed.match(/,/g) ?? []).length;
    const hasNutritionHeader = /NUTRITION\s+FACTS|SUPPLEMENT\s+FACTS|Calories|Serving/i.test(trimmed);
    if (commas >= 4 && trimmed.length >= 30 && trimmed.length <= 2000 && !hasNutritionHeader) {
      out.ingredients = trimmed;
    }
  }

  // Nutrients — line-anchored "Name AMOUNT unit", with OCR-noise rejection.
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const nutPat = /^([a-z][a-z\s()+\-/]{0,54}?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu)\b/i;
  const skip = /^(?:calories|serving|amount per|daily value|total fat|saturated|trans fat|cholesterol|total carbohydrate|dietary fiber|total sugars|added sugars|nutrition|facts|amount)$/i;
  const seen = new Set<string>();
  for (const line of lines) {
    const m2 = line.match(nutPat);
    if (m2 === null || m2[1] === undefined || m2[2] === undefined || m2[3] === undefined) {
      continue;
    }
    const name = m2[1].trim();
    if (skip.test(name)) {
      continue;
    }
    if (name.length < 2 || name.length > 55) {
      continue;
    }
    const openParens = (name.match(/\(/g) ?? []).length;
    const closeParens = (name.match(/\)/g) ?? []).length;
    if (openParens !== closeParens) {
      continue;
    }
    if (/[:;]/.test(name)) {
      continue;
    }
    const wordCount = (name.match(/\b[a-z]+\b/gi) ?? []).length;
    if (wordCount > 4) {
      continue;
    }
    const hasSubstantiveWord = (name.match(/\b[a-z]{4,}\b/gi) ?? []).length > 0;
    if (!hasSubstantiveWord) {
      continue;
    }
    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.nutrients.push({ amount: Number.parseFloat(m2[2]), name, unit: m2[3].toLowerCase() });
  }

  // Reversed-format catch: "12g COLLAGEN" / "11g PROTEIN" (can-front graphics).
  const reversedPat = /\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu)\s+([a-z][a-z-]{3,20})\b/gi;
  const reversedAllow = new Set(['collagen', 'protein', 'fiber', 'peptides', 'calcium', 'magnesium', 'potassium', 'sodium']);
  for (let rm = reversedPat.exec(rawText); rm !== null; rm = reversedPat.exec(rawText)) {
    const g1 = rm[1];
    const g2 = rm[2];
    const g3 = rm[3];
    if (g1 === undefined || g2 === undefined || g3 === undefined) {
      continue;
    }
    const nameLower = g3.toLowerCase();
    if (!reversedAllow.has(nameLower)) {
      continue;
    }
    const canonical = nameLower === 'peptides' ? 'Collagen Peptides' : (g3.charAt(0).toUpperCase() + g3.slice(1).toLowerCase());
    const key = canonical.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    if (key === 'collagen' && seen.has('collagen peptides')) {
      continue;
    }
    if (key === 'collagen peptides' && seen.has('collagen')) {
      continue;
    }
    seen.add(key);
    out.nutrients.push({ amount: Number.parseFloat(g1), name: canonical, unit: g2.toLowerCase() });
  }

  // Known-nutrient pass: scan the WHOLE text (recovers data when PSM 6 collapses
  // the panel into one line and the line-anchored regex can't fire).
  const known = loadDict().known;
  for (const nutName of known) {
    const escaped = nutName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pat = new RegExp(`\\b${escaped}\\b[\\s,]*(?:\\([^)]{1,30}\\)[\\s,]*)?(\\d+(?:\\.\\d+)?)\\s*(mg|mcg|g|iu)\\b`, 'i');
    const m = rawText.match(pat);
    if (m === null || m[1] === undefined || m[2] === undefined) {
      continue;
    }
    const key = nutName.toLowerCase();
    if (key === 'collagen' && seen.has('collagen peptides')) {
      continue;
    }
    if (key === 'fiber' && seen.has('dietary fiber')) {
      continue;
    }
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.nutrients.push({ amount: Number.parseFloat(m[1]), name: nutName, unit: m[2].toLowerCase() });
  }

  // Container hint
  if (/\bfl\s*oz\b/i.test(rawText)) {
    out.containerHint = 'aluminum_can';
  }
  else if (/capsules?|softgels?|tablets?/i.test(rawText)) {
    out.containerHint = 'capsule';
  }
  else if (/powder|scoops?\b/i.test(rawText)) {
    out.containerHint = 'powder';
  }
  return out;
}

/** Build a ScanLabel from raw OCR text (legacy lcScanImage label shape). */
function parseLabel(rawText: string): ScanLabel {
  const parsed = parseOcrText(rawText);
  return {
    name: parsed.containerHint !== '' ? parsed.containerHint : 'Scanned label',
    brand: '',
    servings: 1,
    nutrients: parsed.nutrients,
    ingredients: parsed.ingredients,
  };
}

// ─── Orchestrator + bridge ─────────────────────────────────────────────────

/** Image data URL → OCR → parsed label → native verdict scan (logged). */
export async function scanImage(dataUrl: string): Promise<ScanResult | null> {
  if (dataUrl === '') {
    throw new Error('scanImage: no dataUrl provided');
  }
  const text = await runOcr(dataUrl, (message, progress) => {
    try {
      window.dispatchEvent(new CustomEvent('lcscan:progress', { detail: { message, progress } }));
    }
    catch {
      // progress dispatch is best-effort — never block the scan on it.
    }
  });
  const label = parseLabel(text);
  return runScan(label);
}

if (typeof window !== 'undefined') {
  const w = window as OcrWindow;
  w.lcScanImage = scanImage;
  w.lcParseLabel = parseLabel;
}
