# Requirements Document

## Introduction

This feature implements and integrates four HR management modules into the existing Employee Management System (EMS), a MERN application (MongoDB/Mongoose, Express, React, Node). The four modules are Leave Management, Holiday Management, Overtime Management, and Daily Advances. Each module provides full record management (Add, View, Edit, Delete, Search, Filter, Print, Export) in the React frontend, backed by Express controllers, routes, and Mongoose models, and matches the reference screenshots and the existing EMS visual theme.

The feature extends the existing Leave module and adds three net-new modules (Holiday, Overtime, Advance). All new backend code MUST follow existing conventions: routers mounted under `/api/*` in `backend/server.js`; `protect` + `adminOnly`/`superAdminOnly` auth middleware; role-scoped controllers; a `{ success, data, count }` JSON response envelope; a string `employeeId` plus an optional `userId` ObjectId on records. All new frontend code MUST reuse the shared components (`Modal`, `Badge`, `Avatar`, `Pagination`, `SkeletonLoader`), the `AppContext`/`AuthContext` data flow, and the existing sidebars.

A central concern of this feature is cross-module synchronization: approved leave and holidays MUST reflect into Attendance; pending overtime MUST add to payroll earnings; unsettled advances MUST add to payroll deductions — all without creating duplicate records or duplicate deductions, and without changing the meaning of existing calculation fields. Existing, unrelated functionality MUST remain unchanged.

## Glossary

- **EMS**: The existing Employee Management System (MERN) into which these modules are integrated.
- **System**: The EMS backend and frontend acting together to satisfy a requirement, unless a more specific component is named.
- **Leave_Module**: The frontend pages and backend endpoints for leave records, applying leave, leave balances, and approval/rejection.
- **Holiday_Module**: The frontend pages and backend endpoints managing holiday records, calendar, and upcoming holidays.
- **Overtime_Module**: The frontend pages and backend endpoints managing overtime entries.
- **Advance_Module**: The frontend pages and backend endpoints managing daily advance records.
- **Leave_Record**: A persisted leave request with fields employeeId, userId, email, employeeName, department, leaveType, startDate, endDate, days, reason, status, appliedDate, and approval metadata, stored in the existing `Leave` collection.
- **Leave_Type**: One of the leave categories recognized by the Leave_Module. Screenshot categories are Casual, Sick, Earned, Unpaid, Maternity, Paternity.
- **Earned_Leave**: The screenshot leave category "Earned", which the System treats as an alias mapped to the existing `Leave` enum value "Annual Leave" so the stored enum is not broken.
- **Leave_Balance**: For a balance-tracked Leave_Type, the entitlement minus the sum of approved Leave_Record days for an employee, as computed by the existing `getLeaveBalance` logic.
- **Paid_Leave**: A Leave_Type whose approved days do not reduce payable salary (Casual, Sick, Earned, Maternity, Paternity in this feature).
- **Unpaid_Leave**: A Leave_Type ("Unpaid Leave") whose approved days are recorded but counted as unpaid for salary purposes.
- **Holiday_Record**: A persisted holiday with fields holidayName, type, date or recurrence rule, status, description, paidStatus, and applicableEmployees, stored in a net-new `Holiday` collection.
- **Holiday_Type**: One of Weekly, Monthly, Festival, Custom.
- **Holiday_Rule**: The date or recurrence definition of a Holiday_Record (a fixed date for Festival/Custom, or a recurrence specification for Weekly/Monthly).
- **Applicable_Employees**: The set of employees a Holiday_Record applies to — either all employees or an explicitly selected subset identified by employeeId.
- **Overtime_Entry**: A persisted overtime record with fields employeeId, userId, employeeName, date, durationHours, durationMinutes, ratePerHour, totalAmount, reason, and status, stored in a net-new `Overtime` collection.
- **Overtime_Status**: One of Pending, Paid for an Overtime_Entry.
- **Overtime_Amount**: The computed monetary value of an Overtime_Entry, equal to (durationHours + durationMinutes/60) multiplied by ratePerHour.
- **Computed_Attendance_Overtime**: The existing per-day `overtime` field on Attendance (hours beyond 9 per day) computed by `attendanceController.calcHours`. This is distinct from an Overtime_Entry and is NOT modified by this feature.
- **Advance_Record**: A persisted advance with fields employeeId, userId, employeeName, date, amount, paymentMethod, reason, and status, stored in a net-new `Advance` collection.
- **Payment_Method**: One of Cash, UPI, Bank for an Advance_Record.
- **Advance_Status**: One of Pending, Settled/Returned, Salary Adjustment for an Advance_Record.
- **Salary_Adjustment**: An Advance_Status indicating the advance is to be recovered through payroll by adding its amount to payroll deductions.
- **Payroll_Record**: An existing payroll document, unique per (employeeId, month, year), with fields basic, hra, allowances, bonus, tax, insurance, otherDeductions, status.
- **Attendance_Record**: An existing attendance document, unique per (employeeId, date), with status enum present/absent/late/half-day/leave.
- **Auth_Middleware**: The existing `backend/middleware/auth.js` exporting `protect`, `adminOnly` (Admin+HR), and `superAdminOnly` (Admin only).
- **Role**: One of Admin, HR, Manager, Employee, as carried on `req.user.role`.
- **Response_Envelope**: The JSON response shape `{ success, data, count }` (count included for list endpoints) used by existing controllers.
- **Shared_Components**: The reusable frontend components `Modal`, `Badge`, `Avatar`, `Pagination`, `SkeletonLoader` under `frontend/src/components/shared`.

