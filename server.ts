/**
 * main server entry point (Node.js/Express)
 */

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { initStore, loadStore, saveStore, getProjectById } from "./backend/services/project_store.ts";
import { generateProjectId, generateUnitId } from "./backend/services/id_service.ts";
import { Project, CalculationUnit } from "./backend/models/project_schema.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize data store
  await initStore();

  // --- API Routes ---

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Project List
  app.get("/api/projects", async (req, res) => {
    try {
      const data = await loadStore();
      const includeArchived = req.query.includeArchived === 'true';

      const summary = data.projects
        .filter(p => includeArchived || !p.meta.archived)
        .map(p => ({
          projectId: p.meta.projectId,
          projectNo: p.meta.projectNo,
          title: p.basic.title,
          equipmentName: p.basic.equipmentName,
          status: p.meta.status,
          updatedDate: p.meta.updatedDate,
          unitCount: p.units.length
        }));

      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  // Project Details
  app.get("/api/projects/:projectId", async (req, res) => {
    const project = await getProjectById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  });

  // Create Project
  app.post("/api/projects", async (req, res) => {
    try {
      const data = await loadStore();
      const now = new Date().toISOString();

      const newProject: Project = {
        meta: {
          projectId: generateProjectId(),
          projectNo: req.body.projectNo || "",
          status: 'draft',
          createdDate: now,
          updatedDate: now,
          archived: false
        },
        approval: {
          approver: "",
          confirmers: ["", "", ""],
          creator: req.body.applicant || ""
        },
        basic: {
          title: req.body.title || "",
          department: req.body.department || "",
          applicant: req.body.applicant || "",
          equipmentName: "",
          installationPlace: "",
          investmentType: "",
          projectType: []
        },
        proposal: {
          purpose: "",
          background: "",
          targetProcess: "",
          reason: "",
          impactIfNotIntroduced: ""
        },
        results: {
          expectedEffects: "",
          partInfo: {
            partNo: "",
            recentMonthlyVolume: null,
            currentWorkers: null,
            currentStandardTime: null,
            afterAutomationWorkers: null,
            afterAutomationTime: null
          },
          beforeAfterComparison: []
        },
        units: [],
        layoutPlan: {
          processLayout: "",
          factoryLayout: "",
          period: "",
          plans: []
        },
        issuesAndCountermeasures: {
          items: []
        },
        equipmentDetails: {
          maker: "",
          model: "",
          capacity: "",
          accuracy: "",
          speed: "",
          cost: null,
          consumables: "",
          maintenanceCost: null,
          comparison: "",
          selectionReason: ""
        },
        attachments: []
      };

      data.projects.push(newProject);
      await saveStore(data);
      res.status(201).json(newProject);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Update Project
  app.put("/api/projects/:projectId", async (req, res) => {
    try {
      const data = await loadStore();
      const index = data.projects.findIndex(p => p.meta.projectId === req.params.projectId);

      if (index === -1) {
        return res.status(404).json({ error: "Project not found" });
      }

      const updatedProject = {
        ...data.projects[index],
        ...req.body,
        meta: {
          ...data.projects[index].meta,
          updatedDate: new Date().toISOString()
        }
      };

      // Ensure projectId is not changed
      updatedProject.meta.projectId = req.params.projectId;

      data.projects[index] = updatedProject;
      await saveStore(data);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  // Duplicate Project
  app.post("/api/projects/:projectId/duplicate", async (req, res) => {
    try {
      const data = await loadStore();
      const source = data.projects.find(p => p.meta.projectId === req.params.projectId);

      if (!source) {
        return res.status(404).json({ error: "Source project not found" });
      }

      const now = new Date().toISOString();
      const newProjectId = generateProjectId();

      const duplicatedProject: Project = JSON.parse(JSON.stringify(source));
      duplicatedProject.meta = {
        projectId: newProjectId,
        projectNo: source.meta.projectNo ? `${source.meta.projectNo}_copy` : "",
        status: 'draft',
        createdDate: now,
        updatedDate: now,
        archived: false
      };
      duplicatedProject.basic.title = `${source.basic.title} コピー`;

      // Renew unit IDs
      duplicatedProject.units = duplicatedProject.units.map(unit => ({
        ...unit,
        unitId: generateUnitId()
      }));

      data.projects.push(duplicatedProject);
      await saveStore(data);
      res.status(201).json(duplicatedProject);
    } catch (error) {
      res.status(500).json({ error: "Failed to duplicate project" });
    }
  });

  // Archive Project
  app.post("/api/projects/:projectId/archive", async (req, res) => {
    try {
      const data = await loadStore();
      const project = data.projects.find(p => p.meta.projectId === req.params.projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      project.meta.archived = true;
      project.meta.updatedDate = new Date().toISOString();

      await saveStore(data);
      res.json({ message: "Project archived", projectId: req.params.projectId });
    } catch (error) {
      res.status(500).json({ error: "Failed to archive project" });
    }
  });

  // Delete Project
  app.delete("/api/projects/:projectId", async (req, res) => {
    try {
      const data = await loadStore();
      const index = data.projects.findIndex(p => p.meta.projectId === req.params.projectId);

      if (index === -1) {
        return res.status(404).json({ error: "Project not found" });
      }

      data.projects.splice(index, 1);
      await saveStore(data);
      res.json({ message: "Project deleted permanently" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // --- Calculation Unit API ---

  // Add Unit
  app.post("/api/projects/:projectId/units", async (req, res) => {
    try {
      const data = await loadStore();
      const project = data.projects.find(p => p.meta.projectId === req.params.projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const newUnit: CalculationUnit = {
        unitId: generateUnitId(),
        name: req.body.name || "新規ユニット",
        type: req.body.type || "equipment",
        targetProcess: req.body.targetProcess || "",
        description: "",
        investment: {
          equipmentCost: null,
          designCost: null,
          processingCost: null,
          constructionCost: null,
          freightInsuranceCost: null,
          installationCost: null,
          otherCost: null
        },
        effect: {
          items: []
        },
        laborDifference: {
          productionVolumePerMonth: null,
          workingHoursPerDay: null,
          hourlyRate: null,
          beforeWorkers: null,
          afterWorkers: null,
          beforeSpeedPerHour: null,
          afterSpeedPerHour: null
        },
        breakEven: {
          productionConditions: {
            workingHoursPerDay: null,
            workingDaysPerMonth: null,
            layersPerPiece: null,
            plateThickness: null,
            simultaneousProduction: null,
            productWeightKg: null,
            materialYieldRate: null
          },
          machineCapacity: {
            spm: null,
            powerConsumptionKw: null
          },
          costConditions: {
            monthlyDepreciation: null,
            directWorkers: null,
            hourlyWage: null,
            materialCostPerKg: null,
            electricityCostPerKwh: null
          },
          salesConditions: {
            sellingPricePerPiece: null
          }
        },
        cashflow: {
          capitalCostRate: null,
          depreciationYears: null,
          taxRate: null,
          years: []
        },
        risks: [],
        notes: ""
      };

      project.units.push(newUnit);
      project.meta.updatedDate = new Date().toISOString();

      await saveStore(data);
      res.status(201).json(newUnit);
    } catch (error) {
      res.status(500).json({ error: "Failed to add unit" });
    }
  });

  // Update Unit
  app.put("/api/projects/:projectId/units/:unitId", async (req, res) => {
    try {
      const data = await loadStore();
      const project = data.projects.find(p => p.meta.projectId === req.params.projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const unitIndex = project.units.findIndex(u => u.unitId === req.params.unitId);
      if (unitIndex === -1) {
        return res.status(404).json({ error: "Unit not found" });
      }

      project.units[unitIndex] = {
        ...project.units[unitIndex],
        ...req.body,
        unitId: req.params.unitId // Ensure ID doesn't change
      };

      project.meta.updatedDate = new Date().toISOString();

      await saveStore(data);
      res.json(project.units[unitIndex]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update unit" });
    }
  });

  // Delete Unit
  app.delete("/api/projects/:projectId/units/:unitId", async (req, res) => {
    try {
      const data = await loadStore();
      const project = data.projects.find(p => p.meta.projectId === req.params.projectId);

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      const unitIndex = project.units.findIndex(u => u.unitId === req.params.unitId);
      if (unitIndex === -1) {
        return res.status(404).json({ error: "Unit not found" });
      }

      project.units.splice(unitIndex, 1);
      project.meta.updatedDate = new Date().toISOString();

      await saveStore(data);
      res.json({ message: "Unit deleted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete unit" });
    }
  });

  // --- Serve Frontend ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Documentation available via API endpoints at /api/*`);
  });
}

startServer();
