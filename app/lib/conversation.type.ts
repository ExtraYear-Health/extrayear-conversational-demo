export enum MessageTypeEnum {
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
  type: MessageTypeEnum.TRANSCRIPT;
  role: MessageRole;
  transcriptType: TranscriptMessageType;
  transcript: string;
  timestamp?: string;
}

export interface FunctionCallMessage {
  type: MessageTypeEnum.FUNCTION_CALL;
  functionCall: {
    name: string;
    parameters: any;
  };
}

export interface FunctionCallResultMessage {
  type: MessageTypeEnum.FUNCTION_CALL_RESULT;
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

export interface Call {
  /** This is the type of call. */
  type?: 'inboundPhoneCall' | 'outboundPhoneCall' | 'webCall';
  /**
     * This is the provider of the call.
     *
     * Only relevant for `outboundPhoneCall` and `inboundPhoneCall` type.
     */
  phoneCallProvider?: 'twilio' | 'vonage';
  /**
     * This is the transport of the phone call.
     *
     * Only relevant for `outboundPhoneCall` and `inboundPhoneCall` type.
     */
  phoneCallTransport?: 'sip' | 'pstn';
  /** This is the status of the call. */
  status?: 'queued' | 'ringing' | 'in-progress' | 'forwarding' | 'ended';
  /** This is the explanation for how the call ended. */
  endedReason?: 'assistant-error' | 'assistant-not-found' | 'db-error' | 'no-server-available' | 'pipeline-error-extra-function-failed' | 'pipeline-error-first-message-failed' | 'pipeline-error-function-filler-failed' | 'pipeline-error-function-failed' | 'pipeline-error-openai-llm-failed' | 'pipeline-error-azure-openai-llm-failed' | 'pipeline-error-together-ai-llm-failed' | 'pipeline-error-anyscale-llm-failed' | 'pipeline-error-openrouter-llm-failed' | 'pipeline-error-perplexity-ai-llm-failed' | 'pipeline-error-deepinfra-llm-failed' | 'pipeline-error-runpod-llm-failed' | 'pipeline-error-groq-llm-failed' | 'pipeline-error-anthropic-llm-failed' | 'pipeline-error-openai-voice-failed' | 'pipeline-error-deepgram-transcriber-failed' | 'pipeline-error-deepgram-voice-failed' | 'pipeline-error-eleven-labs-voice-failed' | 'pipeline-error-eleven-labs-voice-not-found' | 'pipeline-error-eleven-labs-quota-exceeded' | 'pipeline-error-playht-voice-failed' | 'pipeline-error-lmnt-voice-failed' | 'pipeline-error-azure-voice-failed' | 'pipeline-error-rime-ai-voice-failed' | 'pipeline-error-neets-voice-failed' | 'pipeline-no-available-llm-model' | 'server-shutdown' | 'twilio-failed-to-connect-call' | 'unknown-error' | 'vonage-disconnected' | 'vonage-failed-to-connect-call' | 'phone-call-provider-bypass-enabled-but-no-call-received' | 'vapi-error-phone-call-worker-setup-socket-error' | 'vapi-error-phone-call-worker-worker-setup-socket-timeout' | 'vapi-error-phone-call-worker-could-not-find-call' | 'vapi-error-phone-call-worker-call-never-connected' | 'vapi-error-web-call-worker-setup-failed' | 'assistant-not-invalid' | 'assistant-not-provided' | 'assistant-request-returned-error' | 'assistant-request-returned-invalid-assistant' | 'assistant-request-returned-no-assistant' | 'assistant-request-returned-forwarding-phone-number' | 'assistant-ended-call' | 'assistant-said-end-call-phrase' | 'assistant-forwarded-call' | 'assistant-join-timed-out' | 'customer-busy' | 'customer-ended-call' | 'customer-did-not-answer' | 'customer-did-not-give-microphone-permission' | 'exceeded-max-duration' | 'manually-canceled' | 'phone-call-provider-closed-websocket' | 'pipeline-error-custom-llm-llm-failed' | 'silence-timed-out' | 'voicemail' | 'vonage-rejected';
  /**
     * This is the maximum number of seconds that the call will last. When the call reaches this duration, it will be ended.
     * @min 10
     * @max 3600
     * @example 1800
     */
  maxDurationSeconds?: number;
  /** This is the unique identifier for the call. */
  id: string;
  /** This is the unique identifier for the org that this call belongs to. */
  orgId: string;
  /**
     * This is the ISO 8601 date-time string of when the call was created.
     * @format date-time
     */
  createdAt: string;
  /**
     * This is the ISO 8601 date-time string of when the call was last updated.
     * @format date-time
     */
  updatedAt: string;
  /**
     * This is the ISO 8601 date-time string of when the call was started.
     * @format date-time
     */
  startedAt?: string;
  /**
     * This is the ISO 8601 date-time string of when the call was ended.
     * @format date-time
     */
  endedAt?: string;
  /** This is the cost of the call in USD. */
  cost?: number;
  /** This is the transcript of the call. */
  transcript?: string;
  /** This is the URL of the recording of the call. */
  recordingUrl?: string;
  /** This is the URL of the recording of the call in two channels. */
  stereoRecordingUrl?: string;
  /** This is the summary of the call. */
  summary?: string;
  /** These are the messages that were spoken during the call. */
  messages?: object[];
  /**
     * The ID of the call as provided by the phone number service. callSid in Twilio. conversationUuid in Vonage.
     *
     * Only relevant for `outboundPhoneCall` and `inboundPhoneCall` type.
     */
  phoneCallProviderId?: string;
  /**
     * If enabled, prevents Vapi from initiating calls directly. Defaults to disabled.
     * Suitable for external call handling, such as with Twilio Studio Flow, with integration details provided in `phoneCallProviderDetails`.
     *
     * Only relevant for `outboundPhoneCall` and `inboundPhoneCall` types.
     */
  phoneCallProviderBypassEnabled?: boolean;

  webCallUrl?: string;
  /**
     * This is the SIP URI of the call that the assistant will join.
     *
     * Only relevant for `webCall` type.
     */
  webCallSipUri?: string;
  /** This is the phone number that the call was forwarded to. */
  forwardedPhoneNumber?: string;
  /** This is the assistant that will be used for the call. To use a transient assistant, use `assistant` instead. */
  assistantId?: string | null;

  /**
     * This is the customer that will be called. To call a transient customer , use `customer` instead.
     *
     * Only relevant for `outboundPhoneCall` and `inboundPhoneCall` type.
     */
  customerId?: string;

  /**
     * This is the phone number that will be used for the call. To use a transient number, use `phoneNumber` instead.
     *
     * Only relevant for `outboundPhoneCall` and `inboundPhoneCall` type.
     */
  phoneNumberId?: string;

  /** This is the metadata associated with the call. */
  metadata?: object;
}
