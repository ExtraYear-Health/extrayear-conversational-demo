'use client';

import { Button } from '@nextui-org/react';
import React from 'react';

import { Settings } from './Settings';

export interface InitialScreenProps {
  isLoading?: boolean;
  onSelectAssistant(id): void;
  onSubmit: () => void;
  assistantId: string;
}

export const InitialScreen = ({
  onSubmit,
  isLoading,
  onSelectAssistant,
  assistantId,
}: InitialScreenProps) => {
  return (
    <div className="h-full w-full flex justify-center items-center">
      <div className="col-start-1 col-end-13 sm:col-start-2 sm:col-end-12 md:col-start-3 md:col-end-11 lg:col-start-4 lg:col-end-10 p-3 mb-1/2">
        <div className="relative block w-full glass p-6 sm:p-8 lg:p-12 rounded-xl">
          <h2 className="font-favorit mt-2 block font-bold text-xl text-gray-100 text-center">
            Welcome to ExtraYear&apos;s
            <br />
            Cognitive Rehab Tech Demo
          </h2>
          <div className="flex justify-center mt-4">
            <p className="text-center text-default-400">Conversations for Cognitive Health</p>
          </div>
          <div className="my-5">
            <Settings assistantId={assistantId} onSelectAssistant={onSelectAssistant} />
          </div>
          <div className="mt-6">
            <Button
              className="mt-4 disabled"
              color="primary"
              fullWidth
              isDisabled={!assistantId}
              isLoading={isLoading}
              onClick={onSubmit}
              size="lg"
            >
              {isLoading ? 'Loading...' : `Click here to start`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
