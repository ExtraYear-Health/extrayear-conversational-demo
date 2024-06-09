'use client';

import { Button } from '@nextui-org/react';
import React from 'react';

import { Settings } from './Settings';
import { useConversation } from './context';

export interface InitialScreenProps {
  isLoading?: boolean;
  onSubmit: () => void;
}

export const InitialScreen = ({
  onSubmit,
  isLoading,
}: InitialScreenProps) => {
  const { assistantId } = useConversation();

  return (
    <div className="h-full w-full flex justify-center items-center">
      <div className="p-3 max-w-full">
        <div className="relative block w-full glass p-6 sm:p-8 lg:p-12 rounded-xl w-full">
          <h2 className="font-favorit mt-2 block font-bold text-xl text-gray-100 text-center">
            Welcome to ExtraYear&apos;s
            <br />
            Cognitive Rehab Tech Demo
          </h2>
          <div className="flex justify-center mt-4">
            <p className="text-center text-default-400">Conversations for Cognitive Health</p>
          </div>
          <div className="my-5">
            <Settings />
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
