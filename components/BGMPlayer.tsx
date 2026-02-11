
import React, { useEffect, useRef } from 'react';

interface BGMPlayerProps {
  isMuted: boolean;
  isPlaying: boolean;
}

const BGMPlayer: React.FC<BGMPlayerProps> = ({ isMuted, isPlaying }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isPlaying && !isInitialized.current) {
      initAudio();
      isInitialized.current = true;
    }
    
    if (gainNodeRef.current) {
      const targetGain = isMuted || !isPlaying ? 0 : 0.25;
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current?.currentTime || 0, 0.2);
    }
  }, [isMuted, isPlaying]);

  const initAudio = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // Filters for that retro electronic tone
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 1000;
    lowFilter.connect(masterGain);

    const delay = ctx.createDelay();
    delay.delayTime.value = 0.25; // Faster delay for sync
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(masterGain);

    const chords = [
      [110.00, 130.81, 164.81], // Am
      [87.31, 130.81, 174.61],  // F
      [130.81, 164.81, 196.00], // C
      [98.00, 146.83, 196.00],  // G
    ];

    let beat = 0;

    const playPulse = (freq: number, time: number, vol: number, type: OscillatorType = 'square') => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      
      f.type = 'lowpass';
      f.frequency.setValueAtTime(freq * 3, time);
      f.frequency.exponentialRampToValueAtTime(100, time + 0.2);

      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(vol, time + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

      osc.connect(f);
      f.connect(g);
      g.connect(lowFilter);
      
      osc.start(time);
      osc.stop(time + 0.4);
    };

    const playLoop = () => {
      if (!isPlaying) return;
      const now = ctx.currentTime;
      const beatLen = 0.5; // 120 BPM

      const chordIdx = Math.floor(beat / 8) % chords.length;
      const currentChord = chords[chordIdx];

      // 1. Driving Bass Pulse (Every beat)
      playPulse(currentChord[0] * 0.5, now, 0.4, 'triangle');

      // 2. Rhythmic Synth Stabs (Every 2nd beat)
      if (beat % 2 === 0) {
        currentChord.forEach(f => {
          playPulse(f, now, 0.15, 'sawtooth');
        });
      }

      // 3. High Arpeggio (Off-beat patterns)
      if (beat % 4 !== 0) {
        const arpNote = currentChord[beat % currentChord.length] * 2;
        const g = ctx.createGain();
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(arpNote, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.05, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        o.connect(g);
        g.connect(delay);
        o.start(now);
        o.stop(now + 0.3);
      }

      beat++;
      setTimeout(playLoop, beatLen * 1000);
    };

    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    playLoop();
  };

  return null;
};

export default BGMPlayer;
