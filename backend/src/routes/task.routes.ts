import { Hono } from 'hono';
import { taskController } from '../controllers/taskController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const taskRoutes = new Hono();

taskRoutes.use('*', authMiddleware);

taskRoutes.get('/', taskController.getTasks);
taskRoutes.get('/:id', taskController.getTaskById);
taskRoutes.post('/', taskController.createTask);
taskRoutes.patch('/:id', authMiddleware, taskController.updateTask);
taskRoutes.delete('/:id', authMiddleware, taskController.deleteTask);

// Task dependencies
taskRoutes.post('/:id/dependencies', authMiddleware, taskController.addTaskDependency);
taskRoutes.get('/:id/dependencies', authMiddleware, taskController.getTaskDependencies);
taskRoutes.delete('/:id/dependencies/:depId', authMiddleware, taskController.removeTaskDependency);

// Comments
taskRoutes.get('/:taskId/comments', authMiddleware, taskController.getComments);

taskRoutes.post('/:taskId/comments', taskController.addComment);

export default taskRoutes;