import { ExclamationIcon } from "./icons/ExclamationIcon";
import { Headphones } from "./Headphones";
import { isBrowser, isIOS } from "react-device-detect";
import { Avatar, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from "@nextui-org/react";
import React, { useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';
import Image from "next/image";
import { Spinner } from "@nextui-org/react";
import { useDeepgram } from "../context/Deepgram"; // Ensure the path matches where your context is defined
import { llmModels, llmModelMap, LLMModelConfig } from "../context/LLM";
import { DeepgramContext } from "../context/Deepgram";
import { useToast } from "../context/Toast";


const LLMModelSelection: React.FC<{ llmModel: string; setLLMModel: Dispatch<SetStateAction<string>> }> = ({ llmModel, setLLMModel }) => {
  const llmModelOptions = Object.entries(llmModels).map(([key, value]) => ({
    key,
    label: `${value.llmProvider} - ${value.llmModel}`,
    api: value.api
  }));

  return (
    <Select
      value={llmModel}
      onChange={(e) => setLLMModel(e.target.value)}
      label="Select LLM Model"
      variant="bordered"
    >
      {llmModelOptions.map((option) => (
        <SelectItem key={option.key} value={option.key} textValue={option.label}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
};

export const InitialLoad = ({ fn, connecting }: { fn: () => void; connecting: boolean }) => {
  const { state, dispatch } = useContext(DeepgramContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialLLMModel = state.llm?.llmModel || 'openai-gpt4-turbo';
  const { toast } = useToast();
  const [llmModel, setLLMModel] = useState<string>(initialLLMModel);

  const saveAndClose = () => {
    dispatch({
      type: 'SET_LLM',
      payload: llmModel
    });
    onClose();
  };

  const handleButtonClick = () => {
    if (!connecting) {
      fn();           // Call the function passed as prop
      saveAndClose(); // Call the save and close function
    }
  };


  return (
    <>
      <div className="col-start-1 col-end-13 sm:col-start-2 sm:col-end-12 md:col-start-3 md:col-end-11 lg:col-start-4 lg:col-end-10 p-3 mb-1/2">
        <div className="relative block w-full glass p-6 sm:p-8 lg:p-12 rounded-xl">
          <h2 className="font-favorit mt-2 block font-bold text-xl text-gray-100 text-center">
            Welcome to ExtraYear&apos;s
            <br />
            Cognitive Rehab Tech Demo
          </h2>
          <div className="flex justify-center mt-4">
            <p className="text-center">Conversations for Cognitive Health</p>
          </div>
          <button
            disabled={connecting}
            onClick={handleButtonClick}
            type="button"
            className="my-4 block w-full sm:w-auto font-semibold bg-white text-black rounded px-10 py-3 font-semibold sm:w-fit sm:mx-auto opacity-90"
          >
            {connecting ? (
              <div className="w-auto h-full items-center flex justify-center opacity-40 cursor-not-allowed">
                <Spinner size={"sm"} className="-mt-1 mr-2" />
                Connecting...
              </div>
            ) : (
              <>{isBrowser ? "Click" : "Tap"} here to start</>
            )}
          </button>
          <LLMModelSelection llmModel={llmModel} setLLMModel={setLLMModel} />
        </div>
      </div>
    </>
  );
  
};






// return (
//   <>
//     <div className="col-start-1 col-end-13 sm:col-start-2 sm:col-end-12 md:col-start-3 md:col-end-11 lg:col-start-4 lg:col-end-10 p-3 mb-1/2">
//       <button
//         disabled={connecting}
//         onClick={() => !connecting && fn()}
//         type="button"
//         className="relative block w-full glass p-6 sm:p-8 lg:p-12 rounded-xl"
//       >
//         <h2 className="font-favorit mt-2 block font-bold text-xl text-gray-100">
//           Welcome to ExtraYear&apos;s
//           <br />
//           Cognitive Rehab Tech Demo
//         </h2>
//         <div className="flex justify-center mt-4">
//           <p>Conversations for Cognitive Health</p>
//         </div>
//         <span className="mt-4 block font-semibold">
//           <div className="bg-white text-black rounded px-10 py-3 font-semibold sm:w-fit sm:mx-auto opacity-90">
//             {connecting ? (
//               <div className="w-auto h-full items-center flex justify-center opacity-40 cursor-not-allowed"> 
//               {/* "w-auto h-full items-center flex justify-center opacity-40 cursor-not-allowed"> */}
//                 <Spinner size={"sm"} className="-mt-1 mr-2" />
//                 Connecting...
//               </div>
//             ) : (
//               <>{isBrowser ? "Click" : "Tap"} here to start</>
//             )}
//           </div>
//         </span>
//         <LLMModelSelection llmModel={llmModel} setLLMModel={setLLMModel} />
//       </button>
      
//         {/* <Button color="primary" onClick={saveAndClose}>
//           Save
//         </Button> */}
//     </div>
//   </>
// );
