// Run with: node --test tests/audio-playback.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const html = process.env.NOOAURIA_TEST_REF
  ? execFileSync('git', ['show', `${process.env.NOOAURIA_TEST_REF}:app/src/main/assets/web/index.html`], { cwd: root, encoding: 'utf8' })
  : fs.readFileSync(path.join(root, 'app/src/main/assets/web/index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

function habitat({ scoreOnly = false } = {}) {
  const contexts = [], intervals = new Map(), elements = new Map(), groups = new Map(), errors = [];
  let nextTimer = 1;
  class Events {
    constructor() { this.listeners = new Map(); }
    addEventListener(name, fn) {
      if (!this.listeners.has(name)) this.listeners.set(name, []);
      this.listeners.get(name).push(fn);
    }
    emit(name) { for (const fn of this.listeners.get(name) || []) fn({ target: this, type: name }); }
  }
  class Param {
    constructor() { this.value = 0; }
    setValueAtTime(v) { assert.ok(Number.isFinite(v)); this.value = v; }
    linearRampToValueAtTime(v) { this.setValueAtTime(v); }
    exponentialRampToValueAtTime(v) { assert.ok(v > 0); this.setValueAtTime(v); }
    setTargetAtTime(v) { this.setValueAtTime(v); }
    cancelScheduledValues() {}
  }
  class Node extends Events {
    constructor(context, source = false) {
      super(); this.context = context; this.connections = []; this.source = source;
      for (const p of ['gain','frequency','detune','Q','pan','delayTime','threshold','knee','ratio','attack','release']) this[p] = new Param();
      context.nodes.push(this);
    }
    connect(node) { this.connections.push(node); }
    disconnect() { this.connections = []; }
    start(at = this.context.currentTime) { this.started = true; this.startAt = at; this.context.starts++; }
    stop(at = this.context.currentTime) { this.stopAt = at; }
    setPeriodicWave(wave) { assert.equal(wave.context, this.context, 'A cached waveform must belong to the current context'); }
    getByteFrequencyData(data) { data.fill(24); }
    finish() { if (!this.ended) { this.ended = true; this.emit('ended'); if (this.onended) this.onended(); } }
  }
  class Context extends Events {
    constructor() {
      super(); this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 48000;
      this.nodes = []; this.starts = 0; this.pending = []; this.manual = false;
      this.destination = {}; contexts.push(this);
    }
    createOscillator() { return new Node(this, true); }
    createBufferSource() { return new Node(this, true); }
    createGain() { return new Node(this); }
    createBiquadFilter() { return new Node(this); }
    createStereoPanner() { return new Node(this); }
    createDelay() { return new Node(this); }
    createDynamicsCompressor() { return new Node(this); }
    createAnalyser() { const n = new Node(this); n.frequencyBinCount = 64; return n; }
    createBuffer(channels, size) { return { getChannelData: () => new Float32Array(size) }; }
    createPeriodicWave() { return { context: this }; }
    change(state) { this.state = state; this.emit('statechange'); }
    transition(kind) {
      if (this.state === 'closed') return Promise.reject(new Error('Context closed'));
      if (this.failNextResume && kind === 'resume') { this.failNextResume = false; return Promise.reject(new Error('User gesture required')); }
      if (this.manual) return new Promise((resolve, reject) => this.pending.push({ kind, resolve, reject }));
      return Promise.resolve().then(() => this.change(kind === 'resume' ? 'running' : 'suspended'));
    }
    resume() { return this.transition('resume'); }
    suspend() { return this.transition('suspend'); }
    finishTransition(kind) {
      const i = this.pending.findIndex(p => p.kind === kind);
      assert.ok(i >= 0, `Expected a pending ${kind}`);
      const p = this.pending.splice(i, 1)[0];
      this.change(kind === 'resume' ? 'running' : 'suspended'); p.resolve();
    }
    advance(seconds) {
      if (this.state !== 'running') return;
      this.currentTime += seconds;
      for (const n of this.nodes) if (n.source && n.started && n.stopAt <= this.currentTime) n.finish();
    }
  }
  const document = new Events();
  document.hidden = false;
  function element(id) {
    if (!elements.has(id)) {
      const e = new Events(); e.id = id; e.dataset = {}; e.value = 50; e.textContent = '';
      e.classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
      e.attributes = new Map();
      e.setAttribute = (name, value) => e.attributes.set(name, String(value));
      e.getAttribute = name => e.attributes.get(name);
      e.getContext = () => new Proxy({}, { get: () => () => {} });
      e.click = () => { e.emit('click'); document.emit('click'); };
      elements.set(id, e);
    }
    return elements.get(id);
  }
  for (const attribute of ['amplifier','lifeway','spectrum','geometry','track-mode']) {
    const list = [...html.matchAll(new RegExp(`data-${attribute}="([^"]+)"`, 'g'))].map(m => {
      const e = element(`${attribute}:${m[1]}`); e.dataset[attribute === 'track-mode' ? 'trackMode' : attribute] = m[1]; e.checked = true; return e;
    });
    groups.set(`[data-${attribute}]`, list);
  }
  document.getElementById = element;
  document.querySelectorAll = s => groups.get(s) || [];
  document.body = element('body'); document.documentElement = element('html');
  const window = new Events(); window.AudioContext = Context; window.innerWidth = 1200; window.innerHeight = 800;
  const sandbox = { window, document, performance: { now: () => 0 },
    requestAnimationFrame: () => {}, console: { log() {}, warn: (...a) => errors.push(a), error: (...a) => errors.push(a) },
    setInterval: fn => { const id = nextTimer++; intervals.set(id, fn); return id; },
    clearInterval: id => intervals.delete(id), setTimeout: () => nextTimer++, clearTimeout() {} };
  vm.createContext(sandbox);
  vm.runInContext(script + `\nthis.inspectAudio = () => ({ context: audioCtx, step: stepIndex, playing: state.isPlaying, voiceCount: typeof activeVoices === 'undefined' ? activeVoiceCount : activeVoices.size, wave: crystalLeadWave, master: masterGain });`, sandbox);
  vm.runInContext(`
    this.inspectArrangement = () => ({ elapsed: arrangementTime(), ...arrangementAt(arrangementTime()), bpm: state.bpm });
    this.inspectTrack = () => generatedTrack;
    this.scoreEvents = [];
  `, sandbox);
  if (scoreOnly) vm.runInContext(`
    for (const name of ['playKick','playSnare','playHiHat','playGhostSnare','playBass','playMysticalSub','playSynthLead','playSurgeSpark']) {
      const record = (...args) => scoreEvents.push({ instrument:name, step:stepIndex, time:args[0], args:args.slice(1) });
      eval(name + ' = record');
    }
  `, sandbox);
  return { contexts, intervals, groups, element, document, window, errors, inspect: sandbox.inspectAudio,
    track: sandbox.inspectTrack, arrangement: sandbox.inspectArrangement, scoreEvents: sandbox.scoreEvents, spark: sandbox.playSurgeSpark,
    click: (kind, name) => element(`${kind}:${name}`).click(),
    advance(seconds) { const ctx = sandbox.inspectAudio().context; ctx.advance(seconds); for (const fn of [...intervals.values()]) fn(); } };
}

test('Noetic Surge has high-register stereo bursts, subdivisions and strong dynamic contrast', async () => {
  const h = habitat({ scoreOnly:true });
  h.click('amplifier','NOETIC_SURGE'); await settle();
  const levels = [];
  const stepSeconds = 15 / h.arrangement().bpm;
  for (let tick=0; tick<150; tick++) { h.advance(stepSeconds); levels.push(h.arrangement().leadLevel); }
  const sparks = h.scoreEvents.filter(e => e.instrument === 'playSurgeSpark');
  assert.ok(sparks.length > 140, 'The surge needs rapid pitched bursts, not just more hats');
  assert.ok(new Set(sparks.map(e => e.args[0])).size > 30, 'Bursts should move through many pitches');
  assert.ok(Math.min(...sparks.map(e => e.args[3])) < -.5 && Math.max(...sparks.map(e => e.args[3])) > .5);
  assert.ok(Math.max(...levels) / Math.min(...levels) > 3, 'Pressure waves need audible dynamic contrast');
  assert.ok(sparks.some((e,i) => i && e.step === sparks[i-1].step && e.time > sparks[i-1].time), 'Bursts must subdivide the sixteenth-note grid');
  assert.ok(h.scoreEvents.some(e => e.instrument === 'playMysticalSub'), 'Keep the sub-bass foundation');
  for (const mode of h.groups.get('[data-amplifier]')) {
    if (mode.dataset.amplifier === 'NOETIC_SURGE') continue;
    h.scoreEvents.length = 0; mode.click(); await settle();
    for (let tick=0; tick<32; tick++) h.advance(.125);
    assert.equal(h.scoreEvents.filter(e => e.instrument === 'playSurgeSpark').length, 0, 'Surge bursts must not leak into other biodynamics');
    assert.equal(h.arrangement().surgeEnergy, undefined);
  }
});

test('Surge spark voices are bounded, sharply gated and released on rest', async () => {
  const h = habitat(); h.click('amplifier','NOETIC_SURGE'); await settle();
  h.inspect().context.advance(1);
  for (const spectrum of ['VELVET','CRYSTAL']) {
    h.click('spectrum',spectrum); await settle();
    const context = h.inspect().context;
    const before = context.nodes.length;
    h.spark(context.currentTime + .02, 12000, .05, .1, -.7);
    const added = context.nodes.slice(before);
    const sources = added.filter(n => n.source);
    assert.equal(sources.length, 2);
    assert.ok(sources[0].frequency.value >= 1200 && sources[0].frequency.value <= 5200);
    const maxLength = spectrum === 'CRYSTAL' ? .026 : .045;
    for (const source of sources) assert.ok(source.stopAt - source.startAt <= maxLength + 1e-8);
    h.element('awaken').click(); await settle();
    assert.equal(h.inspect().voiceCount, 0);
    for (const node of added) assert.equal(node.connections.length, 0);
    h.element('awaken').click(); await settle(); context.advance(1);
  }
  assert.equal(h.errors.length, 0);
});

test('every biodynamic develops for 42 audio seconds without a short arrangement loop', async () => {
  const h = habitat({ scoreOnly:true });
  const harmonyPaths = new Set();
  for (const mode of h.groups.get('[data-amplifier]')) {
    h.scoreEvents.length = 0;
    mode.click(); await settle();
    const first = h.arrangement();
    assert.equal(first.elapsed, 0);
    harmonyPaths.add(JSON.stringify(first.score.harmony));
    const chapters = new Set([first.chapter]);
    const stepSeconds = 15 / first.bpm;
    while (h.arrangement().elapsed + stepSeconds < 42) {
      h.advance(stepSeconds);
      const a = h.arrangement();
      assert.equal(a.cycle, 0, mode.dataset.amplifier + ' must not restart before 42 seconds');
      chapters.add(a.chapter);
    }
    assert.equal(chapters.size, 6);
    const signatures = [];
    for (let start = 0; start + 32 < h.inspect().step; start += 32) {
      const phrase = h.scoreEvents.filter(e => e.instrument === 'playSynthLead' && e.step >= start && e.step < start + 32)
        .map(e => [e.step - start, ...e.args]);
      signatures.push(JSON.stringify(phrase));
    }
    assert.equal(new Set(signatures).size, signatures.length, mode.dataset.amplifier + ': repeated two-bar melody');
    h.advance(42 - h.arrangement().elapsed + .00001);
    assert.equal(h.arrangement().cycle, 1);
    assert.ok(h.arrangement().position < .001);
    assert.equal(h.inspect().context.state, 'running');
    assert.equal(h.intervals.size, 1);
  }
  assert.equal(harmonyPaths.size, 11, 'Every biodynamic needs its own harmonic journey');
  assert.equal(h.errors.length, 0);
});

test('42-second audio clock survives rest, tempo changes and context reconstruction', async () => {
  const h = habitat(); h.click('amplifier','VIRIDION'); await settle();
  h.advance(12.5);
  h.element('awaken').click(); await settle();
  h.advance(50);
  assert.equal(h.arrangement().elapsed, 12.5, 'Rest must freeze the composition');
  h.element('awaken').click(); await settle();
  for (const bpm of [80, 190]) {
    h.element('tempo').value = bpm; h.element('tempo').emit('input'); await settle();
    assert.equal(h.arrangement().elapsed, 12.5);
    assert.equal(h.intervals.size, 1);
  }
  h.advance(9);
  h.inspect().context.change('closed'); await settle();
  assert.equal(h.arrangement().elapsed, 21.5);
  h.advance(20.499);
  assert.equal(h.arrangement().cycle, 0);
  h.advance(.002);
  assert.equal(h.arrangement().cycle, 1);
  assert.ok(Math.abs(h.arrangement().position - .001) < 1e-8);
  h.click('amplifier','AETHERFLUX'); await settle();
  assert.equal(h.arrangement().elapsed, 0, 'Selecting a new biodynamic starts its full arrangement');
  h.advance(8);
  h.click('lifeway','CHLOROPHYLL_MIND'); await settle();
  assert.equal(h.arrangement().elapsed, 0);
  assert.equal(h.errors.length, 0);
});

test('all eleven audio graphs remain playable across a full arrangement and its boundary', async () => {
  for (const spectrum of ['VELVET', 'CRYSTAL']) {
    const h = habitat(); h.click('spectrum', spectrum);
    for (const mode of h.groups.get('[data-amplifier]')) {
      mode.click(); await settle();
      const context = h.inspect().context;
      const stepSeconds = 15 / h.arrangement().bpm;
      let previousStarts = context.starts;
      for (let tick = 0; tick < Math.ceil(44 / stepSeconds); tick++) {
        h.advance(stepSeconds);
        assert.equal(context.state, 'running');
        assert.ok(h.inspect().voiceCount <= 22);
        if (tick % 16 === 15) {
          assert.ok(context.starts > previousStarts, mode.dataset.amplifier + ': audio graph stopped producing notes');
          previousStarts = context.starts;
        }
      }
      assert.equal(h.arrangement().cycle, 1);
      h.element('awaken').click(); await settle();
      assert.equal(h.inspect().voiceCount, 0);
      // Discard finished mock-node history; the real engine already disconnects these nodes.
      context.nodes = context.nodes.filter(n => !n.ended && n.stopAt === undefined);
    }
    assert.equal(h.errors.length, 0);
  }
});

test('Emerge | Rest starts and rests the biodynamic repeatedly', async () => {
  assert.match(html, /id="awaken"[^>]*aria-label="Emerge \| Rest"[^>]*aria-pressed="false"/);
  const h = habitat();
  const button = h.element('awaken');
  assert.equal(h.inspect().playing, false);
  for (let cycle = 0; cycle < 6; cycle++) {
    button.click(); await settle();
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    assert.equal(button.getAttribute('title'), 'Rest: pause the selected biodynamic');
    assert.equal(h.inspect().context.state, 'running');
    assert.equal(h.intervals.size, 1);
    assert.ok(h.inspect().voiceCount > 0);
    button.click(); await settle();
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    assert.equal(button.getAttribute('title'), 'Emerge: start the selected biodynamic');
    assert.equal(h.inspect().playing, false);
    assert.equal(h.inspect().context.state, 'suspended');
    assert.equal(h.inspect().voiceCount, 0);
    assert.equal(h.intervals.size, 0);
  }
  assert.equal(h.contexts.length, 1);
  assert.equal(h.errors.length, 0);
});

test('all biodynamics remain playable through 176 switches with one context and one clock', async () => {
  const h = habitat();
  const modes = h.groups.get('[data-amplifier]');
  for (let pass = 0; pass < 4; pass++) for (const spectrum of h.groups.get('[data-spectrum]')) for (const mode of modes) {
    spectrum.click(); mode.click(); await settle();
    const a = h.inspect();
    assert.equal(a.context.state, 'running'); assert.equal(h.intervals.size, 1);
    assert.ok(a.step > 0, 'The new mode should sound immediately');
    assert.ok(a.voiceCount > 0 && a.voiceCount <= 22);
    h.advance(.25);
  }
  assert.equal(h.contexts.length, 1); assert.equal(h.errors.length, 0);
  h.element('awaken').click(); await settle();
  assert.equal(h.inspect().voiceCount, 0); assert.equal(h.intervals.size, 0);
});

test('play wins when a previous pause finishes after its resume', async () => {
  const h = habitat(); h.click('amplifier','NOETIC_SURGE'); await settle();
  const ctx = h.inspect().context; ctx.manual = true;
  h.element('awaken').click();
  h.click('amplifier','POLYATTENTION');
  ctx.finishTransition('resume'); await settle();
  ctx.finishTransition('suspend'); await settle();
  ctx.finishTransition('resume'); await settle();
  assert.equal(ctx.state, 'running'); assert.equal(h.intervals.size, 1); assert.ok(h.inspect().step > 0);
});

test('pause wins when an earlier resume completes late', async () => {
  const h = habitat(); h.click('amplifier','NOETIC_SURGE'); await settle();
  h.element('awaken').click(); await settle();
  const ctx = h.inspect().context; ctx.manual = true;
  h.click('amplifier','AETHERFLUX'); h.element('awaken').click();
  ctx.finishTransition('suspend'); await settle();
  ctx.finishTransition('resume'); await settle();
  ctx.finishTransition('suspend'); await settle();
  assert.equal(ctx.state, 'suspended'); assert.equal(h.inspect().playing, false); assert.equal(h.intervals.size, 0);
});

test('closed context is rebuilt with a fresh Crystal waveform', async () => {
  const h = habitat(); h.click('spectrum','CRYSTAL'); h.click('amplifier','NOETIC_SURGE'); await settle();
  h.advance(.2);
  const before = h.inspect(); assert.ok(before.wave);
  before.context.change('closed'); await settle();
  h.click('amplifier','VIRIDION'); await settle();
  const after = h.inspect();
  assert.notEqual(before.context, after.context); assert.notEqual(before.wave, after.wave);
  assert.equal(after.context.state, 'running'); assert.equal(h.intervals.size, 1); assert.equal(h.errors.length, 0);
});

test('interrupted or rejected playback can recover on a subsequent gesture', async () => {
  const h = habitat(); h.click('amplifier','PHASEWEAVE'); await settle();
  const ctx = h.inspect().context; ctx.failNextResume = true; ctx.change('interrupted'); await settle();
  assert.match(h.element('pulse-readout').textContent, /resume/);
  h.click('amplifier','HYPERASTRA'); await settle();
  assert.equal(ctx.state, 'running'); assert.equal(h.intervals.size, 1);
  h.element('awaken').click(); await settle(); h.window.emit('focus'); await settle();
  assert.equal(ctx.state, 'suspended'); assert.equal(h.intervals.size, 0);
});

test('a fresh gesture retries a browser-blocked resume that never settled', async () => {
  const h = habitat(); h.click('amplifier','NOETIC_SURGE'); await settle();
  const ctx = h.inspect().context; ctx.manual = true;
  ctx.change('interrupted'); await settle();
  assert.equal(ctx.pending.length, 1);
  h.click('amplifier','EXURSIVE_FLOW');
  assert.ok(ctx.pending.length > 1, 'Gesture must issue another resume instead of waiting forever');
  const retry = ctx.pending.pop(); ctx.change('running'); retry.resolve(); await settle();
  assert.equal(ctx.state, 'running'); assert.equal(h.intervals.size, 1);
  assert.ok(h.inspect().step > 0);
});

test('voices disconnect on ended, and late ended events cannot consume new voice slots', async () => {
  const h = habitat(); h.click('amplifier','AETHERFLUX'); await settle();
  h.advance(.2);
  const ctx = h.inspect().context; const old = ctx.nodes.filter(n => n.source && Number.isFinite(n.stopAt));
  assert.ok(old.length > 0);
  h.click('amplifier','NOETIC_SURGE'); await settle();
  const count = h.inspect().voiceCount;
  for (const n of old) { n.finish(); assert.equal(n.connections.length, 0); }
  assert.equal(h.inspect().voiceCount, count);
  ctx.advance(2); assert.equal(h.inspect().voiceCount, 0);
  for (const n of ctx.nodes.filter(n => n.ended)) assert.equal(n.connections.length, 0);
});

test('lifeway switching and rapid repeated rest/start remain playable', async () => {
  const h = habitat();
  for (let i=0;i<3;i++) for (const lifeway of h.groups.get('[data-lifeway]')) {
    lifeway.click(); await settle();
    h.element('awaken').click(); lifeway.click(); await settle();
    assert.equal(h.inspect().context.state, 'running'); assert.equal(h.intervals.size, 1);
    h.advance(.3);
  }
  assert.equal(h.errors.length, 0); assert.equal(h.contexts.length, 1);
});


test('stochastic tracks combine only selected modes and finish on the audio clock', async () => {
  const h = habitat();
  for (const input of h.groups.get('[data-track-mode]')) input.checked = ['NOETIC_SURGE','PHASEWEAVE','AETHERFLUX'].includes(input.dataset.trackMode);
  h.element('track-length').value = '126'; h.element('track-variation').value = '1';
  h.element('generate-track').click(); await settle();
  const track = h.track();
  assert.equal(track.sections.length, 42);
  assert.equal(track.interval, 3);
  for (const [i, section] of track.sections.entries()) {
    assert.equal(new Set([section.foundation, ...section.layers]).size, 3);
    if (i) assert.notEqual(section.foundation, track.sections[i-1].foundation);
  }
  const bpm = h.arrangement().bpm;
  for (let tick=0; tick<31; tick++) h.advance(.1);
  assert.equal(h.track().section, 1);
  assert.equal(h.arrangement().bpm, bpm); assert.equal(h.intervals.size, 1);
  h.element('awaken').click(); await settle();
  const elapsed = h.arrangement().elapsed;
  h.advance(20); assert.equal(h.arrangement().elapsed, elapsed);
  h.element('awaken').click(); await settle();
  for (let tick=0; tick<1230; tick++) h.advance(.1);
  await settle();
  assert.equal(h.track(), null); assert.equal(h.inspect().playing, false);
  assert.equal(h.intervals.size, 0); assert.equal(h.inspect().voiceCount, 0);
  assert.match(h.element('track-status').textContent, /complete/);
  assert.equal(h.errors.length, 0);
});

test('composer validates the pool and manual selection exits a generated track', async () => {
  const h = habitat();
  for (const input of h.groups.get('[data-track-mode]')) input.checked = false;
  h.element('generate-track').click(); await settle();
  assert.equal(h.track(), null); assert.equal(h.contexts.length, 0);
  assert.match(h.element('track-status').textContent, /at least two/);
  for (const input of h.groups.get('[data-track-mode]')) input.checked = true;
  h.element('generate-track').click(); await settle();
  assert.ok(h.track());
  h.element('generate-track').click(); await settle();
  assert.equal(h.intervals.size, 1); assert.equal(h.contexts.length, 1);
  h.click('amplifier','VIRIDION'); await settle();
  assert.equal(h.track(), null); assert.equal(h.inspect().playing, true);
});


test('hyperdynamic interval controls transitions independently of tempo', async () => {
  const h = habitat();
  h.element('track-interval').value = '1.5';
  h.element('generate-track').click(); await settle();
  assert.equal(h.track().interval, 1.5);
  h.advance(1.4); assert.equal(h.track().section, 0);
  h.advance(.2); assert.equal(h.track().section, 1);
  h.element('track-interval').value = '-1';
  h.element('generate-track').click(); await settle();
  assert.equal(h.track().interval, 3);
  assert.equal(h.intervals.size, 1);
});
