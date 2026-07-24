/**
 * views/journey.ts — Journey drawer (overlay)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Slide-in-from-left overlay drawer (mirrors views/knowledge.ts). Renders 4
 * tabs: Timeline / Goals / Check-ins / Milestones. Reads from state/journey.ts
 * (events + private check-ins + cross-ref) and state/goals.ts (goals +
 * milestones). All data crosses the Zod boundary in the state layer; this view
 * holds no canonical literals.
 *
 * The footer LOG EVENT action + the Check-ins quick-entry are the two mutation
 * hooks — each opens a small inline form that calls state/journey.logEvent() /
 * logCheckin(). Those chokepoints emit `journey:changed`, which re-renders.
 *
 * Self-namespaced `jd-*` classes (parallel to Knowledge's `kd-*`). Visual
 * styling is a Round-6 polish concern; this view ships the functional DOM.
 *
 * Keyboard mount/toggle (rail "J", Esc, bare-J) is wired by the shared K+J
 * drawer helper in J3 — not here.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { on as onEvent } from '../core/events.js';
import { type EventKind, EventKindSchema, type JourneyEvent } from '../core/schemas/index.js';
import { listGoals, listMilestones } from '../state/goals.js';
import { crossRefForCheckin, listCheckins, listEvents, logCheckin, logEvent } from '../state/journey.js';

export interface DrawerHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleExpanded: () => void;
  isOpen: () => boolean;
}

type Tab = 'timeline' | 'goals' | 'checkins' | 'milestones';
type FormMode = 'event' | 'checkin' | null;

interface DayGroup {
  stamp: string;
  events: JourneyEvent[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Render helpers ────────────────────────────────────────────────────────

function escHTML(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string));
}

function hexSerial(seed: number): string {
  return ((seed * 0x9E3779B9) >>> 0).toString(16).toUpperCase().padStart(4, '0').slice(0, 4);
}

/** Relative "Xs/m/h/d AGO" for a timeline timestamp. Empty on unparseable. */
function relTime(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    return '';
  }
  const sec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (sec < 60) {
    return `${sec}S AGO`;
  }
  const min = Math.round(sec / 60);
  if (min < 60) {
    return `${min}M AGO`;
  }
  const hr = Math.round(min / 60);
  if (hr < 24) {
    return `${hr}H AGO`;
  }
  return `${Math.round(hr / 24)}D AGO`;
}

/** Calendar-day bucket key for grouping the timeline. */
function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso.slice(0, 10);
  }
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Day-stamp label, e.g. "TODAY · SAT JUN·21". Uses locale to avoid literals. */
function dayStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  const startOfDay = (x: Date): number => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(d)) / DAY_MS);
  const wd = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const mo = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const base = `${wd} ${mo}·${String(d.getDate()).padStart(2, '0')}`;
  if (diffDays === 0) {
    return `TODAY · ${base}`;
  }
  if (diffDays === 1) {
    return `YESTERDAY · ${base}`;
  }
  if (diffDays > 1 && diffDays < 7) {
    return `THIS WEEK · ${base}`;
  }
  return base;
}

/** Symptom/wellness word for a 1..5 severity. */
function sevWord(n: number): string {
  switch (n) {
    case 1: return 'MINIMAL';
    case 2: return 'MILD';
    case 3: return 'MODERATE';
    case 4: return 'STRONG';
    case 5: return 'PEAK';
    default: return '—';
  }
}

/** Glyph + modifier class + label for a timeline event kind. */
function kindMeta(kind: EventKind): { glyph: string; cls: string; label: string } {
  switch (kind) {
    case 'scan': return { glyph: '⌖', cls: 'jd-tl-event--scan', label: 'SCAN' };
    case 'regimen': return { glyph: '▤', cls: 'jd-tl-event--regimen', label: 'REGIMEN' };
    case 'coverage': return { glyph: '◉', cls: 'jd-tl-event--coverage', label: 'COVERAGE' };
    case 'symptom': return { glyph: '!', cls: 'jd-tl-event--symptom', label: 'SYMPTOM' };
    case 'milestone': return { glyph: '✦', cls: 'jd-tl-event--milestone', label: 'MILESTONE' };
  }
}

