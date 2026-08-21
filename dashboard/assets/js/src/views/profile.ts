/**
 * views/profile.ts — the Profile console (identity + appearance + data)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The popup that opens from the rail profile chip. It lets the user:
 *   - set / change their NAME (the app's one free-text field; validated at the
 *     state chokepoint, rendered here via textContent/value — never innerHTML),
 *   - pick an AVATAR (a bundled offline preset, or an uploaded image that is
 *     downscaled to 256px before it is ever stored),
 *   - switch THEME (cream / charcoal) and the primary ACCENT colour — both
 *     apply APP-WIDE via <html data-theme data-accent> (main.ts is the single
 *     applier, on the profile:changed cascade),
 *   - own their DATA — export a JSON backup, import one, or reset to guest.
 *
 * Every mutation routes through a NAMED state op in state/profile.ts — the single
 * localStorage chokepoint; this view never writes localStorage itself. This panel, the
 * rail profile chip, and the <html data-theme data-accent> attributes stay in sync
 * because each op's last line emits profile:changed, and this view + main.ts both
 * subscribe.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { on } from '../core/events.js';
import { BACKUP_APP_ID, BackupEnvelopeSchema } from '../core/schemas/backup.js';
import { ACCENT_LABELS, ACCENTS } from '../core/schemas/profile.js';
import { restore, snapshot } from '../core/storage.js';
import { getEntries, type LogEntry, type LogKind } from '../state/log.js';
import {
  accentOf,
  avatarSrcOf,
  clearAvatar,
  displayInitial,
  loadUserProfile,
  presetSrc,
  resetIdentity,
  saveUserProfile,
  setAccent,
  setAvatar,
  setTheme,
  themeOf,
} from '../state/profile.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

/** The avatar families, in browse order. Three entries — the preset ids (generic-01,
 *  men-01 … women-12) are generated from count, so no >10-element list lives here. */
const FAMILIES: ReadonlyArray<{ id: string; count: number; label: string }> = [
  { id: 'generic', count: 1, label: 'Generic' },
  { id: 'men', count: 12, label: 'Men' },
  { id: 'women', count: 12, label: 'Women' },
];

/** The UI's tighter name bound; the schema's USER_NAME_MAX (40) is the backstop. */
const NAME_MAX = 24;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Every preset id, derived from the family counts (generic-01, men-01 … women-12). */
function presetIds(): string[] {
  const ids: string[] = [];
  for (const f of FAMILIES) {
    for (let i = 1; i <= f.count; i++) {
      ids.push(`${f.id}-${pad2(i)}`);
    }
  }
  return ids;
}

// ─── icons (inline SVG; stroke = currentColor) ──────────────────────────────
const IC = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 15V4M8 8l4-4 4 4"/><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M4.2 4.2l2 2M17.8 17.8l2 2M1 12h3M20 12h3M4.2 19.8l2-2M17.8 6.2l2-2"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 3v12M8 11l4 4 4-4"/><path d="M4 21h16"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 21V9M8 13l4-4 4 4"/><path d="M4 3h16"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
} as const;

// ─── Creator's Log ─────────────────────────────────────────────────────────
// The build/discipline audit trail renders inside this panel — collapsed by default
// so it never crowds the identity controls. The creators_log_bundle_synced invariant
// keeps the bundled log embed in step with the source log.
function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => (({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  })[c] as string));
}

