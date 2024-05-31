import { useMicVAD } from '@ricky0123/vad-react';
import { useEffect, useState } from 'react';

import { useTimer } from '../hooks/useTimer';

type SpeechState = 'idle' | 'started' | 'ended';

export interface UseReactVADProps {
  listening?: boolean;
  onSpeechEnd: () => void;
  onSpeechStart: () => void;
  silenceThresholdMs?: number;
  voiceProbThreshold?: number;
}

export default function useReactVAD({
  listening,
  voiceProbThreshold = 0.9,
  silenceThresholdMs = 4000,
  onSpeechStart,
  onSpeechEnd,
}: UseReactVADProps) {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');

  function startSpeech() {
    console.info('[ReactVAD] Speech has started.');

    setSpeechState('started');
    onSpeechStart();
  }

  function endSpeech() {
    console.info('[ReactVAD] Speech has ended.');

    setSpeechState('ended');
    onSpeechEnd();
  }

  const silenceTimer = useTimer({
    autostart: false,
    initialTime: 0,
    endTime: silenceThresholdMs / 1000, // convert to seconds
    step: 1,
    interval: 1000,
    initialStatus: 'STOPPED',
    onTimeOver: endSpeech,
  });

  const { start: startMicVAD } = useMicVAD({
    positiveSpeechThreshold: voiceProbThreshold,
    negativeSpeechThreshold: voiceProbThreshold - 0.1,
    onSpeechStart() {
      silenceTimer.reset();
      if (speechState !== 'started') {
        startSpeech();
      }
    },
    onSpeechEnd() {
      if (speechState === 'started') {
        silenceTimer.start();
      }
    },
  });

  useEffect(() => {
    if (listening) {
      startMicVAD();
    }
  }, [listening, startMicVAD]);

  return { speechState, isSpeeching: speechState === 'started' };
}
