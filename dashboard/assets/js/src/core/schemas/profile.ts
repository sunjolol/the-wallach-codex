/**
 * core/schemas/profile.ts -- the user's display name, bounded and validated
 * ===========================================================================
 *
 * WHY THIS IS ITS OWN SCHEMA AND NOT `z.string()`. Luneth, 2026-07-15:
 * "Protect the name input from code/script/hack attempts, ANY sort of input
 * makes me extremely cautious because I know this is one of the main main ways
 * hacks happen." He is right, and this is the ONLY free-text field in the whole
 * app -- everything else a user can enter is a number or a pick from a list. One
 * field is a small attack surface, not a zero one, and it is the field whose
 * value gets painted into the topbar, the profile tab, and an avatar initial.
 *
 * THE HONEST THREAT MODEL, stated so nobody over- or under-builds against it:
 *
 * 1. XSS is ALREADY structurally prevented -- and NOT by this file. Views render
 *    the name via `textContent`, never `innerHTML` (engineering-doctrine #5:
 *    escape by default). A `<script>` typed into the field is drawn as the
 *    literal characters. That is the real defence and it must stay: if a future
 *    view interpolates a name into an innerHTML template, this schema will not
 *    save it. Sanitising input is a SECOND layer, never the first.
 * 2. There is no server, no database, no eval, no innerHTML sink, and no other
 *    user. The classic injection targets (SQLi, stored-XSS-to-another-user,
 *    template injection) have no target here BY ARCHITECTURE, not by luck. Saying
 *    so plainly matters: a threat model that claims to stop everything is one
 *    nobody can check.
 * 3. What IS real, and what this file actually defends:
 *    - UNBOUNDED INPUT (engineering-doctrine #8) -- the one with teeth. A large
 *      paste into an LS-backed field is a genuine self-inflicted DoS: the quota
 *      is ~5 MB per origin, and blowing it corrupts the user's REGIMEN, i.e.
 *      months of their data, not merely their name.
 *    - CONTROL CHARACTERS + BIDI OVERRIDES (U+202E and friends) that let a
 *      display string read differently from its own bytes in a UI that renders
 *      it verbatim.
 *    - NEWLINES breaking a single-line chrome slot.
 *    - ZERO-WIDTH padding used to fake a visible name.
 *
 * So: bounded, single-line, no control characters, trimmed, with an EXPLICIT
 * REJECTION PATH -- never a silent truncation. A silently-truncated name is a
 * silent failure, which principle #1 forbids. The cap is deliberately LOOSER
 * than the UI's maxlength so the UI stays the tighter rule and this stays a
 * backstop rather than a duplicate of it (single source of truth, #3).
 * ===========================================================================
 */

import { z } from 'zod';

/**
 * Hard ceiling. The UI's maxlength should be TIGHTER; this is the backstop that
 * catches a paste, a devtools write, or a corrupted LS value -- not the UX rule.
 */
export const USER_NAME_MAX = 40;

/**
 * Characters that must never reach a display slot: C0/C1 controls (newlines
 * included), and the Unicode bidi overrides (U+202A-U+202E, U+2066-U+2069) that
 * can make rendered text read differently from its own bytes.
 */
// eslint-disable-next-line no-control-regex
const FORBIDDEN_CHARS = /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/;

/**
 * Zero-width + invisible padding: it cannot be seen, so it cannot be consented to.
 * (U+FEFF is deliberately absent -- it is already inside \s, and a duplicate inside a
 * character class hides whether the author meant a second thing.)
 */
const INVISIBLE_ONLY = /^[\s\u200B-\u200D\u2060]*$/;

/**
 * The user's chosen display name.
 *
 * REJECTS (never silently repairs -- a silent repair teaches the user their input
 * was accepted when it was actually changed):
 *   - empty / whitespace-only / invisible-only
 *   - longer than USER_NAME_MAX
 *   - any control character or bidi override
 */
export const UserNameSchema = z
  .string()
  .transform(s => s.trim())
  .refine(s => !INVISIBLE_ONLY.test(s), {
    message: 'A name needs at least one visible character.',
  })
  .refine(s => s.length <= USER_NAME_MAX, {
    message: `A name can be at most ${USER_NAME_MAX} characters.`,
  })
  .refine(s => !FORBIDDEN_CHARS.test(s), {
    message: 'A name cannot contain control characters.',
  });

/** What is persisted. Versioned so a future shape change is a migration, not a surprise. */
export const UserProfileSchema = z.object({
  /** Absent = the user chose "just browsing". Present = they named themselves. */
  name: UserNameSchema.optional(),
  /** True when the user explicitly picked browsing -- distinct from "not asked yet". */
  browsing: z.boolean(),
  /** ISO date the choice was made. */
  chosenAt: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Validate a candidate name at the INPUT boundary, before it is stored or drawn.
 *
 * Returns the trimmed name, or a REASON. Callers MUST surface the reason to the
 * user rather than dropping the value: a bounded input needs a rejection PATH
 * (engineering-doctrine #8), not merely a bound.
 */
export function validateUserName(
  raw: unknown,
): { ok: true; name: string } | { ok: false; reason: string } {
  if (typeof raw !== 'string') {
    return { ok: false, reason: 'A name must be text.' };
  }
  const parsed = UserNameSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues[0]?.message ?? 'That name cannot be used.' };
  }
  return { ok: true, name: parsed.data };
}
