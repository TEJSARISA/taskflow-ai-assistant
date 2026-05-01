import { emitter } from '@/agentSdk';
import { AGENT_CONFIGS } from '@/agentSdk/agents';
import { api } from '@/lib/api';

const agentId = AGENT_CONFIGS[0].id;
const isMockMode = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const fallbackTaskList = (seed: string) => {
    const trimmed = seed?.trim();
    if (!trimmed) {
        return ['Define goals', 'Create implementation plan', 'Assign owners', 'Set milestones'];
    }
    return [
        `Define scope for: ${trimmed.slice(0, 40)}`,
        'Break work into actionable tasks',
        'Assign owners and due dates',
        'Schedule review checkpoint'
    ];
};

const fallbackTranscriptTasks = () => [
    {
        title: 'Share meeting notes with team',
        deadline: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        assignee: 'Project Manager'
    },
    {
        title: 'Finalize next sprint priorities',
        deadline: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
        assignee: 'Tech Lead'
    },
    {
        title: 'Prepare follow-up action tracker',
        deadline: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
        assignee: 'Operations'
    }
];

type ChatMessage = {
    role: string;
    content: string;
};

const normalizeChatMessages = (messages: any[]): ChatMessage[] => {
    if (!Array.isArray(messages)) return [];
    return messages
        .map(msg => ({
            role: typeof msg?.role === 'string' ? msg.role : 'user',
            content: typeof msg?.content === 'string' ? msg.content.trim() : ''
        }))
        .filter(msg => msg.content.length > 0);
};

const getLatestUserMessage = (messages: ChatMessage[]) => {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') return messages[i].content;
    }
    return '';
};

const extractSseContent = (ssePayload: string) => {
    const lines = ssePayload.split('\n');
    const chunks: string[] = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;

        try {
            const parsed = JSON.parse(data);
            const choiceText =
                parsed?.choices?.[0]?.delta?.content ||
                parsed?.choices?.[0]?.message?.content ||
                parsed?.content ||
                parsed?.text;
            if (typeof choiceText === 'string') {
                chunks.push(choiceText);
            }
        } catch {
            chunks.push(data);
        }
    }

    return chunks.join('').trim();
};

const normalizeChatResponseContent = (payload: any) => {
    if (!payload) return '';

    if (typeof payload === 'string') {
        const trimmed = payload.trim();
        if (!trimmed) return '';
        if (trimmed.includes('\ndata:') || trimmed.startsWith('data:')) {
            return extractSseContent(trimmed);
        }
        return trimmed;
    }

    const direct =
        payload?.content ||
        payload?.message ||
        payload?.output ||
        payload?.text ||
        payload?.data?.content ||
        payload?.data?.text;

    if (typeof direct === 'string' && direct.trim()) {
        return direct.trim();
    }

    const choiceText = payload?.choices?.[0]?.message?.content || payload?.choices?.[0]?.delta?.content;
    if (typeof choiceText === 'string' && choiceText.trim()) {
        return choiceText.trim();
    }

    return '';
};

