export interface LLMModelConfig {
  llmProvider: string;
  llmModel: string;
  api: string,
  settings?: {
    temperature?: number;
    maxTokens?: number;
  };
}

export const llmModels: { [key: string]: LLMModelConfig } = {
    "openai-gpt4-turbo": {
      llmProvider: "openai",
      llmModel: "gpt-4-turbo",
      api: "/api/brain",
      settings: {
        temperature: 1.0,
        maxTokens: 2048,
      }
    },
    "openai-gpt3.5-turbo": {
        llmProvider: "openai",
        llmModel: "gpt-3.5-turbo-16k-0613",
        api: "/api/brain",
        settings: {
          temperature: 1.0,
          maxTokens: 2048,
        }
      },
      "groq-llama3-8b": {
        llmProvider: "meta",
        llmModel: "Llama3-8b-8192",
        api: "/api/groq",
        settings: {
          temperature: 1.0,
          maxTokens: 2048,
        }
      },
      "groq-llama3-70b": {
        llmProvider: "meta",
        llmModel: "Llama3-70b-8192",
        api: "/api/groq",
        settings: {
          temperature: 1.0,
          maxTokens: 2048,
        }
      },
      // "groq-mixtral-8x7b": {
      //   llmProvider: "mixtral",
      //   llmModel: "mixtral-8x7b-32768",
      //   api: "/api/groq",
      //   settings: {
      //     temperature: 1.0,
      //     maxTokens: 2048,
      //   }
      // },
      // "cluade-3-opus-20240229": {
      //   llmProvider: "Anthropic",
      //   llmModel: "claude-3-opus-20240229",
      //   api: "/api/anthropicLlm",
      //   settings: {
      //     temperature: 1.0,
      //     maxTokens: 2048,
      //   }
      // },
      // "cluade-3-sonnet-20240229": {
      //   llmProvider: "Anthropic",
      //   llmModel: "claude-3-sonnet-20240229",
      //   api: "/api/anthropicLlm",
      //   settings: {
      //     temperature: 1.0,
      //     maxTokens: 2048,
      //   }
      // },

};
  
export const llmModelMap = (model: string) => {
  return llmModels[model];
};

