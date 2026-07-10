# Codex Project: CapExFlow Architecture and Workflow Redesign

## 1. Project objective

Refactor CapExFlow into a reliable local-first capital expenditure planning application that supports:

- baseline process definition;
- any number of investment proposals;
- equipment, quotation, and line-template reuse;
- capacity, operating-cost, benefit, cash-flow, NPV, IRR, ROI, payback, and break-even calculations;
- validation and review readiness;
- report preview and PDF/JSON output;
- backend-authoritative persistence, backup, migration, and audit history.

The detailed product specification is:

- `docs/CAPEXFLOW_PRODUCT_REDEFINITION.md`

Read that document before changing code.

---

# 2. Current repository facts

The current repository contains two conflicting implementations:

1. The React frontend stores projects and master data in `localStorage` using the frontend-only `MockProject` model.
2. The Express backend stores a different `Project` model in `backend/data/projects.json` and exposes CRUD APIs that the frontend does not use.

The frontend is concentrated in a roughly 15,000-line `src/App.tsx`. It contains:

- domain types;
- default master data;
- local persistence;
- project editor state;
- equipment and quotation master UI;
- line-unit master UI;
- calculation logic;
- validation fragments;
- report configuration;
- report rendering;
- print/PDF behavior.

Do not add further business logic to this file.

---

# 3. Mandatory implementation principles

## 3.1 Preserve existing user data

- Never delete `localStorage` data automatically.
- Implement an explicit migration/import path.
- Create a backup before conversion.
- Migration must be idempotent.
- Show migrated count, skipped count, and warnings.

## 3.2 One authoritative domain model

- Define Zod schemas in `shared/schemas`.
- Infer TypeScript types from Zod.
- Frontend and backend must import the same schemas/types.
- Remove the conceptual split between `MockProject` and backend `Project`.
- Do not use `any` in shared domain models or calculation engines.

## 3.3 Backend is the source of truth

- All project and master-data CRUD must use `/api`.
- `localStorage` may store only UI preferences, migration markers, and temporary unsaved recovery data.
- Use atomic JSON writes: write temporary file, fsync where practical, then rename.
- Serialize writes using a mutex.
- Validate all requests and persisted files with Zod.

## 3.4 Calculations are pure and centralized

- No financial or capacity formulas inside React components.
- No duplicate calculations in report components.
- All derived values must come from a shared evaluation result.
- Unsupported or invalid results return `null` plus a reason code, never an artificial zero.

## 3.5 Canonical money representation

- Store monetary amounts in normal currency units.
- Do not store values in “万円”.
- Do not multiply or divide by 10,000 inside business formulas.
- Display scale is formatting only.
- Every money value must have a currency.
- Every cross-currency evaluation must use an exchange-rate snapshot.

## 3.6 Master-data snapshots

- Projects must retain equipment and quotation snapshots.
- Editing a master must not silently change historical projects.
- “Refresh from master” must show a diff and require explicit confirmation.

## 3.7 Incremental delivery

Do not rewrite the application in one unreviewable commit. Deliver the phases below as separate, buildable commits or pull requests.

---

# 4. Target source structure

Create and gradually migrate toward this structure:

```text
src/
  app/
    App.tsx
    routes.tsx
    providers.tsx
  features/
    dashboard/
    projects/
    project-editor/
    scenarios/
    equipment-master/
    line-templates/
    reports/
    settings/
  components/
    layout/
    forms/
    tables/
    feedback/
  domain/
    calculations/
    validation/
    migrations/
  services/
    api/
  styles/

backend/
  api/
  repositories/
  services/
  data/
  backup/

shared/
  schemas/
  types/
  constants/

tests/
  unit/
  integration/
  fixtures/
```

`src/App.tsx` should become an application shell and route composition file. Target fewer than 500 lines after migration.

---

# 5. Phase 0 — Baseline, safety, and test harness

## Goal

Create a reliable baseline before changing behavior.

## Tasks

1. Add scripts:
   - `test`
   - `test:watch`
   - `typecheck`
   - `lint`
