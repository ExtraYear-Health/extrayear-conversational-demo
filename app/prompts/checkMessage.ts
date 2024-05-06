export const checkMessagePromptContent = (patientResponse, previousAssistantPrompt, nextInstruction, falseInstruction) => { const content = 
  `Follow the instructions below to determine if my response is appropriate for the previous prompt. Output all of your answers to the steps below. Do not output the steps again.
  1. Extract the question(s) from the previous prompt.
  2. Is my response relevant to the question(s) in the previous prompt. Give a score from 0 to 100.
  3. Is my response an accurate response to the question(s) in the previous prompt. Give a score from 0 to 100.
  4. Is my response a complete response to the question(s) in the previous prompt. Give a score from 0 to 100.
  5. Is the context of my response in the realm of the question(s) in the previous prompt's context. Give a score from 0 to 100.
  6. Output my total score from the three questions above by adding all of the scores together. Here is an example score 20+40+0+50=110.
     
  This is the my response: <response> ${patientResponse} </response>
  This is the previous prompt: ${previousAssistantPrompt}
  
  If my score is greater than five, follow these instructions. Here is an example of scoring, my score equals 20. 20 is greater than 5. Then follow these instructions.
  1. Output this XML tag <checkBoolean>true</checkBoolean>
  2. Output a reply to my response in this XML tag <reply> [insert your reply here] </reply> following these instructions: ${nextInstruction}
  
  If my score is less than five, follow these instructions. Here is an example of scoring, my score equals 4. 4 is less than 5. Then follow these instructions.
  1. Output this XML tag <checkBoolean>false</checkBoolean>
  2. Output a reply to my response in this XML tag <reply> [insert your reply here] </reply> following these instructions: ${falseInstruction}
  
`
return content};