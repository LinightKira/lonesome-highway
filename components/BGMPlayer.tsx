import React, { useEffect, useRef } from 'react';

interface BGMPlayerProps {
  isMuted: boolean;
  isPlaying: boolean;
}

const BGMPlayer: React.FC<BGMPlayerProps> = ({ isMuted, isPlaying }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isInitialized = useRef(false);
  const loopRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying && !isInitialized.current) {
      initAudio();
      isInitialized.current = true;
    }
    
    if (gainNodeRef.current) {
      const targetGain = isMuted || !isPlaying ? 0 : 0.3;
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current?.currentTime || 0, 0.5);
    }

    return () => {
      if (loopRef.current) {
        clearTimeout(loopRef.current);
      }
    };
  }, [isMuted, isPlaying]);

  const initAudio = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    // 主音量控制
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // 混响效果 - 让声音更空灵
    const convolver = ctx.createConvolver();
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.3;
    
    // 创建简单的混响脉冲
    const reverbTime = 2;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * reverbTime;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    convolver.buffer = impulse;
    convolver.connect(reverbGain);
    reverbGain.connect(masterGain);

    // 低通滤波器 - 柔和音色
    const lowFilter = ctx.createBiquadFilter();
    lowFilter.type = 'lowpass';
    lowFilter.frequency.value = 2000;
    lowFilter.Q.value = 1;
    lowFilter.connect(masterGain);
    lowFilter.connect(convolver);

    // 更悦耳的和弦进行 - C大调
    const chords = [
      { name: 'C', notes: [130.81, 164.81, 196.00, 261.63] },      // C-E-G-C
      { name: 'G', notes: [98.00, 123.47, 146.83, 196.00] },       // G-B-D-G
      { name: 'Am', notes: [110.00, 130.81, 164.81, 220.00] },     // A-C-E-A
      { name: 'F', notes: [87.31, 110.00, 130.81, 174.61] },       // F-A-C-F
    ];

    let beat = 0;
    const bpm = 100;
    const beatDuration = 60 / bpm;

    // 播放柔和的长音和弦
    const playPad = (freq: number, time: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);
      
      f.type = 'lowpass';
      f.frequency.setValueAtTime(800, time);
      f.frequency.linearRampToValueAtTime(400, time + duration * 0.8);

      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(vol, time + 0.1);
      g.gain.setValueAtTime(vol, time + duration - 0.2);
      g.gain.linearRampToValueAtTime(0, time + duration);

      osc.connect(f);
      f.connect(g);
      g.connect(lowFilter);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    // 播放贝斯音
    const playBass = (freq: number, time: number, vol: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      f.type = 'lowpass';
      f.frequency.setValueAtTime(200, time);

      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(vol, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + beatDuration * 0.9);

      osc.connect(f);
      f.connect(g);
      g.connect(masterGain);
      
      osc.start(time);
      osc.stop(time + beatDuration);
    };

    // 播放旋律音符
    const playMelody = (freq: number, time: number, vol: number, duration: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      f.type = 'lowpass';
      f.frequency.setValueAtTime(freq * 4, time);
      f.frequency.exponentialRampToValueAtTime(freq * 2, time + duration);

      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(vol, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(f);
      f.connect(g);
      g.connect(convolver);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    // 旋律模式
    const melodyPatterns = [
      [1, 0, 2, 0, 1, 3, 2, 0],  // C调旋律
      [1, 2, 3, 2, 1, 0, 2, 1],  // G调旋律
      [0, 2, 1, 3, 2, 1, 0, 2],  // Am调旋律
      [2, 1, 0, 2, 3, 2, 1, 0],  // F调旋律
    ];

    const playLoop = () => {
      if (!isPlaying) {
        loopRef.current = window.setTimeout(playLoop, 100);
        return;
      }
      
      const now = ctx.currentTime;
      const chordIdx = Math.floor(beat / 8) % chords.length;
      const currentChord = chords[chordIdx];
      const melodyPattern = melodyPatterns[chordIdx];

      // 每8拍更换和弦，播放长音铺垫
      if (beat % 8 === 0) {
        currentChord.notes.forEach((freq, i) => {
          playPad(freq, now, beatDuration * 8, 0.08 - i * 0.015);
        });
      }

      // 每拍播放贝斯
      const bassNote = currentChord.notes[0] * 0.5;
      playBass(bassNote, now, 0.25);

      // 第2、6拍添加贝斯和声
      if (beat % 4 === 2) {
        playBass(currentChord.notes[1] * 0.5, now, 0.15);
      }

      // 旋律音符 - 根据模式播放
      const melodyNoteIdx = melodyPattern[beat % 8];
      if (melodyNoteIdx > 0) {
        const melodyFreq = currentChord.notes[melodyNoteIdx] * 2;
        const melodyVol = (beat % 4 === 0) ? 0.12 : 0.06;
        playMelody(melodyFreq, now, melodyVol, beatDuration * 0.8);
      }

      // 偶尔添加装饰音
      if (beat % 8 === 3 || beat % 8 === 7) {
        const arpFreq = currentChord.notes[2] * 2;
        playMelody(arpFreq, now + beatDuration * 0.5, 0.04, beatDuration * 0.3);
      }

      beat++;
      loopRef.current = window.setTimeout(playLoop, beatDuration * 1000);
    };

    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    playLoop();
  };

  return null;
};

export default BGMPlayer;
