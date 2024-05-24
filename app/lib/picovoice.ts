import { CobraWorker } from '@picovoice/cobra-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import { useEffect, useRef, useState } from 'react';

import { useTimer } from './hooks/useTimer';

const accessKey = process.env.NEXT_PUBLIC_PICOVOICE_API_KEY;

interface UseCobraVadProps {
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
}

export function useCobraVAD({
  onSpeechStart,
  onSpeechEnd,
}: UseCobraVadProps) {
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);

  const isSpeechOngoing = useRef(false);

  const timer = useTimer({
    autostart: false,
    endTime: 4, // after n seconds of silence, speech will be considered ended
    initialTime: 0,
    onTimeOver() {
      console.log('[CobraVAD] Speech has ended after 3s of silence.');
      isSpeechOngoing.current = false;
      onSpeechEnd();
    },
  });

  useEffect(() => {
    if (isSpeechOngoing.current) {
      switch (timer.status) {
        case 'STOPPED':
          if (!isVoiceSpeaking) {
            console.log('[CobraVAD] Timer has started after capture silence.');
            timer.start();
          };
          break;
        case 'RUNNING':
          if (isVoiceSpeaking) {
            console.log('[CobraVAD] Reset timer as a voice is being detected.');
            timer.reset();
          };
          break;
      }
    }
  }, [isVoiceSpeaking, onSpeechStart, timer]);

  useEffect(() => {
    async function init() {
      try {
        const cobra = await CobraWorker.create(accessKey, (voiceProbability: number) => {
          if (voiceProbability <= 0.9) {
            setIsVoiceSpeaking(false);
            return;
          }

          if (!isSpeechOngoing.current) {
            console.log('[CobraVAD] Speech has started.');
            onSpeechStart();
            isSpeechOngoing.current = true;
          }
          setIsVoiceSpeaking(true);
        });

        await WebVoiceProcessor.subscribe(cobra);
      } catch (error) {
        throw new Error(`[CobraVAD] Failed to create worker: ${error}`);
      }
    }

    init();
  }, []);
}
