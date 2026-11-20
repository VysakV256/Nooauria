const vertexSource = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vUv;
uniform vec2 uResolution;
uniform vec4 uAmbient;
uniform vec4 uAuriscape;
uniform vec4 uField;
uniform float uMotion;

float hash(vec2 p) {
  vec3 seed = fract(vec3(p.xyx) * 0.1031);
  seed += dot(seed, seed.yzx + 19.19);
  return fract((seed.x + seed.y) * seed.z);
}

float noise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 blend = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(cell), hash(cell + vec2(1.0, 0.0)), blend.x),
    mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), blend.x),
    blend.y
  );
}

float band(vec3 bands, float position) {
  return mix(
    mix(bands.x, bands.y, smoothstep(0.0, 0.5, position)),
    bands.z,
    smoothstep(0.5, 1.0, position)
  );
}

float spores(vec2 p, float density, float radius, float time) {
  vec2 cell = floor(p);
  float seed = hash(cell + 8.4);
  vec2 center = vec2(hash(cell + 3.1), hash(cell + 11.5)) * 0.6 + 0.2;
  vec2 offset = fract(p) - center;
  float point = 1.0 - smoothstep(radius * 0.32, radius, length(offset));
  float blink = 0.56 + 0.34 * sin(time * 0.75 + seed * 23.0);
  return point * blink * smoothstep(1.0 - density, 1.0, seed);
}

