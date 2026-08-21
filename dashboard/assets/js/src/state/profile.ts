/**
 * state/profile.ts -- the user's identity choice, persisted through one chokepoint
 * ===========================================================================
 *
 * The identity choice PERSISTS: a user who names themselves (or chooses to browse
 * anonymously) is never re-prompted on refresh, and can click their name to rename with
 * the same input protections.
 *
 * The profile is a small IDENTITY console -- name, avatar (a bundled preset or an uploaded
 * image), and appearance (theme + primary accent). All four flow through the SAME single
 * writer. That is the whole point of the chokepoint (below): a second, ad-hoc writer can
 * appear later and nobody notices, because there is no named place the change was supposed
 * to go.
 *
 * WHY A CHOKEPOINT. Not ceremony. The rule is "all mutations of a sensitive
 * state surface flow through a small fixed set of NAMED helpers that emit a typed
 * event". The identity is painted in several slots (topbar brand, rail chip name,
 * rail avatar, browser-tab title) plus it drives the app-wide theme/accent on
 * <html>; a silent write would leave some of them stale. Every mutation here
 * delegates to the private `writeProfile`, whose last line is the emit.
 *
 * WHAT "BROWSING" MEANS, precisely, because the tri-state is easy to get wrong:
 *   null           -- never asked. Show the arrival veil.
 *   {browsing:true}-- the user chose "I'm just browsing" (a guest). Do NOT
 *                     re-prompt on refresh. Anonymous is a CHOICE, not an absence.
 *   {name:'...'}   -- the user named themselves. Do not re-prompt.
 *
 * The read is Zod-validated at the boundary (core/storage.ts::getValidated), so a
 * corrupted or hand-edited LS value cannot enter typed-land. If it fails to parse
 * we return null and the user is asked once more -- degrading to the ask is safe;
 * degrading to a half-parsed profile is not (graceful degradation).
 * ===========================================================================
 */

import { emit } from '@core/events.js';
import {
  type AccentId,
  AvatarSchema,
  isPresetAvatar,
  type ThemeId,
  type UserProfile,
  UserProfileSchema,
  validateUserName,
} from '@core/schemas/profile.js';
import { getValidated, setValidated } from '@core/storage.js';

export const USER_PROFILE_KEY = 'wallachUserProfile_v1';

/** Today's date as an ISO calendar day. One place so every writer stamps it the same way. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Read the persisted identity choice. `null` = never asked (show the veil).
 * A value that fails validation is treated as never-asked rather than trusted.
 */
export function loadUserProfile(): UserProfile | null {
  return getValidated(USER_PROFILE_KEY, UserProfileSchema);
}

/**
 * The chokepoint -- the ONE private writer of the profile key. Every named op below
 * delegates here. It verifies its own round-trip (setValidated) and NEVER reports
 * success on an unverified write, then emits `profile:changed` as its last line so
 * every identity/appearance slot repaints without the caller remembering to.
 */
function writeProfile(next: UserProfile): { ok: true } | { ok: false; reason: string } {
  const res = setValidated(USER_PROFILE_KEY, next, UserProfileSchema);
  if (!res.ok) {
    // A bounded input needs a rejection PATH, not just a bound. Map the
    // storage reason to something a person can act on.
    const reason = res.reason === 'quota-exceeded'
      ? 'There is not enough room left on this device to save that.'
      : 'That change could not be saved to this device.';
    return { ok: false, reason };
  }
  emit('profile:changed', { name: next.name ?? null, browsing: next.browsing });
  return { ok: true };
}

/** The current profile, or a fresh guest base when nothing is stored yet. */
function baseOrGuest(): UserProfile {
  return loadUserProfile() ?? { browsing: true, chosenAt: today() };
}

/**
 * Name writer -- the veil's entry point, and the profile console's "rename".
 *
 * Returns the same reject-with-reason shape as validateUserName so the caller can
 * SHOW the user why a name was refused. Preserves any existing avatar/appearance:
 * changing your name must not silently wipe your avatar or theme.
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
  const cur = loadUserProfile();
  const next: UserProfile = {
    ...(name !== undefined ? { name } : {}),
    browsing: input.browsing,
    chosenAt: today(),
    ...(cur?.avatar !== undefined ? { avatar: cur.avatar } : {}),
    ...(cur?.theme !== undefined ? { theme: cur.theme } : {}),
    ...(cur?.accent !== undefined ? { accent: cur.accent } : {}),
  };
  const res = writeProfile(next);
  if (!res.ok) {
    return { ok: false, reason: res.reason };
  }
  return { ok: true, profile: next };
}

/**
 * Choose an avatar: a bundled preset id ('generic-01', 'men-NN', 'women-NN') OR an
 * uploaded image as a data: URI. Pre-validated here so an oversized upload gets the
 * specific "too large" reason (the schema is the backstop; the UI downscales before it
 * ever gets here). Preserves name + appearance.
 */
