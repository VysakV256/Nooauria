import { buildScene, ForestAudio } from './audio.js';
import { createForestVisualizer } from './visual.js';
import { createAuriscapeShader } from './shader.js';

const byId = (id) => document.getElementById(id);
const scene = byId('scene');
const title = byId('scene-title');
const fieldStatus = byId('field-status');
const form = byId('seed-form');
const promptInput = byId('prompt');
const playButton = byId('play-button');
const micButton = byId('mic-button');
const volume = byId('volume');
const visualizerToggle = byId('visualizer-toggle');
const neonToggle = byId('neon-toggle');
const visualizerSignals = byId('visualizer-signals');
const ambientSignal = byId('ambient-signal');
const auriscapeSignal = byId('auriscape-signal');
const inputError = byId('input-error');
const transportError = byId('transport-error');
const inputButtons = [...document.querySelectorAll('[data-input]')];
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const presets = [...document.querySelectorAll('[data-prompt]')];
const meterLights = [...byId('input-meter').children];
const waveform = new Uint8Array(230);
const visual = createForestVisualizer(byId('field-canvas'), { waveformPosition: 0.69 });
const shader = createAuriscapeShader(byId('auriscape-canvas'));
const sourceNames = { city: 'City streets', rain: 'Rainfall', night: 'Night air', mic: 'Live microphone' };
const modeNames = { forest: 'Forest', hyperforest: 'Hyperforest' };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const FLASH_INTERVAL_MS = 420;

let current = buildScene(promptInput.value);
let input = 'city';
let lastDemo = 'city';
let awaitingMicrophone = false;
let inputRequest = 0;
let isStarting = false;
let muted = false;
let immersive = false;
let neon = false;
let lastFlashTime = -Infinity;
let flashStrength = 0;
let flashIndex = 0;
let previousBeat = false;
let previousAttack = false;
let canvasGrowth = 0.90;
let hasPlayed = false;
let lastFrame = performance.now();
let lastPercent = null;
let lastLevel = null;

const audio = new ForestAudio(current);

function announce(message) {
  byId('announcement').textContent = message;
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

function setSignalLevel(meter, signal) {
  const level = Math.round(signal * 100) / 100;
  if (meter.value !== level) meter.value = level;
}

function neonFlash(time, field, auriscape) {
  // Step eight has no guaranteed kick or backbeat.
  const beat = field.beat >= 0.64 && field.step !== 8;
  const attack = auriscape.beat >= 0.44;
  const accent = (beat && !previousBeat) || (attack && !previousAttack);
  previousBeat = beat;
  previousAttack = attack;

  if (!neon || !field.running || document.hidden || reducedMotion.matches) {
    flashStrength = 0;
    return 0;
  }

  if (accent && time - lastFlashTime >= FLASH_INTERVAL_MS) {
    lastFlashTime = time;
    flashStrength = Math.min(0.92, 0.49 + Math.max(auriscape.beat, auriscape.low) * 0.43);
    flashIndex += auriscape.high > auriscape.mid ? 7 : 3;
  }
  return flashStrength * Math.exp(-(time - lastFlashTime) / 92);
}

function sceneName(prompt) {
  const phrase = prompt.split(/[,.!?;\n]+/, 1)[0].trim() || prompt;
  const words = phrase.split(/\s+/);
  if (words.length <= 5 && phrase.length <= 50) return phrase;
  const shortened = words.slice(0, 5).join(' ');
  if (shortened.length <= 50) return shortened;
  const prefix = shortened.slice(0, 50);
  const lastSpace = prefix.lastIndexOf(' ');
  return (lastSpace > 22 ? prefix.slice(0, lastSpace) : prefix) + '…';
}

function drawSceneDetails() {
  title.textContent = sceneName(current.prompt);
  byId('scene-bpm').textContent = current.bpm + ' BPM';
  byId('scene-key').textContent = current.key;
  byId('scene-mode').textContent = modeNames[current.mode];
  for (const button of modeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === current.mode));
  }
}

