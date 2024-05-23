export type TtsApiOptions = {
  text: string;
  model: string;
  voiceId: string;
  referrerUrl?: string;
};

export type TtsApi = (options: TtsApiOptions) => Promise<Response>;