## Requirements

### Requirement 1: Leave Records Listing and Filtering

**User Story:** As an HR administrator, I want to view and filter all leave records, so that I can monitor leave activity across the organization.

#### Acceptance Criteria

1. WHEN an Admin or HR user opens the Leave Records page, THE Leave_Module SHALL display all Leave_Records retrieved from the existing `GET /api/leave` endpoint.
2. WHILE the authenticated Role is Employee, THE Leave_Module SHALL display only Leave_Records whose userId or email matches the authenticated user.
3. WHEN a user enters a search term, THE Leave_Module SHALL display only Leave_Records whose employee name or record identifier contains the search term.
4. WHEN a user selects a status filter value, THE Leave_Module SHALL display only Leave_Records whose status equals the selected value.
5. WHEN a user selects a Leave_Type filter value, THE Leave_Module SHALL display only Leave_Records whose Leave_Type equals the selected value.
6. THE Leave_Module SHALL render Leave_Records using the shared Avatar, Badge, and Pagination components with a fixed page size.
7. WHEN the Leave Records list is loading, THE Leave_Module SHALL display the shared SkeletonLoader component.
8. IF the `GET /api/leave` request fails, THEN THE Leave_Module SHALL display an error message and SHALL retain the last successfully loaded Leave_Records.

### Requirement 2: Apply Leave with Type Mapping and Balance Validation

**User Story:** As an employee, I want to apply for leave of a specific type, so that my absence is recorded and routed for approval.

#### Acceptance Criteria

1. WHEN an authenticated user submits an apply-leave form, THE Leave_Module SHALL send the request to the existing `POST /api/leave` endpoint with leaveType, startDate, endDate, days, and reason.
2. THE Leave_Module SHALL offer the Leave_Type options Casual, Sick, Earned, Unpaid, Maternity, and Paternity.
3. WHEN a user selects the Earned_Leave option, THE Leave_Module SHALL submit the stored leaveType value "Annual Leave" so the existing `Leave` enum remains valid.
4. IF the submitted endDate is earlier than the submitted startDate, THEN THE Leave_Module SHALL reject the submission with a validation error indicating the invalid date range and SHALL NOT create a Leave_Record.
5. IF the submitted days value is less than 0.5, THEN THE Leave_Module SHALL reject the submission with a validation error indicating the minimum is 0.5 days and SHALL NOT create a Leave_Record.
6. IF the requested date range overlaps an existing Leave_Record with status pending or approved for the same user, THEN THE Leave_Module SHALL reject the submission with an error identifying the overlapping record's status and date range and SHALL NOT create a Leave_Record.
7. IF the Leave_Type is balance-tracked AND the requested days exceed the remaining Leave_Balance for that Leave_Type, THEN THE Leave_Module SHALL reject the submission with an error stating the available and requested days and SHALL NOT create a Leave_Record.
8. WHERE the Leave_Type is Unpaid_Leave, THE Leave_Module SHALL NOT apply a balance check to the submission.
9. WHEN a Leave_Record is created, THE Leave_Module SHALL persist it with status "pending" and SHALL notify all Admin and HR users using the existing notification mechanism.

