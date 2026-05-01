# API Specification

## Auth
- POST `/auth/register` - Register new user (Public)
- POST `/auth/login` - Login user (Public)
- GET `/auth/google` - Initiate Google OAuth flow (Public)
- GET `/auth/google/callback` - Handle Google OAuth callback (Public)
- POST `/auth/refresh` - Refresh access token (Public)
- GET `/auth/me` - Get current user (Authenticated)
- GET `/auth/identities` - List linked identity providers (Authenticated)
- DELETE `/auth/identities/:provider` - Unlink an identity provider (Authenticated)

## Projects
- GET `/projects` - List all projects (Authenticated)
- GET `/projects/:id` - Get project details (Authenticated)
- POST `/projects` - Create new project (Authenticated)
- PATCH `/projects/:id` - Update project (Authenticated)
- DELETE `/projects/:id` - Soft delete project (Authenticated)
- GET `/projects/:id/analytics` - Get project progress and metrics (Authenticated)

## Tasks
- GET `/tasks` - List all tasks (Authenticated, optional projectId query)
- POST `/tasks` - Create new task (Authenticated)
- GET `/tasks/:id` - Get task details (Authenticated)
- PATCH `/tasks/:id` - Update task (Authenticated)
- DELETE `/tasks/:id` - Soft delete task (Authenticated)
- POST `/tasks/:id/dependencies` - Add task dependency (Authenticated)
- GET `/tasks/:id/dependencies` - List task dependencies (Authenticated)
- DELETE `/tasks/:id/dependencies/:depId` - Remove task dependency (Authenticated)

## Time Tracking
- GET `/time-entries` - List all time entries (Authenticated)
- POST `/time-entries/start` - Start timer for a task (Authenticated)
- POST `/time-entries/stop` - Stop active timer (Authenticated)
- GET `/time-entries/active` - Get active timer for current user (Authenticated)

## Activity Logs
- GET `/activity-logs` - List activity logs (Authenticated, optional projectId or taskId query)

## File Versions
- POST `/tasks/:id/files` - Upload new file version (Authenticated)
- GET `/tasks/:id/files` - List file versions for a task (Authenticated)

## Users
- GET `/users` - List all users (Authenticated)
- POST `/users/invite` - Invite a user via email (Authenticated)
- DELETE `/users/:id` - Remove a user from the team (Authenticated, Admin only)
- GET `/users/stats` - Get team performance and workload statistics (Authenticated)
- POST `/users/:id/message` - Send a direct message to a user (Authenticated)

## Comments
- GET `/tasks/:taskId/comments` - List comments for a task (Authenticated)
- POST `/tasks/:taskId/comments` - Add comment to a task (Authenticated)

## Meetings
- GET `/meetings` - List all meetings (Authenticated)
- GET `/meetings/:id` - Get meeting details (Authenticated)
- POST `/meetings` - Create new meeting / process transcript (Authenticated)

## AI Hub
- POST `/ai/chat` - AI chatbot for project queries (Authenticated)
- POST `/ai/suggest-tasks` - AI suggests task priorities and deadlines (Authenticated)
- POST `/ai/generate-project-plan` - AI suggests project planning (Authenticated)