/** Group newest-first events into calendar-day buckets, order preserved. */
function groupByDay(events: JourneyEvent[]): DayGroup[] {
  const groups: DayGroup[] = [];
  const byKey = new Map<string, DayGroup>();
  for (const ev of events) {
    const key = dayKey(ev.occurredAt);
    let group = byKey.get(key);
    if (group === undefined) {
      group = { stamp: dayStamp(ev.occurredAt), events: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.events.push(ev);
  }
  return groups;
}

/** Five severity pips, first `severity` filled. */
function renderPips(severity: number): string {
  const fill = severity >= 4 ? 'fill-ok' : 'fill-warn';
  let out = '';
  for (let i = 1; i <= 5; i++) {
    out += `<span class="jd-sev-pip${i <= severity ? ` ${fill}` : ''}"></span>`;
  }
  return out;
}

// ─── Tab renderers ─────────────────────────────────────────────────────────

function renderTimeline(): string {
  const events = listEvents();
  if (events.length === 0) {
    return '<div class="jd-empty">— no events yet · scans, regimen edits, and coverage jumps land here —</div>';
  }
  const days = groupByDay(events).map(g => `
    <div class="jd-tl-day">
      <div class="jd-tl-day__stamp">${escHTML(g.stamp)}</div>
      ${g.events.map((ev) => {
        const m = kindMeta(ev.kind);
        const hasDetail = ev.detail !== undefined && ev.detail.length > 0;
        const hasDelta = ev.delta !== undefined && ev.delta.length > 0;
        return `
        <div class="jd-tl-event ${m.cls}">
          <div class="jd-tl-event__glyph">${escHTML(m.glyph)}</div>
          <div class="jd-tl-event__body">
            <div class="jd-tl-event__meta"><span class="jd-tl-event__kind">${escHTML(m.label)}</span> · ${escHTML(relTime(ev.occurredAt))}</div>
            <h4 class="jd-tl-event__title">${escHTML(ev.title)}</h4>
            ${hasDetail ? `<div class="jd-tl-event__detail">${escHTML(ev.detail)}</div>` : ''}
            ${hasDelta ? `<span class="jd-tl-event__delta">${escHTML(ev.delta)}</span>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');
  return `<div class="jd-timeline">${days}</div>`;
}

function renderGoals(): string {
  const goals = listGoals();
  if (goals.length === 0) {
    return '<div class="jd-empty">— no active goals yet —</div>';
  }
  return goals.map((g) => {
    const pct = Math.max(0, Math.min(100, Math.round(g.progress * 100)));
    const unit = g.unit ?? 'done';
    const blockerList = g.blockers ?? [];
    const blockers = blockerList.length > 0
      ? `<div class="jd-goal__blockers">BLOCKED BY · ${blockerList.map(b => `<span class="jd-goal__chip">${escHTML(b)}</span>`).join('')}</div>`
      : '';
    return `
    <div class="jd-goal${g.featured === true ? ' featured' : ''}">
      <header class="jd-goal__head">
        <div>
          <div class="jd-goal__id">GOAL · <span class="ds-cipher" data-cipher-set="hexa">G·${hexSerial(g.goalId.length * 7)}</span>${g.featured === true ? ' · FEATURED' : ''}</div>
          <h4 class="jd-goal__title">${escHTML(g.title)}</h4>
        </div>
        <div class="jd-goal__due">DUE<strong>${escHTML(g.targetDate)}</strong></div>
      </header>
      <div class="jd-goal__progress">
        <span class="jd-goal__pct">${pct}<small>%</small></span>
        <span class="jd-goal__counts"><strong>${escHTML(g.numerator)}</strong> / ${escHTML(g.denominator)} ${escHTML(unit)}</span>
      </div>
      <div class="jd-goal__bar"><div class="jd-goal__bar-fill" style="width: ${pct}%;"></div></div>
      ${blockers}
    </div>`;
  }).join('');
}

function renderCheckins(): string {
  const entry = `
    <button class="jd-checkin-entry" data-jd-action="quick-checkin">
      <span class="jd-checkin-entry__glyph">+</span> QUICK CHECK-IN — HOW ARE YOU FEELING?
      <span class="jd-checkin-entry__spacer"></span>
      <span class="jd-checkin-entry__kbd">⌘.</span>
    </button>`;
  const checkins = listCheckins();
  if (checkins.length === 0) {
    return `${entry}<div class="jd-empty">— no check-ins yet · they stay private on this device —</div>`;
  }
  const cards = checkins.map((c) => {
    const d = new Date(c.loggedAt);
    const valid = !Number.isNaN(d.getTime());
    const day = valid ? String(d.getDate()) : '··';
    const mo = valid ? d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
    const tags = c.tags.length > 0
      ? `<div class="jd-checkin__tags">${c.tags.map(t => `<span class="jd-checkin__tag">${escHTML(t)}</span>`).join('')}</div>`
      : '';
    const top = crossRefForCheckin(c)[0];
    const xrefHTML = top !== undefined
      ? `<div class="jd-checkin__xref">CROSS-REF · <strong>${escHTML(top.title)}</strong></div>`
      : '';
    return `
    <div class="jd-checkin">
      <div class="jd-checkin__date">
        <div class="jd-checkin__date-day">${escHTML(day)}</div>
        <div class="jd-checkin__date-mo">${escHTML(mo)}</div>
      </div>
      <div class="jd-checkin__body">
        <div class="jd-checkin__row">
          <div class="jd-checkin__severity">${renderPips(c.severity)}</div>
          <span class="jd-checkin__sev"><strong>${c.severity} / 5</strong> · ${escHTML(sevWord(c.severity))}</span>
        </div>
        ${c.note.length > 0 ? `<p class="jd-checkin__note">${escHTML(c.note)}</p>` : ''}
        ${tags}
        ${xrefHTML}
      </div>
    </div>`;
  }).join('');
  return entry + cards;
}

function renderMilestones(): string {
  const milestones = listMilestones();
  if (milestones.length === 0) {
    return '<div class="jd-empty">— no milestones yet · earned automatically as coverage doctrine is met —</div>';
  }
  return milestones.map((m) => {
    const locked = m.earnedAt === null;
    const fresh = !locked && (Date.now() - Date.parse(m.earnedAt ?? '')) < DAY_MS;
    const cls = locked ? ' locked' : fresh ? ' fresh' : '';
    const hasProgress = m.numerator !== undefined && m.denominator !== undefined;
    const earnedLine = locked
      ? (hasProgress ? `PROGRESS · ${escHTML(m.numerator)} / ${escHTML(m.denominator)}` : 'LOCKED')
      : `EARNED · ${escHTML(relTime(m.earnedAt ?? ''))}`;
    const tag = locked ? ' · LOCKED' : fresh ? ' · JUST EARNED' : '';
    return `
    <div class="jd-milestone${cls}">
      <div class="jd-milestone__badge">${escHTML(m.badge)}</div>
      <div class="jd-milestone__body">
        <div class="jd-milestone__id">${escHTML(m.milestoneId)}${tag}</div>
        <h4 class="jd-milestone__title">${escHTML(m.title)}</h4>
        <div class="jd-milestone__doctrine">DOCTRINE · <strong>${escHTML(m.doctrineRef)}</strong></div>
        <div class="jd-milestone__earned">${earnedLine}</div>
      </div>
    </div>`;
  }).join('');
}

function renderTab(tab: Tab): string {
  switch (tab) {
    case 'timeline': return renderTimeline();
    case 'goals': return renderGoals();
    case 'checkins': return renderCheckins();
    case 'milestones': return renderMilestones();
  }
}

// ─── Inline forms (the two mutation hooks) ─────────────────────────────────

function renderEventForm(): string {
  return `
    <div class="jd-form" data-jd-form="event">
      <div class="jd-form__title">LOG EVENT</div>
      <label class="jd-form__row">
        <span class="jd-form__label">KIND</span>
        <select class="jd-form__input" data-jd-field="kind">
          <option value="regimen">Regimen</option>
          <option value="scan">Scan</option>
          <option value="coverage">Coverage</option>
          <option value="symptom">Symptom</option>
          <option value="milestone">Milestone</option>
        </select>
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">TITLE</span>
        <input class="jd-form__input" data-jd-field="title" type="text" maxlength="200" placeholder="What happened?" />
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">DETAIL</span>
        <input class="jd-form__input" data-jd-field="detail" type="text" maxlength="2000" placeholder="Optional context" />
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">DELTA</span>
        <input class="jd-form__input" data-jd-field="delta" type="text" maxlength="80" placeholder="e.g. +35 trace" />
      </label>
      <div class="jd-form__err" data-jd-field="err"></div>
      <div class="jd-form__actions">
        <button class="jd-action jd-action--primary" data-jd-action="event-save">SAVE</button>
        <button class="jd-action" data-jd-action="form-cancel">CANCEL</button>
      </div>
    </div>`;
}

function renderCheckinForm(): string {
  return `
    <div class="jd-form" data-jd-form="checkin">
      <div class="jd-form__title">QUICK CHECK-IN</div>
      <label class="jd-form__row">
        <span class="jd-form__label">FEELING</span>
        <select class="jd-form__input" data-jd-field="severity">
          <option value="5">5 · Peak</option>
          <option value="4">4 · Strong</option>
          <option value="3" selected>3 · Moderate</option>
          <option value="2">2 · Mild</option>
          <option value="1">1 · Minimal</option>
        </select>
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">NOTE</span>
        <textarea class="jd-form__input jd-form__input--area" data-jd-field="note" maxlength="2000" placeholder="How are you feeling?"></textarea>
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">TAGS</span>
        <input class="jd-form__input" data-jd-field="tags" type="text" maxlength="200" placeholder="comma,separated" />
      </label>
      <div class="jd-form__err" data-jd-field="err"></div>
      <div class="jd-form__actions">
        <button class="jd-action jd-action--primary" data-jd-action="checkin-save">SAVE</button>
        <button class="jd-action" data-jd-action="form-cancel">CANCEL</button>
      </div>
    </div>`;
}

// ─── Shell ─────────────────────────────────────────────────────────────────

function renderShell(activeTab: Tab, formMode: FormMode): string {
  const events = listEvents();
  const goals = listGoals();
  const checkins = listCheckins();
  const milestones = listMilestones();
  const earned = milestones.filter(m => m.earnedAt !== null).length;
  const tabs: { id: Tab; label: string; count: string }[] = [
    { id: 'timeline', label: 'Timeline', count: `${events.length} EVENTS` },
    { id: 'goals', label: 'Goals', count: `${goals.length} ACTIVE` },
    { id: 'checkins', label: 'Check-ins', count: `${checkins.length} LOGGED` },
    { id: 'milestones', label: 'Milestones', count: `${earned} / ${milestones.length}` },
  ];
  const tabsHTML = tabs.map(t => `
    <button class="jd-tab${t.id === activeTab ? ' active' : ''}" data-jd-tab="${t.id}">
      <span>${escHTML(t.label)}</span>
      <span class="jd-tab__count">${escHTML(t.count)}</span>
    </button>`).join('');

  let formHTML = '';
  if (formMode === 'event') {
    formHTML = renderEventForm();
  }
  else if (formMode === 'checkin') {
    formHTML = renderCheckinForm();
  }

  return `
    <header class="jd-head">
      <div>
        <div class="jd-eyebrow"><span class="pulse-dot"></span>DRAWER · <span class="ds-cipher" data-cipher-set="hexa">JN·${hexSerial(activeTab.length * 7)}</span></div>
        <h2 class="jd-title">Journey</h2>
        <div class="jd-sub">// timeline · goals · check-ins · milestones</div>
      </div>
      <button class="jd-close" data-jd-action="close" title="Close (Esc)">×</button>
    </header>
    <div class="jd-tabs">${tabsHTML}</div>
    <div class="jd-search">
      <span class="jd-search-icon">⌕</span>
      <input class="jd-search-input" type="text" placeholder="SEARCH ${escHTML(activeTab.toUpperCase())}…" />
      <span class="jd-search-kbd">/</span>
    </div>
    <div class="jd-body">${formHTML}${renderTab(activeTab)}</div>
    <footer class="jd-footer">
      <button class="jd-action jd-action--primary" data-jd-action="log-event"><span class="jd-action__glyph">+</span>LOG EVENT</button>
      <button class="jd-action" data-jd-action="pin"><span class="jd-action__glyph">⊕</span>PIN</button>
      <button class="jd-action" data-jd-action="export"><span class="jd-action__glyph">⇣</span>EXPORT</button>
      <span class="jd-action__spacer"></span>
      <button class="jd-action jd-action--expand" data-jd-action="expand"><span class="jd-action__glyph">⤢</span>EXPAND</button>
    </footer>`;
}

// ─── Form submit (bounded inputs · §00.B #8) ───────────────────────────────

function normalizeKind(raw: string | undefined): EventKind {
  const parsed = EventKindSchema.safeParse(raw);
  return parsed.success ? parsed.data : 'regimen';
}

function clampSeverity(raw: string | undefined): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(Number(raw));
  const clamped = Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 3;
  return clamped as 1 | 2 | 3 | 4 | 5;
}

// ─── Mount ─────────────────────────────────────────────────────────────────

export function mount(container: HTMLElement): DrawerHandle {
  let isOpen = false;
  let isExpanded = false;
  let activeTab: Tab = 'timeline';
  let formMode: FormMode = null;

  const render = (): void => {
    container.innerHTML = renderShell(activeTab, formMode);
  };

  const open = (): void => {
    if (isOpen) {
      return;
    }
    isOpen = true;
    container.classList.add('jd-open');
    render();
  };
  const close = (): void => {
    if (!isOpen) {
      return;
    }
    isOpen = false;
    isExpanded = false;
    formMode = null;
    container.classList.remove('jd-open', 'jd-expanded');
    container.innerHTML = '';
  };
  const toggle = (): void => {
    if (isOpen) {
      close();
    }
    else {
      open();
    }
  };
  const toggleExpanded = (): void => {
    isExpanded = !isExpanded;
    container.classList.toggle('jd-expanded', isExpanded);
  };

  const submitEvent = (): void => {
    const kindEl = container.querySelector<HTMLSelectElement>('[data-jd-field="kind"]');
    const titleEl = container.querySelector<HTMLInputElement>('[data-jd-field="title"]');
    const detailEl = container.querySelector<HTMLInputElement>('[data-jd-field="detail"]');
    const deltaEl = container.querySelector<HTMLInputElement>('[data-jd-field="delta"]');
    const errEl = container.querySelector<HTMLElement>('[data-jd-field="err"]');
    const title = (titleEl?.value ?? '').trim().slice(0, 200);
    if (title.length === 0) {
      if (errEl !== null) {
        errEl.textContent = 'Title is required.';
      }
      return;
    }
    const detail = (detailEl?.value ?? '').trim().slice(0, 2000);
    const delta = (deltaEl?.value ?? '').trim().slice(0, 80);
    const event: Omit<JourneyEvent, 'eventId'> = {
      kind: normalizeKind(kindEl?.value),
      title,
      occurredAt: new Date().toISOString(),
      ...(detail.length > 0 ? { detail } : {}),
      ...(delta.length > 0 ? { delta } : {}),
    };
    formMode = null;
    logEvent(event);
    render();
  };

  const submitCheckin = (): void => {
    const sevEl = container.querySelector<HTMLSelectElement>('[data-jd-field="severity"]');
    const noteEl = container.querySelector<HTMLTextAreaElement>('[data-jd-field="note"]');
    const tagsEl = container.querySelector<HTMLInputElement>('[data-jd-field="tags"]');
    const note = (noteEl?.value ?? '').trim().slice(0, 2000);
    const tags = (tagsEl?.value ?? '')
      .split(',')
      .map(t => t.trim().slice(0, 40))
      .filter(t => t.length > 0)
      .slice(0, 20);
    formMode = null;
    logCheckin({ severity: clampSeverity(sevEl?.value), note, tags, loggedAt: new Date().toISOString() });
    render();
  };

  const clickHandler = (ev: Event): void => {
    const target = ev.target as HTMLElement | null;
    if (target === null) {
      return;
    }
    const tabBtn = target.closest<HTMLElement>('[data-jd-tab]');
    if (tabBtn !== null) {
      const next = tabBtn.getAttribute('data-jd-tab') as Tab | null;
      if (next !== null && next !== activeTab) {
        activeTab = next;
        formMode = null;
        render();
      }
      return;
    }
    const actionEl = target.closest<HTMLElement>('[data-jd-action]');
    if (actionEl === null) {
      return;
    }
    const action = actionEl.getAttribute('data-jd-action');
    if (action === null) {
      return;
    }
    switch (action) {
      case 'close':
        close();
        break;
      case 'expand':
        toggleExpanded();
        break;
      case 'log-event':
        formMode = 'event';
        render();
        break;
      case 'quick-checkin':
        activeTab = 'checkins';
        formMode = 'checkin';
        render();
        break;
      case 'event-save':
        submitEvent();
        break;
      case 'checkin-save':
        submitCheckin();
        break;
      case 'form-cancel':
        formMode = null;
        render();
        break;
      default:
        break;
    }
  };
  container.addEventListener('click', clickHandler);

  onEvent('journey:changed', () => {
    if (isOpen) {
      render();
    }
  });
  onEvent('goals:updated', () => {
    if (isOpen) {
      render();
    }
  });

  return {
    open,
    close,
    toggle,
    toggleExpanded,
    isOpen: () => isOpen,
  };
}
