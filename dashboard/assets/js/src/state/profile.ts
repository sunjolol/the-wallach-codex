/**
 * state/profile.ts -- the user's identity choice, persisted through one chokepoint
 * ===========================================================================
 *
 * Luneth, 2026-07-15: "add a memory element so if someone picks their name and
 * starts without being a 'guest', they don't have to re-do the prompt on
 * refresh" + "make sure they can click their name or profile to change their
 * name, same protections here on the inputs".
 *
 * WHY A CHOKEPOINT FOR ONE STRING (§31). Not ceremony. The rule is "all mutations
 * of a sensitive state surface flow through a small fixed set of NAMED helpers
 * that emit a typed event" -- and the point is not the count of writers, it is
 * that a second, ad-hoc writer can appear later and nobody notices, because
 * there is no named place the change was supposed to go. The name is painted in
 * three separate slots (topbar, profile tab, avatar initial); a silent write
 * would leave two of them stale. `regimen_state_mutation_routing` gates this
 * shape, and the negative test proves a non-emitting writer REDs.
 *
 * WHAT "BROWSING" MEANS, precisely, because the tri-state is easy to get wrong:
 *   null           -- never asked. Show the arrival veil.
 *   {browsing:true}-- the user chose "I'm just browsing". Do NOT re-prompt on
 *                     refresh; that is the same nag the memory element exists to
 *                     kill. Anonymous is a CHOICE, not an absence of one.
 *   {name:'...'}   -- the user named themselves. Do not re-prompt.
 *
 * The read is Zod-validated at the boundary (core/storage.ts::getValidated), so a
 * corrupted or hand-edited LS value cannot enter typed-land. If it fails to
 * parse we return null and the user is asked once more -- degrading to the ask is
 * safe; degrading to a half-parsed profile is not (graceful degradation, #7).
 * ===========================================================================
 */

import { emit } from '@core/events.js';
import { type UserProfile, UserProfileSchema, validateUserName } from '@core/schemas/profile.js';
import { getValidated, setValidated } from '@core/storage.js';

export const USER_PROFILE_KEY = 'wallachUserProfile_v1';

/**
 * Read the persisted identity choice. `null` = never asked (show the veil).
 * A value that fails validation is treated as never-asked rather than trusted.
 */
export function loadUserProfile(): UserProfile | null {
  return getValidated(USER_PROFILE_KEY, UserProfileSchema);
}

/**
 * §31 chokepoint -- the ONLY writer of the profile key.
 *
 * Returns the same reject-with-reason shape as validateUserName so the caller can
 * SHOW the user why a name was refused. It must never drop the value silently:
 * a bounded input needs a rejection PATH, not just a bound (doctrine #8, #1).
 */
export function saveUserProfile(
  input: { name?: string; browsing: boolean },
): { ok: true; profile: UserProfile } | { ok: false; reason: string } {
  let name: string | undefined;
  if (input.name !== undefined && input.name !== '') {
    const checked = validateUserName(input.name);
    if (!checked.ok) {
      return { ok: false, reason: checked.reason };
    }
    name = checked.name;
  }
  const profile: UserProfile = {
    ...(name !== undefined ? { name } : {}),
    browsing: input.browsing,
    chosenAt: new Date().toISOString().slice(0, 10),
  };
  const res = setValidated(USER_PROFILE_KEY, profile, UserProfileSchema);
  if (!res.ok) {
    // The write primitive verifies its own round-trip. If it says no, say so --
    // never report success on an unverified write (#1: no silent failures).
    return { ok: false, reason: 'That name could not be saved to this device.' };
  }
  emit('profile:changed', { name: profile.name ?? null, browsing: profile.browsing });
  return { ok: true, profile };
}

/**
 * The name to DISPLAY, per Luneth's 2026-07-15 call: the "I'm just browsing"
 * default is no longer "Friend".
 *   slot 'profile'  -> "You"    (bottom-right profile tab)
 *   slot 'brand'    -> "Codex"  (top-left, where a name would have gone)
 * A named user gets their own name in both. Kept here rather than in a view so
 * the two slots cannot drift apart (single source of truth, #3).
 */
export function displayName(profile: UserProfile | null, slot: 'profile' | 'brand'): string {
  if (profile?.name !== undefined && profile.name !== '') {
    return profile.name;
  }
  return slot === 'brand' ? 'Codex' : 'You';
}

/** The avatar initial. Falls back to the display name's first character. */
export function displayInitial(profile: UserProfile | null): string {
  return displayName(profile, 'profile').charAt(0).toUpperCase();
}
