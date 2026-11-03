// Ink-drop drawing for the Hakkımızda team plate.
//   1. Navy drops fall onto the page one after another; each throws a few small splashes.
//   2. Each drop spreads as wet ink with a fingered, paper-fibre edge, fast at first, then slowing.
//   3. Where the ink has reached, the pencil drawing is drawn in: the darkest strokes first,
//      then the lighter shading. The wet navy dries back to graphite and leaves a faint stain.
// A fragment shader works out, per pixel, when the ink arrives there; the rest follows from that.
// Markup: <figure data-murekkep data-drops="x,y,delayMs,radius; ..."><img ...></figure>
//   x, y: impact point as fractions of the drawing (y down); radius: fraction of its width.
// Without WebGL, or with reduced motion, the drawing is simply shown.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Review hook: ?murekkep=<ms> renders that moment and stops ("son" = finished).
const freeze = new URLSearchParams(location.search).get('murekkep');

const MAX = 64;
const FALL = 300;   // ms a drop takes to fall
const DRAW = 950;   // ms after the ink arrives until the lightest shading is drawn

const VERT = `
attribute vec2 p;
varying vec2 v;
void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
varying vec2 v;
uniform sampler2D uTex;
uniform float uTime;
uniform float uAspect;
uniform float uLast;
uniform vec4 uDrops[${MAX}];
uniform vec2 uSeed[${MAX}];
uniform int uCount;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return s;
}

void main() {
  vec2 q = vec2(v.x * uAspect, 1.0 - v.y);           // drawing space, y down, height = 1
  float fibre = fbm(q * vec2(34.0, 22.0)) - 0.5;      // paper fibre: ink runs a little unevenly

  float T = 1e6;      // when the ink arrives here
  float conc = 0.0;   // how close to an impact (ink is densest there)
  float rim = 0.0;    // the dried edge of a blot
  float fallA = 0.0;  // a falling drop drawn here
  vec2 hl = vec2(0.0);

  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uCount) break;
    vec4 d = uDrops[i];
    vec2 c = vec2(d.x * uAspect, d.y);
    float R = d.w * uAspect;
    // The falling drop: a teardrop that speeds up, with its shadow sharpening below it.
    float s = (uTime - (d.z - ${FALL}.0)) / ${FALL}.0;
    if (d.w > 0.08 && s > 0.0 && s < 1.0) {
      float r0 = 0.012 + d.w * 0.03;
      vec2 pos = c - vec2(0.0, (1.0 - s * s) * 0.42);
      vec2 rel = q - pos;
      rel.y /= 1.0 + 0.9 * s;                          // stretches as it speeds up
      float tail = rel.y < 0.0 ? 1.0 + rel.y * -9.0 * (1.0 - s * 0.5) : 1.0;
      float body = 1.0 - smoothstep(r0 * 0.82, r0, length(vec2(rel.x * tail, rel.y)));
      float shadow = (1.0 - smoothstep(0.0, r0 * 1.6, length((q - c) * vec2(1.0, 2.2)))) * s * s * 0.35;
      fallA = max(fallA, max(body, shadow));
      hl = max(hl, vec2(body * (1.0 - smoothstep(0.0, r0 * 0.35, length(rel - vec2(-r0 * 0.35, -r0 * 0.3))))));
    }

    vec2 dv = q - c;
    float dist = length(dv);
    if (dist > R * 2.1) continue;   // too far for this blot: skip the noise
    vec2 dir = dist > 1e-5 ? dv / dist : vec2(1.0, 0.0);
    vec2 sd = uSeed[i];

    // Edge: a lumpy outline plus a few long fingers, all seamless around the circle.
    float edge = 0.78 + 0.42 * fbm(dir * 2.1 + sd) + 0.75 * pow(noise(dir * 5.5 + sd * 1.7), 5.0) + 0.16 * fibre;
    float reach = R * edge;
    float tau = 360.0 * sqrt(max(d.w, 0.01) / 0.25);
    if (dist < reach * 0.995) {
      float t = d.z - tau * log(1.0 - dist / reach);
      if (t < T) { T = t; conc = exp(-dist / (R * 0.32)); }
    }
    // Tide line: only the large blots leave one, and only once they have dried.
    if (d.w > 0.08) rim = max(rim, smoothstep(d.z + 600.0, d.z + 1500.0, uTime) * exp(-pow((reach - dist) / (R * 0.012 + 0.0015), 2.0)));

  }

  // Ink also creeps through the paper fibres into what the drops missed, slowly and faintly.
  float creep = uLast + 500.0 + 1500.0 * fbm(q * 2.6 + 3.0);
  bool wicked = creep < T;
  T = min(T, creep);

  float age = uTime - T;
  float D = texture2D(uTex, v).a;                     // darkness of the drawing here

  // The drawing is drawn in behind the ink: dark strokes first, light shading last.
  float th = 60.0 + ${DRAW}.0 * pow(1.0 - D, 1.7) + 150.0 * noise(q * 140.0);
  float drawA = D * smoothstep(th, th + 180.0, age);

  // Wet ink: dense at the front and near the impact, drying away behind it.
  float wet = age > 0.0 ? exp(-age / 900.0) : 0.0;
  float front = age > 0.0 ? exp(-age / 140.0) : 0.0;
  float grain = 0.7 + 0.6 * fbm(q * 160.0);
  float inkA = (0.46 * wet + 0.32 * front + 0.3 * conc * wet) * grain;
  if (wicked) inkA *= 0.35;
  if (!wicked && age > 0.0) inkA += 0.03 + 0.06 * rim; // the dried stain of a blot and its tide line
  inkA = clamp(inkA, 0.0, 0.9);

  vec3 ink = vec3(0.153, 0.153, 0.373);
  vec3 graphite = vec3(0.149, 0.145, 0.188);
  float a = inkA + drawA * (1.0 - inkA);
  vec3 col = (ink * inkA + graphite * drawA * (1.0 - inkA)) / max(a, 1e-4);

  // The falling drop sits on top, with a small highlight.
  col = mix(col, ink, fallA);
  a = max(a, fallA);
  col = mix(col, vec3(0.85, 0.87, 0.95), hl.x * 0.8);

  gl_FragColor = vec4(col * a, a);
}`;

