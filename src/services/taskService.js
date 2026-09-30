const { v4: uuidv4 } = require('uuid');

let tasks = [];

const getAll = () => [...tasks];

const findById = (id) => tasks.find((t) => t.id === id);

// Fixed: Exact status match instead of substring .includes()
const getByStatus = (status) => tasks.filter((t) => t.status === status);

// Fixed: 1-indexed pagination offset (page - 1) * limit instead of page * limit
const getPaginated = (page, limit) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    throw new Error('page and limit must be positive integers');
  }

  const offset = (pageNum - 1) * limitNum;
  return tasks.slice(offset, offset + limitNum);
};

const getStats = () => {
  const now = new Date();
  const counts = { todo: 0, in_progress: 0, done: 0 };
  let overdue = 0;

  tasks.forEach((t) => {
    if (counts[t.status] !== undefined) counts[t.status]++;
    if (t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now) {
      overdue++;
    }
  });

  return { ...counts, overdue };
};

const create = ({ title, description = '', status = 'todo', priority = 'medium', dueDate = null }) => {
  const task = {
    id: uuidv4(),
    title: title.trim(),
    description: description ? String(description).trim() : '',
    status,
    priority,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    completedAt: status === 'done' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
    assignee: null,
  };
  tasks.push(task);
  return task;
};

const update = (id, fields) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const currentTask = tasks[index];
  const updated = { ...currentTask, ...fields };

  if (fields.title) {
    updated.title = fields.title.trim();
  }

  if (fields.status) {
    if (fields.status === 'done' && !currentTask.completedAt) {
      updated.completedAt = new Date().toISOString();
    } else if (fields.status !== 'done') {
      updated.completedAt = null;
    }
  }

  if (fields.dueDate !== undefined) {
    updated.dueDate = fields.dueDate ? new Date(fields.dueDate).toISOString() : null;
  }

  tasks[index] = updated;
  return updated;
};

const remove = (id) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;

  tasks.splice(index, 1);
  return true;
};

// Fixed: Preserves original task priority instead of hardcoding to 'medium'
const completeTask = (id) => {
  const task = findById(id);
  if (!task) return null;

  const updated = {
    ...task,
    status: 'done',
    completedAt: new Date().toISOString(),
  };

  const index = tasks.findIndex((t) => t.id === id);
  tasks[index] = updated;
  return updated;
};

// New feature: Assign task to user
const assignTask = (id, assignee) => {
  const task = findById(id);
  if (!task) return null;

  const updated = {
    ...task,
    assignee: assignee.trim(),
  };

  const index = tasks.findIndex((t) => t.id === id);
  tasks[index] = updated;
  return updated;
};

const _reset = () => {
  tasks = [];
};

module.exports = {
  getAll,
  findById,
  getByStatus,
  getPaginated,
  getStats,
  create,
  update,
  remove,
  completeTask,
  assignTask,
  _reset,
};
