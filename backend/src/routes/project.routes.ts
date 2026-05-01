import { Hono } from 'hono';
import { projectController } from '../controllers/projectController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const projectRoutes = new Hono();

projectRoutes.use('*', authMiddleware);

projectRoutes.get('/', projectController.getProjects);
projectRoutes.get('/:id', projectController.getProjectById);
projectRoutes.post('/', projectController.createProject);
projectRoutes.patch('/:id', authMiddleware, projectController.updateProject);
projectRoutes.delete('/:id', authMiddleware, projectController.deleteProject);
projectRoutes.get('/:id/analytics', authMiddleware, projectController.getProjectAnalytics);

export default projectRoutes;