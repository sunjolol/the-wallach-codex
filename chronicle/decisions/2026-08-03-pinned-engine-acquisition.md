# Decision: the pinned engine is chosen LAST — deferred, with the research banked

_2026-08-03. The owner's ruling after the engine was acquired, measured, and then deliberately removed._

★ **STATUS: NOTHING IS INSTALLED.** `engine/` was downloaded, verified, measured, leak-tested, and
then **deleted** (428.9 MB) along with its 187.6 MB archive. Do not re-acquire it as part of routine
work. This file exists so the research never has to be repeated.

## The ruling
**The browser is a finishing touch, not a foundation.** It gets picked at the very end, chosen
against the features the dashboard actually ships — not chosen up front and then designed around.

The owner's reasons: it is clutter on the machine, clutter in GitHub, and it makes backups take
much longer. And the technical reason it is safe to defer: **Chromium is effectively unlimited for
our purposes**, so no design decision is waiting on this. Nothing we might build is at risk of being
unsupported.

**Preferred candidate when the time comes: Ungoogled Chromium, trimmed.** Not binding — the final
pick is made against the shipped feature set.

## Meanwhile: development and visual verification run in the owner's own live browser
There is no pinned engine to test against, so screenshots and visual sign-off happen in his everyday
browser. The `2026-08-03-pinned-engine.md` licence to use modern CSS directly still stands — it was
never contingent on the artifact existing.

---

# The banked research — do not repeat this

## The candidate, exactly
| | |
|---|---|
| build | Ungoogled Chromium `151.0.7922.71-1.1`, Windows x64 |
| asset | `ungoogled-chromium_151.0.7922.71-1.1_windows_x64.zip` |
| SHA-256 | `f49303e9b61aab632e399a12c36b72b184158e965b6d6373105f19f2e884fd6e` |
| download | 196,708,973 B (187.6 MB) |
| extracted | **436,216,729 B (416.0 MB)** — ✓measured, not estimated |
| source | `https://github.com/ungoogled-software/ungoogled-chromium-windows/releases/download/151.0.7922.71-1.1/ungoogled-chromium_151.0.7922.71-1.1_windows_x64.zip` |
| licence | BSD-3-Clause |

⚠ A newer release will exist by the time this is picked up. Re-derive the version and hash from the
release API; **never reuse the hash above for a different build.**

## Why this candidate, and why not the others
✓ **No updater exists.** Project FAQ: *"There is currently no built-in functionality for
auto-updates."* Nothing to disable.
✓ **De-Googled in the source, not in a settings menu.** Google domains are rewritten to a
non-existent `qjz9zk` domain **and blocked**; Google Host Detector, URL Tracker, Cloud Messaging,
Hotwording and Safe Browsing removed; binary blobs pruned; intranet redirect detector gone.

- **Thorium — rejected.** Its FAQ says it *"will never be completely de-googled"*; Google search,
  Sync and the Web Store stay enabled, it *"still connects to Google servers"*, and a **Chrome-style
  C++ auto-updater is in development**. That alone disqualifies it.
- **Tauri — rejected.** Ships no engine; on Windows it borrows Microsoft's WebView2. Evergreen mode
  means **Microsoft auto-updates the rendering engine on the user's machine** — the exact failure
  this project exists to prevent. Fixed Version mode freezes it but **adds ~180 MB**, erasing the
  size advantage entirely, while adding a Rust toolchain and a Microsoft dependency.
- **Electron — rejected**, and separately ruled out for good by
  `2026-08-03-file-protocol-is-sacred.md`.

## ★ The size question, settled with measurements
Taken from this machine, so these are real numbers, not vendor claims:

| Browser | On disk | Largest file |
|---|---|---|
| Firefox | 336.1 MB | `xul.dll` 166.6 MB |
| **Ungoogled Chromium** | **416.0 MB** | `chrome.dll` **284.4 MB** |
| Google Chrome | 478.5 MB | `chrome.dll` 275.7 MB |
| Microsoft Edge | 873.4 MB | `msedge.dll` 325.9 MB |

