// ============================================================
// Audio Manager Module
// ============================================================

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.windNoise = null;
    this.windGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
    this.initialized = true;
  }

  startEngine() {
    if (!this.initialized) return;

    // Engine rumble
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 80;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.1;
    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();

    // Wind noise
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.windNoise = this.ctx.createBufferSource();
    this.windNoise.buffer = noiseBuffer;
    this.windNoise.loop = true;
    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.05;
    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400;
    this.windNoise.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windNoise.start();
  }

  update(engineRPM, windVolume) {
    if (!this.initialized || !this.engineOsc) return;
    const freq = 50 + (engineRPM / 2700) * 150;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(0.05 + (engineRPM / 2700) * 0.15, this.ctx.currentTime, 0.1);
    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(0.02 + windVolume * 0.1, this.ctx.currentTime, 0.1);
    }
  }

  setVolume(vol) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
  }

  stop() {
    if (this.engineOsc) { this.engineOsc.stop(); this.engineOsc = null; }
    if (this.windNoise) { this.windNoise.stop(); this.windNoise = null; }
  }
}