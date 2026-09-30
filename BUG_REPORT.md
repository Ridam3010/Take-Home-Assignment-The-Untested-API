# Bug Report — The Untested API

**Repository:** [rohit-ups/Take-Home-Assignment-The-Untested-API](https://github.com/rohit-ups/Take-Home-Assignment-The-Untested-API)  
**Author:** Ridam Baranwal  

---

## Executive Summary of Discovered Bugs

| Bug ID | File & Location | Severity | Summary | Status |
|---|---|---|---|---|
| **BUG-001** | `src/services/taskService.js` (line 9) | **High** | `getByStatus` uses `.includes()` substring matching instead of exact equality check. | **Fixed** |
| **BUG-002** | `src/services/taskService.js` (line 12) | **High** | `getPaginated` calculates `offset = page * limit`, causing an off-by-one pagination bug that skips page 1. | **Fixed** |
| **BUG-003** | `src/services/taskService.js` (line 69) | **Medium** | `completeTask` arbitrarily resets the task's priority to `'medium'`, mutating original priority. | **Fixed** |
| **BUG-004** | `src/routes/tasks.js` & `src/services/taskService.js` | **Medium** | Falsy fallback `parseInt(page) \|\| 1` silently converts invalid inputs like `page=0` to `page=1`. | **Fixed** |

---

## Detailed Bug Reports

### Bug 1: Substring Matching in `getByStatus()`

- **File & Line:** `src/services/taskService.js` (Line 9)
- **Original Code:**
  ```javascript
  const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));
  ```
- **Expected Behavior:**
  Filtering tasks by status (e.g. `GET /tasks?status=done`) should return only tasks whose `status` exactly matches `"done"`.
- **What Actually Happens:**
  Because `.includes()` is used, passing `status=do` returns tasks with status `"todo"` and `"done"`. Similarly, searching for partial strings matches unintended statuses.
- **How It Was Discovered:**
  Discovered during unit test authoring (`tests/unit/taskService.test.js`) and integration testing (`GET /tasks?status=...`).
- **Fix Applied:**
  ```javascript
  const getByStatus = (status) => tasks.filter((t) => t.status === status);
  ```

---

### Bug 2: Off-By-One Offset in `getPaginated()`

- **File & Line:** `src/services/taskService.js` (Line 12)
- **Original Code:**
  ```javascript
  const getPaginated = (page, limit) => {
    const offset = page * limit;
    return tasks.slice(offset, offset + limit);
  };
  ```
- **Expected Behavior:**
  Requesting `page=1` and `limit=10` should return the first 10 items (indices `0` to `9`).
- **What Actually Happens:**
  When `page=1` and `limit=10`, `offset = 1 * 10 = 10`. The slice begins at index `10`, completely skipping the first 10 items (Page 1) and returning Page 2 items instead!
- **How It Was Discovered:**
  Discovered during integration testing (`tests/integration/tasks.test.js`) when requesting `GET /tasks?page=1&limit=2` and receiving tasks starting from Task 3 instead of Task 1.
- **Fix Applied:**
  ```javascript
  const getPaginated = (page, limit) => {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      throw new Error('page and limit must be positive integers');
    }

    const offset = (pageNum - 1) * limitNum;
    return tasks.slice(offset, offset + limitNum);
  };
  ```

---

### Bug 3: `completeTask()` Overwriting Task Priority

- **File & Line:** `src/services/taskService.js` (Line 69)
- **Original Code:**
  ```javascript
  const completeTask = (id) => {
    const task = findById(id);
    if (!task) return null;

    const updated = {
      ...task,
      priority: 'medium', // <--- BUG: hardcoded override
      status: 'done',
      completedAt: new Date().toISOString(),
    };
    // ...
  ```
- **Expected Behavior:**
  Completing a task (`PATCH /tasks/:id/complete`) should update `status` to `"done"` and set `completedAt`, while keeping the task's existing `priority` (`"high"`, `"low"`, etc.) unchanged.
- **What Actually Happens:**
  Marking a `high` priority task as complete forcefully resets its `priority` back to `"medium"`.
- **How It Was Discovered:**
  Discovered during unit testing of `completeTask()` in `tests/unit/taskService.test.js`.
- **Fix Applied:**
  Removed the `priority: 'medium'` override:
  ```javascript
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
  ```

---

### Bug 4: Pagination Parameter Validation Bypassed

- **File & Line:** `src/routes/tasks.js` (Lines 20-21)
- **Original Code:**
  ```javascript
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  ```
- **Expected Behavior:**
  `GET /tasks?page=0` or `GET /tasks?page=-5` should return HTTP `400 Bad Request` with an error message.
- **What Actually Happens:**
  `parseInt(0)` evaluates to `0`, which is falsy in JavaScript, so `0 || 1` evaluates to `1`. Invalid inputs are silently coerced to `1` without raising validation errors.
- **Fix Applied:**
  Added validation in `getPaginated` and caught errors in `src/routes/tasks.js` to return `400 Bad Request`.