2. Add Vitest and React Testing Library.
3. Extract representative sample projects from current code into `tests/fixtures`.
4. Add characterization tests for current calculations:
   - currency conversion;
   - investment total;
   - annual effect;
   - payback;
   - NPV;
   - IRR;
   - break-even;
   - labor-cost difference.
5. Add a frontend action to export all current `localStorage` business data as one JSON file.
6. Add visible error handling for malformed local data.
7. Remove duplicate license headers and obvious dead imports only when tests remain green.

## Acceptance criteria

- `npm run typecheck` succeeds.
- `npm run test` succeeds.
- `npm run build` succeeds.
- Existing sample projects render.
- Existing local data can be exported without modification.

---

# 6. Phase 1 — Shared domain schemas and backend-authoritative persistence

## Goal

Unify frontend and backend data and stop using localStorage as the business-data database.

## 6.1 Shared schemas

Implement Zod schemas for at least:

- `Money`
- `ExchangeRateSet`
- `ProjectStatus`
- `PartyRef`
- `ProjectCommon`
- `TargetProduct`
- `EquipmentSnapshot`
- `QuoteSnapshot`
- `Resource`
- `LineUnit`
- `CapexItem`
- `OperatingAdjustment`
- `RevenueAdjustment`
- `Scenario`
- `RiskItem`
- `ScheduleItem`
- `AttachmentMeta`
- `ReportConfig`
- `AuditEntry`
- `Project`
- `ApplicationStore`

Use `schemaVersion` at the root.

## 6.2 Repository layer

Create a repository API that hides JSON file handling.

Required behavior:

- load and validate store;
- create initial store;
- atomic write;
- write mutex;
- automatic backup;
- backup retention, default 30 generations;
- corrupt-file detection;
- restore from backup;
- optimistic version check on project update;
- unique project-number validation.

## 6.3 API

Implement typed routes:

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
POST   /api/projects/:id/duplicate
POST   /api/projects/:id/status-transitions
POST   /api/projects/:id/validate
GET    /api/projects/:id/evaluation
POST   /api/projects/:id/export
POST   /api/projects/import

GET    /api/equipment
POST   /api/equipment
PUT    /api/equipment/:id
DELETE /api/equipment/:id

GET    /api/line-templates
POST   /api/line-templates
PUT    /api/line-templates/:id
DELETE /api/line-templates/:id

