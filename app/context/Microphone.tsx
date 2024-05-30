'use client';

import { useQueue } from '@uidotdev/usehooks';
import {
  Dispatch,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

type MicrophoneContext = {
  microphone: MediaRecorder | undefined;
  setMicrophone: Dispatch<SetStateAction<MediaRecorder | undefined>>;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  microphoneOpen: boolean;
  enqueueBlob: (element: Blob) => void;
  removeBlob: () => Blob | undefined;
  firstBlob: Blob | undefined;
  queueSize: number;
  queue: Blob[];
  stream: MediaStream | undefined;
};

interface MicrophoneContextInterface {
  children: React.ReactNode;
}

const MicrophoneContext = createContext({} as MicrophoneContext);

const MicrophoneContextProvider = ({
  children,
}: MicrophoneContextInterface) => {
  const [microphone, setMicrophone] = useState<MediaRecorder>();
  const [stream, setStream] = useState<MediaStream>();
  const [microphoneOpen, setMicrophoneOpen] = useState(false);

  const {
    add: enqueueBlob, // addMicrophoneBlob,
    remove: removeBlob, // removeMicrophoneBlob,
    first: firstBlob, // firstMicrophoneBlob,
    size: queueSize, // countBlobs,
    queue, // : microphoneBlobs,
  } = useQueue<Blob>([]);

  useEffect(() => {
    async function setupMicrophone() {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
        },
      });

      setStream(stream);

      const microphone = new MediaRecorder(stream);
      setMicrophone(microphone);
    }

    if (!microphone) {
      setupMicrophone();
    }
  }, [enqueueBlob, microphone, microphoneOpen]);

  useEffect(() => {
    if (!microphone) return;

    microphone.ondataavailable = (e) => {
      if (microphoneOpen) enqueueBlob(e.data);
    };

    return () => {
      microphone.ondataavailable = null;
    };
  }, [enqueueBlob, microphone, microphoneOpen]);

  const stopMicrophone = useCallback(() => {
    if (microphone?.state === 'recording') microphone?.pause();

    setMicrophoneOpen(false);
  }, [microphone]);

  const startMicrophone = useCallback(() => {
    setMicrophoneOpen(true);

    if (microphone?.state === 'paused') {
      microphone?.resume();
    }
    if (microphone?.state === 'inactive') {
      microphone?.start(250);
    }
  }, [microphone]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopMicrophone();
      } else if (!microphoneOpen) {
        startMicrophone();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [microphoneOpen, startMicrophone, stopMicrophone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        setMicrophone,
        startMicrophone,
        stopMicrophone,
        microphoneOpen,
        enqueueBlob,
        removeBlob,
        firstBlob,
        queueSize,
        queue,
        stream,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone() {
  return useContext(MicrophoneContext);
}

export { MicrophoneContextProvider, useMicrophone };
