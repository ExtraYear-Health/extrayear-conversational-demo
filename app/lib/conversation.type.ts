export enum MessageType {
  TRANSCRIPT = 'transcript',
  FUNCTION_CALL = 'function-call',
  FUNCTION_CALL_RESULT = 'function-call-result',
  ADD_MESSAGE = 'add-message',
  CONVERSATION_UPDATE = 'conversation-update',
  MODEL_OUTPUT = 'model-output',
}

export enum MessageRole {
  USER = 'user',
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
}

export enum TranscriptMessageType {
  PARTIAL = 'partial',
  FINAL = 'final',
}

export interface TranscriptMessage {
  type: MessageType.TRANSCRIPT;
  role: MessageRole;
  transcriptType: TranscriptMessageType;
  transcript: string;
  timestamp?: string;
}

export interface ImageMessage {
  role: MessageRole;
  timestamp?: string;
  transcript: string;
}

export interface FunctionCallMessage {
  type: MessageType.FUNCTION_CALL;
  functionCall: {
    name: string;
    parameters: any;
  };
}

export interface FunctionCallResultMessage {
  type: MessageType.FUNCTION_CALL_RESULT;
  functionCallResult: {
    forwardToClientEnabled?: boolean;
    result: any;
    [a: string]: any;
  };
}

export type Message =
  | TranscriptMessage
  | FunctionCallMessage
  | FunctionCallResultMessage;

export enum CallStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  LOADING = 'loading',
}
