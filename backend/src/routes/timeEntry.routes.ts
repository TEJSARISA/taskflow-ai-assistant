import { Hono } from 'hono';
import * as timeEntryController from '../controllers/timeEntryController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const timeEntryRoutes = new Hono();

timeEntryRoutes.get('/', authMiddleware, timeEntryController.getTimeEntries);
timeEntryRoutes.post('/start', authMiddleware, timeEntryController.startTimer);
timeEntryRoutes.post('/stop', authMiddleware, timeEntryController.stopTimer);
timeEntryRoutes.get('/active', authMiddleware, timeEntryController.getActiveTimer);

export default timeEntryRoutes;
