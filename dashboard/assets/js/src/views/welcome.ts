/**
 * views/welcome.ts — the arrival veil
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The app's first screen: a name + goals, or "I'm just browsing". RE-CREATED 2026-07-16
 * from the signed-off demo (temporary/coverage-E-rail.html) on real state.
 *
 * WHY IT EXISTS, in Luneth's words: "IF we can gather at least ONE piece of personal info
 * RIGHT AWAY, THE REST OF THE APP IS SUDDENLY MUCH MORE POWERFUL… people want things
 * PERSONALIZED not GENERALIZED."
 *
 * ★ IT IS AN INVITATION, NOT A WALL. "I'm just browsing →" is always there, and it is what
 * keeps this from being a gate — nobody is ever locked out. The copy invites instead of
 * interrogating: "What are you here for?" was the actual complaint, and it is retired
 * (Luneth 2026-07-15: "'What are you here for?' sounds rude, 'Let's get started' is more
 * inviting. It was very simple all along and you blew it out of proportion").
 *
 * ★ IT ASKS ONCE. The tri-state in state/profile.ts is the whole point:
 *     null            — never asked → show the veil
 *     {browsing:true} — the user CHOSE anonymity → never re-prompt (anonymous is a choice,
 *                       not an absence of one)
 *     {name:'…'}      — named → never re-prompt
 *   That is Luneth's "memory element so if someone picks their name and starts without
 *   being a 'guest', they don't have to re-do the prompt on refresh".
 *
 * ★ NAME SAFETY — THE SINK, NOT THE FILTER. Every name render in this app goes through
 * .textContent, which assigns a TEXT NODE and does not parse HTML; `<img src=x
 * onerror=alert(1)>` lands on screen as those literal characters. validateUserName
 * (core/schemas/profile.ts) is layer two (§00.B #2), an ALLOWLIST that catches what
 * textContent does not care about but a human does: bidi/RTL overrides, zero-width padding,
 * control chars that would corrupt the localStorage round-trip. A rejected name shows its
 * REASON — a bounded input needs a rejection path, not just a bound (#8, #1).
 * ═══════════════════════════════════════════════════════════════════════════
 */

import coverageLayoutData from '../../../data/coverage-layout-data.json';
import { GOAL_HUES, MAX_GOALS } from '../core/goal-display.js';
import { CoverageLayoutSchema } from '../core/schemas/index.js';
import { ui } from '../state/copy.js';
import { loadUserProfile, saveUserProfile } from '../state/profile.js';
import { loadRgUserGoals, saveRgUserGoals } from '../state/regimen.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

const LAYOUT = CoverageLayoutSchema.parse(coverageLayoutData);
const NAME_MAX = 18;
const CLOSE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }[c] as string));
}

/**
 * Show the veil? Only when the user has NEVER been asked. A profile that fails to parse
 * reads as null and the user is asked once more — degrading to the ask is safe; degrading
 * to a half-parsed profile is not.
 */
export function shouldShowWelcome(): boolean {
  return loadUserProfile() === null;
}

/**
 * Mount the veil into `host`. Returns a handle; the veil removes itself on entry.
 *
 * @param host   The element to mount the veil into.
 * @param onDone Optional; called after state is written. Callers normally omit it — the
 *               §31 chokepoints already emit and every surface subscribes.
 */
