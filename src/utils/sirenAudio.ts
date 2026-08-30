// Web Audio API Synthesizer for Emergency Alarm Siren

let audioCtx: AudioContext | null = null;
let oscillator1: OscillatorNode | null = null;
let oscillator2: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let lfoNode: OscillatorNode | null = null;
let isPlaying = false;
let isMuted = false;

export const startSirenSound = () => {
  if (isPlaying) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    // Main Gain
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(isMuted ? 0 : 0.35, audioCtx.currentTime);
    gainNode.connect(audioCtx.destination);

    // Primary Oscillator 1 (Siren carrier high)
    oscillator1 = audioCtx.createOscillator();
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(800, audioCtx.currentTime);

    // Secondary Oscillator 2 (Harmonic tone)
    oscillator2 = audioCtx.createOscillator();
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(1000, audioCtx.currentTime);

    // Low Frequency Oscillator (LFO) for sweeping wail sound (2 Hz modulation)
    lfoNode = audioCtx.createOscillator();
    lfoNode.type = 'sine';
    lfoNode.frequency.setValueAtTime(2.5, audioCtx.currentTime); // 2.5 cycles per sec

    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(350, audioCtx.currentTime); // sweep range +- 350 Hz

    lfoNode.connect(lfoGain);
    lfoGain.connect(oscillator1.frequency);
    lfoGain.connect(oscillator2.frequency);

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);

    lfoNode.start();
    oscillator1.start();
    oscillator2.start();

    isPlaying = true;
  } catch (err) {
    console.warn('Unable to play audio siren:', err);
  }
};

export const stopSirenSound = () => {
  if (!isPlaying) return;
  try {
    if (oscillator1) {
      oscillator1.stop();
      oscillator1.disconnect();
      oscillator1 = null;
    }
    if (oscillator2) {
      oscillator2.stop();
      oscillator2.disconnect();
      oscillator2 = null;
    }
    if (lfoNode) {
      lfoNode.stop();
      lfoNode.disconnect();
      lfoNode = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
    isPlaying = false;
  } catch (err) {
    console.warn('Error stopping siren sound:', err);
  }
};

export const toggleMuteSiren = (): boolean => {
  isMuted = !isMuted;
  if (gainNode && audioCtx) {
    gainNode.gain.setValueAtTime(isMuted ? 0 : 0.35, audioCtx.currentTime);
  }
  return isMuted;
};

export const getIsSirenMuted = (): boolean => isMuted;
export const getIsSirenPlaying = (): boolean => isPlaying;
