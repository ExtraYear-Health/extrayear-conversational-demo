import { ExclamationIcon } from './icons/ExclamationIcon';
import { Headphones } from './Headphones';
import { isBrowser, isIOS } from 'react-device-detect';
import { Avatar, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from '@nextui-org/react';
import React, { useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';
import Image from 'next/image';
import { Spinner } from '@nextui-org/react';
import { useDeepgram } from '../context/Deepgram'; // Ensure the path matches where your context is defined
import { llmModels, llmModelMap, LLMModelConfig } from '../context/LLM';
import { DeepgramContext } from '../context/Deepgram';
import { useToast } from '../context/Toast';
import { promptData, PromptConfig } from '../context/PromptList'; // Update the import path as needed

const LLMModelSelection: React.FC<{ llmModel: string; setLLMModel: Dispatch<SetStateAction<string>>; }> = ({ llmModel, setLLMModel }) => {
  const llmModelOptions = Object.entries(llmModels).map(([key, value]) => ({
    key,
    label: `${value.llmProvider} - ${value.llmModel}`,
    api: value.api,
  }));

  return (
    <Select
      value={llmModel}
      selectedKeys={[llmModel]}
      onChange={(e) => setLLMModel(e.target.value)}
      label="Select LLM Model"
      variant="bordered"
    >
      {llmModelOptions.map((option) => (
        <SelectItem key={option.key} value={option.key}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
};

interface PromptSelectionProps {
  selectedPrompt: string;
  setSelectedPrompt: Dispatch<SetStateAction<string>>;
}

const PromptSelection: React.FC<PromptSelectionProps> = ({ selectedPrompt, setSelectedPrompt }) => {
  const promptOptions = Object.entries(promptData).map(([key, value]) => ({
    key,
    label: value.title,
    description: value.description,
  }));

  return (
    <Select
      value={selectedPrompt}
      selectedKeys={[selectedPrompt]}
      onChange={(e) => setSelectedPrompt(e.target.value)}
      label="Select a Conversation"
      variant="bordered"
    >
      {promptOptions.map((option) => (
        <SelectItem key={option.key} value={option.key} textValue={option.label}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
};

export const InitialLoad = ({ fn, connecting }: { fn: () => void; connecting: boolean; }) => {
  const { state, dispatch } = useDeepgram();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialLLMModel = state.llm?.llmModel || 'openai-gpt4-turbo';
  const { toast } = useToast();
  const [llmModel, setLLMModel] = useState<string>(initialLLMModel);
  const initialPrompt = 'londonMarathonArticleConversation'; // TODO: define default setup elsewhere
  const [selectedPrompt, setSelectedPrompt] = useState<string>(initialPrompt);

  const saveAndClose = () => {
    // Dispatch the action to update the LLM model in the state
    dispatch({
      type: 'SET_LLM',
      payload: llmModel,
    });

    // Dispatch the action to update the selected prompt in the state
    dispatch({
      type: 'SET_PROMPT',
      payload: selectedPrompt, // Make sure this variable holds the prompt ID or relevant identifier
    });

    // Close the modal or dialog
    onClose();
  };

  const handleButtonClick = () => {
    if (!connecting) {
      fn(); // Call the function passed as prop
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
          <div className="mt-6">
            <div className="my-2.5">
              <LLMModelSelection llmModel={llmModel} setLLMModel={setLLMModel} />
            </div>
            <div className="my-2.5">
              <PromptSelection selectedPrompt={selectedPrompt} setSelectedPrompt={setSelectedPrompt} />
            </div>

            <Button
              disabled={connecting}
              onClick={handleButtonClick}
              color="primary"
              fullWidth
              isLoading={connecting}
              startContent={connecting && (
                <Spinner size="sm" />
              )}
            >
              {connecting ? 'Connecting...' : `${isBrowser ? 'Click' : 'Tap'} here to start`}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
