# Implementation Plan: HR Management Pages

## Overview

This plan integrates four HR modules (Leave, Holiday, Overtime, Advance) into the existing MERN EMS. Implementation is JavaScript (Node/Express backend, React frontend) following the existing EMS conventions. Work proceeds backend-first: pure sync/validation service functions and models are built and property-tested in isolation, then wired into controllers and routes, then the React pages and `AppContext`/`api.js` layers are added and wired into `App.js` and the sidebars. Property-based tests use `fast-check` with Jest; database-dependent properties run against `mongodb-memory-server`.

Convention: `*` sub-tasks are optional tests. Every property test references a design property number and the requirement clauses it validates.

## Tasks

- [x] 1. Add backend test tooling and Mongoose models
  - [x] 1.1 Add property-test dev dependencies and model files
    - Add `fast-check` and `mongodb-memory-server` as backend dev dependencies in `backend/package.json`
    - Create `backend/models/Holiday.js` with `holidayName`, `type` enum (Weekly/Monthly/Festival/Custom), `date`, `recurrence.{dayOfWeek,dayOfMonth}`, `status`, `description`, `paidStatus`, `applicableAll`, `applicableEmployees[]` (string employeeId), string `employeeId`, optional `userId` ObjectId
    - Create `backend/models/Overtime.js` with string `employeeId`, optional `userId`, `email`, `employeeName`, `date`, `durationHours`, `durationMinutes`, `ratePerHour`, `totalAmount`, `reason`, `status` enum (Pending/Paid), and bookkeeping fields `counted`, `countedMonth`, `countedYear`
    - Create `backend/models/Advance.js` with string `employeeId`, optional `userId`, `email`, `employeeName`, `date`, `amount` (min 0.01), `paymentMethod` enum (Cash/UPI/Bank), `reason`, `status` enum (Pending/Settled-Returned/Salary Adjustment), and bookkeeping fields `deducted`, `deductedMonth`, `deductedYear`
    - _Requirements: 13.1_

  - [x] 1.2 Add additive payroll fields without changing existing fields
    - Append `overtimeEarnings` (default 0) and `advanceDeductions` (default 0) to the existing `backend/models/Payroll.js` schema
    - Preserve the existing `{ employeeId, month, year }` unique index and leave all existing earning/deduction fields unchanged
    - _Requirements: 9.3, 11.5, 18.4, 9.6, 11.6_

  - [ ]* 1.3 Write smoke tests for models
    - Assert each new model exposes a string `employeeId` and an optional `userId` ObjectId
    - Assert the Payroll `{ employeeId, month, year }` unique index still exists
    - _Requirements: 13.1, 9.6, 11.6_

- [x] 2. Implement leave validation and type-mapping helpers
  - [x] 2.1 Create leave helper module
    - Create `backend/services/leaveHelpers.js` with a pure `mapLeaveType(label)` (Earned → "Annual Leave", every other label maps to itself) and pure predicates for date-range/days validation, overlap detection against existing records, and balance-tracked vs untracked type checks
    - Do not modify existing `getLeaveBalance`, `applyLeave`, `updateLeaveStatus`, or `cancelLeave` logic except additive use of these helpers
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 18.1, 18.2_

  - [ ]* 2.2 Write property test for leave type mapping
    - **Property 3: Earned leave type maps to a valid stored enum value**
    - **Validates: Requirements 2.3, 18.1**

  - [ ]* 2.3 Write property test for apply-leave date/days validation
    - **Property 4: Apply-leave date-range and days validation**
    - **Validates: Requirements 2.4, 2.5**

  - [ ]* 2.4 Write property test for overlapping leave rejection
    - **Property 5: Overlapping leave rejection**
    - **Validates: Requirements 2.6**

  - [ ]* 2.5 Write property test for balance-check scoping
    - **Property 6: Balance check applies only to tracked types**
    - **Validates: Requirements 2.7, 2.8**

