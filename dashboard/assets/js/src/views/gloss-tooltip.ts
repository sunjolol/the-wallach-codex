/**
 * views/gloss-tooltip.ts — shared hover/tap tooltip for glossary terms + fast [data-tip] hints
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A `.gloss` term (emitted by glossify() in views/glossify.ts) shows its
 * plain-language definition on hover (desktop), focus (keyboard), or tap (touch).
 * ONE tooltip element + delegated document listeners — no per-term wiring, so it
 * covers glossary terms in both claim summaries and Wallach verbatims, however many
 * re-render. Reads the definition from the element's data-def (already escaped at
 * render). Pure view behavior — no state, no storage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

let tip: HTMLElement | null = null;
let activeEl: HTMLElement | null = null;
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
  const el = (e.target as Element | null)?.closest('.gloss, [data-tip]');
  return el instanceof HTMLElement ? el : null;
}

function showFor(el: HTMLElement): void {
  const def = el.getAttribute('data-def') ?? el.getAttribute('data-tip');
  if (def === null || def.length === 0) {
    return;
  }
  const t = ensureTip();
  activeEl = el;
  t.textContent = def;
  // Colour the tip to match the term's claim family -- the same colour its dotted underline
  // resolves to (green protocol, blue/violet/amber category, etc.). [data-tip] hints and
  // Search-drawer glosses have no family, so they keep the default accent outline.
  if (el.classList.contains('gloss')) {
    const fam = getComputedStyle(el).borderBottomColor;
    t.style.borderColor = fam;
    t.style.background = `color-mix(in srgb, ${fam} 16%, var(--ds-ink))`;
  }
  else {
    t.style.borderColor = '';
    t.style.background = '';
  }
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
  activeEl = null;
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
      // Only toggle OFF when the SAME term is tapped again; tapping a different term switches
      // the tip straight to it, so moving between terms on touch never costs two taps.
      if (tip !== null && tip.hidden === false && el === activeEl) {
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
