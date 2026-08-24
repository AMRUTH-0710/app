// Hidden Audio Controller with Web Audio API synthesis for scan events
// Produces short, crisp 'success' (bell / cha-ching) and 'denied' (buzzer) sounds

export type SuccessSoundType = 'bell' | 'cha-ching';

class AudioController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private soundPreference: SuccessSoundType = 'cha-ching';

  constructor() {
    // Lazy initialize on first user gesture or scan event
    if (typeof window !== 'undefined') {
      const warmup = () => {
        this.initCtx();
        window.removeEventListener('click', warmup);
        window.removeEventListener('touchstart', warmup);
        window.removeEventListener('keydown', warmup);
      };
      window.addEventListener('click', warmup, { passive: true, once: true });
      window.addEventListener('touchstart', warmup, { passive: true, once: true });
      window.addEventListener('keydown', warmup, { passive: true, once: true });
    }
  }

  public initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.ctx = new AudioCtxClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      // AudioContext unavailable or blocked
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setSuccessSoundPreference(type: SuccessSoundType) {
    this.soundPreference = type;
  }

  public getSuccessSoundPreference(): SuccessSoundType {
    return this.soundPreference;
  }

  /**
   * Triggers a short, crisp 'Success' sound effect (cha-ching or bell)
   * ONLY to be called upon a confirmed valid scan event.
   */
  public playSuccess(overrideType?: SuccessSoundType) {
    if (this.isMuted) return;
    const type = overrideType || this.soundPreference;
    if (type === 'bell') {
      this.playCrispBell();
    } else {
      this.playCrispChaChing();
    }
  }

  /**
   * Short, crisp metallic 'Cha-Ching' cash register / coin jackpot chime (~280ms)
   */
  public playCrispChaChing() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Initial metallic register snap / latch release click (short white noise click)
      const bufferSize = Math.floor(ctx.sampleRate * 0.03);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(2500, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseNode.start(now);
      noiseNode.stop(now + 0.035);

      // 2. High metallic chime 1: crisp coin ring (1567.98 Hz - G6)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1567.98, now + 0.02);
      gain1.gain.setValueAtTime(0.28, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now + 0.02);
      osc1.stop(now + 0.2);

      // 3. Higher harmonic coin resonance chime 2: (2637.02 Hz - E7)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(2637.02, now + 0.07);
      gain2.gain.setValueAtTime(0.35, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.35);

      // 4. Over-tone sparkle (3135.96 Hz - G7)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(3135.96, now + 0.08);
      gain3.gain.setValueAtTime(0.2, now + 0.08);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.08);
      osc3.stop(now + 0.32);

    } catch (e) {
      // Audio playback failsafe
    }
  }

  /**
   * Short, crisp golden Bell / Service Chime 'Ding' (~320ms)
   */
  public playCrispBell() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primary clear bell frequency: 1760 Hz (A6)
      const oscMain = ctx.createOscillator();
      const gainMain = ctx.createGain();
      oscMain.type = 'sine';
      oscMain.frequency.setValueAtTime(1760, now);
      gainMain.gain.setValueAtTime(0.38, now);
      gainMain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      oscMain.connect(gainMain);
      gainMain.connect(ctx.destination);
      oscMain.start(now);
      oscMain.stop(now + 0.35);

      // Resonant harmonic overtones (3520 Hz & 4400 Hz) for authentic bell shimmer
      const oscHarmonic = ctx.createOscillator();
      const gainHarmonic = ctx.createGain();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(3520, now);
      gainHarmonic.gain.setValueAtTime(0.18, now);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(ctx.destination);
      oscHarmonic.start(now);
      oscHarmonic.stop(now + 0.25);

      const oscStrike = ctx.createOscillator();
      const gainStrike = ctx.createGain();
      oscStrike.type = 'triangle';
      oscStrike.frequency.setValueAtTime(880, now); // A5 strike body
      gainStrike.gain.setValueAtTime(0.2, now);
      gainStrike.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      oscStrike.connect(gainStrike);
      gainStrike.connect(ctx.destination);
      oscStrike.start(now);
      oscStrike.stop(now + 0.15);

    } catch (e) {
      // Audio playback failsafe
    }
  }

  /**
   * Triggers a short, crisp 'Denied' error buzzer sound effect (~220ms)
   * ONLY to be called upon a denied, duplicate, or invalid scan event.
   */
  public playDenied() {
    this.playCrispBuzzer();
  }

  /**
   * Short, crisp electric access-control Buzzer (~220ms)
   * Uses dual detuned low sawtooth/square oscillators through a low-pass filter
   */
  public playCrispBuzzer() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Low frequency buzzer carrier (130 Hz + 115 Hz Discordant Interval)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(130.81, now); // C3
      osc2.frequency.setValueAtTime(116.54, now); // Bb2 (harsh discord)

      // Sharp bandpass/lowpass shaping
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, now);
      filter.Q.setValueAtTime(3, now);

      // Snappy gated envelope with quick cutoff (220ms total duration)
      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.015);
      gain.gain.setValueAtTime(0.35, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.23);
      osc2.stop(now + 0.23);

    } catch (e) {
      // Audio playback failsafe
    }
  }

  /**
   * High fanfare celebration for special milestone / big screen reveals
   */
  public playFanfare() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { f: 523.25, t: 0, d: 0.1 },
        { f: 659.25, t: 0.1, d: 0.1 },
        { f: 783.99, t: 0.2, d: 0.12 },
        { f: 1046.50, t: 0.32, d: 0.35 }
      ];

      notes.forEach((note) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.25, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.t);
        osc.stop(now + note.t + note.d);
      });
    } catch (e) {
      // Audio playback failsafe
    }
  }
}

// Global Singleton Audio Controller Instance
export const audioController = new AudioController();