**Under 200 MB is unattainable for any modern engine.** `chrome.dll` alone is 284 MB; Firefox's
`xul.dll` + `omni.ja` is already 216 MB. Switching to Firefox saves ~80 MB before trimming and
roughly nothing after. Our candidate is already smaller than the Chrome installed on this machine.

**Trim plan (~77 MB, to ≈339 MB), for when it is acquired:**
- `locales/` — 50 files, 38.2 MB. Keep `en-US.pak` only.
- helper exes — `elevation_service`, `elevated_tracing_service`, `chrome_pwa_launcher`,
  `notification_helper`, `chrome_proxy` — ~16 MB, none used by a local file:// app.
- `dxcompiler.dll` — 24.4 MB, the WebGPU shader compiler. Only if nothing shipped needs WebGPU.
- ★ **KEEP `vk_swiftshader.dll` (5.2 MB)** — it is the fallback for machines with no working GPU.
  Dropping it trades real portability for 5 MB.

Trimming breaks equality with the published archive, so the pin must then cover the **installed
tree** (file count + total bytes + `chrome.exe` hash), keeping the archive SHA-256 only as a record
of provenance. A gate doing exactly that was written and negative-controlled against five planted
defects; it lives in git history at the commit that removed it, ready to restore.

## ★ The leak test — it ran, and it found one thing
`tools/engine_leak_test.py` is **kept**. It is the acceptance test for the eventual acquisition, and
it already earned its place.

**Result: one registry write. Everything else stayed inside the folder.**

Clean: no new `HKCU\Software` subkey · no `HKCU\Software\Classes` progID (no file-association write)
· no new `%LOCALAPPDATA%` or `%APPDATA%` folder · **`%LOCALAPPDATA%\Chromium` NOT created — the
Crashpad leak we feared did not occur** · `HKCU\Software\Google` 122 values byte-identical · profile
confined to `engine/profile`.

The write: **`HKCU\Software\Chromium\PreferenceMACs\Default`** — Chromium's Preference MAC store,
SHA-256 HMACs of Secure Preferences, tamper-detection compiled in since Chromium 25. No PII, no
telemetry, no documented flag to relocate it.

**★ LUNETH'S RULING (2026-08-03): ACCEPTED explicitly.** It is local integrity data, nothing leaves
the machine, and the alternative — scrubbing the key from the launcher — risks clobbering a
different Chromium's state on a machine that already has one. When the engine is acquired, this is
settled; do not re-open it, and do not build a scrub.

## ⚠ The methodological lesson, worth more than the engine
The **first** version of the leak test compared registry **subkey names** and printed
**`NO LEAKS DETECTED`**. That was a false negative: the key already existed, so a value written
*inside* it was invisible by construction. A follow-up check of that key's **timestamp** also missed
it, because registry last-write is per-key and the write had landed one level deeper.

Only a **value-level** diff caught it. Two instruments in a row returned a confident clean result
they were structurally incapable of producing otherwise.

The launch flags that were verified to work, for reuse:
`--user-data-dir=<folder>` · `--disable-machine-id` · `--disable-encryption` (the last two are
FAQ-documented; without them the profile is tied to the machine and not transplantable) ·
`--no-first-run` · `--no-default-browser-check` · `--disable-background-networking` · `--app=<url>`
for a chrome-less window.

## When this is picked up
1. Re-derive version + SHA-256 from the release API. Verify **before** extracting.
2. Extract to `engine/` — already in `.gitignore`, so git will not see it.
3. Trim per the plan above; regenerate the pin over the installed tree.
4. Restore the `pinned_engine_integrity` gate from git history.
5. Re-run `tools/engine_leak_test.py`. Expect the PreferenceMACs write; it is accepted.
6. Confirm by eye that the dashboard renders. A launch is not a visual check.
