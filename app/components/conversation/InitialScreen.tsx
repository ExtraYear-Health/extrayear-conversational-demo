'use client';

import { Button } from '@nextui-org/react';
import React from 'react';

import { Activities } from './activities';
import { useConversation } from './context';

export interface InitialScreenProps {
  isLoading?: boolean;
  onSubmit: () => void;
}

export const InitialScreen = ({ onSubmit, isLoading }: InitialScreenProps) => {
  const { activityId } = useConversation();

  return (
    <div className="w-full">
      <div className="container mx-auto px-4">
        <div className="py-6">
          <div className="intro py-2">
            <h2 className="font-semibold text-2xl md:text-3xl">Hello there,</h2>
            <h3 className="font-semibold text-2xl md:text-3xl text-slate-300 -mt-0.75">
              What should we do today?
            </h3>
          </div>
          <div className="max-w-full">
            <Activities />

            <div className="mt-6">
              <Button
                color="primary"
                isDisabled={!activityId}
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
