import { CobraWorker } from '@picovoice/cobra-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import { useEffect, useState } from 'react';

const accessKey = process.env.NEXT_PUBLIC_PICOVOICE_API_KEY;

interface UseCobraVadProps {
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
}

export function useCobraVAD({
  onSpeechStart,
  onSpeechEnd,
}: UseCobraVadProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  function voiceProbabilityCallback(voiceProbability: number) {
    if (voiceProbability > 0.9) {
      console.log('Speech has started due high human voice probability');
      setIsSpeaking(true);
    } else if (isSpeaking) {
      console.log('Speech has ended.');
      setIsSpeaking(false);
    }
  }

  useEffect(() => {
    CobraWorker.create(accessKey, voiceProbabilityCallback)
      .then(async (cobra) => {
        await WebVoiceProcessor.subscribe(cobra);

        return cobra;
      })
      .catch((error) => {
        throw new Error(`Failed to create CobraWorker: ${error}`);
      });
  }, []);

  useEffect(() => {
    if (isSpeaking) {
      onSpeechStart();
    } else {
      onSpeechEnd();
    }
  }, [isSpeaking, onSpeechEnd, onSpeechStart]);
}