### Requirement 3: Leave Balance Display

**User Story:** As an employee, I want to see my leave balances by type, so that I know how much leave I can still take.

#### Acceptance Criteria

1. WHEN an authenticated user opens the Leave Balance page, THE Leave_Module SHALL display each Leave_Type with its entitlement, used days, and remaining days from the existing `GET /api/leave/balance` endpoint.
2. WHERE a Leave_Type has no tracked entitlement, THE Leave_Module SHALL display the remaining balance as "Unlimited".
3. THE Leave_Module SHALL display the Earned_Leave entitlement using the stored "Annual Leave" entitlement value.

### Requirement 4: Approve and Reject Leave

**User Story:** As an HR administrator, I want to approve or reject pending leave requests, so that leave is authorized and attendance stays accurate.

#### Acceptance Criteria

1. WHERE the authenticated Role is Admin or HR, THE Leave_Module SHALL display approve and reject actions for each pending Leave_Record.
2. WHEN an Admin or HR user approves a pending Leave_Record, THE Leave_Module SHALL call `PUT /api/leave/:id/status` with status "approved".
3. IF a user attempts to approve or reject a Leave_Record whose status is already approved, rejected, or cancelled, THEN THE Leave_Module SHALL reject the action with an error indicating the current status.
4. IF an Admin or HR user attempts to approve a Leave_Record whose userId equals the approver's user identifier, THEN THE Leave_Module SHALL reject the action with a self-approval error.
5. WHEN a Leave_Record is approved, THE Leave_Module SHALL create or update an Attendance_Record with status "leave" for each calendar day in the record's date range.
6. WHEN an Admin or HR user rejects a Leave_Record, THE Leave_Module SHALL store the provided rejection reason on the Leave_Record.
7. WHEN a Leave_Record status changes to approved or rejected, THE Leave_Module SHALL notify the affected employee using the existing notification mechanism.

### Requirement 5: Holiday Records Management

**User Story:** As an HR administrator, I want to add, edit, and delete holidays, so that the organization's holiday schedule is maintained.

#### Acceptance Criteria

1. WHEN an Admin or HR user opens the Holiday Records page, THE Holiday_Module SHALL display all Holiday_Records retrieved from `GET /api/holidays`.
2. WHERE the authenticated Role is Admin or HR, THE Holiday_Module SHALL display Add Holiday, Edit Holiday, and Delete Holiday actions.
3. WHEN an Admin or HR user submits an Add Holiday form, THE Holiday_Module SHALL persist a Holiday_Record with holidayName, Holiday_Type, Holiday_Rule, status, description, paidStatus, and Applicable_Employees via `POST /api/holidays`.
4. THE Holiday_Module SHALL offer the Holiday_Type options Weekly, Monthly, Festival, and Custom.
5. IF an Add Holiday or Edit Holiday submission omits holidayName, Holiday_Type, or Holiday_Rule, THEN THE Holiday_Module SHALL reject the submission with a validation error and SHALL NOT persist the Holiday_Record.
6. WHEN an Admin or HR user submits an Edit Holiday form for an existing Holiday_Record, THE Holiday_Module SHALL update that Holiday_Record via `PUT /api/holidays/:id`.
7. WHEN an Admin or HR user confirms deletion of a Holiday_Record, THE Holiday_Module SHALL delete that Holiday_Record via `DELETE /api/holidays/:id`.
8. WHERE the Applicable_Employees selection is a subset, THE Holiday_Module SHALL store the selected employees identified by employeeId.

### Requirement 6: Holiday Calendar and Upcoming Holidays

