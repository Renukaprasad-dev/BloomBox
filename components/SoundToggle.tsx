'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundToggleProps {
  isMuffled?: boolean;
}

export const SoundToggle: React.FC<SoundToggleProps> = ({ isMuffled = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const nodesRef = useRef<Array<AudioNode>>([]);

  const initAudio = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Master gain for fade in/out
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGainRef.current = masterGain;

      // Filter for CTA muffle effect (Low-pass)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, ctx.currentTime);
      filter.Q.setValueAtTime(1, ctx.currentTime);
      filterRef.current = filter;

      masterGain.connect(filter);
      filter.connect(ctx.destination);

      // Layer 1: Warm Root Valley Drone (55Hz sub + 110Hz warm octave)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, ctx.currentTime); // A2

      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0.18, ctx.currentTime);

      osc1.connect(droneGain);
      osc2.connect(droneGain);
      droneGain.connect(masterGain);
      osc1.start();
      osc2.start();
      nodesRef.current.push(osc1, osc2, droneGain);

      // Layer 2: Ethereal Harmonic Chords (220Hz, 329.63Hz E4, 440Hz A4)
      const chords = [220, 277.18, 329.63, 440];
      chords.forEach((freq, idx) => {
        const chordOsc = ctx.createOscillator();
        chordOsc.type = 'sine';
        chordOsc.frequency.setValueAtTime(freq, ctx.currentTime);

        const chordGain = ctx.createGain();
        chordGain.gain.setValueAtTime(0.045 / (idx + 1), ctx.currentTime);

        // Slow tremolo / breathing LFO
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1 + idx * 0.05, ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(chordGain.gain);
        lfo.start();

        chordOsc.connect(chordGain);
        chordGain.connect(masterGain);
        chordOsc.start();
        nodesRef.current.push(chordOsc, chordGain, lfo, lfoGain);
      });

      // Layer 3: Soft Atmospheric Night Breeze (Filtered White Noise)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(450, ctx.currentTime);
      noiseFilter.Q.setValueAtTime(1.8, ctx.currentTime);

      // Wind sweep LFO
      const windLfo = ctx.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.setValueAtTime(0.08, ctx.currentTime);
      const windLfoGain = ctx.createGain();
      windLfoGain.gain.setValueAtTime(250, ctx.currentTime);
      windLfo.connect(windLfoGain);
      windLfoGain.connect(noiseFilter.frequency);
      windLfo.start();

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      whiteNoise.start();
      nodesRef.current.push(whiteNoise, noiseFilter, noiseGain, windLfo, windLfoGain);

    } catch (e) {
      console.warn('AudioContext initialization deferred:', e);
    }
  };

  const toggleSound = async () => {
    if (!audioCtxRef.current) {
      initAudio();
    }

    const ctx = audioCtxRef.current;
    if (!ctx || !masterGainRef.current) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    if (isPlaying) {
      // Smooth fade out over 0.8s
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      setIsPlaying(false);
    } else {
      // Smooth fade in over 1.2s
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(0.35, now + 1.2);
      setIsPlaying(true);
    }
  };

  // React to CTA hover (Muffle audio by lowering low-pass filter cutoff)
  useEffect(() => {
    if (!filterRef.current || !audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    if (isMuffled) {
      filterRef.current.frequency.cancelScheduledValues(now);
      filterRef.current.frequency.setTargetAtTime(320, now, 0.2); // Muffled underwater/night stillness
    } else {
      filterRef.current.frequency.cancelScheduledValues(now);
      filterRef.current.frequency.setTargetAtTime(1400, now, 0.3); // Clear airy nighttime ambiance
    }
  }, [isMuffled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed bottom-[30px] left-1/2 -translate-x-1/2 custom:left-auto custom:right-[44px] custom:translate-x-0 z-30 flex items-center gap-4 text-[#f5efe2]/75 select-none pointer-events-auto">
      {/* Scroll indicator */}
      <span className="text-[12px] font-medium tracking-[0.14em] uppercase text-[#f5efe2]/70 whitespace-nowrap">
        Scroll to wander
      </span>

      {/* Vertical divider */}
      <div className="h-3 w-[1px] bg-[#f5efe2]/25" aria-hidden="true" />

      {/* Sound toggle button */}
      <button
        type="button"
        onClick={toggleSound}
        aria-label={isPlaying ? 'Mute ambient sound' : 'Enable ambient sound'}
        aria-pressed={isPlaying}
        className="group flex items-center gap-1.5 text-[12px] tracking-[0.08em] text-[#f5efe2]/75 transition-colors duration-300 hover:text-[#f5efe2] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#f5efe2]"
      >
        <span className="sr-only">{isPlaying ? 'Sound enabled' : 'Sound muted'}</span>
        {isPlaying ? (
          <Volume2 className="h-4 w-4 stroke-[1.8] text-[#f5efe2] transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <VolumeX className="h-4 w-4 stroke-[1.8] text-[#f5efe2]/60 transition-transform duration-300 group-hover:scale-110 group-hover:text-[#f5efe2]" />
        )}
      </button>
    </div>
  );
};