function drawTransport() {
  const { running } = audio.getMeters();
  scene.dataset.playing = String(running);
  fieldStatus.textContent = running ? 'Field active' : hasPlayed ? 'Field paused' : 'Field ready';
  byId('play-label').textContent = running ? 'Pause scene' : isStarting ? 'Starting…' : 'Play scene';
  byId('play-icon').setAttribute('href', running ? '#i-pause' : '#i-play');
  playButton.disabled = isStarting;
}

function drawInput() {
  for (const button of inputButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.input === input));
  }
  micButton.disabled = awaitingMicrophone;
  byId('field-input').textContent = sourceNames[input];
  if (awaitingMicrophone) {
    byId('input-description').textContent = 'Waiting for microphone permission…';
  } else if (input === 'mic') {
    byId('input-description').textContent = audio.getMeters().running
      ? 'Microphone is live locally.'
      : 'Microphone reconnects when you play.';
  } else {
    byId('input-description').textContent = 'Microphone audio stays on this device.';
  }
}

function drawVolume() {
  const silent = muted || Number(volume.value) === 0;
  audio.setVolume(silent ? 0 : Number(volume.value) / 100);
  byId('sound-icon').setAttribute('href', silent ? '#i-mute' : '#i-sound');
  byId('sound-toggle').setAttribute('aria-label', silent ? 'Unmute audio' : 'Mute audio');
  byId('sound-toggle').setAttribute('aria-pressed', String(silent));
}

async function play() {
  if (isStarting || audio.getMeters().running) return;
  isStarting = true;
  showError(transportError, '');
  drawTransport();
  try {
    await audio.start();
    if (!audio.getMeters().running) return;
    if (!hasPlayed) canvasGrowth = 0.07;
    hasPlayed = true;
  } catch (error) {
    if (input === 'mic') {
      await audio.setInput(lastDemo);
      input = lastDemo;
      showError(inputError, error.message);
    } else {
      showError(transportError, error.message || 'Your browser could not start the audio.');
    }
  } finally {
    isStarting = false;
    drawTransport();
    drawInput();
  }
}

function pause() {
  if (awaitingMicrophone) {
    awaitingMicrophone = false;
    inputRequest++;
  }
  audio.stop();
  drawTransport();
  drawInput();
}

function togglePlayback() {
  if (isStarting) return;
  if (audio.getMeters().running) pause();
  else void play();
}

async function selectInput(next) {
  if (isStarting) return;
  const request = ++inputRequest;
  awaitingMicrophone = next === 'mic';
  showError(inputError, '');
  drawInput();
  try {
    const change = audio.setInput(next);
    if (next === 'mic' && !audio.getMeters().running) await Promise.all([change, play()]);
    else await change;
    if (request !== inputRequest) return;
    input = audio.getMeters().input;
    if (input !== 'mic') lastDemo = input;
    announce(sourceNames[input] + ' selected.');
  } catch (error) {
    if (request !== inputRequest) return;
    showError(inputError, error.message || 'Your browser could not open the microphone.');
  } finally {
    if (request === inputRequest) {
      awaitingMicrophone = false;
      drawInput();
    }
  }
}

function plant() {
  const phrase = promptInput.value.trim();
  if (!phrase) {
    promptInput.setCustomValidity('Enter a prompt to grow your forest.');
    promptInput.reportValidity();
    return;
  }
  current = buildScene(phrase, current.mode);
  audio.setScene(current);
  drawSceneDetails();
  announce(sceneName(phrase) + ' planted. ' + current.bpm + ' beats per minute.');
  if (audio.getMeters().running) canvasGrowth = Math.min(canvasGrowth, 0.29);
  else void play();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  plant();
});

promptInput.addEventListener('input', () => promptInput.setCustomValidity(''));
for (const preset of presets) {
  preset.addEventListener('click', () => {
    promptInput.value = preset.dataset.prompt;
    promptInput.setCustomValidity('');
    plant();
  });
}

for (const button of modeButtons) {
  button.addEventListener('click', () => {
    if (button.dataset.mode === current.mode) return;
    current = buildScene(current.prompt, button.dataset.mode);
    audio.setScene(current);
    drawSceneDetails();
    announce(modeNames[current.mode] + ' mode, ' + current.bpm + ' beats per minute.');
  });
}

