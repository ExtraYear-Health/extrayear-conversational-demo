//prompts
import { articleConversationContent } from "../prompts/articleConversation";
import { voyager1ConversationContent } from "../prompts/voyager1Conversation";
import { newsArticleConversationContent } from "../prompts/newsArticlesConversation";
import { checkMessagePromptContent } from "../prompts/checkMessage";
import { londonMarathonArticleConversation } from "../prompts/londonMarathonArticleConversation";
import { cityGuessTen } from "../prompts/cityGuessTen";

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
    title: "Conversation about Two Articles",
    description: "A conversation about two inspirational stories",
    text: londonMarathonArticleConversation,
  },
  "cityGuess10": {
    id: "cityGuessTen",
    title: "Conversational Geography Game",
    description: "A conversational guessing game about cities",
    text: cityGuessTen,
  },
  // Additional prompts can be added here
};

export const getPromptConfig = (promptId: string): PromptConfig | undefined => {
  return promptData[promptId];
};