- [x] 3. Implement holiday sync service (pure logic)
  - [x] 3.1 Create holiday sync service
    - Create `backend/services/holidaySync.js` with pure `expandHolidayRule(holiday, rangeStart, rangeEnd)` (Weekly/Monthly recurrence expansion plus Festival/Custom fixed dates) and `holidayAttendanceUpserts(holiday, date, applicableEmployees)` returning at most one upsert descriptor per `(employeeId, date)`
    - Include a pure holiday-form validation predicate (name + type present, valid rule for type) and an upcoming-holidays selector (date >= today, ascending)
    - _Requirements: 5.5, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 3.2 Write property test for recurrence expansion
    - **Property 9: Holiday recurrence expansion is sound and complete**
    - **Validates: Requirements 6.3, 7.5**

  - [ ]* 3.3 Write property test for upcoming-holidays selector
    - **Property 10: Upcoming holidays filtering and ordering**
    - **Validates: Requirements 6.2**

  - [ ]* 3.4 Write property test for holiday applicability
    - **Property 11: Holiday sync affects only applicable employees on matching dates**
    - **Validates: Requirements 7.1, 7.2, 7.3**

  - [ ]* 3.5 Write property test for holiday form validation
    - **Property 12: Holiday form validation**
    - **Validates: Requirements 5.5**

- [x] 4. Implement overtime and advance payroll sync services (pure logic)
  - [x] 4.1 Create overtime payroll service
    - Create `backend/services/overtimePayroll.js` with pure `overtimeEarningsFor(entries, month, year)` summing Pending, not-yet-counted entries within the month/year (0 when none) and returning the contributing `entryIds`
    - Include a pure overtime-amount formula helper `(durationHours + durationMinutes/60) * ratePerHour` and an overtime input-validation predicate
    - _Requirements: 8.4, 8.5, 9.1, 9.2, 9.4_

  - [x] 4.2 Create advance payroll service
    - Create `backend/services/advancePayroll.js` with pure `advanceDeductionsFor(records, month, year)` summing Salary Adjustment, not-yet-deducted records dated on/before period end (Settled/Returned and Pending contribute 0) and returning `recordIds`
    - Include a pure advance amount-validation predicate (amount > 0)
    - _Requirements: 11.1, 11.4, 10.5_

  - [ ]* 4.3 Write property test for overtime amount formula
    - **Property 14: Overtime amount formula**
    - **Validates: Requirements 8.4**

  - [ ]* 4.4 Write property test for overtime input validation
    - **Property 15: Overtime input validation**
    - **Validates: Requirements 8.5**

  - [ ]* 4.5 Write property test for overtime earnings sum
    - **Property 17: Overtime earnings equal the qualifying sum**
    - **Validates: Requirements 9.1, 9.2**

  - [ ]* 4.6 Write property test for advance deductions sum
    - **Property 20: Advance deductions equal the qualifying sum**
    - **Validates: Requirements 11.1, 11.4**

  - [ ]* 4.7 Write property test for advance amount validation
    - **Property 24: Advance amount validation**
    - **Validates: Requirements 10.5**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all pure-service unit and property tests pass, ask the user if questions arise.

- [x] 6. Implement holiday controller and routes
  - [x] 6.1 Implement holiday controller
    - Create `backend/controllers/holidayController.js` with list (`{ success, count, data }`), getById (404 `{ success:false }` if missing), create (validates via holidaySync predicate, stores Applicable_Employees subset by employeeId), update, and delete
    - Return the `{ success, data }` envelope and HTTP 400 with the specific validation message on invalid submissions
    - _Requirements: 5.1, 5.3, 5.5, 5.6, 5.7, 5.8, 13.5, 13.6, 17.2_

  - [x] 6.2 Implement holiday→attendance synchronization on active holidays
    - Use `holidaySync` to upsert Attendance_Records with status "leave" per `(employeeId, date)` for applicable employees, reusing the existing upsert-by-`(employeeId, date)` pattern so holiday + approved leave never produce a second record
    - Never write the Computed_Attendance_Overtime (`Attendance.overtime`) field
    - _Requirements: 7.1, 7.4, 7.6, 8.8, 18.3_

  - [x] 6.3 Create and mount holiday routes
    - Create `backend/routes/holidayRoutes.js` applying `protect` to all routes and `adminOnly` to create/update/delete
    - Mount under `/api/holidays` in `backend/server.js` alongside existing mounts
    - _Requirements: 5.2, 13.2, 13.3, 13.4, 16.1, 16.2_

  - [ ]* 6.4 Write property test for attendance uniqueness across leave + holiday
    - **Property 8: Attendance uniqueness per (employeeId, date)** (run against `mongodb-memory-server`)
    - **Validates: Requirements 4.5, 7.4, 7.6**

  - [ ]* 6.5 Write unit/integration tests for holiday endpoints
    - Auth gates (401 no token, 403 Employee/Manager mutation), response envelope, 404 for missing id, default status on create
    - _Requirements: 13.3, 13.4, 13.5, 13.6, 16.1, 16.2_

