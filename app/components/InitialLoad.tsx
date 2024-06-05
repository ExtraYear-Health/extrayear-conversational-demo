'use client';

import { isBrowser } from 'react-device-detect';
import { Button } from '@nextui-org/react';
import React from 'react';

interface InitialLoadProps {
  onSubmit: () => void;
}

export const InitialLoad = ({ onSubmit }: InitialLoadProps) => {
  return (
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
        <div className="mt-6">
          <Button
            className="mt-4 disabled"
            color="primary"
            fullWidth
            onClick={onSubmit}
            size="lg"
          >
            Click here to start
          </Button>
        </div>
      </div>
    </div>
  );
};
