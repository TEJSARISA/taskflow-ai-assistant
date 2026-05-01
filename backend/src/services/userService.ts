import prisma from '../client.ts';
import { User } from '../types/user.ts';
import { HandleOAuthCallback200 } from '@uptiqai/integrations-sdk';
import bcrypt from 'bcrypt';
import { sendEmail } from './emailService.ts';

/**
 * User Service - Functional approach for user and identity management
 */

/**
 * Find or create user based on auth provider profile
 * Handles multiple identity providers per user
 */
export async function findOrCreateUser(profile: HandleOAuthCallback200, metadata?: Record<string, any>): Promise<User> {
    // Check if identity already exists
    const existingIdentity = await prisma.userIdentity.findFirst({
        where: {
            provider: profile.provider,
            providerId: profile.providerId,
            isDeleted: false
        },
        include: {
            user: true
        }
    });

    if (existingIdentity) {
        // User already logged in with this provider before
        // Update metadata if provided (e.g., new profile picture, updated tokens)
        if (metadata) {
            await prisma.userIdentity.update({
                where: { id: existingIdentity.id },
                data: { metadata }
            });
        }
        return existingIdentity.user as User;
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findFirst({
        where: { email: profile.email, isDeleted: false }
    });

    if (existingUser) {
        // User exists but logging in with a new provider
        // Link this new identity to existing user
        await prisma.userIdentity.create({
            data: {
                userId: existingUser.id,
                provider: profile.provider,
                providerId: profile.providerId,
                metadata: metadata || profile.rawProfile
            }
        });

        return existingUser as User;
    }

    // New user - create user and identity
    const userCount = await prisma.user.count({ where: { isDeleted: false } });
    const role = userCount === 0 ? 'Admin' : 'Member';

    const newUser = await prisma.user.create({
        data: {
            email: profile.email,
            name: profile.name || null,
            role,
            identities: {
                create: {
                    provider: profile.provider,
                    providerId: profile.providerId,
                    metadata: metadata || profile.rawProfile
                }
            }
        }
    });

    return newUser as User;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
        where: { id: userId, isDeleted: false }
    });
    return user as User | null;
}

/**
 * Get user by email including deleted ones (to handle unique constraints)
 */
export async function getUserByEmailAny(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase().replace(/\s/g, '');
    console.log(`Searching for any user with email: [${normalizedEmail}]`);
    
    // Explicitly override the global filter to check both deleted and non-deleted
    // Using isDeleted: undefined to bypass the global filters extension
    const user = await prisma.user.findFirst({
        where: { email: normalizedEmail, isDeleted: undefined } as any
    });
    
    if (user) {
        console.log(`Found user: ${user.id} (isDeleted: ${user.isDeleted})`);
    } else {
        console.log(`No user found with email: [${normalizedEmail}]`);
    }
    
    return user as User | null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase().replace(/\s/g, '');
    const user = await prisma.user.findFirst({
        where: { email: normalizedEmail, isDeleted: false }
    });
    return user as User | null;
}

/**
 * Get all identities for a user
 */
export async function getUserIdentities(userId: string) {
    return await prisma.userIdentity.findMany({
        where: { userId, isDeleted: false }
    });
}

/**
 * Unlink an identity from a user
 * Only allowed if user has at least one other identity
 */
export async function unlinkIdentity(userId: string, provider: string): Promise<void> {
    const identities = await getUserIdentities(userId);

    if (identities.length <= 1) {
        throw new Error('Cannot unlink last identity. User must have at least one login method.');
    }

    await prisma.userIdentity.updateMany({
        where: {
            userId,
            provider
        },
        data: {
            isDeleted: true
        }
    });
}

/**
 * Register user with email and password
 */
