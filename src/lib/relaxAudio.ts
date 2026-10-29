// Mind-relaxing Ocean Wave & Ambient Melody Synthesizer via Web Audio API
// 100% self-contained, zero external network downloads, zero latency

class RelaxAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private melodyInterval: any = null;
  private waveLfoInterval: any = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // Generate pink noise buffer for realistic ocean surf
  private createPinkNoiseBuffer(): AudioBuffer {
    const bufferSize = this.ctx!.sampleRate * 4; // 4 seconds looping buffer
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // Play a soft calming pentatonic chime bell
  private playCalmNote(freq: number) {
    if (!this.ctx || !this.isPlaying || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Soft attack & long dreamy decay
      noteGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.6);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 4.5);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 4.6);
    } catch {}
  }

  public start(volume = 0.35) {
    if (this.isPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;

    // Master volume gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Ocean surf sound: filtered pink noise with undulating filter frequency
    const noiseBuffer = this.createPinkNoiseBuffer();
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const waveGain = this.ctx.createGain();
    waveGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(waveGain);
    waveGain.connect(this.masterGain);
    this.noiseNode.start();

    // Modulate filter frequency to simulate rolling ocean waves (every 4.5s)
    let waveTime = 0;
    this.waveLfoInterval = setInterval(() => {
      if (!this.ctx || !this.filterNode || !this.isPlaying) return;
      waveTime += 0.1;
      // Gentle swell between 180Hz (trough) and 650Hz (crest)
      const swell = Math.sin(waveTime * 1.2) * 0.5 + 0.5;
      const targetFreq = 180 + swell * 470;
      this.filterNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.5);
    }, 100);

    // 2. Mind-relaxing ambient 432Hz pentatonic melody
    // F3, G3, A3, C4, D4, F4, G4 in 432Hz tuning
    const PENTATONIC_FREQS = [171, 192, 216, 256, 288, 342, 384, 432, 512];
    this.playCalmNote(432);

    this.melodyInterval = setInterval(() => {
      if (!this.isPlaying) return;
      const note = PENTATONIC_FREQS[Math.floor(Math.random() * PENTATONIC_FREQS.length)];
      this.playCalmNote(note);
    }, 2800);
  }

  public stop() {
    this.isPlaying = false;
    if (this.melodyInterval) clearInterval(this.melodyInterval);
    if (this.waveLfoInterval) clearInterval(this.waveLfoInterval);

    try {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      }
      if (this.masterGain) {
        this.masterGain.disconnect();
      }
    } catch {}

    this.noiseNode = null;
    this.filterNode = null;
    this.masterGain = null;
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.1);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const relaxAudio = new RelaxAudioSynthesizer();
