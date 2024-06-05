'use client';

import { useState, useCallback, useEffect } from 'react';
import { Call } from '@vapi-ai/web/dist/api';
import { toast } from 'react-toastify';

import { CallStatus, MessageTypeEnum, TranscriptMessage, TranscriptMessageType, type Message } from '../conversation.type';

import { vapi } from './vapi.sdk';

export interface UseVapiProps {
  onCallStarted?: (call: Call) => void;
}

export function useVapi({ onCallStarted }: UseVapiProps = {}) {
  const [call, setCall] = useState<Call>();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);

  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);

  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    const onSpeechStart = () => {
      console.log('speech has started');
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

          if (!lastTranscript) {
            return [message];
          }

          if (lastTranscript.role !== message.role) {
            return [...prevState, message];
          }

          // Replace the last partial transcript until it's final
          if (lastTranscript.transcriptType === TranscriptMessageType.PARTIAL) {
            return [...prevState.slice(0, -1), message];
          }

          return [...prevState, message];
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

    const call = await vapi.start('e88895ad-0b69-4e73-9eaa-c65a9e68d997');

    if (call) {
      setCall(call);
    }
  }, []);

  const stop = () => {
    setCallStatus(CallStatus.LOADING);
    vapi.stop();
  };

  const toggleCall = () => {
    if (callStatus == CallStatus.ACTIVE) {
      stop();
    } else {
      start();
    }
  };

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