export function setAvatar(avatar: string): { ok: true } | { ok: false; reason: string } {
  const parsed = AvatarSchema.safeParse(avatar);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues[0]?.message ?? 'That avatar cannot be used.' };
  }
  return writeProfile({ ...baseOrGuest(), avatar: parsed.data });
}

/**
 * Back to the auto avatar (the name initial): drop the avatar field, keep everything else.
 * Rebuilt without `avatar` rather than spread-then-delete so exactOptionalPropertyTypes stays happy.
 */
export function clearAvatar(): void {
  const cur = baseOrGuest();
  const next: UserProfile = {
    browsing: cur.browsing,
    chosenAt: cur.chosenAt,
    ...(cur.name !== undefined ? { name: cur.name } : {}),
    ...(cur.theme !== undefined ? { theme: cur.theme } : {}),
    ...(cur.accent !== undefined ? { accent: cur.accent } : {}),
  };
  writeProfile(next);
}

/** Switch theme (cream/dark). Style only, never function (design-language). */
export function setTheme(theme: ThemeId): { ok: true } | { ok: false; reason: string } {
  return writeProfile({ ...baseOrGuest(), theme });
}

/** Switch the primary accent colour. Style only. */
export function setAccent(accent: AccentId): { ok: true } | { ok: false; reason: string } {
  return writeProfile({ ...baseOrGuest(), accent });
}

/**
 * Reset identity: become a guest again (drop name + avatar), but KEEP appearance
 * (theme/accent are a separate preference) and KEEP the regimen (a different key
 * entirely). This is not a re-prompt: writing {browsing:true} means the veil stays
 * gone -- "guest" is still a made choice.
 */
export function resetIdentity(): void {
  const cur = loadUserProfile();
  const next: UserProfile = {
    browsing: true,
    chosenAt: today(),
    ...(cur?.theme !== undefined ? { theme: cur.theme } : {}),
    ...(cur?.accent !== undefined ? { accent: cur.accent } : {}),
  };
  writeProfile(next);
}

/**
 * The name to DISPLAY. A guest is never given a pseudo-name:
 *   slot 'profile'  -> "You"    (rail profile chip)
 *   slot 'brand'    -> "Codex"  (top-left, where a name would have gone)
 * A named user gets their own name in both. Kept here rather than in a view so the
 * two slots cannot drift apart (single source of truth).
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

/**
 * The browser-tab title. "Health Journey" is the app's name; the possessive derives from
 * the identity choice -- a named user gets "<Name>'s Health Journey"; a guest gets "Your
 * Health Journey". Kept here (not in a view) so the title derives from the same one place
 * as the brand + profile slots and cannot drift.
 */
export function displayTitle(profile: UserProfile | null): string {
  if (profile?.name !== undefined && profile.name !== '') {
    return `${profile.name}'s Health Journey`;
  }
  return 'Your Health Journey';
}

/* --- APPEARANCE derives -----------------------------------------------------
 * The <html data-theme data-accent> attributes are DOM, so main.ts applies them;
 * these pure derives are the single source of the defaults (cream / ember) so a
 * missing value in an old profile reads the same everywhere. */
export function themeOf(profile: UserProfile | null): ThemeId {
  return profile?.theme ?? 'cream';
}

export function accentOf(profile: UserProfile | null): AccentId {
  return profile?.accent ?? 'ember';
}

/** The URL for a bundled preset avatar. One place so the view + the rail agree.
 *  Layout: the single `generic-01` -> Generic.png; `men-NN`/`women-NN` -> Men|Women/NN.png. */
export function presetSrc(id: string): string {
  if (id === 'generic-01') {
    return 'assets/avatars/Generic.png';
  }
  const m = /^(men|women)-(\d{2})$/.exec(id);
  if (m !== null) {
    return `assets/avatars/${m[1] === 'men' ? 'Men' : 'Women'}/${m[2]}.png`;
  }
  return `assets/avatars/${id}.png`;
}

/**
 * The <img src> for the CURRENT avatar, or null when there is none (the caller
 * then draws the name initial). A preset resolves to its bundled PNG; an upload is
 * already a self-contained data: URI.
 */
export function avatarSrcOf(profile: UserProfile | null): string | null {
  const a = profile?.avatar;
  if (a === undefined || a === '') {
    return null;
  }
  if (a.startsWith('data:')) {
    return a;
  }
  // A retired/unknown preset id (an old aura/gem/world value) degrades to the default
  // initial rather than a broken image.
  return isPresetAvatar(a) ? presetSrc(a) : null;
}
