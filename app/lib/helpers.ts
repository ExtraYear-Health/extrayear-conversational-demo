import { LiveTranscriptionEvent } from "@deepgram/sdk";
import { Message } from "ai/react";
import moment from "moment";
import { greetings } from "./constants";

/**
 * get the sentence from a LiveTranscriptionEvent
 * @param {LiveTranscriptionEvent} event
 * @returns {string}
 */
const utteranceText = (event: LiveTranscriptionEvent) => {
  const words = event.channel.alternatives[0].words;
  return words.map((word: any) => word.punctuated_word ?? word.word).join(" ");
};

/**
 * get user messages
 * @param {any[]} messages
 * @returns {any[]}
 */
const getUserMessages = (messages: Message[]) => {
  return messages.filter((message) => message.role === "user");
};

/**
 * get message we want to display in the chat
 * @param {any[]} messages
 * @returns {any[]}
 */
const getConversationMessages = (messages: Message[]) => {
  return messages.filter((message) => message.role !== "system");
};

const sprintf = (template: string, ...args: any[]) => {
  return template.replace(/%[sdf]/g, (match: any) => {
    const arg = args.shift();
    switch (match) {
      case "%s":
        return String(arg);
      case "%d":
        return parseInt(arg, 10).toString();
      case "%f":
        return parseFloat(arg).toString();
      default:
        return match;
    }
  });
};

function randomArrayValue(array: any[]): any {
  const key = Math.floor(Math.random() * array.length);

  return array[key];
};

function contextualGreeting(): string {
  const greeting = randomArrayValue(greetings);

  return sprintf(greeting.text, ...greeting.strings);
};

/**
 * @returns {string}
 */
function contextualHello(): string {
  const hour = moment().hour();

  if (hour > 3 && hour <= 12) {
    return "Good morning";
  } else if (hour > 12 && hour <= 15) {
    return "Good afternoon";
  } else if (hour > 15 && hour <= 20) {
    return "Good evening";
  } else if (hour > 20 || hour <= 3) {
    return "You're up late";
  } else {
    return "Hello";
  }
};

/**
 * Generate random string of alphanumerical characters.
 * 
 * @param {number} length this is the length of the string to return
 * @returns {string}
 */
function generateRandomString(length: number): string {
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    let randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
    result += randomChar;
  }

  return result;

  return 'test';
}

/**
 * Splits the input string into an array of non-empty lines.
 * 
 * @param {string} text This is the text to be split into lines.
 * @returns {string[]} Returns an array of non-empty strings, each representing a line from the input string.
 */
function promptTextArray(text: string): string[] {
  // Split the string by newline characters to create an array of lines
  // Filter out any empty lines for cleaner results
  return text.split('\n').filter(line => line.trim() !== '');
}

/**
 * Extracts content enclosed within custom <intro> tags from a given string.
 * @param {string} content The text content from which to extract the intro section.
 * @returns {string|null} The extracted intro content, or null if no intro section is found.
 */
function extractIntroContent(content: string): string | null {
  const introRegex = /<intro>(.*?)<intro\/>/s;  // Use the 's' flag for dotAll, allowing '.' to match newline characters
  const match = content.match(introRegex);
  return match ? match[1].trim() : null;  // Return the captured group if the pattern matches
};

/**
 * Extracts content enclosed within custom <response> tags from a given string.
 * @param {string} inputString The text content from which to extract the response section.
 * @returns {string|null} The extracted response content, or null if no response section is found.
 */
function extractResponseText(inputString) {
  // Regular expression to find text within <response></response> tags
  const regex = /<response>(.*?)<\/response>/;
  // Use the regex to search the input string
  const match = inputString.match(regex);
  // Check if there is a match; if so, return the first capture group
  return match ? match[1].trim() : null;
}


/**
 * Cleans an input string by removing quotes and brackets from its beginning and end, and replaces internal newlines.
 * @param {string} inputString The text content to be cleaned.
 * @returns {string} The cleaned string with quotes and brackets removed from the beginning and end, and internal newlines replaced.
 */
function cleanString(inputString: string): string {
  // Replace double newlines with a single period
  inputString = inputString.replace(/\\n\\n/g, '. ');

  // Replace any remaining single newlines with a period
  inputString = inputString.replace(/\\n/g, '. ');
  
  // First replace ":." with "."
  inputString = inputString.replace(/:\./g, '.');
  // Then replace any ".." with "."
  inputString = inputString.replace(/\.{2,}/g, '.');

  // Remove multiple quotes from the beginning of the string
  inputString = inputString.replace(/^['"]+|['"]+$/g, '');
  inputString = inputString.replace(/^[\(\)\[\]\{\}]+|[\(\)\[\]\{\}]+$/g, '');
  
  return inputString;
}


export {
  generateRandomString,
  contextualGreeting,
  contextualHello,
  getUserMessages,
  getConversationMessages,
  utteranceText,
  promptTextArray,
  extractIntroContent,
  extractResponseText,
  cleanString,
};
