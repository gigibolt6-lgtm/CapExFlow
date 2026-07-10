/**
 * Phase 2: Data Management Infrastructure
 * Project Data Schema (TypeScript version of the requested schema)
 */

export interface ProjectMeta {
  projectId: string;
  projectNo: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdDate: string;
  updatedDate: string;
  archived: boolean;
}

export interface ApprovalInfo {
  approver: string;
  confirmers: string[];
  creator: string;
}

export interface BasicInfo {
  title: string;
  department: string;
  applicant: string;
  equipmentName: string;
  installationPlace: string;
  investmentType: string;
  projectType: string[];
}

export interface ProposalInfo {
  purpose: string;
  background: string;
  targetProcess: string;
  reason: string;
  impactIfNotIntroduced: string;
}

export interface ResultsInfo {
  expectedEffects: string;
  partInfo: {
    partNo: string;
    recentMonthlyVolume: number | null;
    currentWorkers: number | null;
    currentStandardTime: number | null;
    afterAutomationWorkers: number | null;
    afterAutomationTime: number | null;
  };
  beforeAfterComparison: any[];
}

export interface CalculationUnit {
  unitId: string;
  name: string;
  type: 'equipment' | 'process' | 'other';
  targetProcess: string;
  description: string;
  investment: {
    equipmentCost: number | null;
    designCost: number | null;
    processingCost: number | null;
    constructionCost: number | null;
    freightInsuranceCost: number | null;
    installationCost: number | null;
    otherCost: number | null;
  };
  effect: {
    items: any[];
  };
  laborDifference: {
    productionVolumePerMonth: number | null;
    workingHoursPerDay: number | null;
    hourlyRate: number | null;
    beforeWorkers: number | null;
    afterWorkers: number | null;
    beforeSpeedPerHour: number | null;
    afterSpeedPerHour: number | null;
  };
  breakEven: {
    productionConditions: {
      workingHoursPerDay: number | null;
      workingDaysPerMonth: number | null;
      layersPerPiece: number | null;
      plateThickness: number | null;
      simultaneousProduction: number | null;
      productWeightKg: number | null;
      materialYieldRate: number | null;
    };
    machineCapacity: {
      spm: number | null;
      powerConsumptionKw: number | null;
    };
    costConditions: {
      monthlyDepreciation: number | null;
      directWorkers: number | null;
      hourlyWage: number | null;
      materialCostPerKg: number | null;
      electricityCostPerKwh: number | null;
    };
    salesConditions: {
      sellingPricePerPiece: number | null;
    };
  };
  cashflow: {
    capitalCostRate: number | null;
    depreciationYears: number | null;
    taxRate: number | null;
    years: any[];
  };
  risks: any[];
  notes: string;
}

export interface Project {
  meta: ProjectMeta;
  approval: ApprovalInfo;
  basic: BasicInfo;
  proposal: ProposalInfo;
  results: ResultsInfo;
  units: CalculationUnit[];
  layoutPlan: {
    processLayout: string;
    factoryLayout: string;
    period: string;
    plans: any[];
  };
  issuesAndCountermeasures: {
    items: any[];
  };
  equipmentDetails: {
    maker: string;
    model: string;
    capacity: string;
    accuracy: string;
    speed: string;
    cost: number | null;
    consumables: string;
    maintenanceCost: number | null;
    comparison: string;
    selectionReason: string;
  };
  attachments: any[];
}

export interface ProjectsData {
  app: {
    name: string;
    version: string;
    schemaVersion: string;
  };
  projects: Project[];
}
