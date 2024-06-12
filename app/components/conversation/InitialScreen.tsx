'use client';

import { Button } from '@nextui-org/react';
import React from 'react';

import { useConversation } from './context';
import { Settings } from './Settings';

export interface InitialScreenProps {
  isLoading?: boolean;
  onSubmit: () => void;
}

export const InitialScreen = ({ onSubmit, isLoading }: InitialScreenProps) => {
  const { assistantId } = useConversation();

  return (
    <div className="h-full w-full">
      <div className="container mx-auto px-2">
        <div className="py-6">
          <div className="intro py-2">
            <h2 className="font-semibold text-3xl">Hello there</h2>
            <h3 className="font-semibold text-3xl text-slate-400 -mt-0.75">
              What should we do today?
            </h3>
          </div>
          <div className="max-w-full">
            <div className="my-5">
              <Settings />
            </div>
            <div className="mt-6">
              <Button
                className="mt-4 disabled"
                color="primary"
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
    </div>
  );
};
