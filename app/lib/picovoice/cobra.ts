import EventEmitter from 'events';

import { CobraWorker } from '@picovoice/cobra-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

const accessKey = process.env.NEXT_PUBLIC_PICOVOICE_API_KEY;

export enum CobraVADEvents {
  SpeechStart = 'speechstart',
  SpeechEnd = 'speechend',
}

export interface CobraVADOptions {
  voiceProbThreshold?: number;
  silenceThresholdMs?: number;
}

export async function startCobraVAD({
  voiceProbThreshold = 0.9,
  silenceThresholdMs = 4 * 1000,
}: CobraVADOptions) {
  const eventEmitter = new EventEmitter();

  let speeching = false;
  let cobra: CobraWorker | null = null;
  let silenceStart = 0;

  function startSpeech() {
    console.info('[CobraVAD] Speech has started.');

    speeching = true;
    eventEmitter.emit(CobraVADEvents.SpeechStart);
  }

  function endSpeech() {
    console.info('[CobraVAD] Speech has ended.');

    speeching = false;
    eventEmitter.emit(CobraVADEvents.SpeechEnd);
  }

  function on(eventType: CobraVADEvents, listener: () => void) {
    eventEmitter.on(eventType, listener);
  }

  function handleVoiceProbability(voiceProb: number) {
    if (voiceProb < voiceProbThreshold) {
      if (speeching) {
        const now = Date.now();

        if (silenceStart && now - silenceStart > silenceThresholdMs) {
          endSpeech();
        } else if (!silenceStart) {
          silenceStart = now;
        }
      }
    } else {
      silenceStart = 0;

      if (!speeching) {
        startSpeech();
      }
    }
  }

  async function unsubscribe() {
    await WebVoiceProcessor.reset();
    await cobra?.release();
    cobra.terminate();
  };

  async function init() {
    try {
      cobra = await CobraWorker.create(accessKey, handleVoiceProbability);

      console.info('[CobraVAD] Initialized');

      await WebVoiceProcessor.subscribe(cobra.worker);
    } catch (error) {
      throw new Error(`[CobraVAD] Failed to create worker: ${error}`);
    }
  }

  await init();

  return { on, unsubscribe };
};

export type CobraVAD = Awaited<ReturnType<typeof startCobraVAD>>;
