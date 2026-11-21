const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const turquoise = '102, 234, 221';
const coolCyan = '80, 214, 232';
const ice = '170, 242, 255';
const bands = ['low', 'mid', 'high'];
const nearSilence = value => value < 0.004;
const neonPalette = [
  { glow: coolCyan, core: ice, band: 2 },
  { glow: '158, 106, 235', core: '216, 183, 249', band: 1 },
  { glow: turquoise, core: '184, 255, 242', band: 2 },
  { glow: '237, 174, 85', core: '250, 222, 164', band: 0 },
];

const meter = (signal, key) => {
  const value = signal?.[key];
  return Number.isFinite(value) ? clamp(value) : 0;
};

function randomGenerator(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function createNeonEcosystem() {
  const random = randomGenerator(610497);
  const anchors = [
    [0.14, 0.43, 0.40, 0],
    [0.30, 0.59, -0.76, 3],
    [0.39, 0.33, 0.54, 1],
    [0.52, 0.53, -0.49, 2],
    [0.64, 0.29, 0.61, 0],
    [0.71, 0.63, -1.02, 1],
    [0.85, 0.44, 2.77, 2],
    [0.91, 0.63, 3.41, 3],
  ];

  return anchors.map(([x, y, angle, palette]) => ({
    x, y, angle, palette,
    phase: random() * Math.PI * 2,
    length: 0.85 + random() * 0.32,
    arms: [0, 0.76, -1.03].map((offset, index) => ({
      offset,
      length: index === 0 ? 1 : 0.43 + random() * 0.28,
      knots: Array.from({ length: 7 - index }, (_, step) => (
        step === 0 ? 0 : (random() * 2 - 1) * (step % 2 ? 0.18 : 0.10)
      )),
    })),
  }));
}

const ecosystem = createNeonEcosystem();

function neonPoint(x, y, angle, length, knots, tension, progress) {
  const position = progress * (knots.length - 1);
  const index = Math.floor(position);
  const advance = length * progress;
  const offset = (knots[index] + (knots[index + 1] - knots[index]) * (position - index)) * length * tension;
  return {
    x: x + Math.cos(angle) * advance - Math.sin(angle) * offset,
    y: y + Math.sin(angle) * advance + Math.cos(angle) * offset,
  };
}

function drawLeaf(context, x, y, angle, size, opacity, color) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = `rgba(${color}, ${opacity})`;
  context.beginPath();
  context.moveTo(0, 0);
  context.quadraticCurveTo(size * 0.52, -size * 0.38, size, 0);
  context.quadraticCurveTo(size * 0.50, size * 0.29, 0, 0);
  context.fill();
  context.restore();
}