- [x] 7. Implement overtime controller and routes
  - [x] 7.1 Implement overtime controller
    - Create `backend/controllers/overtimeController.js` with list (employee role scoped via `$or: [{ userId }, { email }]`), create (computes `totalAmount`, status "Pending", validates via overtime predicate), update (recomputes `totalAmount`), settle (status "Paid"), and delete
    - Return the `{ success, count, data }` envelope and 400 with specific messages on invalid input
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 13.5, 13.6, 16.3, 17.2_

  - [x] 7.2 Create and mount overtime routes
    - Create `backend/routes/overtimeRoutes.js` with `protect` on all routes, `adminOnly` on create/update/settle/delete
    - Mount under `/api/overtime` in `backend/server.js`
    - _Requirements: 13.2, 13.3, 13.4, 16.1, 16.2_

  - [ ]* 7.3 Write property test that overtime logging does not alter computed attendance overtime
    - **Property 16: Overtime logging does not alter computed attendance overtime** (run against `mongodb-memory-server`)
    - **Validates: Requirements 8.8, 18.3**

  - [ ]* 7.4 Write unit/integration tests for overtime endpoints
    - Auth gates, employee scoping, default "Pending" status, settle→"Paid", response envelope, 404 for missing id
    - _Requirements: 8.2, 8.6, 8.7, 13.3, 13.4, 13.5, 13.6, 16.2, 16.3_

- [x] 8. Implement advance controller and routes
  - [x] 8.1 Implement advance controller
    - Create `backend/controllers/advanceController.js` with list (employee role scoped), create (status "Pending", validates amount > 0), update (allow setting status to Settled/Returned or Salary Adjustment), and delete
    - Return the `{ success, count, data }` envelope and 400 with specific messages on invalid input
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6, 10.7, 13.5, 13.6, 16.3, 17.2_

  - [x] 8.2 Create and mount advance routes
    - Create `backend/routes/advanceRoutes.js` with `protect` on all routes, `adminOnly` on create/update/delete
    - Mount under `/api/advances` in `backend/server.js`
    - _Requirements: 13.2, 13.3, 13.4, 16.1, 16.2_

  - [ ]* 8.3 Write unit/integration tests for advance endpoints
    - Auth gates, employee scoping, default "Pending" status, status updates, response envelope, 404 for missing id
    - _Requirements: 10.2, 10.6, 10.7, 13.3, 13.4, 13.5, 13.6, 16.2, 16.3_

  - [ ]* 8.4 Write property test for persistence round-trip across new modules
    - **Property 13: Record persistence round-trip** (run against `mongodb-memory-server`)
    - **Validates: Requirements 5.3, 5.6, 5.7, 5.8, 8.3, 10.3, 14.2, 15.1, 15.2**

- [x] 9. Wire overtime and advance sync into payroll generation
  - [x] 9.1 Extend payroll generation with additive overtime/advance sync and rollback
    - In `backend/controllers/payrollController.js` `generatePayroll`, collect overtime (`overtimePayroll`) and advance (`advancePayroll`) contributions, mark contributing entries counted/deducted with their month/year, upsert the Payroll_Record writing only the new `overtimeEarnings`/`advanceDeductions` fields, and on any thrown error revert the marks to the pre-generation state
    - Preserve the `{ employeeId, month, year }` unique index and leave existing earning/deduction field meanings unchanged
    - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.6, 11.1, 11.2, 11.3, 11.5, 11.6, 18.4_

  - [ ]* 9.2 Write property test for overtime counted at most once
    - **Property 18: Overtime counted at most once** (run against `mongodb-memory-server`)
    - **Validates: Requirements 9.4**

  - [ ]* 9.3 Write property test for overtime rollback on payroll failure
    - **Property 19: Overtime marking rolls back on payroll failure** (inject a simulated upsert failure)
    - **Validates: Requirements 9.5**

  - [ ]* 9.4 Write property test for advance deducted at most once
    - **Property 21: Advance deducted at most once** (run against `mongodb-memory-server`)
    - **Validates: Requirements 11.2, 11.3**

  - [ ]* 9.5 Write property test for additive preservation of existing payroll fields
    - **Property 22: Additive preservation of existing payroll fields**
    - **Validates: Requirements 9.3, 11.5, 18.4**

  - [ ]* 9.6 Write property test for payroll uniqueness
    - **Property 23: Payroll uniqueness per (employeeId, month, year)** (run against `mongodb-memory-server`)
    - **Validates: Requirements 9.6, 11.6**

