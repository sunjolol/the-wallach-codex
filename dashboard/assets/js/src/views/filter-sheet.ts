/**
 * views/filter-sheet.ts — THE PHONE'S FILTER SHEET
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The Regimen screen carries two filter rows built from the same parts — the FOOD SOURCES row
 * (category / goal / nutrient / name) in views/foods-block.ts, and the PRODUCT catalogue row
 * (sort / goal / nutrient) in views/regimen.ts. On a desktop they sit on one line beside the
 * pager and cost no vertical space at all.
 *
 * MEASURED at 375px: they cost 194px and 144px. `.fs-filter` wraps, and each control is a
 * fixed 160–225px, so four of them stack into four full-width rows of chrome above a list that
 * is the reason the screen exists.
 *
 * His ruling: "find a solution that mimics modern mobile app standards for such features."
 * The standard for three-to-four pickers over a list is a FILTER BAR with a SHEET behind it —
 * one control at rest, the pickers on demand, over a dimmed list. So:
 *
 *   at rest   [ ⚙ Filters (2) ] [ ⌕ find a food… ]      44px
 *   tapped    the same pickers, full-width, in a sheet that rises from the bottom
 *
 * ═══ THE TWO THINGS THAT MAKE THIS SAFE ═══
 *
 * 1. `display: contents` ON THE SHEET, AT EVERY OTHER WIDTH. The sheet is a real wrapper
 *    element around the <select>s, which would normally change the desktop layout — .fs-filter
 *    is a flex row and its children would become one box instead of four. `display: contents`
 *    removes the wrapper from the box tree entirely, so on a desktop the selects are still
 *    direct flex children of .fs-filter and the row is byte-for-byte what it was. The phone
 *    layer is the only place the wrapper becomes a box.
 *
 * 2. THE ROW STAYS IN FLOW. The sheet is the WRAPPER that goes `position: fixed`, never
 *    .fs-filter itself — so the bar (toggle + name box) keeps its place in the controls row
 *    and nothing behind the dimmed backdrop reflows as the sheet opens.
 *
 * NOTHING HERE APPLIES A FILTER. The pickers are the same <select>s with the same
 * data-attributes and the same change handlers; they still apply LIVE, on change, exactly as
 * they do on a desktop. That is why the sheet's footer says "Done" rather than "Apply" — an
 * Apply button would be lying about when the list updates.
 *
 * §00.A: no amounts, no doses, no claims — chrome only.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { ui } from '../state/copy.js';

/**
 * How many pickers in this row are narrowing the list right now.
 *
 * ★ DERIVED FROM THE CONTROL, NOT FROM A LIST OF CONTROL NAMES. A select counts only if it
 * OFFERS an all-option (`<option value="">`) and is not currently on it. That test costs
 * nothing and gets the SORT picker right for free: sort has no "all" — its default IS one of
 * its three values — so a count keyed on "value is non-empty" would have read "Filters (1)"
 * on a screen with nothing filtered, forever. The name box is not counted: it stays visible
 * in the bar, so it is never the hidden state a badge exists to disclose.
 */
function activeCount(row: HTMLElement): number {
  let n = 0;
  for (const sel of Array.from(row.querySelectorAll<HTMLSelectElement>('select.fs-filter__cat'))) {
    const offersAll = Array.from(sel.options).some(o => o.value === '');
    if (offersAll && sel.value !== '') {
      n += 1;
    }
  }
  return n;
}

/** Repaint one row's badge from its own controls. Safe to call on a row with no toggle. */
export function refreshFilterCount(row: HTMLElement): void {
  const toggle = row.querySelector<HTMLElement>('[data-fs-filters]');
  if (toggle === null) {
    return;
  }
  const n = activeCount(row);
  const badge = toggle.querySelector<HTMLElement>('.fs-filter__count');
  if (badge !== null) {
    badge.textContent = n > 0 ? String(n) : '';
  }
  toggle.classList.toggle('is-on', n > 0);
}

/**
 * Wrap a filter row's PICKERS in the phone sheet and build the bar toggle that opens it.
 * Returns the nodes to append to `.fs-filter`, in order — the caller appends any name box
 * after them, so it stays in the bar rather than in the sheet.
 */
