import { Call } from '@vapi-ai/web/dist/api';

import MessageType from './MessageType';

type FunctionCallMessage<Parameters = unknown> = {
  type: MessageType.FUNCTION_CALL;
  call?: Call;
  functionCall: {
    name: string;
    parameters: Parameters;
  };
};

export default FunctionCallMessage;
