import { useState, useTransition } from 'react';

type Action<S> = (state: Awaited<S>) => S | Promise<S>;

/**
 * This is a temporary hook for handling server actions. Once we run on the newer version of Next.js and React we will be able to use useActionState from react directly.
 * https://react.dev/reference/react/useActionState
 */
export function useActionState<S>(action: Action<S>, initialState?: Awaited<S>) {
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState();
  const [data, setData] = useState(initialState);

  const dispatch = (state?: Awaited<S>) => {
    return new Promise((resolve) => {
      startTransition(async () => {
        try {
          setError(undefined);
          const data = await action(state);
          resolve({ data });
          setData(data);
        } catch (error) {
          setError(error);
          setData(undefined);
          resolve({ error });
        }
      });
    });
  };

  return { loading, error, data, dispatch };
}
