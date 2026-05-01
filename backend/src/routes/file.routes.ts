import { Hono } from 'hono';
import * as fileController from '../controllers/fileController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const fileRoutes = new Hono();

fileRoutes.use('*', authMiddleware);

fileRoutes.post('/upload', fileController.uploadFile);
fileRoutes.post('/download', fileController.getDownloadUrl);

export default fileRoutes;
