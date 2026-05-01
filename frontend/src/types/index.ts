export type UserRole = 'Admin' | 'Manager' | 'Member';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    color?: string;
    online?: boolean;
}

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed';

export interface Project {
    id: string;
    name: string;
    description: string;
    deadline: string;
    createdBy: string;
    teamMembers: string[]; // User IDs
    status: ProjectStatus;
    createdAt: string;
    color?: string;
    tags?: string[];
    _count?: {
        tasks: number;
    };
    tasks?: any[];
}

export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
    id: string;
    title: string;
    description: string;
    projectId: string;
    project?: { name: string };
    assignedTo?: string;
    assignee?: { id: string; name: string; email: string };
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    position?: number;
    estimatedTime?: number;
    actualTime?: number;
    dependencies?: any[];
    tags?: string[];
    createdAt: string;
}

export interface Comment {
    id: string;
    taskId: string;
    userId: string;
    text: string;
    timestamp: string;
    mentions?: string[]; // User IDs
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: 'task_assigned' | 'comment_added' | 'status_updated' | 'project_added';
    read: boolean;
    timestamp: string;
}

export interface Meeting {
    id: string;
    title: string;
    date: string;
    transcript?: string;
    summary?: string;
    tasks?: { title: string; deadline: string; assignee: string }[];
    projectId?: string;
}
