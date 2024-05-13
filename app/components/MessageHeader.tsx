import { Message } from 'ai/react';
import moment from 'moment';

import { useMessageData } from '../context/MessageMetadata';
import { useAudioStore } from '../context/AudioStore';

const MessageHeader = ({
  message,
}: {
  message: Message;
}) => {
  const { audioStore } = useAudioStore();
  const { messageData } = useMessageData();

  const foundAudio = audioStore.findLast((item) => item.id === message.id);
  const foundData = messageData.findLast((item) => item.id === message.id);

  if (message.role === 'assistant') {
    return (
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <span className="text-xs font-normal text-gray-400">
          {moment().calendar()}
        </span>
      </div>
    );
  }
};

export { MessageHeader };
