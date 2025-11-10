'use server';

/**
 * @fileOverview AI agent to suggest next steps for a caregiver based on the patient's condition and assigned tasks.
 *
 * - suggestNextSteps - A function that suggests next steps.
 * - SuggestNextStepsInput - The input type for the suggestNextSteps function.
 * - SuggestNextStepsOutput - The return type for the suggestNextSteps function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNextStepsInputSchema = z.object({
  patientHealthCondition: z
    .string()
    .describe('The current health condition of the patient.'),
  assignedTasks: z.array(z.string()).describe('The list of tasks already assigned to the caregiver for the patient.'),
});
export type SuggestNextStepsInput = z.infer<typeof SuggestNextStepsInputSchema>;

const SuggestNextStepsOutputSchema = z.object({
  suggestedTasks: z
    .array(z.string())
    .describe('A list of suggested next tasks for the caregiver to perform for the patient.'),
  reasoning: z.string().describe('The AI reasoning behind the suggested tasks.'),
});
export type SuggestNextStepsOutput = z.infer<typeof SuggestNextStepsOutputSchema>;

export async function suggestNextSteps(input: SuggestNextStepsInput): Promise<SuggestNextStepsOutput> {
  return suggestNextStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestNextStepsPrompt',
  input: {schema: SuggestNextStepsInputSchema},
  output: {schema: SuggestNextStepsOutputSchema},
  prompt: `You are an AI assistant that helps caregivers provide comprehensive care for their patients.

  Based on the patient's current health condition and the tasks already assigned, suggest possible next tasks for the caregiver to perform.

  Patient's Health Condition: {{{patientHealthCondition}}}
  Assigned Tasks: {{#each assignedTasks}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}

  Consider the patient's health condition and assigned tasks when suggesting next steps.
  Explain your reasoning for the suggested tasks.

  Format your response as a JSON object with "suggestedTasks" (array of strings) and "reasoning" (string) fields.
  `,
});

const suggestNextStepsFlow = ai.defineFlow(
  {
    name: 'suggestNextStepsFlow',
    inputSchema: SuggestNextStepsInputSchema,
    outputSchema: SuggestNextStepsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
