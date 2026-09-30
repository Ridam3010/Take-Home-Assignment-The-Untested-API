# Submission Notes

**Applicant:** Ridam Baranwal  
**Assignment:** Take-Home Assignment — The Untested API  
**Upstream Repository:** [rohit-ups/Take-Home-Assignment-The-Untested-API](https://github.com/rohit-ups/Take-Home-Assignment-The-Untested-API)  
**Stack:** Node.js, Express, Jest, Supertest  

---

## 1. What You'd Test Next If You Had More Time

1. **Concurrency & Race Condition Testing:**
   - Test simultaneous `PATCH /tasks/:id/assign` and `PUT /tasks/:id` operations to ensure data integrity and prevent race conditions when the service transitions to a persistent database (e.g. MongoDB/PostgreSQL).
2. **Performance & Stress Testing:**
   - Benchmark API latency and memory consumption under high load (e.g., 5,000+ tasks in-memory) using k6 or Artillery.
3. **Fuzz Testing & Malformed Payloads:**
   - Send unexpected data types (arrays, deep objects, 10MB strings, emojis, special characters) into JSON request bodies to verify robust serialization and error guarding.
4. **Security & Header Audits:**
   - Integrate `helmet`, configure CORS policies, and test rate-limiting behavior to protect against denial-of-service attempts.

---

## 2. Anything That Surprised You in the Codebase

1. **Off-by-One Pagination Calculation (`page * limit`):**
   - In `taskService.js`, calculating `offset = page * limit` instead of `(page - 1) * limit` caused `page=1` to skip the first batch of results entirely — a subtle bug that unit testing quickly caught.
2. **Priority Mutation on Task Completion:**
   - `completeTask` had hardcoded `priority: 'medium'`, which silently altered task priorities upon completion.
3. **Falsy Coercion on `page=0`:**
   - Using `parseInt(page) || 1` coerced `0` to `1` due to JavaScript's falsy evaluation rules, bypassing input validation.

---

## 3. Questions to Ask Before Shipping to Production

1. **Persistent Datastore & Indexing:**
   - Which database will replace the in-memory array (e.g., PostgreSQL, MongoDB), and what indexes should be created on `status`, `dueDate`, `createdAt`, and `assignee` for optimal query speed?
2. **Authentication & Multi-Tenancy:**
   - How should tasks be scoped to organizations or users (JWT / OAuth2)? Can users view/edit only their assigned tasks or all organization tasks?
3. **Audit Trails & Soft Deletion:**
   - Should task deletions be hard deletes or soft deletes (`deletedAt`) to preserve audit history and prevent accidental data loss?
4. **Cursor vs. Offset Pagination:**
   - For large datasets with frequent insertions, should we migrate from offset pagination (`page`/`limit`) to cursor-based pagination (`cursor`/`limit`) to prevent skipping items when new tasks are added?
5. **Observability & Logging:**
   - Which logging framework (e.g., Winston/Pino) and APM tool (Datadog/New Relic) will be standard across production microservices?