function rng(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

// Main drops plus their splashes, as [x, y, impactMs, radius].
function buildDrops(spec, aspect) {
  const r = rng(1954);
  const out = [];
  spec.forEach(([x, y, delay, size]) => {
    const impact = delay + FALL;
    out.push([x, y, impact, size]);
    const n = 5 + ((r() * 4) | 0);
    for (let k = 0; k < n && out.length < MAX; k++) {
      const ang = r() * Math.PI * 2;
      const dist = size * (0.55 + r() * 0.6);
      out.push([
        x + Math.cos(ang) * dist,
        y + Math.sin(ang) * dist * aspect,
        impact + 25 + r() * 60,
        size * (0.05 + r() * 0.07),
      ]);
    }
  });
  return out.slice(0, MAX);
}

class InkDrawing {
  constructor(fig) {
    this.fig = fig;
    this.img = fig.querySelector('img');
    this.aspect = this.img.naturalWidth / this.img.naturalHeight;
    const spec = (fig.dataset.drops || '0.5,0.6,0,0.4').split(';').map((s) => s.split(',').map(Number));
    this.drops = buildDrops(spec, this.aspect);
    this.last = Math.max(...this.drops.map((d) => d[2]));
    this.end = this.last + 500 + 1500 + DRAW + 300;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'murekkep__tuval';
    this.canvas.setAttribute('aria-hidden', 'true');
    const gl = this.canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) throw new Error('no webgl');
    this.gl = gl;
    this.program = this.link(VERT, FRAG);
    gl.useProgram(this.program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.program, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const u = (n) => gl.getUniformLocation(this.program, n);
    this.uTime = u('uTime');
    gl.uniform1i(u('uTex'), 0);
    gl.uniform1f(u('uAspect'), this.aspect);
    gl.uniform1f(u('uLast'), this.last);
    gl.uniform1i(u('uCount'), this.drops.length);
    gl.uniform4fv(u('uDrops[0]'), new Float32Array(this.drops.flat()));
    const seeds = rng(7);
    gl.uniform2fv(u('uSeed[0]'), new Float32Array(this.drops.flatMap(() => [seeds() * 50, seeds() * 50])));

    fig.append(this.canvas);
    fig.classList.add('is-live');
    this.t = 0;
    new ResizeObserver(() => this.resize()).observe(this.img);
  }

  link(vs, fs) {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }

  resize() {
    const box = this.img.getBoundingClientRect();
    if (!box.width) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(box.width * dpr);
    this.canvas.height = Math.round(box.height * dpr);
    this.canvas.style.height = `${box.height}px`; // covers the drawing, not its caption
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.draw(this.t);
  }

  draw(t) {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(this.uTime, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  start() {
    if (reduce || freeze) {
      this.t = freeze && freeze !== 'son' ? Number(freeze) : 1e7;
      this.draw(this.t);
      return;
    }
    const t0 = performance.now();
    const tick = (now) => {
      this.t = now - t0;
      this.draw(this.t);
      if (this.t < this.end) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    io.unobserve(e.target);
    setTimeout(() => e.target._ink.start(), 200);
  }
}, { threshold: 0.3 });

for (const fig of document.querySelectorAll('[data-murekkep]')) {
  const img = fig.querySelector('img');
  const ready = img.complete && img.naturalWidth
    ? Promise.resolve()
    : new Promise((r) => img.addEventListener('load', r, { once: true }));
  ready.then(() => {
    if (reduce) return; // the drawing is shown as it is
    try {
      fig._ink = new InkDrawing(fig);
      fig._ink.t = 0;
      fig._ink.resize();
      io.observe(fig);
    } catch {
      fig.querySelector('.murekkep__tuval')?.remove();
      fig.classList.remove('is-live');
    }
  });
}
