# Task Manager API — The Untested API (Solved)

A fully tested and bug-fixed REST API based on the [rohit-ups/Take-Home-Assignment-The-Untested-API](https://github.com/rohit-ups/Take-Home-Assignment-The-Untested-API) codebase.

---

## ⚡ Quick Start

```bash
cd task-api
npm install
npm start        # Starts server on port 3000
```

### Running Tests & Coverage

```bash
npm test         # Run unit & integration test suites
npm run coverage # Run tests with detailed code coverage report
```

---

## 📊 Coverage Summary

```
-----------------|---------|----------|---------|---------|-------------------
File             | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-----------------|---------|----------|---------|---------|-------------------
All files        |   99.42 |    95.65 |   96.77 |   99.37 |                   
 src             |     100 |      100 |      50 |     100 |                   
  app.js         |     100 |      100 |      50 |     100 |                   
 src/routes      |     100 |     92.3 |     100 |     100 |                   
  tasks.js       |     100 |     92.3 |     100 |     100 | 25-26             
 src/services    |     100 |    95.55 |     100 |     100 |                   
  taskService.js |     100 |    95.55 |     100 |     100 | 31,70             
 src/utils       |   96.55 |    97.61 |     100 |   96.55 |                   
  validators.js  |   96.55 |    97.61 |     100 |   96.55 | 22                
-----------------|---------|----------|---------|---------|-------------------

Test Suites: 2 passed, 2 total
Tests:       56 passed, 56 total
Snapshots:   0 total
```

---

## 🛠️ API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tasks` | List all tasks. Supports `?status=`, `?page=`, `?limit=` |
| `GET` | `/tasks/stats` | Counts by status (`todo`, `in_progress`, `done`) + overdue count |
| `GET` | `/tasks/:id` | Get single task by ID |
| `POST` | `/tasks` | Create a new task |
| `PUT` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Delete a task (returns 204) |
| `PATCH` | `/tasks/:id/complete` | Mark a task as complete |
| `PATCH` | `/tasks/:id/assign` | **Assign a task to a user** _(New feature)_ |

---

## 📁 Repository Structure

```
task-api/
  src/
    app.js                  # Express app setup
    routes/tasks.js         # Route handlers & input validation
    services/taskService.js # Business logic + in-memory store
    utils/validators.js     # Request validation helpers
  tests/
    unit/
      taskService.test.js   # Direct unit tests for taskService
    integration/
      tasks.test.js         # Supertest integration tests for all API endpoints
  BUG_REPORT.md             # Detailed bug report with root cause analysis & fixes
  SUBMISSION_NOTES.md       # Answers to reflection questions
  package.json
  jest.config.js
  README.md
```
