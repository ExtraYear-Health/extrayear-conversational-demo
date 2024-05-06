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
        maxTokens: 2000,
      }
    },
    "openai-gpt3.5-turbo": {
        llmProvider: "openai",
        llmModel: "gpt-3.5-turbo-0125",
        api: "/api/brain",
        settings: {
          temperature: 1.0,
          maxTokens: 2000,
        }
      },
      "groq-llama3-8b": {
        llmProvider: "meta",
        llmModel: "Llama3-8b-8192",
        api: "/api/groq",
        settings: {
          temperature: 1.0  ,
          maxTokens: 2048,
        }
      },
      "groq-llama3-70b": {
        llmProvider: "meta",
        llmModel: "Llama3-70b-8192",
        api: "/api/groq",
        settings: {
          temperature: 1.0,
          maxTokens: 2000,
        }
      },
      "groq-mixtral-8x7b": {
        llmProvider: "mixtral",
        llmModel: "mixtral-8x7b-32768",
        api: "/api/groq",
        settings: {
          temperature: 1.0,
          maxTokens: 2000,
        }
      },
//       "openai-gpt4": {
//         llmProvider: "openai",
//         llmModel: "/devin_clark.svg",
//       },
//       "openai-gpt4": {
//         llmProvider: "openai",
//         llmModel: "/devin_clark.svg",
//       },
//       "openai-gpt4": {
//         llmProvider: "openai",
//         llmModel: "/devin_clark.svg",
//       },
};
  
export const llmModelMap = (model: string) => {
  return llmModels[model];
};

