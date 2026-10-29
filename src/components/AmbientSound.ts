/**
 * Pure Web Audio API Ambient Sound Synthesizer
 * Generates gentle, soothing meditative resonance (soft bowls / calming garden drone)
 * Completely self-contained, no external audio files required.
 */

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying = false;

  private init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  public start(volume = 0.25) {
    if (this.isPlaying) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    // Peaceful harmonic drone frequencies: 136.1 Hz (Om tone / Earth frequency), 272.2 Hz, 408.3 Hz
    const freqs = [136.1, 272.2, 340.2];
    this.oscillators = [];

    const now = this.ctx.currentTime;
    // Fade in master gain smoothly
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(volume, now + 3);

    freqs.forEach((freq, index) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      // Subtle slow frequency modulation for organic garden breathing
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.1 + index * 0.05, now);
      lfoGain.gain.setValueAtTime(0.8, now);
      lfo.connect(osc.frequency);
      lfo.start();

      oscGain.gain.setValueAtTime(0.3 / (index + 1), now);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start();
      this.oscillators.push(osc);
    });

    this.isPlaying = true;
  }

  public stop() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Gentle fade out over 2 seconds
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 2);

    setTimeout(() => {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.oscillators = [];
      this.isPlaying = false;
    }, 2100);
  }

  public setVolume(volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, volume)), now + 0.2);
  }

  public getStatus() {
    return this.isPlaying;
  }
}

export const ambientSound = new AmbientSoundEngine();