export function mount(host: HTMLElement, onDone?: () => void): MountHandle {
  const existing = loadUserProfile();
  // Re-opened as a GOAL PICKER (the strip's "+ ADD") once a profile exists: the name is
  // already settled, so it is not asked for again and only the goals gate the button.
  const reopen = existing !== null;
  let chosen: string[] = [...(loadRgUserGoals() ?? [])].slice(0, MAX_GOALS);

  const goalChips = LAYOUT.goals.map(g =>
    `<button class="wc-goal" type="button" data-goal="${escHTML(g.id)}">`
    + `<span class="wc-goal__dot"></span>${escHTML(g.name)}</button>`).join('');

  host.innerHTML = `
    <div class="wc-veil" data-veil>
      <div class="wc" role="dialog" aria-modal="true" aria-labelledby="wcH">
        <button class="ui-close wc__x" type="button" data-veil-close aria-label="Close" title="Close">${CLOSE_SVG}</button>
        <div class="wc__kicker">${escHTML(ui('wc_kicker'))}</div>
        <h2 class="wc__h" id="wcH">${escHTML(ui('wc_h'))}</h2>
        <p class="wc__deck">${escHTML(ui('wc_deck'))}</p>
        ${reopen
          ? ''
          : `<label class="wc__label" for="wcName">${escHTML(ui('wc_name_label'))}
               <span class="wc__count"><span data-name-count>0</span>/${NAME_MAX}</span>
             </label>
             <input class="wc__name" id="wcName" data-name maxlength="${NAME_MAX}"
                    placeholder="${escHTML(ui('wc_name_placeholder'))}" autocomplete="off">
             <p class="wc__err" data-name-err hidden></p>`}
        <div style="height: var(--ds-space-6)"></div>
        <span class="wc__label">${escHTML(ui('wc_goals_label'))}
          <span class="wc__count"><span data-goal-count>0</span>/${MAX_GOALS} selected</span>
        </span>
        <div class="wc__goals" data-goals>${goalChips}</div>
        <div class="wc__foot">
          ${reopen ? '' : `<button class="wc__browse" type="button" data-browse>${escHTML(ui('wc_browse'))}</button>`}
          <button class="ds-btn-primary wc__go" type="button" data-go disabled>${escHTML(ui('wc_go'))}</button>
        </div>
      </div>
    </div>
  `;

  const nameEl = host.querySelector<HTMLInputElement>('[data-name]');
  const nameCount = host.querySelector<HTMLElement>('[data-name-count]');
  const nameErr = host.querySelector<HTMLElement>('[data-name-err]');
  const goalCount = host.querySelector<HTMLElement>('[data-goal-count]');
  const goEl = host.querySelector<HTMLButtonElement>('[data-go]');

  const paint = (): void => {
    for (const el of host.querySelectorAll<HTMLElement>('.wc-goal')) {
      const id = el.dataset['goal'] ?? '';
      const i = chosen.indexOf(id);
      el.classList.toggle('is-on', i >= 0);
      // `is-full` says "you're at the cap", not "this is disabled" — the chip stays
      // clickable if it is already chosen, so the cap can always be undone.
      el.classList.toggle('is-full', i < 0 && chosen.length >= MAX_GOALS);
      if (i >= 0) {
        el.style.setProperty('--gc', GOAL_HUES[i] ?? GOAL_HUES[0]);
      }
      else {
        el.style.removeProperty('--gc');
      }
    }
    if (goalCount !== null) {
      goalCount.textContent = String(chosen.length);
    }
    if (nameCount !== null && nameEl !== null) {
      nameCount.textContent = String(nameEl.value.length);
    }
    if (goEl !== null) {
      const named = reopen || (nameEl?.value.trim() ?? '') !== '';
      goEl.disabled = chosen.length === 0 || !named;
    }
  };

  const enter = (browsing: boolean): void => {
    const raw = nameEl?.value.trim() ?? '';
    if (!browsing || raw !== '') {
      // Re-open: the profile already exists and the name is not on screen — do not rewrite
      // it (and do not blank it) just because the goals changed.
      if (!reopen) {
        const res = saveUserProfile({ ...(raw !== '' ? { name: raw } : {}), browsing });
        if (!res.ok) {
          // SHOW the reason — never drop the value silently (#1, #8).
          if (nameErr !== null) {
            nameErr.textContent = res.reason;
            nameErr.hidden = false;
          }
          return;
        }
      }
    }
    else if (!reopen) {
      const res = saveUserProfile({ browsing: true });
      if (!res.ok && nameErr !== null) {
        nameErr.textContent = res.reason;
        nameErr.hidden = false;
        return;
      }
    }
    // "I'm just browsing" on FIRST arrival means no goals; on a re-open it means "leave my
    // goals alone and close", so the goals are only cleared when the choice is the arrival's.
    saveRgUserGoals(browsing && !reopen ? [] : chosen);
    host.replaceChildren();
    onDone?.();
  };

  const dismiss = (): void => {
    if (reopen) {
      // Goal-picker cancel: leave the existing profile and its goals untouched, just close.
      host.replaceChildren();
      onDone?.();
    }
    else {
      // First arrival: a modal close must never trap the user. Treat it as "just
      // browsing" so the tri-state records a choice and the veil never re-nags on refresh.
      enter(true);
    }
  };

  const onClick = (ev: Event): void => {
    const t = ev.target as HTMLElement | null;
    if (t === null) {
      return;
    }
    if (t.closest('[data-veil-close]') !== null) {
      dismiss();
      return;
    }
    const chip = t.closest<HTMLElement>('.wc-goal');
    if (chip !== null) {
      const id = chip.dataset['goal'] ?? '';
      if (chosen.includes(id)) {
        chosen = chosen.filter(g => g !== id);
      }
      else if (chosen.length < MAX_GOALS) {
        chosen.push(id);
      }
      paint();
      return;
    }
    if (t.closest('[data-go]') !== null) {
      enter(false);
      return;
    }
    if (t.closest('[data-browse]') !== null) {
      enter(true);
    }
  };

  host.addEventListener('click', onClick);
  nameEl?.addEventListener('input', () => {
    if (nameErr !== null) {
      nameErr.hidden = true;
    }
    paint();
  });
  paint();
  nameEl?.focus();

  return {
    update: paint,
    unmount: () => {
      host.removeEventListener('click', onClick);
      host.replaceChildren();
    },
  };
}
