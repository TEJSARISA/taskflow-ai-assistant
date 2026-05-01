export interface User {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    isDeleted: boolean | null;
}

export interface UserIdentity {
    id: string;
    userId: string;
    provider: string;
    providerId: string;
    metadata: Record<string, any> | null;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean | null;
}
