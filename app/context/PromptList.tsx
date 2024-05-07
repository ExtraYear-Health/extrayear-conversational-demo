import { londonMarathonArticleConversation } from "../prompts/londonMarathonArticleConversation";

export interface PromptConfig {
  id: string;
  title: string;
  description: string;
  text: string;
  categories?: string[];
  sessionLength?: number;
}


export const prompts: { [key: string]: PromptConfig } = {
  "londonMarathonArticleConversation": {
    id: "londonMarathonArticleConversation",
    title: "London Marathon Article Conversation",
    description: "A conversation about an amazing achievement at the London Marathon",
    text: londonMarathonArticleConversation,
  },
  // Additional prompts can be added here
};

export const getPromptConfig = (promptId: string): PromptConfig | undefined => {
  return prompts[promptId];
};

