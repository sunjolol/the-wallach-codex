/**
 * views/gloss-tooltip.ts — the shared hover/tap tooltip for glossary terms
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A `.gloss` term (emitted by glossify() in knowledge-corpus.ts) shows its
 * plain-language definition on hover (desktop), focus (keyboard), or tap (touch).
 * ONE tooltip element + delegated document listeners — no per-term wiring, so it
 * covers glossary terms in both claim summaries and Wallach verbatims, however many
 * re-render. Reads the definition from the element's data-def (already escaped at
 * render). Pure view behavior — no state, no storage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

let tip: HTMLElement | null = null;
let wired = false;

function ensureTip(): HTMLElement {
  if (tip === null) {
    tip = document.createElement('div');
    tip.className = 'gloss-tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    document.body.appendChild(tip);
  }
  return tip;
}

function glossTarget(e: Event): HTMLElement | null {
  const el = (e.target as Element | null)?.closest('.gloss');
  return el instanceof HTMLElement ? el : null;
}

function showFor(el: HTMLElement): void {
  const def = el.getAttribute('data-def');
  if (def === null || def.length === 0) {
    return;
  }
  const t = ensureTip();
  t.textContent = def;
  t.hidden = false;
  // Measure after content is set, then clamp to the viewport; prefer above the
  // term, flip below when there is no room.
  const r = el.getBoundingClientRect();
  const tr = t.getBoundingClientRect();
  const docW = document.documentElement.clientWidth;
  let left = r.left + r.width / 2 - tr.width / 2 + window.scrollX;
  left = Math.max(8 + window.scrollX, Math.min(left, window.scrollX + docW - tr.width - 8));
  let top = r.top + window.scrollY - tr.height - 8;
  if (r.top - tr.height - 8 < 0) {
    top = r.bottom + window.scrollY + 8;
  }
  t.style.left = `${left}px`;
  t.style.top = `${top}px`;
}

function hide(): void {
  if (tip !== null) {
    tip.hidden = true;
  }
}

/** Wire the shared glossary tooltip once at boot (idempotent). */
export function initGlossTooltip(): void {
  if (wired) {
    return;
  }
  wired = true;
  document.addEventListener('mouseover', (e) => {
    const el = glossTarget(e);
    if (el !== null) {
      showFor(el);
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (glossTarget(e) !== null) {
      hide();
    }
  });
  document.addEventListener('focusin', (e) => {
    const el = glossTarget(e);
    if (el !== null) {
      showFor(el);
    }
  });
  document.addEventListener('focusout', hide);
  // Touch / click: tap a term toggles its tip; tapping elsewhere dismisses.
  document.addEventListener('click', (e) => {
    const el = glossTarget(e);
    if (el !== null) {
      if (tip !== null && tip.hidden === false) {
        hide();
      }
      else {
        showFor(el);
      }
    }
    else {
      hide();
    }
  });
  // Any scroll (capture, so drawer-internal scroll counts) dismisses the tip.
  window.addEventListener('scroll', hide, true);
}
