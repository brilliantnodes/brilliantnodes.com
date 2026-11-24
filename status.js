/* Brilliant Nodes: live status of our public nodes, read from our public status record
   (github.com/brilliantnodes/status, checked by Upptime). Shown only when the record is fresh;
   otherwise nothing appears. Values are written as text, never as HTML. */
{
  const strip = document.getElementById('live'), items = document.getElementById('live-items');
  const BASE = 'https://raw.githubusercontent.com/brilliantnodes/status/master/history/';
  const NODES = [{ slug: 'gnosis-chain-full-node', name: 'Gnosis node' }, { slug: 'gno-land-onyx-node-testnet', name: 'gno.land node' }];
  const STALE_H = 36;
  const get = (url, as) => {
    const c = 'AbortController' in window ? new AbortController() : null;
    const t = setTimeout(() => c && c.abort(), 8000);
    return fetch(url, { signal: c ? c.signal : undefined, credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then(r => { clearTimeout(t); if (!r.ok) throw new Error(r.status); return as === 'json' ? r.json() : r.text(); });
  };
  const ago = ms => {
    const h = Math.floor(ms / 3600000);
    if (h < 1) return 'less than an hour ago';
    return h === 1 ? '1 hour ago' : h + ' hours ago';
  };
  if (strip && items && window.fetch) {
    Promise.all([get(BASE + 'summary.json', 'json')].concat(NODES.map(n => get(BASE + n.slug + '.yml'))))
      .then(([summary, ...ymls]) => {
        const times = ymls.map(y => { const m = /lastUpdated:\s*([0-9T:.\-]+Z)/.exec(y); return m ? Date.parse(m[1]) : NaN; }).filter(x => !isNaN(x));
        if (!times.length || !Array.isArray(summary)) return;
        const age = Date.now() - Math.max(...times);
        if (age < 0 || age > STALE_H * 3600000) return;
        const rows = NODES.map(n => ({ n, s: summary.find(x => x && x.slug === n.slug) })).filter(r => r.s && /^(up|down|degraded)$/.test(r.s.status));
        if (!rows.length) return;
        const pct = v => /^\d{1,3}(\.\d{1,2})?%$/.test(String(v)) ? String(v) : null;
        for (const { n, s } of rows) {
          const span = document.createElement('span');
          span.className = 'live-item is-' + s.status;
          span.textContent = n.name + ': ' + s.status + (pct(s.uptimeWeek) ? ', ' + pct(s.uptimeWeek) + ' this week' : '');
          items.appendChild(span);
          const card = document.querySelector('.node-live[data-slug="' + n.slug + '"]');
          if (card) { card.textContent = (s.status === 'up' ? 'Up at last check' : s.status === 'down' ? 'Down at last check' : 'Degraded at last check') + (pct(s.uptimeWeek) ? ' · ' + pct(s.uptimeWeek) + ' uptime this week' : ''); card.classList.add('is-' + s.status); }
        }
        const when = document.createElement('span');
        when.className = 'live-when';
        when.textContent = 'Record updated ' + ago(age);
        items.appendChild(when);
        strip.hidden = false;
      })
      .catch(() => {});
  }
}
