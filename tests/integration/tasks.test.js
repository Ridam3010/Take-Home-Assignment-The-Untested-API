const request = require('supertest');
const app = require('../../src/app');
const taskService = require('../../src/services/taskService');

describe('Task API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('GET /tasks', () => {
    beforeEach(() => {
      taskService.create({ title: 'Task 1', status: 'todo', priority: 'low' });
      taskService.create({ title: 'Task 2', status: 'in_progress', priority: 'medium' });
      taskService.create({ title: 'Task 3', status: 'done', priority: 'high' });
    });

    it('Happy path: should return all tasks', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);
    });

    it('Happy path: should filter tasks by status', async () => {
      const res = await request(app).get('/tasks?status=in_progress');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Task 2');
    });

    it('Happy path: should paginate tasks with page and limit', async () => {
      const res = await request(app).get('/tasks?page=1&limit=2');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Task 1');
      expect(res.body[1].title).toBe('Task 2');
    });

    it('Edge case 1: should return empty list when filter matches nothing', async () => {
      const res = await request(app).get('/tasks?status=nonexistent');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('Edge case 2: should return 400 when pagination parameters are invalid', async () => {
      const res = await request(app).get('/tasks?page=0&limit=10');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('page and limit must be positive integers');
    });
  });

  describe('GET /tasks/stats', () => {
    it('Happy path: should return status counts and overdue metrics', async () => {
      const past = new Date(Date.now() - 3600000).toISOString();
      taskService.create({ title: 'Task 1', status: 'todo', dueDate: past });
      taskService.create({ title: 'Task 2', status: 'done', dueDate: past });

      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        todo: 1,
        in_progress: 0,
        done: 1,
        overdue: 1
      });
    });

    it('Edge case 1: should return all zeroes when store is empty', async () => {
      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0
      });
    });

    it('Edge case 2: stats route should not collide with /tasks/:id', async () => {
      const res = await request(app).get('/tasks/stats');
      expect(res.status).toBe(200);
      expect(res.body.id).toBeUndefined();
    });
  });

  describe('GET /tasks/:id', () => {
    it('Happy path: should return single task by ID', async () => {
      const created = taskService.create({ title: 'Get me' });
      const res = await request(app).get(`/tasks/${created.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.id);
      expect(res.body.title).toBe('Get me');
    });

    it('Edge case 1: should return 404 for non-existent ID', async () => {
      const res = await request(app).get('/tasks/unknown-id-12345');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('Edge case 2: should return 404 for random UUID', async () => {
      const res = await request(app).get('/tasks/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });

  describe('POST /tasks', () => {
    it('Happy path: should create a new task successfully', async () => {
      const payload = {
        title: 'New API task',
        description: 'Testing task creation',
        priority: 'high',
        dueDate: new Date().toISOString()
      };
      const res = await request(app).post('/tasks').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('New API task');
      expect(res.body.status).toBe('todo');
      expect(res.body.priority).toBe('high');
      expect(res.body.assignee).toBeNull();
    });

    it('Edge case 1: should return 400 if title is missing or empty', async () => {
      const res1 = await request(app).post('/tasks').send({ description: 'No title' });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toContain('title is required');

      const res2 = await request(app).post('/tasks').send({ title: '   ' });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('title is required');
    });

    it('Edge case 2: should return 400 if invalid status or priority is provided', async () => {
      const res1 = await request(app).post('/tasks').send({ title: 'Task', status: 'invalid_status' });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toContain('status must be one of');

      const res2 = await request(app).post('/tasks').send({ title: 'Task', priority: 'urgent' });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('priority must be one of');
    });

    it('Edge case 3: should return 400 if dueDate is invalid date string', async () => {
      const res = await request(app).post('/tasks').send({ title: 'Task', dueDate: 'invalid-date' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('dueDate must be a valid ISO date string');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('Happy path: should update an existing task', async () => {
      const task = taskService.create({ title: 'Original title' });
      const res = await request(app)
        .put(`/tasks/${task.id}`)
        .send({
          title: 'Updated title',
          description: 'Updated description',
          status: 'in_progress',
          priority: 'high'
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated title');
      expect(res.body.description).toBe('Updated description');
      expect(res.body.status).toBe('in_progress');
      expect(res.body.priority).toBe('high');
    });

    it('Edge case 1: should return 404 when updating non-existent task', async () => {
      const res = await request(app)
        .put('/tasks/non-existent-id')
        .send({ title: 'Updated' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('Edge case 2: should return 400 when updating with invalid title or fields', async () => {
      const task = taskService.create({ title: 'Original title' });
      const res1 = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: '' });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toContain('title must be a non-empty string');

      const res2 = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ priority: 'extreme' });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('priority must be one of');

      const res3 = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ status: 'completed' });
      expect(res3.status).toBe(400);
      expect(res3.body.error).toContain('status must be one of');

      const res4 = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ dueDate: 'not-a-date' });
      expect(res4.status).toBe(400);
      expect(res4.body.error).toContain('dueDate must be a valid ISO date string');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('Happy path: should delete existing task and return 204 No Content', async () => {
      const task = taskService.create({ title: 'Delete me' });
      const res = await request(app).delete(`/tasks/${task.id}`);
      expect(res.status).toBe(204);

      // Verify task is gone
      const checkRes = await request(app).get(`/tasks/${task.id}`);
      expect(checkRes.status).toBe(404);
    });

    it('Edge case 1: should return 404 when deleting non-existent task', async () => {
      const res = await request(app).delete('/tasks/non-existent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('Edge case 2: repeated deletion should return 404', async () => {
      const task = taskService.create({ title: 'Delete twice' });
      await request(app).delete(`/tasks/${task.id}`);
      const secondRes = await request(app).delete(`/tasks/${task.id}`);
      expect(secondRes.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('Happy path: should mark task as complete, set completedAt, and preserve priority', async () => {
      const task = taskService.create({ title: 'Complete me', priority: 'high', status: 'todo' });
      const res = await request(app).patch(`/tasks/${task.id}/complete`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
      expect(res.body.completedAt).not.toBeNull();
      expect(res.body.priority).toBe('high');
    });

    it('Edge case 1: should return 404 when marking non-existent task complete', async () => {
      const res = await request(app).patch('/tasks/non-existent-id/complete');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('Edge case 2: marking already completed task returns 200 with status done', async () => {
      const task = taskService.create({ title: 'Already done', status: 'done' });
      const res = await request(app).patch(`/tasks/${task.id}/complete`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
    });
  });

  describe('PATCH /tasks/:id/assign', () => {
    it('Happy path: should assign task to a person', async () => {
      const task = taskService.create({ title: 'Assignment test' });
      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Alex Developer' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Alex Developer');
      expect(res.body.id).toBe(task.id);
    });

    it('Edge case 1: should return 404 if task is not found', async () => {
      const res = await request(app)
        .patch('/tasks/non-existent-id/assign')
        .send({ assignee: 'Alex Developer' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });

    it('Edge case 2: should return 400 if assignee is missing, empty, or whitespace', async () => {
      const task = taskService.create({ title: 'Assignment validation' });

      const res1 = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({});
      expect(res1.status).toBe(400);
      expect(res1.body.error).toContain('assignee is required');

      const res2 = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: '   ' });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('assignee is required');
    });

    it('Edge case 3: allows reassigning an already assigned task', async () => {
      const task = taskService.create({ title: 'Reassign task' });
      await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'First Assignee' });

      const res = await request(app)
        .patch(`/tasks/${task.id}/assign`)
        .send({ assignee: 'Second Assignee' });

      expect(res.status).toBe(200);
      expect(res.body.assignee).toBe('Second Assignee');
    });
  });

  describe('Unknown route 404 handling', () => {
    it('should return 404 for undefined endpoints', async () => {
      const res = await request(app).get('/unknown-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Endpoint not found');
    });
  });
});
