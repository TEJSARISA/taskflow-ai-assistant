import { AgentConfig } from './types';
import { z } from 'zod';

export const AGENT_CONFIGS: AgentConfig[] = [
    {
        id: 'a401b097-01d6-4ae1-818f-cb43dda0caa2',
        name: 'TaskFlow AI Assistant',
        description:
            'An expert project coordinator within a project management SaaS, designed to streamline administrative tasks by generating task lists, processing meeting transcripts for actions, and summarizing project health.',
        triggerEvents: [
            {
                name: 'project_task_generation',
                description:
                    'When a user submits a project description in the AI Assistant panel, the agent generates a structured list of initial tasks.',
                type: 'sync',
                outputSchema: z.object({ tasks: z.array(z.string()) })
            },
            {
                name: 'transcript_extraction',
                description:
                    'When a user pastes a meeting transcript, the agent analyzes the text to extract specific tasks, deadlines, and assigned team members.',
                type: 'sync',
                outputSchema: z.object({
                    tasks: z.array(z.object({ title: z.string(), deadline: z.string(), assignee: z.string() }))
                })
            },
            {
                name: 'project_summary_request',
                description:
                    'When a user requests a progress summary, the agent analyzes current task data and identifies project risks and next steps.',
                type: 'sync',
                outputSchema: z.object({
                    summary: z.string(),
                    risks: z.array(z.string()),
                    nextSteps: z.array(z.string())
                })
            }
        ],
        config: {
            appId: 'a47d2a88-c116-47a2-b4e8-58aa81f9013b',
            accountId: 'a0df5697-a5ed-442a-8799-97f3306b9cb3',
            widgetKey: 'grAw1l99hLU9xvaX6OlJk95tZsAZlhyGHqPaFRu9'
        }
    }
];
