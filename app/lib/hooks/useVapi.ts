// import { characterAssistant } from "@/assistants/character.assistant";
import { useEffect, useState, useRef } from 'react';
// import Vapi from '@vapi-ai/web';

import {
  Message,
  MessageTypeEnum,
  TranscriptMessage,
  TranscriptMessageTypeEnum,
} from '../conversation.type';

import { vapi } from './vapi.sdk';

export enum CALL_STATUS {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  LOADING = 'loading',
}

export function useVapi() {
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [callStatus, setCallStatus] = useState<CALL_STATUS>(
    CALL_STATUS.INACTIVE,
  );

  const [messages, setMessages] = useState<Message[]>([]);

  const [activeTranscript, setActiveTranscript] =
    useState<TranscriptMessage | null>(null);

  // const [activeMessageText, setActiveMessageText] = useState<string>(null);
  const activeMessageText = useRef<string>('');
  const [activeTranscriptText, setActiveTranscriptText] = useState<string>(null);

  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    const onSpeechStart = () => {
      console.log('speech has started');
      activeMessageText.current = '';
      setActiveTranscriptText(null);
      setActiveTranscript(null);
      setIsSpeechActive(true);
    };
    const onSpeechEnd = () => {
      console.log('Speech has ended');
      activeMessageText.current = '';
      setActiveTranscriptText(null);
      setActiveTranscript(null);
      setIsSpeechActive(false);
      console.log(messages);
    };

    const onCallStartHandler = () => {
      console.log('Call has started');
      setCallStatus(CALL_STATUS.ACTIVE);
    };

    const onCallEnd = () => {
      console.log('Call has stopped');
      setCallStatus(CALL_STATUS.INACTIVE);
    };

    const onVolumeLevel = (volume: number) => {
      setAudioLevel(volume);
    };

    const onMessageUpdate = (message: Message) => {
      if (message.type === MessageTypeEnum.MODEL_OUTPUT) {
        console.log('message', message);
      }
      if (
        message.type === MessageTypeEnum.TRANSCRIPT &&
        message.transcriptType === TranscriptMessageTypeEnum.PARTIAL
      ) {
        setActiveTranscriptText(activeMessageText.current + message.transcript + ' ');
        setActiveTranscript(message);
      } else if (
        message.type === MessageTypeEnum.CONVERSATION_UPDATE
      ) {
        activeMessageText.current = message.conversation[message.conversation.length - 1].content;
        setMessages((prev) => [...prev, message]);
      }
    };

    const onError = (e: any) => {
      setCallStatus(CALL_STATUS.INACTIVE);
      console.error(e);
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

  const start = async () => {
    setCallStatus(CALL_STATUS.LOADING);
    const response = vapi.start('e88895ad-0b69-4e73-9eaa-c65a9e68d997');

    response.then((res) => {
      console.log('call', res);
    });
  };

  const stop = () => {
    setCallStatus(CALL_STATUS.LOADING);
    vapi.stop();
  };

  const toggleCall = () => {
    if (callStatus == CALL_STATUS.ACTIVE) {
      stop();
    } else {
      start();
    }
  };

  return {
    isSpeechActive,
    callStatus,
    audioLevel,
    activeTranscript,
    activeTranscriptText,
    messages,
    start,
    stop,
    toggleCall,
  };
}