**User Story:** As an employee, I want to see holidays on a calendar and an upcoming-holidays list, so that I can plan my work.

#### Acceptance Criteria

1. WHEN an authenticated user opens the Holiday Calendar view, THE Holiday_Module SHALL display each Holiday_Record on its applicable date.
2. THE Holiday_Module SHALL display an Upcoming Holidays list containing Holiday_Records whose applicable date is on or after the current date, ordered by ascending date.
3. WHERE a Holiday_Record has a Weekly or Monthly recurrence Holiday_Rule, THE Holiday_Module SHALL display each occurrence generated by the recurrence rule within the displayed range.

### Requirement 7: Holiday Synchronization with Attendance and Leave

**User Story:** As an HR administrator, I want holidays to automatically reflect in attendance and leave, so that employees are not marked absent on holidays.

#### Acceptance Criteria

1. WHEN a Holiday_Record's status is active and attendance is generated or evaluated for a date matching that Holiday_Record's Holiday_Rule, THE System SHALL, for each employee in that Holiday_Record's Applicable_Employees, record an Attendance_Record with status "leave" for that date so that the employee is not marked "absent".
2. IF the date being evaluated does not match an active Holiday_Record's Holiday_Rule for an employee, THEN THE System SHALL NOT change that employee's Attendance_Record on account of that Holiday_Record.
3. IF an employee is not included in an active Holiday_Record's Applicable_Employees, THEN THE System SHALL NOT create or modify an Attendance_Record for that employee on account of that Holiday_Record.
4. IF a date is both an active holiday for an employee and within an approved Leave_Record date range, THEN THE System SHALL record exactly one Attendance_Record with status "leave" for that employee and date and SHALL NOT create a second Attendance_Record for the same (employeeId, date).
5. WHERE a Holiday_Record has a Weekly or Monthly recurrence Holiday_Rule, THE System SHALL apply criterion 1 to each date produced by that recurrence rule.
6. THE System SHALL preserve the existing Attendance_Record uniqueness constraint of one record per (employeeId, date).

### Requirement 8: Overtime Entry Logging and Calculation

**User Story:** As an HR administrator, I want to log overtime for employees, so that overtime is tracked and compensated.

#### Acceptance Criteria

1. WHEN an Admin or HR user opens the Overtime Records page, THE Overtime_Module SHALL display all Overtime_Entries retrieved from `GET /api/overtime`.
2. WHILE the authenticated Role is Employee, THE Overtime_Module SHALL display only Overtime_Entries whose userId or email matches the authenticated user.
3. WHEN an Admin or HR user submits a Log Overtime form, THE Overtime_Module SHALL persist an Overtime_Entry with employeeId, date, durationHours, durationMinutes, ratePerHour, and reason via `POST /api/overtime`.
4. WHEN an Overtime_Entry is persisted, THE Overtime_Module SHALL set Overtime_Amount equal to (durationHours + durationMinutes divided by 60) multiplied by ratePerHour.
5. IF a Log Overtime submission has durationHours and durationMinutes that both equal zero, or a negative ratePerHour, THEN THE Overtime_Module SHALL reject the submission with a validation error.
6. WHEN an Overtime_Entry is created, THE Overtime_Module SHALL set its Overtime_Status to "Pending".
7. WHERE an Admin or HR user marks an Overtime_Entry as settled, THE Overtime_Module SHALL set its Overtime_Status to "Paid".
8. THE Overtime_Module SHALL leave the existing Computed_Attendance_Overtime field on Attendance_Records unchanged.

### Requirement 9: Overtime Integration with Payroll

**User Story:** As a payroll administrator, I want pending overtime to be included in payroll earnings, so that employees are paid for approved overtime without double counting.

#### Acceptance Criteria

