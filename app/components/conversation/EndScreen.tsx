import { Card } from '@nextui-org/react';

export function EndScreen() {
  return (
    <div className="min-h-screen w-full flex justify-center items-center">
      <div className="col-start-1 col-end-13 sm:col-start-2 sm:col-end-12 md:col-start-3 md:col-end-11 lg:col-start-4 lg:col-end-10 p-3 mb-1/2">
        <Card className="relative block w-full p-6 sm:p-8 lg:p-12 rounded-xl">
          <h2 className="mt-2 block font-bold text-xl text-center">
            Great! You&apos;ve completed our
            <br />
            Cognitive Rehab Tech Demo
          </h2>
          <div className="flex justify-center mt-4">
            <p className="text-center text-default-400">Thank you for partipacing.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
