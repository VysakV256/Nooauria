const SOURCES = new Set(['city', 'rain', 'night', 'mic']);
const PITCHES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const DEFAULT_SEED = 'Rain on concrete, warm bass beneath a midnight canopy';
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const SILENCE = 0.0001;
const SILENT_AURISCAPE = Object.freeze({ level: 0, low: 0, mid: 0, high: 0, beat: 0 });
const HYPERFOREST_PATTERNS = [
  { kicks: [3, 6, 10, 11], ghosts: [2, 7, 9, 15], bass: [3, 6, 8, 10, 14] },
  { kicks: [2, 7, 11, 14], ghosts: [3, 5, 8, 13], bass: [2, 5, 7, 11, 15] },
  { kicks: [5, 8, 10, 13], ghosts: [2, 6, 10, 14], bass: [4, 7, 8, 13, 15] },
  { kicks: [3, 7, 9, 15], ghosts: [1, 6, 11, 14], bass: [3, 5, 9, 11, 14] },
  { kicks: [2, 6, 8, 11, 14], ghosts: [3, 7, 10, 13], bass: [2, 6, 8, 12, 15] },
  { kicks: [5, 9, 10, 13], ghosts: [2, 7, 11, 15], bass: [3, 5, 9, 10, 13] },
];
const HYPERFOREST_PROGRESSIONS = [[0, 0, 3, 5], [0, 5, 2, 4], [0, 2, 5, 3], [0, 3, 6, 4]];
const HYPERFOREST_LAYER_LIMIT = 60;

const clamp = (number, min = 0, max = 1) => Math.max(min, Math.min(max, number));
const midiHz = (note) => 440 * 2 ** ((note - 69) / 12);

function hash(text) {
  let value = 2166136261;
  for (const character of text) {
    value = Math.imul(value ^ character.codePointAt(0), 16777619);
  }
  return value >>> 0;
}

function randomAt(seed, index) {
  let value = seed + Math.imul(index + 1, 0x9e3779b1);
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  return ((value ^ (value >>> 15)) >>> 0) / 4294967296;
}

