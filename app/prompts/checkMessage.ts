export const checkMessagePromptContent = (patientResponse, therapistPrompt) => { const content = 
`Here is my problem: Is the response a good answer to the prompt? Follow these instructions to arrive at the solution. Let's think step by step. 
1. What is the question or questions in the prompt? 
2. Is there information from the prompt that helps us better understand the context of the question(s)? 
3. What is the response? 
4. Is there information from the response that helps us better understand the context of the question(s)? 
5. What is the context of the response? Are there any person, places, things, or ideas mentioned in the response that we should research in order to understand if the response is a good answer to the questions in the prompt? Research these items if they exist. 
6. Given the context and the response, is the response a good answer to the question(s) in the prompt? If the response is a good answer to the question(s), respond true and stop. Otherwise proceed to the next step. 
7. Let's assume the response is attempting to answer the question. Is the response abbreviated? Can we expand this response to be a better answer to the question(s) without changing the context of the original response? If the answer is abbreviated and can be expanded to be a better answer without changing the context, then respond true. 
If either step 6 or 7 above is true, then respond true. Here is the response:
<response>${patientResponse}</response>
Here is the prompt:
<prompt>${therapistPrompt}</prompt>
Please respond in this format:
<reasoning>Insert your justification for your answer based on your solutions to the instructions above here</reasoning>
<problemAnswer>Insert your answer to my problem here. Only respond true or false</problemAnswer>
`
return content};