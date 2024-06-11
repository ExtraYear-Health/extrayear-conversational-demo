'use client';

import { useState, useCallback, useEffect } from 'react';
import { Call } from '@vapi-ai/web/dist/api';
import { toast } from 'react-toastify';

import { CallStatus, MessageRole, MessageType, TranscriptMessage, TranscriptMessageType, type Message } from '../conversation.type';

import { vapi } from './vapi.sdk';

export interface UseVapiProps {
  assistantId?: string;
  onCallStarted?: (call: Call) => void;
  onCallEnded?: () => void;
}

export function useVapi({ onCallStarted, assistantId, onCallEnded }: UseVapiProps = {}) {
  const [isAssistantSpeeching, setIsAssistantSpeeching] = useState(false);

  const [call, setCall] = useState<Call>();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);

  const [transcripts, setTranscripts] = useState<TranscriptMessage[]>([]);

  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    const onSpeechStart = () => {
      console.log('Speech has started');
      setIsAssistantSpeeching(true);
    };
    const onSpeechEnd = () => {
      console.log('Speech has ended');
      setIsAssistantSpeeching(false);
    };

    const onCallStartHandler = () => {
      console.log('Call has started');
      setCallStatus(CallStatus.ACTIVE);
      onCallStarted?.(call);
    };

    const onCallEnd = () => {
      console.log('Call has stopped');
      setCallStatus(CallStatus.INACTIVE);
      onCallEnded?.();
    };

    const onVolumeLevel = (volume: number) => {
      setAudioLevel(volume);
    };

    const onMessageUpdate = (message: Message) => {
      if (message.type === MessageType.TRANSCRIPT) {
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

      if (message.type === MessageType.FUNCTION_CALL && message.functionCall.name === 'SendImage') {
        const src = message.functionCall.parameters.src;
        setTranscripts((prevState) => prevState.concat({
          role: MessageRole.ASSISTANT,
          timestamp: new Date().toISOString(),
          transcript: `![exercise](${src})`,
          transcriptType: TranscriptMessageType.FINAL,
          type: MessageType.TRANSCRIPT,
        }));
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
    audioLevel,
    call,
    callStatus,
    isAssistantSpeeching,
    start,
    stop,
    toggleCall,
    transcripts,
  };
}
