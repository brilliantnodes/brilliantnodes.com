/* Brilliant Nodes: the network map (own code, 2D canvas). No libraries, no requests, no storage.
   Seed and hub points are shown at continent level, our other servers by city, fleet points by country. */
{
  const al = x => (x > 0 ? (x < 1 ? x : 1) : 0).toFixed(3); // plain decimals: Safari rejects 1e-7 in colours
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cv = document.getElementById('netmap');
  if (cv && cv.getContext) {
    const LAND = 'AAAAAGD9/////wcA/wDeBwA/AAAAAAAAAAD4/v////8fAPgLAAAAAA8AAAAAAAAA4P//j////wMABACAH8j/D4AfAAAAAAD/9/8A/P8PAAAAAB7G//9zdAAAAxAA+P/vf8D//wAAAABw8P////9/AADg////7/0f+P8PAMD/wH7/////////h///////84f/PwAA/n/////////////7/////7//+D/8APD/////////////qP//////+wd/gA/A/////////////x/4//////E/4AMAAP/+////////////gP////8P+AYcAADi7////////////QHAB/7//4H/AAAAPH7+////////P+AAAA6A////+B8AAIDD5/////////8ALwAYAPD/////BwAAfv7/////////P/AAAAAA/f///38AAOD///////////8HAwAAAMD/////DwAA8P//////////fxgAAAAA8P///+cAAAD///////////8DAAAAAAD/////AQAA4P//////////bwMAAAAA8P///wcAAMD//+n//////38eAAAAAAD///8PAAAA/Pzf+f//////cAAAAAAA8P//PwAAAODX/v///////w8DAAAAAAD///8BAAABfnD3//////9vOAAAAAAA4P//HwAAAID/wP//////f/4BAAAAAAD8//8BAAAA/A9A//////+nDwAAAAAAAP//BwAAAOD/9////////xwAAAAAAADw/z8AAAAA/v////////8PAAAAAAAAAP4HBgAAAPz//////////wAAAAAAAADAP+AAAACA//////////8HAAAAAAAAAPwDCAAAAPz/////8P///wAAAAAAAAAAPvYBAADA/////R/+//8EAAAAABAAAOBn2gAAAPz/////gD//EwAAAAAAAAAA/Ie9AADA/////wf44T8MAAAAAAAAAAD/AQgAAPz///8fgA/+wQAAAAAAAAAAAB8AAADA/////wB4gB8cQAAAAAAAAADA4QEAAPz///8NAAf5wQMAAAAAAAAAAPj/AACA/////wBwgB0aAAAAAAAAAAAA/z8AAPD///8PAA4YgAMAQAAAAAAAAID/DwAA////fwDAQAM7AAIAAAAAAAAA+P8BAEDg//8HAAB8OQIAAAAAAAAAAID/PwAAAPj/PwAAwOdTAAAAAAAAAAAQ/P8HAACA//8BAABw/jUAAAAAAAAAAMD//wMAAPj/DwAAgP+NvwIAAAAAAAAA/v//AACA/38AAADg3P7PAAAAAAAAAMD//x8AAPD/BwAAAHwM+hcAAAAQAAAA/P//AQAA/n8AAACA75IfBgAAAAAAAID//x8AAOD/BwAAAAA0IIcCAAAAAAAA+P//AAAA/n8IAAAAAHgGAAAAAAAAAAD//wcAAPD/xwAAAADgZwAAAQAAAAAA4P9/AAAA/38PAAAAAP8PYJgAAAAAAAD8/wcAAPD/8wAAAAD4/wCAAAAAAAAAgP9/AAAA/x8HAAAA8P8fEAAAAAAAAAD4/wMAAOD/cQAAAID//wMCAAAAAAAAgP8fAAAA/h8HAAAA+P9/AAAAAAAAAAD4fwAAAMD/MAAAAID//wcAAAAAAAAAwP8HAAAA/AcAAAAA+P//AAAAAAAAAAD8PwAAAIB/AAAAAAD//w8AAAAAAAAAwP8BAAAA+AMAAAAA8P9/AAAAAAAAAAD8DwAAAIAfAAAAAAAf/AcAAAAAAAAAwH8AAAAAAAAAAAAAAMA/AAIAAAAAAAD+AwAAAQAAAAAAAAAA8APgAAAAAAAA4A8AAAAAAAAAAAAAAAAUAAYAAAAAAAB+AAAAAAAAAAAAAAAAgAFwAAAAAAAA4AMAAAAAAAAAAAAAAAAYwAEAAAAAAAAfAAAAAAAAAAAAAAAAAAAOAAAAAAAA8AMAAAAAAAAAAAAAAAAAAAAAAAAAAAAfAAAAAAAAAAACAAAAAAAAAAAAAAAA4DEAAAAAAAAAAAAAAAAAAAAAAAAAAAA+ABAAAAAAAAAAAAAAAAAAAAAAAAAAgAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const ROWS = 70, COLS = 180, TOP = 80, STEP = 2;
    const bits = Uint8Array.from(atob(LAND), ch => ch.charCodeAt(0));
    const land = (r, c) => (bits[(r * COLS + c) >> 3] >> ((r * COLS + c) & 7)) & 1;
    // the brand colours, fixed here: reading CSS variables while the page loads can return nothing in Safari
    const PAL = { coral: '#FF5E7A', amber: '#FFB547', lime: '#C6F36B', cyan: '#3DDCFF', violet: '#9C7BFF' };
    const col = n => PAL[n] || '#F7F2EC';
    const rgb = hex => { const h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
    const seeds = [
      { lat: 52.5, lon: 4.5, c: rgb(col('coral')) },
      { lat: 39, lon: -96, c: rgb(col('amber')) },
      { lat: 35.5, lon: 137, c: rgb(col('cyan')) }
    ];
    const fleet = [[34, -117], [33, -84], [41, -74], [45, -74], [50, -97], [59, 18],
      [31, 121], [23, 113], [30, 104], [21, 106], [11, 107]];
    // our other servers, by city; a = label side, dx/dy = label offset; live: false draws a site as being prepared
    const sites = [
      { n: 'Chicago', lat: 41.9, lon: -87.6, live: true, a: 'center', dx: 0, dy: -10 },
      { n: 'São Paulo', lat: -23.5, lon: -46.6, live: true, a: 'left', dx: 9, dy: 4 },
      { n: 'Frankfurt', lat: 50.1, lon: 8.7, live: true, a: 'right', dx: -6, dy: 16 },
      { n: 'Prague', lat: 50.1, lon: 14.4, live: true, a: 'left', dx: 8, dy: -5 },
      { n: 'Johannesburg', lat: -26.2, lon: 28.0, live: true, a: 'left', dx: 9, dy: 4 },
      { n: 'Singapore', lat: 1.35, lon: 103.8, live: true, a: 'right', dx: -9, dy: 4 },
      { n: 'Melbourne', lat: -37.8, lon: 145.0, live: true, a: 'center', dx: 0, dy: 19 }
    ];
    const face = getComputedStyle(document.body).fontFamily;
    const lime = rgb(col('lime')), violet = rgb(col('violet'));
    const ctx = cv.getContext('2d');
    const btn = document.getElementById('map-pause');
    const off = document.createElement('canvas');
    let W = 0, H = 0, dpr = 1, raf = 0, inView = true, paused = false, links = [];
    const xy = (lat, lon) => [(lon + 180) / 360 * W, (TOP - lat) / (ROWS * STEP) * H];
    const near = (lat, lon) => {
      let best = 0, bd = 1e9;
      seeds.forEach((s, i) => { const d = (s.lat - lat) ** 2 + ((s.lon - lon) * Math.cos(lat * Math.PI / 180)) ** 2; if (d < bd) { bd = d; best = i; } });
      return [best, Math.sqrt(bd)];
    };
    const arc = (a, b, lift) => {
      const [x1, y1] = xy(a[0], a[1]), [x2, y2] = xy(b[0], b[1]);
      const d = Math.hypot(x2 - x1, y2 - y1);
      return { x1, y1, x2, y2, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 - d * lift };
    };
    const at = (k, t) => {
      const u = 1 - t;
      return [u * u * k.x1 + 2 * u * t * k.cx + t * t * k.x2, u * u * k.y1 + 2 * u * t * k.cy + t * t * k.y2];
    };
    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return;
      cv.width = off.width = Math.round(W * dpr); cv.height = off.height = Math.round(H * dpr);
      const o = off.getContext('2d');
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      o.clearRect(0, 0, W, H);
      const stride = W < 640 ? 2 : 1, s = W / COLS, r = Math.max(0.8, s * stride * 0.3);
      for (let row = 0; row < ROWS; row += stride) for (let c = 0; c < COLS; c += stride) {
        if (!land(row, c)) continue;
        const lat = TOP - row * STEP, lon = -180 + c * STEP;
        const [i, d] = near(lat, lon);
        const k = Math.max(0, 1 - d / 26), sc = seeds[i].c;
        const m = (v, base) => Math.round(base + (v - base) * k * 0.85);
        o.fillStyle = `rgba(${m(sc[0], 120)},${m(sc[1], 108)},${m(sc[2], 132)},${al(0.32 + k * 0.5)})`;
        const [x, y] = xy(lat, lon);
        o.beginPath(); o.arc(x + s * stride / 2, y + s * stride / 2, r, 0, 6.2832); o.fill();
      }
      links = [];
      const S = seeds.map(q => [q.lat, q.lon]);
      links.push({ k: arc(S[0], S[1], 0.28), c: seeds[0].c, sp: 0.11, n: 3 });
      links.push({ k: arc(S[0], S[2], 0.26), c: seeds[2].c, sp: 0.09, n: 3 });
      links.push({ k: arc(S[1], S[2], 0.22), c: seeds[1].c, sp: 0.06, n: 2 });
      fleet.forEach((f, j) => { const [i] = near(f[0], f[1]); links.push({ k: arc(S[i], f, 0.35), c: seeds[i].c, sp: 0.22 + (j % 4) * 0.04, n: 1, f }); });
      sites.forEach((q, j) => {
        const [i] = near(q.lat, q.lon), p = [q.lat, q.lon];
        links.push(q.live ? { k: arc(S[i], p, 0.3), c: lime, sp: 0.15 + (j % 3) * 0.03, n: 1, f: p }
                          : { k: arc(S[i], p, 0.24), c: violet, sp: 0, n: 0, f: p, plan: true });
      });
    };
    const draw = (now, moving) => {
      if (!W) return;
      const t = moving ? now / 1000 : 2.2, z = Math.max(0.5, Math.min(1, W / 760));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(off, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      for (const L of links) {
        const [r, g, b] = L.c, k = L.k;
        ctx.strokeStyle = `rgba(${r},${g},${b},${al(L.plan ? 0.45 : L.f ? 0.22 : 0.42)})`;
        ctx.lineWidth = L.f ? 1 : 1.5;
        if (L.plan) ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.moveTo(k.x1, k.y1); ctx.quadraticCurveTo(k.cx, k.cy, k.x2, k.y2); ctx.stroke();
        if (L.plan) ctx.setLineDash([]);
        for (let n = 0; n < L.n; n++) {
          const p = ((t * L.sp + n / L.n + (L.f ? L.f[1] / 97 : 0)) % 1 + 1) % 1;
          for (let q = 0; q < 5; q++) {
            const pq = p - q * 0.012; if (pq < 0) break;
            const [x, y] = at(k, pq);
            ctx.fillStyle = `rgba(${r},${g},${b},${al((1 - q / 5) * 0.9)})`;
            ctx.beginPath(); ctx.arc(x, y, (L.f ? 1.6 : 2.4) * (1 - q / 7), 0, 6.2832); ctx.fill();
          }
        }
      }
      fleet.forEach((f, j) => {
        const [x, y] = xy(f[0], f[1]);
        const a = moving ? 0.55 + 0.45 * Math.sin(t * 2.1 + j * 1.7) : 0.85;
        ctx.fillStyle = `rgba(247,242,236,${al(a)})`;
        ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 6.2832); ctx.fill();
      });
      seeds.forEach((s, i) => {
        const [x, y] = xy(s.lat, s.lon), [r, g, b] = s.c;
        const ph = moving ? ((t / 2.4 + i / 3) % 1) : 0.35;
        ctx.strokeStyle = `rgba(${r},${g},${b},${al(0.7 * (1 - ph))})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, (6 + ph * 18) * z, 0, 6.2832); ctx.stroke();
        const gr = ctx.createRadialGradient(x, y, 0, x, y, 14 * z);
        gr.addColorStop(0, `rgba(${r},${g},${b},.9)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 14 * z, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 3.4 * Math.max(z, 0.75), 0, 6.2832); ctx.fill();
      });
      sites.forEach((q, j) => {
        const [x, y] = xy(q.lat, q.lon);
        if (q.live) {
          const [r, g, b] = lime, ph = moving ? (t / 2.8 + j / 8) % 1 : 0.35;
          ctx.strokeStyle = `rgba(${r},${g},${b},${al(0.7 * (1 - ph))})`; ctx.lineWidth = 1.3;
          ctx.beginPath(); ctx.arc(x, y, (4 + ph * 12) * z, 0, 6.2832); ctx.stroke();
          ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.beginPath(); ctx.arc(x, y, 3 * Math.max(z, 0.8), 0, 6.2832); ctx.fill();
        } else {
          const [r, g, b] = violet, a = moving ? 0.6 + 0.35 * Math.sin(t * 1.4 + j) : 0.85;
          ctx.strokeStyle = `rgba(${r},${g},${b},${al(a)})`; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 6.2832); ctx.stroke();
          ctx.fillStyle = `rgba(${r},${g},${b},${al(a * 0.35)})`; ctx.beginPath(); ctx.arc(x, y, 4.2, 0, 6.2832); ctx.fill();
        }
      });
      if (W >= 720) {
        ctx.font = `700 13px ${face}`; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
        for (const q of sites) {
          const [x, y] = xy(q.lat, q.lon);
          ctx.textAlign = q.a;
          ctx.strokeStyle = 'rgba(42,33,51,.85)'; ctx.lineWidth = 4; ctx.strokeText(q.n, x + q.dx, y + q.dy);
          ctx.fillStyle = 'rgba(247,242,236,.92)'; ctx.fillText(q.n, x + q.dx, y + q.dy);
        }
      }
    };
    const live = () => !reduce.matches && inView && !paused && !document.hidden;
    const frame = now => { raf = 0; draw(now, true); if (live()) raf = requestAnimationFrame(frame); };
    const play = () => { if (!raf && live()) raf = requestAnimationFrame(frame); };
    const still = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } draw(performance.now(), false); };
    const setMotion = () => { if (btn) btn.hidden = reduce.matches; if (reduce.matches) still(); else play(); };
    new ResizeObserver(() => { build(); if (!raf) draw(performance.now(), false); play(); }).observe(cv);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; play(); }).observe(cv);
    document.addEventListener('visibilitychange', play);
    if (reduce.addEventListener) reduce.addEventListener('change', setMotion);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!raf) draw(performance.now(), false); });
    if (btn) btn.addEventListener('click', () => {
      paused = !paused;
      btn.setAttribute('aria-pressed', String(paused));
      btn.textContent = paused ? 'Play map' : 'Pause map';
      if (paused) { if (raf) { cancelAnimationFrame(raf); raf = 0; } } else play();
    });
    setMotion();
  }
}

/* Pause switch for the settle diagram (CSS animation) */
{
  const fig = document.getElementById('settle'), btn = document.getElementById('settle-pause');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (fig && btn) {
    const set = () => { btn.hidden = reduce.matches; };
    set();
    if (reduce.addEventListener) reduce.addEventListener('change', set);
    btn.addEventListener('click', () => {
      const p = !fig.classList.contains('paused');
      fig.classList.toggle('paused', p);
      btn.setAttribute('aria-pressed', String(p));
      btn.textContent = p ? 'Play diagram' : 'Pause diagram';
    });
  }
}
