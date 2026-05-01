import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import ApiError from './utils/ApiError.ts';
import { errorHandler } from './middlewares/error.ts';
import authRoutes from './routes/auth.routes.ts';
import projectRoutes from './routes/project.routes.ts';
import taskRoutes from './routes/task.routes.ts';
import userRoutes from './routes/user.routes.ts';
import meetingRoutes from './routes/meeting.routes.ts';
import aiRoutes from './routes/ai.routes.ts';
import activityLogRoutes from './routes/activityLog.routes.ts';
import timeEntryRoutes from './routes/timeEntry.routes.ts';
import fileVersionRoutes from './routes/fileVersion.routes.ts';
import fileRoutes from './routes/file.routes.ts';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());
app.use('*', secureHeaders());

// Routes
app.route('/auth', authRoutes);
app.route('/projects', projectRoutes);
app.route('/tasks', taskRoutes);
app.route('/users', userRoutes);
app.route('/meetings', meetingRoutes);
app.route('/ai', aiRoutes);
app.route('/activity-logs', activityLogRoutes);
app.route('/time-entries', timeEntryRoutes);
app.route('/tasks', fileVersionRoutes); // Using /tasks prefix for file versions
app.route('/files', fileRoutes);


// send back a 404 error for any unknown api request
app.notFound(() => {
    throw new ApiError(404, 'Not found');
});

// handle error
app.onError((err, c) => {
    return errorHandler(err, c);
});

export default app;