void main() {
  vec2 uv = vUv;
  float x = uv.x - 0.5;
  float time = uField.x;
  float growth = uField.y;
  float hyper = uField.z;
  float immersive = uField.w;
  float ambientAir = uAmbient.z;
  float ambientWeight = uAmbient.x;
  float beat = uAuriscape.w;
  float scale = uResolution.x / max(1.0, uResolution.y);
  vec2 field = vec2(x * scale, uv.y - 0.45);
  float edge = smoothstep(0.0, 0.14, uv.x) * smoothstep(0.0, 0.14, 1.0 - uv.x);
  float upperLight = smoothstep(0.13, 0.37, uv.y) * (1.0 - smoothstep(0.75, 1.0, uv.y));

  // Turbulence in the surrounding air opens and thickens the green canopy.
  vec2 wind = vec2(x * 4.7 - time * 0.065, uv.y * 3.2 + time * 0.055);
  float air = 0.67 * noise(wind) + 0.33 * noise(wind * 2.13 + 8.6);
  float taper = 1.0 - smoothstep(0.12, 0.95, abs(field.x));
  float rayX = uv.x + (1.0 - uv.y) * (x * 0.39 + 0.14) + 0.11 * (air - 0.5);
  float rays = pow(noise(vec2(rayX * 22.0 + time * 0.027, 8.1)), 2.8);
  float haze = smoothstep(0.32, 0.91, air) * taper * upperLight;
  float rayLight = rays * upperLight * (0.025 + ambientWeight * 0.16 + uAmbient.w * 0.085);
  vec3 ink = vec3(0.38, 0.76, 0.43) * haze * (0.04 + uAmbient.y * 0.21 + growth * 0.08);
  ink += vec3(0.65, 0.95, 0.34) * rayLight;

  // Low frequencies sit in larger curves. The upper register draws fine filaments.
  float crest = 0.14 * sin(uv.x * 3.14159);
  float center = 0.3 + crest + 0.031 * sin(uv.x * 7.1 + time * 0.39);
  float feather = 0.0024 + 0.72 / max(200.0, uResolution.y);

  for (int layer = 0; layer < 6; layer++) {
    float index = float(layer);
    float register = index / 5.0;
    float source = band(uAmbient.xyz, register);
    float generated = band(uAuriscape.xyz, register);
    float phase = uv.x * (7.4 + index * 1.47) - time * (0.56 + register * 0.26) + index * 0.55;
    float sweep = (0.03 + generated * 0.077 + source * 0.014) * sin(phase);
    sweep += (0.011 + ambientAir * 0.014 + hyper * 0.013) * sin(1.75 * phase + index);
    sweep += (air - 0.5) * (0.035 + source * 0.083);
    float beatTravel = 0.52 + 0.48 * sin(uv.x * 6.5 - index * 0.39);
    float beatLift = beat * uMotion * beatTravel * (0.014 + (1.0 - register) * 0.031);
    float spacing = 0.043 + growth * 0.018 + immersive * 0.016;
    float y = center + register * spacing * 5.0 + sweep + beatLift;
    float distanceToRidge = abs(uv.y - y);
    float width = feather * (1.03 - register * 0.42 + generated * 0.7);
    float strand = 1.0 - smoothstep(width * 0.16, width, distanceToRidge);
    float glow = 1.0 - smoothstep(0.0, width * (5.6 + immersive * 3.2), distanceToRidge);
    float knots = 0.52 + 0.48 * sin(phase * 1.02 + index * 1.2);
    float trail = 1.0 - smoothstep(width, width * 10.0, abs(uv.y - y + 0.026 + register * 0.015));
    vec3 green = mix(vec3(0.28, 0.79, 0.70), vec3(0.71, 0.98, 0.50), register);
    vec3 amber = mix(vec3(0.92, 0.65, 0.26), vec3(0.76, 0.95, 0.43), register);
    vec3 color = mix(green, amber, min(1.0, generated * 0.66 + beat * beatTravel * 0.62));
    float amplitude = (0.19 + generated * 0.47 + source * 0.13 + beat * 0.19 * beatTravel);
    amplitude *= mix(1.0, knots, 0.58) * edge;
    ink += color * (strand * 0.66 + glow * 0.34 + trail * immersive * (0.08 + 0.10 * hyper)) * amplitude;
  }

  // Fine highlights sample the top of the two spectra at different scales.
  float dust = spores(field * 27.0 + vec2(-time * 0.23, -time * 0.18), 0.23 + ambientAir * 0.42, 0.10, time);
  float sparks = spores(field * 13.5 + vec2(time * 0.13, -time * 0.09), 0.25 + growth * 0.24, 0.081, time + 2.1);
  ink += vec3(0.56, 0.97, 0.48) * dust * (0.1 + ambientAir * 0.28 + uAmbient.w * 0.16) * upperLight;
  ink += vec3(1.0, 0.78, 0.36) * sparks * (0.12 + uAuriscape.z * 0.32 + beat * 0.24) * edge;

  ink *= 0.8 + immersive * 0.45 + growth * 0.13;
  float brightness = max(ink.r, max(ink.g, ink.b));
  float alpha = min(0.79, brightness);
  gl_FragColor = vec4(ink / max(brightness, 0.001), alpha);
}
`;

const MAX_PIXELS = 1_100_000;
const SPECTRUM_KEYS = ['low', 'mid', 'high'];
const clamp = (value) => Math.min(1, Math.max(0, Number(value) || 0));
const nearSilence = (band) => band < 0.002;

function createPipeline(gl) {
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  const quad = gl.createBuffer();

  function release() {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    if (quad) gl.deleteBuffer(quad);
  }

  if (!vertex || !fragment || !program || !quad) {
    release();
    return null;
  }

  gl.shaderSource(vertex, vertexSource);
  gl.shaderSource(fragment, fragmentSource);
  gl.compileShader(vertex);
  gl.compileShader(fragment);
  if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS) ||
      !gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) {
    release();
    return null;
  }

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    release();
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(position);
  gl.clearColor(0, 0, 0, 0);
  const uniforms = Object.fromEntries(
    ['Resolution', 'Ambient', 'Auriscape', 'Field', 'Motion'].map(
      (name) => [name, gl.getUniformLocation(program, 'u' + name)]
    )
  );
  return { uniforms, release };
}

export function createAuriscapeShader(canvas) {
  let gl;
  try {
    gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: false });
  } catch {
    // The caller retains the canvas 2D visualizer when WebGL is unavailable.
  }
  if (!gl) return { available: false, update() {}, destroy() {} };

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ambient = new Float32Array(4);
  const auriscape = new Float32Array(4);
  let pipeline = null;
  let lastFrame;
  let clock = 0;
  let width = 0;
  let height = 0;
  let boundsDirty = true;
  let visible = false;
  let lastGrowth;
  let lastMode;
  let lastImmersive;
  let lastMotion;

  function preparePipeline() {
    try {
      pipeline = createPipeline(gl);
    } catch {
      pipeline = null;
    }
  }
  preparePipeline();

  function sizeCanvas() {
    const { width: cssWidth, height: cssHeight } = canvas.getBoundingClientRect();
    boundsDirty = false;
    if (cssWidth <= 0 || cssHeight <= 0) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.65, Math.sqrt(MAX_PIXELS / (cssWidth * cssHeight)));
    const nextWidth = Math.max(1, Math.round(cssWidth * ratio));
    const nextHeight = Math.max(1, Math.round(cssHeight * ratio));
    if (nextWidth === width && nextHeight === height) return;
    width = canvas.width = nextWidth;
    height = canvas.height = nextHeight;
    gl.viewport(0, 0, width, height);
  }

  function markBoundsDirty() {
    boundsDirty = true;
  }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(markBoundsDirty) : null;
  observer?.observe(canvas);
  window.addEventListener('resize', markBoundsDirty);

  function onContextLost(event) {
    event.preventDefault();
    pipeline = null;
    visible = false;
  }

  function onContextRestored() {
    preparePipeline();
    if (pipeline) gl.viewport(0, 0, width, height);
    boundsDirty = true;
    lastFrame = undefined;
  }

  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  return {
    get available() { return pipeline !== null; },
    update({ ambient: room, auriscape: generated, growth, playing, mode, immersive, enabled = true }) {
      if (!pipeline) return;
      if (!enabled) {
        if (visible) gl.clear(gl.COLOR_BUFFER_BIT);
        visible = false;
        lastFrame = undefined;
        ambient.fill(0);
        auriscape.fill(0);
        return;
      }

      const now = performance.now();
      const reducedMotion = motionPreference.matches;
      const viewChanged = !visible || boundsDirty || mode !== lastMode ||
        immersive !== lastImmersive || reducedMotion !== lastMotion;
      if (!playing && !viewChanged && growth === lastGrowth && ambient.every(nearSilence) && auriscape.every(nearSilence)) return;
      const interval = reducedMotion || !playing ? 100 : 18;
      if (!viewChanged && lastFrame !== undefined && now - lastFrame < interval) return;
      const elapsed = lastFrame === undefined ? 16 : Math.min(150, now - lastFrame);
      lastFrame = now;
      if (boundsDirty) sizeCanvas();
      if (!width || !height) return;

      const response = 1 - Math.exp(-elapsed / (reducedMotion ? 440 : 150));
      for (let index = 0; index < SPECTRUM_KEYS.length; index++) {
        const key = SPECTRUM_KEYS[index];
        ambient[index] += ((playing ? clamp(room?.[key]) : 0) - ambient[index]) * response;
        auriscape[index] += ((playing ? clamp(generated?.[key]) : 0) - auriscape[index]) * response;
      }
      const ambientTarget = playing ? clamp(0.72 * clamp(room?.level) + 0.28 * clamp(room?.onset)) : 0;
      ambient[3] += (ambientTarget - ambient[3]) * response;
      const pulse = playing ? clamp(0.83 * clamp(generated?.beat) + 0.17 * clamp(generated?.level)) : 0;
      auriscape[3] = reducedMotion
        ? auriscape[3] + (pulse * 0.36 - auriscape[3]) * response
        : Math.max(pulse, auriscape[3] * Math.exp(-elapsed / 143));

      if (playing && !reducedMotion) clock = (clock + elapsed / 1000) % 1800;
      const uniforms = pipeline.uniforms;
      gl.uniform2f(uniforms.Resolution, width, height);
      gl.uniform4fv(uniforms.Ambient, ambient);
      gl.uniform4fv(uniforms.Auriscape, auriscape);
      gl.uniform4f(uniforms.Field, clock, clamp(growth), mode === 'hyperforest' ? 1 : 0, immersive ? 1 : 0);
      gl.uniform1f(uniforms.Motion, reducedMotion ? 0 : 1);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      lastGrowth = growth;
      lastMode = mode;
      lastImmersive = immersive;
      lastMotion = reducedMotion;
      visible = true;
    },
    destroy() {
      observer?.disconnect();
      window.removeEventListener('resize', markBoundsDirty);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (pipeline) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        pipeline.release();
        pipeline = null;
      }
    },
  };
}
