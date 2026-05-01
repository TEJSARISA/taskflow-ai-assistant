import { Context } from 'hono';
import { Llm, LlmProvider } from '@uptiqai/integrations-sdk';
import { AgentClient } from '@21st-sdk/node';
import catchAsync from '../utils/catchAsync.ts';
import ApiError from '../utils/ApiError.ts';
import prisma from '../client.ts';

const hasValue = (value?: string) => typeof value === 'string' && value.trim().length > 0;

const isPlaceholder = (value?: string) => {
  if (!hasValue(value)) return true;
  const lowered = value!.toLowerCase();
  return (
    lowered.includes('your_') ||
    lowered.includes('_here') ||
    lowered.includes('example.com') ||
    lowered.includes('password') ||
    lowered.includes('sk_test_') ||
    lowered.includes('whsec_') ||
    lowered.includes('re_123456789')
  );
};

const shouldUseFallbackAi = () => {
  if (process.env.AI_FALLBACK_MODE === 'false') return false;
  return !hasValue(process.env.INFRA_PROVIDER) || isPlaceholder(process.env.INFRA_PROVIDER);
};

const getLlm = () => {
  const provider = (process.env.LLM_PROVIDER || 'Google') as LlmProvider;
  return new Llm({ provider });
};

const fallbackTaskList = (seed: string) => {
  const trimmed = seed?.trim();
  if (!trimmed) {
    return ['Define project goals', 'Create execution plan', 'Assign owners', 'Set checkpoints'];
  }
  return [
    `Define scope for: ${trimmed.slice(0, 50)}`,
    'Break work into actionable tasks',
    'Assign owner and due date for each task',
    'Create weekly progress review'
  ];
};

const fallbackTranscriptTasks = () => [
  {
    title: 'Share meeting notes with stakeholders',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    assignee: 'Project Manager'
  },
  {
    title: 'Finalize sprint priorities',
    deadline: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
    assignee: 'Tech Lead'
  },
  {
    title: 'Track unresolved blockers',
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
    assignee: 'Operations'
  }
];

const fallbackSummary = (projectId: string, tasks: any[]) => ({
  summary: `Project ${projectId} is in progress with ${tasks?.length || 0} active tasks.`,
  risks: ['Potential timeline slips due to dependencies', 'Scope change without priority reset'],
  nextSteps: ['Confirm owners for open tasks', 'Review deadlines with team', 'Mitigate top risks']
});

const fallbackChatReply = (messages: any[]) => {
  const latestUserMessage = Array.isArray(messages)
    ? [...messages].reverse().find(msg => msg?.role === 'user')?.content || ''
    : '';

  if (!latestUserMessage) {
    return 'Hi, I am your AI management assistant. Ask me about planning, priorities, risks, or task breakdowns.';
  }

  return [
    `For "${String(latestUserMessage).slice(0, 90)}", start with:`,
    '1. Define clear outcome',
    '2. Split into 3-5 tasks',
    '3. Assign owner and deadline',
    '4. Add one review checkpoint'
  ].join('\n');
};

const fallbackSuggestions = (tasks: any[]) => ({
  suggestions: (Array.isArray(tasks) ? tasks : []).slice(0, 10).map((task, index) => ({
    taskId: task?.id || `task-${index + 1}`,
    suggestedPriority: task?.priority || 'Medium',
    suggestedDeadline: task?.dueDate || new Date(Date.now() + 86400000 * (index + 2)).toISOString()
  }))
});

const fallbackPlan = (projectDetails: any) => ({
  phases: [
    {
      name: 'Discovery',
      tasks: ['Clarify requirements', 'Identify stakeholders', 'Define success metrics']
    },
    {
      name: 'Execution',
      tasks: ['Build prioritized backlog', 'Implement core deliverables', 'Weekly progress review']
    }
  ],
  milestones: [
    `Kickoff complete for ${projectDetails?.name || 'project'}`,
    'MVP scope approved',
    'Release readiness review complete'
  ],
  resourceAllocationSuggestions: [
    'Assign one technical owner for core scope',
    'Reserve 20% capacity for risks and blockers',
    'Track delivery metrics weekly'
  ]
});

const getTextFromLlmResult = (result: any) => {
  const primary = result?.output ?? result?.text ?? result?.data ?? '';
  if (typeof primary === 'string') return primary;
  if (typeof primary === 'object' && primary !== null) {
    if (typeof primary.content === 'string') return primary.content;
    if (Array.isArray(primary)) {
      return primary
        .map((chunk) => (typeof chunk === 'string' ? chunk : JSON.stringify(chunk)))
        .join('');
    }
    return JSON.stringify(primary);
  }
  return '';
};

const extractJson = (content: string) => {
  try {
    const startIndex = content.indexOf('{');
    const endIndex = content.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      console.error('AI Response does not contain JSON:', content);
      throw new Error('Invalid AI response format');
    }
    
    const jsonString = content.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('AI Parsing Error:', error);
    throw new ApiError(500, 'Failed to parse AI response');
  }
};

export const createToken = catchAsync(async (c: Context) => {
  const { agent } = await c.req.json();
  const apiKey = process.env.API_KEY_21ST;
  
  if (!apiKey) {
    console.error('API_KEY_21ST not found in environment');
    throw new ApiError(500, 'AI Service configuration error');
  }

  const client = new AgentClient({ apiKey });
  const token = await client.tokens.create({ agent });
  
  return c.json(token);
});

