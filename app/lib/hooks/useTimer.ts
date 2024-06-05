import { useCallback, useEffect, useState } from 'react';

type TimerStatus = 'RUNNING' | 'PAUSED' | 'STOPPED';
type TimerType = 'INCREMENTAL' | 'DECREMENTAL';

interface UseTimerProps {
  autostart?: boolean;
  endTime?: number;
  initialStatus?: TimerStatus;
  initialTime?: number;
  interval?: number;
  onTimeOver?: () => void;
  onTimeUpdate?: (time: number) => void;
  step?: number;
  timerType?: TimerType;
}

export const useTimer = ({
  autostart = false,
  endTime,
  initialStatus = 'STOPPED',
  initialTime = 0,
  interval = 1000,
  onTimeOver,
  onTimeUpdate,
  step = 1,
  timerType = 'INCREMENTAL',
}: UseTimerProps = {}) => {
  const [time, setTime] = useState(initialTime);
  const [status, setStatus] = useState<TimerStatus>(initialStatus);

  const pause = useCallback(() => {
    setStatus('PAUSED');
  }, []);

  const reset = useCallback(() => {
    setStatus('STOPPED');
    setTime(initialTime);
  }, [initialTime]);

  const start = useCallback(() => {
    setTime((time) => status === 'STOPPED' ? initialTime : time);
    setStatus('RUNNING');
  }, [initialTime, status]);

  useEffect(() => {
    if (autostart) {
      start();
    }
  }, []);

  useEffect(() => {
    if (typeof onTimeUpdate === 'function') {
      onTimeUpdate(time);
    }
  }, [time, onTimeUpdate]);

  useEffect(() => {
    if (status !== 'STOPPED' && time === endTime) {
      reset();

      if (typeof onTimeOver === 'function') {
        onTimeOver();
      }
    }
  }, [endTime, onTimeOver, time, status, reset]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    if (status === 'RUNNING') {
      timeout = setInterval(() => {
        setTime(timerType === 'DECREMENTAL' ? time - step : time + step);
      }, interval);
    } else if (timeout) {
      clearInterval(timeout);
    }
    return () => {
      if (timeout) {
        clearInterval(timeout);
      }
    };
  }, [status, step, timerType, interval, time]);

  return { pause, reset, start, status, time };
};
