import React, { useContext, useState, useEffect, Dispatch, SetStateAction } from 'react';
import { Avatar, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from "@nextui-org/react";
import { CogIcon } from "./icons/CogIcon";
import { DeepgramContext } from "../context/Deepgram";
import { useToast } from "../context/Toast";
import { voices, voiceMap } from "../context/Voices";

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
      value={model}
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

export const Settings = () => {
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [provider, setProvider] = useState(ttsProviders[0]?.id);
  //const [voices, setVoices] = useState([]);
  const [model, setModel] = useState(undefined);
  const [voicesList, setVoices] = useState<any[]>([]);

  useEffect(() => {
    // Initialize voices based on default provider
    const initialVoices = Object.entries(voices).filter(([key, value]) => value.ttsProvider === provider).map(([key, value]) => ({
      ...value,
      model: key,
    }));
    setVoices(initialVoices);
  }, [provider]);

  const { toast } = useToast();
  const { state, dispatch } = useContext(DeepgramContext);

  const saveAndClose = () => {
    dispatch({
      type: 'SET_TTS_OPTIONS',
      payload: { model, provider }
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











// import React, { useContext, useState, Dispatch, SetStateAction } from 'react';
// import { CogIcon } from "./icons/CogIcon";
// import { Avatar, Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Select, SelectItem, useDisclosure } from "@nextui-org/react";
// import { DeepgramContext } from "../context/Deepgram";
// import { useToast } from "../context/Toast";
// import { voices, voiceMap } from "../context/Voices";

// const arrayOfVoices = Object.entries(voices).map((e) => ({
//   ...e[1],
//   model: e[0],
// }));

// // Define a type for the TTS provider.
// type TTSProvider = {
//   id: string;
//   name: string;
// };

// // Assuming voices is imported or defined in the same file
// const extractProviders = (): TTSProvider[] => {
//   const providersSet = new Set<string>();
//   Object.values(voices).forEach(voice => {
//     providersSet.add(voice.ttsProvider);
//   });
//   return Array.from(providersSet).map(provider => ({ id: provider, name: provider }));
// };

// const ttsProviders = extractProviders();

// const ProviderSelection: React.FC<{ provider: string; setProvider: React.Dispatch<React.SetStateAction<string>> }> = ({ provider, setProvider }) => {
//   return (
//     <Select
//       defaultSelectedKeys={[ttsProviders[0]?.id]}
//       selectedKeys={[provider]}
//       onSelectionChange={(keys) => setProvider(Array.from(keys)[0] as string)}
//       items={ttsProviders}
//       label="Select TTS Provider"
//       variant="bordered"
//     >
//       {(provider) => (
//         <SelectItem key={provider.id} textValue={provider.name}>
//           <div className="flex items-center gap-2">
//             <span>{provider.name}</span>
//           </div>
//         </SelectItem>
//       )}
//     </Select>
//   );
// };


// // Define the props interface. 
// interface ModelSelectionProps {
//   model: string | undefined;
//   setModel: Dispatch<SetStateAction<string | undefined>>;
// }

// //Renders a select component filled with voice options.
// const ModelSelection: React.FC<ModelSelectionProps> = ({ model, setModel }) => {
//   return (
//     <Select
//       defaultSelectedKeys={["aura-model-asteria"]}
//       selectedKeys={model ? [model] : []}  // Ensure only defined models are used
//       onSelectionChange={(keys: any) =>
//         setModel(keys.entries().next().value[0])
//       }
//       items={arrayOfVoices}
//       label="Selected voice"
//       color="default"
//       variant="bordered"
//       classNames={{
//         label: "group-data-[filled=true]:-translate-y-5",
//         trigger: "min-h-unit-16",
//         listboxWrapper: "max-h-[400px]",
//       }}
//       listboxProps={{
//         itemClasses: {
//           base: [
//             "rounded-md",
//             "text-default-500",
//             "transition-opacity",
//             "data-[hover=true]:text-foreground",
//             "data-[hover=true]:bg-default-100",
//             "data-[hover=true]:bg-default-50",
//             "data-[selectable=true]:focus:bg-default-50",
//             "data-[pressed=true]:opacity-70",
//             "data-[focus-visible=true]:ring-default-500",
//           ],
//         },
//       }}
      
//       popoverProps={{
//         classNames: {
//           base: "before:bg-default-200",
//           content: "p-0 border-small border-divider bg-background",
//         },
//       }}
      
//       //Uses renderValue to customize the display of the selected item in the dropdown.
//       renderValue={(items) => {
//         return items.map((item) => (
//           <div key={item.key} className="flex items-center gap-2">
//             <Avatar
//               alt={item.data?.name}
//               className="flex-shrink-0"
//               size="sm"
//               src={item.data?.avatar}
//             />
//             <div className="flex flex-col">
//               <span>{item.data?.name}</span>
//               <span className="text-default-500 text-tiny">
//                 ({item.data?.model} - {item.data?.language} {item.data?.accent})
//               </span>
//             </div>
//           </div>
//         ));
//       }}
//     >
//       {(model) => (
//         <SelectItem key={model.model} textValue={model.model} color="default">
//           <div className="flex gap-2 items-center">
//             <Avatar
//               alt={model.name}
//               className="flex-shrink-0"
//               size="sm"
//               src={model.avatar}
//             />
//             <div className="flex flex-col">
//               <span className="text-small">{model.name}</span>
//               <span className="text-tiny text-default-400">
//                 {model.model} - {model.language} {model.accent}
//               </span>
//             </div>
//           </div>
//         </SelectItem>
//       )}
//     </Select>
//   );
// };

// export const Settings = () => {
//   const { state, dispatch } = useContext(DeepgramContext);
//   const { ttsOptions } = state;
//   const { toast } = useToast();
//   const { isOpen, onOpen, onOpenChange } = useDisclosure();
//   const [model, setModel] = useState<string | undefined>(undefined);  // Allowing `undefined` explicitly
//   //const [provider, setProvider] = useState<string>(ttsProviders[0]?.id);
//   const [provider, setProvider] = useState('defaultProvider');
//   const [voices, setVoices] = useState(allVoices); // Initialize with all voices or filtered based on default provider
//   const [selectedVoice, setSelectedVoice] = useState('');


//   const saveAndClose = (onClose: () => void) => {
//     dispatch({
//       type: 'SET_TTS_OPTIONS',
//       payload: { ...ttsOptions, model, provider }
//     });
//     toast("Options saved.");
//     onClose();
//   };

//   return (
//     <>
//       <div className="flex items-center gap-2.5 text-sm">
//         <span className="bg-gradient-to-r to-[#13EF93]/50 from-[#149AFB]/80 rounded-full flex">
//           <a
//             className={`relative m-px bg-black w-[9.25rem] md:w-10 h-10 rounded-full text-sm p-2.5 group hover:w-[9.25rem] transition-all ease-in-out duration-1000 overflow-hidden whitespace-nowrap`}
//             href="#"
//             onClick={onOpen}
//           >
//             <CogIcon className="w-5 h-5 transition-transform ease-in-out duration-2000 group-hover:rotate-180" />
//             <span className="ml-2.5 text-xs">Change settings</span>
//           </a>
//         </span>
//         <span className="hidden md:inline-block text-white/50 font-inter">
//           Voice:{" "}
//           <span className="text-white">
//             {voiceMap(ttsOptions?.model as string).name}
//           </span>
//         </span>
//       </div>
//       <Modal
//         isOpen={isOpen}
//         onOpenChange={onOpenChange}
//         backdrop="blur"
//         className="glass"
//       >
//     <ModalContent>
//       {onClose => (
//         <>
//           <ModalHeader className="flex flex-col gap-1">
//             Settings
//           </ModalHeader>
//           <ModalBody>
//             <h2>Text-to-Speech Settings</h2>
//             <ProviderSelection provider={provider} setProvider={setProvider} />
//             <ModelSelection model={model} setModel={setModel} />
//           </ModalBody>
//           <ModalFooter>
//             <Button color="primary" onPress={() => saveAndClose(onClose)}>
//               Save
//             </Button>
//           </ModalFooter>
//         </>
//       )}
//     </ModalContent>
//       </Modal>
//     </>
//   );
// };

// // <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>;
