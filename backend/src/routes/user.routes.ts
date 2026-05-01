import { Hono, Context } from 'hono';
import { getAllUsers, inviteUser, getTeamStats, updateUserRole, deleteUser, sendDirectMessage } from '../services/userService.ts';
import { authMiddleware, roleCheck } from '../middlewares/authMiddleware.ts';
import catchAsync from '../utils/catchAsync.ts';
import { z } from 'zod';

const userRoutes = new Hono();

userRoutes.use('*', authMiddleware);

userRoutes.get('/', catchAsync(async (c: Context) => {
    const users = await getAllUsers();
    return c.json(users);
}));

userRoutes.get('/stats', catchAsync(async (c: Context) => {
    const stats = await getTeamStats();
    return c.json(stats);
}));

userRoutes.patch('/:id/role', roleCheck(['Admin']), catchAsync(async (c: Context) => {
    const userId = c.req.param('id');
    const { role } = await c.req.json();
    const user = await updateUserRole(userId, role);
    return c.json(user);
}));

const inviteSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    projectId: z.string().optional(),
});

userRoutes.post('/invite', roleCheck(['Admin', 'Manager']), catchAsync(async (c: Context) => {
    const body = await c.req.json();
    const validated = inviteSchema.parse(body);
    const user = await inviteUser(validated.email, validated.name, validated.projectId);
    return c.json(user, 201);
}));

userRoutes.delete('/:id', roleCheck(['Admin']), catchAsync(async (c: Context) => {
    const userId = c.req.param('id');
    await deleteUser(userId);
    return c.json({ message: 'User removed successfully' });
}));

userRoutes.post('/:id/message', catchAsync(async (c: Context) => {
    const toUserId = c.req.param('id');
    const fromUserId = c.get('userId');
    const { message } = await c.req.json();
    await sendDirectMessage(fromUserId, toUserId, message);
    return c.json({ message: 'Message sent successfully' });
}));

export default userRoutes;