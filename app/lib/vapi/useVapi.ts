'use client';

import { useState, useCallback, useEffect } from 'react';
import { Call } from '@vapi-ai/web/dist/api';
import { toast } from 'react-toastify';

import { CallStatus, MessageTypeEnum, TranscriptMessage, TranscriptMessageType, type Message } from '../conversation.type';

import { vapi } from './vapi.sdk';

export interface UseVapiProps {
  assistantId?: string;
  onCallStarted?: (call: Call) => void;
}

export function useVapi({ onCallStarted, assistantId }: UseVapiProps = {}) {
  const [call, setCall] = useState<Call>();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);

  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);

  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    const onSpeechStart = () => {
      console.log('Speech has started');
    };
    const onSpeechEnd = () => {
      console.log('Speech has ended');
    };

    const onCallStartHandler = () => {
      console.log('Call has started');
      setCallStatus(CallStatus.ACTIVE);
      onCallStarted?.(call);
    };

    const onCallEnd = () => {
      console.log('Call has stopped');
      setCallStatus(CallStatus.INACTIVE);
    };

    const onVolumeLevel = (volume: number) => {
      setAudioLevel(volume);
    };

    const onMessageUpdate = (message: Message) => {
      if (message.type === MessageTypeEnum.TRANSCRIPT) {
        setTranscripts((prevState) => {
          const lastTranscript = prevState.at(-1);

          if (!lastTranscript || lastTranscript.role !== message.role) {
            return prevState.concat(message);
          }

          if (lastTranscript.transcriptType === TranscriptMessageType.PARTIAL) {
            return prevState.slice(0, -1).concat(message);
          }

          return prevState.concat(message);
        });
      }
    };

    const onError = (e: any) => {
      setCallStatus(CallStatus.INACTIVE);

      if ('error' in e) {
        toast.error(e.error?.message);
      }
    };

    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('call-start', onCallStartHandler);
    vapi.on('call-end', onCallEnd);
    vapi.on('volume-level', onVolumeLevel);
    vapi.on('message', onMessageUpdate);
    vapi.on('error', onError);

    return () => {
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('call-start', onCallStartHandler);
      vapi.off('call-end', onCallEnd);
      vapi.off('volume-level', onVolumeLevel);
      vapi.off('message', onMessageUpdate);
      vapi.off('error', onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    setCallStatus(CallStatus.LOADING);

    const call = await vapi.start(assistantId);

    if (call) {
      setCall(call);
    }
  }, [assistantId]);

  const stop = useCallback(() => {
    setCallStatus(CallStatus.LOADING);
    vapi.stop();
  }, []);

  const toggleCall = useCallback(() => {
    if (callStatus == CallStatus.ACTIVE) {
      stop();
    } else {
      start();
    }
  }, [callStatus, start, stop]);

  return {
    callStatus,
    audioLevel,
    start,
    stop,
    toggleCall,
    call,
    transcripts,
  };
}