export function filterSheet(pickers: HTMLElement[]): HTMLElement[] {
  // ONE PICKER IS NOT A FILTER SET. The Coverage pane's food block deliberately carries the
  // short row — category + name box — and putting a "Filters" button in front of a single
  // <select> trades one control for two. The rule is derived from the row, not from a list of
  // which rows are short, so a row that grows a second picker gets the sheet without an edit
  // here and one that loses one gives it back.
  if (pickers.length < 2) {
    return pickers;
  }
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'fs-filter__toggle';
  toggle.dataset['fsFilters'] = '';
  toggle.setAttribute('aria-expanded', 'false');
  const label = document.createElement('span');
  label.className = 'fs-filter__toggle-label';
  label.textContent = ui('fs_filter_open');
  const count = document.createElement('span');
  count.className = 'fs-filter__count';
  toggle.append(label, count);

  const sheet = document.createElement('div');
  sheet.className = 'fs-filter__sheet';
  sheet.setAttribute('role', 'group');
  sheet.setAttribute('aria-label', ui('fs_filter_sheet_label'));

  const foot = document.createElement('div');
  foot.className = 'fs-filter__foot';
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'fs-filter__footb';
  clear.dataset['fsClear'] = '';
  clear.textContent = ui('fs_filter_clear');
  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'fs-filter__footb fs-filter__footb--go';
  done.dataset['fsDone'] = '';
  done.textContent = ui('fs_filter_done');
  foot.append(clear, done);

  // The grab bar + title. Decorative to a screen reader — the sheet element already carries
  // the same string as its accessible name, and announcing it twice is noise.
  const head = document.createElement('div');
  head.className = 'fs-filter__sheethd';
  head.setAttribute('aria-hidden', 'true');
  head.textContent = ui('fs_filter_sheet_label');

  sheet.append(head, ...pickers, foot);
  return [toggle, sheet];
}

/** Close every open sheet on the page. */
function closeAll(): void {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>('.fs-filter__sheet.is-open'))) {
    el.classList.remove('is-open');
    el.closest('.fs-filter')?.querySelector('[data-fs-filters]')?.setAttribute('aria-expanded', 'false');
  }
  document.body.classList.remove('fs-sheet-open');
}

let installed = false;

/**
 * One delegated listener for every filter row on the page, present and future.
 *
 * Delegation rather than per-row wiring is not a style choice here: both rows are REBUILT from
 * scratch on every repaint (a food added, a page turned, regimen:changed), so a listener bound
 * to a row would be thrown away with it and silently stop working. The document outlives them.
 * Idempotent — main.ts calls it once at boot, and a second call is a no-op.
 */
export function installFilterSheet(): void {
  if (installed) {
    return;
  }
  installed = true;

  document.addEventListener('click', (ev) => {
    const target = ev.target;
    if (!(target instanceof Element)) {
      return;
    }
    const toggle = target.closest<HTMLElement>('[data-fs-filters]');
    if (toggle !== null) {
      const row = toggle.closest<HTMLElement>('.fs-filter');
      const sheet = row?.querySelector<HTMLElement>('.fs-filter__sheet');
      if (sheet !== undefined && sheet !== null) {
        const open = !sheet.classList.contains('is-open');
        closeAll();
        sheet.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('fs-sheet-open', open);
      }
      return;
    }
    if (target.closest('[data-fs-done]') !== null) {
      closeAll();
      return;
    }
    const clear = target.closest<HTMLElement>('[data-fs-clear]');
    if (clear !== null) {
      const row = clear.closest<HTMLElement>('.fs-filter');
      if (row !== null) {
        // Only pickers that OFFER an all-option can be cleared TO one — the sort picker has no
        // "all" and clearing it to '' would blank the control (that exact bug is documented at
        // its build site in views/regimen.ts). The name box clears too: it is part of the same
        // narrowing even though it lives in the bar.
        for (const sel of Array.from(row.querySelectorAll<HTMLSelectElement>('select.fs-filter__cat'))) {
          if (sel.value !== '' && Array.from(sel.options).some(o => o.value === '')) {
            sel.value = '';
            sel.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        const q = row.querySelector<HTMLInputElement>('input.fs-filter__q');
        if (q !== null && q.value !== '') {
          q.value = '';
          q.dispatchEvent(new Event('input', { bubbles: true }));
        }
        refreshFilterCount(row);
      }
      return;
    }
    // The backdrop is a ::before on the ROW (see mobile.css for why it cannot hang off the
    // sheet), so a tap on the scrim lands on .fs-filter itself — never on a child. Guarded on
    // a sheet actually being open, so a stray tap on the bar's own empty space does nothing.
    if ((target.classList.contains('fs-filter') || target.classList.contains('fs-filter__sheet'))
      && document.querySelector('.fs-filter__sheet.is-open') !== null) {
      closeAll();
    }
  });

  // The badge has to follow the controls, and the controls are re-rendered by their own
  // handlers — so read the DOM after a change rather than tracking a parallel copy of it.
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t instanceof Element) {
      const row = t.closest<HTMLElement>('.fs-filter');
      if (row !== null) {
        refreshFilterCount(row);
      }
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && document.body.classList.contains('fs-sheet-open')) {
      closeAll();
    }
  });
}