function fmtTs(iso: string): string {
  return iso.length < 16 ? iso : `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

const LOG_LABEL: Record<LogKind, string> = {
  'session-start': 'SESSION',
  'session-end': 'SESSION END',
  'round-close': 'ROUND CLOSE',
  'build': 'BUILD',
  'invariant-pass': 'INVARIANT ✓',
  'invariant-fail': 'INVARIANT ✗',
  'incident': 'INCIDENT',
  'milestone': 'MILESTONE',
  'design-decision': 'DESIGN',
  'note': 'NOTE',
};

function logPill(k: LogKind): string {
  if (k === 'invariant-fail' || k === 'incident') {
    return 'pf-logentry__pill pf-logentry__pill--err';
  }
  if (k === 'invariant-pass' || k === 'round-close') {
    return 'pf-logentry__pill pf-logentry__pill--ok';
  }
  return 'pf-logentry__pill';
}

function renderLogEntry(e: LogEntry): string {
  const detail = e.detail !== undefined && e.detail.length > 0
    ? `<div class="pf-logentry__detail">${escHTML(e.detail)}</div>`
    : '';
  return `<article class="pf-logentry"><div class="pf-logentry__head"><span>${escHTML(fmtTs(e.ts))}</span><span>${escHTML(e.surface)}</span><span class="${logPill(e.kind)}">${escHTML(LOG_LABEL[e.kind])}</span></div><h4 class="pf-logentry__sum">${escHTML(e.summary)}</h4>${detail}</article>`;
}

function renderLog(): string {
  const entries = getEntries();
  if (entries.length === 0) {
    return '';
  }
  return `<details class="pf-log"><summary class="pf-log__sum">Creator's Log · <b>${entries.length}</b> entries</summary><div class="pf-log__stream">${entries.map(renderLogEntry).join('')}</div></details>`;
}

function shell(): string {
  const swatches = ACCENTS.map(id =>
    `<button class="pf-sw" data-accent="${id}" style="--sw: var(--acc-${id})" title="${ACCENT_LABELS[id]}" aria-label="${ACCENT_LABELS[id]}" aria-pressed="false" type="button"></button>`).join('');
  return `
    <div class="pf-panel" role="dialog" aria-modal="true" aria-label="Profile">
      <div class="pf-head">
        <div class="pf-eyebrow"><span class="dot"></span> Profile</div>
        <button class="ui-close pf-close" data-act="close" type="button" aria-label="Close profile"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>

      <div class="pf-scroll">
        <div class="pf-hero">
          <div class="pf-av">
            <span data-av-slot></span>
            <button class="pf-av__badge" data-act="upload" type="button" title="Upload a photo">${IC.plus}</button>
          </div>
          <div class="pf-nameblock">
            <div class="pf-namefield">
              <input class="pf-name" data-name type="text" maxlength="${NAME_MAX}" placeholder="Set your name" autocomplete="off" spellcheck="false" aria-label="Your name" aria-describedby="pfErr">
              <span class="pf-pencil">${IC.pencil}</span>
            </div>
            <div class="pf-namemeta">
              <span class="pf-status" data-status><i></i> Signed in</span>
              <span>·</span>
              <span class="pf-cnt" data-cnt>0/${NAME_MAX}</span>
            </div>
            <div class="pf-err" data-err id="pfErr" role="alert" aria-live="polite"></div>
          </div>
        </div>

        <div class="pf-body">
          <div class="pf-label"><b>Choose your avatar</b> · <span>${presetIds().length} graphics</span></div>
          <div class="pf-filters" data-filters>
            <button class="pf-fchip on" data-fam="all" type="button" aria-pressed="true">All</button>
            ${FAMILIES.map(f => `<button class="pf-fchip" data-fam="${f.id}" type="button" aria-pressed="false">${f.label}</button>`).join('')}
          </div>
          <div class="pf-grid" data-grid></div>

          <div class="pf-label"><b>Theme</b> · style only, never function</div>
          <div class="pf-appearance">
            <div class="pf-modeseg" data-modeseg>
              <button class="pf-modeb" data-mode="cream" type="button" aria-pressed="false">${IC.sun} Cream</button>
              <button class="pf-modeb" data-mode="dark" type="button" aria-pressed="false">${IC.moon} Charcoal</button>
            </div>
          </div>
          <div class="pf-swatches" data-swatches>${swatches}</div>

          <div class="pf-label"><b>Your data</b> · 100% on this device</div>
          <div class="pf-data">
            <button class="pf-dbtn" data-act="export" type="button">
              <span class="pf-dbtn__ico">${IC.down}</span>
              <span><span class="pf-dbtn__t">Export</span><span class="pf-dbtn__s">Save a .json backup</span></span>
            </button>
            <button class="pf-dbtn" data-act="import" type="button">
              <span class="pf-dbtn__ico">${IC.up}</span>
              <span><span class="pf-dbtn__t">Import</span><span class="pf-dbtn__s">Restore from .json</span></span>
            </button>
            <button class="pf-dbtn pf-dbtn--danger" data-act="reset" type="button">
              <span class="pf-dbtn__ico">${IC.trash}</span>
              <span><span class="pf-dbtn__t">Reset identity</span><span class="pf-dbtn__s">Back to guest — your regimen is kept</span></span>
            </button>
          </div>
          ${renderLog()}
        </div>
      </div>

      <div class="pf-foot">
        <button class="pf-ghost pf-hidden" data-act="close" data-guestbtn type="button">Continue as guest</button>
        <button class="pf-done" data-act="close" type="button">Done</button>
      </div>
      <input type="file" accept="image/png,image/jpeg,image/webp" data-upload-input class="pf-hidden">
      <input type="file" accept="application/json,.json" data-import-input class="pf-hidden">
    </div>
  `;
}

