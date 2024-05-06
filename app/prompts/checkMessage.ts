export const checkMessagePromptContent = (patientResponse, previousAssistantPrompt, nextInstruction, falseInstruction) => { const content = 
  `Follow the instructions below to determine if my response is appropriate for the previous prompt. Output all of your answers to the steps below. Do not output the steps again Output the boolean result in the XML tag <checkBoolean></checkBoolean>. Output your reply in the XML tag <reply></reply>.
  1. Extract the question(s) from the previous prompt.
  2. What topics are present in the question(s)?
  3. Do you need to research any of these topics to understand them better? If so, do that now.
  4. What topics are present in my response?
  5. Do you need to research any of these topics in my response to understand them better? If so do that now.
  6. Are any of the topics in my response relevant to the topics that are in the question(s) from the previous prompt? Give a score from o to 100.

  This is the my response: <response> ${patientResponse} </response>
  This is the previous prompt: ${previousAssistantPrompt}
  
  If my score is greater than five, follow these instructions. Here is an example of scoring, my score equals 20. 20 is greater than 5. Then follow these instructions.
  1. Output this XML tag <checkBoolean>true</checkBoolean>
  2. Output a reply to my response in this XML tag <reply> [insert your reply here] </reply> following these instructions (you must include the opening and closing xml tags): ${nextInstruction}
  
  If my score is less than five, follow these instructions. Here is an example of scoring, my score equals 4. 4 is less than 5. Then follow these instructions.
  1. Output this XML tag <checkBoolean>false</checkBoolean>
  2. Output a reply to my response in this XML tag <reply> [insert your reply here] </reply> following these instructions (you must include the opening and closing xml tags): ${falseInstruction}
  
`
return content};