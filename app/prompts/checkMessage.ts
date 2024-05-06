export const checkMessagePromptContent = (patientResponse, previousAssistantPrompt, nextInstruction, falseInstruction) => { const content = 
  `Follow the instructions below to determine if my response is appropriate for the previous prompt.
  1. Is my response relevant to the question(s) in the previous prompt. Give a score from 0 to 100.
  2. Is my response an accurate response to the question(s) in the previous prompt. Give a score from 0 to 100.
  3. Is my response a complete response to the question(s) in the previous prompt. Give a score from 0 to 100.
  4. Is the context of my response in the realm of the question(s) in the previous prompt's context. Give a score from 0 to 100.
  5. Output my total score from the three questions above by adding all of the scores together. Here is an example score 20+40+0+50=110.
     
  This is the my response: <response> ${patientResponse} </response>
  This is the previous prompt: ${previousAssistantPrompt}
  
  If my score is greater than five, follow these instructions:
  1. Output this XML tag <checkBoolean>true</checkBoolean>
  2. Output a reply to my response in this XML tag <reply> [insert your reply here] </reply> following these instructions: ${nextInstruction}
  
  If my score is less than five, follow these instructions. 
  1. Output this XML tag <checkBoolean>false</checkBoolean>
  2. Output a reply to my response in this XML tag <reply> [insert your reply here] </reply> following these instructions: ${falseInstruction}
  
`
return content};