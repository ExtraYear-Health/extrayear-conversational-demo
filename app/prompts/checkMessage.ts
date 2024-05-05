export const checkMessagePromptContent = (patientResponse, nextInstruction, falseInstruction) => { const content = 
  `Here are my instructions. Follow them exactly.  Let's think step by step. 
  1. This is the my response: <response> ${patientResponse} </response>
  2. Enclose your answer to steps 3 through 13 in this xml tag <checkmessage> </checkmessage>. 
  3. Here is my problem: Is my response a good answer to the previous prompt? Follow these instructions to arrive at the solution.
  4. What is the question(s) in the previous prompt? 
  5. Is there information from the previous prompt that helps us better understand the context of the question(s)? 
  6. What is my response? 
  7. Is there information from my response that helps us better understand the context of the question(s)? 
  8. What is the context of my response? Are there any person, places, things, or ideas mentioned in the response that we should research in order to understand if the response is a good answer to the question(s) in the previous prompt? Research these items if they exist.
  9. Given the context and the response, is there a high probability that my response is a good answer to the question(s) in the previous prompt? If the response is a good answer to the question(s), respond true to my problem and skip to step 14. 
  10. If the question(s) are broad and general, does the response contain a specific or more narrowly focused answer that is still relevant to the broad and general question(s)? If yes, respond true to my problem and skip to step 14. 
  11. Let's assume the response is attempting to answer the question. Is there a high probability the response is abbreviated? Can we expand this response to be a better answer to the question(s) without changing the context of the original response? If there is a high probability that the answer is abbreviated and can be expanded to be a better answer without changing the context, respond true to my problem and skip to step 14.  
  12. Let's assume the response has too much information. If we remove the extra information is there a high probability that a complete answer or an abbreviated answer is present in my response? If the response has too much information but still contains a complete or abbreviated answer to the question(s),respond true to my problem and skip to step 14. 
  13. If either step 10, 11, 12, or 13 is true, respond true to my problem and skip to step 14. Otherwise, respond false to my problem and skip to step 15."
  14. If you responded true to my problem: output your answer to this step in this xml tag <reply></reply>. here are the instructions: ${nextInstruction}
  15. If you responded false to my problem: output your answer to this step in this xml tag <reply></reply>. here are the instructions: ${falseInstruction}
  16. if you responded true to my problem output this xml tag <checkBoolean>true</checkBoolean>
  17. if you responded false to my problem output this xml tag <checkBoolean>false</checkBoolean>
`
return content};