- [x] 10. Checkpoint - Ensure all backend tests pass
  - Ensure all backend sync, controller, and non-regression tests pass, ask the user if questions arise.

- [x] 11. Extend frontend data layer (api.js and AppContext)
  - [x] 11.1 Add new API groups to services/api.js
    - Add `holidayAPI` (getAll/getById/create/update/delete), `overtimeAPI` (getAll/create/update/settle/delete), and `advanceAPI` (getAll/create/update/delete) to `frontend/src/services/api.js`, matching the existing axios group pattern
    - _Requirements: 13.2, 15.1, 15.2_

  - [x] 11.2 Extend AppContext with new state, fetchers, and CRUD helpers
    - Add `holidays`, `overtimeEntries`, `advanceRecords` state; `fetchHolidays`/`fetchOvertime`/`fetchAdvances` loaded in the post-login effect; and CRUD helpers (`addHoliday`/`updateHoliday`/`deleteHoliday`, `addOvertime`/`updateOvertime`/`settleOvertime`/`deleteOvertime`, `addAdvance`/`updateAdvance`/`deleteAdvance`) with optimistic list updates and error throwing
    - Ensure employee selection options are sourced from `AppContext.employees`
    - _Requirements: 14.1, 14.2, 15.1, 15.2, 17.3, 17.4_

  - [x] 11.3 Create shared list utility selectors
    - Create `frontend/src/utils/recordFilters.js` with pure filter selector (search by employee name or record id, status filter, type filter) and a CSV export selector that both operate on the currently filtered record set
    - _Requirements: 1.3, 1.4, 1.5, 12.2_

  - [ ]* 11.4 Write property test for list filtering selector
    - **Property 2: List filtering returns the exact matching subset**
    - **Validates: Requirements 1.3, 1.4, 1.5**

  - [ ]* 11.5 Write property test for employee list scoping selector
    - **Property 1: Employee list scoping**
    - **Validates: Requirements 1.2, 8.2, 10.2, 16.3**

  - [ ]* 11.6 Write property test for export selector
    - **Property 25: Export reflects the currently filtered records**
    - **Validates: Requirements 12.2**

- [x] 12. Extend Leave frontend pages
  - [x] 12.1 Extend LeaveRequests list page
    - Update `frontend/src/pages/leave/LeaveRequests.js` to render records with shared `Avatar`/`Badge`/`Pagination` (fixed `PAGE_SIZE = 10`), search/status/type filters, `SkeletonLoader` on load, error retention of last data, and Add/View/Edit/Delete/Print/Export actions using the shared `Modal`
    - _Requirements: 1.1, 1.2, 1.6, 1.7, 1.8, 12.1, 12.2, 12.3, 12.4, 17.1_

  - [x] 12.2 Extend ApplyLeave form with type mapping and validation
    - Update `frontend/src/pages/leave/ApplyLeave.js` to offer Casual/Sick/Earned/Unpaid/Maternity/Paternity, submit "Annual Leave" for Earned, and surface backend validation messages while retaining entered values
    - _Requirements: 2.1, 2.2, 2.3, 17.2_

  - [x] 12.3 Extend LeaveBalance display and approve/reject actions
    - Update `frontend/src/pages/leave/LeaveBalance.js` to show entitlement/used/remaining per type ("Unlimited" when untracked, Earned using "Annual Leave"); surface approve/reject actions for Admin/HR on pending records, calling `PUT /api/leave/:id/status`, with self-approval and already-decided guards reflected in UI messaging
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.6, 16.4_

  - [ ]* 12.4 Write property test for leave status-transition guard
    - **Property 7: Leave status-transition guard**
    - **Validates: Requirements 4.3**

