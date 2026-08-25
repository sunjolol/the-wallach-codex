/**
 * views/gloss-tooltip.ts — shared hover/tap tooltip for glossary terms + fast [data-tip] hints
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A `.gloss` term (emitted by glossify() in views/glossify.ts) shows its
 * plain-language definition on hover (desktop), focus (keyboard), or tap (touch).
 * The tap path is NOT free: a touchscreen fires a synthetic mouseover before the click, and
 * until it was gated on pointer modality that pair opened and closed the tip in one gesture.
 * Read `lastPointerWasTouch` below before changing any listener here.
 * ONE tooltip element + delegated document listeners — no per-term wiring, so it
 * covers glossary terms in both claim summaries and Wallach verbatims, however many
 * re-render. Reads the definition from the element's data-def (already escaped at
 * render). Pure view behavior — no state, no storage.
 * ═══════════════════════════════════════════════════════════════════════════
 */

let tip: HTMLElement | null = null;
let activeEl: HTMLElement | null = null;
let wired = false;
/**
 * Whether the gesture in flight came from a finger.
 *
 * A touchscreen SYNTHESISES a mouseover before it dispatches the click, so on a phone one tap
 * ran showFor() (from the fake mouseover) and then the click handler found the tip already
 * open on the same element and toggled it straight back off. The definition appeared and
 * vanished inside a single tap, which reads as "glossary terms do nothing on a phone".
 * MEASURED at 375x812 with touch emulation on: after tapping `villi`, the tip element held the
 * correct definition text and `hidden` was still true.
 *
 * Gating on `(hover: hover)` would fix a phone and BREAK A TOUCH LAPTOP, which reports
 * hover:hover and still synthesises the same events. The modality of the actual gesture is the
 * only thing that answers this, so that is what gets recorded.
 */
let lastPointerWasTouch = false;
/**
 * The term whose tip was ALREADY open when the current gesture started, or null.
 *
 * The click handler must not read "is the tip open right now?" to decide whether a tap means
 * open-or-close, because by the time click fires, this gesture has usually opened it itself:
 * a tap focuses the term, focusin calls showFor(), and click then found its own tip open on
 * its own element and closed it. Reading the state from BEFORE the gesture separates
 * "I am opening this" from "I am closing what was already open".
 */
let openAtGestureStart: HTMLElement | null = null;

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
  // Capture phase, and declared before every other listener here: pointerdown always precedes
  // both the synthesised mouseover and the click, so by the time either of those runs this flag
  // already describes the gesture in flight.
  document.addEventListener('pointerdown', (e) => {
    lastPointerWasTouch = e.pointerType === 'touch';
    openAtGestureStart = (tip !== null && tip.hidden === false) ? activeEl : null;
  }, true);
  document.addEventListener('mouseover', (e) => {
    // A finger produces no real hover. Anything arriving here during a touch gesture is the
    // browser's synthetic compatibility event, and acting on it is what cancelled the tap.
    if (lastPointerWasTouch) {
      return;
    }
    const el = glossTarget(e);
    if (el !== null) {
      showFor(el);
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (lastPointerWasTouch) {
      return;
    }
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
      // Only toggle OFF when the SAME term was ALREADY showing before this gesture began;
      // tapping a different term switches the tip straight to it, so moving between terms on
      // touch never costs two taps. Comparing against openAtGestureStart rather than the live
      // state is what stops a tap from closing the tip its own focusin just opened.
      if (el === openAtGestureStart) {
        hide();
      }
      else {
        showFor(el);
      }
    }
    else {
      hide();
    }
    openAtGestureStart = null;
  });
  // Any scroll (capture, so drawer-internal scroll counts) dismisses the tip.
  window.addEventListener('scroll', hide, true);
}
