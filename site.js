/* Brilliant Nodes: a refracting 3D brilliant (WebGL, own code), its nodes and packets,
   3D tilt panels, 3D section entrances and the spectrum line. No libraries, no requests, no storage. */
{
  const root = document.documentElement;
  root.classList.add('js');
  // Samsung Internet's own dark mode darkens colour gradients, which hides gradient lettering: use plain colours there
  if (/SamsungBrowser/i.test(navigator.userAgent)) root.classList.add('samsung');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---------- Geometry: a round brilliant, 57 facets ---------- */
  const V = [];
  const P = (deg, r, y) => { const a = deg * Math.PI / 180; V.push([r * Math.cos(a), y, r * Math.sin(a)]); return V.length - 1; };
  const TR = 0.55, TY = 0.32, SR = 0.80, SY = TY * (1 - SR) / (1 - TR);
  const CY = -0.86, LR = 0.24, LY = CY * (1 - LR);
  const T = [], S = [], G = [], L = [];
  for (let k = 0; k < 8; k++) T.push(P(45 * k, TR, TY));
  for (let k = 0; k < 8; k++) S.push(P(45 * k + 22.5, SR, SY));
  for (let j = 0; j < 16; j++) G.push(P(22.5 * j, 1, 0));
  for (let k = 0; k < 8; k++) L.push(P(45 * k + 22.5, LR, LY));
  const C = P(0, 0, CY);
  const m8 = k => (k + 8) % 8, m16 = j => (j + 16) % 16;
  const F = [T.slice()];
  for (let k = 0; k < 8; k++) {
    F.push([T[k], S[k], T[m8(k + 1)]]);
    F.push([T[k], S[k], G[2 * k], S[m8(k - 1)]]);
    F.push([S[k], G[2 * k], G[2 * k + 1]]);
    F.push([S[k], G[2 * k + 1], G[m16(2 * k + 2)]]);
    F.push([G[2 * k], L[k], C, L[m8(k - 1)]]);
    F.push([L[k], G[2 * k], G[2 * k + 1]]);
    F.push([L[k], G[2 * k + 1], G[m16(2 * k + 2)]]);
  }
  const mid = (TY + CY) / 2;
  for (const v of V) v[1] -= mid;
  const edgeKey = new Set(), E = [], nbr = V.map(() => []);
  for (const f of F) for (let i = 0; i < f.length; i++) {
    const a = f[i], b = f[(i + 1) % f.length], key = a < b ? a + '-' + b : b + '-' + a;
    if (!edgeKey.has(key)) { edgeKey.add(key); E.push([a, b]); nbr[a].push(b); nbr[b].push(a); }
  }
  const FN = F.map(f => {
    let nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < f.length; i++) {
      const p = V[f[i]], q = V[f[(i + 1) % f.length]];
      nx += (p[1] - q[1]) * (p[2] + q[2]); ny += (p[2] - q[2]) * (p[0] + q[0]); nz += (p[0] - q[0]) * (p[1] + q[1]);
      cx += p[0]; cy += p[1]; cz += p[2];
    }
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (nx * cx + ny * cy + nz * cz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    return [nx, ny, nz];
  });
  const yMin = CY - mid, yMax = TY - mid;
  const height = i => (V[i][1] - yMin) / (yMax - yMin);
  const EH = E.map(([a, b]) => Math.min(height(a), height(b)));
  const DIST = 4.2;

  /* ---------- WebGL: the solid, refracting stone ---------- */
  const makeGL = cv => {
    let gl = null;
    try { gl = cv.getContext('webgl', { premultipliedAlpha: true, antialias: true, alpha: true }); } catch (e) { gl = null; }
    if (!gl) return null;
    const vs = `
      attribute vec3 aPos; attribute vec3 aNrm; attribute float aId;
      uniform mat3 uRot; uniform vec2 uScale;
      varying vec3 vN; varying float vId;
      void main(){
        vec3 p = uRot * aPos;
        float s = ${DIST.toFixed(1)} / (${DIST.toFixed(1)} - p.z);
        gl_Position = vec4(p.x * s * uScale.x, p.y * s * uScale.y, -p.z * 0.2, 1.0);
        vN = uRot * aNrm; vId = aId;
      }`;
    const fs = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      varying vec3 vN; varying float vId;
      uniform float uBack; uniform float uFade; uniform float uTime; uniform vec3 uKey;
      float lobe(vec3 d, vec3 dir, float p){ return pow(max(dot(d, normalize(dir)), 0.0), p); }
      vec3 env(vec3 d){
        vec3 c = vec3(0.05, 0.03, 0.06) + vec3(0.10, 0.05, 0.09) * (d.y * 0.5 + 0.5);
        c += vec3(1.0, 0.30, 0.42) * lobe(d, vec3(-0.75, 0.45, 0.5), 11.0) * 3.0;
        c += vec3(1.0, 0.70, 0.20) * lobe(d, vec3(0.8, 0.5, 0.3), 11.0) * 3.0;
        c += vec3(0.20, 0.86, 1.0) * lobe(d, vec3(0.1, -0.55, 0.8), 10.0) * 2.8;
        c += vec3(0.62, 0.45, 1.0) * lobe(d, vec3(-0.3, 0.85, -0.45), 10.0) * 2.8;
        c += vec3(0.78, 1.0, 0.40) * lobe(d, vec3(0.5, -0.2, -0.8), 11.0) * 2.4;
        c += vec3(1.0, 0.48, 0.84) * lobe(d, vec3(-0.6, -0.6, -0.4), 11.0) * 2.4;
        c += vec3(1.0) * lobe(d, uKey, 60.0) * 4.0;
        float a = atan(d.z, d.x);
        c += vec3(1.0, 0.96, 0.92) * smoothstep(0.93, 1.0, 1.0 - abs(d.y - 0.28 - 0.08 * sin(a * 3.0 + uTime * 0.35))) * 0.9;
        return c;
      }
      vec3 tone(vec3 c){ c = 1.0 - exp(-c * 1.7); return pow(c, vec3(0.92)); }
      void main(){
        vec3 N = normalize(vN);
        bool front = N.z > 0.0;
        if ((uBack > 0.5) == front) discard;
        vec3 V = vec3(0.0, 0.0, 1.0);
        vec3 col; float alpha;
        float j = vId;
        if (!front) {
          vec3 n = -N;
          vec3 d = reflect(-V, n);
          d = normalize(d + vec3(0.0, 0.25, 0.0) + 0.35 * vec3(cos(j * 6.28 + uTime * 0.2), 0.0, sin(j * 6.28)));
          float k = 0.16;
          col = vec3(env(normalize(d + vec3(k, 0.0, 0.0))).r, env(d).g, env(normalize(d - vec3(k, 0.0, 0.0))).b);
          col = tone(col * 0.9);
          alpha = 0.72;
        } else {
          float cv = max(dot(N, V), 0.0);
          float fr = 0.10 + 0.90 * pow(1.0 - cv, 4.0);
          vec3 refl = env(reflect(-V, N));
          vec3 nb = normalize(-N + vec3(0.0, 0.85, 0.0) + 0.45 * vec3(sin(j * 40.0), 0.0, cos(j * 23.0)));
          vec3 rr = reflect(refract(-V, N, 1.0 / 2.18), nb);
          vec3 rg = reflect(refract(-V, N, 1.0 / 2.42), nb);
          vec3 rb = reflect(refract(-V, N, 1.0 / 2.72), nb);
          vec3 tr = vec3(env(rr).r, env(rg).g, env(rb).b);
          col = tone(mix(tr * 1.05, refl, fr));
          alpha = 0.78;
        }
        gl_FragColor = vec4(col * alpha, alpha) * uFade;
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    try {
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { return null; }
    const data = [];
    const rand = F.map((f, i) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1);
    F.forEach((f, fi) => {
      const n = FN[fi], fr = rand[fi];
      for (let i = 1; i < f.length - 1; i++) for (const v of [f[0], f[i], f[i + 1]]) data.push(V[v][0], V[v][1], V[v][2], n[0], n[1], n[2], fr);
    });
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const count = data.length / 7;
    gl.useProgram(prog);
    const at = (name, size, off) => { const l = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, 28, off); };
    at('aPos', 3, 0); at('aNrm', 3, 12); at('aId', 1, 24);
    const u = n => gl.getUniformLocation(prog, n);
    const uRot = u('uRot'), uScale = u('uScale'), uBack = u('uBack'), uFade = u('uFade'), uTime = u('uTime'), uKey = u('uKey');
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return {
      draw(W, H, rotM, scale, fade, time, key) {
        gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        if (fade <= 0) return;
        gl.uniformMatrix3fv(uRot, false, rotM);
        gl.uniform2f(uScale, scale / (W / 2), scale / (H / 2));
        gl.uniform1f(uFade, fade); gl.uniform1f(uTime, time); gl.uniform3f(uKey, key[0], key[1], key[2]);
        gl.uniform1f(uBack, 1); gl.drawArrays(gl.TRIANGLES, 0, count);
        gl.uniform1f(uBack, 0); gl.drawArrays(gl.TRIANGLES, 0, count);
      }
    };
  };

  /* ---------- The stone: WebGL body plus a 2D layer of nodes, edges and packets ---------- */
  const glc = document.getElementById('gl');
  const cv = document.getElementById('gem');
  const ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  const pauseBtn = document.getElementById('pause');

  if (ctx) {
    const glr = glc ? makeGL(glc) : null;
    if (!glr && glc) glc.hidden = true;
    let W = 0, H = 0, dpr = 1;
    let yaw = 0.35, pitch = 0.2, vel = 0, dragging = false, lastX = 0, lastY = 0, lastT = 0;
    let lx = -0.45, ly = 0.55, tlx = lx, tly = ly;
    let running = !reduce.matches, inView = true, paused = false, raf = 0, prev = 0;
    let start = performance.now();
    const R = new Float32Array(V.length * 3), Pr = new Float32Array(V.length * 2);
    const packets = [], pings = [];
    const rnd = (a, b) => a + Math.random() * (b - a);
    const HUES = ['255,94,122', '255,181,71', '198,243,107', '61,220,255', '156,123,255', '255,123,213'];

    const size = () => {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      for (const c of [cv, glc]) if (c && (c.width !== W || c.height !== H)) { c.width = W; c.height = H; }
    };
    const scaleNow = () => Math.min(W * 0.44, H * 0.64);
    const project = () => {
      const c = Math.cos(yaw), s = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const scale = scaleNow(), cx = W / 2, cy = H / 2;
      for (let i = 0; i < V.length; i++) {
        const [x, y, z] = V[i];
        const x1 = x * c + z * s, z1 = -x * s + z * c;
        const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
        R[i * 3] = x1; R[i * 3 + 1] = y2; R[i * 3 + 2] = z2;
        const k = DIST / (DIST - z2);
        Pr[i * 2] = cx + x1 * k * scale; Pr[i * 2 + 1] = cy - y2 * k * scale;
      }
      // column-major rotation matrix for the shader (same rotation as above)
      return { c, s, cp, sp, m: new Float32Array([c, s * sp, -s * cp, 0, cp, sp, s, -c * sp, c * cp]), scale };
    };
    const rotN = (n, r) => {
      const x1 = n[0] * r.c + n[2] * r.s, z1 = -n[0] * r.s + n[2] * r.c;
      return [x1, n[1] * r.cp - z1 * r.sp, n[1] * r.sp + z1 * r.cp];
    };
    const path = f => {
      ctx.beginPath();
      for (let i = 0; i < f.length; i++) { const v = f[i]; i ? ctx.lineTo(Pr[v * 2], Pr[v * 2 + 1]) : ctx.moveTo(Pr[v * 2], Pr[v * 2 + 1]); }
      ctx.closePath();
    };
    const spawn = () => {
      const a = (Math.random() * V.length) | 0, b = nbr[a][(Math.random() * nbr[a].length) | 0];
      return { a, b, t: 0, dur: rnd(650, 1250), hops: (rnd(3, 8)) | 0, trail: [], hue: HUES[(Math.random() * HUES.length) | 0] };
    };
    for (let i = 0; i < 9; i++) packets.push(spawn());

    const draw = (now, animate) => {
      const p = animate ? Math.min(1, (now - start) / 1900) : 1;
      const rot = project();
      const nrm = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
      const key = nrm(lx, ly, 0.75);
      const faceIn = Math.max(0, Math.min(1, (p - 0.45) / 0.55));
      if (glr) glr.draw(W, H, rot.m, rot.scale, faceIn, now / 1000, key);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = 'round';
      const NR = FN.map(n => rotN(n, rot));
      const orb = now / 1000 * 0.9;
      const lights = [key, nrm(0.75, 0.65, 0.35), nrm(Math.cos(orb) * 0.8, 0.35 + 0.3 * Math.sin(orb * 0.7), 0.6)];
      let best = 0.72, bestF = -1;
      for (let i = 0; i < F.length; i++) {
        const n = NR[i]; if (n[2] <= 0) continue;
        let spec = 0;
        for (const [Lx, Ly, Lz] of lights) { const d = n[0] * Lx + n[1] * Ly + n[2] * Lz; spec += Math.pow(Math.max(0, 2 * d * n[2] - Lz), 16); }
        if (spec > best) { best = spec; bestF = i; }
        if (!glr && faceIn > 0) {   // 2D fallback body when WebGL is not available
          path(F[i]);
          ctx.fillStyle = `rgba(255,236,220,${(0.04 + 0.1 * Math.max(0, n[1])) * faceIn})`; ctx.fill();
          if (spec > 0.05) { ctx.fillStyle = `hsla(${((Math.atan2(n[1], n[0]) * 114.6 + i * 23 + yaw * 40) % 360 + 360) % 360},92%,66%,${Math.min(0.55, spec * 0.6) * faceIn})`; ctx.fill(); }
        }
      }

      // edges, drawn in from the culet upward on first load
      ctx.lineWidth = Math.max(1, dpr * 0.9);
      for (let e = 0; e < E.length; e++) {
        const st = EH[e] * 0.55, local = Math.max(0, Math.min(1, (p - st) / 0.42));
        if (local <= 0) continue;
        let [a, b] = E[e];
        if (height(a) > height(b)) [a, b] = [b, a];
        const z = (R[a * 3 + 2] + R[b * 3 + 2]) / 2;
        const al = (glr ? 0.10 : 0.16) + (glr ? 0.38 : 0.5) * Math.max(0, (z + 1) / 2);
        const ax = Pr[a * 2], ay = Pr[a * 2 + 1];
        ctx.strokeStyle = `rgba(255,246,236,${al})`;
        ctx.beginPath(); ctx.moveTo(ax, ay);
        ctx.lineTo(ax + (Pr[b * 2] - ax) * local, ay + (Pr[b * 2 + 1] - ay) * local);
        ctx.stroke();
      }
      for (let i = 0; i < V.length; i++) {
        const al = Math.max(0, Math.min(1, (p - height(i) * 0.55) / 0.25));
        if (!al) continue;
        const z = (R[i * 3 + 2] + 1) / 2;
        ctx.fillStyle = `rgba(255,248,240,${al * (0.3 + 0.7 * z)})`;
        ctx.beginPath(); ctx.arc(Pr[i * 2], Pr[i * 2 + 1], dpr * (1.1 + 1.4 * z), 0, 6.283); ctx.fill();
      }

      // one sparkle where a facet throws the light straight at the eye
      if (bestF >= 0 && faceIn > 0.9) {
        let sx = 0, sy = 0; for (const v of F[bestF]) { sx += Pr[v * 2]; sy += Pr[v * 2 + 1]; }
        sx /= F[bestF].length; sy /= F[bestF].length;
        const k = Math.min(1, (best - 0.72) / 0.4), len = dpr * (12 + 30 * k);
        ctx.globalCompositeOperation = 'lighter';
        for (const [dx, dy, l] of [[1, 0, 1], [0, 1, 1], [0.707, 0.707, 0.45], [0.707, -0.707, 0.45]]) {
          const g = ctx.createLinearGradient(sx - dx * len * l, sy - dy * len * l, sx + dx * len * l, sy + dy * len * l);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.95 * k})`); g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = g; ctx.lineWidth = dpr * 1.5;
          ctx.beginPath(); ctx.moveTo(sx - dx * len * l, sy - dy * len * l); ctx.lineTo(sx + dx * len * l, sy + dy * len * l); ctx.stroke();
        }
        const h = ctx.createRadialGradient(sx, sy, 0, sx, sy, dpr * 10);
        h.addColorStop(0, `rgba(255,255,255,${0.95 * k})`); h.addColorStop(0.4, `rgba(255,200,150,${0.4 * k})`); h.addColorStop(1, 'rgba(255,150,120,0)');
        ctx.fillStyle = h; ctx.beginPath(); ctx.arc(sx, sy, dpr * 10, 0, 6.283); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      if (!animate || p < 1) return;
      ctx.globalCompositeOperation = 'lighter';
      for (const k of pings) {
        const age = (now - k.t0) / 700; if (age > 1) continue;
        ctx.strokeStyle = `rgba(${k.hue},${0.45 * (1 - age)})`; ctx.lineWidth = dpr;
        ctx.beginPath(); ctx.arc(Pr[k.v * 2], Pr[k.v * 2 + 1], dpr * (2 + 11 * age), 0, 6.283); ctx.stroke();
      }
      for (const q of packets) {
        const u = q.t / q.dur, x = Pr[q.a * 2] + (Pr[q.b * 2] - Pr[q.a * 2]) * u, y = Pr[q.a * 2 + 1] + (Pr[q.b * 2 + 1] - Pr[q.a * 2 + 1]) * u;
        q.trail.push(x, y); if (q.trail.length > 14) q.trail.splice(0, 2);
        for (let j = 0; j < q.trail.length; j += 2) {
          const f = (j + 2) / q.trail.length;
          ctx.fillStyle = `rgba(${q.hue},${0.55 * f})`;
          ctx.beginPath(); ctx.arc(q.trail[j], q.trail[j + 1], dpr * 1.8 * f, 0, 6.283); ctx.fill();
        }
        const g = ctx.createRadialGradient(x, y, 0, x, y, dpr * 8);
        g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.35, `rgba(${q.hue},.8)`); g.addColorStop(1, `rgba(${q.hue},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, dpr * 8, 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const step = dt => {
      if (!dragging) { yaw += (0.2 + vel) * dt; vel *= Math.exp(-dt * 1.8); }
      lx += (tlx - lx) * Math.min(1, dt * 3); ly += (tly - ly) * Math.min(1, dt * 3);
      const now = performance.now();
      for (const q of packets) {
        q.t += dt * 1000;
        if (q.t >= q.dur) {
          if (pings.length > 24) pings.shift();
          pings.push({ v: q.b, t0: now, hue: q.hue });
          q.hops--;
          if (q.hops <= 0) Object.assign(q, spawn());
          else { const opts = nbr[q.b].filter(x => x !== q.a); q.a = q.b; q.b = opts[(Math.random() * opts.length) | 0]; q.t = 0; q.dur = rnd(650, 1250); }
        }
      }
    };
    const frame = now => {
      raf = 0;
      const dt = Math.min(0.05, (now - (prev || now)) / 1000); prev = now;
      step(dt); draw(now, true);
      if (running && inView && !paused && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const play = () => { if (!raf && running && inView && !paused && !document.hidden) { prev = 0; raf = requestAnimationFrame(frame); } };
    const still = () => { size(); draw(performance.now(), false); };
    const setMotion = () => {
      running = !reduce.matches;
      root.classList.toggle('still', !running);
      if (pauseBtn) pauseBtn.hidden = !running;
      if (running) { start = performance.now(); play(); } else { if (raf) cancelAnimationFrame(raf); raf = 0; still(); }
    };

    new ResizeObserver(() => { size(); if (!raf) draw(performance.now(), running && !paused); }).observe(cv);
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { inView = es[0].isIntersecting; play(); }).observe(cv);
    document.addEventListener('visibilitychange', play);
    if (reduce.addEventListener) reduce.addEventListener('change', setMotion);
    if (pauseBtn) pauseBtn.addEventListener('click', () => {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.textContent = paused ? 'Play animation' : 'Pause animation';
      if (!paused) play();
    });

    const fig = cv.parentElement;
    fig.addEventListener('pointerdown', e => {
      dragging = true; lastX = e.clientX; lastY = e.clientY; lastT = performance.now(); vel = 0;
      if (fig.setPointerCapture) fig.setPointerCapture(e.pointerId);
    });
    fig.addEventListener('pointermove', e => {
      if (!dragging) return;
      const t = performance.now(), dx = e.clientX - lastX, dy = e.clientY - lastY, dts = Math.max(0.008, (t - lastT) / 1000);
      yaw += dx * 0.009; pitch = Math.max(-0.35, Math.min(0.9, pitch + dy * 0.006));
      vel = Math.max(-6, Math.min(6, (dx * 0.009) / dts * 0.6));
      lastX = e.clientX; lastY = e.clientY; lastT = t;
      if (!raf) { size(); draw(performance.now(), running && !paused); }
    });
    const end = () => { dragging = false; };
    fig.addEventListener('pointerup', end); fig.addEventListener('pointercancel', end);

    // the light, the title's colour and the title's tilt follow the pointer across the hero
    const hero = document.querySelector('.hero-wrap'), title = document.getElementById('hero-title'), h1 = document.getElementById('name');
    if (hero) hero.addEventListener('pointermove', e => {
      const r = cv.getBoundingClientRect();
      tlx = Math.max(-1.2, Math.min(1.2, (e.clientX - (r.left + r.width / 2)) / r.width * 1.6));
      tly = Math.max(-1.2, Math.min(1.2, -(e.clientY - (r.top + r.height / 2)) / r.height * 1.6));
      if (!reduce.matches && fine.matches && title) {
        const hr = hero.getBoundingClientRect(), nx = (e.clientX - hr.left) / hr.width - 0.5, ny = (e.clientY - hr.top) / hr.height - 0.5;
        title.classList.add('tilted');
        title.style.setProperty('--ty', (nx * 10).toFixed(2) + 'deg');
        title.style.setProperty('--tx', (-ny * 8).toFixed(2) + 'deg');
        if (h1) h1.style.setProperty('--hx', (30 + nx * 70).toFixed(1) + '%');
      }
      if (!running && !raf) still();
    });
    if (hero) hero.addEventListener('pointerleave', () => { if (title) title.classList.remove('tilted'); });

    size();
    setMotion();
  }

  /* ---------- 3D tilt panels (mouse and pen only) ---------- */
  for (const el of document.querySelectorAll('.tilt')) {
    el.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch' || reduce.matches) return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', ((0.5 - y) * 9).toFixed(2) + 'deg');
      el.style.setProperty('--ry', ((x - 0.5) * 11).toFixed(2) + 'deg');
      el.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      el.classList.add('on');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.classList.remove('on'); });
  }

  /* ---------- Sections swing up into place ---------- */
  const rises = document.querySelectorAll('.rise');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }, { rootMargin: '0px 0px -12% 0px' });
    rises.forEach(r => io.observe(r));
  } else rises.forEach(r => r.classList.add('in'));
  // a section reached by a link or by the find bar is shown at once
  window.addEventListener('hashchange', () => { const t = document.querySelector(location.hash); if (t) t.classList.add('in'); });
  document.addEventListener('focusin', e => { const s = e.target.closest && e.target.closest('.rise'); if (s) s.classList.add('in'); });

  /* ---------- The spectrum line down the page ---------- */
  const flow = document.querySelector('.flow'), beam = document.querySelector('.beam');
  const marks = Array.from(document.querySelectorAll('[data-mark]'));
  if (flow && beam) {
    let ticking = false;
    const update = () => {
      ticking = false;
      if (reduce.matches) { marks.forEach(m => m.classList.add('lit')); return; }
      const vh = window.innerHeight, maxY = Math.max(1, document.documentElement.scrollHeight - vh);
      const tail = Math.max(0, Math.min(1, (window.scrollY - (maxY - vh)) / vh));
      const line = vh * (0.62 + 0.38 * tail) + (window.scrollY >= maxY - 2 ? vh : 0);
      const r = flow.getBoundingClientRect();
      beam.style.setProperty('--p', Math.max(0, Math.min(1, (line - r.top) / r.height)).toFixed(4));
      for (const m of marks) m.classList.toggle('lit', m.getBoundingClientRect().top + 24 < line);
    };
    const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    if (reduce.addEventListener) reduce.addEventListener('change', req);
    update();
  }
}
