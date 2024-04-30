export const checkMessagePromptContent = (patientResponse, therapistPrompt) => { const content = 
`Here is my problem: Is there a reasonable probability that this response is a good, relevant answer to the question or questions within this prompt? <response>${patientResponse}</response> <prompt>${therapistPrompt}</prompt>. 
Follow these instructions:
1. Without solving the problem just yet, think through this carefully and list systematically and in detail all  the problems that need to be solved to arrive at the correct answer.
2. From the list above, find the answer to the first step with the highest probability.
3. Now find the answer to the second step with the highest probability. 
4. Continue finding answers to each of the remaining steps with the highest probability.
5. Solve my problem. Only respond true or false for your answer to my problem.
Output your answer in this format.
<problemAnswer> Insert your answer to my problem here. Only respond true or false</problemAnswer>
<reasoning> Insert your justification for your answer based on your solutions to the instructions above here</reasoning>
Here is an example response:
<problemAnswer>false</problemAnswer>
<reasoning>
The steps to analyze are as follows:
1. Understand the nature of both the prompt and the response.
2. Determine if the response directly addresses the questions or themes introduced in the prompt.
3. Check for relevance between the response and the aim of the initial conversation initiated by the prompt.
4. Consider if another type of response would be more appropriate.
For step 1: The prompt introduces a cognitive therapy session with Devin Clark asking about hobbies or interests to better tailor the session, indicating a need for personal, engaging, and context-specific interaction.
For step 2: The response asks about the duration of the session, which, although it might be a valid question in a therapy setting, does not address any of the introduction or queries regarding hobbies or interests that the therapist aimed to discuss.
For step 3: The lack of direct relevance of the response to the inquiry about personal interests or hobbies indicates that it does not contribute effectively to the stated goal of customizing the therapy session based on individual interests or hobbies.
For step 4: A response that would have been more appropriate might include the client discussing their hobbies, interests, or anything relevant to their personal life that would help in tailoring the session, rather than querying about the logistical aspect of the session's length.
Thus, the response provided does not serve as a good and relevant answer to the prompt, leading to the conclusion that it is false.
</reasoning>
`

return content};