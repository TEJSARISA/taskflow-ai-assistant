import { User, Project, Task, Comment, Meeting } from '../types';

export const mockUsers: User[] = [
    {
        id: 'u1',
        name: 'Alex Johnson',
        email: 'alex@taskflow.ai',
        role: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=400&h=400&auto=format&fit=crop'
    },
    {
        id: 'u2',
        name: 'David Chen',
        email: 'david@taskflow.ai',
        role: 'Manager',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&h=400&auto=format&fit=crop'
    },
    {
        id: 'u3',
        name: 'Michael Ross',
        email: 'michael@taskflow.ai',
        role: 'Member',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&auto=format&fit=crop'
    },
    {
        id: 'u4',
        name: 'Taylor Smith',
        email: 'taylor@taskflow.ai',
        role: 'Member',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&h=400&auto=format&fit=crop'
    },
    {
        id: 'u5',
        name: 'Morgan Freeman',
        email: 'morgan@taskflow.ai',
        role: 'Member',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=400&auto=format&fit=crop'
    },
    {
        id: 'u6',
        name: 'Sarah Williams',
        email: 'sarah@taskflow.ai',
        role: 'Admin',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&auto=format&fit=crop'
    },
    {
        id: 'u7',
        name: 'James Wilson',
        email: 'james@taskflow.ai',
        role: 'Manager',
        avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&h=400&auto=format&fit=crop'
    },
    {
        id: 'u8',
        name: 'Elena Rodriguez',
        email: 'elena@taskflow.ai',
        role: 'Member',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=400&auto=format&fit=crop'
    }
];

export const mockProjects: Project[] = [
    {
        id: 'p1',
        name: 'Website Redesign',
        description: 'Modernizing the company landing page with new branding and optimized performance.',
        deadline: '2026-04-15',
        createdBy: 'u1',
        teamMembers: ['u1', 'u2', 'u3', 'u4', 'u5'],
        status: 'Active',
        createdAt: '2026-01-10',
        color: '#FFFFFF',
        tags: ['branding', 'web']
    },
    {
        id: 'p2',
        name: 'Mobile App Launch',
        description: 'Finalizing the iOS and Android versions for the spring release.',
        deadline: '2026-05-20',
        createdBy: 'u2',
        teamMembers: ['u2', 'u3', 'u6', 'u7'],
        status: 'Active',
        createdAt: '2026-02-05',
        color: '#A3A3A3',
        tags: ['mobile', 'launch']
    },
    {
        id: 'p3',
        name: 'Cloud Infrastructure Migration',
        description: 'Migrating legacy servers to a new cloud-native architecture.',
        deadline: '2026-06-30',
        createdBy: 'u1',
        teamMembers: ['u1', 'u4', 'u8'],
        status: 'Active',
        createdAt: '2026-03-01',
        color: '#737373',
        tags: ['cloud', 'infra']
    }
];

