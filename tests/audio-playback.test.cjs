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

function habitat() {
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
    start() { this.started = true; this.context.starts++; }
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
      e.setAttribute = () => {};
      e.getContext = () => new Proxy({}, { get: () => () => {} });
      e.click = () => { e.emit('click'); document.emit('click'); };
      elements.set(id, e);
    }
    return elements.get(id);
  }
  for (const attribute of ['amplifier','lifeway','spectrum','geometry']) {
    const list = [...html.matchAll(new RegExp(`data-${attribute}="([^"]+)"`, 'g'))].map(m => {
      const e = element(`${attribute}:${m[1]}`); e.dataset[attribute] = m[1]; return e;
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
  return { contexts, intervals, groups, element, document, window, errors, inspect: sandbox.inspectAudio,
    click: (kind, name) => element(`${kind}:${name}`).click(),
    advance(seconds) { const ctx = sandbox.inspectAudio().context; ctx.advance(seconds); for (const fn of [...intervals.values()]) fn(); } };
}

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