export function buildScene(prompt = '', mode = 'forest') {
  const cleanPrompt = String(prompt).trim();
  const text = (cleanPrompt || DEFAULT_SEED).toLowerCase();
  const hyper = mode === 'hyperforest';
  const seed = hash(text);
  const storm = /\b(thunder|storm|industrial|metal|chaos|distorted|heavy|dark)\b/.test(text);
  const calm = /\b(calm|gentle|soft|slow|meditative|quiet|sleep|mist|hazy|dreamy|ambient)\b/.test(text);
  const bright = /\b(bright|joyful|sunrise|sunlight|sunny|warm|golden|playful)\b/.test(text);
  const flowing = /\b(stream|waterfall|river|rain|drip|ocean|waves|wet|water)\b/.test(text);
  const canopy = /\b(canopy|birds?|feathers?|jungle|wildlife|tropical|forest|ferns?|garden|crickets?|insects?)\b/.test(text);
  const quick = /\b(fast|jungle|urgent|intense|quick|energetic|frenetic)\b/.test(text);
  const deepBass = /\b(bass|sub|rumble|deep|underground)\b/.test(text);
  const unstable = /\b(chaotic|chaos|stochastic|glitch|glitchy|feral|fractured|stutter|wild|warped)\b/.test(text);
  const explicitTempo = text.match(/\b(\d{2,3})\s*(?:bpm|beats per minute)\b/);
  const explicitKey = text.match(/\b([a-g])([♯#♭b]?)[ -]+(minor|major|dorian)\b/);
  const note = { a: 9, b: 11, c: 0, d: 2, e: 4, f: 5, g: 7 };
  const accidental = explicitKey ? { '#': 1, '♯': 1, b: -1, '♭': -1 }[explicitKey[2]] ?? 0 : 0;
  const pitch = explicitKey ? (note[explicitKey[1]] + accidental + 12) % 12 : [2, 9, 5, 7, 0, 4][seed % 6];
  const scaleName = explicitKey?.[3] ?? (bright && !storm ? 'dorian' : 'minor');
  const tempo = (hyper ? 168 : 122) + (seed % 9) * (hyper ? 1 : 2) + (quick ? 5 : 0) - (calm ? 10 : 0);
  const density = clamp((hyper ? 0.77 : 0.46) + (quick ? 0.09 : 0) + (storm ? 0.12 : 0) - (calm ? 0.15 : 0) + (randomAt(seed, 4) - 0.5) * 0.10, 0.18, 0.97);
  const chaos = clamp(0.64 + (unstable ? 0.22 : 0) + (storm ? 0.13 : 0) + (quick ? 0.08 : 0) -
    (calm ? 0.20 : 0) + (randomAt(seed, 11) - 0.5) * 0.12);

  return {
    prompt: cleanPrompt,
    title: hyper ? 'Hyperforest' : 'Forest',
    mode: hyper ? 'hyperforest' : 'forest',
    bpm: explicitTempo ? clamp(Number(explicitTempo[1]), 55, 220) : tempo,
    key: `${PITCHES[pitch]} ${scaleName}`,
    density,
    chaos: hyper ? chaos : 0,
    seed,
    root: 36 + pitch,
    scale: { major: MAJOR, minor: MINOR, dorian: DORIAN }[scaleName],
    swing: (hyper ? 0.045 : 0.12) + randomAt(seed, 3) * 0.06,
    color: clamp(0.47 + (bright ? 0.24 : 0) - (storm ? 0.25 : 0) + (randomAt(seed, 2) - 0.5) * 0.22),
    water: flowing ? 0.8 : 0.27,
    wildlife: canopy ? 0.74 : 0.39,
    weight: deepBass || storm ? 0.88 : 0.55,
  };
}

function createNoise(context, seconds, seed, color = 0) {
  const buffer = context.createBuffer(1, Math.ceil(seconds * context.sampleRate), context.sampleRate);
  const data = buffer.getChannelData(0);
  let remembered = 0;
  let value = seed;
  for (let index = 0; index < data.length; index++) {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    const white = (value >>> 0) / 2147483648 - 1;
    remembered = (remembered + white * 0.025) / 1.025;
    data[index] = white * (1 - color) + remembered * 6 * color;
  }
  return buffer;
}

function createImpulse(context) {
  const length = Math.ceil(context.sampleRate * 1.65);
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index++) {
      data[index] = (randomAt(1829 + channel, index) * 2 - 1) * (1 - index / length) ** 3.4;
    }
  }
  return buffer;
}

function bandEnergy(spectrum, lowHz, highHz, binHz) {
  const first = Math.max(1, Math.ceil(lowHz / binHz));
  const end = Math.min(spectrum.length, Math.ceil(highHz / binHz));
  let square = 0;
  for (let index = first; index < end; index++) {
    const power = 10 ** (spectrum[index] / 20);
    square += power * power;
  }
  return Math.sqrt(square / Math.max(1, end - first));
}

function waveformLevel(waveform) {
  let squares = 0;
  for (const sample of waveform) squares += sample * sample;
  return Math.sqrt(squares / waveform.length);
}

function emptyMeters(input = 'city') {
  return { level: 0, low: 0, mid: 0, high: 0, onset: 0, beat: 0, step: 0, growth: 0, running: false, input };
}

export class ForestAudio {
  constructor(scene = buildScene()) {
    this.scene = scene;
    this.input = 'city';
    this.volume = 0.72;
    this.running = false;
    this.meters = emptyMeters();
    this.auriscapeMeters = { ...SILENT_AURISCAPE };
    this.inputRequest = 0;
    this.transportRequest = 0;
    this.voices = new Set();
    this.beatTimes = [];
  }

  prepare() {
    if (this.context) return;
    const AudioContext = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AudioContext) throw new Error('Audio synthesis is unavailable in this browser.');
    const context = new AudioContext();
    this.context = context;

    this.master = this.gain(this.volume ** 1.5 * 0.8);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 14;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.007;
    compressor.release.value = 0.24;
    this.master.connect(compressor).connect(context.destination);

    this.meter = context.createAnalyser();
    this.meter.fftSize = 2048;
    this.meter.smoothingTimeConstant = 0.63;
    this.waveform = new Float32Array(this.meter.fftSize);
    this.spectrum = new Float32Array(this.meter.frequencyBinCount);
    this.auriscapeWaveform = new Float32Array(2048);
    this.auriscapeSpectrum = new Float32Array(this.auriscapeWaveform.length / 2);
    this.meter.connect(this.gain(0)).connect(context.destination);
    this.percussionNoise = createNoise(context, 1.5, 733113);
    this.ambientNoise = createNoise(context, 4.7, 517991, 0.8);
    this.impulse = createImpulse(context);
  }

  gain(value) {
    const gain = this.context.createGain();
    gain.gain.value = value;
    return gain;
  }

  filter(type, frequency, q = 0.7) {
    const filter = this.context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    return filter;
  }

  pan(output, amount) {
    if (!this.context.createStereoPanner || amount === 0) return output;
    const pan = this.context.createStereoPanner();
    pan.pan.value = clamp(amount, -1, 1);
    pan.connect(output);
    return pan;
  }

  setScene(scene) {
    this.scene = scene;
  }

  setVolume(volume) {
    this.volume = clamp(Number(volume) || 0);
    if (this.master) this.master.gain.setTargetAtTime(this.volume ** 1.5 * 0.8, this.context.currentTime, 0.03);
  }

  async setInput(input) {
    if (!SOURCES.has(input)) throw new Error('Choose City, Rain, Night or Microphone.');
    const request = ++this.inputRequest;
    if (input === 'mic') {
      if (this.micStream?.getAudioTracks().some((track) => track.readyState === 'live')) return;
      if (!globalThis.navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access requires a secure page and a supported browser.');
      }

      this.prepare();
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false },
        });
      } catch (error) {
        if (request !== this.inputRequest) return;
        if (error.name === 'NotFoundError') throw new Error('No microphone was found.');
        if (error.name === 'NotReadableError') throw new Error('Your microphone is already in use or unavailable.');
        throw new Error('Microphone access was unavailable. Check this site’s microphone permission.');
      }

      if (request !== this.inputRequest) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      let source;
      try {
        source = this.context.createMediaStreamSource(stream);
      } catch (error) {
        stream.getTracks().forEach((track) => track.stop());
        throw error;
      }

      this.disconnectInput();
      this.input = 'mic';
      this.micStream = stream;
      this.micSource = source;
      this.micSource.connect(this.meter);
      this.resetMeters();
      for (const track of stream.getAudioTracks()) {
        track.addEventListener('ended', () => {
          if (this.micStream === stream) this.setInput('city');
        });
      }
      return;
    }

    if (input === this.input && (!this.running || this.demo)) return;
    this.disconnectInput();
    this.input = input;
    this.resetMeters();
    if (this.running) this.connectDemo();
  }

  disconnectInput() {
    this.micSource?.disconnect();
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
    this.micSource = null;
    this.demo?.source.stop();
    this.demo?.source.disconnect();
    this.demo?.analyserSend.disconnect();
    this.demo?.monitor.disconnect();
    this.demo = null;
  }

  connectDemo() {
    const context = this.context;
    const source = context.createBufferSource();
    const demoSettings = {
      city: { highpass: 26, lowpass: 430, gain: 0.25, monitor: 0.25, rate: 0.82 },
      rain: { highpass: 520, lowpass: 7800, gain: 0.31, monitor: 0.15, rate: 1.12 },
      night: { highpass: 220, lowpass: 2400, gain: 0.14, monitor: 0.28, rate: 0.65 },
    };
    const settings = demoSettings[this.input];
    const highpass = this.filter('highpass', settings.highpass);
    const lowpass = this.filter('lowpass', settings.lowpass);
    const analyserSend = this.gain(settings.gain);
    const monitor = this.gain(settings.monitor);
    source.buffer = this.ambientNoise;
    source.loop = true;
    source.playbackRate.value = settings.rate;
    source.connect(highpass).connect(lowpass).connect(analyserSend);
    analyserSend.connect(this.meter);
    analyserSend.connect(monitor).connect(this.transport);
    this.demo = { source, analyserSend, monitor, nextEvent: context.currentTime + 0.12, index: 0 };
    source.start();
  }

  async start() {
    if (this.running) return;
    const request = ++this.transportRequest;
    this.prepare();
    await this.context.resume();
    if (request !== this.transportRequest) return;
    if (this.input === 'mic' && !this.micSource) await this.setInput('mic');
    if (request !== this.transportRequest) return;

    this.transport = this.gain(0);
    this.transport.connect(this.master);
    this.transport.gain.setTargetAtTime(1, this.context.currentTime, 0.04);
    this.auriscapeAnalyser = this.context.createAnalyser();
    this.auriscapeAnalyser.fftSize = this.auriscapeWaveform.length;
    this.auriscapeAnalyser.smoothingTimeConstant = 0.4;
    this.auriscapeAnalyser.connect(this.transport);
    this.drums = this.gain(0.82);
    this.drums.connect(this.auriscapeAnalyser);
    this.basses = this.gain(0.52);
    this.basses.connect(this.auriscapeAnalyser);
    this.nature = this.gain(0.75);
    this.nature.connect(this.auriscapeAnalyser);
    this.wet = this.context.createConvolver();
    this.wet.buffer = this.impulse;
    const wetGain = this.gain(0.54);
    this.wet.connect(wetGain).connect(this.auriscapeAnalyser);

    this.resetMeters();
    this.auriscapeMeters = { ...SILENT_AURISCAPE };
    this.lastAuriscapeLevel = 0;
    this.running = true;
    this.step = 0;
    this.nextTime = this.context.currentTime + 0.11;
    this.nextListen = this.context.currentTime;
    this.lastChirp = -Infinity;
    if (this.input !== 'mic') this.connectDemo();
    this.tick();
    this.clock = setInterval(() => this.tick(), 24);
  }

  stop() {
    this.transportRequest++;
    this.inputRequest++;
    this.running = false;
    this.disconnectInput();
    clearInterval(this.clock);
    this.clock = undefined;
    this.resetMeters();
    if (!this.transport) return;

    const now = this.context.currentTime;
    const output = this.transport;
    const analyser = this.auriscapeAnalyser;
    output.gain.cancelScheduledValues(now);
    output.gain.setTargetAtTime(0, now, 0.012);
    for (const voice of this.voices) voice.stop(now + 0.07);
    this.voices.clear();
    this.transport = null;
    this.auriscapeAnalyser = null;
    setTimeout(() => {
      analyser.disconnect();
      output.disconnect();
    }, 90);
  }

  resetMeters() {
    this.meters = emptyMeters(this.input);
    this.lastEnergy = 0;
    this.onsetFloor = 0;
    this.beatTimes.length = 0;
  }

  getMeters() {
    const now = this.context?.currentTime ?? 0;
    while (this.beatTimes[1]?.time <= now) this.beatTimes.shift();
    const last = this.beatTimes[0];
    const elapsed = last ? now - last.time : -1;
    return {
      ...this.meters,
      step: elapsed >= 0 ? last.step % 16 : 0,
      beat: elapsed >= 0 && last.step % 4 === 0 ? Math.exp(-12 * elapsed) : 0,
      running: this.running,
      input: this.input,
    };
  }

  getAuriscapeMeters() {
    return this.running ? { ...this.auriscapeMeters } : SILENT_AURISCAPE;
  }

  getWaveform(target) {
    if (!this.running) return target.fill(128);

    const stride = this.waveform.length / target.length;
    for (let index = 0; index < target.length; index++) {
      const sample = this.waveform[Math.floor(index * stride)];
      target[index] = Math.round(clamp((sample + 1) * 128, 0, 255));
    }
    return target;
  }

  analyse(now) {
    this.meter.getFloatTimeDomainData(this.waveform);
    this.meter.getFloatFrequencyData(this.spectrum);
    const rawLevel = waveformLevel(this.waveform);
    const scale = this.input === 'mic' ? 3.8 : 8.5;
    const raw = clamp(Math.pow(rawLevel * scale, 0.73));
    const binHz = this.context.sampleRate / this.meter.fftSize;
    const sensitivity = this.input === 'mic' ? 1 : 1.6;
    const low = clamp(Math.sqrt(bandEnergy(this.spectrum, 45, 280, binHz)) * 2.9 * sensitivity);
    const mid = clamp(Math.sqrt(bandEnergy(this.spectrum, 280, 2300, binHz)) * 3.7 * sensitivity);
    const high = clamp(Math.sqrt(bandEnergy(this.spectrum, 2300, 11000, binHz)) * 5.1 * sensitivity);
    const attack = Math.max(0, raw - this.lastEnergy);
    const onset = clamp((attack - this.onsetFloor * 0.35) * 4.2);
    this.onsetFloor += (attack - this.onsetFloor) * 0.035;
    this.lastEnergy = raw;
    const meters = this.meters;
    meters.level += (raw - meters.level) * (raw > meters.level ? 0.46 : 0.16);
    meters.low += (low - meters.low) * 0.23;
    meters.mid += (mid - meters.mid) * 0.23;
    meters.high += (high - meters.high) * 0.25;
    meters.onset = Math.max(onset, meters.onset * 0.72);
    const growth = clamp(meters.level * 0.74 + meters.mid * 0.16 + meters.high * 0.12 + meters.onset * 0.31);
    meters.growth += (growth - meters.growth) * (growth > meters.growth ? 0.05 : 0.022);
    this.nature.gain.setTargetAtTime(0.31 + meters.growth * 0.95, now, 0.1);
    this.basses.gain.setTargetAtTime(0.27 + meters.low * 0.41 + meters.level * 0.18, now, 0.08);
    this.drums.gain.setTargetAtTime(0.67 + meters.mid * 0.18 + meters.level * 0.16, now, 0.06);
    if (onset > 0.18 && now - this.lastChirp > 0.24) {
      if (meters.high >= meters.low * 0.8) this.bird(now + 0.02, 0.08 + onset * 0.14, randomAt(this.scene.seed, this.step * 11));
      else this.wood(now + 0.035, 0.10 + onset * 0.19, 2, -0.28);
      this.lastChirp = now;
    }
  }

  analyseAuriscape() {
    const analyser = this.auriscapeAnalyser;
    analyser.getFloatTimeDomainData(this.auriscapeWaveform);
    analyser.getFloatFrequencyData(this.auriscapeSpectrum);
    const binHz = this.context.sampleRate / analyser.fftSize;
    const spectrum = this.auriscapeSpectrum;
    const level = clamp((waveformLevel(this.auriscapeWaveform) * 3.8) ** 0.73);
    const low = clamp(Math.sqrt(bandEnergy(spectrum, 35, 280, binHz)) * 3.8);
    const mid = clamp(Math.sqrt(bandEnergy(spectrum, 280, 2300, binHz)) * 4.4);
    const high = clamp(Math.sqrt(bandEnergy(spectrum, 2300, 11000, binHz)) * 6.6);
    const beat = clamp((level - this.lastAuriscapeLevel) * 4.4);
    this.lastAuriscapeLevel = level;
    const meters = this.auriscapeMeters;
    meters.level += (level - meters.level) * (level > meters.level ? 0.46 : 0.16);
    meters.low += (low - meters.low) * 0.32;
    meters.mid += (mid - meters.mid) * 0.24;
    meters.high += (high - meters.high) * 0.26;
    meters.beat = Math.max(beat, meters.beat * 0.62);
  }

  tick() {
    if (!this.running) return;
    const now = this.context.currentTime;
    if (this.nextTime < now - 0.1) this.nextTime = now + 0.025;
    if (now >= this.nextListen) {
      this.analyse(now);
      this.analyseAuriscape();
      this.nextListen = now + 0.035;
    }

    if (this.demo && this.demo.nextEvent < now + 0.12) this.demoEvent(Math.max(now + 0.015, this.demo.nextEvent));
    while (this.nextTime < now + 0.13) {
      const position = this.step;
      const seconds = 60 / this.scene.bpm / 4;
      const time = Math.max(now + 0.008, this.nextTime + (position % 2 ? seconds * this.scene.swing : 0));
      this.schedule(position, time, seconds);
      this.beatTimes.push({ time, step: position });
      while (this.beatTimes[1]?.time <= now) this.beatTimes.shift();
      this.step++;
      this.nextTime += seconds;
    }
  }

  schedule(position, time, seconds) {
    const scene = this.scene;
    if (scene.mode === 'hyperforest') {
      this.scheduleHyperforest(position, time, seconds);
      return;
    }

    const step = position % 16;
    const measure = Math.floor(position / 16);
    const variant = measure % 4;
    const meters = this.meters;
    const random = (channel) => randomAt(scene.seed, position * 11 + channel);
    const drive = clamp(meters.level * 0.60 + meters.onset * 0.28 + meters.mid * 0.12);
    const density = clamp(scene.density * (0.48 + drive * 0.95) + meters.high * 0.14);
    const velocity = 0.55 + meters.level * 0.25 + meters.onset * 0.14;
    const offKick = [[7, 10], [8, 14], [6, 11], [7, 12]][variant];

    if (step === 0 || (offKick.includes(step) && random(0) < 0.54 + density * 0.44)) {
      this.kick(time, velocity * (step === 0 ? 0.92 : 0.79) * (0.88 + meters.low * 0.16));
    }
    if (step === 4 || step === 12) this.snare(time, velocity * 0.59, false);
    else if ([3, 11, 15].includes(step) && random(1) < density * 0.85) {
      this.snare(time, velocity * (0.18 + random(7) * 0.22), false);
    }

    const openHat = step === 6;
    if (openHat || (step % 2 === 0 ? random(2) < 0.66 + density * 0.28 : random(2) < density * 0.53)) {
      this.hat(time, (0.12 + random(8) * 0.15 + meters.high * 0.12) * velocity, openHat, (random(5) - 0.5) * 0.8);
    }

    if ([0, 7, 10].includes(step) && (step === 0 || random(3) < 0.6 + density * 0.38)) {
      const roots = [0, 0, 3, 5];
      const degree = step === 0 ? roots[variant] : [0, 0, 1, 2, 4, 5, 6][Math.floor(random(5) * 7)];
      const note = scene.root + scene.scale[degree];
      this.bass(time, note > 44 ? note - 12 : note, seconds * (step === 0 ? 5.1 : 1.9 + random(6)), velocity * scene.weight, false);
    }

    if (step === 0) this.pad(time, scene.root + scene.scale[[0, 2, 3, 4][variant]], seconds * 20, 0.055 + drive * 0.13);
    if (random(4) < density * (0.27 + meters.mid * 0.34) && (step !== 4 && step !== 12)) {
      this.wood(time, 0.08 + drive * 0.24, Math.floor(random(7) * 7), random(6) * 1.4 - 0.7);
    }
    if (random(5) < (scene.wildlife * 0.10 + scene.water * 0.035) * (0.38 + meters.growth + meters.high * 1.6) && time - this.lastChirp > 0.21) {
      this.bird(time, 0.05 + meters.high * 0.13 + drive * 0.10, random(9));
      this.lastChirp = time;
    }
  }

  scheduleHyperforest(position, time, seconds) {
    const { scene, meters } = this;
    const step = position % 16;
    const bar = Math.floor(position / 16);
    const phrase = Math.floor(bar / 4);
    const barInPhrase = bar % 4;
    const phraseSeed = scene.seed ^ Math.imul(phrase + 1, 0x7feb352d);
    const variation = (lane) => randomAt(phraseSeed ^ 0x4f1bbcdd, barInPhrase * 8 + lane);
    const hit = (lane) => randomAt(phraseSeed, (position % 64) * 24 + lane);
    const chaos = scene.chaos ?? 0.64;
    const density = clamp(scene.density * 0.52 + chaos * 0.24 + meters.level * 0.23 + meters.onset * 0.18);
    const velocity = 0.60 + meters.level * 0.20 + meters.onset * 0.12;
    const patterns = HYPERFOREST_PATTERNS;
    const motif = Math.floor(randomAt(phraseSeed, 17) * patterns.length);
    const mutation = barInPhrase > 0 && variation(0) < chaos * 0.92 ? 1 + Math.floor(variation(1) * (patterns.length - 1)) : 0;
    const pattern = patterns[(motif + mutation) % patterns.length];
    const turnaround = barInPhrase === 3;
    const gapStart = variation(3) < 0.5 ? 5 : 9;
    const dropout = barInPhrase > 0 && variation(2) < chaos * 0.50 && step >= gapStart && step < gapStart + 3;
    const fits = (sources) => this.voices.size + sources <= HYPERFOREST_LAYER_LIMIT;

    // Anchor the shifting breaks with a kick at the bar line and two backbeats.
    if (step === 0) this.kick(time, velocity * (0.88 + meters.low * 0.10));
    if (step === 4 || step === 12) this.snare(time, velocity * 0.88, true);

    if (!dropout && pattern.kicks.includes(step) && hit(0) < 0.51 + density * 0.40 + meters.low * 0.09 && fits(2)) {
      this.kick(time + seconds * hit(1) * 0.07, velocity * (0.49 + hit(2) * 0.31));
    }
    if (!dropout && pattern.ghosts.includes(step) && hit(3) < 0.27 + density * 0.64 + meters.mid * 0.14 && fits(3)) {
      this.snare(time + seconds * (0.07 + hit(4) * 0.24), velocity * (0.19 + hit(5) * 0.23), true);
    }
    const openHat = (step === 6 || step === 14) && hit(6) < 0.72;
    const hatChance = (step % 2 === 0 ? 0.34 : 0.16) + density * 0.48 + meters.high * 0.22;
    if (!dropout && (openHat || hit(7) < hatChance) && fits(1)) {
      this.hat(time + seconds * hit(8) * 0.18, velocity * (0.11 + hit(9) * 0.19 + meters.high * 0.15), openHat, hit(10) * 1.6 - 0.8);
    }

    const progressions = HYPERFOREST_PROGRESSIONS;
    const progression = progressions[Math.floor(randomAt(phraseSeed, 37) * progressions.length)];
    const degree = progression[barInPhrase];
    const bassChance = 0.46 + density * 0.35 + meters.low * 0.17;
    if ((step === 0 || (!dropout && pattern.bass.includes(step) && hit(11) < bassChance)) && fits(2)) {
      const intervals = [0, 0, 1, 2, 4, 5, 6];
      const offset = step === 0 ? 0 : intervals[Math.floor(hit(12) * intervals.length)];
      const scaleSize = scene.scale.length;
      const scaleDegree = (degree + offset) % scaleSize;
      const note = scene.root + scene.scale[scaleDegree];
      const short = hit(13) < chaos * 0.58;
      const duration = seconds * (step === 0 ? 2.6 + hit(14) * 1.5 : short ? 0.54 + hit(14) * 0.42 : 1.45 + hit(14) * 0.82);
      const adjacent = scaleDegree + (hit(16) < 0.5 ? -1 : 1);
      const adjacentNote = scene.scale[(adjacent + scaleSize) % scaleSize] + 12 * Math.floor(adjacent / scaleSize);
      const semitoneBend = step > 0 && hit(15) < chaos * 0.56 ? adjacentNote - scene.scale[scaleDegree] : 0;
      this.bass(time, note > 44 ? note - 12 : note, duration, velocity * scene.weight * (step === 0 ? 0.95 : 0.78), true, {
        semitoneBend,
        modulation: chaos * hit(17),
      });
    }
    if (step === 0 && (!turnaround || variation(4) > chaos * 0.6) && fits(4)) {
      this.pad(time, scene.root + scene.scale[degree], seconds * (12 + variation(5) * 6), 0.054 + meters.growth * 0.11);
    }

    const close = step === 15 && (turnaround || (barInPhrase === 1 && variation(6) < chaos));
    const pickup = [7, 11, 15].includes(step) && hit(18) < chaos * 0.35 + meters.onset * 0.34;
    if ((close || (!dropout && pickup)) && fits(4)) {
      this.breakFill(time, seconds, velocity, chaos, hit(19), turnaround);
    } else if (hit(19) < 0.15 + chaos * 0.17 + meters.high * 0.23 + meters.onset * 0.22 && fits(4)) {
      const character = hit(20);
      const strength = 0.10 + chaos * 0.11 + meters.high * 0.12;
      this.grain(time + seconds * 0.23, strength, degree, character, character * 1.5 - 0.75);
      if (character > 0.48 || meters.onset > 0.27) {
        this.grain(time + seconds * (0.57 + character * 0.24), strength * 0.69, (degree + 2) % scene.scale.length, 1 - character, 0.8 - character * 1.6);
      }
    } else if (hit(21) < (scene.wildlife * 0.12 + scene.water * 0.05) * (0.46 + meters.growth + meters.high) &&
        time - this.lastChirp > 0.21 && fits(3)) {
      this.bird(time, 0.07 + meters.high * 0.14 + meters.onset * 0.12, hit(22));
      this.lastChirp = time;
    }
  }

  breakFill(time, seconds, velocity, chaos, character, turnaround) {
    const offsets = turnaround || character < chaos * 0.61 ? [0.08, 0.36, 0.63, 0.87] : [0.22, 0.54, 0.86];
    const lean = character < 0.5 ? -1 : 1;
    offsets.forEach((offset, index) => {
      const shell = character + index * 0.24;
      this.noise({
        output: this.pan(this.drums, lean * (index % 2 ? -0.73 : 0.66)),
        time: time + seconds * offset,
        highpass: 680 + shell * 1840,
        lowpass: 3600 + shell * 3600,
        peak: velocity * (0.31 + chaos * 0.19) * (1 - index * 0.12),
        attack: 0.002,
        release: Math.min(0.041, seconds * (0.34 + character * 0.20)),
        q: 1.05 + character * 0.55,
        rate: 0.72 + shell * 0.74,
        offset: character * 0.66 + index * 0.19,
      });
    });
  }

  grain(time, velocity, degree, character, pan) {
    const output = this.pan(this.nature, pan);
    const frequency = midiHz(this.scene.root + 36 + this.scene.scale[degree]);
    const color = this.scene.color * 0.55 + this.meters.high * 0.33 + character * 0.12;
    this.tone({
      output, start: time, type: 'triangle',
      frequency: frequency * (0.84 + character * 0.68),
      endFrequency: frequency * (0.78 + color * 0.55),
      bend: 0.044, peak: velocity * 0.46, attack: 0.004, release: 0.046 + character * 0.060,
    });
    this.noise({
      output, time,
      highpass: 240 + color * 1020,
      lowpass: 1300 + color * 4100,
      peak: velocity * 0.53, attack: 0.003, release: 0.027 + character * 0.062,
      color: 'pink', rate: 0.52 + character * 1.20, offset: character * 3.6,
    });
  }

  envelope(output, time, peak, attack, release) {
    const gain = this.gain(0);
    gain.gain.setValueAtTime(SILENCE, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(SILENCE, peak), time + attack);
    gain.gain.exponentialRampToValueAtTime(SILENCE, time + attack + release);
    gain.connect(output);
    return gain;
  }

  track(source, time, end, offset) {
    this.voices.add(source);
    source.onended = () => {
      this.voices.delete(source);
      source.disconnect();
    };
    if (offset === undefined) source.start(time);
    else source.start(time, offset);
    source.stop(end);
  }

  tone({ type = 'sine', start, frequency, endFrequency = frequency, bend = 0.1, peak, attack = 0.004, release, output }) {
    const oscillator = this.context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(15, endFrequency), start + bend);
    oscillator.connect(this.envelope(output, start, peak, attack, release));
    this.track(oscillator, start, start + attack + release + 0.016);
    return oscillator;
  }

  noise({ output, time, highpass, lowpass, peak, attack = 0.003, release, q = 0.7, color = 'white', rate = 1, bend, offset }) {
    const source = this.context.createBufferSource();
    source.buffer = color === 'white' ? this.percussionNoise : this.ambientNoise;
    source.loop = true;
    source.playbackRate.value = rate;
    const low = this.filter('lowpass', lowpass, q);
    if (bend) {
      low.frequency.setValueAtTime(lowpass, time);
      low.frequency.exponentialRampToValueAtTime(bend, time + attack + release * 0.55);
    }
    source.connect(this.filter('highpass', highpass)).connect(low);
    low.connect(this.envelope(output, time, peak, attack, release));
    this.track(source, time, time + attack + release + 0.016, offset);
  }

  kick(time, velocity) {
    this.tone({ output: this.drums, start: time, frequency: 149, endFrequency: 44, bend: 0.09, peak: velocity * 0.9, release: 0.24 });
    this.noise({ output: this.drums, time, highpass: 500, lowpass: 1800, peak: velocity * 0.19, release: 0.025 });
  }

  snare(time, velocity, hyper) {
    const bodyTime = hyper ? 0.083 : 0.11;
    const shell = this.gain(1);
    shell.connect(this.drums);
    if (velocity > 0.32) shell.connect(this.wet);
    this.noise({ output: shell, time, highpass: 980, lowpass: hyper ? 6300 : 4200, peak: velocity * 0.88, release: hyper ? 0.15 : 0.13, bend: 2600 });
    this.noise({ output: this.drums, time: time + 0.008, highpass: 230, lowpass: 1300, peak: velocity * 0.62, release: 0.082, q: 1.35 });
    this.tone({ output: this.drums, type: 'triangle', start: time, frequency: 245, endFrequency: 154, bend: 0.045, peak: velocity * 0.40, release: bodyTime });
  }

  hat(time, velocity, open, pan) {
    this.noise({ output: this.pan(this.drums, pan), time, highpass: open ? 4500 : 5300, lowpass: open ? 10500 : 13600, peak: velocity * 0.68, release: open ? 0.16 : 0.047, q: 0.9 });
  }

  bass(time, note, duration, velocity, hyper, { semitoneBend = 0, modulation = 0 } = {}) {
    const frequency = midiHz(note);
    const endFrequency = semitoneBend ? midiHz(note + semitoneBend) : frequency;
    const bend = semitoneBend ? Math.max(0.024, duration * 0.72) : 0.1;
    this.tone({ output: this.basses, start: time, frequency, endFrequency, bend, peak: velocity * 0.69, attack: 0.018, release: duration });
    const filter = this.filter('lowpass', 220, hyper ? 2.9 : 1.1);
    const cutoff = 180 + this.scene.color * 820 + this.meters.low * 500;
    filter.frequency.setValueAtTime(cutoff, time);
    if (modulation > 0.28) {
      filter.frequency.exponentialRampToValueAtTime(130 + cutoff * 0.28, time + duration * 0.30);
      filter.frequency.exponentialRampToValueAtTime(cutoff * (1 + modulation * 0.41), time + duration * 0.62);
    }
    filter.frequency.exponentialRampToValueAtTime(135, time + Math.max(0.10, duration * 0.8));
    filter.connect(this.basses);
    const detuning = hyper ? 1.007 : 2;
    this.tone({ output: filter, type: hyper ? 'sawtooth' : 'triangle', start: time, frequency: frequency * detuning, endFrequency: endFrequency * detuning, bend, peak: velocity * (hyper ? 0.38 : 0.18), attack: 0.025, release: duration * 0.94 });
  }

  pad(time, note, duration, velocity) {
    const chord = [0, this.scene.scale[2], 7, this.scene.scale[6]];
    const color = this.filter('lowpass', 540 + this.scene.color * 2300 + this.meters.mid * 1100);
    const dry = this.gain(0.55);
    color.connect(dry).connect(this.nature);
    color.connect(this.wet);
    chord.forEach((semitones, index) => {
      const frequency = midiHz(note + 24 + semitones);
      this.tone({ output: this.pan(color, index * 0.32 - 0.48), type: index % 2 ? 'sine' : 'triangle', start: time + index * 0.11, frequency, endFrequency: frequency * (index % 2 ? 1.002 : 0.998), bend: duration, peak: velocity * (index === 0 ? 0.56 : 0.27), attack: duration * (0.22 + index * 0.026), release: duration * 0.78 });
    });
  }

  wood(time, velocity, degree, pan) {
    const output = this.gain(0.8);
    output.connect(this.pan(this.nature, pan));
    output.connect(this.wet);
    const frequency = midiHz(this.scene.root + 24 + this.scene.scale[degree]);
    this.tone({ output, start: time, type: 'triangle', frequency: frequency * 1.09, endFrequency: frequency, bend: 0.021, peak: velocity * 0.59, release: 0.17 });
    this.tone({ output, start: time, frequency: frequency * 2.81, endFrequency: frequency * 2.59, bend: 0.061, peak: velocity * 0.13, release: 0.09 });
    this.noise({ output, time, highpass: 120, lowpass: 550 + this.scene.water * 1000, peak: velocity * 0.38, release: 0.04 });
  }

  bird(time, velocity, character) {
    const output = this.gain(0.72);
    output.connect(this.pan(this.nature, character * 1.7 - 0.85));
    output.connect(this.wet);
    const frequency = 1100 + this.scene.color * 1250 + character * 1540;
    const duration = 0.075 + character * 0.12;
    const startFrequency = character < 0.5 ? frequency * 0.78 : frequency * 1.28;
    this.tone({ output, start: time, frequency: startFrequency, endFrequency: frequency, bend: duration * 0.61, peak: velocity * 0.50, attack: 0.016, release: duration });
    if (character > 0.19) {
      this.tone({ output, start: time + duration * 0.86, frequency: frequency * 1.30, endFrequency: frequency * 0.83, bend: 0.09, peak: velocity * 0.29, attack: 0.015, release: 0.10 });
    }
    if (this.scene.water > 0.5) this.noise({ output, time: time + 0.08, highpass: 380, lowpass: 2450, peak: velocity * 0.2, attack: 0.012, release: 0.21, bend: 640 });
  }

  demoEvent(time) {
    const demo = this.demo;
    const index = demo.index++;
    const sample = (offset) => randomAt(hash(this.input), index * 5 + offset);
    const output = demo.analyserSend;
    if (this.input === 'city') {
      const speed = sample(0);
      const duration = 0.7 + speed * 1.65;
      this.noise({ output, time, highpass: 38, lowpass: 660 + speed * 720, peak: 0.27 + sample(1) * 0.63, attack: duration * 0.24, release: duration * 0.8, color: 'pink', rate: 0.6 + speed * 0.8, bend: 170 + speed * 200 });
      this.tone({ output, type: 'triangle', start: time + 0.06, frequency: 56 + speed * 29, endFrequency: 29 + speed * 18, bend: duration, peak: 0.095 + speed * 0.31, attack: duration * 0.24, release: duration * 0.78 });
      if (index % 5 === 1) {
        const horn = 178 + sample(2) * 134;
        this.tone({ output, type: 'triangle', start: time + 0.26, frequency: horn, endFrequency: horn * 0.89, bend: 0.27, peak: 0.27, attack: 0.018, release: 0.28 });
        this.tone({ output, start: time + 0.30, frequency: horn * 1.49, endFrequency: horn * 1.43, bend: 0.22, peak: 0.12, attack: 0.018, release: 0.21 });
      }
      demo.nextEvent = time + 0.76 + sample(3) * 1.7;
    } else if (this.input === 'rain') {
      const impact = sample(0);
      this.noise({ output, time, highpass: 710 + impact * 1800, lowpass: 4700 + impact * 3700, peak: 0.35 + sample(1) * 0.41, attack: 0.004, release: 0.048 + impact * 0.08, rate: 1.25 + sample(2), bend: 2100 });
      if (index % 12 === 0) this.noise({ output, time: time + 0.08, highpass: 35, lowpass: 320, peak: 0.55, attack: 0.23, release: 1.3, color: 'pink', bend: 105 });
      demo.nextEvent = time + 0.14 + sample(3) * 0.60;
    } else {
      const note = 2700 + sample(0) * 1900;
      const spacing = 0.073 + sample(1) * 0.045;
      for (let pulse = 0; pulse < 3; pulse++) {
        this.tone({ output, start: time + pulse * spacing, frequency: note * (1 + pulse * 0.012), endFrequency: note * 0.94, bend: 0.047, peak: 0.25 + sample(2) * 0.25, attack: 0.006, release: 0.056 });
      }
      if (index % 6 === 0) this.tone({ output, start: time + 0.30, frequency: 271, endFrequency: 237, bend: 0.42, peak: 0.35, attack: 0.09, release: 0.52 });
      demo.nextEvent = time + 0.67 + sample(3) * 1.54;
    }
  }
}