1. WHEN a Payroll_Record is generated for an employee for a given month and year, THE System SHALL add, as an additional earnings amount in that Payroll_Record, the sum of Overtime_Amount across that employee's Overtime_Entries whose Overtime_Status is "Pending" and whose date falls within the same month and year as the Payroll_Record.
2. IF no qualifying Pending Overtime_Entry exists for the employee in the Payroll_Record's month and year, THEN THE System SHALL add an overtime earnings amount of 0 and SHALL leave the Payroll_Record's existing earnings unchanged.
3. THE System SHALL record the overtime earnings as an amount additive to gross pay, separate from and without altering the stored values or meaning of the existing basic, hra, allowances, bonus, tax, insurance, and otherDeductions fields.
4. WHEN an Overtime_Entry's Overtime_Amount has been included in a generated Payroll_Record, THE System SHALL mark that Overtime_Entry as counted so that any subsequent payroll generation for the same employee, month, and year excludes it from the overtime earnings sum.
5. IF Payroll_Record generation fails after one or more Overtime_Entries have been marked as counted, THEN THE System SHALL revert those entries to their prior Overtime_Status so that no Overtime_Amount is excluded from a later successful generation.
6. THE System SHALL preserve the existing Payroll_Record uniqueness constraint of one record per (employeeId, month, year).

### Requirement 10: Daily Advance Record Management

**User Story:** As an HR administrator, I want to give advances to employees and track them, so that advances are recorded and later recovered.

#### Acceptance Criteria

1. WHEN an Admin or HR user opens the Advance Records page, THE Advance_Module SHALL display all Advance_Records retrieved from `GET /api/advances`.
2. WHILE the authenticated Role is Employee, THE Advance_Module SHALL display only Advance_Records whose userId or email matches the authenticated user.
3. WHEN an Admin or HR user submits a Give Advance form, THE Advance_Module SHALL persist an Advance_Record with employeeId, date, amount, Payment_Method, and reason via `POST /api/advances`.
4. THE Advance_Module SHALL offer the Payment_Method options Cash, UPI, and Bank.
5. IF a Give Advance submission has an amount less than or equal to zero, THEN THE Advance_Module SHALL reject the submission with a validation error.
6. WHEN an Advance_Record is created, THE Advance_Module SHALL set its Advance_Status to "Pending".
7. WHERE an Admin or HR user updates an Advance_Record, THE Advance_Module SHALL allow setting its Advance_Status to Settled/Returned or Salary Adjustment.

### Requirement 11: Advance Integration with Payroll Without Duplicate Deductions

**User Story:** As a payroll administrator, I want salary-adjustment advances to be deducted in payroll exactly once, so that employees are not over-deducted.

#### Acceptance Criteria

1. WHEN payroll is generated for an employee for a month and year, THE System SHALL add the sum of amounts of that employee's Advance_Records with Advance_Status Salary_Adjustment, dated on or before the last day of that month and year, as additional payroll deductions.
2. WHEN an Advance_Record is included in a generated Payroll_Record, THE System SHALL mark that Advance_Record as deducted and record the month and year in which it was deducted.
3. WHILE an Advance_Record is marked as deducted, THE System SHALL exclude it from the deduction sum in every subsequent payroll generation.
4. THE System SHALL exclude Advance_Records whose Advance_Status is Settled/Returned or Pending from payroll deductions.
5. THE System SHALL add advance deductions to payroll as additive amounts without changing the stored values or meaning of the existing otherDeductions, tax, and insurance fields.
6. THE System SHALL preserve the existing Payroll_Record uniqueness constraint of one record per (employeeId, month, year).

### Requirement 12: Record Operations Across All Modules

**User Story:** As a user, I want consistent add, view, edit, delete, search, filter, print, and export actions on each module, so that I can manage records efficiently.

#### Acceptance Criteria

1. THE System SHALL provide Add, View, Edit, Delete, Search, Filter, Print, and Export actions on the Leave_Module, Holiday_Module, Overtime_Module, and Advance_Record listing pages.
2. WHEN a user triggers the Export action on a module list, THE System SHALL export the currently filtered records.
3. WHEN a user triggers the Print action on a module list, THE System SHALL produce a printable rendering of the currently filtered records.
4. THE System SHALL render record detail views and create/edit forms using the shared Modal component.

### Requirement 13: Backend API, Models, and Routing Conventions

**User Story:** As a developer, I want the new modules to follow existing backend conventions, so that the codebase stays consistent and maintainable.

