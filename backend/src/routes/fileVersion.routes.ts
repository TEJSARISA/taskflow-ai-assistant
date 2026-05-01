import { Hono } from 'hono';
import * as fileVersionController from '../controllers/fileVersionController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const fileVersionRoutes = new Hono();

fileVersionRoutes.get('/:id/files', authMiddleware, fileVersionController.getFileVersions);
fileVersionRoutes.post('/:id/files', authMiddleware, fileVersionController.uploadFileVersion);

export default fileVersionRoutes;
