import { Hono } from 'hono';
import * as activityLogController from '../controllers/activityLogController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const activityLogRoutes = new Hono();

activityLogRoutes.get('/', authMiddleware, activityLogController.getActivityLogs);

export default activityLogRoutes;