export async function registerWithEmailPassword(email: string, password: string, name?: string): Promise<User> {
    const trimmedEmail = email.trim();
    // Check if user already exists (including deleted ones)
    const existingUser = await getUserByEmailAny(trimmedEmail);
    
    if (existingUser) {
        if (!existingUser.isDeleted) {
            // Check if user has an EmailPassword identity
            const existingIdentity = await prisma.userIdentity.findFirst({
                where: { 
                    userId: existingUser.id, 
                    provider: 'EmailPassword', 
                    isDeleted: false 
                }
            });

            if (existingIdentity) {
                throw new Error('User with this email already exists');
            }

            // User exists (e.g. from invite or other login) but has no password identity.
            // Let them register by adding the identity.
            const passwordHash = await bcrypt.hash(password, 10);
            await prisma.userIdentity.create({
                data: {
                    userId: existingUser.id,
                    provider: 'EmailPassword',
                    providerId: trimmedEmail,
                    metadata: {
                        passwordHash,
                        emailVerified: false,
                        registeredAt: new Date().toISOString()
                    }
                }
            });

            // Update name if provided and not already set
            if (name && (!existingUser.name || existingUser.name === trimmedEmail.split('@')[0])) {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { name }
                });
            }

            return existingUser as User;
        } else {
            // Restore soft-deleted user - explicitly pass isDeleted: true to bypass global filter
            const restoredUser = await prisma.user.update({
                where: { id: existingUser.id, isDeleted: true } as any,
                data: { 
                    isDeleted: false,
                    name: name || existingUser.name
                }
            });

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Check if identity already exists - also bypass global filter
            const identity = await prisma.userIdentity.findFirst({
                where: { userId: restoredUser.id, provider: 'EmailPassword', isDeleted: undefined } as any
            });

            if (identity) {
                await prisma.userIdentity.update({
                    where: { id: identity.id, isDeleted: undefined } as any,
                    data: {
                        isDeleted: false,
                        providerId: trimmedEmail,
                        metadata: {
                            passwordHash,
                            emailVerified: false,
                            registeredAt: new Date().toISOString()
                        }
                    }
                });
            } else {
                await prisma.userIdentity.create({
                    data: {
                        userId: restoredUser.id,
                        provider: 'EmailPassword',
                        providerId: trimmedEmail,
                        metadata: {
                            passwordHash,
                            emailVerified: false,
                            registeredAt: new Date().toISOString()
                        }
                    }
                });
            }

            return restoredUser as User;
        }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if this is the first user
    const userCount = await prisma.user.count({ where: { isDeleted: false } });
    const role = userCount === 0 ? 'Admin' : 'Member';

    // Create user with email/password identity
    const newUser = await prisma.user.create({
        data: {
            email: trimmedEmail,
            name: name || null,
            role,
            identities: {
                create: {
                    provider: 'EmailPassword',
                    providerId: trimmedEmail,
                    metadata: {
                        passwordHash,
                        emailVerified: false,
                        registeredAt: new Date().toISOString()
                    }
                }
            }
        }
    });

    return newUser as User;
}

/**
 * Authenticate user with email and password
 */
export async function authenticateWithEmailPassword(email: string, password: string): Promise<User> {
    const trimmedEmail = email.trim();
    // Find user identity
    const identity = await prisma.userIdentity.findFirst({
        where: {
            provider: 'EmailPassword',
            providerId: trimmedEmail,
            isDeleted: false
        },
        include: {
            user: true
        }
    });

    if (!identity) {
        throw new Error('Invalid email or password');
    }

    // Verify password
    const metadata = identity.metadata as any;
    const isValid = await bcrypt.compare(password, metadata.passwordHash);

    if (!isValid) {
        throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.userIdentity.update({
        where: { id: identity.id },
        data: {
            metadata: {
                ...metadata,
                lastLoginAt: new Date().toISOString()
            }
        }
    });

    return identity.user as User;
}

/**
 * Find or create user with phone number
 */
export async function findOrCreateUserByPhone(phone: string, name?: string): Promise<User> {
    // Check if identity exists
    const existingIdentity = await prisma.userIdentity.findFirst({
        where: {
            provider: 'PhoneOTP',
            providerId: phone,
            isDeleted: false
        },
        include: {
            user: true
        }
    });

    if (existingIdentity) {
        // Update last login
        await prisma.userIdentity.update({
            where: { id: existingIdentity.id },
            data: {
                metadata: {
                    ...(existingIdentity.metadata as any),
                    lastLoginAt: new Date().toISOString()
                }
            }
        });
        return existingIdentity.user as User;
    }

    // Create new user with phone identity
    const newUser = await prisma.user.create({
        data: {
            email: `${phone.replace(/[^0-9]/g, '')}@phone.local`, // Placeholder email
            name: name || null,
            identities: {
                create: {
                    provider: 'PhoneOTP',
                    providerId: phone,
                    metadata: {
                        phone,
                        phoneVerified: true,
                        registeredAt: new Date().toISOString(),
                        lastLoginAt: new Date().toISOString()
                    }
                }
            }
        }
    });

    return newUser as User;
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
    const users = await prisma.user.findMany({
        where: { isDeleted: false },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            isDeleted: true
        }
    });
    return users as User[];
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: string): Promise<User> {
    const user = await prisma.user.update({
        where: { id: userId },
        data: { role }
    });
    return user as User;
}

/**
 * Get team productivity and workload stats
 */
export async function getTeamStats() {
    const users = await prisma.user.findMany({
        where: { isDeleted: false },
        include: {
            assignedTasks: {
                where: { isDeleted: false }
            },
            timeEntries: {
                where: { isDeleted: false }
            }
        }
    });

    return users.map(user => {
        const totalTasks = user.assignedTasks.length;
        const completedTasks = user.assignedTasks.filter(t => t.status === 'Done').length;
        const inProgressTasks = user.assignedTasks.filter(t => t.status === 'In Progress').length;
        
        // Calculate workload (0-100%)
        // Simple heuristic: 5 active tasks = 100% capacity
        const activeTasks = totalTasks - completedTasks;
        const workload = Math.min(Math.round((activeTasks / 5) * 100), 100);

        // Productivity score (0-100)
        // Ratio of completed tasks to total tasks, weighted by time entries
        const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const productivityScore = Math.round(taskScore);

        return {
            userId: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            totalTasks,
            completedTasks,
            inProgressTasks,
            workload,
            productivityScore
        };
    });
}



