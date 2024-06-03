import { useMicVAD } from '@ricky0123/vad-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useTimer } from '../hooks/useTimer';

type SpeechState = 'idle' | 'started' | 'ended';

export interface UseReactVADProps {
  listening?: boolean;
  onSpeechEnd: () => void;
  onSpeechStart: () => void;
  silenceThresholdMs?: number;
  voiceProbThreshold?: number;
}

/**
 * React hook to use the VAD (Voice Activity Detection) to detect speech in real-time
 * @see - https://github.com/snakers4/silero-vad
 */
export default function useReactVAD({
  listening,
  onSpeechEnd,
  onSpeechStart,
  silenceThresholdMs = 4000,
  voiceProbThreshold = 0.9,
}: UseReactVADProps) {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const initialized = useRef(false);

  const startSpeech = useCallback(() => {
    console.info('[ReactVAD] Speech has started.');

    setSpeechState('started');
    onSpeechStart();
  }, [onSpeechStart]);

  const endSpeech = useCallback(() => {
    console.info('[ReactVAD] Speech has ended.');

    setSpeechState('ended');
    onSpeechEnd();
  }, [onSpeechEnd]);

  const silenceTimer = useTimer({
    autostart: false,
    endTime: silenceThresholdMs / 1000, // convert to seconds
    initialStatus: 'STOPPED',
    onTimeOver: endSpeech,
  });

  const { start: startMicVAD } = useMicVAD({
    startOnLoad: false,
    positiveSpeechThreshold: voiceProbThreshold,
    negativeSpeechThreshold: voiceProbThreshold - 0.1,
    onSpeechStart: useCallback(() => {
      silenceTimer.reset();

      if (speechState !== 'started') {
        startSpeech();
      }
    }, [silenceTimer, speechState, startSpeech]),
    onSpeechEnd: useCallback(() => {
      if (speechState === 'started') {
        silenceTimer.start();
      }
    }, [silenceTimer, speechState]),
  });

  useEffect(() => {
    if (listening && !initialized.current) {
      startMicVAD();
      initialized.current = true;
    }
  }, [listening, startMicVAD]);

  return { speechState, isSpeeching: speechState === 'started' };
}
