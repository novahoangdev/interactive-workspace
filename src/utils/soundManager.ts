// Procedural Web Audio for navigation, desk interactions, the kart and background music.
//
// Signal flow:
//   sfx bus   ─┬─────────────► master ─► gentle compressor ─► speakers
//              └─ small send ─► reverb ─┘
//   music bus ─┬─────────────► master
//              └─ larger send ► reverb
//   engine / drive loops ────► master (dry)
//
// Every one-shot uses a soft attack and exponential release (no clicks), slight
// random pitch variation (no robotic repetition) and optional rate limiting.

type ToneOptions = {
  freq: number;
  to?: number; // glide target
  glide?: number; // glide time (s)
  type?: OscillatorType;
  at?: number; // start offset (s)
  attack?: number;
  decay: number;
  peak: number;
  cutoff?: number; // optional low-pass
  vary?: number; // random detune range in cents
  bus?: AudioNode;
};

type NoiseOptions = {
  at?: number;
  attack?: number;
  decay: number;
  peak: number;
  filter: BiquadFilterType;
  freq: number;
  to?: number;
  q?: number;
  bus?: AudioNode;
};

const MASTER_VOLUME = 0.85;

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private lastPlayed = new Map<string, number>();

  // ---------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------
  private initCtx(): boolean {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.buildGraph(this.ctx);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => undefined);
    }
    return true;
  }

  private buildGraph(c: AudioContext) {
    const compressor = c.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.006;
    compressor.release.value = 0.25;
    compressor.connect(c.destination);

    this.master = c.createGain();
    this.master.gain.value = this.isMuted ? 0 : MASTER_VOLUME;
    this.master.connect(compressor);

    // Small procedural room: decaying stereo noise, darkened so tails stay soft
    const reverb = c.createConvolver();
    const len = Math.floor(c.sampleRate * 2.2);
    const ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      let smooth = 0;
      for (let i = 0; i < len; i++) {
        smooth = smooth * 0.6 + (Math.random() * 2 - 1) * 0.4; // gentle low-pass on the noise
        data[i] = smooth * Math.pow(1 - i / len, 2.6);
      }
    }
    reverb.buffer = ir;
    const reverbTone = c.createBiquadFilter();
    reverbTone.type = 'lowpass';
    reverbTone.frequency.value = 3200;
    reverb.connect(reverbTone);
    reverbTone.connect(this.master);

    this.sfxBus = c.createGain();
    this.sfxBus.connect(this.master);
    const sfxSend = c.createGain();
    sfxSend.gain.value = 0.14;
    this.sfxBus.connect(sfxSend);
    sfxSend.connect(reverb);

    this.musicBus = c.createGain();
    this.musicBus.connect(this.master);
    const musicSend = c.createGain();
    musicSend.gain.value = 0.38;
    this.musicBus.connect(musicSend);
    musicSend.connect(reverb);

    this.noiseBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const nd = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }

  /** Returns the context when a sound may play (not muted, not rate-limited). */
  private ready(key?: string, minGapSec = 0): AudioContext | null {
    if (this.isMuted) return null;
    try {
      if (!this.initCtx()) return null;
    } catch {
      return null;
    }
    if (key && minGapSec > 0) {
      const now = performance.now();
      if (now - (this.lastPlayed.get(key) ?? 0) < minGapSec * 1000) return null;
      this.lastPlayed.set(key, now);
    }
    return this.ctx;
  }

  private tone(o: ToneOptions) {
    const c = this.ctx;
    if (!c || !this.sfxBus) return;
    const t = c.currentTime + (o.at ?? 0);
    const attack = o.attack ?? 0.005;
    const osc = c.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + (o.glide ?? attack + o.decay));
    if (o.vary) osc.detune.setValueAtTime((Math.random() * 2 - 1) * o.vary, t);

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(o.peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + o.decay);

    let node: AudioNode = osc;
    if (o.cutoff) {
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = o.cutoff;
      osc.connect(lp);
      node = lp;
    }
    node.connect(gain);
    gain.connect(o.bus ?? this.sfxBus);
    osc.start(t);
    osc.stop(t + attack + o.decay + 0.05);
  }

  private noise(o: NoiseOptions) {
    const c = this.ctx;
    if (!c || !this.sfxBus || !this.noiseBuffer) return;
    const t = c.currentTime + (o.at ?? 0);
    const attack = o.attack ?? 0.003;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer;
    const f = c.createBiquadFilter();
    f.type = o.filter;
    f.frequency.setValueAtTime(o.freq, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + attack + o.decay);
    f.Q.value = o.q ?? 0.8;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(o.peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + o.decay);
    src.connect(f);
    f.connect(gain);
    gain.connect(o.bus ?? this.sfxBus);
    src.start(t, Math.random() * 1.5);
    src.stop(t + attack + o.decay + 0.05);
  }

  // ---------------------------------------------------------------------------
  // Global controls
  // ---------------------------------------------------------------------------
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(this.isMuted ? 0 : MASTER_VOLUME, this.ctx.currentTime, 0.08);
    }
    if (this.isMuted) this.stopEngineSound();
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // ---------------------------------------------------------------------------
  // UI & navigation
  // ---------------------------------------------------------------------------
  public playNavChime(frequency: number = 440) {
    if (!this.ready('nav', 0.08)) return;
    this.tone({ freq: frequency, attack: 0.012, decay: 0.75, peak: 0.032, vary: 8 });
    this.tone({ freq: frequency * 1.5, at: 0.05, attack: 0.012, decay: 0.55, peak: 0.014, vary: 8 });
  }

  public playClick(highPitch: boolean = false) {
    if (!this.ready('click', 0.03)) return;
    this.noise({ filter: 'bandpass', freq: highPitch ? 3600 : 2600, q: 1.4, decay: 0.03, peak: 0.02 });
    this.tone({ freq: highPitch ? 880 : 620, attack: 0.002, decay: 0.06, peak: 0.012, vary: 40 });
  }

  public playSilentClick() {
    if (!this.ready('silent-click', 0.03)) return;
    this.noise({ filter: 'lowpass', freq: 900, decay: 0.025, peak: 0.014 });
  }

  public playSuccess() {
    if (!this.ready('success', 0.3)) return;
    [392.0, 493.88, 587.33, 783.99].forEach((f, i) => {
      this.tone({ freq: f, at: i * 0.07, attack: 0.01, decay: 0.6, peak: 0.026, vary: 5 });
    });
  }

  // ---------------------------------------------------------------------------
  // Desk items
  // ---------------------------------------------------------------------------
  public playKeyboardClack() {
    if (!this.ready('key', 0.025)) return;
    this.noise({ filter: 'bandpass', freq: 2800 + Math.random() * 800, q: 1.2, decay: 0.028, peak: 0.05 });
    this.tone({ freq: 180, to: 70, attack: 0.002, decay: 0.05, peak: 0.024, vary: 60 });
  }

  public playLampSwitch(turnOn: boolean = true) {
    if (!this.ready('lamp', 0.05)) return;
    this.noise({ filter: 'highpass', freq: 2200, decay: 0.016, peak: 0.04 });
    this.tone({ freq: turnOn ? 1200 : 800, attack: 0.002, decay: 0.035, peak: 0.014 });
  }

  public playDuckQuack() {
    if (!this.ready('duck', 0.15)) return;
    // rubbery squeak: soft triangle through a resonant low-pass instead of a raw sawtooth
    const c = this.ctx!;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.detune.value = (Math.random() * 2 - 1) * 60;
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.07);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.2);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    lp.Q.value = 4;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.04, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.sfxBus!);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playSip() {
    if (!this.ready('sip', 0.2)) return;
    this.tone({ freq: 300, to: 700, attack: 0.01, decay: 0.1, peak: 0.02, vary: 30 });
    this.tone({ freq: 380, to: 820, at: 0.12, attack: 0.01, decay: 0.09, peak: 0.016, vary: 30 });
  }

  public playSpeakerBeat() {
    if (!this.ready('speaker', 0.3)) return;
    [329.63, 392.0, 493.88, 587.33].forEach((f, i) => {
      this.tone({ freq: f, type: 'triangle', cutoff: 1500, at: i * 0.035, attack: 0.02, decay: 0.9, peak: 0.02, vary: 6 });
    });
  }

  public playChairSwivel() {
    if (!this.ready('chair', 0.2)) return;
    this.noise({ filter: 'bandpass', freq: 700, to: 400, q: 2, attack: 0.04, decay: 0.35, peak: 0.024 });
    this.tone({ freq: 140, to: 90, attack: 0.03, decay: 0.3, peak: 0.012 });
  }

  public playPhoneChime() {
    if (!this.ready('phone', 0.3)) return;
    [1318.5, 1661.2, 1975.5].forEach((f, i) => {
      this.tone({ freq: f, at: i * 0.08, attack: 0.005, decay: 0.35, peak: 0.02 });
    });
  }

  public playClockBeep() {
    if (!this.ready('clock', 0.3)) return;
    [0, 0.11].forEach((at) => this.tone({ freq: 1760, at, attack: 0.004, decay: 0.06, peak: 0.018 }));
  }

  public playDeskMotor(raising: boolean = true) {
    if (!this.ready('desk', 0.5)) return;
    const duration = 1.1;
    const c = this.ctx!;
    const t = c.currentTime;
    const osc = c.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(raising ? 118 : 138, t);
    osc.frequency.linearRampToValueAtTime(raising ? 132 : 112, t + duration);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.03, t + 0.15);
    g.gain.setValueAtTime(0.03, t + duration - 0.15);
    g.gain.linearRampToValueAtTime(0.0001, t + duration);
    osc.connect(lp);
    lp.connect(g);
    g.connect(this.sfxBus!);
    osc.start(t);
    osc.stop(t + duration + 0.05);
    this.noise({ filter: 'lowpass', freq: 320, attack: 0.15, decay: duration - 0.15, peak: 0.01 });
    this.tone({ freq: 1760, at: duration + 0.05, decay: 0.06, peak: 0.016 });
    this.tone({ freq: 2093, at: duration + 0.16, decay: 0.06, peak: 0.016 });
  }

  // ---------------------------------------------------------------------------
  // Background music: warm lo-fi pad, sparse pentatonic plucks, faint breeze
  // ---------------------------------------------------------------------------
  private bgmGain: GainNode | null = null;
  private bgmFilter: BiquadFilterNode | null = null;
  private bgmLfo: OscillatorNode | null = null;
  private bgmAir: AudioBufferSourceNode | null = null;
  private bgmTimer: number | null = null;
  private bgmNextChordAt = 0;
  private isBGMPlaying = false;
  private bgmChordIndex = 0;

  private readonly BGM_CHORDS = [
    [130.81, 196.0, 246.94, 329.63, 293.66], // Cmaj9
    [110.0, 164.81, 196.0, 261.63, 246.94], // Am9
    [87.31, 130.81, 164.81, 220.0, 261.63], // Fmaj7
    [98.0, 146.83, 196.0, 246.94, 293.66], // G6
  ];
  private readonly BGM_PLUCKS = [523.25, 587.33, 659.25, 783.99, 880.0]; // C major pentatonic
  private readonly BGM_CHORD_SEC = 7;

  public startAmbientBGM() {
    if (this.isBGMPlaying) {
      // started before the first gesture: the context may still be suspended, so resume it
      if (!this.isMuted) {
        try {
          this.initCtx();
        } catch {
          // ignore
        }
      }
      return;
    }
    if (!this.ready()) return;
    const c = this.ctx!;
    const now = c.currentTime;
    this.isBGMPlaying = true;

    this.bgmGain = c.createGain();
    this.bgmGain.gain.setValueAtTime(0.0001, now);
    this.bgmGain.gain.linearRampToValueAtTime(0.4, now + 4); // sits under UI and kart sounds
    this.bgmFilter = c.createBiquadFilter();
    this.bgmFilter.type = 'lowpass';
    this.bgmFilter.frequency.value = 1100;
    this.bgmFilter.Q.value = 0.5;
    // slow "breathing" of the filter
    this.bgmLfo = c.createOscillator();
    this.bgmLfo.frequency.value = 0.05;
    const lfoDepth = c.createGain();
    lfoDepth.gain.value = 300;
    this.bgmLfo.connect(lfoDepth);
    lfoDepth.connect(this.bgmFilter.frequency);
    this.bgmLfo.start(now);
    this.bgmGain.connect(this.bgmFilter);
    this.bgmFilter.connect(this.musicBus!);

    // faint breeze bed
    if (this.noiseBuffer) {
      this.bgmAir = c.createBufferSource();
      this.bgmAir.buffer = this.noiseBuffer;
      this.bgmAir.loop = true;
      const airLp = c.createBiquadFilter();
      airLp.type = 'lowpass';
      airLp.frequency.value = 420;
      const airGain = c.createGain();
      airGain.gain.value = 0.012;
      this.bgmAir.connect(airLp);
      airLp.connect(airGain);
      airGain.connect(this.bgmGain);
      this.bgmAir.start(now);
    }

    // look-ahead scheduler: keeps timing steady even if the tab stutters
    this.bgmNextChordAt = now + 0.1;
    const schedule = () => {
      if (!this.ctx || !this.isBGMPlaying) return;
      while (this.bgmNextChordAt < this.ctx.currentTime + 1.5) {
        this.scheduleChord(this.bgmNextChordAt);
        this.bgmNextChordAt += this.BGM_CHORD_SEC;
      }
    };
    schedule();
    this.bgmTimer = window.setInterval(schedule, 500);
  }

  private scheduleChord(t: number) {
    const c = this.ctx;
    if (!c || !this.bgmGain) return;
    const notes = this.BGM_CHORDS[this.bgmChordIndex];
    this.bgmChordIndex = (this.bgmChordIndex + 1) % this.BGM_CHORDS.length;
    const life = this.BGM_CHORD_SEC + 3.5; // overlaps the next chord for a seamless crossfade

    notes.forEach((freq, i) => {
      const voices = i === 0 ? [{ f: freq / 2, type: 'triangle' as OscillatorType, d: 0 }] : [];
      voices.push({ f: freq, type: 'sine', d: -6 }, { f: freq, type: 'sine', d: 6 });
      voices.forEach((v) => {
        const osc = c.createOscillator();
        osc.type = v.type;
        osc.frequency.value = v.f;
        osc.detune.value = v.d;
        const g = c.createGain();
        const vol = i === 0 ? 0.02 : 0.013;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(vol, t + 2.5);
        g.gain.setValueAtTime(vol, t + life - 3);
        g.gain.linearRampToValueAtTime(0.0001, t + life);
        osc.connect(g);
        g.connect(this.bgmGain!);
        osc.start(t);
        osc.stop(t + life + 0.1);
      });
    });

    // a few unhurried pluck notes over the chord
    for (let beat = 1; beat < 4; beat++) {
      if (Math.random() > 0.45) continue;
      const pt = t + beat * (this.BGM_CHORD_SEC / 4) + Math.random() * 0.2;
      const f = this.BGM_PLUCKS[Math.floor(Math.random() * this.BGM_PLUCKS.length)];
      const osc = c.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, pt);
      g.gain.linearRampToValueAtTime(0.016, pt + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, pt + 1.6);
      osc.connect(g);
      g.connect(this.bgmGain!);
      osc.start(pt);
      osc.stop(pt + 1.7);
    }
  }

  public stopAmbientBGM() {
    if (!this.isBGMPlaying) return;
    this.isBGMPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    const c = this.ctx;
    const gain = this.bgmGain;
    const filter = this.bgmFilter;
    const lfo = this.bgmLfo;
    const air = this.bgmAir;
    this.bgmGain = null;
    this.bgmFilter = null;
    this.bgmLfo = null;
    this.bgmAir = null;
    if (c && gain) {
      gain.gain.cancelScheduledValues(c.currentTime);
      gain.gain.setTargetAtTime(0.0001, c.currentTime, 0.4);
      window.setTimeout(() => {
        try {
          lfo?.stop();
          air?.stop();
          gain.disconnect();
          filter?.disconnect();
        } catch {
          // already stopped
        }
      }, 2000);
    }
  }

  public toggleAmbientBGM(): boolean {
    if (this.isBGMPlaying) {
      this.stopAmbientBGM();
      return false;
    }
    this.startAmbientBGM();
    return true;
  }

  public getIsBGMPlaying(): boolean {
    return this.isBGMPlaying;
  }

  // ---------------------------------------------------------------------------
  // Kart: continuous engine + tyre/boost layers driven every frame
  // ---------------------------------------------------------------------------
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineOscA: OscillatorNode | null = null;
  private engineOscB: OscillatorNode | null = null;
  private roadGain: GainNode | null = null;
  private driftGain: GainNode | null = null;
  private boostGain: GainNode | null = null;
  private boostFilter: BiquadFilterNode | null = null;
  private loopSources: AudioBufferSourceNode[] = [];
  private driftUntil = 0;
  private boostUntil = 0;
  private wasBoosting = false;

  private noiseLoop(filterType: BiquadFilterType, freq: number, q: number, out: GainNode) {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = freq;
    f.Q.value = q;
    src.connect(f);
    f.connect(out);
    src.start(c.currentTime, Math.random() * 1.5);
    this.loopSources.push(src);
    return f;
  }

  public startEngine() {
    if (this.engineGain || !this.ready()) return;
    const c = this.ctx!;
    const now = c.currentTime;

    this.engineGain = c.createGain();
    this.engineGain.gain.value = 0.0001;
    this.engineFilter = c.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 380;
    this.engineFilter.Q.value = 0.5;
    this.engineGain.connect(this.engineFilter);
    this.engineFilter.connect(this.master!);

    this.engineOscA = c.createOscillator();
    this.engineOscA.type = 'sine';
    this.engineOscA.frequency.value = 150;
    this.engineOscA.connect(this.engineGain);
    this.engineOscA.start(now);
    this.engineOscB = c.createOscillator();
    this.engineOscB.type = 'triangle';
    this.engineOscB.frequency.value = 300;
    const bLevel = c.createGain();
    bLevel.gain.value = 0.35;
    this.engineOscB.connect(bLevel);
    bLevel.connect(this.engineGain);
    this.engineOscB.start(now);

    // road / wind rush, tyre scrub and boost whoosh as filtered noise loops
    this.roadGain = c.createGain();
    this.roadGain.gain.value = 0.0001;
    this.roadGain.connect(this.master!);
    this.noiseLoop('lowpass', 500, 0.5, this.roadGain);

    this.driftGain = c.createGain();
    this.driftGain.gain.value = 0.0001;
    this.driftGain.connect(this.sfxBus!);
    this.noiseLoop('bandpass', 1100, 1.2, this.driftGain);

    this.boostGain = c.createGain();
    this.boostGain.gain.value = 0.0001;
    this.boostGain.connect(this.sfxBus!);
    this.boostFilter = this.noiseLoop('bandpass', 900, 0.9, this.boostGain);
  }

  public updateEngineSound(speedRatio: number, isBoosting: boolean = false) {
    const c = this.ctx;
    if (this.isMuted || !c || !this.engineGain || !this.engineOscA || !this.engineOscB || !this.engineFilter) return;
    const now = c.currentTime;
    const s = Math.min(1.5, Math.max(0, speedRatio));
    const moving = s > 0.02;

    const base = 150 + s * 170 + (isBoosting ? 50 : 0);
    this.engineOscA.frequency.setTargetAtTime(base, now, 0.08);
    this.engineOscB.frequency.setTargetAtTime(base * 2, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(380 + s * 520 + (isBoosting ? 200 : 0), now, 0.1);
    this.engineGain.gain.setTargetAtTime(moving ? 0.012 + s * 0.02 : 0.0001, now, moving ? 0.08 : 0.15);
    this.roadGain?.gain.setTargetAtTime(moving ? s * 0.02 : 0.0001, now, 0.2);

    const drifting = performance.now() < this.driftUntil && moving;
    this.driftGain?.gain.setTargetAtTime(drifting ? 0.012 + s * 0.012 : 0.0001, now, drifting ? 0.05 : 0.12);

    const boosting = performance.now() < this.boostUntil;
    this.boostGain?.gain.setTargetAtTime(boosting ? 0.02 : 0.0001, now, boosting ? 0.06 : 0.25);
    this.boostFilter?.frequency.setTargetAtTime(boosting ? 1800 : 900, now, 0.3);
  }

  public stopEngineSound() {
    const c = this.ctx;
    if (!c || !this.engineGain) return;
    const now = c.currentTime;
    const nodes = {
      gains: [this.engineGain, this.roadGain, this.driftGain, this.boostGain],
      oscs: [this.engineOscA, this.engineOscB],
      loops: this.loopSources,
      filter: this.engineFilter,
    };
    nodes.gains.forEach((g) => g?.gain.setTargetAtTime(0.0001, now, 0.08));
    this.engineGain = null;
    this.engineFilter = null;
    this.engineOscA = null;
    this.engineOscB = null;
    this.roadGain = null;
    this.driftGain = null;
    this.boostGain = null;
    this.boostFilter = null;
    this.loopSources = [];
    this.wasBoosting = false;
    window.setTimeout(() => {
      try {
        nodes.oscs.forEach((o) => o?.stop());
        nodes.loops.forEach((l) => l.stop());
        nodes.gains.forEach((g) => g?.disconnect());
        nodes.filter?.disconnect();
      } catch {
        // already stopped
      }
    }, 600);
  }

  public playVehicleStart() {
    if (!this.ready('kart-start', 0.5)) return;
    [261.63, 329.63, 392.0, 523.25].forEach((f, i) => {
      this.tone({ freq: f, at: i * 0.07, attack: 0.02, decay: 0.5, peak: 0.026 });
    });
  }

  public playHorn() {
    if (!this.ready('horn', 0.3)) return;
    [440, 554.37].forEach((f) => {
      this.tone({ freq: f, type: 'triangle', cutoff: 1800, attack: 0.01, decay: 0.28, peak: 0.03 });
    });
  }

  /** Called every frame while drifting: keeps the tyre-scrub loop alive. */
  public playDrift() {
    this.driftUntil = performance.now() + 120;
  }

  /** Called every frame while boosting, or once for a ramp launch. */
  public playNitro() {
    const boostingNow = performance.now() < this.boostUntil;
    this.boostUntil = performance.now() + 120;
    if (!boostingNow && !this.wasBoosting && this.ready('nitro', 0.5)) {
      // one gentle whoosh on the rising edge only
      this.noise({ filter: 'bandpass', freq: 500, to: 2400, q: 1, attack: 0.06, decay: 0.4, peak: 0.035 });
      this.tone({ freq: 240, to: 620, attack: 0.04, decay: 0.35, peak: 0.012 });
    }
    this.wasBoosting = true;
    window.setTimeout(() => {
      if (performance.now() >= this.boostUntil) this.wasBoosting = false;
    }, 160);
  }

  public playBumperHit() {
    if (!this.ready('bumper', 0.12)) return;
    this.noise({ filter: 'lowpass', freq: 420, decay: 0.12, peak: 0.05 });
    this.tone({ freq: 90, to: 45, attack: 0.003, decay: 0.15, peak: 0.04 });
  }

  // ---------------------------------------------------------------------------
  // Racetrack props
  // ---------------------------------------------------------------------------
  public playConeHit(intensity: number = 1) {
    if (!this.ready('cone', 0.04)) return;
    const level = Math.max(0.15, Math.min(1, intensity));
    // hollow plastic "thock"
    this.noise({ filter: 'bandpass', freq: 750 + level * 300, q: 1.5, decay: 0.06, peak: 0.04 * level });
    this.tone({ freq: 200 + 80 * level, to: 90, type: 'triangle', attack: 0.002, decay: 0.1, peak: 0.028 * level, vary: 80 });
  }

  public playOrbHit() {
    if (!this.ready('orb', 0.1)) return;
    this.noise({ filter: 'highpass', freq: 3000, decay: 0.02, peak: 0.015 });
    [587.33, 880].forEach((f) => this.tone({ freq: f, attack: 0.004, decay: 0.9, peak: 0.022, vary: 10 }));
  }

  public playBoostPad() {
    if (!this.ready('pad', 0.3)) return;
    this.noise({ filter: 'bandpass', freq: 500, to: 2500, q: 1, attack: 0.05, decay: 0.35, peak: 0.04 });
    this.tone({ freq: 330, to: 990, attack: 0.03, decay: 0.3, peak: 0.016 });
  }

  public playGemCollect(streak: number = 1) {
    if (!this.ready('gem', 0.05)) return;
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const base = scale[(streak - 1) % scale.length];
    this.tone({ freq: base, attack: 0.006, decay: 0.8, peak: 0.032 });
    this.tone({ freq: base * 1.5, at: 0.05, attack: 0.006, decay: 0.6, peak: 0.016 });
    this.tone({ freq: base * 2, at: 0.09, attack: 0.006, decay: 0.4, peak: 0.008 });
  }
}

export const soundManager = new SoundManager();
