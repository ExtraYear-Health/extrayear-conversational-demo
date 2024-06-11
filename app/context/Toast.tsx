'use client';

import { createContext, useContext } from 'react';
import { Bounce, toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type ToastContext = {
  toast: typeof toast;
};

interface ToastContextInterface {
  children: React.ReactNode;
}

const ToastContext = createContext({} as ToastContext);

const ToastContextProvider = ({ children }: ToastContextInterface) => {
  return (
    <ToastContext.Provider value={{ toast }}>
      <>
        {children}
        <ToastContainer position="bottom-center" autoClose={8000} theme="dark" limit={1} transition={Bounce} />
      </>
    </ToastContext.Provider>
  );
};

function useToast() {
  return useContext(ToastContext);
}

export { ToastContextProvider, useToast };
