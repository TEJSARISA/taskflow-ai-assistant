import { Hono } from 'hono';
import * as aiController from '../controllers/aiController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const aiRoutes = new Hono();

aiRoutes.post('/generate-tasks', authMiddleware, aiController.generateTasks);
aiRoutes.post('/extract-tasks', authMiddleware, aiController.extractTasks);
aiRoutes.post('/project-summary', authMiddleware, aiController.getProjectSummary);
aiRoutes.post('/chat', authMiddleware, aiController.chat);
aiRoutes.post('/suggest-tasks', authMiddleware, aiController.suggestTasks);
aiRoutes.post('/generate-project-plan', authMiddleware, aiController.generateProjectPlan);
aiRoutes.post('/an-token', authMiddleware, aiController.createToken);

export default aiRoutes;
