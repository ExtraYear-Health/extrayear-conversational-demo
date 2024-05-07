//prompts
import { articleConversationContent } from "../prompts/articleConversation";
import { voyager1ConversationContent } from "../prompts/voyager1Conversation";
import { newsArticleConversationContent } from "../prompts/newsArticlesConversation";
import { checkMessagePromptContent } from "../prompts/checkMessage";
import { londonMarathonArticleConversation } from "../prompts/londonMarathonArticleConversation";

export interface PromptConfig {
  id: string;
  title: string;
  description: string;
  text: string;
  categories?: string[];
  sessionLength?: number;
}


export const promptData: { [key: string]: PromptConfig } = {
  "londonMarathonArticleConversation": {
    id: "londonMarathonArticleConversation",
    title: "London Marathon Article Conversation",
    description: "A conversation about an amazing achievement at the London Marathon",
    text: londonMarathonArticleConversation,
  },
  // Additional prompts can be added here
};

export const getPromptConfig = (promptId: string): PromptConfig | undefined => {
  return promptData[promptId];
};