export const mockTasks: Task[] = [
    {
        id: 't1',
        title: 'Design UI Mockups',
        description: 'Create high-fidelity mockups for the new landing page.',
        projectId: 'p1',
        assignedTo: 'u2',
        status: 'In Progress',
        priority: 'High',
        dueDate: '2026-03-25',
        createdAt: '2026-03-01',
        tags: ['design']
    },
    {
        id: 't2',
        title: 'Frontend Implementation',
        description: 'Convert UI mockups to React components.',
        projectId: 'p1',
        assignedTo: 'u3',
        status: 'To Do',
        priority: 'Medium',
        dueDate: '2026-04-05',
        createdAt: '2026-03-05',
        tags: ['frontend']
    },
    {
        id: 't3',
        title: 'Beta Testing',
        description: 'Gather feedback from internal testers for the mobile app.',
        projectId: 'p2',
        assignedTo: 'u4',
        status: 'Done',
        priority: 'Low',
        dueDate: '2026-03-10',
        createdAt: '2026-02-15',
        tags: ['testing']
    },
    {
        id: 't4',
        title: 'API Security Audit',
        description: 'Perform a comprehensive security review of the new cloud APIs.',
        projectId: 'p3',
        assignedTo: 'u1',
        status: 'In Progress',
        priority: 'High',
        dueDate: '2026-04-20',
        createdAt: '2026-03-10',
        tags: ['security']
    },
    {
        id: 't5',
        title: 'Marketing Strategy',
        description: 'Develop a launch plan for the mobile application.',
        projectId: 'p2',
        assignedTo: 'u2',
        status: 'To Do',
        priority: 'Medium',
        dueDate: '2026-05-01',
        createdAt: '2026-03-08',
        tags: ['marketing']
    },
    {
        id: 't6',
        title: 'Database Optimization',
        description: 'Optimize queries for the new cloud-native database.',
        projectId: 'p3',
        assignedTo: 'u8',
        status: 'To Do',
        priority: 'High',
        dueDate: '2026-05-15',
        createdAt: '2026-03-11',
        tags: ['database']
    },
    {
        id: 't7',
        title: 'CI/CD Pipeline Setup',
        description: 'Configure GitHub Actions for automated deployment.',
        projectId: 'p3',
        assignedTo: 'u4',
        status: 'Done',
        priority: 'Medium',
        dueDate: '2026-03-20',
        createdAt: '2026-03-05',
        tags: ['devops']
    },
    {
        id: 't8',
        title: 'User Documentation',
        description: 'Draft the user guide for the redesigned website.',
        projectId: 'p1',
        assignedTo: 'u5',
        status: 'In Progress',
        priority: 'Low',
        dueDate: '2026-04-10',
        createdAt: '2026-03-12',
        tags: ['docs']
    },
    {
        id: 't9',
        title: 'Bug Bash Session',
        description: 'Team-wide session to identify and squash remaining bugs.',
        projectId: 'p2',
        assignedTo: 'u3',
        status: 'To Do',
        priority: 'High',
        dueDate: '2026-05-05',
        createdAt: '2026-03-13',
        tags: ['quality']
    },
    {
        id: 't10',
        title: 'Legacy Data Cleanup',
        description: 'Clean up and prepare legacy data for cloud migration.',
        projectId: 'p3',
        assignedTo: 'u1',
        status: 'Done',
        priority: 'Medium',
        dueDate: '2026-03-15',
        createdAt: '2026-03-01',
        tags: ['data']
    }
];

export const mockComments: Comment[] = [
    {
        id: 'c1',
        taskId: 't1',
        userId: 'u1',
        text: 'Looking great! Can we try a more vibrant accent color? @David Chen',
        timestamp: '2026-03-08T10:30:00Z'
    },
    {
        id: 'c2',
        taskId: 't1',
        userId: 'u2',
        text: 'Good idea. I will try the dark accent. @Alex Johnson',
        timestamp: '2026-03-08T11:15:00Z'
    },
    {
        id: 'c3',
        taskId: 't4',
        userId: 'u4',
        text: 'The security audit is nearly complete. @Alex Johnson',
        timestamp: '2026-03-12T09:00:00Z'
    },
    {
        id: 'c4',
        taskId: 't2',
        userId: 'u1',
        text: 'Please ensure we use the new design system. @Michael Ross',
        timestamp: '2026-03-10T14:20:00Z'
    },
    {
        id: 'c5',
        taskId: 't8',
        userId: 'u2',
        text: 'I have shared the docs draft. @Morgan Freeman',
        timestamp: '2026-03-13T16:45:00Z'
    }
];

export const mockMeetings: Meeting[] = [
    {
        id: 'm1',
        title: 'Project Kickoff - Website Redesign',
        date: '2026-03-01',
        transcript:
            'Alex: Welcome everyone to the kickoff. David, you will handle the UI mockups by March 25. Michael, you will start on the frontend components after that.',
        summary: 'Initial project planning and assignment of responsibilities.',
        tasks: [{ title: 'Design UI Mockups', deadline: '2026-03-25', assignee: 'David Chen' }],
        projectId: 'p1'
    }
];
