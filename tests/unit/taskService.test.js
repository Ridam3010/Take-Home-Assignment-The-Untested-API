const taskService = require('../../src/services/taskService');

describe('taskService Unit Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    it('should create a task with default status, priority, and null completedAt/dueDate/assignee', () => {
      const task = taskService.create({ title: 'Write unit tests' });
      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Write unit tests');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.assignee).toBeNull();
      expect(new Date(task.createdAt).getTime()).not.toBeNaN();
    });

    it('should create a task with custom fields and valid ISO dueDate', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const task = taskService.create({
        title: 'Complete assignment',
        description: 'Implement tests and fix bugs',
        status: 'in_progress',
        priority: 'high',
        dueDate: futureDate
      });

      expect(task.title).toBe('Complete assignment');
      expect(task.description).toBe('Implement tests and fix bugs');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(new Date(futureDate).toISOString());
      expect(task.completedAt).toBeNull();
    });

    it('should set completedAt immediately if created with status "done"', () => {
      const task = taskService.create({
        title: 'Already finished task',
        status: 'done'
      });
      expect(task.status).toBe('done');
      expect(task.completedAt).not.toBeNull();
    });
  });

  describe('getAll', () => {
    it('should return empty array when no tasks exist', () => {
      expect(taskService.getAll()).toEqual([]);
    });

    it('should return all created tasks in an array', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      const tasks = taskService.getAll();
      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });
  });

  describe('findById', () => {
    it('should return the task when matching ID is found', () => {
      const created = taskService.create({ title: 'Find Me' });
      const found = taskService.findById(created.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.title).toBe('Find Me');
    });

    it('should return undefined when ID is not found', () => {
      const found = taskService.findById('non-existent-uuid');
      expect(found).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    beforeEach(() => {
      taskService.create({ title: 'Todo Task 1', status: 'todo' });
      taskService.create({ title: 'Todo Task 2', status: 'todo' });
      taskService.create({ title: 'In Progress Task', status: 'in_progress' });
      taskService.create({ title: 'Done Task', status: 'done' });
    });

    it('should return exact match for "todo"', () => {
      const todos = taskService.getByStatus('todo');
      expect(todos).toHaveLength(2);
      expect(todos.every((t) => t.status === 'todo')).toBe(true);
    });

    it('should return exact match for "done" without false positive substring matches', () => {
      const doneTasks = taskService.getByStatus('done');
      expect(doneTasks).toHaveLength(1);
      expect(doneTasks[0].title).toBe('Done Task');
    });

    it('should return empty array if no tasks match status', () => {
      const unknown = taskService.getByStatus('unknown_status');
      expect(unknown).toEqual([]);
    });
  });

  describe('getPaginated', () => {
    beforeEach(() => {
      for (let i = 1; i <= 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }
    });

    it('should return the first page with correct 1-indexed offset', () => {
      const page1 = taskService.getPaginated(1, 2);
      expect(page1).toHaveLength(2);
      expect(page1[0].title).toBe('Task 1');
      expect(page1[1].title).toBe('Task 2');
    });

    it('should return second page with correct offset', () => {
      const page2 = taskService.getPaginated(2, 2);
      expect(page2).toHaveLength(2);
      expect(page2[0].title).toBe('Task 3');
      expect(page2[1].title).toBe('Task 4');
    });

    it('should return remaining tasks on the last partial page', () => {
      const page3 = taskService.getPaginated(3, 2);
      expect(page3).toHaveLength(1);
      expect(page3[0].title).toBe('Task 5');
    });

    it('should throw an error if page or limit are invalid (< 1 or NaN)', () => {
      expect(() => taskService.getPaginated(0, 10)).toThrow('page and limit must be positive integers');
      expect(() => taskService.getPaginated(1, 0)).toThrow('page and limit must be positive integers');
      expect(() => taskService.getPaginated(-1, 5)).toThrow('page and limit must be positive integers');
      expect(() => taskService.getPaginated('abc', 5)).toThrow('page and limit must be positive integers');
    });
  });

  describe('getStats', () => {
    it('should return zero counts for empty task list', () => {
      const stats = taskService.getStats();
      expect(stats).toEqual({
        todo: 0,
        in_progress: 0,
        done: 0,
        overdue: 0
      });
    });

    it('should correctly count tasks by status and overdue count', () => {
      const past = new Date(Date.now() - 3600000).toISOString();
      const future = new Date(Date.now() + 3600000).toISOString();

      taskService.create({ title: 'Overdue Todo', status: 'todo', dueDate: past });
      taskService.create({ title: 'Overdue In Progress', status: 'in_progress', dueDate: past });
      taskService.create({ title: 'Future Todo', status: 'todo', dueDate: future });
      taskService.create({ title: 'Completed Past Due', status: 'done', dueDate: past });
      taskService.create({ title: 'No Due Date', status: 'todo' });

      const stats = taskService.getStats();
      expect(stats.todo).toBe(3);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(2); // Only uncompleted tasks with past dueDate
    });
  });

  describe('update', () => {
    it('should update task fields', () => {
      const task = taskService.create({ title: 'Old Title', priority: 'low' });
      const updated = taskService.update(task.id, {
        title: 'New Title',
        description: 'New Description',
        priority: 'high'
      });

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('New Description');
      expect(updated.priority).toBe('high');
    });

    it('should set completedAt when updating status to done', () => {
      const task = taskService.create({ title: 'Finish me', status: 'todo' });
      expect(task.completedAt).toBeNull();

      const updated = taskService.update(task.id, { status: 'done' });
      expect(updated.status).toBe('done');
      expect(updated.completedAt).not.toBeNull();
    });

    it('should clear completedAt when reopening a completed task', () => {
      const task = taskService.create({ title: 'Reopen me', status: 'done' });
      expect(task.completedAt).not.toBeNull();

      const updated = taskService.update(task.id, { status: 'in_progress' });
      expect(updated.status).toBe('in_progress');
      expect(updated.completedAt).toBeNull();
    });

    it('should update dueDate correctly or clear to null', () => {
      const task = taskService.create({ title: 'Date test' });
      const future = new Date(Date.now() + 10000).toISOString();

      const withDate = taskService.update(task.id, { dueDate: future });
      expect(withDate.dueDate).toBe(new Date(future).toISOString());

      const cleared = taskService.update(task.id, { dueDate: null });
      expect(cleared.dueDate).toBeNull();
    });

    it('should return null when updating a non-existent task ID', () => {
      const result = taskService.update('non-existent-id', { title: 'Updated' });
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove existing task and return true', () => {
      const task = taskService.create({ title: 'Delete me' });
      const deleted = taskService.remove(task.id);
      expect(deleted).toBe(true);
      expect(taskService.findById(task.id)).toBeUndefined();
    });

    it('should return false if task ID is not found', () => {
      const deleted = taskService.remove('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('completeTask', () => {
    it('should mark task done, set completedAt timestamp, and preserve existing priority', () => {
      const task = taskService.create({
        title: 'High priority task',
        priority: 'high',
        status: 'todo'
      });

      const completed = taskService.completeTask(task.id);
      expect(completed).toBeDefined();
      expect(completed.status).toBe('done');
      expect(completed.completedAt).not.toBeNull();
      expect(completed.priority).toBe('high'); // Priority preserved!
    });

    it('should return null if task is not found', () => {
      const result = taskService.completeTask('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('assignTask', () => {
    it('should assign task to user and return updated task', () => {
      const task = taskService.create({ title: 'Unassigned task' });
      const assigned = taskService.assignTask(task.id, 'John Doe');
      expect(assigned).toBeDefined();
      expect(assigned.assignee).toBe('John Doe');
      expect(taskService.findById(task.id).assignee).toBe('John Doe');
    });

    it('should return null if task is not found', () => {
      const result = taskService.assignTask('non-existent-id', 'John Doe');
      expect(result).toBeNull();
    });
  });
});
