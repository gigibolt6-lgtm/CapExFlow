# CapExFlow

CapExFlow is a local-first application for preparing capital expenditure proposals, comparing equipment-introduction scenarios, calculating investment metrics, and generating approval documents.

## Current capabilities

- Project registration and editing
- Baseline and multiple proposal scenarios
- Equipment and quotation master data
- Line-unit and resource configuration
- Multi-currency input and conversion
- Investment, annual benefit, payback, NPV, IRR, ROI, and break-even calculations
- Scenario comparison
- Report section selection, preview, and browser PDF printing

The current implementation is an early prototype. Frontend business data is stored in `localStorage`, while a separate Express/JSON backend also exists. The redesign project will unify the domain model and make the backend store authoritative.

## Product and implementation documents

- [Product architecture, functions, workflow, and redesign specification](docs/CAPEXFLOW_PRODUCT_REDEFINITION.md)
- [Codex implementation project](CODEX_PROJECT.md)
- [Existing calculation requirements](docs/calculation_requirements.md)
- [Existing PDF output specification](docs/pdf_output_spec.md)

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Motion
- Node.js / Express
- JSON file storage

## Run locally

### Prerequisites

- Node.js
- npm

### Commands

```bash
npm install
npm run dev
```

The development server starts the Express API and Vite frontend together.

```text
http://localhost:3000
```

## Current repository structure

```text
src/App.tsx                    Current monolithic frontend prototype
server.ts                      Express server and API routes
backend/models                 Backend-only legacy project model
backend/services               JSON storage and backup services
docs                           Requirements and design documents
```

## Redesign direction

The redesign will be delivered incrementally. Its primary rules are:

1. Preserve and migrate existing localStorage data.
2. Use one shared Zod domain model across frontend and backend.
3. Use the backend JSON repository as the source of truth.
4. Move calculations out of React components into pure, tested modules.
5. Store money in normal currency units; treat 円/万円 as presentation only.
6. Preserve equipment and quotation snapshots inside projects.
7. Use one evaluation result for the editor, comparison screens, and reports.

See [CODEX_PROJECT.md](CODEX_PROJECT.md) for the implementation sequence and acceptance criteria.