export const generateTasks = catchAsync(async (c: Context) => {
  const { projectDescription } = await c.req.json();
  if (!projectDescription) throw new ApiError(400, 'Project description is required');

  if (shouldUseFallbackAi()) {
    return c.json({ tasks: fallbackTaskList(projectDescription) });
  }

  try {
    const llm = getLlm();
    const aiPrompt = `You are an expert project manager. Based on the following project description, generate a list of at least 5-10 actionable tasks.
    Project Description: ${projectDescription}
    
    Return ONLY a JSON object with a "tasks" property which is an array of strings (the task titles). No extra text.`;

    const result = await llm.generateText({
      messages: [{ role: 'user', content: aiPrompt }],
      model: process.env.LLM_MODEL
    });

    const content = getTextFromLlmResult(result);
    return c.json(extractJson(content));
  } catch (error) {
    console.error('generateTasks failed, using fallback:', error);
    return c.json({ tasks: fallbackTaskList(projectDescription) });
  }
});

export const extractTasks = catchAsync(async (c: Context) => {
  const { transcript } = await c.req.json();
  if (!transcript) throw new ApiError(400, 'Transcript is required');

  if (shouldUseFallbackAi()) {
    return c.json({ tasks: fallbackTranscriptTasks() });
  }

  try {
    const llm = getLlm();
    const aiPrompt = `Analyze the following meeting transcript and extract tasks, deadlines, and assignees.
    Transcript: ${transcript}
    
    Return ONLY a JSON object with a "tasks" property which is an array of objects. Each object must have "title", "deadline" (ISO date or relative like "2026-03-20"), and "assignee" (name). No extra text.`;

    const result = await llm.generateText({
      messages: [{ role: 'user', content: aiPrompt }],
      model: process.env.LLM_MODEL
    });

    const content = getTextFromLlmResult(result);
    return c.json(extractJson(content));
  } catch (error) {
    console.error('extractTasks failed, using fallback:', error);
    return c.json({ tasks: fallbackTranscriptTasks() });
  }
});

export const getProjectSummary = catchAsync(async (c: Context) => {
  const { projectId, tasks: providedTasks } = await c.req.json();
  if (!projectId) throw new ApiError(400, 'Project ID is required');

  let tasks = providedTasks;
  if (!tasks || tasks.length === 0) {
    tasks = await prisma.task.findMany({
      where: { projectId, isDeleted: false }
    });
  }
  
  if (shouldUseFallbackAi()) {
    return c.json(fallbackSummary(projectId, tasks));
  }

  try {
    const llm = getLlm();
    const aiPrompt = `Summarize the following project and its tasks. Identify risks and suggest next steps.
    Project ID: ${projectId}
    Tasks: ${JSON.stringify(tasks)}
    
    Return ONLY a JSON object with "summary" (string), "risks" (array of strings), and "nextSteps" (array of strings). No extra text.`;

    const result = await llm.generateText({
      messages: [{ role: 'user', content: aiPrompt }],
      model: process.env.LLM_MODEL
    });

    const content = getTextFromLlmResult(result);
    return c.json(extractJson(content));
  } catch (error) {
    console.error('getProjectSummary failed, using fallback:', error);
    return c.json(fallbackSummary(projectId, tasks));
  }
});

export const chat = catchAsync(async (c: Context) => {
  const { messages } = await c.req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ApiError(400, 'Messages are required');
  }

  if (shouldUseFallbackAi()) {
    return c.json({ content: fallbackChatReply(messages) });
  }

  try {
    const llm = getLlm();
    const result = await llm.generateText({
      messages,
      model: process.env.LLM_MODEL
    });

    const content = getTextFromLlmResult(result).trim();
    if (!content) {
      return c.json({ content: fallbackChatReply(messages) });
    }
    return c.json({ content });
  } catch (error) {
    console.error('chat failed, using fallback:', error);
    return c.json({ content: fallbackChatReply(messages) });
  }
});

export const suggestTasks = catchAsync(async (c: Context) => {
  const { tasks } = await c.req.json();
  if (!tasks || tasks.length === 0) throw new ApiError(400, 'Tasks are required');

  if (shouldUseFallbackAi()) {
    return c.json(fallbackSuggestions(tasks));
  }

  try {
    const llm = getLlm();
    const aiPrompt = `Analyze the following tasks and suggest priorities (Low, Medium, High) and realistic deadlines based on the workload and complexity.
    Tasks: ${JSON.stringify(tasks)}
    
    Return ONLY a JSON object with a "suggestions" property which is an array of objects. Each object must have "taskId", "suggestedPriority", and "suggestedDeadline" (ISO date). No extra text.`;

    const result = await llm.generateText({
      messages: [{ role: 'user', content: aiPrompt }],
      model: process.env.LLM_MODEL
    });

    const content = getTextFromLlmResult(result);
    return c.json(extractJson(content));
  } catch (error) {
    console.error('suggestTasks failed, using fallback:', error);
    return c.json(fallbackSuggestions(tasks));
  }
});

export const generateProjectPlan = catchAsync(async (c: Context) => {
  const { projectDetails } = await c.req.json();
  if (!projectDetails) throw new ApiError(400, 'Project details are required');

  if (shouldUseFallbackAi()) {
    return c.json(fallbackPlan(projectDetails));
  }

  try {
    const llm = getLlm();
    const aiPrompt = `Act as a senior project consultant. Create a detailed project plan based on the following details.
    Project Details: ${JSON.stringify(projectDetails)}
    
    Return ONLY a JSON object with "phases" (array of objects with "name" and "tasks"), "milestones" (array of strings), and "resourceAllocationSuggestions" (array of strings). No extra text.`;

    const result = await llm.generateText({
      messages: [{ role: 'user', content: aiPrompt }],
      model: process.env.LLM_MODEL
    });

    const content = getTextFromLlmResult(result);
    return c.json(extractJson(content));
  } catch (error) {
    console.error('generateProjectPlan failed, using fallback:', error);
    return c.json(fallbackPlan(projectDetails));
  }
});
