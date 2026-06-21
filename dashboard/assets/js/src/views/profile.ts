/**
 * views/profile.ts — Profile panel (Creator's Log + Invariants + Build)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The panel that opens when Luneth clicks the rail profile chip. Surfaces
 * the §00 discipline audit trail:
 *
 *   - Creator's Log tab — every round close, invariant result, incident,
 *     and milestone, sourced live from `state/log.getEntries()`. No
 *     hardcoded entries: an empty LS reads as an empty panel.
 *   - Invariants tab — scoreboard derived from log entries of kind
 *     'invariant-pass' / 'invariant-fail'. Scaffold this round.
 *   - Build tab — last-build status. Scaffold this round.
 *
 * Visual chrome (cipher chips, dot pulses, scan-line) follows the same
 * language as coverage / regimen / scanner views.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { on } from '../core/events.js';
import {
  getEntries,
  getEntriesByKind,
  type LogEntry,
  type LogKind,
} from '../state/log.js';

export interface MountHandle {
  update: () => void;
  unmount: () => void;
}

type Tab = 'log' | 'invariants' | 'build';

// ─── Helpers ──────────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }[c] as string));
}

function formatTs(iso: string): string {
  // ISO is sortable; show "YYYY-MM-DD HH:MM" for readability.
  if (iso.length < 16) {
    return iso;
  }
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
}

function kindLabel(k: LogKind): string {
  const map: Record<LogKind, string> = {
    'session-start': 'SESSION START',
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
  return map[k];
}

function kindClass(k: LogKind): string {
  const map: Record<LogKind, string> = {
    'session-start': 'pf-pill pf-pill--neutral',
    'session-end': 'pf-pill pf-pill--neutral',
    'round-close': 'pf-pill pf-pill--ok',
    'build': 'pf-pill pf-pill--neutral',
    'invariant-pass': 'pf-pill pf-pill--ok',
    'invariant-fail': 'pf-pill pf-pill--err',
    'incident': 'pf-pill pf-pill--err',
    'milestone': 'pf-pill pf-pill--accent',
    'design-decision': 'pf-pill pf-pill--accent',
    'note': 'pf-pill pf-pill--neutral',
  };
  return map[k];
}

// ─── Tab: Creator's Log ───────────────────────────────────────────────────

function renderLogEntry(entry: LogEntry): string {
  const detailHTML = entry.detail !== undefined && entry.detail.length > 0
    ? `<div class="pf-log-entry__detail">${escHTML(entry.detail)}</div>`
    : '';
  return `
    <article class="pf-log-entry" data-log-id="${escHTML(entry.id)}">
      <header class="pf-log-entry__head">
        <span class="pf-log-entry__ts">${escHTML(formatTs(entry.ts))}</span>
        <span class="pf-log-entry__surface">${escHTML(entry.surface)}</span>
        <span class="${kindClass(entry.kind)}">${escHTML(kindLabel(entry.kind))}</span>
      </header>
      <h4 class="pf-log-entry__summary">${escHTML(entry.summary)}</h4>
      ${detailHTML}
    </article>
  `;
}

function renderLogEmpty(): string {
  return `
    <div class="pf-empty">
      <div class="pf-empty__mark">○</div>
      <h3 class="pf-empty__title">No log entries yet</h3>
      <p class="pf-empty__body">
        Round closes, invariant results, incidents, and milestones will appear here
        once <code>state/log.log()</code> is called from the §00 audit trail hooks.
      </p>
    </div>
  `;
}

function renderLogTab(): string {
  const entries = getEntries();
  if (entries.length === 0) {
    return renderLogEmpty();
  }
  return `<div class="pf-log-stream">${entries.map(renderLogEntry).join('')}</div>`;
}

// ─── Tab: Invariants ──────────────────────────────────────────────────────

function renderInvariantsTab(): string {
  const passes = getEntriesByKind('invariant-pass');
  const fails = getEntriesByKind('invariant-fail');
  const total = passes.length + fails.length;
  if (total === 0) {
    return `
      <div class="pf-empty">
        <div class="pf-empty__mark">○</div>
        <h3 class="pf-empty__title">No invariant runs recorded</h3>
        <p class="pf-empty__body">
          Run <code>python3 tools/invariants.py</code> and let the hook log to
          state/log to populate this scoreboard.
        </p>
      </div>
    `;
  }
  const passPct = total > 0 ? Math.round((passes.length / total) * 100) : 0;
  return `
    <div class="pf-inv-board">
      <div class="pf-inv-stat pf-inv-stat--ok">
        <div class="pf-inv-stat__num">${passes.length}</div>
        <div class="pf-inv-stat__label">passes</div>
      </div>
      <div class="pf-inv-stat pf-inv-stat--err">
        <div class="pf-inv-stat__num">${fails.length}</div>
        <div class="pf-inv-stat__label">failures</div>
      </div>
      <div class="pf-inv-stat">
        <div class="pf-inv-stat__num">${passPct}%</div>
        <div class="pf-inv-stat__label">pass rate</div>
      </div>
    </div>
  `;
}

// ─── Tab: Build ───────────────────────────────────────────────────────────

function renderBuildTab(): string {
  const lastBuild = getEntriesByKind('build')[0] ?? null;
  if (lastBuild === null) {
    return `
      <div class="pf-empty">
        <div class="pf-empty__mark">○</div>
        <h3 class="pf-empty__title">No build events recorded</h3>
        <p class="pf-empty__body">
          Build events appear here when <code>tools/build-dashboard.sh</code>
          logs a round.
        </p>
      </div>
    `;
  }
  return `
    <div class="pf-build-card">
      <div class="pf-build-card__ts">${escHTML(formatTs(lastBuild.ts))}</div>
      <h3 class="pf-build-card__summary">${escHTML(lastBuild.summary)}</h3>
      ${lastBuild.detail !== undefined ? `<pre class="pf-build-card__detail">${escHTML(lastBuild.detail)}</pre>` : ''}
    </div>
  `;
}

// ─── Shell ────────────────────────────────────────────────────────────────

function renderTabBody(tab: Tab): string {
  if (tab === 'log') {
    return renderLogTab();
  }
  if (tab === 'invariants') {
    return renderInvariantsTab();
  }
  return renderBuildTab();
}

function renderShell(tab: Tab, totalEntries: number): string {
  return `
    <div class="pf-panel" role="dialog" aria-label="Profile">
      <header class="pf-panel__head">
        <div class="pf-panel__title-block">
          <div class="pf-panel__eyebrow">
            <span class="pulse-dot"></span>PROFILE · <span class="ds-cipher" data-cipher-set="hexa">PF·0001</span>
          </div>
          <h2 class="pf-panel__title">Luneth <em>// creator</em></h2>
          <div class="pf-panel__sub">${totalEntries} entr${totalEntries === 1 ? 'y' : 'ies'} on file · Wallach discipline audit</div>
        </div>
        <button class="pf-panel__close" data-pf-action="close" aria-label="Close profile">✕</button>
      </header>
      <nav class="pf-tabs">
        <button class="pf-tab ${tab === 'log' ? 'pf-tab--active' : ''}" data-pf-tab="log">Creator's Log</button>
        <button class="pf-tab ${tab === 'invariants' ? 'pf-tab--active' : ''}" data-pf-tab="invariants">Invariants</button>
        <button class="pf-tab ${tab === 'build' ? 'pf-tab--active' : ''}" data-pf-tab="build">Build</button>
      </nav>
      <div class="pf-body">${renderTabBody(tab)}</div>
    </div>
  `;
}

// ─── Cipher engine (scoped) ───────────────────────────────────────────────

const CIPHER_SETS: Record<string, string> = {
  hexa: '0123456789ABCDEF',
  alphanum: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
};

let cipherInterval: number | null = null;
let cipherTick = 0;

function startCipherEngine(container: HTMLElement): void {
  if (cipherInterval !== null) {
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  cipherInterval = window.setInterval(() => {
    cipherTick += 1;
    const elements = Array.from(container.querySelectorAll<HTMLElement>('.ds-cipher'));
    for (const el of elements) {
      let original = el.dataset['cipherOriginal'];
      if (original === undefined) {
        original = el.textContent ?? '';
        el.dataset['cipherOriginal'] = original;
        const setKey = el.dataset['cipherSet'] ?? 'alphanum';
        el.dataset['cipherSetResolved'] = CIPHER_SETS[setKey] ?? CIPHER_SETS['alphanum'] ?? '';
      }
      const set = el.dataset['cipherSetResolved'] ?? '';
      if (cipherTick % 5 === 0) {
        el.textContent = original;
        continue;
      }
      if (original.length === 0 || set.length === 0) {
        continue;
      }
      const chars = original.split('');
      const i = Math.floor(Math.random() * chars.length);
      const charAt = chars[i];
      if (charAt === undefined) {
        continue;
      }
      if (!/[A-Z0-9·:]/i.test(charAt)) {
        continue;
      }
      const newChar = set[Math.floor(Math.random() * set.length)] ?? charAt;
      chars[i] = newChar;
      el.textContent = chars.join('');
    }
  }, 1000);
}

function stopCipherEngine(): void {
  if (cipherInterval !== null) {
    window.clearInterval(cipherInterval);
    cipherInterval = null;
  }
}

// ─── Mount ────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): MountHandle {
  let tab: Tab = 'log';

  const render = (): void => {
    container.innerHTML = renderShell(tab, getEntries().length);
  };

  const onClick = (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    const tabBtn = target.closest<HTMLElement>('[data-pf-tab]');
    if (tabBtn !== null) {
      const t = tabBtn.dataset['pfTab'] as Tab | undefined;
      if (t !== undefined) {
        tab = t;
        render();
      }
      return;
    }
    const actionBtn = target.closest<HTMLElement>('[data-pf-action]');
    if (actionBtn !== null && actionBtn.dataset['pfAction'] === 'close') {
      container.dispatchEvent(new CustomEvent('pf:close', { bubbles: true }));
    }
  };

  render();
  startCipherEngine(container);
  container.addEventListener('click', onClick);

  const unsubLog = on('log:entry-added', () => render());

  return {
    update: render,
    unmount: () => {
      unsubLog();
      stopCipherEngine();
      container.removeEventListener('click', onClick);
      container.innerHTML = '';
    },
  };
}