/**
 * Invite a user by email
 */
export async function inviteUser(email: string, name?: string, projectId?: string): Promise<User> {
    // Normalize email: trim, lowercase and remove all whitespace
    const normalizedEmail = email.trim().toLowerCase().replace(/\s/g, '');
    console.log(`Processing invitation for: ${normalizedEmail}`);
    
    let user = await getUserByEmailAny(normalizedEmail);

    if (!user) {
        console.log(`User not found, creating new account for ${normalizedEmail}`);
        // Create a new user with no identities (they'll need to link one when they "join")
        user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                name: name || normalizedEmail.split('@')[0],
                isDeleted: false
            }
        });
    } else if (user.isDeleted) {
        console.log(`User was soft-deleted, restoring: ${user.id}`);
        // Restore soft-deleted user - explicitly pass isDeleted: true to bypass global filter
        user = await prisma.user.update({
            where: { id: user.id, isDeleted: true } as any,
            data: { isDeleted: false, name: name || user.name }
        });
    }

    // If projectId is provided, add the user to the project's team members
    if (projectId) {
        const project = await prisma.project.findFirst({
            where: { id: projectId, isDeleted: false }
        });
        
        if (project) {
            if (!project.teamMembers.includes(user.id)) {
                console.log(`Adding user ${user.id} to project ${projectId}`);
                await prisma.project.update({
                    where: { id: projectId },
                    data: {
                        teamMembers: {
                            set: [...project.teamMembers, user.id]
                        }
                    }
                });
            } else {
                console.log(`User ${user.id} already a member of project ${projectId}`);
            }
        } else {
            console.warn(`Project ${projectId} not found or deleted, skipping member assignment`);
        }
    }

    try {
        console.log(`Initiating invitation email send to ${normalizedEmail}`);
        const frontendUrl = process.env.FRONTEND_DOMAIN || 'http://localhost:5173';
        const registerUrl = `${frontendUrl}/register`;
        
        const userName = name || user?.name || 'there';
        
        const result = await sendEmail({
            to: [normalizedEmail],
            subject: 'Invitation to Join UPTIQ',
            text: `Hello ${userName},\n\nYou have been invited to join UPTIQ, our strategic project management platform. UPTIQ helps you organize tasks, collaborate with team members, and achieve your goals more efficiently.\n\nJoin here: ${registerUrl}\n\nIf you didn't expect this invitation, you can safely ignore this email.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #007bff;">Welcome to UPTIQ!</h2>
                    <p>Hello ${userName},</p>
                    <p>You have been invited to join our strategic project management platform. UPTIQ helps you organize tasks, collaborate with team members, and achieve your goals more efficiently.</p>
                    <p>Click the button below to get started:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${registerUrl}" 
                           style="display: inline-block; padding: 14px 30px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                            Join UPTIQ Now
                        </a>
                    </div>
                    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #007bff;">${registerUrl}</p>
                    <p style="margin-top: 30px; font-size: 0.85em; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
                        If you didn't expect this invitation, you can safely ignore this email.
                    </p>
                </div>
            `,
        });
        console.log(`Invitation email successfully sent to ${normalizedEmail}. Result:`, result);
    } catch (error) {
        // Log the error but don't break the invitation process
        console.error(`CRITICAL: Failed to send invitation email to ${normalizedEmail}:`, error);
        // We don't re-throw here so the user creation/project assignment still works
    }

    if (!user) {
        throw new Error('Failed to create or restore user');
    }

    return user as User;
}

/**
 * Delete a user (soft delete)
 */
export async function deleteUser(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { isDeleted: true }
    });
    
    // Also soft delete identities
    await prisma.userIdentity.updateMany({
        where: { userId },
        data: { isDeleted: true }
    });
}

/**
 * Send a direct message (via email)
 */
export async function sendDirectMessage(fromUserId: string, toUserId: string, message: string): Promise<void> {
    const fromUser = await prisma.user.findFirst({ where: { id: fromUserId, isDeleted: false } });
    const toUser = await prisma.user.findFirst({ where: { id: toUserId, isDeleted: false } });

    if (!fromUser || !toUser) {
        throw new Error('User not found');
    }

    if (toUser.email) {
        await sendEmail({
            to: [toUser.email],
            subject: `New message from ${fromUser.name || 'a colleague'}`,
            text: `Hello ${toUser.name || 'there'},

You have received a new message from ${fromUser.name || 'a colleague'}:

"${message}"

Reply in the app.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #007bff;">New Message Received</h2>
                    <p>Hello ${toUser.name || 'there'},</p>
                    <p>You have received a new message from <strong>${fromUser.name || 'a colleague'}</strong>:</p>
                    <div style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; margin: 20px 0; font-style: italic;">
                        "${message}"
                    </div>
                    <p>You can reply to this message directly in the platform.</p>
                </div>
            `,
        });
    }
}
