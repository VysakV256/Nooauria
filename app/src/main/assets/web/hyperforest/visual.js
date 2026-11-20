const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const lime = '213, 246, 115';
const gold = '244, 198, 103';

function randomGenerator(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
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
    warmth: random() > 0.76,
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
  const state = {
    growth: 0.1,
    energy: 0,
    transient: 0,
    playing: false,
    mode: 'forest',
    waveform: null,
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

      context.strokeStyle = `rgba(${lime}, ${opacity})`;
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
        drawLeaf(context, x, y, angle, size, opacity * (0.60 + inverse * 0.29), lime);
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
      const color = spore.warmth ? gold : lime;

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
    gradient.addColorStop(0, `rgba(${lime}, 0)`);
    gradient.addColorStop(0.16, `rgba(${lime}, ${intensity * 0.58})`);
    gradient.addColorStop(0.51, `rgba(${lime}, ${intensity})`);
    gradient.addColorStop(0.83, `rgba(${gold}, ${intensity * 0.72})`);
    gradient.addColorStop(1, `rgba(${lime}, 0)`);

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