const buildLocalChatFallback = (messages: ChatMessage[]) => {
    const latest = getLatestUserMessage(messages);
    if (!latest) {
        return 'Hi, I am your AI management assistant. Ask me about planning, priorities, risks, or meeting action items.';
    }

    const normalized = latest.toLowerCase();
    const shortTopic = latest.slice(0, 90);
    const isGreetingOnly = /^(hi|hello|hey|hlo|hola)\b[\s!.?]*$/i.test(latest.trim());

    if (isGreetingOnly) {
        return [
            'Hi, I am ready to help.',
            '',
            'Share one project goal and I will return:',
            '1. Top 3 tasks',
            '2. Suggested owner for each task',
            '3. Practical timeline'
        ].join('\n');
    }

    if (/(image|logo|poster|banner|thumbnail|illustration)/i.test(normalized)) {
        return [
            `For "${shortTopic}", use this prompt format for image tools:`,
            `"Create a high-quality concept image for ${shortTopic}. Include clear focal subject, realistic lighting, clean background, and modern color palette. 16:9 composition."`,
            '',
            'Then define these 3 constraints:',
            '1. Style (realistic, 3D, flat, cinematic)',
            '2. Brand colors',
            '3. Use case (website hero, ad, social post)'
        ].join('\n');
    }

    if (/(risk|issue|blocker|delay|problem)/i.test(normalized)) {
        return [
            `Risk plan for "${shortTopic}":`,
            '1. State the risk in one line',
            '2. Add impact (Low/Medium/High) and probability',
            '3. Assign one owner and one mitigation deadline',
            '4. Define trigger signal and escalation path'
        ].join('\n');
    }

    if (/(priority|prioritize|urgent|important)/i.test(normalized)) {
        return [
            `Priority framework for "${shortTopic}":`,
            '1. Mark Urgent + Important first',
            '2. Keep max 3 high-priority tasks per person',
            '3. Defer tasks without owner or deadline',
            '4. Review priorities daily for 10 minutes'
        ].join('\n');
    }

    if (/(meeting|transcript|minutes|notes)/i.test(normalized)) {
        return [
            `From "${shortTopic}", capture this structure:`,
            '1. Decision taken',
            '2. Action item',
            '3. Owner',
            '4. Deadline',
            '5. Dependency'
        ].join('\n');
    }

    return [
        `Action plan for "${shortTopic}":`,
        '1. Define the expected outcome',
        '2. Break it into 3-5 tasks',
        '3. Assign owner and due date for each task',
        '4. Set one review checkpoint this week'
    ].join('\n');
};

const forceLiveChat = import.meta.env.VITE_FORCE_LIVE_CHAT === 'true';
const shouldUseLiveChat = !isMockMode || forceLiveChat;