GET    /api/settings
PUT    /api/settings
GET    /api/backups
POST   /api/backups/:id/restore
```

Return structured errors:

```ts
interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  details?: unknown;
}
```

## 6.4 Frontend API client

- Create typed request helpers.
- Add loading, retry, save-state, and error-state handling.
- Use debounced autosave, approximately 1.5 seconds.
- Retain an explicit Save button.
- Display `saving`, `saved`, and `failed` states.
- On network/save failure, retain a temporary recovery payload in localStorage.

## 6.5 Legacy migration

Read these current keys where present:

- `app_projects`
- `app_master_equipment`
- `app_master_line_units`
- `app_equipment_schemas`
- `app_custom_suggestions`

Provide a migration screen with:

- detected record counts;
- preview;
- backup download;
- import button;
- warnings;
- migration result.

Do not delete the old keys. Mark successful migration with a separate versioned migration marker.

## Acceptance criteria

- New and migrated projects are loaded from the backend after browser refresh.
- Frontend performs no normal business-data writes to legacy localStorage keys.
- Invalid API payloads return 400 with field errors.
- Interrupted writes do not corrupt the primary JSON file.
- A stale project version returns 409 conflict.

---

# 7. Phase 2 — Application layout and workflow redesign

## Goal

Replace nested and ambiguous navigation with a workflow-oriented project editor.

## 7.1 Global layout

Left navigation:

- Dashboard
- Projects
- Equipment & Quotes
- Line Templates
- Analytics
- Settings

Header:

- breadcrumbs;
- project number and title;
- save state;
- document status;
- validation counts;
- Save;
- Prepare for Review;
- Export.

## 7.2 Project list

Use a table with:

- project number;
- title;
- department;
- applicant;
- status;
- selected proposal;
- investment amount;
- payback;
- updated date;
- actions.

Filters:

- keyword;
- status;
- department;
- investment purpose;
- updated-date range;
- include archived.

Actions:

- open;
- duplicate;
- archive;
- export;
- delete only from archive with confirmation.

## 7.3 Project editor shell

Left workflow navigation:

1. Overview
2. Baseline
3. Proposals
4. Evaluation & Comparison
5. Implementation & Risks
6. Report

Each step shows completion state and validation severity.

Right sticky summary:

- active scenario;
- investment;
- annual net benefit;
- payback;
- NPV;
- IRR;
- capacity;
- demand fulfillment;
- validation summary.

## 7.4 Scenario behavior

- One mandatory baseline scenario.
- Zero or more proposals while editing; at least one required for review readiness.
- Add blank proposal.
- Duplicate baseline.
- Duplicate another proposal.
- Rename.
- Reorder.
- Archive/restore.
- Select one proposal as the recommended proposal.

Do not auto-create fixed A/B/C scenarios.

## 7.5 Proposal sections

- Line Design
- Equipment & Quotes
- Initial Costs
- Operating Costs & Benefits
- Capacity Results

Do not maintain separate free-text-only calculation tabs for payback, BEP, and labor difference. Those are evaluation results, with optional explanation fields.

## Acceptance criteria

- Users can understand which step is incomplete without opening every tab.
- Scenario count is unrestricted.
- Baseline cannot be deleted.
- Proposal comparison updates when source inputs change.
- Mobile/tablet width collapses the sticky summary without losing access.

---

# 8. Phase 3 — Calculation engine

## Goal

Create testable, deterministic calculations independent of React.

## 8.1 Required engine modules

```text
src/domain/calculations/capacityEngine.ts
src/domain/calculations/costEngine.ts
src/domain/calculations/cashFlowEngine.ts
src/domain/calculations/financialMetricsEngine.ts
src/domain/calculations/breakEvenEngine.ts
src/domain/calculations/comparisonEngine.ts
```

## 8.2 Capacity engine

Support:

- SPM or cycle time;
- simultaneous output/cavities;
- working days;
- working hours;
- operating rate;
- yield rate;
- changeover availability;
- serial process bottleneck;
- explicit parallel groups;
- monthly capacity;
- demand fulfillment;
- spare capacity.

Return warnings when data is missing or the process graph is invalid.

## 8.3 Cost engine

Separate cost categories:

- labor;
- depreciation;
- maintenance;
- electricity;
- consumables;
- material loss;
- outsourcing;
- logistics;
- quality loss;
- other fixed;
- other variable.

Never overwrite one category with another.

## 8.4 Investment engine

Include:

- equipment;
- tooling;
- engineering;
- construction;
- installation;
- freight;
- insurance;
- training;
- initial spares;
- removal;
- other capex;
- subsidies;
- asset-sale proceeds.

Separate depreciable and non-depreciable amounts.

## 8.5 Annual benefit

Calculate proposal minus baseline using matched categories.

Include capacity-constrained sales:

```text
fulfilledSalesVolume = min(demandVolume, netCapacity)
```

A proposal with higher capacity must be able to produce higher revenue than baseline when demand exists.

## 8.6 Cash flow and metrics

Return annual cash-flow rows including:

- initial investment;
- ramp-up factor;
- revenue effect;
- operating cost effect;
- maintenance;
- tax if enabled;
- depreciation tax shield if enabled;
- working capital if enabled;
- residual value;
- replacement costs.

Metrics:

- simple payback;
- discounted payback;
- annual ROI;
- cumulative ROI;
- NPV;
- IRR;
- break-even volume;
- break-even sales;
- break-even operating rate.

Rules:

- non-recoverable payback is `null` with reason;
- IRR requires sign change;
- do not cap IRR at 100%;
- distinguish annual ROI and cumulative ROI;
- use the same evaluation result in editor, comparison, and report.

## 8.7 Sensitivity

Calculate NPV, IRR, and payback for:

- volume -20%, -10%, base, +10%, +20%;
- investment -20%, -10%, base, +10%, +20%;
- annual benefit -20%, -10%, base, +10%, +20%.

## Acceptance criteria

- Calculation modules contain no React imports.
- Monetary display-scale changes do not affect results.
- Baseline and proposal calculations use the same cost engine.
- Editor and report display byte-for-byte equivalent formatted metrics from one evaluation result.
- Unit tests cover normal, zero, negative, missing, and extreme cases.

---

# 9. Phase 4 — Master data and project snapshots

## Goal

Retain reuse benefits without losing historical reproducibility.

## Tasks

1. Add revision numbers to equipment and line templates.
2. Normalize equipment category IDs and stop using category names as keys.
3. Normalize equipment references and stop matching by equipment name.
4. Derive quotation base-currency values; do not require manually maintained `baseAmount`.
5. Store selected quotation snapshot in each project resource/capex item.
6. Add master-difference detection.
7. Add a diff modal for refresh:
   - old value;
   - new value;
   - keep project value;
   - apply master value.
8. Record refresh in audit log.
9. Prevent deletion of referenced master records; allow archive instead.

## Acceptance criteria

- A master update does not alter an existing project until explicitly applied.
- Reports from old projects remain reproducible.
- Two pieces of equipment with the same name do not collide.
- Quote currency conversion uses the project exchange-rate snapshot.

---

# 10. Phase 5 — Validation, status workflow, report, and history

## 10.1 Validation engine

Create structured issues:

```ts
interface ValidationIssue {
  id: string;
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  path?: string;
  step?: ProjectStep;
  scenarioId?: string;
}
```

Validation must include:

- required fields;
- project-number uniqueness;
- baseline existence;
- proposal existence;
- selected proposal;
- currency/rate completeness;
- invalid process graph;
- missing capacity input;
- expired quote;
- unmet demand;
- low capacity margin;
- invalid financial assumptions;
- non-recoverable investment;
- IRR below cost of capital;
- unresolved high risks.

## 10.2 Status workflow

Implement:

```text
draft -> ready_for_review -> submitted -> approved -> archived
submitted -> rejected -> draft
ready_for_review -> draft
```

- `ready_for_review` requires zero errors.
- Each transition requires actor name.
- Rejection requires comment.
- Append an immutable audit entry.
- Do not implement authentication in this phase.

## 10.3 Reports

- Use one evaluation result.
- Hide empty sections.
- Preserve intentional zeros.
- Show calculation assumptions.
- Show exchange-rate source and effective date.
- Show calculation-engine version.
- Show report-generation timestamp.
- Support selected scenarios and selected sections.
- Generate a direct PDF file if practical; otherwise keep print fallback while introducing a server PDF endpoint.
- Add JSON snapshot export.

## 10.4 Output history

Record:

- output ID;
- timestamp;
- project version;
- selected sections;
- display currency and scale;
- file name;
- checksum where possible.

## Acceptance criteria

- Empty headings and empty tables are omitted.
- Intentional numeric zero is printed.
- A report can be reproduced from its project snapshot.
- Status history is visible.
- Rejected projects can be edited and resubmitted.

---

# 11. Phase 6 — Analytics

Implement only after project calculations and persistence are stable.

Initial dashboards:

- projects by status;
- investment by department;
- investment by purpose;
- payback distribution;
- NPV distribution;
- approval/rejection counts;
- upcoming planned approval/order/installation dates.

Do not build analytics from frontend localStorage. Use backend project summaries.

---

# 12. Required tests

## Unit tests

- currency conversion;
- display scaling invariance;
- line capacity;
- serial bottleneck;
- parallel capacity;
- labor cost;
- electricity cost;
- depreciation;
- investment aggregation;
- annual benefit;
- simple payback;
- discounted payback;
- annual ROI;
- cumulative ROI;
- NPV;
- IRR;
- break-even;
- validation rules;
- migration functions.

## Integration tests

- project CRUD;
- duplicate project;
- version conflict;
- migration import;
- invalid payload rejection;
- backup creation;
- backup restore;
- status transition;
- export/import round trip.

## UI tests

- create project;
- add proposal;
- select equipment quote;
- edit production assumptions;
- compare proposals;
- resolve validation error;
- prepare for review;
- configure report;
- print/export.

---

# 13. Migration mapping guidance

Map current frontend data as follows.

## Current `MockProject`

- `id` -> `Project.id`
- `projectNo` -> `Project.projectNo`
- `title` -> `Project.title`
- `department` -> `Project.common.department`
- `applicant` -> `Project.owner.name`
- common schedule fields -> `Project.common` or `Project.schedule`
- `targetProducts` -> `Project.common.targetProducts`
- scenario with `id === "current"` -> `Project.baseline`
- all other scenarios except pseudo conclusion -> `Project.proposals`
- `reportConclusion` -> project recommendation narrative
- `reportComparisonResult` -> comparison notes
- `reportOutputItems` -> `Project.reportConfig.sections`

## Current scenario data

- `lineUnits` -> scenario `lineUnits`
- `equipmentList` -> `capexItems`
- `additionalCosts` -> `capexItems`
- `effects`, `recovery`, `breakEven`, `laborCostDiff` -> explanation/legacy notes, not authoritative calculated values
- stored `investmentAmount`, `annualEffect`, `npv`, `irr`, `roi`, `recoveryYears` -> legacy result metadata only; recalculate after import

## Current equipment master

- create stable equipment IDs;
- retain current dynamic specs;
- convert quotes to normalized quote records;
- treat `baseAmount` as legacy cached data and recalculate;
- create revision 1.

## Migration warnings

Warn, but do not abort entire migration, when:

- scenario ID is missing;
- currency is unsupported;
- equipment is referenced by name only;
- numeric string cannot be parsed;
- duplicated project number exists;
- line connection references unknown unit;
- legacy computed results differ from new calculations.

---

# 14. Coding rules

- Use strict TypeScript.
- Prefer named domain types and discriminated unions.
- Use Zod at all external boundaries.
- Use pure functions for calculations and migrations.
- Keep UI components focused on rendering and interaction.
- Do not swallow exceptions with empty `catch` blocks.
- Do not use `Math.random()` for persistent IDs; use `crypto.randomUUID()`.
- Use ISO timestamps.
- Use IDs for references.
- Avoid storing duplicated derived state.
- Add comments for financial assumptions, not for obvious syntax.
- Keep Japanese UI text; use English identifiers and file names.

---

# 15. Commands that must succeed before each phase is complete

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

If a command is missing, add it. If the existing lint script is actually a typecheck command, correct the scripts so their names match their behavior.

---

# 16. First implementation assignment

Start with Phase 0 and the safe subset of Phase 1.

Deliver the following first:

1. Test tooling and representative fixtures.
2. Current calculation characterization tests.
3. `localStorage` full export function and UI action.
4. Shared Zod schema foundation.
5. Repository abstraction with atomic JSON saving and backups.
6. Typed project list/detail API.
7. A typed frontend API client.
8. A migration preview service, without deleting or overwriting legacy data.
9. Documentation of any current data that cannot be mapped safely.

Do not redesign every screen in the first change. Establish data safety, shared types, and test coverage before visual restructuring.

---

# 17. Definition of done for the overall project

- Backend JSON is the sole authoritative business-data store.
- Existing localStorage data can be migrated safely.
- `src/App.tsx` is an application shell, not the business system.
- Baseline and arbitrary proposals are supported.
- Capacity and financial calculations are centralized and tested.
- Currency display scale never changes calculation results.
- Master updates do not silently change existing projects.
- Validation controls review readiness.
- Status and output histories are recorded.
- Report values exactly match editor evaluation values.
- Typecheck, lint, test, and build all succeed.