- [x] 13. Build Holiday frontend pages
  - [x] 13.1 Build HolidayRecords page
    - Create `frontend/src/pages/holidays/HolidayRecords.js` mirroring the LeaveRequests structure: list via `AppContext.holidays`, search/filter, `Pagination`, `SkeletonLoader`, Add/View/Edit/Delete/Print/Export, create/edit forms in shared `Modal` with Holiday_Type options (Weekly/Monthly/Festival/Custom), Applicable_Employees selection from `AppContext.employees`, and success/error toasts
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 12.1, 12.2, 12.3, 12.4, 14.1, 14.2, 17.1, 17.2, 17.3, 17.4_

  - [x] 13.2 Build HolidayCalendar page
    - Create `frontend/src/pages/holidays/HolidayCalendar.js` showing each holiday on its applicable date (expanding Weekly/Monthly recurrences within the displayed range) and an Upcoming Holidays list (date >= today, ascending)
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 14. Build Overtime and Advance frontend pages
  - [x] 14.1 Build OvertimeRecords page
    - Create `frontend/src/pages/overtime/OvertimeRecords.js` mirroring LeaveRequests: list via `AppContext.overtimeEntries` (employee-scoped), search/filter, `Pagination`, `SkeletonLoader`, Add/View/Edit/Delete/Print/Export, Log Overtime form in shared `Modal` (duration hours/minutes, ratePerHour, reason, employee from `AppContext.employees`), settle action, and toasts
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.7, 12.1, 12.2, 12.3, 12.4, 14.1, 14.2, 17.1, 17.2, 17.3, 17.4_

  - [x] 14.2 Build AdvanceRecords page
    - Create `frontend/src/pages/advances/AdvanceRecords.js` mirroring LeaveRequests: list via `AppContext.advanceRecords` (employee-scoped), search/filter, `Pagination`, `SkeletonLoader`, Add/View/Edit/Delete/Print/Export, Give Advance form in shared `Modal` (amount, Payment_Method Cash/UPI/Bank, reason, employee from `AppContext.employees`), status update control, and toasts
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7, 12.1, 12.2, 12.3, 12.4, 14.1, 14.2, 17.1, 17.2, 17.3, 17.4_

- [x] 15. Wire routes and navigation
  - [x] 15.1 Register routes in App.js
    - Add `/holidays/records`, `/holidays/calendar`, `/overtime/records`, and `/advances/records` inside the existing `AppLayout` route group (and employee-visible lists in `EmployeeLayout` where applicable), leaving unrelated routes unchanged
    - _Requirements: 5.1, 6.1, 8.1, 10.1, 16.3, 18.5_

  - [x] 15.2 Add sidebar navigation entries
    - Append Holiday/Overtime/Advance entries to `NAV_ITEMS` in `frontend/src/components/layout/Sidebar.js` following the existing `sub`-menu pattern, leaving existing entries unchanged
    - _Requirements: 5.1, 8.1, 10.1, 18.5_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all backend and frontend tests pass and existing leave/attendance/payroll suites remain green, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation.
- Property tests validate the 25 universal correctness properties; database-dependent properties (8, 13, 16, 18, 19, 21, 23) run against `mongodb-memory-server`, and the rollback property (19) injects a simulated upsert failure.
- Unit and integration tests validate wiring, auth gates, response envelopes, concrete scenarios, and non-regression of existing functionality.
- All backend changes are additive; existing enum values, calculations, and field meanings are preserved per Requirement 18.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1", "3.1", "4.1", "4.2", "11.1", "11.3"] },
    { "id": 1, "tasks": ["1.3", "2.2", "2.3", "2.4", "2.5", "3.2", "3.3", "3.4", "3.5", "4.3", "4.4", "4.5", "4.6", "4.7", "11.2", "11.4", "11.5", "11.6"] },
    { "id": 2, "tasks": ["6.1", "7.1", "8.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "6.5", "7.4", "8.3"] },
    { "id": 4, "tasks": ["7.2", "6.4", "7.3", "8.4", "11.2"] },
    { "id": 5, "tasks": ["8.2", "9.1"] },
    { "id": 6, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 7, "tasks": ["12.1", "12.2", "12.3"] },
    { "id": 8, "tasks": ["12.4", "13.1", "13.2", "14.1", "14.2"] },
    { "id": 9, "tasks": ["15.1", "15.2"] }
  ]
}
```
