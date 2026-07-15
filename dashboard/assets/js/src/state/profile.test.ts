/**
 * state/profile.test.ts -- the name field is the app's ONLY free-text input
 * ===========================================================================
 *
 * Luneth, 2026-07-15: "Protect the name input from code/script/hack attempts, ANY
 * sort of input makes me extremely cautious because I know this is one of the main
 * main ways hacks happen."
 *
 * These tests pin the HONEST threat model, in both directions -- what is defended
 * AND what is defended by something else. A security test that only shows green on
 * scary-looking strings teaches false confidence.
 *
 * The `<script>` cases below are the ones worth reading carefully: they are
 * expected to be ACCEPTED. That is not a hole. XSS is stopped by rendering through
 * `textContent` (main.ts::wireProfileIdentity), never by hoping a blocklist is
 * complete -- blocklists lose. If a future view interpolates a name into an
 * innerHTML template, THAT is the defect, and no amount of input sanitising here
 * would save it. Accepting "<script>" and drawing it as six literal characters is
 * the system working.
 * ===========================================================================
 */

import { describe, expect, it } from 'vitest';

import { USER_NAME_MAX, UserProfileSchema, validateUserName } from '../core/schemas/profile.js';

describe('validateUserName -- what it accepts', () => {
  it('accepts an ordinary name', () => {
    expect(validateUserName('Luneth')).toEqual({ ok: true, name: 'Luneth' });
  });

  it('trims surrounding whitespace rather than rejecting it', () => {
    expect(validateUserName('  Luneth  ')).toEqual({ ok: true, name: 'Luneth' });
  });

  it('accepts non-ASCII names -- this app is not English-only', () => {
    expect(validateUserName('Zoë')).toEqual({ ok: true, name: 'Zoë' });
    expect(validateUserName('大輔')).toEqual({ ok: true, name: '大輔' });
  });

  it('accepts a name at exactly the cap', () => {
    const at = 'a'.repeat(USER_NAME_MAX);
    expect(validateUserName(at)).toEqual({ ok: true, name: at });
  });

  it('ACCEPTS script-shaped text, on purpose', () => {
    // Not a hole. The defence is textContent at the render site, not a blocklist
    // here. Blocklists lose; escape-by-default does not. This is drawn as literal
    // characters, and pinning it stops a future author from "hardening" the wrong
    // layer and believing they fixed something.
    const r = validateUserName('<script>alert(1)</script>');
    expect(r.ok).toBe(true);
  });
});

describe('validateUserName -- what it rejects, with a REASON', () => {
  it('rejects a non-string (a devtools write, a corrupted LS value)', () => {
    expect(validateUserName(42).ok).toBe(false);
    expect(validateUserName(null).ok).toBe(false);
    expect(validateUserName({ toString: () => 'x' }).ok).toBe(false);
  });

  it('rejects empty and whitespace-only', () => {
    expect(validateUserName('').ok).toBe(false);
    expect(validateUserName('   ').ok).toBe(false);
  });

  it('rejects invisible-only names -- what cannot be seen cannot be consented to', () => {
    expect(validateUserName('\u200B\u200B').ok).toBe(false);
    expect(validateUserName('\u2060').ok).toBe(false);
  });

  it('rejects over the cap -- the real defence, and the only one with teeth', () => {
    // THE case. Unbounded input into an LS-backed field is a genuine self-inflicted
    // DoS: the quota is ~5 MB per origin, and blowing it corrupts the REGIMEN --
    // months of the user's data -- not merely their name.
    const huge = 'a'.repeat(USER_NAME_MAX + 1);
    const r = validateUserName(huge);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toContain(String(USER_NAME_MAX));
    }
  });

  it('rejects a megabyte paste outright', () => {
    expect(validateUserName('x'.repeat(1_000_000)).ok).toBe(false);
  });

  it('rejects control characters and newlines', () => {
    expect(validateUserName('Lu\u0000neth').ok).toBe(false);
    expect(validateUserName('Line\nTwo').ok).toBe(false);
    expect(validateUserName('tab\ther').ok).toBe(false);
  });

  it('rejects bidi overrides -- text that reads differently from its own bytes', () => {
    // U+202E flips rendering order: a display slot would show something other than
    // what is stored. In a UI that renders names verbatim that is a lie the user
    // cannot see.
    expect(validateUserName('\u202Egnahc').ok).toBe(false);
    expect(validateUserName('a\u2066b').ok).toBe(false);
  });

  it('always gives a reason -- never a silent drop (doctrine #1, #8)', () => {
    for (const bad of ['', 'x'.repeat(999), 'a\u0007b']) {
      const r = validateUserName(bad);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.reason.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('UserProfileSchema -- the persisted shape', () => {
  it('accepts a named profile', () => {
    const p = { name: 'Luneth', browsing: false, chosenAt: '2026-07-15' };
    expect(UserProfileSchema.safeParse(p).success).toBe(true);
  });

  it('accepts a browsing profile with no name', () => {
    const p = { browsing: true, chosenAt: '2026-07-15' };
    expect(UserProfileSchema.safeParse(p).success).toBe(true);
  });

  it('REJECTS a stored profile whose name is corrupt -- the read boundary', () => {
    // A hand-edited or corrupted LS value must not enter typed-land. loadUserProfile
    // returns null here and the user is asked once more: degrading to the ask is
    // safe, degrading to a half-parsed profile is not (#7 graceful degradation).
    const p = { name: 'x'.repeat(500), browsing: false, chosenAt: '2026-07-15' };
    expect(UserProfileSchema.safeParse(p).success).toBe(false);
  });

  it('rejects a profile missing its browsing flag', () => {
    expect(UserProfileSchema.safeParse({ name: 'L', chosenAt: '2026-07-15' }).success).toBe(false);
  });
});
