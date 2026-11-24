/* Brilliant Nodes: the 3D globe (own code, 2D canvas, orthographic projection). No libraries, no requests, no storage.
   Land: 30,000 evenly spread points, built offline from a public land mask. Seed and hub servers at continent level,
   our other servers by city, rented machines by country. Drag sideways or use the arrow keys to turn it. */
{
  const fig = document.getElementById('netfig'), cv = document.getElementById('globe');
  const viewBtn = document.getElementById('map-view'), pauseBtn = document.getElementById('map-pause');
  const al = x => (x > 0 ? (x < 1 ? x : 1) : 0).toFixed(3); // plain decimals: Safari rejects 1e-7 in colours
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (fig && cv && cv.getContext) {
    const LAND = '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FaCCAlAQiApAQQAoCEUFoCAQFaCCAFAQigpQQQAqAAUFoCAQFaCCAFQAigpQUSAqQAUFoCgUFaCiQFQACgpAQSAqQAUBoAAUFYCCQFQACgpAQSgqQAWBqAAUFYCCQFSECgpAASgqQkWFqAgUFICCQFSEigpAASgqQAWFqAgUFYACUFSACgpRESgoQgWBqAgUFYACUFSACgpRASgoAgWEqAgVFYACUFCECgpRESgqQgWEqAAVFIICUlCECghBESgqAgWkoAgVFIMCUFAECghRASgqBgWkoAgVEIICcFAECghBASooBgWkoAgUEIICUFAMCghBASogBgWkqAgUEIICUFQMCshBASogBgWkoAgUEIICUEAMCkhBESogBkWkoAgUEIICUEAMCkhBESogRAWgoBgVkIICUEAMCkhBESogBAWgoBgVkIIiUEAMCkhBESggBAWggBAVkIIicEAICkBBMSggRQWgiBgUkKIiUECICkABISggBQWggBgUgIICUEAMCkABISggBQWggBgUgKICUEAKCkABISgABQWggBgUgIJCUEAKCkABISgABQWggBAUgAJCUAAKCkABISgABQWgiBQUgAJCUAAKikABISgABYSgCBQUgAJCUAAKCkARKSgABYSgKBQUgQJCUAAKCkARKCgABYSgCBQUgSJSUAAKCEBRKCgABYSgABQUgCJQUACKCEFRKCgCRaSgABQUgKJQUAAKCEEBKCgCRaCgABQRgKJQUASKCEEBKCgCRaGgABQRgqJQUASKSEEBKCIARaGgABQRgiJQUASKQkEBKCIARaGgCBSVgiJQRASKQkEBKCIARaCoCBSFgiJQRACKQkERKCoARaCICBSFgiJQRACKQBERKCoBRaCICBSFgiJQRACKQBERKAoBRaCIABSBIiJQVACKQBERKAoFRaCIABSBIiJQFAKKQBERKApFRKCIABSBIiJQFIKKQBERKAJFRKAoABSBIiJQFIqIQhERKAJFRKAoABWBIiJQBIqIQFEQKgJFRKAoBBWBIiJUBIqIQFEAKgJFRKAIFBGBoiBUBIqIQFEAKgJFRKgIFBGBoiBUBIqIQFEoKgJFQKgIFBGBoiBUBIqAUBEoIgJFQagIFAGBomBUBIqAUBEoIgJFQagIFAGBIlBEBIqAUBEoAgJFQIgIFAGhIlAEBIqAUBEoAgJFwIgIFAGhIlAEBIqAEBEoAkJFoIgIFAGhIlAEBIqAEREoAkJFoAgIFAGhIlAEBIqAEREoAkJFoAgIFAEhIlAEBIpAERAoAkJFoAgIFAEjIlAEhIpAERAoAkJEoAgIFAEjIFAEhIpAERAoAkZEoAgIFAEiIFAEhIhAERAoAkZAoAgIFYEiIFAEhIhAERAoAkRAoAgIEYEiIFAEjIBAERAoAkRAoAAIEYEiIFAEiIBAERAiAkVAoAAYAYECIEAAiIBAARAiAkVAoAAQAYECIEAEiIBAARACAgVAgAAQAYECIEQECoAAASACAgVAgAAQAAECIAQACoAAACAAAgRAAAAQAAECQAAECIAAACAQAgRAAAAQAAECQAAECIAAACAAAgSAAAAQAAECQAAECIAAACAAAgSAAAAQAAEAQAAECIABACAAAgSAAAAQAAEAQCAECAABACAAAgCAAAAQAAAAQCAAAAABACAAAACAQAAAAAIAQAAAAAABAAAAAACAQAAAAAIAQAAAAAABAAAABACAAAAAAAIAQAAAAACBAAAABAAAAAgAAAIBAAAAAAABAAAABAIAAAgAAAIAAAAAAAABAAAABAIAAAgAAAIAAAAIBAAAEAAABAAAAAAAAAIAAAAIBAAAAAAABAAAABAIAAAAAAAIAAAAIBAABAAAABAAAAAAAAAIAAAAIBAAAAAAABAAAABAIAAAAAAAIAAAAAAAABAAAABAAAAAAAAAIAAAAAAAABAAAABAAAAAAAAAIAAAAIAAABAAAABAAAAAAAAAIAAAAIAAAAAAAABAAAAAAAEAAAAAAIAAAAAAAABAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAEAAAAAAIAAAAAAAAAAAAAIAAEAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAEAAAAAAAAAAAAAAAAAAAAACAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAgEAAAoAQAgIAQAlIAQEBAiQkpACAkpESElpISElICSElIyQkpASSkpGSUlpLSUlJCSUlI6SkpKaSkpPaWltTSUltbS01p6Tktr6SktvaWntfSentbTU3p+T0/p6S09r+en/Pyen/Pze37ez+/5eT2/7+f9/L6e3/fzen/fz+v5eb2/5+f1/r6f3/P7f37f7+/9/b+///f///7/////////', N = 30000, GA = Math.PI * (3 - Math.sqrt(5)), D = Math.PI / 180;
    // the brand colours, fixed here: reading CSS variables while the page loads can return nothing in Safari
    const PAL = { coral: '#FF5E7A', amber: '#FFB547', lime: '#C6F36B', cyan: '#3DDCFF', violet: '#9C7BFF' };
    const col = n => PAL[n] || '#F7F2EC';
    const rgb = hex => { const h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
    const vec = (lat, lon) => [Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D)];
    const seeds = [[52.5, 4.5, rgb(col('coral'))], [39, -96, rgb(col('amber'))], [35.5, 137, rgb(col('cyan'))]].map(s => ({ v: vec(s[0], s[1]), c: s[2] }));
    const lime = rgb(col('lime'));
    const cities = [['Chicago', 41.9, -87.6], ['São Paulo', -23.5, -46.6], ['Frankfurt', 50.1, 8.7], ['Prague', 50.1, 14.4],
      ['Johannesburg', -26.2, 28.0], ['Singapore', 1.35, 103.8], ['Melbourne', -37.8, 145.0]]
      .map(c => ({ n: c[0], v: vec(c[1], c[2]) }));
    const fleet = [[34, -117], [33, -84], [41, -74], [45, -74], [50, -97], [59, 18], [31, 121], [23, 113], [30, 104], [21, 106], [11, 107]].map(f => vec(f[0], f[1]));
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const nearest = v => { let best = 0, bd = -2; seeds.forEach((s, i) => { const d = dot(s.v, v); if (d > bd) { bd = d; best = i; } }); return [best, Math.acos(Math.min(1, bd)) / D]; };

    // land points with a tint that warms towards the nearest seed region
    const bits = Uint8Array.from(atob(LAND), ch => ch.charCodeAt(0));
    const land = [];
    for (let i = 0; i < N; i++) {
      if (!((bits[i >> 3] >> (i & 7)) & 1)) continue;
      const y = 1 - 2 * (i + 0.5) / N, lat = Math.asin(y), lon = (i * GA) % (2 * Math.PI);
      const v = [Math.cos(lat) * Math.sin(lon), y, Math.cos(lat) * Math.cos(lon)];
      const [k0, d] = nearest(v), k = Math.max(0, 1 - d / 30), sc = seeds[k0].c;
      const m = (c, base) => Math.round(base + (c - base) * k * 0.85);
      land.push({ v, p: `rgba(${m(sc[0], 150)},${m(sc[1], 136)},${m(sc[2], 166)},`, k });
    }

    // arcs: great circles lifted off the surface, sampled once
    const arc = (a, b, c, sp, n, thin) => {
      const w = Math.acos(Math.max(-1, Math.min(1, dot(a, b)))), s = Math.sin(w) || 1, lift = 0.06 + 0.22 * w / Math.PI, pts = [];
      for (let j = 0; j <= 40; j++) {
        const t = j / 40, f1 = Math.sin((1 - t) * w) / s, f2 = Math.sin(t * w) / s, h = 1 + lift * Math.sin(Math.PI * t);
        pts.push([(a[0] * f1 + b[0] * f2) * h, (a[1] * f1 + b[1] * f2) * h, (a[2] * f1 + b[2] * f2) * h]);
      }
      return { pts, c, sp, n, thin, off: Math.random() };
    };
    const arcs = [arc(seeds[0].v, seeds[1].v, seeds[0].c, 0.10, 3), arc(seeds[0].v, seeds[2].v, seeds[2].c, 0.09, 3), arc(seeds[1].v, seeds[2].v, seeds[1].c, 0.07, 2)];
    fleet.forEach((f, j) => { const [i] = nearest(f); arcs.push(arc(seeds[i].v, f, seeds[i].c, 0.2 + (j % 4) * 0.04, 1, true)); });
    cities.forEach((q, j) => { const [i] = nearest(q.v); arcs.push(arc(seeds[i].v, q.v, lime, 0.14 + (j % 3) * 0.03, 1, true)); });

    const ctx = cv.getContext('2d'), face = getComputedStyle(document.body).fontFamily;
    let W = 0, H = 0, dpr = 1, R = 0, cx = 0, cy = 0;
    let yaw = -0.35, pitch = 0.22, vel = 0, drag = null, idleUntil = 0, raf = 0, last = 0, inView = true;
    let cyw = 1, syw = 0, cp = 1, sp = 0;
    const setRot = () => { cyw = Math.cos(yaw); syw = Math.sin(yaw); cp = Math.cos(pitch); sp = Math.sin(pitch); };
    const rot = v => { const x1 = v[0] * cyw + v[2] * syw, z1 = -v[0] * syw + v[2] * cyw; return [x1, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp]; };
    const seen = r => r[2] > 0 || r[0] * r[0] + r[1] * r[1] > 1;
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      if (!W || !H) return false;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      R = Math.min(W, H) * 0.44; cx = W / 2; cy = H / 2;
      return true;
    };
    const draw = (now, moving) => {
      if (!W) return;
      const t = moving ? now / 1000 : 2.2, z = Math.max(0.6, Math.min(1, R / 240));
      setRot();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // atmosphere and sea
      let g = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.22);
      g.addColorStop(0, 'rgba(156,123,255,.30)'); g.addColorStop(0.35, 'rgba(255,94,122,.10)'); g.addColorStop(1, 'rgba(156,123,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, 6.2832); ctx.fill();
      g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, '#433556'); g.addColorStop(0.7, '#2A2135'); g.addColorStop(1, '#1F1828');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
      // land
      const ds = Math.max(1.1, R * 0.0078);
      for (const p of land) {
        const r = rot(p.v);
        if (r[2] <= 0.02) continue;
        const a = Math.round((0.3 + 0.7 * r[2] * (0.6 + 0.4 * p.k)) * 20) / 20, s = ds * (0.55 + 0.45 * r[2]);
        ctx.fillStyle = p.p + al(a) + ')';
        ctx.fillRect(cx + R * r[0] - s / 2, cy - R * r[1] - s / 2, s, s);
      }
      // rim light
      ctx.strokeStyle = 'rgba(247,242,236,.10)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
      // arcs and moving packets
      ctx.lineCap = 'round';
      for (const A of arcs) {
        const [r0, g0, b0] = A.c, P = A.pts.map(rot);
        ctx.strokeStyle = `rgba(${r0},${g0},${b0},${al(A.thin ? 0.32 : 0.55)})`; ctx.lineWidth = A.thin ? 1 : 1.6;
        ctx.beginPath(); let pen = false;
        for (const r of P) {
          if (!seen(r)) { pen = false; continue; }
          const x = cx + R * r[0], y = cy - R * r[1];
          if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
        }
        ctx.stroke();
        if (!moving) continue;
        for (let n = 0; n < A.n; n++) {
          const ph = ((t * A.sp + n / A.n + A.off) % 1 + 1) % 1;
          for (let q = 0; q < 5; q++) {
            const u = ph - q * 0.014; if (u < 0) break;
            const fi = u * 40, i0 = Math.floor(fi), f = fi - i0, a1 = P[i0], a2 = P[Math.min(40, i0 + 1)];
            const r = [a1[0] + (a2[0] - a1[0]) * f, a1[1] + (a2[1] - a1[1]) * f, a1[2] + (a2[2] - a1[2]) * f];
            if (!seen(r)) continue;
            ctx.fillStyle = `rgba(${r0},${g0},${b0},${al((1 - q / 5) * 0.95)})`;
            ctx.beginPath(); ctx.arc(cx + R * r[0], cy - R * r[1], (A.thin ? 1.7 : 2.5) * (1 - q / 7) * z, 0, 6.2832); ctx.fill();
          }
        }
      }
      // rented machines
      fleet.forEach((f, j) => {
        const r = rot(f); if (r[2] <= 0.05) return;
        const a = (moving ? 0.55 + 0.45 * Math.sin(t * 2.1 + j * 1.7) : 0.85) * Math.min(1, r[2] * 2);
        ctx.fillStyle = `rgba(247,242,236,${al(a)})`; ctx.beginPath(); ctx.arc(cx + R * r[0], cy - R * r[1], 2.2 * z, 0, 6.2832); ctx.fill();
      });
      // seed and hub servers
      seeds.forEach((s, i) => {
        const r = rot(s.v); if (r[2] <= 0.05) return;
        const x = cx + R * r[0], y = cy - R * r[1], [r0, g0, b0] = s.c, e = Math.min(1, r[2] * 2);
        const ph = moving ? (t / 2.4 + i / 3) % 1 : 0.35;
        ctx.strokeStyle = `rgba(${r0},${g0},${b0},${al(0.7 * (1 - ph) * e)})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, (6 + ph * 18) * z, 0, 6.2832); ctx.stroke();
        const gr = ctx.createRadialGradient(x, y, 0, x, y, 15 * z);
        gr.addColorStop(0, `rgba(${r0},${g0},${b0},${al(0.9 * e)})`); gr.addColorStop(1, `rgba(${r0},${g0},${b0},0)`);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 15 * z, 0, 6.2832); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${al(e)})`; ctx.beginPath(); ctx.arc(x, y, 3.4 * z, 0, 6.2832); ctx.fill();
      });
      // our servers, with names on the visible side
      const labels = [];
      cities.forEach((q, j) => {
        const r = rot(q.v); if (r[2] <= 0.05) return;
        const x = cx + R * r[0], y = cy - R * r[1], e = Math.min(1, r[2] * 2.5), [r0, g0, b0] = lime;
        const ph = moving ? (t / 2.8 + j / 8) % 1 : 0.35;
        ctx.strokeStyle = `rgba(${r0},${g0},${b0},${al(0.7 * (1 - ph) * e)})`; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.arc(x, y, (4 + ph * 12) * z, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = `rgba(${r0},${g0},${b0},${al(e)})`; ctx.beginPath(); ctx.arc(x, y, 3 * z, 0, 6.2832); ctx.fill();
        if (r[2] > 0.2 && R > 150) labels.push({ n: q.n, x, y, e: Math.min(1, (r[2] - 0.2) * 4) });
      });
      ctx.font = `700 ${R > 220 ? 13 : 12}px ${face}`; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      labels.sort((a, b) => a.y - b.y);
      const placed = [];
      for (const L of labels) {
        const w = ctx.measureText(L.n).width;
        let lx = L.x + 9, ly = L.y;
        if (lx + w > W - 4) lx = L.x - 9 - w;
        for (const P of placed) if (Math.abs(P.y - ly) < 15 && lx < P.x + P.w && lx + w > P.x) ly = P.y + 15;
        placed.push({ x: lx, y: ly, w });
        ctx.strokeStyle = `rgba(42,33,51,${al(0.85 * L.e)})`; ctx.lineWidth = 4; ctx.strokeText(L.n, lx, ly);
        ctx.fillStyle = `rgba(247,242,236,${al(0.95 * L.e)})`; ctx.fillText(L.n, lx, ly);
      }
    };

    const globeOn = () => !fig.classList.contains('flat');
    const paused = () => pauseBtn && pauseBtn.getAttribute('aria-pressed') === 'true';
    const live = () => globeOn() && !reduce.matches && inView && !paused() && !document.hidden;
    const frame = now => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      if (!drag) {
        if (Math.abs(vel) > 0.0005) { yaw += vel; vel *= 0.94; }
        else if (now > idleUntil) yaw += 0.16 * dt;
      }
      draw(now, true);
      if (live()) raf = requestAnimationFrame(frame); else last = 0;
    };
    const play = () => { if (!raf && live()) raf = requestAnimationFrame(frame); };
    const still = () => { if (!raf) draw(performance.now(), false); };

    // turning by hand
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, t: e.timeStamp }; vel = 0; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y, k = 1 / Math.max(R, 1);
      yaw += dx * k; pitch = Math.max(-0.6, Math.min(0.8, pitch + dy * k));
      vel = dx * k * 0.6; drag.x = e.clientX; drag.y = e.clientY;
      if (!raf) draw(performance.now(), !reduce.matches && !paused());
    });
    const end = () => { if (drag) { drag = null; idleUntil = performance.now() + 2500; play(); } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('keydown', e => {
      const step = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.15], ArrowDown: [0, 0.15] }[e.key];
      if (!step) return;
      e.preventDefault(); yaw -= step[0]; pitch = Math.max(-0.6, Math.min(0.8, pitch + step[1]));
      idleUntil = performance.now() + 4000; if (!raf) draw(performance.now(), false);
    });

    // globe or flat map
    const setView = flat => {
      fig.classList.toggle('flat', flat);
      if (viewBtn) { viewBtn.textContent = flat ? 'Show globe' : 'Show flat map'; viewBtn.setAttribute('aria-pressed', String(flat)); }
      if (!flat) requestAnimationFrame(() => { if (size()) still(); play(); });
    };
    if (viewBtn) viewBtn.addEventListener('click', () => setView(!fig.classList.contains('flat')));
    if (pauseBtn) pauseBtn.addEventListener('click', () => { if (paused()) { if (raf) { cancelAnimationFrame(raf); raf = 0; last = 0; } still(); } else play(); });
    setView(reduce.matches);
    if (reduce.addEventListener) reduce.addEventListener('change', () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } still(); play(); });
    new ResizeObserver(() => { if (size()) { if (!raf) draw(performance.now(), false); play(); } }).observe(cv);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; play(); }).observe(cv);
    document.addEventListener('visibilitychange', play);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(still);
  }
}
