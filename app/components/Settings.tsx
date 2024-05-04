import React, { useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Avatar, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from "@nextui-org/react";
import { CogIcon } from "./icons/CogIcon";
import { DeepgramContext } from "../context/Deepgram";
import { useToast } from "../context/Toast";
import { voices, voiceMap } from "../context/Voices";
import { llmModels, llmModelMap } from '../context/LLM';


// Define a type for the TTS provider.
type TTSProvider = {
  id: string;
  name: string;
};

const extractProviders = (): TTSProvider[] => {
  const providersSet = new Set<string>();
  Object.values(voices).forEach(voice => {
    providersSet.add(voice.ttsProvider);
  });
  return Array.from(providersSet).map(provider => ({ id: provider, name: provider }));
};

const ttsProviders = extractProviders();

interface ProviderSelectionProps {
  provider: string;
  setProvider: Dispatch<SetStateAction<string>>;
  setVoices: Dispatch<SetStateAction<any[]>>;
}

const ProviderSelection: React.FC<ProviderSelectionProps> = ({ provider, setProvider, setVoices }) => {
  const handleChange = (newProvider: string) => {
    setProvider(newProvider);
    const filteredVoices = Object.entries(voices).filter(([key, value]) => value.ttsProvider === newProvider).map(([key, value]) => ({
      ...value,
      model: key,
    }));
    setVoices(filteredVoices);
  };

  return (
    <Select
      value={provider}
      onChange={(e) => handleChange(e.target.value)}
      label="Select TTS Provider"
      variant="bordered"
    >
      {ttsProviders.map((provider) => (
        <SelectItem key={provider.id} value={provider.id} textValue={provider.name}>
          {provider.name}
        </SelectItem>
      ))}
    </Select>
  );
};

interface ModelSelectionProps {
  model: string | undefined;
  setModel: Dispatch<SetStateAction<string | undefined>>;
  voices: any[];
}

const ModelSelection: React.FC<ModelSelectionProps> = ({ model, setModel, voices }) => {
  return (
    <Select
      value={model || ""}
      onChange={(e) => setModel(e.target.value)}
      label="Selected voice"
      variant="bordered"
    >
      {voices.map((voice) => (
        <SelectItem key={voice.model} value={voice.model} textValue={voice.name}>
          <Avatar size="sm" src={voice.avatar} />
          <div style={{ marginLeft: '10px' }}>
            {voice.name} - {voice.language} {voice.accent}
          </div>
        </SelectItem>
      ))}
    </Select>
  );
};

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

export const Settings = () => {
  const { state } = useContext(DeepgramContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialProvider = (state.ttsOptions?.provider || ttsProviders[0]?.id) as string;
  const initialModel = state.ttsOptions?.model || undefined;
  const initialLLMModel = state.llm?.llmModel || 'openai-gpt4-turbo';
  const [provider, setProvider] = useState<string>(initialProvider);
  const [model, setModel] = useState<string | undefined>(initialModel);
  const [llmModel, setLLMModel] = useState<string>(initialLLMModel);
  const [voicesList, setVoices] = useState<any[]>([]);

  useEffect(() => {
    const initialVoices = Object.entries(voices).filter(([key, value]) => value.ttsProvider === provider).map(([key, value]) => ({
      ...value,
      model: key,
    }));
    setVoices(initialVoices);
  }, [provider]);

  const { toast } = useToast();
  const { dispatch } = useContext(DeepgramContext);

  const saveAndClose = () => {
    dispatch({
      type: 'SET_TTS_OPTIONS',
      payload: { model, provider }
    });
    dispatch({
      type: 'SET_LLM',
      payload: llmModel
    });
    toast("Options saved.");
    onClose();
  };

  return (
        <>
          <div className="flex items-center gap-2.5 text-sm">
            <span className="bg-gradient-to-r to-[#13EF93]/50 from-[#149AFB]/80 rounded-full flex">
              <a
                className={`relative m-px bg-black w-[9.25rem] md:w-10 h-10 rounded-full text-sm p-2.5 group hover:w-[9.25rem] transition-all ease-in-out duration-1000 overflow-hidden whitespace-nowrap`}
                href="#"
                onClick={onOpen}
              >
                <CogIcon className="w-5 h-5 transition-transform ease-in-out duration-2000 group-hover:rotate-180" />
                <span className="ml-2.5 text-xs">Change settings</span>
              </a>
            </span>
            <span className="hidden md:inline-block text-white/50 font-inter">
              Voice:{" "}
              <span className="text-white">
                {voiceMap(state.ttsOptions?.model as string).name}
              </span>
            </span>
          </div>
          <Modal isOpen={isOpen} onClose={onClose} backdrop="blur">
      <ModalContent>
        <ModalHeader>Settings</ModalHeader>
        <ModalBody>
          {/* <LLMModelSelection llmModel={llmModel} setLLMModel={setLLMModel} /> */}
          <ProviderSelection provider={provider} setProvider={setProvider} setVoices={setVoices} />
          <ModelSelection model={model} setModel={setModel} voices={voicesList} />
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={saveAndClose}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
        </>
      );
    };



