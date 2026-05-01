import { Hono } from 'hono';
import { meetingController } from '../controllers/meetingController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const meetingRoutes = new Hono();

meetingRoutes.use('*', authMiddleware);

meetingRoutes.get('/', meetingController.getMeetings);
meetingRoutes.get('/:id', meetingController.getMeetingById);
meetingRoutes.post('/', meetingController.createMeeting);
meetingRoutes.patch('/:id', meetingController.updateMeeting);
meetingRoutes.delete('/:id', meetingController.deleteMeeting);

export default meetingRoutes;