for (const button of inputButtons) {
  button.addEventListener('click', () => {
    const next = button.dataset.input;
    void selectInput(next === 'mic' && input === 'mic' ? lastDemo : next);
  });
}

playButton.addEventListener('click', togglePlayback);
visualizerToggle.addEventListener('click', () => {
  immersive = !immersive;
  scene.dataset.visualizer = String(immersive);
  visualizerToggle.setAttribute('aria-pressed', String(immersive));
  visualizerSignals.hidden = !immersive;
});
neonToggle.addEventListener('click', () => {
  neon = !neon;
  scene.dataset.neon = String(neon);
  neonToggle.setAttribute('aria-pressed', String(neon));
});
volume.addEventListener('input', () => {
  muted = false;
  drawVolume();
});
byId('sound-toggle').addEventListener('click', () => {
  if (Number(volume.value) === 0) {
    volume.value = 72;
    muted = false;
  } else {
    muted = !muted;
  }
  drawVolume();
});
document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.target instanceof HTMLElement && event.target.closest('button, input, textarea, a, [contenteditable], select')) return;
  event.preventDefault();
  togglePlayback();
});
window.addEventListener('pagehide', pause);
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (input === 'mic' || awaitingMicrophone)) pause();
});

function drawField(time) {
  const meters = audio.getMeters();
  const auriscape = audio.getAuriscapeMeters();
  const elapsed = Math.min(100, time - lastFrame) / 1000;
  lastFrame = time;
  if (!awaitingMicrophone && input !== meters.input) {
    input = meters.input;
    if (input !== 'mic') lastDemo = input;
    drawInput();
  }
  if (meters.running) {
    const sensitivity = input === 'mic' ? 3 : 1.35;
    const target = Math.min(1, 0.07 + meters.growth * sensitivity + (current.mode === 'hyperforest' ? meters.high * 0.13 : 0));
    const timeConstant = target > canvasGrowth ? 4.1 : 6.3;
    canvasGrowth += (target - canvasGrowth) * (1 - Math.exp(-elapsed / timeConstant));
    scene.style.setProperty('--canopy', canvasGrowth.toFixed(3));
  } else if (!hasPlayed) {
    scene.style.setProperty('--canopy', canvasGrowth.toFixed(3));
  }
  const percent = hasPlayed ? Math.round(canvasGrowth * 100) : null;
  if (lastPercent !== percent) {
    lastPercent = percent;
    byId('growth-value').textContent = percent === null ? '—' : percent + '%';
    byId('growth-fill').style.width = (percent ?? 0) + '%';
  }
  const level = Math.min(meterLights.length, Math.round(meters.level * 1.8 * meterLights.length));
  if (level !== lastLevel) {
    lastLevel = level;
    meterLights.forEach((bar, index) => bar.classList.toggle('active', index < level));
  }
  if (immersive) {
    setSignalLevel(ambientSignal, meters.level);
    setSignalLevel(auriscapeSignal, auriscape.level);
  }

  const growth = hasPlayed ? canvasGrowth : 0.48;
  const fallback = !shader.available;
  const flash = neonFlash(time, meters, auriscape);
  shader.update({
    ambient: meters, auriscape, growth, playing: meters.running,
    mode: current.mode, immersive, neon, flash, flashIndex,
  });
  visual.update({
    growth,
    energy: Math.min(1, meters.level * 1.6 + (fallback ? auriscape.level * 0.5 : 0)),
    transient: Math.max(meters.onset, fallback ? auriscape.beat : 0),
    waveform: audio.getWaveform(waveform),
    playing: meters.running,
    mode: current.mode,
    ambient: meters,
    auriscape,
    immersive,
    fallback,
    neon,
    flash,
    flashIndex,
  });
  requestAnimationFrame(drawField);
}

drawSceneDetails();
drawTransport();
drawInput();
drawVolume();
byId('growth-value').textContent = '—';
requestAnimationFrame(drawField);