export function mount(container: HTMLElement): MountHandle {
  container.innerHTML = shell();

  const $ = <T extends HTMLElement>(sel: string): T | null => container.querySelector<T>(sel);
  const nameEl = $<HTMLInputElement>('[data-name]');
  const cntEl = $('[data-cnt]');
  const statusEl = $('[data-status]');
  const errEl = $('[data-err]');
  const gridEl = $('[data-grid]');
  const avSlot = $('[data-av-slot]');
  const uploadInput = $<HTMLInputElement>('[data-upload-input]');
  const importInput = $<HTMLInputElement>('[data-import-input]');
  const guestBtn = $('[data-guestbtn]');

  let fam = 'all';

  const showErr = (msg: string): void => {
    if (errEl !== null) {
      errEl.textContent = msg;
    }
  };
  const clearErr = (): void => {
    if (errEl !== null) {
      errEl.textContent = '';
    }
  };

  // ── hero avatar (image when chosen, else the name initial) ──
  const paintAvatar = (): void => {
    if (avSlot === null) {
      return;
    }
    const p = loadUserProfile();
    const src = avatarSrcOf(p);
    if (src !== null) {
      const img = document.createElement('img');
      img.className = 'pf-av__img';
      img.alt = 'Your avatar';
      img.src = src;
      avSlot.replaceChildren(img);
    }
    else {
      const mono = document.createElement('div');
      mono.className = 'pf-av__mono';
      mono.textContent = displayInitial(p); // textContent: the initial is user-derived
      avSlot.replaceChildren(mono);
    }
    // reflect selection in the grid
    const cur = p?.avatar ?? '';
    for (const t of container.querySelectorAll<HTMLElement>('.pf-tile[data-avatar]')) {
      const on = t.dataset['avatar'] === cur;
      t.classList.toggle('sel', on);
      t.setAttribute('aria-pressed', String(on));
    }
    const defTile = container.querySelector<HTMLElement>('.pf-tile--default');
    if (defTile !== null) {
      defTile.textContent = displayInitial(p); // stays in step with the name
      const defOn = src === null; // selected when there is no avatar
      defTile.classList.toggle('sel', defOn);
      defTile.setAttribute('aria-pressed', String(defOn));
    }
  };

  // ── name meta (counter + guest/signed-in) ──
  const paintNameMeta = (): void => {
    const v = nameEl?.value ?? '';
    const guest = v.trim() === '';
    if (cntEl !== null) {
      cntEl.textContent = `${v.length}/${NAME_MAX}`;
      cntEl.dataset['over'] = v.length >= NAME_MAX ? '1' : '0';
    }
    if (statusEl !== null) {
      statusEl.classList.toggle('pf-status--guest', guest);
      statusEl.innerHTML = `<i></i> ${guest ? 'Guest' : 'Signed in'}`;
    }
    // "Continue as guest" is only offered TO a guest — for a named user it would drop
    // their identity with no undo, so it is hidden until the name field is empty.
    if (guestBtn !== null) {
      guestBtn.classList.toggle('pf-hidden', !guest);
    }
  };

  // ── theme + accent selected states ──
  const paintAppearance = (): void => {
    const p = loadUserProfile();
    const theme = themeOf(p);
    const accent = accentOf(p);
    for (const b of container.querySelectorAll<HTMLElement>('.pf-modeb')) {
      const on = b.dataset['mode'] === theme;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    for (const s of container.querySelectorAll<HTMLElement>('.pf-sw')) {
      const on = s.dataset['accent'] === accent;
      s.classList.toggle('on', on);
      s.setAttribute('aria-pressed', String(on));
    }
  };

  // ── avatar grid ──
  const renderGrid = (): void => {
    if (gridEl === null) {
      return;
    }
    const frag = document.createDocumentFragment();
    // Upload leads the grid — the primary action is always first.
    const up = document.createElement('button');
    up.className = 'pf-tile pf-tile--up';
    up.type = 'button';
    up.title = 'Upload a photo';
    up.dataset['act'] = 'upload';
    up.setAttribute('aria-label', 'Upload a photo');
    up.innerHTML = IC.upload;
    frag.appendChild(up);
    // Default (your initial) — the way back to the auto avatar, right after Upload.
    const def = document.createElement('button');
    def.className = 'pf-tile pf-tile--default';
    def.type = 'button';
    def.dataset['default'] = '1';
    def.title = 'Default — your initial';
    frag.appendChild(def);
    for (const id of presetIds()) {
      if (fam !== 'all' && !id.startsWith(`${fam}-`)) {
        continue;
      }
      const b = document.createElement('button');
      b.className = 'pf-tile';
      b.type = 'button';
      b.dataset['avatar'] = id;
      const famId = id.split('-')[0] ?? id;
      const famLabel = FAMILIES.find(f => f.id === famId)?.label ?? famId;
      b.setAttribute('aria-label', famId === 'generic' ? 'Generic avatar' : `${famLabel} avatar ${Number(id.split('-')[1] ?? '0')}`);
      b.setAttribute('aria-pressed', 'false');
      const img = document.createElement('img');
      img.className = 'pf-tile__img';
      img.loading = 'lazy';
      img.alt = '';
      img.src = presetSrc(id);
      b.appendChild(img);
      frag.appendChild(b);
    }
    gridEl.replaceChildren(frag);
    paintAvatar(); // re-mark selection
  };

  // ── upload → downscale to 256px → store as data URI ──
  const handleFile = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (): void => {
      const img = new Image();
      img.onload = (): void => {
        const S = 256;
        const canvas = document.createElement('canvas');
        canvas.width = S;
        canvas.height = S;
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
          showErr('This device could not process that image.');
          return;
        }
        const scale = Math.max(S / img.width, S / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
        const dataUri = canvas.toDataURL('image/png');
        const res = setAvatar(dataUri);
        if (!res.ok) {
          showErr(res.reason);
        }
        else {
          clearErr();
        }
      };
      img.onerror = (): void => showErr('That image could not be read.');
      img.src = String(reader.result);
    };
    reader.onerror = (): void => showErr('That file could not be read.');
    reader.readAsDataURL(file);
  };

  const doExport = (): void => {
    const env = {
      app: BACKUP_APP_ID,
      version: 1,
      exportedAt: new Date().toISOString(),
      data: snapshot(),
    };
    const blob = new Blob([JSON.stringify(env, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallach-codex-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (): void => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(reader.result));
      }
      catch {
        showErr('That file is not valid JSON.');
        return;
      }
      const env = BackupEnvelopeSchema.safeParse(parsed);
      if (!env.success) {
        showErr('That is not a Codex backup file.');
        return;
      }
      const res = restore(env.data.data);
      if (res.skipped > 0) {
        // A partial write (most likely the ~5MB device quota) must NOT masquerade as a clean
        // restore: surface it (the .pf-err region is an aria-live alert) and stay put rather
        // than reloading into a half-applied state.
        showErr(`Import incomplete — ${res.skipped} item(s) could not be saved; this device may be out of room. ${res.restored} restored.`);
        return;
      }
      // Many keys changed at once; a reload is the honest way to re-read every
      // surface through its own schema rather than hand-repaint each.
      window.location.reload();
    };
    reader.onerror = (): void => showErr('That file could not be read.');
    reader.readAsText(file);
  };

  // ── name commit ──
  const commitName = (): void => {
    const raw = nameEl?.value.trim() ?? '';
    const res = raw === ''
      ? saveUserProfile({ browsing: true }) // blanked → guest, keeps avatar/appearance
      : saveUserProfile({ name: raw, browsing: false });
    if (!res.ok) {
      showErr(res.reason);
    }
    else {
      clearErr();
    }
  };

  // ── event delegation ──
  const onClick = (ev: Event): void => {
    const t = ev.target as HTMLElement | null;
    if (t === null) {
      return;
    }
    if (t.closest('.pf-tile--default') !== null) {
      clearAvatar(); // back to the auto avatar (the name initial)
      clearErr();
      return;
    }
    const tile = t.closest<HTMLElement>('.pf-tile[data-avatar]');
    if (tile !== null) {
      const id = tile.dataset['avatar'];
      if (id !== undefined) {
        const res = setAvatar(id);
        if (!res.ok) {
          showErr(res.reason);
        }
        else {
          clearErr();
        }
      }
      return;
    }
    const fchip = t.closest<HTMLElement>('.pf-fchip');
    if (fchip !== null) {
      fam = fchip.dataset['fam'] ?? 'all';
      for (const c of container.querySelectorAll<HTMLElement>('.pf-fchip')) {
        const on = c === fchip;
        c.classList.toggle('on', on);
        c.setAttribute('aria-pressed', String(on));
      }
      renderGrid();
      return;
    }
    const modeb = t.closest<HTMLElement>('.pf-modeb');
    if (modeb !== null) {
      const m = modeb.dataset['mode'];
      if (m === 'cream' || m === 'dark') {
        setTheme(m);
      }
      return;
    }
    const sw = t.closest<HTMLElement>('.pf-sw');
    if (sw !== null) {
      const a = sw.dataset['accent'];
      if (a !== undefined && (ACCENTS as readonly string[]).includes(a)) {
        setAccent(a as (typeof ACCENTS)[number]);
      }
      return;
    }
    const act = t.closest<HTMLElement>('[data-act]')?.dataset['act'];
    if (act === 'close') {
      container.dispatchEvent(new CustomEvent('pf:close', { bubbles: true }));
    }
    else if (act === 'upload') {
      uploadInput?.click();
    }
    else if (act === 'export') {
      doExport();
    }
    else if (act === 'import') {
      importInput?.click();
    }
    else if (act === 'reset') {
      resetIdentity();
    }
  };

  // ── initial paint ──
  const paintAll = (): void => {
    if (nameEl !== null) {
      const p = loadUserProfile();
      // .value assignment, never innerHTML: the input renders the name as text.
      nameEl.value = p?.name ?? '';
    }
    paintNameMeta();
    paintAvatar();
    paintAppearance();
  };

  renderGrid();
  paintAll();

  container.addEventListener('click', onClick);
  nameEl?.addEventListener('input', () => {
    clearErr();
    paintNameMeta();
  });
  nameEl?.addEventListener('change', commitName);
  nameEl?.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      nameEl.blur();
    }
  });
  uploadInput?.addEventListener('change', () => {
    const f = uploadInput.files?.[0];
    if (f !== undefined) {
      handleFile(f);
    }
    uploadInput.value = '';
  });
  importInput?.addEventListener('change', () => {
    const f = importInput.files?.[0];
    if (f !== undefined) {
      handleImport(f);
    }
    importInput.value = '';
  });

  // Repaint on any profile change (e.g. reset, or a cross-tab write). The console
  // is the mutator while open, but re-reading state keeps every slot honest.
  const unsub = on('profile:changed', () => {
    if (nameEl !== null && document.activeElement !== nameEl) {
      nameEl.value = loadUserProfile()?.name ?? '';
    }
    paintNameMeta();
    paintAvatar();
    paintAppearance();
  });

  return {
    update: paintAll,
    unmount: (): void => {
      // Esc/close removes the DOM with no native blur, so a typed-but-uncommitted
      // name would be lost. Blur first — the change handler then commits only a real edit.
      nameEl?.blur();
      unsub();
      container.removeEventListener('click', onClick);
      container.innerHTML = '';
    },
  };
}