#### Acceptance Criteria

1. THE System SHALL define Mongoose models `Holiday`, `Overtime`, and `Advance`, each with a string employeeId field and an optional userId ObjectId field.
2. THE System SHALL mount holiday, overtime, and advance routers in `backend/server.js` under `/api/holidays`, `/api/overtime`, and `/api/advances` respectively, consistent with existing route mounting.
3. THE System SHALL apply the `protect` Auth_Middleware to every holiday, overtime, and advance route.
4. THE System SHALL apply the `adminOnly` Auth_Middleware to every create, update, and delete route of the Holiday_Module, Overtime_Module, and Advance_Module.
5. THE System SHALL return responses from all new endpoints using the Response_Envelope shape with `success` and `data`, and with `count` on list endpoints.
6. IF a requested record is not found on a new endpoint, THEN THE System SHALL respond with HTTP status 404 and `success` false.

### Requirement 14: Dynamic Employee Loading

**User Story:** As a user creating HR records, I want to select employees from the live employee directory, so that records reference real employees.

#### Acceptance Criteria

1. WHEN a create or edit form in the Holiday_Module, Overtime_Module, or Advance_Module is opened, THE System SHALL populate the employee selection options from the existing employee directory loaded through AppContext.
2. WHEN an employee is selected in a create or edit form, THE System SHALL store the selected employee's employeeId on the resulting record.

### Requirement 15: Persistence After Refresh

**User Story:** As a user, I want my created and edited records to remain after reloading the application, so that my data is reliably saved.

#### Acceptance Criteria

1. WHEN a record is created or edited in any module and the user reloads the application, THE System SHALL display the persisted record with the same field values via the module's list endpoint.
2. WHEN a record is deleted in any module and the user reloads the application, THE System SHALL NOT display the deleted record.

### Requirement 16: Role-Based Access Control

**User Story:** As a security administrator, I want each page and action gated by role, so that users only perform actions permitted to them.

#### Acceptance Criteria

1. IF a request to any new endpoint lacks a valid authentication token, THEN THE Auth_Middleware SHALL respond with HTTP status 401 and `success` false.
2. IF a user whose Role is Employee or Manager requests a create, update, or delete action on the Holiday_Module, Overtime_Module, or Advance_Module, THEN THE Auth_Middleware SHALL respond with HTTP status 403 and `success` false.
3. WHERE the authenticated Role is Employee, THE System SHALL restrict Leave_Module, Overtime_Module, and Advance_Module list results to records belonging to that user.
4. THE System SHALL reuse the existing leave approval restriction that excludes the Manager Role from leave approval actions.

### Requirement 17: Validation, Loading States, and Error Handling

**User Story:** As a user, I want clear feedback during loading, validation, and failures, so that I understand the state of the application.

#### Acceptance Criteria

1. WHILE a module list or detail request is in progress, THE System SHALL display the shared SkeletonLoader component for that view.
2. IF a create or edit submission fails backend validation, THEN THE System SHALL display the returned validation message and SHALL retain the user's entered form values.
3. IF an API request returns an error response or fails to reach the backend, THEN THE System SHALL display an error message to the user.
4. WHEN a create, edit, or delete action succeeds, THE System SHALL display a success confirmation to the user.

### Requirement 18: Preservation of Existing Functionality

**User Story:** As a system owner, I want existing features to keep working unchanged, so that adding HR pages introduces no regressions.

#### Acceptance Criteria

1. THE System SHALL leave the existing `Leave` model enum values unchanged while mapping the Earned_Leave label to "Annual Leave".
2. THE System SHALL leave the existing `getLeaveBalance`, `applyLeave`, `updateLeaveStatus`, and `cancelLeave` calculations unchanged except for additive extension.
3. THE System SHALL leave the existing Computed_Attendance_Overtime calculation in `attendanceController.calcHours` unchanged.
4. THE System SHALL leave the existing payroll earning and deduction field meanings unchanged while adding overtime earnings and advance deductions as additive amounts.
5. THE System SHALL leave existing endpoints, routes, and frontend pages unrelated to these four modules unchanged.
