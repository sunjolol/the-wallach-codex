(function () {
  function clInit() {
    // Version-reader: pulls from versions-data JSON block and updates all
    // [data-version-slot] elements. Single source of truth for banner + sysinfo display.
    try {
      const vEl = document.getElementById('versions-data');
      if (vEl) {
        const v = JSON.parse(vEl.textContent).current;
        const DASH_SEP = ' — ';
        const slots = {
          'updated-pill': `Updated ${v.updated_display || v.updated_iso || ''}`,
          'brain-pill': `Chronicle v${v.brain}${v.brain_label ? DASH_SEP + v.brain_label : ''}`,
          'cl-brain': `v${v.brain}${v.brain_label ? DASH_SEP + v.brain_label : ''}`,
          'cl-dashboard': `v${v.dashboard}${v.dashboard_label ? DASH_SEP + v.dashboard_label : ''}`,
          'tools-brain': `Chronicle v${v.brain}${v.brain_label ? DASH_SEP + v.brain_label : ''}`,
          'footer-version': `Dashboard v${v.dashboard} · Chronicle v${v.brain} · updated ${v.updated_display || v.updated_iso || ''}`,
        };
        document.querySelectorAll('[data-version-slot]').forEach((el) => {
          const key = el.getAttribute('data-version-slot');
          if (slots[key])
            el.textContent = slots[key];
        });
        // Populate Journey-tab timeline from versions.json history
        const timeline = document.getElementById('journey-timeline');
        const obj = JSON.parse(vEl.textContent);
        if (timeline && obj.history && Array.isArray(obj.history)) {
          const html = obj.history.map((h) => {
            const title = (h.title || (`Chronicle v${h.brain} + Dashboard v${h.dashboard}${h.summary ? DASH_SEP + h.summary : ''}`)).replace(/^Brain v/, 'Chronicle v').replace(/ \+ Brain v/g, ' + Chronicle v');
            const body = h.body || h.summary || '';
            const dateLabel = h.date + (h.round ? (` — Round ${h.round}`) : '');
            const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<li><div class="date">${esc(dateLabel)}</div><div class="title">${esc(title)}</div><div class="body">${esc(body)}</div></li>`;
          }).join('\n');
          timeline.innerHTML = html;
        }
      }
    }
    catch { /* don't block log init on version read failure */ }
    const enterBtn = document.getElementById('cl-enter-btn');
    const exitBtn = document.getElementById('cl-exit-btn');
    const log = document.getElementById('creators-log');
    if (!enterBtn || !log)
      return;
    const sections = ['saga', 'lessons', 'decisions', 'changelog', 'notebook'];
    const CLOSE_TAG = '<' + '/script>';
    const ESCAPED = '<\\/script>';
    sections.forEach((key) => {
      const dataEl = document.getElementById(`cl-data-${key}`);
      const targetEl = document.getElementById(`cl-${key}`);
      if (dataEl && targetEl) {
        // Reverse the embed-time escape so the visible text reads cleanly
        const raw = dataEl.textContent.split(ESCAPED).join(CLOSE_TAG);
        targetEl.textContent = raw;
      }
    });
    enterBtn.addEventListener('click', () => {
      // Toggle behavior — clicking the gate when the log is already open
      // closes it (previous regression: open-only handler left the only
      // close path through the Exit button at the bottom of the panel).
      const willOpen = !!log.hidden;
      log.hidden = !willOpen;
      enterBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        log.hidden = true;
        enterBtn.setAttribute('aria-expanded', 'false');
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clInit);
  }
  else {
    clInit();
  }
})();