export const aiService = {
    generateTasks: async (projectDescription: string, uid: string) => {
        if (isMockMode) {
            return { tasks: fallbackTaskList(projectDescription) };
        }
        try {
            const res = await emitter.emit({
                agentId,
                event: 'project_task_generation',
                payload: { projectDescription },
                uid
            });
            if (res && Array.isArray((res as any).tasks)) return res;
        } catch (error) {
            console.error('generateTasks failed, using fallback:', error);
        }
        return { tasks: fallbackTaskList(projectDescription) };
    },

    extractTasksFromTranscript: async (transcript: string, uid: string) => {
        if (isMockMode) {
            return { tasks: fallbackTranscriptTasks() };
        }
        try {
            const res = await emitter.emit({
                agentId,
                event: 'transcript_extraction',
                payload: { transcript },
                uid
            });
            if (res && Array.isArray((res as any).tasks)) return res;
        } catch (error) {
            console.error('extractTasksFromTranscript failed, using fallback:', error);
        }
        return { tasks: fallbackTranscriptTasks() };
    },

    getProjectSummary: async (projectId: string, tasks: any[], uid: string) => {
        if (isMockMode) {
            return {
                summary: `Project ${projectId} is progressing with ${tasks?.length || 0} tracked tasks.`,
                risks: ['Potential delay in dependencies', 'Scope expansion without reprioritization'],
                nextSteps: [
                    'Confirm owners for open items',
                    'Review timeline with stakeholders',
                    'Set risk mitigation tasks'
                ]
            };
        }
        try {
            const res = await emitter.emit({
                agentId,
                event: 'project_summary_request',
                payload: { projectId, tasks },
                uid
            });
            if (res && (res as any).summary) return res;
        } catch (error) {
            console.error('getProjectSummary failed, using fallback:', error);
        }
        return {
            summary: `Project ${projectId} is active. AI service fallback provided this summary.`,
            risks: ['Could not fetch live AI risk analysis'],
            nextSteps: ['Retry AI analysis', 'Validate backend AI endpoint configuration']
        };
    },

    chat: async (messages: any[]) => {
        const normalizedMessages = normalizeChatMessages(messages);

        if (shouldUseLiveChat) {
            try {
                const res = await api.post('/ai/chat', { messages: normalizedMessages });
                const content = normalizeChatResponseContent(res.data);
                if (content) return { content };
            } catch (error) {
                console.error('chat failed, using local assistant fallback:', error);
            }
        }

        return { content: buildLocalChatFallback(normalizedMessages) };
    },

    suggestTasks: async (tasks: any[]) => {
        if (isMockMode) {
            return {
                suggestions: tasks.slice(0, 3).map(t => ({
                    ...t,
                    suggestedPriority: 'High',
                    suggestedDeadline: new Date(Date.now() + 86400000 * 3).toISOString()
                }))
            };
        }
        const res = await api.post('/ai/suggest-tasks', { tasks });
        return res.data;
    },

    generateProjectPlan: async (projectDetails: any) => {
        if (isMockMode) {
            return {
                phases: [
                    { name: 'Initial Research', tasks: ['Market Analysis', 'Competitor Review'] },
                    { name: 'Planning', tasks: ['Define MVP scope', 'Architecture design'] }
                ]
            };
        }
        const res = await api.post('/ai/generate-project-plan', { projectDetails });
        return res.data;
    },

    enhanceDescription: async (description: string) => {
        if (isMockMode) {
            return {
                enhancedDescription:
                    description +
                    '\n\n(AI Enhanced): This objective has been cross-referenced with project goals to ensure maximum operational efficiency and alignment with strategic KPIs.'
            };
        }
        const res = await api.post('/ai/chat', {
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an expert project manager. Enhance the following task description to be more professional, clear, and actionable. Keep it concise.'
                },
                { role: 'user', content: description }
            ]
        });
        return { enhancedDescription: res.data.content };
    },

    analyzeComplexity: async (task: any) => {
        if (isMockMode) {
            return {
                score: 7,
                reasoning:
                    'High complexity due to multiple cross-functional dependencies and potential technical debt in the target module.',
                estimatedHours: 12
            };
        }
        const res = await api.post('/ai/chat', {
            messages: [
                {
                    role: 'system',
                    content:
                        'Analyze the complexity of this task on a scale of 1-10. Return JSON with fields: score, reasoning, estimatedHours.'
                },
                { role: 'user', content: JSON.stringify(task) }
            ]
        });
        try {
            return JSON.parse(res.data.content);
        } catch (e) {
            return { score: 5, reasoning: res.data.content, estimatedHours: 8 };
        }
    },

    summarizeTranscript: async (transcript: string) => {
        if (isMockMode) {
            return {
                summary:
                    'The meeting focused on aligning project milestones for Q3. Key discussion points included resource allocation for the frontend team and the upcoming architectural review. Participants agreed on a revised timeline for the beta launch.'
            };
        }
        const res = await api.post('/ai/chat', {
            messages: [
                {
                    role: 'system',
                    content:
                        'Summarize the following meeting transcript in 2-3 sentences. Focus on high-level outcomes.'
                },
                { role: 'user', content: transcript }
            ]
        });
        return { summary: res.data.content };
    },

    getProjectInsights: async (tasks: any[]) => {
        if (isMockMode) {
            return {
                insights: [
                    "Focus on completing 'Market Analysis' as it unblocks three other streams.",
                    "Allocate more resources to 'Frontend Implementation' to meet the Q3 deadline.",
                    "Consider a mid-sprint review to address rising risks in the 'Security Audit' phase."
                ],
                healthScore: 88
            };
        }
        const res = await api.post('/ai/chat', {
            messages: [
                {
                    role: 'system',
                    content:
                        'Analyze these project tasks and provide 3 actionable strategic insights for the project manager. Return JSON with fields: insights (array of strings), healthScore (number 1-100).'
                },
                { role: 'user', content: JSON.stringify(tasks) }
            ]
        });
        try {
            return JSON.parse(res.data.content);
        } catch (e) {
            return { insights: [res.data.content], healthScore: 75 };
        }
    }
};
