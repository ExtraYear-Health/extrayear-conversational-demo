import { useEffect, useState } from 'react';

import { CobraVAD, CobraVADEvents, startCobraVAD } from './cobra';

type SpeechState = 'idle' | 'started' | 'ended';

interface UseCobraVadProps {
  listening?: boolean;
  onSpeechEnd: () => void;
  onSpeechStart: () => void;
  silenceThresholdMs?: number;
  voiceProbThreshold?: number;
}

export function useCobraVAD({
  listening,
  voiceProbThreshold = 0.9,
  silenceThresholdMs = 4000,
  onSpeechStart,
  onSpeechEnd,
}: UseCobraVadProps) {
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [cobraVAD, setCobraVAD] = useState<CobraVAD>();

  useEffect(() => {
    if (cobraVAD) {
      switch (speechState) {
        case 'started':
          onSpeechStart();
          break;
        case 'ended':
          onSpeechEnd();
        default:
          break;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechState]);

  useEffect(() => {
    async function setup() {
      const cobraVAD = await startCobraVAD({
        voiceProbThreshold,
        silenceThresholdMs,
      });

      cobraVAD.on(CobraVADEvents.SpeechStart, () => {
        setSpeechState('started');
      });

      cobraVAD.on(CobraVADEvents.SpeechEnd, () => {
        setSpeechState('ended');
      });

      setCobraVAD(cobraVAD);
    }

    if (listening) {
      setup();
    }
    return () => {
      cobraVAD?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening]);

  return {
    speechState,
    isSpeeching: speechState === 'started',
  };
}