export function createForestVisualizer(canvas, { waveformPosition = 0.84, showWaveform = true } = {}) {
  const context = canvas.getContext('2d');
  if (!context) return { update() {}, destroy() {} };

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const random = randomGenerator(29917);
  const spores = Array.from({ length: 84 }, () => ({
    x: random(),
    y: 0.17 + random() * 0.74,
    radius: 0.55 + random() * 1.55,
    speed: 0.12 + random() * 0.44,
    phase: random() * Math.PI * 2,
    cooler: random() > 0.76,
    threshold: random(),
  }));
  const roots = Array.from({ length: 16 }, (_, index) => ({
    origin: Math.pow(random(), 1.8) * 0.22,
    side: index % 2 ? 1 : -1,
    lean: 0.026 + random() * 0.13,
    height: 0.11 + random() * 0.38,
    threshold: 0.17 + random() * 0.52,
    phase: random() * Math.PI * 2,
    leafCount: 4 + Math.floor(random() * 5),
  }));

  let frame;
  let previousTime;
  let lastReducedDraw = 0;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let smoothGrowth = 0.1;
  let smoothEnergy = 0;
  let pulse = 0;
  let fieldTime = 0;
  const ambient = new Float32Array(4);
  const auriscape = new Float32Array(4);
  const state = {
    growth: 0.1,
    energy: 0,
    transient: 0,
    playing: false,
    mode: 'forest',
    waveform: null,
    ambient: null,
    auriscape: null,
    immersive: false,
    fallback: false,
    neon: false,
    flash: 0,
    flashIndex: 0,
  };

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function drawRoots(time, hyper) {
    if (smoothGrowth < 0.18) return;
    const plantDepth = height * (hyper ? 1.16 : 1);
    const bottom = height + 7;
    context.lineCap = 'round';

    for (const root of roots) {
      const reveal = clamp((smoothGrowth - root.threshold) / 0.32);
      if (reveal <= 0) continue;

      const origin = width * (root.side < 0 ? root.origin : 1 - root.origin);
      const shape = root.lean * width * -root.side * reveal;
      const top = bottom - root.height * plantDepth * reveal;
      const rise = bottom - top;
      const sway = Math.sin(time * 0.61 + root.phase) * 4 * reveal;
      const opacity = reveal * (hyper ? 0.30 : 0.22);

      context.strokeStyle = `rgba(${turquoise}, ${opacity})`;
      context.lineWidth = 0.6 + reveal * 0.45;
      context.beginPath();
      context.moveTo(origin, bottom);
      context.quadraticCurveTo(origin - shape * 0.12, bottom - rise * 0.55, origin + shape + sway, top);
      context.stroke();

      for (let index = 0; index < root.leafCount; index += 1) {
        const along = 0.26 + index / root.leafCount * 0.65;
        const inverse = 1 - along;
        const x = origin + 2 * inverse * along * -shape * 0.12 + along * along * (shape + sway);
        const y = bottom - 2 * inverse * along * rise * 0.55 - along * along * rise;
        const side = index % 2 ? 1 : -1;
        const angle = -Math.PI / 2 + side * (0.66 + 0.42 * inverse);
        const size = (5 + inverse * 14) * reveal * Math.min(1, width / 610);
        drawLeaf(context, x, y, angle, size, opacity * (0.60 + inverse * 0.29), turquoise);
      }
    }
  }

  function drawSpores(time, hyper) {
    const influence = clamp(0.16 + smoothGrowth * 0.67 + smoothEnergy * 0.12 + (hyper ? 0.09 : 0));
    const field = width > 520 ? spores : spores.slice(0, 47);
    context.globalCompositeOperation = 'screen';

    for (const spore of field) {
      const opacity = clamp((influence - spore.threshold) / 0.46) *
        (0.23 + smoothGrowth * 0.28 + smoothEnergy * 0.25 + pulse * 0.19);
      if (opacity < 0.035) continue;

      const drift = time * spore.speed;
      const x = spore.x * width + Math.sin(drift + spore.phase) * (4 + smoothGrowth * 14);
      const y = spore.y * height + Math.cos(drift * 0.86 + spore.phase) * (7 + smoothEnergy * 17);
      const twinkle = 0.60 + Math.sin(drift * 2.7 + spore.phase) * 0.29;
      const radius = spore.radius * (0.81 + smoothGrowth * 0.34 + pulse * 0.40);
      const color = spore.cooler ? coolCyan : turquoise;

      if (radius > 1.35) {
        context.fillStyle = `rgba(${color}, ${opacity * twinkle * 0.17})`;
        context.beginPath();
        context.arc(x, y, radius * 2.8, 0, Math.PI * 2);
        context.fill();
      }
      context.fillStyle = `rgba(${color}, ${opacity * twinkle})`;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.globalCompositeOperation = 'source-over';
  }

  function drawWave(time, hyper) {
    if (!showWaveform) return;

    const baseline = height * waveformPosition;
    const widthInset = Math.min(22, width * 0.04);
    const span = width - widthInset * 2;
    const points = Math.max(28, Math.min(144, Math.floor(width / 6)));
    const intensity = 0.33 + smoothEnergy * 0.31 + smoothGrowth * 0.14 + pulse * 0.14;
    const amplitude = Math.min(height * 0.12, 54);
    const signal = motionPreference.matches ? null : state.waveform;
    const hasSignal = state.playing && signal?.length;
    const gradient = context.createLinearGradient(widthInset, baseline, width - widthInset, baseline);
    gradient.addColorStop(0, `rgba(${turquoise}, 0)`);
    gradient.addColorStop(0.16, `rgba(${turquoise}, ${intensity * 0.58})`);
    gradient.addColorStop(0.51, `rgba(${turquoise}, ${intensity})`);
    gradient.addColorStop(0.83, `rgba(${coolCyan}, ${intensity * 0.72})`);
    gradient.addColorStop(1, `rgba(${coolCyan}, 0)`);

    context.strokeStyle = gradient;
    context.lineJoin = 'round';
    context.lineWidth = 0.95;
    context.beginPath();

    for (let index = 0; index <= points; index += 1) {
      const unit = index / points;
      const x = widthInset + unit * span;
      const envelope = Math.sin(unit * Math.PI) ** 0.9;
      const texture = Math.sin(unit * 52 + time * 1.42) * 0.29 +
        Math.sin(unit * 113 - time * 1.43) * 0.18 +
        Math.sin(unit * 21 + time * 0.61) * 0.27;
      const contour = 0.35 + 0.65 * Math.abs(Math.sin(unit * 15 - time * 0.35));
      let sample = texture * contour * (0.23 + smoothEnergy * 0.64 + pulse * 0.31);

      if (hasSignal) {
        const signalIndex = Math.floor(unit * (signal.length - 1));
        const sound = clamp((signal[signalIndex] - 128) / 61, -1, 1);
        sample = sample * 0.38 + sound * (0.37 + smoothEnergy * 0.69);
      }

      const y = baseline + sample * amplitude * envelope * (hyper ? 1.23 : 1);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }

    context.stroke();
  }

  function drawHaze(x, y, radius, color, opacity) {
    const haze = context.createRadialGradient(x, y, 0, x, y, radius);
    haze.addColorStop(0, `rgba(${color}, ${opacity})`);
    haze.addColorStop(0.45, `rgba(${color}, ${opacity * 0.48})`);
    haze.addColorStop(1, `rgba(${color}, 0)`);
    context.fillStyle = haze;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function drawAmbientContours(time, immersive, hyper) {
    const [low, mid, high, level] = ambient;
    const strength = clamp(level * 1.45 + low * 0.34 + mid * 0.33 + high * 0.44);
    if (strength < 0.012) return;

    const scale = immersive ? 1 : 0.46;
    const drift = Math.sin(time * (0.35 + high * 0.42)) * height * 0.038;
    const spread = 0.045 + low * 0.039 + smoothGrowth * 0.023;
    drawHaze(width * (0.20 + mid * 0.12), height * 0.50 + drift,
      Math.min(width, height) * (0.75 + low * 0.36), turquoise, strength * scale * (0.15 + low * 0.14));

    const trace = context.createLinearGradient(0, height * 0.2, width * 0.78, height * 0.72);
    trace.addColorStop(0, `rgba(${turquoise}, 0)`);
    trace.addColorStop(0.24, `rgba(${turquoise}, 0.68)`);
    trace.addColorStop(0.58, `rgba(${turquoise}, 0.55)`);
    trace.addColorStop(1, `rgba(${turquoise}, 0)`);
    context.strokeStyle = trace;
    context.lineWidth = 0.8 + high * 0.7;

    const count = immersive ? (hyper ? 11 : 8) : 4;
    for (let index = 0; index < count; index += 1) {
      const shelf = index - (count - 1) * 0.5;
      const rise = Math.sin(time * 0.72 - shelf * 0.46) * (0.024 + mid * 0.073) * height;
      const y = height * (0.5 + shelf * spread) + drift;
      context.globalAlpha = scale * strength * (0.53 - Math.abs(shelf) * 0.031);
      context.beginPath();
      context.moveTo(-width * 0.09, y - height * 0.27);
      context.bezierCurveTo(width * 0.12, y - height * (0.24 + low * 0.10),
        width * (0.34 + high * 0.20), y + rise, width * 0.47, y + height * 0.09 + rise);
      context.bezierCurveTo(width * 0.60, y + height * 0.14 + rise,
        width * 0.72, y + height * (0.07 + mid * 0.11), width * 0.84, y + height * 0.13);
      context.stroke();
    }
  }

  function drawAuriscapeContours(time, immersive, hyper) {
    const [low, mid, high, beat] = auriscape;
    const strength = clamp(low * 0.84 + mid * 0.52 + high * 0.49 + beat * 0.66);
    if (strength < 0.012) return;

    const scale = immersive ? 1 : 0.48;
    const x = width * (0.69 + Math.sin(time * 0.37) * 0.028);
    const y = height * (0.61 - mid * 0.11);
    const size = Math.min(width, height);
    const breadth = Math.min(width * 0.55, height * 0.97) * (0.71 + low * 0.29 + beat * 0.19);
    context.globalAlpha = 1;
    drawHaze(x, y, size * (0.69 + low * 0.20), coolCyan, scale * strength * (0.085 + beat * 0.13));

    const trace = context.createLinearGradient(x - breadth, y + height * 0.19, x + breadth, y);
    trace.addColorStop(0, `rgba(${coolCyan}, 0)`);
    trace.addColorStop(0.32, `rgba(${coolCyan}, 0.42)`);
    trace.addColorStop(0.66, `rgba(${ice}, 0.86)`);
    trace.addColorStop(1, `rgba(${ice}, 0)`);
    context.strokeStyle = trace;

    const count = immersive ? (hyper ? 8 : 6) : 3;
    for (let index = 0; index < count; index += 1) {
      const distance = index / count;
      const radius = 0.44 + distance * 0.69;
      const angle = time * (0.36 + high * 0.17) - distance * 1.15;
      context.globalAlpha = scale * strength * (0.61 - distance * 0.24 + beat * 0.16);
      context.lineWidth = 0.9 + beat * (1 - distance) * 1.5;
      context.beginPath();
      context.ellipse(x, y, Math.max(1, breadth * radius),
        Math.max(1, size * radius * (0.28 + mid * 0.13)), -0.34 + Math.sin(angle) * 0.09,
        Math.PI * (0.78 + Math.sin(angle) * 0.09),
        Math.PI * (2.06 + Math.cos(angle) * 0.12 + high * 0.17));
      context.stroke();
    }
  }

  function traceNeonArm(x, y, angle, length, knots, tension) {
    const alongX = Math.cos(angle);
    const alongY = Math.sin(angle);
    context.beginPath();
    context.moveTo(x, y);
    for (let index = 1; index < knots.length; index += 1) {
      const advance = length * index / (knots.length - 1);
      const offset = knots[index] * length * tension;
      context.lineTo(x + alongX * advance - alongY * offset, y + alongY * advance + alongX * offset);
    }
  }

  function drawNeon(time, reduced, hyper) {
    const immersive = state.immersive;
    const size = Math.min(width, height);
    const focus = Number.isInteger(state.flashIndex) ? Math.abs(state.flashIndex) % ecosystem.length : 0;
    const flash = state.playing && !reduced ? meter(state, 'flash') : 0;
    const stems = (immersive ? 0.33 : 0.29) * size * (0.88 + smoothGrowth * 0.16 + auriscape[0] * 0.24);
    context.globalCompositeOperation = 'screen';
    context.lineJoin = 'round';
    context.globalAlpha = 1;

    const nodes = ecosystem.map((node, index) => {
      const spectrum = neonPalette[node.palette];
      const energy = clamp(auriscape[spectrum.band] * 0.77 + ambient[spectrum.band] * 0.34);
      const surge = index === focus ? flash : 0;
      const drift = Math.sin(time * 0.79 + node.phase);
      return {
        ...node, spectrum, energy, surge,
        x: node.x * width + drift * 4,
        y: node.y * height + Math.cos(time * 0.54 + node.phase) * 4,
        angle: node.angle + drift * (0.08 + auriscape[1] * 0.19),
      };
    });

    for (const node of nodes) {
      const { glow, core } = node.spectrum;
      const reach = stems * node.length * (1 + node.surge * 0.08);
      const tension = 0.69 + auriscape[2] * 0.66 + ambient[2] * 0.22;
      const light = 0.60 + node.energy * 0.18 + node.surge * 0.12;
      const armCount = immersive || hyper ? 3 : 2;
      for (let index = 0; index < armCount; index += 1) {
        const arm = node.arms[index];
        const { x, y } = index
          ? neonPoint(node.x, node.y, node.angle, reach, node.arms[0].knots, tension, 0.22 + index * 0.12)
          : node;
        const angle = node.angle + arm.offset;
        const length = reach * arm.length;
        const fade = context.createLinearGradient(x, y, x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        fade.addColorStop(0, `rgba(${core}, ${light * (index ? 0.61 : 1)})`);
        fade.addColorStop(0.46, `rgba(${glow}, ${light * 0.78})`);
        fade.addColorStop(1, `rgba(${glow}, 0)`);
        traceNeonArm(x, y, angle, length, arm.knots, tension);

        context.globalAlpha = 0.24;
        context.strokeStyle = fade;
        context.lineWidth = 4.6 + node.energy * 2.2;
        context.stroke();
        context.globalAlpha = 1;
        context.lineWidth = (index ? 0.9 : 1.35) + node.energy * 0.40;
        context.stroke();

        if (!reduced && state.playing && index === 0) {
          const travel = (time * (0.28 + auriscape[2] * 0.12) + node.phase) % 1;
          const spark = neonPoint(x, y, angle, length, arm.knots, tension, travel);
          context.beginPath();
          context.moveTo(spark.x - Math.cos(angle) * 10, spark.y - Math.sin(angle) * 10);
          context.lineTo(spark.x, spark.y);
          context.lineWidth = 1.2;
          context.strokeStyle = `rgba(${core}, ${light * 0.52})`;
          context.stroke();
        }
      }
    }

    for (const node of nodes) {
      const { glow, core } = node.spectrum;
      const radius = clamp(size * (0.072 + node.energy * 0.025), 16, 38) + node.surge * 10;
      drawHaze(node.x, node.y, radius, glow, 0.20 + node.energy * 0.14 + node.surge * 0.15);

      context.fillStyle = `rgba(${glow}, ${0.23 + node.energy * 0.15 + node.surge * 0.16})`;
      context.beginPath();
      context.arc(node.x, node.y, 5.1 + node.energy * 2 + node.surge * 3.2, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = `rgba(${core}, ${0.82 + node.energy * 0.1 + node.surge * 0.08})`;
      context.beginPath();
      context.arc(node.x, node.y, 2.3 + node.energy * 1.15 + node.surge * 1.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawFallback(interval, reduced, hyper) {
    const response = 1 - Math.exp(-interval / (reduced ? 480 : 160));
    const room = state.playing ? state.ambient : null;
    const generated = state.playing ? state.auriscape : null;
    for (let index = 0; index < bands.length; index += 1) {
      const band = bands[index];
      ambient[index] += (meter(room, band) - ambient[index]) * response;
      auriscape[index] += (meter(generated, band) - auriscape[index]) * response;
    }
    const level = meter(room, 'level') * 0.76 + meter(room, 'onset') * 0.24;
    ambient[3] += (level - ambient[3]) * response;
    const beat = meter(generated, 'beat');
    auriscape[3] = reduced
      ? auriscape[3] + (beat * 0.28 - auriscape[3]) * response
      : Math.max(beat, auriscape[3] * Math.exp(-interval / 160));
    if (state.playing && !reduced) fieldTime += interval / 1000;
    const contours = !ambient.every(nearSilence) || !auriscape.every(nearSilence);
    if (!contours && !state.neon) return;
    const time = reduced ? 0 : fieldTime;

    context.save();
    context.lineCap = 'round';
    if (contours) {
      drawAmbientContours(time, state.immersive, hyper);
      drawAuriscapeContours(time, state.immersive, hyper);
    }
    if (state.neon) drawNeon(time, reduced, hyper);
    context.restore();
  }

  function render(timestamp) {
    frame = requestAnimationFrame(render);
    if (!width || !height) return;

    const reduced = motionPreference.matches;
    if (reduced && timestamp < lastReducedDraw + 120) return;
    if (reduced) lastReducedDraw = timestamp;

    const interval = previousTime === undefined ? 16 : clamp(timestamp - previousTime, 8, 150);
    previousTime = timestamp;
    const response = 1 - Math.exp(-interval / 220);
    smoothGrowth += (state.growth - smoothGrowth) * response;
    smoothEnergy += (state.energy - smoothEnergy) * (1 - Math.exp(-interval / 100));
    pulse = clamp(Math.max(state.transient * 0.9, pulse * Math.exp(-interval / 136)));
    const time = reduced ? 0 : timestamp / 1000;
    const hyper = state.mode === 'hyperforest';

    context.clearRect(0, 0, width, height);
    if (state.fallback) drawFallback(interval, reduced, hyper);
    drawRoots(time, hyper);
    drawSpores(time, hyper);
    drawWave(time, hyper);
  }

  frame = requestAnimationFrame(render);

  return {
    update(nextState) {
      Object.assign(state, nextState);
      state.growth = clamp(state.growth);
      state.energy = clamp(state.energy);
      state.transient = clamp(state.transient);
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      context.clearRect(0, 0, width, height);
    },
  };
}
