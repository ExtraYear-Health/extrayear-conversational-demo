//prompts
import { articleConversationContent } from "../prompts/articleConversation";
import { voyager1ConversationContent } from "../prompts/voyager1Conversation";
import { newsArticleConversationContent } from "../prompts/newsArticlesConversation";
import { checkMessagePromptContent } from "../prompts/checkMessage";
import { londonMarathonArticleConversation } from "../prompts/londonMarathonArticleConversation";
import { cityGuessTen } from "../prompts/cityGuessTen";
import { icebreakerFriends } from "../prompts/icebreakerFriends";
import { chooseAdverntureMysteryInLocation } from "../prompts/chooseAdverntureMysteryInLocation";
import { storyCubes01 } from "../prompts/storyCubes01";
import { movieConversation } from "../prompts/movieConversation";

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
    title: "Conversation about two articles",
    description: "A conversation about two inspirational stories",
    text: londonMarathonArticleConversation,
  },
  "cityGuess10": {
    id: "cityGuessTen",
    title: "Conversational geography game",
    description: "A conversational guessing game about cities",
    text: cityGuessTen,
  },
  "icebreakerFriends": {
    id: "icebreakerFriends",
    title: "A conversation about friends and family",
    description: "A conversational guessing game about cities",
    text: icebreakerFriends,
  },
  "chooseAdverntureMysteryInLocation": {
    id: "chooseAdverntureMysteryInLocation",
    title: "Conversational mystery novel",
    description: "A choose-your-own-adventure type mystery novel",
    text: chooseAdverntureMysteryInLocation,
  },
  "storyCubes01": {
    id: "storyCubes01",
    title: "A creative short story game",
    description: "Create short stories from a random list of items",
    text: storyCubes01,
  },
  "movieConversation": {
    id: "movieConversation",
    title: "A conversational movie trivia game",
    description: "Guess and discuss movies from your youth",
    text: movieConversation,
  },
  // Additional prompts can be added here
};

export const getPromptConfig = (promptId: string): PromptConfig | undefined => {
  return promptData[promptId];
};

