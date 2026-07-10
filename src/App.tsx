/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useMemo,
} from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import {
  Sun,
  Moon,
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  PlusCircle,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  MinusSquare,
  Search,
  Filter,
  Database,
  History,
  LucideIcon,
  MoreHorizontal,
  Calculator,
  TrendingUp,
  Info,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  HelpCircle,
  Check,
  ShieldCheck,
  Lock,
  Pencil,
  Layers,
  Zap,
  Eye,
  Activity,
  AlertCircle,
  X,
  Box,
  Save,
  Download,
  Globe,
  Package,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---
type Theme = "light" | "dark";
type AppView =
  | "list"
  | "stats"
  | "settings"
  | "edit"
  | "master_db"
  | "master_line_unit_db"
  | "schema_master";

interface DynamicFieldDefinition {
  id: string;
  label: string;
  type: "number" | "string" | "select";
  unit?: string;
  options?: string[];
  isUndeletable?: boolean;
}

interface EquipmentSchema {
  id: string;
  category: string;
  middleCategory: string;
  subCategory: string;
  groups: FieldGroup[];
}

interface FieldGroup {
  id: string;
  label: string;
  fields: DynamicFieldDefinition[];
}

export const getCombinedSchemaGroups = (
  schemas: EquipmentSchema[],
  category: string,
  middleCategory: string,
  subCategory: string,
): FieldGroup[] => {
  const globalSchema = schemas.find((s) => s.id === "global_common");
  const catSchema =
    category !== ""
      ? schemas.find(
          (s) =>
            s.category === category &&
            s.middleCategory === "" &&
            s.subCategory === "",
        )
      : null;
  const midSchema =
    middleCategory !== ""
      ? schemas.find(
          (s) =>
            s.category === category &&
            s.middleCategory === middleCategory &&
            s.subCategory === "",
        )
      : null;
  const subSchema =
    subCategory !== ""
      ? schemas.find(
          (s) =>
            s.category === category &&
            s.middleCategory === middleCategory &&
            s.subCategory === subCategory,
        )
      : null;

  const groups: FieldGroup[] = [];
  const addedGroupIds = new Set<string>();

  const addGroups = (groupList?: FieldGroup[]) => {
    if (!groupList) return;
    groupList.forEach((g) => {
      if (!addedGroupIds.has(g.id)) {
        groups.push(g);
        addedGroupIds.add(g.id);
      }
    });
  };

  addGroups(globalSchema?.groups);
  addGroups(catSchema?.groups);
  addGroups(midSchema?.groups);
  addGroups(subSchema?.groups);

  return groups;
};

// --- Context ---
export const SettingsContext = createContext<{
  onAddSuggestion?: (fieldPath: string, val: string) => void;
  onDeleteSuggestion?: (fieldPath: string, val: string) => void;
}>({});

const DEFAULT_EQUIPMENT_SCHEMAS: EquipmentSchema[] = [
  {
    id: "global_common",
    category: "", // 全設備共通のシステムパラメータ（UIの分類一覧には表示させない）
    middleCategory: "",
    subCategory: "",
    groups: [
      {
        id: "global_basic",
        label: "全設備 共通基本パラメータ",
        fields: [
          {
            id: "managementNo",
            label: "管理番号",
            type: "string",
            isUndeletable: true,
          },
          {
            id: "spm",
            label: "SPM",
            type: "number",
            unit: "spm",
            isUndeletable: true,
          },
          {
            id: "powerConsumption",
            label: "定格電力",
            type: "number",
            unit: "kW",
            isUndeletable: true,
          },
        ],
      },
      {
        id: "global_mgmt",
        label: "その他管理情報",
        fields: [
          { id: "installationDate", label: "設置時期", type: "string" },
          { id: "location", label: "設置場所", type: "string" },
          { id: "powerSource", label: "電源", type: "string" },
        ],
      },
    ],
  },
  {
    id: "cat_machining",
    category: "加工設備",
    middleCategory: "",
    subCategory: "",
    groups: [],
  },
  {
    id: "mid_press_forming",
    category: "加工設備",
    middleCategory: "プレス・成形",
    subCategory: "",
    groups: [
      {
        id: "mid_press_basic",
        label: "プレス・成形 インフラ共通仕様",
        fields: [
          {
            id: "motorPower",
            label: "主電動機出力",
            type: "number",
            unit: "kW",
          },
          {
            id: "workEnergy",
            label: "許容仕事量",
            type: "number",
            unit: "kN・m",
          },
          {
            id: "airPressure",
            label: "使用空気圧",
            type: "number",
            unit: "MPa",
          },
        ],
      },
    ],
  },
  {
    id: "press_machine",
    category: "加工設備",
    middleCategory: "プレス・成形",
    subCategory: "プレス機",
    groups: [
      {
        id: "basic",
        label: "1. 本体主要仕様",
        fields: [
          { id: "frameType", label: "フレーム形式", type: "string" },
          { id: "driveSystem", label: "駆動方式", type: "string" },
          { id: "capacity", label: "加圧能力", type: "number", unit: "kN" },
          {
            id: "capacityPoint",
            label: "能力発生位置",
            type: "number",
            unit: "mm",
          },
          {
            id: "strokeLength",
            label: "ストローク長さ",
            type: "number",
            unit: "mm",
          },
          { id: "spm", label: "ストローク数", type: "string", unit: "spm" },
          { id: "dieHeight", label: "ダイハイト", type: "number", unit: "mm" },
          {
            id: "slideAdjustment",
            label: "スライド調整量",
            type: "number",
            unit: "mm",
          },
          {
            id: "bolsterSize",
            label: "ボルスタ寸法",
            type: "string",
            unit: "mm",
          },
          {
            id: "slideSize",
            label: "スライド下面寸法",
            type: "string",
            unit: "mm",
          },
          { id: "bolsterHeight", label: "ボルスタ上面高さ", type: "string" },
          {
            id: "sideOpening",
            label: "サイドオープニング",
            type: "string",
            unit: "mm",
          },
        ],
      },
      {
        id: "die_cushion",
        label: "2. ダイクッション仕様",
        fields: [
          {
            id: "dieCushionCapacity",
            label: "クッション能力",
            type: "number",
            unit: "ton",
          },
          {
            id: "dieCushionStroke",
            label: "ストローク",
            type: "number",
            unit: "mm",
          },
          {
            id: "dieCushionArea",
            label: "クッション面寸法",
            type: "string",
            unit: "mm",
          },
        ],
      },
    ],
  },
  {
    id: "tap_machine",
    category: "加工設備",
    middleCategory: "プレス・成形",
    subCategory: "TAP機",
    groups: [
      {
        id: "basic",
        label: "基本仕様",
        fields: [
          { id: "axes", label: "軸数", type: "number", unit: "軸" },
          { id: "pitch", label: "ピッチ", type: "number", unit: "mm" },
          { id: "area", label: "加工サイズ", type: "string", unit: "mm" },
        ],
      },
    ],
  },
  {
    id: "welding_machine",
    category: "加工設備",
    middleCategory: "接合・組立",
    subCategory: "溶接機",
    groups: [
      {
        id: "basic",
        label: "基本仕様",
        fields: [
          { id: "current", label: "電流", type: "number", unit: "A" },
          { id: "voltage", label: "電圧", type: "number", unit: "V" },
          { id: "pressure", label: "加圧力", type: "number", unit: "kN" },
        ],
      },
    ],
  },
  {
    id: "high_spin_riveter",
    category: "加工設備",
    middleCategory: "接合・組立",
    subCategory: "ハイスピンカシメ機",
    groups: [
      {
        id: "basic",
        label: "基本仕様",
        fields: [
          { id: "rpm", label: "回転数", type: "number", unit: "rpm" },
          { id: "speed", label: "下降速度", type: "number", unit: "mm/s" },
        ],
      },
    ],
  },
  {
    id: "conveyance_robot",
    category: "搬送設備",
    middleCategory: "マテハン",
    subCategory: "ロボット",
    groups: [
      {
        id: "basic",
        label: "基本仕様",
        fields: [
          { id: "payload", label: "可搬重量", type: "number", unit: "kg" },
          { id: "reach", label: "最大リーチ", type: "number", unit: "mm" },
          { id: "axes", label: "軸数", type: "number", unit: "軸" },
        ],
      },
    ],
  },
  {
    id: "inspection_system",
    category: "検査",
    middleCategory: "検査",
    subCategory: "画像検査装置",
    groups: [
      {
        id: "basic",
        label: "基本仕様",
        fields: [
          { id: "resolution", label: "解像度", type: "string", unit: "px" },
          {
            id: "processingSpeed",
            label: "処理速度",
            type: "number",
            unit: "ms/pcs",
          },
          { id: "fov", label: "視野範囲", type: "string" },
        ],
      },
    ],
  },
  {
    id: "cat_washer",
    category: "洗浄機",
    middleCategory: "",
    subCategory: "",
    groups: [
      {
        id: "washer_basic",
        label: "洗浄機 基本仕様",
        fields: [
          {
            id: "washMethod",
            label: "洗浄方式",
            type: "select",
            options: ["シャワー方式", "超音波方式", "浸漬方式", "真空洗浄方式"],
          },
          { id: "tankCount", label: "槽数", type: "number", unit: "槽" },
          { id: "tempRange", label: "洗浄温度", type: "string", unit: "℃" },
          {
            id: "cycleTime",
            label: "サイクルタイム",
            type: "number",
            unit: "sec",
          },
        ],
      },
    ],
  },
];

export type TreeNodeInfo = {
  id: string;
  label: string;
  children?: TreeNodeInfo[];
  disabled?: boolean;
  reason?: string;
};

export const getReportOutputTree = (project: any): TreeNodeInfo[] => [
  {
    id: "project_common",
    label: "プロジェクト共通情報",
    children: [
      {
        id: "management",
        label: "管理情報",
        children: [
          {
            id: "project_management",
            label: "案件管理",
            children: [
              { id: "management.subject", label: "件名" },
              { id: "management.project_no", label: "プロジェクト番号" },
              { id: "management.author", label: "作成者" },
              { id: "management.department", label: "部署名" },
              { id: "management.created_date", label: "作成日" },
            ],
          },
          {
            id: "schedule",
            label: "全体スケジュール",
            children: [
              { id: "schedule.approval_date", label: "稟議承認予定" },
              { id: "schedule.order_date", label: "発注予定" },
              { id: "schedule.delivery_date", label: "納入・稼働予定" },
            ],
          },
        ],
      },
      {
        id: "approval",
        label: "稟議内容・課題",
        children: [
          {
            id: "approval_content",
            label: "稟議内容",
            children: [
              { id: "approval.purpose", label: "1. 目的" },
              { id: "approval.background", label: "2. 背景" },
              { id: "approval.reason", label: "4. 導入理由" },
              { id: "approval.impact", label: "5. 導入しない場合の影響" },
            ],
          },
          {
            id: "current_issues",
            label: "現状課題",
            children: [{ id: "approval.issues", label: "3. 現状課題" }],
          },
        ],
      },
      {
        id: "production_conditions",
        label: "生産条件",
        children: [
          {
            id: "common_conditions",
            label: "共通生産条件",
            children: [
              { id: "conditions.common.product_name", label: "製品・ワーク" },
              { id: "conditions.common.annual_production", label: "生産量" },
              { id: "conditions.common.operating_days", label: "年間稼働日数" },
              {
                id: "conditions.common.operating_hours",
                label: "1日あたり稼働時間",
              },
              { id: "conditions.common.operating_rate", label: "稼働率目標" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "scenarios",
    label: "対策案・シナリオ",
    children: [
      {
        id: "overview",
        label: "シナリオ概要",
        children: [{ id: "scenarios.overview", label: "1. シナリオ概要" }],
      },
      {
        id: "target_scenarios",
        label: "詳細出力対象シナリオ",
        children: (project?.scenarios || []).map((s: any) => ({
          id: `scenarios.target.${s.id}`,
          label: s.name || "未命名シナリオ",
        })),
      },
      {
        id: "equipment",
        label: "設備構成・費用",
        children: [
          { id: "scenarios.line_units", label: "ラインユニット構成" },
          { id: "scenarios.equipment_details", label: "購入設備明細一覧" },
        ],
      },
      {
        id: "analysis",
        label: "効果・分析比較",
        children: [
          { id: "scenarios.effect", label: "導入効果比較" },
          { id: "scenarios.roi", label: "投資回収比較 (回収年数)" },
          { id: "scenarios.npv_irr_roi", label: "投資効果指標 (NPV, IRR, ROI)" },
          { id: "scenarios.bep", label: "損益分岐点詳細 (テキスト)" },
          { id: "scenarios.bep_chart", label: "損益分岐点 (グラフ)" },
          { id: "scenarios.labor_cost", label: "労務費差異分析" },
        ],
      },
    ],
  },
  {
    id: "conclusion",
    label: "総合結論",
    children: [
      {
        id: "conclusion_summary",
        label: "レポート総合結論",
        children: [{ id: "conclusion.summary", label: "結論・総合評価" }],
      },
      {
        id: "conclusion_comparison",
        label: "各案の定量比較",
        children: [
          {
            id: "conclusion.chart_investment",
            label: "グラフ: 初期費用と年間効果",
          },
          { id: "conclusion.chart_recovery", label: "グラフ: 投資回収年数" },
          { id: "conclusion.table_comparison", label: "表: 各案比較表" },
        ],
      },
    ],
  },
];

interface MasterQuote {
  id: string;
  vendorName: string;
  quoteNumber?: string;
  amount: number;
  currency: string;
  baseAmount: number; // in JPY or base currency for comparison
  installationCost: number;
  tax: number;
  taxRate?: number;
  taxType: "Included" | "Excluded";
  shippingCost: number;
  deliveryLeadTime: string;
  validUntil: string;
  isPreferred?: boolean;
  remarks?: string;
}

const CURRENCIES = [
  { code: "JPY", symbol: "¥", name: "日本円" },
  { code: "USD", symbol: "$", name: "USドル" },
  { code: "CNY", symbol: "¥", name: "中国元" },
  { code: "THB", symbol: "฿", name: "タイバーツ" },
  { code: "PHP", symbol: "₱", name: "フィリピンペソ" },
  { code: "PLN", symbol: "zł", name: "ポーランドズウォティ" },
];

const TAX_TYPES = [
  { id: "Included", label: "税込" },
  { id: "Excluded", label: "税抜" },
];

interface PressSpecifications {
  frameType: string; // フレーム形式
  driveSystem: string; // 駆動方式
  capacity: string; // 圧力能力 (kN/ton)
  capacityPoint: string; // 能力発生位置
  strokeLength: string; // ストローク長さ
  spm: string; // 毎分ストローク数
  dieHeight: string; // ダイ高さ
  slideAdjustment: string; // スライド調整量
  bolsterSize: string; // ボルスタ寸法
  slideSize: string; // スライド下面寸法
  bolsterHeight: string; // ボルスタ上面高さ
  sideOpening: string; // サイドオープニング
  motorPower: string; // 主電動機出力
  workEnergy: string; // 許容仕事量
  airPressure: string; // 使用空気圧
  powerSource: string; // 電源
  dieCushion?: {
    capacity: string;
    stroke: string;
    area: string;
  };
}

interface MasterEquipment {
  id: string;
  schemaId?: string; // Link to EquipmentSchema id
  category: string;
  middleCategory: string;
  subCategory: string;
  name: string;
  modelCode: string;
  manufacturer: string;
  pressSpecs?: PressSpecifications;
  dynamicSpecs?: Record<string, string>;
  description: string;
  tags: string[];
  quotes: MasterQuote[];
  investmentAmount?: number; // 参照投資額
  minOperatingRate?: number; // 想定最低稼働率 (%)
  depreciationMethod?: "定額" | "定率";
  residualValueRatio?: number; // %
  usefulLife?: number; // years
  spm: number; // SPM値
  powerConsumption: number; // 定格電力 (kW)
}

interface LineUnitMaster {
  id: string;
  name: string;
  description: string;
  workingHours: string;
  operatingRate: string;
  prevUnit: string;
  nextUnit: string;
  buffer: string;
  resources: any[];
  tags: string[];
  category: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  spec: string;
  quantity: number;
  price: number;
  currency?: string;
  category: "償却対象" | "非償却対象" | "要確認";
  vendor?: string;
  quoteRef?: string;
  masterEquipmentId?: string;
}

interface CostItem {
  id: string;
  name: string;
  amount: number;
  currency?: string;
  category: "償却対象" | "非償却対象" | "要確認";
}

interface TargetProduct {
  id: string;
  name: string;
  volumeType: "年間" | "月間";
  volume: number;
  unit: string;
  materialCostType: "材料比率" | "材料費";
  materialCost: number;
  sellingPriceType: "年間売上" | "月間売上" | "販売価格";
  sellingPrice: number;
  currency?: string;
}

interface ResourceItem {
  id: string;
  schemaId?: string;
  category?: string;
  middleCategory?: string;
  subCategory?: string;
  type: string;
  name: string;
  quantity: number;
  unit: string;
  spm: string;
  powerConsumption?: number; // 定格電力
  hourlyRate: string;
  operatingRate: string;
  usageTime: string;
  remarks: string;
  equipmentId?: string;
  dynamicSpecs?: Record<string, any>;
  isNew?: boolean;
}

interface LineUnit {
  id: string;
  number: string;
  name: string;
  order: number;
  line: string;
  prevUnit: string;
  nextUnit: string;
  buffer: string;
  resources: ResourceItem[];
  operatingRate?: string;
  workingHours?: string;
}

interface Scenario {
  id: string;
  name: string;
  investmentAmount?: number;
  annualEffect?: number;
  recoveryYears?: number;
  npv?: number;
  irr?: number;
  roi?: number;
  equipmentCount?: number;
  lineUnitCount?: number;
  bottleneckUnit?: string;
  lineCapacity?: string;
  equipmentConfig?: string;
  effects?: string;
  recovery?: string;
  breakEven?: string;
  laborCostDiff?: string;
  equipmentList?: EquipmentItem[];
  additionalCosts?: CostItem[];
  overview?: string;
  lineUnitDetails?: string;
  lineBalanceAnalysis?: string;
  lineUnits?: LineUnit[];
}

interface MockProject {
  id: string;
  projectNo: string;
  title: string;
  status: "draft" | "submitted" | "approved";
  investmentAmount: number;
  currency: string;
  recoveryYears: number;
  equipmentCount: number;
  updatedDate: string;
  department: string;
  applicant: string;
  investmentType: string;

  // Basic info tab additions
  factory?: string;
  relatedDepts?: string;
  caseType?: string;
  scheduleApproval?: string;
  scheduleOrder?: string;
  scheduleInstall?: string;
  scheduleMassProd?: string;
  unitDisplay?: string;
  calcPeriod?: string;
  costOfCapital?: string;

  // Approval content tab additions
  introPurpose?: string[];
  purposeDetail?: string;
  expectedState?: string;
  bgCategories?: string[];
  bgDetail?: string;
  bgTiming?: string;
  bgRelatedProducts?: string;
  bgMarketFactors?: string;
  issueCategories?: string[];
  issueDetail?: string;
  issueEvidence?: string;
  issueProcess?: string;
  issueInterim?: string;
  reasonIntro?: string;
  reasonExisting?: string;
  reasonChoice?: string;
  reasonTiming?: string;
  impactCategories?: string[];
  impactDetail?: string;
  impactAmount?: number;
  impactTiming?: string;

  // Production condition additions
  workingDaysPerMonth?: string;
  workingHoursPerDay?: string;
  electricityCostPerKwh?: string;
  electricityCurrency?: string;
  discountRate?: string;
  reportCurrency?: string;
  targetProducts?: TargetProduct[];

  // Report preparation additions
  reportConclusion?: string;
  reportComparisonResult?: string;
  reportOutputItems?: string[];

  scenarios: Scenario[];
}

// --- Theme Context ---
const ThemeContext = createContext<
  | {
      theme: Theme;
      toggleTheme: () => void;
    }
  | undefined
>(undefined);

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}

// --- Main App Component ---
export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [equipmentSchemas, setEquipmentSchemas] = useState<EquipmentSchema[]>(
    () => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("app_equipment_schemas");
          if (saved) return JSON.parse(saved);
        } catch (e) {}
      }
      return DEFAULT_EQUIPMENT_SCHEMAS;
    },
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "app_equipment_schemas",
        JSON.stringify(equipmentSchemas),
      );
    }
  }, [equipmentSchemas]);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") as Theme;
      return (
        saved ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light")
      );
    }
    return "light";
  });

  const [currentView, setCurrentView] = useState<AppView>("list");
  const [activeCategory, setActiveCategory] = useState<
    "common" | "scenarios" | "reports"
  >("common");
  const [globalSettings, setGlobalSettings] = useState(() => {
    let savedCustomSuggestions = {};
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("app_custom_suggestions");
        if (saved) savedCustomSuggestions = JSON.parse(saved);
      } catch (e) {}
    }
    return {
      defaultCurrency: "JPY",
      defaultDiscountRate: "5.0",
      exchangeRates: {
        USD: 154.5,
        EUR: 167.2,
        CNY: 21.3,
        THB: 4.2,
        VND: 0.0061,
        MXN: 9.1,
      } as Record<string, number>,
      exchangeRateSource: "社内規定為替レート",
      exchangeRateDate: "2024-05-01",
      customSuggestions: savedCustomSuggestions as Record<string, string[]>,
    };
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "app_custom_suggestions",
        JSON.stringify(globalSettings.customSuggestions),
      );
    }
  }, [globalSettings.customSuggestions]);

  const handleAddSuggestion = (fieldPath: string, val: string) => {
    if (!val || val.trim() === "") return;
    setGlobalSettings((prev: any) => {
      const current = prev.customSuggestions?.[fieldPath] || [];
      if (current.includes(val)) return prev;
      return {
        ...prev,
        customSuggestions: {
          ...prev.customSuggestions,
          [fieldPath]: [...current, val],
        },
      };
    });
  };

  const handleDeleteSuggestion = (fieldPath: string, val: string) => {
    setGlobalSettings((prev: any) => {
      const current = prev.customSuggestions?.[fieldPath] || [];
      return {
        ...prev,
        customSuggestions: {
          ...prev.customSuggestions,
          [fieldPath]: current.filter((v: string) => v !== val),
        },
      };
    });
  };

  const [projects, setProjects] = useState<MockProject[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("app_projects");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("app_projects", JSON.stringify(projects));
    }
  }, [projects]);

  const [masterEquipment, setMasterEquipment] = useState<MasterEquipment[]>(
    () => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("app_master_equipment");
          if (saved) return JSON.parse(saved);
        } catch (e) {}
      }
      return [];
    },
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "app_master_equipment",
        JSON.stringify(masterEquipment),
      );
    }
  }, [masterEquipment]);

  const [masterLineUnits, setMasterLineUnits] = useState<LineUnitMaster[]>(
    () => {
      if (typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem("app_master_line_units");
          if (saved) return JSON.parse(saved);
        } catch (e) {}
      }
      return [
        {
          id: "LUM-1",
          name: "標準プレス工程 (300t)",
          description:
            "単発プレス機を使用した一般的な加工ユニット。人員1名、プレス機1台の構成。",
          workingHours: "160",
          operatingRate: "95",
          prevUnit: "",
          nextUnit: "",
          buffer: "0",
          category: "加工設備",
          tags: ["標準", "300t"],
          resources: [
            {
              id: "r1",
              type: "人員",
              name: "プレス作業者",
              quantity: 1,
              unit: "名",
              spm: "-",
              hourlyRate: "3500",
              operatingRate: "95",
              usageTime: "8",
              remarks: "標準単価",
            },
            {
              id: "r2",
              type: "設備",
              name: "メカニカルプレス 300t",
              quantity: 1,
              unit: "台",
              spm: "45",
              hourlyRate: "5000",
              operatingRate: "95",
              usageTime: "8",
              remarks: "マスタ参照",
              isNew: true,
            },
          ],
        },
        {
          id: "LUM-2",
          name: "自動検査ユニット (カメラ方式)",
          description: "画像処理システムによる全数外観検査ユニット。",
          workingHours: "160",
          operatingRate: "98",
          prevUnit: "",
          nextUnit: "",
          buffer: "20",
          category: "検査",
          tags: ["自動化", "検査"],
          resources: [
            {
              id: "r1",
              type: "設備",
              name: "画像検査装置 V3",
              quantity: 1,
              unit: "台",
              spm: "120",
              hourlyRate: "1200",
              operatingRate: "98",
              usageTime: "8",
              remarks: "高速",
              isNew: true,
              schemaId: "inspection_system",
            },
            {
              id: "r2",
              type: "人員",
              name: "検査補助",
              quantity: 0.5,
              unit: "名",
              spm: "-",
              hourlyRate: "2800",
              operatingRate: "98",
              usageTime: "8",
              remarks: "半蔵",
            },
          ],
        },
      ];
    },
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "app_master_line_units",
        JSON.stringify(masterLineUnits),
      );
    }
  }, [masterLineUnits]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [dialog, setDialog] = useState<{
    type: "confirm" | "alert" | "prompt";
    title: string;
    message: string;
    onConfirm: (val?: string) => void;
    defaultValue?: string;
    isDestructive?: boolean;
  } | null>(null);

  useEffect(() => {
    // Only set initial data if no saved data exists
    if (
      typeof window !== "undefined" &&
      !localStorage.getItem("app_master_equipment")
    ) {
      setMasterEquipment([
        {
          id: "me1",
          schemaId: "press_machine",
          category: "加工設備",
          middleCategory: "プレス・成形",
          subCategory: "プレス機",
          name: "メカニカルプレス 300t",
          modelCode: "L1B300-BM(L)",
          manufacturer: "コマツ産機",
          description: "汎用性に優れた3000kNストレートサイドプレス。",
          tags: ["高剛性", "300t", "リンクモーション"],
          dynamicSpecs: {
            managementNo: "MGT-2026-X01",
            installationDate: "2026-05-12",
            location: "第2工場",
            frameType: "ストレートサイド",
            driveSystem: "リンクモーション",
            capacity: "3000",
            capacityPoint: "13",
            strokeLength: "250",
            spm: "25-50",
            dieHeight: "600",
            slideAdjustment: "150",
            bolsterSize: "1000 x 900",
            slideSize: "1000 x 1000",
            bolsterHeight: "FL + 850",
            sideOpening: "1100",
            dieCushionCapacity: "24",
            dieCushionStroke: "110",
            dieCushionArea: "650 x 650",
            motorPower: "37",
            workEnergy: "16.0",
            airPressure: "0.6",
            powerSource: "200V",
          },
          pressSpecs: {
            frameType: "ストレートサイド",
            driveSystem: "リンクモーション",
            capacity: "3000 kN",
            capacityPoint: "13 mm",
            strokeLength: "250 mm",
            spm: "25-50",
            dieHeight: "600 mm",
            slideAdjustment: "150 mm",
            bolsterSize: "1000 x 900 mm",
            slideSize: "1000 x 1000 mm",
            bolsterHeight: "FL + 850 mm",
            sideOpening: "1100 mm",
            motorPower: "37 kW",
            workEnergy: "16.0 kN・m",
            airPressure: "0.5 - 0.8 MPa",
            powerSource: "200V / 220V / 380V",
            dieCushion: {
              capacity: "24 ton",
              stroke: "110 mm",
              area: "650 x 650 mm",
            },
          },
          quotes: [
            {
              id: "q1",
              vendorName: "コマツエレクトロニクス",
              amount: 65000000,
              currency: "JPY",
              baseAmount: 65000000,
              installationCost: 4500000,
              tax: 6500000,
              shippingCost: 1500000,
              deliveryLeadTime: "10ヶ月",
              validUntil: "2026-12-31",
              isPreferred: true,
              remarks: "標準仕様一式。据付指導含む。",
            },
          ],
          investmentAmount: 65000000,
          minOperatingRate: 80,
          depreciationMethod: "定額",
          residualValueRatio: 5,
          usefulLife: 10,
          spm: 37,
          powerConsumption: 30,
        },
        {
          id: "me2",
          schemaId: "conveyance_robot",
          category: "搬送設備",
          middleCategory: "マテハン",
          subCategory: "ロボット",
          name: "多関節搬送ロボット",
          modelCode: "R-2000iC",
          manufacturer: "FANUC",
          description: "高速・高精度なワーク搬送。",
          tags: ["溶接", "搬送", "高速"],
          dynamicSpecs: {
            managementNo: "MGT-2026-X02",
            installationDate: "2026-05-12",
            location: "第1工場",
            payload: "210",
            reach: "2655",
            axes: "6",
          },
          quotes: [],
          investmentAmount: 12000000,
          minOperatingRate: 90,
          depreciationMethod: "定額",
          residualValueRatio: 5,
          usefulLife: 10,
          spm: 0,
          powerConsumption: 5,
        },
        {
          id: "me3",
          schemaId: "inspection_system",
          category: "検査",
          middleCategory: "検査",
          subCategory: "画像検査装置",
          name: "画像検査装置 V3",
          modelCode: "VS-X500",
          manufacturer: "キーエンス",
          description: "AI搭載型画像検査システム。",
          tags: ["AI", "検査", "高精度"],
          dynamicSpecs: {
            managementNo: "MGT-2026-X03",
            installationDate: "2026-05-12",
            location: "第2工場",
            resolution: "2000万画素",
            processingSpeed: "10",
            fov: "100x100",
          },
          quotes: [],
          investmentAmount: 5000000,
          minOperatingRate: 95,
          depreciationMethod: "定額",
          residualValueRatio: 0,
          usefulLife: 5,
          spm: 0,
          powerConsumption: 2,
        },
      ]);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const handleCreateProject = (
    formData: Omit<
      MockProject,
      | "id"
      | "status"
      | "updatedDate"
      | "investmentAmount"
      | "recoveryYears"
      | "equipmentCount"
      | "currency"
      | "scenarios"
    >,
  ) => {
    const newProject: MockProject = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      status: "draft",
      investmentAmount: 0,
      currency: globalSettings.defaultCurrency,
      reportCurrency: globalSettings.defaultCurrency,
      discountRate: globalSettings.defaultDiscountRate,
      recoveryYears: 0,
      equipmentCount: 0,
      updatedDate: new Date().toLocaleDateString("ja-JP"),
      scenarios: [
        {
          id: "a",
          name: "A案",
          investmentAmount: 0,
          recoveryYears: 0,
          equipmentCount: 0,
        },
        {
          id: "b",
          name: "B案",
          investmentAmount: 0,
          recoveryYears: 0,
          equipmentCount: 0,
        },
        {
          id: "c",
          name: "C案",
          investmentAmount: 0,
          recoveryYears: 0,
          equipmentCount: 0,
        },
      ],
    };
    setProjects([newProject, ...projects]);
    setIsModalOpen(false);
    setSelectedProjectId(newProject.id);
    setCurrentView("edit");
    setActiveCategory("common");
  };

  // Currency Conversion Helper
  const convertAmount = (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ) => {
    if (fromCurrency === toCurrency) return amount;

    // Assume exchangeRates are relative to JPY (from JPY to X)
    // Here our rates are USD: 154.5 JPY (meaning 1 USD = 154.5 JPY)
    // To convert from USD to JPY: amount * rate
    // To convert from JPY to USD: amount / rate

    const rates = globalSettings.exchangeRates;
    let amountInJPY = amount;

    if (fromCurrency !== "JPY") {
      const rateFrom = rates[fromCurrency];
      if (!rateFrom) return amount; // Fallback
      amountInJPY = amount * rateFrom;
    }

    if (toCurrency === "JPY") return amountInJPY;

    const rateTo = rates[toCurrency];
    if (!rateTo) return amountInJPY;
    return amountInJPY / rateTo;
  };

  const handleImportSampleData = () => {
    const samples: MockProject[] = [
      {
        id: "sample-1",
        projectNo: "2026-001",
        title: "第2工場プレス機自動化の件",
        status: "draft",
        investmentAmount: 450000000,
        currency: "JPY",
        recoveryYears: 3.2,
        equipmentCount: 3,
        updatedDate: "2026-05-08",
        department: "生産技術部",
        applicant: "山田 太郎",
        investmentType: "合理化",
        discountRate: "5.0",
        reportCurrency: "JPY",
        scenarios: [
          {
            id: "a",
            name: "A案",
            investmentAmount: 450000000,
            recoveryYears: 3.2,
            equipmentCount: 12,
            lineUnitCount: 3,
            bottleneckUnit: "洗浄工程",
            lineCapacity: "42,000pcs/月",
            annualEffect: 14000,
            npv: 8500,
            irr: 12.5,
            roi: 18.2,
            lineUnits: [
              {
                id: "lu1",
                number: "U01",
                name: "プレス加工",
                order: 1,
                line: "Aライン",
                prevUnit: "材料提供",
                nextUnit: "洗浄工程",
                buffer: "無",
                resources: [
                  {
                    id: "r1",
                    type: "人員",
                    name: "作業者",
                    quantity: 1,
                    unit: "人",
                    spm: "-",
                    hourlyRate: "2500",
                    operatingRate: "85",
                    usageTime: "8",
                    remarks: "熟練工",
                  },
                  {
                    id: "r2",
                    type: "設備",
                    name: "プレス機 A-01",
                    quantity: 1,
                    unit: "台",
                    spm: "400",
                    hourlyRate: "12000",
                    operatingRate: "75",
                    usageTime: "8",
                    remarks: "高精度",
                    dynamicSpecs: {
                      managementNo: "PR-2026-A01",
                      installationDate: "2026-05-12",
                      location: "第1工場",
                    },
                  },
                  {
                    id: "r3",
                    type: "エネルギー",
                    name: "電力",
                    quantity: 15,
                    unit: "kW",
                    spm: "-",
                    hourlyRate: "30",
                    operatingRate: "-",
                    usageTime: "8",
                    remarks: "-",
                  },
                ],
              },
              {
                id: "lu2",
                number: "U02",
                name: "洗浄工程",
                order: 2,
                line: "Aライン",
                prevUnit: "プレス加工",
                nextUnit: "検査工程",
                buffer: "有（30個）",
                resources: [
                  {
                    id: "r4",
                    type: "人員",
                    name: "監視者",
                    quantity: 0.5,
                    unit: "人",
                    spm: "-",
                    hourlyRate: "2500",
                    operatingRate: "95",
                    usageTime: "8",
                    remarks: "兼務あり",
                  },
                  {
                    id: "r5",
                    type: "設備",
                    name: "自動洗浄機 V2",
                    quantity: 1,
                    unit: "台",
                    spm: "350",
                    hourlyRate: "5000",
                    operatingRate: "90",
                    usageTime: "8",
                    remarks: "-",
                    dynamicSpecs: {
                      managementNo: "CL-2026-V02",
                      installationDate: "2026-05-12",
                      location: "第1工場",
                    },
                  },
                ],
              },
            ],
          },
          {
            id: "b",
            name: "B案",
            investmentAmount: 380000000,
            recoveryYears: 4.1,
            equipmentCount: 8,
            lineUnitCount: 2,
            bottleneckUnit: "プレス加工",
            lineCapacity: "35,000pcs/月",
            annualEffect: 9000,
            npv: 3000,
            irr: 8.4,
            roi: 12.1,
          },
          {
            id: "c",
            name: "C案",
            investmentAmount: 520000000,
            recoveryYears: 2.8,
            equipmentCount: 15,
            lineUnitCount: 4,
            bottleneckUnit: "検査工程",
            lineCapacity: "48,000pcs/月",
            annualEffect: 18500,
            npv: 12000,
            irr: 15.2,
            roi: 22.4,
          },
        ],
      },
      {
        id: "sample-2",
        projectNo: "2026-002",
        title: "新ラインマテハンロボット導入",
        status: "submitted",
        investmentAmount: 120000000,
        currency: "JPY",
        recoveryYears: 2.1,
        equipmentCount: 1,
        updatedDate: "2026-05-07",
        department: "第一製造部",
        applicant: "佐藤 次郎",
        investmentType: "増産",
        discountRate: "5.0",
        reportCurrency: "JPY",
        scenarios: [
          {
            id: "a",
            name: "A案",
            investmentAmount: 120000000,
            recoveryYears: 2.1,
            equipmentCount: 5,
            lineUnitCount: 2,
            bottleneckUnit: "溶接工程",
            lineCapacity: "5,000pcs/月",
            annualEffect: 5800,
            npv: 4200,
            irr: 18.5,
            roi: 25.4,
          },
          {
            id: "b",
            name: "B案",
            investmentAmount: 100000000,
            recoveryYears: 2.5,
            equipmentCount: 4,
            lineUnitCount: 2,
            bottleneckUnit: "マテハン",
            lineCapacity: "4,500pcs/月",
            annualEffect: 4000,
            npv: 1500,
            irr: 14.2,
            roi: 19.8,
          },
          {
            id: "c",
            name: "C案",
            investmentAmount: 150000000,
            recoveryYears: 1.8,
            equipmentCount: 7,
            lineUnitCount: 3,
            bottleneckUnit: "検査工程",
            lineCapacity: "6,200pcs/月",
            annualEffect: 8500,
            npv: 6800,
            irr: 22.1,
            roi: 31.2,
          },
        ],
      },
    ];
    setProjects(samples);
  };

  const handleSaveProject = (updatedProject: any) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
    );
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <SettingsContext.Provider
      value={{
        onAddSuggestion: handleAddSuggestion,
        onDeleteSuggestion: handleDeleteSuggestion,
      }}
    >
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div className="h-screen print:h-auto overflow-hidden print:overflow-visible bg-[var(--color-bg-main)] text-[var(--color-text-main)] font-sans antialiased flex flex-col">
          {/* Header */}
          <header className="flex-shrink-0 z-40 w-full border-b border-[var(--color-border-main)] bg-[var(--color-bg-main)]/80 backdrop-blur-md print:hidden">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setCurrentView("list")}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                  設備導入稟議作成
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[var(--color-border-main)] flex flex-col bg-[var(--color-bg-main)] print:hidden">
              <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                <SidebarItem
                  icon={LayoutDashboard}
                  label="案件一覧"
                  active={currentView === "list" || currentView === "edit"}
                  onClick={() => setCurrentView("list")}
                />

                <AnimatePresence>
                  {currentView === "edit" && selectedProject && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-gray-50/50 dark:bg-gray-900/40 rounded-xl mt-1 mb-4 flex flex-col gap-0.5 p-1 border border-[var(--color-border-main)]/30"
                    >
                      <SidebarSubItem
                        icon={LayoutDashboard}
                        label="プロジェクト共通情報"
                        active={activeCategory === "common"}
                        onClick={() => setActiveCategory("common")}
                      />
                      <SidebarSubItem
                        icon={TrendingUp}
                        label="対策案・シナリオ"
                        active={activeCategory === "scenarios"}
                        onClick={() => setActiveCategory("scenarios")}
                      />
                      <SidebarSubItem
                        icon={FileText}
                        label="レポート作成"
                        active={activeCategory === "reports"}
                        onClick={() => setActiveCategory("reports")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <SidebarItem
                  icon={Database}
                  label="設備DB・見積DB"
                  active={currentView === "master_db"}
                  onClick={() => setCurrentView("master_db")}
                />
                <SidebarItem
                  icon={Box}
                  label="ラインユニットDB"
                  active={currentView === "master_line_unit_db"}
                  onClick={() => setCurrentView("master_line_unit_db")}
                />
                <SidebarItem
                  icon={BarChart3}
                  label="統計・分析"
                  active={currentView === "stats"}
                  onClick={() => setCurrentView("stats")}
                />

                <div className="pt-4 mt-4 border-t border-[var(--color-border-main)]">
                  <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] opacity-50">
                    マスタ・ツール
                  </p>
                  <SidebarItem icon={FileText} label="テンプレート" disabled />
                  <SidebarItem icon={History} label="出力履歴" disabled />
                  {isAdmin && (
                    <SidebarItem
                      icon={ShieldCheck}
                      label="設備構造定義"
                      active={currentView === "schema_master"}
                      onClick={() => setCurrentView("schema_master")}
                    />
                  )}
                  <SidebarItem icon={Database} label="バックアップ" disabled />
                </div>

                <div className="pt-4 mt-4 border-t border-[var(--color-border-main)]">
                  <SidebarItem
                    icon={Settings}
                    label="設定"
                    active={currentView === "settings"}
                    onClick={() => setCurrentView("settings")}
                  />
                </div>
              </nav>

              <div className="p-4 border-t border-[var(--color-border-main)] text-[10px] text-[var(--color-brand-secondary)] flex justify-between">
                <span>Version 0.2.0 (Phase 2 Refined)</span>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 bg-[var(--color-bg-main)]/50 flex flex-col relative overflow-hidden print:overflow-visible print:block">
              <AnimatePresence mode="wait">
                {currentView === "list" && (
                  <ListView
                    key="list"
                    projects={projects}
                    onCreateClick={() => setIsModalOpen(true)}
                    onImportClick={handleImportSampleData}
                    onProjectClick={(id) => {
                      setSelectedProjectId(id);
                      setCurrentView("edit");
                      setActiveCategory("common");
                    }}
                  />
                )}
                {currentView === "master_db" && (
                  <MasterDatabaseView
                    key="master_db"
                    equipment={masterEquipment}
                    schemas={equipmentSchemas}
                    globalSettings={globalSettings}
                    setGlobalSettings={setGlobalSettings}
                    onSave={setMasterEquipment}
                    setDialog={setDialog}
                  />
                )}
                {currentView === "master_line_unit_db" && (
                  <MasterLineUnitDatabaseView
                    key="master_line_unit_db"
                    lineUnits={masterLineUnits}
                    equipment={masterEquipment}
                    schemas={equipmentSchemas}
                    onSave={setMasterLineUnits}
                    setDialog={setDialog}
                  />
                )}
                {currentView === "edit" && selectedProject && (
                  <EditView
                    key="edit"
                    project={selectedProject}
                    allProjects={projects}
                    masterEquipment={masterEquipment}
                    masterLineUnits={masterLineUnits}
                    masterSchemas={equipmentSchemas}
                    globalSettings={globalSettings}
                    setGlobalSettings={setGlobalSettings}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    onSave={handleSaveProject}
                    onSaveLineUnitToMaster={(lu) =>
                      setMasterLineUnits((prev) => [...prev, lu])
                    }
                    onBack={() => setCurrentView("list")}
                    setDialog={setDialog}
                    convertAmount={convertAmount}
                  />
                )}
                {currentView === "stats" && <StatsView key="stats" />}
                {currentView === "schema_master" && (
                  <AdminSchemaManager
                    schemas={equipmentSchemas}
                    onUpdate={setEquipmentSchemas}
                    masterEquipment={masterEquipment}
                    onUpdateEquipment={setMasterEquipment}
                    projects={projects}
                    onUpdateProjects={setProjects}
                    masterLineUnits={masterLineUnits}
                    setDialog={setDialog}
                  />
                )}
                {currentView === "settings" && (
                  <SettingsView
                    isAdmin={isAdmin}
                    setIsAdmin={setIsAdmin}
                    settings={globalSettings}
                    onUpdateSettings={(s) => setGlobalSettings(s)}
                  />
                )}
              </AnimatePresence>
            </main>
          </div>

          {/* Modals */}
          <AnimatePresence>
            {isModalOpen && (
              <NewProjectModal
                key="new-project-modal"
                suggestedNo={`${new Date().getFullYear()}-${(projects.length + 1).toString().padStart(3, "0")}`}
                projects={projects}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateProject}
              />
            )}
          </AnimatePresence>

          {dialog && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-800"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${dialog.type === "confirm" ? (dialog.isDestructive ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600") : dialog.type === "alert" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}
                    >
                      {dialog.type === "confirm" ? (
                        <HelpCircle className="w-6 h-6" />
                      ) : dialog.type === "alert" ? (
                        <AlertCircle className="w-6 h-6" />
                      ) : (
                        <Pencil className="w-6 h-6" />
                      )}
                    </div>
                    <h4 className="text-lg font-black text-gray-900 dark:text-white">
                      {dialog.title}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {dialog.message}
                  </p>

                  {dialog.type === "prompt" && (
                    <input
                      type="text"
                      autoFocus
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                      defaultValue={dialog.defaultValue}
                      id="dialog-prompt-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          dialog.onConfirm(
                            (e.currentTarget as HTMLInputElement).value,
                          );
                        }
                      }}
                    />
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    {(dialog.type === "confirm" ||
                      dialog.type === "prompt") && (
                      <button
                        onClick={() => setDialog(null)}
                        className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-xl text-sm hover:bg-gray-200"
                      >
                        キャンセル
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (dialog.type === "prompt") {
                          const val = (
                            document.getElementById(
                              "dialog-prompt-input",
                            ) as HTMLInputElement
                          )?.value;
                          dialog.onConfirm(val);
                        } else {
                          dialog.onConfirm();
                        }
                      }}
                      className={`flex-1 py-3 px-4 font-bold rounded-xl text-sm shadow-lg text-white ${dialog.isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                      確定
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </ThemeContext.Provider>
    </SettingsContext.Provider>
  );
}

// --- View Components ---

function ListView({
  projects,
  onCreateClick,
  onImportClick,
  onProjectClick,
}: {
  projects: MockProject[];
  onCreateClick: () => void;
  onImportClick: () => void;
  onProjectClick: (id: string) => void;
  key?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="flex-shrink-0 p-8 pb-6 max-w-6xl mx-auto w-full">
        <div className="flex items-end justify-between border-b border-[var(--color-border-main)] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Project Management
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-[var(--color-text-main)]">
              案件一覧
            </h2>
            <p className="text-sm text-[var(--color-brand-secondary)] font-medium">
              設備導入に関わる全ての稟議案件を管理・閲覧できます。
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                className="p-2 border border-[var(--color-border-main)] rounded-lg hover:bg-[var(--color-border-main)]/10"
                title="検索"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                className="p-2 border border-[var(--color-border-main)] rounded-lg hover:bg-[var(--color-border-main)]/10"
                title="フィルター"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>新規案件作成</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
        <div className="max-w-6xl mx-auto space-y-2">
          {projects.length === 0 ? (
            <div className="border border-[var(--color-border-main)] border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-[var(--color-bg-main)]">
              <div className="w-20 h-20 rounded-full bg-blue-600/5 flex items-center justify-center mb-6">
                <FileText className="w-10 h-10 text-blue-600/50" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                新規案件を登録しましょう
              </h3>
              <p className="text-[var(--color-brand-secondary)] max-w-sm mb-8 leading-relaxed">
                現在、登録されている案件はありません。新しい設備導入の計画がある場合は、下のボタンから作成を開始してください。
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={onCreateClick}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-semibold shadow-md hover:shadow-lg active:scale-95"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>新規案件を作成</span>
                </button>
                <button
                  onClick={onImportClick}
                  className="text-blue-600 font-medium hover:underline text-sm"
                >
                  サンプルデータをインポート
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={onImportClick}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  サンプルデータを再読み込み
                </button>
              </div>
              <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--color-border-main)]/10 border-b border-[var(--color-border-main)]">
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                        案件番号
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                        案件名
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                        状態
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-right">
                        額 (万円)
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-center">
                        回収 (年)
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-center">
                        設備点数
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-right">
                        更新日
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-main)]">
                    {projects.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => onProjectClick(project.id)}
                        className="hover:bg-[var(--color-border-main)]/5 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-4 text-sm font-mono text-[var(--color-brand-secondary)]">
                          {project.projectNo}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-[var(--color-text-main)] group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                              {project.title}
                            </span>
                            <span className="text-[10px] text-[var(--color-brand-secondary)]">
                              {project.department}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            下書き
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-right font-medium">
                          {project.currency !== "JPY" && (
                            <span className="text-[10px] mr-1 text-[var(--color-brand-secondary)]">
                              ({project.currency})
                            </span>
                          )}
                          {(project.investmentAmount / 10000).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-center">
                          {project.recoveryYears.toFixed(1)}
                        </td>
                        <td className="px-4 py-4 text-sm text-center">
                          {project.equipmentCount}
                        </td>
                        <td className="px-4 py-4 text-xs text-[var(--color-brand-secondary)] text-right">
                          {project.updatedDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ResourceEditModal({
  resource,
  onClose,
  onSave,
  schemas,
}: {
  resource: any;
  onClose: () => void;
  onSave: (updates: any) => void;
  schemas: EquipmentSchema[];
}) {
  const [formData, setFormData] = useState({
    ...resource,
    dynamicSpecs: resource.dynamicSpecs || {},
  });
  const isEnergy = resource.type === "エネルギー";
  const isEquipment = formData.type === "設備";

  const combinedGroups = isEquipment
    ? getCombinedSchemaGroups(
        schemas,
        formData.category,
        formData.middleCategory,
        formData.subCategory,
      )
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDynamicFieldChange = (fieldId: string, value: string) => {
    const updates: any = {
      dynamicSpecs: {
        ...(formData.dynamicSpecs || {}),
        [fieldId]: value,
      },
    };
    if (fieldId === "spm") updates.spm = value;
    if (fieldId === "powerConsumption")
      updates.powerConsumption = parseFloat(value) || 0;

    setFormData({
      ...formData,
      ...updates,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--color-bg-main)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-[var(--color-border-main)] flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-[var(--color-border-main)] flex items-center justify-between bg-gray-50 dark:bg-gray-800 shrink-0">
          <div>
            <h3 className="font-bold">リソース詳細編集</h3>
            {isEnergy && (
              <p className="text-[10px] text-amber-600 font-bold">
                ※エネルギー項目は設備構成より自動算出されます
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto custom-scrollbar"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                種別
              </label>
              <select
                disabled={isEnergy}
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-50"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option value="人員">人員</option>
                <option value="設備">設備</option>
                <option value="エネルギー">エネルギー</option>
                <option value="場所/スペース">場所/スペース</option>
                <option value="治具・金型">治具・金型</option>
                <option value="その他">その他</option>
              </select>
            </div>
            {isEquipment && (
              <div className="col-span-2 space-y-2 pb-4 border-b border-[var(--color-border-main)]">
                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                  設備分類選択 (マスター登録済み)
                </label>
                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-[var(--color-border-main)] overflow-y-auto max-h-[300px] custom-scrollbar">
                  <ClassificationTree
                    schemas={schemas}
                    selectedId={
                      formData.schemaId ||
                      schemas.find(
                        (s) => s.subCategory === formData.subCategory,
                      )?.id
                    }
                    onSelect={(schema) => {
                      setFormData({
                        ...formData,
                        schemaId: schema.id,
                        category: schema.category,
                        middleCategory: schema.middleCategory,
                        subCategory: schema.subCategory,
                      });
                    }}
                  />
                </div>
              </div>
            )}

            {isEquipment && formData.subCategory && (
              <div className="col-span-2 grid grid-cols-3 gap-2 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-[var(--color-border-main)] px-3">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">
                    大分類
                  </span>
                  <p className="text-[10px] font-bold truncate">
                    {formData.category || "-"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-gray-400 uppercase">
                    中分類
                  </span>
                  <p className="text-[10px] font-bold truncate">
                    {formData.middleCategory || "-"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-blue-400 uppercase">
                    小分類
                  </span>
                  <p className="text-[10px] font-bold text-blue-600 truncate">
                    {formData.subCategory || "-"}
                  </p>
                </div>
              </div>
            )}
            <div className={`space-y-1 ${isEquipment ? "col-span-2" : ""}`}>
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                リソース名
              </label>
              <input
                disabled={isEnergy}
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-50"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Dynamic Fields Groups */}
            {combinedGroups.map((group) => (
              <div
                key={group.id}
                className="col-span-2 grid grid-cols-2 gap-4 pt-4 first:pt-2 border-t border-[var(--color-border-main)]"
              >
                <div className="col-span-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    {group.label}
                  </p>
                </div>
                {group.fields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                      {field.label} {field.unit && `(${field.unit})`}
                    </label>
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      className="w-full bg-blue-50/30 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                      value={
                        formData.dynamicSpecs?.[field.id] !== undefined
                          ? formData.dynamicSpecs[field.id]
                          : field.id === "spm"
                            ? formData.spm || ""
                            : field.id === "powerConsumption"
                              ? formData.powerConsumption || ""
                              : ""
                      }
                      onChange={(e) =>
                        handleDynamicFieldChange(field.id, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            ))}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                数量
              </label>
              <input
                type="number"
                disabled={isEnergy}
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-50"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                単位
              </label>
              <input
                disabled={isEnergy}
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-50"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
              />
            </div>
            {!isEquipment && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                  産出SPM
                </label>
                <input
                  type="number"
                  disabled={isEnergy}
                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-50"
                  value={formData.spm || "0"}
                  onChange={(e) =>
                    setFormData({ ...formData, spm: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                時間単価
              </label>
              <input
                type="number"
                disabled={isEnergy}
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none disabled:opacity-50"
                value={formData.hourlyRate}
                onChange={(e) =>
                  setFormData({ ...formData, hourlyRate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                備考
              </label>
              <textarea
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none h-20"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-[var(--color-border-main)] sticky bottom-0 bg-[var(--color-bg-main)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-[var(--color-border-main)] rounded-xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg text-center"
            >
              保存
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function CategoryTierDropdown({
  value,
  options,
  onChange,
  disabled = false,
  error = false,
}: {
  value?: string;
  options: string[];
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  const [isNew, setIsNew] = useState(false);

  // If the value is not in options and is not empty, it might be a "new" value
  useEffect(() => {
    if (value && !options.includes(value)) {
      setIsNew(true);
    } else if (value && options.includes(value)) {
      setIsNew(false);
    }
    // If value is empty, don't auto-reset isNew so the user can start typing
  }, [value, options]);

  return (
    <div
      className={`space-y-2 ${disabled ? "opacity-50 pointer-events-none grayscale" : ""}`}
    >
      <div className="relative group">
        {isNew ? (
          <div className="relative">
            <input
              type="text"
              className={`w-full bg-blue-50/30 dark:bg-blue-900/10 border ${error ? "border-red-500" : "border-blue-600"} rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 outline-none pr-10`}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="新規名称を入力..."
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setIsNew(false);
                onChange("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
              title="選択肢に戻る"
            >
              <Database className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <select
              className={`w-full bg-white dark:bg-gray-900 border ${error ? "border-red-500" : "border-[var(--color-border-main)]"} rounded-lg px-3 py-2 text-sm font-medium focus:ring-1 focus:ring-blue-600 outline-none appearance-none cursor-pointer`}
              value={value || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "__NEW__") {
                  setIsNew(true);
                  onChange("");
                } else {
                  onChange(val);
                }
              }}
            >
              <option value="">選択してください...</option>
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              <option
                value="__NEW__"
                className="text-blue-600 font-bold border-t border-gray-100"
              >
                + 新しい項目を追加...
              </option>
            </select>
            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}

function AdminSchemaManager({
  schemas,
  onUpdate,
  masterEquipment,
  onUpdateEquipment,
  projects,
  onUpdateProjects,
  masterLineUnits,
  setDialog,
}: {
  schemas: EquipmentSchema[];
  onUpdate: (s: EquipmentSchema[]) => void;
  masterEquipment: MasterEquipment[];
  onUpdateEquipment: (e: MasterEquipment[]) => void;
  projects: MockProject[];
  onUpdateProjects: (
    p: MockProject[] | ((prev: MockProject[]) => MockProject[]),
  ) => void;
  masterLineUnits: LineUnitMaster[];
  setDialog: (val: any) => void;
}) {
  const [editingSchema, setEditingSchema] = useState<EquipmentSchema | null>(
    null,
  );
  const [localSchema, setLocalSchema] = useState<EquipmentSchema | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(schemas.map((s) => s.category).filter(Boolean)));
  }, [schemas]);

  const [activeCategory, setActiveCategory] = useState<string>("__GLOBAL__");

  useEffect(() => {
    if (
      categories.length > 0 &&
      !categories.includes(activeCategory) &&
      activeCategory !== "__GLOBAL__"
    ) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const startEditing = (schema: EquipmentSchema) => {
    setEditingSchema(schema);
    setLocalSchema(JSON.parse(JSON.stringify(schema))); // Deep copy for editing
  };

  const cancelEditing = () => {
    setEditingSchema(null);
    setLocalSchema(null);
  };

  const saveEditing = () => {
    if (!localSchema) return;

    if (
      localSchema.id !== "global_common" &&
      localSchema.category === "全設備共通"
    ) {
      setDialog({
        type: "alert",
        title: "予約済みの名前",
        message:
          "「全設備共通」は予約済みの名前であるため、設備カテゴリとして設定できません。",
        onConfirm: () => setDialog(null),
      });
      return;
    }

    // Check uniqueness
    const isDuplicate = schemas.some(
      (s) =>
        s.id !== localSchema.id &&
        s.category === localSchema.category &&
        s.middleCategory === localSchema.middleCategory &&
        s.subCategory === localSchema.subCategory,
    );

    if (isDuplicate) {
      setDialog({
        type: "alert",
        title: "重複エラー",
        message: `「${localSchema.category} > ${localSchema.middleCategory} > ${localSchema.subCategory}」は既に存在します。名前を変更してください。`,
        onConfirm: () => setDialog(null),
      });
      return;
    }

    const updated = schemas.map((s) =>
      s.id === localSchema.id ? localSchema : s,
    );
    onUpdate(updated);

    // Cascading update to master equipment and projects if classification names changed
    const originalSchema = schemas.find((s) => s.id === localSchema.id);
    if (
      originalSchema &&
      (originalSchema.category !== localSchema.category ||
        originalSchema.middleCategory !== localSchema.middleCategory ||
        originalSchema.subCategory !== localSchema.subCategory)
    ) {
      // 1. Update Master Equipment
      const updatedEquipment = masterEquipment.map((eq) => {
        if (eq.schemaId === localSchema.id) {
          return {
            ...eq,
            category: localSchema.category,
            middleCategory: localSchema.middleCategory,
            subCategory: localSchema.subCategory,
          };
        }
        return eq;
      });
      onUpdateEquipment(updatedEquipment);

      // 2. Update Projects and their resources
      const updatedProjects = projects.map((p) => {
        let projectChanged = false;
        let newP = { ...p };

        // Deep update resources
        const newScenarios = p.scenarios.map((s) => {
          let scenarioChanged = false;
          const newLineUnits = s.lineUnits?.map((lu) => {
            let luChanged = false;
            const newResources = lu.resources.map((r) => {
              if (r.schemaId === localSchema.id) {
                luChanged = true;
                scenarioChanged = true;
                projectChanged = true;
                return {
                  ...r,
                  category: localSchema.category,
                  middleCategory: localSchema.middleCategory,
                  subCategory: localSchema.subCategory,
                };
              }
              return r;
            });
            return luChanged ? { ...lu, resources: newResources } : lu;
          });
          return scenarioChanged ? { ...s, lineUnits: newLineUnits } : s;
        });

        return projectChanged ? { ...newP, scenarios: newScenarios } : p;
      });
      onUpdateProjects(updatedProjects);
    }

    setEditingSchema(null);
    setLocalSchema(null);
  };

  const removeSchema = (schemaId: string) => {
    const schema = schemas.find((s) => s.id === schemaId);
    if (!schema) return;

    // Check if any equipment is registered under this schema in Master Equipment
    const isUsedInMaster = masterEquipment.some(
      (eq) => eq.schemaId === schemaId,
    );

    // Check if any projects use this schema in their resources
    const isUsedInProjects = projects.some((p) => {
      // Check resources
      return p.scenarios.some((s) =>
        s.lineUnits?.some((lu) =>
          lu.resources.some((r) => r.schemaId === schemaId),
        ),
      );
    });

    // Check if any master line units use this schema
    const isUsedInMasterLineUnits = masterLineUnits.some((lu) =>
      lu.resources.some((r) => r.schemaId === schemaId),
    );

    if (isUsedInMaster || isUsedInProjects || isUsedInMasterLineUnits) {
      setDialog({
        type: "alert",
        title: "削除不可",
        message: `「${schema.subCategory}」は設備マスタまたは投資案件で使用されているため、削除できません。\n先に登録されているデータを削除するか、分類を変更してください。`,
        onConfirm: () => setDialog(null),
      });
      return;
    }

    setDialog({
      type: "confirm",
      title: "構造定義の削除",
      message: `「${schema.subCategory}」の構造定義を削除しますか？`,
      isDestructive: true,
      onConfirm: () => {
        onUpdate(schemas.filter((s) => s.id !== schemaId));
        if (localSchema?.id === schemaId) {
          setEditingSchema(null);
          setLocalSchema(null);
        }
        setDialog(null);
      },
    });
  };

  const updateLocalSchema = (updates: Partial<EquipmentSchema>) => {
    if (!localSchema) return;
    setLocalSchema({ ...localSchema, ...updates });
  };

  const addGroup = () => {
    if (!localSchema) return;
    setLocalSchema({
      ...localSchema,
      groups: [
        ...localSchema.groups,
        { id: `group_${Date.now()}`, label: "新規グループ", fields: [] },
      ],
    });
  };

  const updateGroupLabel = (groupId: string, label: string) => {
    if (!localSchema) return;
    setLocalSchema({
      ...localSchema,
      groups: localSchema.groups.map((g) =>
        g.id === groupId ? { ...g, label } : g,
      ),
    });
  };

  const removeGroup = (groupId: string) => {
    if (!localSchema) return;
    setDialog({
      title: "グループ削除の確認",
      message: "このグループと所属するすべての項目を削除しますか？",
      type: "confirm",
      isDestructive: true,
      onConfirm: () => {
        setLocalSchema((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            groups: prev.groups.filter((g) => g.id !== groupId),
          };
        });
        setDialog(null);
      },
    });
  };

  const addFieldToGroup = (groupId: string) => {
    if (!localSchema) return;
    setLocalSchema({
      ...localSchema,
      groups: localSchema.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              fields: [
                ...g.fields,
                {
                  id: `field_${Date.now()}`,
                  label: "新規項目",
                  type: "string" as const,
                },
              ],
            }
          : g,
      ),
    });
  };

  const updateFieldInGroup = (
    groupId: string,
    fieldId: string,
    updates: Partial<DynamicFieldDefinition>,
  ) => {
    if (!localSchema) return;
    setLocalSchema({
      ...localSchema,
      groups: localSchema.groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              fields: g.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f,
              ),
            }
          : g,
      ),
    });
  };

  const removeFieldFromGroup = (groupId: string, fieldId: string) => {
    if (!localSchema) return;
    setDialog({
      title: "項目削除の確認",
      message: "この項目を削除しますか？",
      type: "confirm",
      isDestructive: true,
      onConfirm: () => {
        setLocalSchema((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            groups: prev.groups.map((g) =>
              g.id === groupId
                ? {
                    ...g,
                    fields: g.fields.filter((f) => f.id !== fieldId),
                  }
                : g,
            ),
          };
        });
        setDialog(null);
      },
    });
  };

  const addNewSchema = () => {
    let subCategory = "新規小分類";
    let counter = 1;
    // Ensure initial combination is unique
    while (
      schemas.some(
        (s) =>
          s.category === "新規大分類" &&
          s.middleCategory === "新規中分類" &&
          s.subCategory === subCategory,
      )
    ) {
      subCategory = `新規小分類_${counter++}`;
    }

    const newSchema: EquipmentSchema = {
      id: `schema_${Date.now()}`,
      category: "新規大分類",
      middleCategory: "新規中分類",
      subCategory,
      groups: [],
    };
    onUpdate([...schemas, newSchema]);
    startEditing(newSchema);
    setActiveCategory("新規大分類");
  };

  // Helper for duplicate check in real-time
  const getDuplicateError = () => {
    if (!localSchema) return null;
    const isDuplicate = schemas.some(
      (s) =>
        s.id !== localSchema.id &&
        s.category === localSchema.category &&
        s.middleCategory === localSchema.middleCategory &&
        s.subCategory === localSchema.subCategory,
    );
    return isDuplicate
      ? "この分類構造の組み合わせは既に登録されています"
      : null;
  };

  const renameCategory = (oldName: string) => {
    if (oldName === "全設備共通") {
      setDialog({
        type: "alert",
        title: "名称変更不可",
        message:
          "「全設備共通」はシステム固定の名称であるため、変更できません。",
        onConfirm: () => setDialog(null),
      });
      return;
    }
    setDialog({
      type: "prompt",
      title: "大分類の名称変更",
      message: `${oldName} を新しい名称に変更してください`,
      defaultValue: oldName,
      onConfirm: (newName) => {
        if (!newName || newName === oldName) {
          setDialog(null);
          return;
        }

        // Check duplication (if newName already exists as another category)
        if (schemas.some((s) => s.category === newName)) {
          setDialog({
            type: "alert",
            title: "重複エラー",
            message: `「${newName}」は既に存在します。別の名称を指定してください。`,
            onConfirm: () => setDialog(null),
          });
          return;
        }

        const updatedSchemas = schemas.map((s) =>
          s.category === oldName ? { ...s, category: newName } : s,
        );
        onUpdate(updatedSchemas);

        // Cascade to equipment
        const updatedEquipment = masterEquipment.map((eq) =>
          eq.category === oldName ? { ...eq, category: newName } : eq,
        );
        onUpdateEquipment(updatedEquipment);

        // Cascade to projects
        const updatedProjects = projects.map((p) => {
          let projectChanged = false;

          const newScenarios = p.scenarios.map((s) => {
            let scChanged = false;
            const newLUs = s.lineUnits?.map((lu) => {
              let luChanged = false;
              const newRs = lu.resources.map((r) => {
                if (r.category === oldName) {
                  luChanged = true;
                  scChanged = true;
                  projectChanged = true;
                  return { ...r, category: newName };
                }
                return r;
              });
              return luChanged ? { ...lu, resources: newRs } : lu;
            });
            return scChanged ? { ...s, lineUnits: newLUs } : s;
          });

          return projectChanged ? { ...p, scenarios: newScenarios } : p;
        });
        onUpdateProjects(updatedProjects);
        setDialog(null);
      },
    });
  };

  const removeCategory = (categoryName: string) => {
    if (categoryName === "全設備共通") {
      setDialog({
        type: "alert",
        title: "削除不可",
        message:
          "「全設備共通」はシステム必須の定義であるため、削除できません。",
        onConfirm: () => setDialog(null),
      });
      return;
    }
    // 1. Identify all schemas belonging to this category
    const relevantSchemas = schemas.filter((s) => s.category === categoryName);
    const relevantSchemaIds = new Set(relevantSchemas.map((s) => s.id));

    // 2. Check if any equipment in Master uses these schemas or this category name
    const isUsedInMaster = masterEquipment.some(
      (eq) =>
        eq.category === categoryName ||
        (eq.schemaId && relevantSchemaIds.has(eq.schemaId)),
    );

    // 3. Check if any projects use these schemas or this category name in resources
    const isUsedInProjects = projects.some((p) => {
      // Check resources in scenarios
      return p.scenarios.some((s) =>
        s.lineUnits?.some((lu) =>
          lu.resources.some(
            (r) =>
              r.category === categoryName ||
              (r.schemaId && relevantSchemaIds.has(r.schemaId)),
          ),
        ),
      );
    });

    // 4. Check if any master line units use these schemas or this category name
    const isUsedInMasterLineUnits = masterLineUnits.some((lu) =>
      lu.resources.some(
        (r) =>
          r.category === categoryName ||
          (r.schemaId && relevantSchemaIds.has(r.schemaId)),
      ),
    );

    if (isUsedInMaster || isUsedInProjects || isUsedInMasterLineUnits) {
      setDialog({
        type: "alert",
        title: "削除不可",
        message: `「${categoryName}」には登録済みの設備が存在するため、削除できません。\n先に所属する設備データを削除してください。`,
        onConfirm: () => setDialog(null),
      });
      return;
    }

    setDialog({
      type: "confirm",
      title: "大分類の削除",
      message: `「${categoryName}」とその配下にあるすべての定義を削除しますか？`,
      isDestructive: true,
      onConfirm: () => {
        onUpdate(schemas.filter((s) => s.category !== categoryName));
        setDialog(null);
      },
    });
  };

  const renameMiddleCategory = (category: string, oldName: string) => {
    setDialog({
      type: "prompt",
      title: "中分類の名称変更",
      message: `${oldName} を新しい名称に変更してください`,
      defaultValue: oldName,
      onConfirm: (newName) => {
        if (!newName || newName === oldName) {
          setDialog(null);
          return;
        }

        // Check duplication under same category
        if (
          schemas.some(
            (s) => s.category === category && s.middleCategory === newName,
          )
        ) {
          setDialog({
            type: "alert",
            title: "重複エラー",
            message: `「${category}」の中に「${newName}」は既に存在します。`,
            onConfirm: () => setDialog(null),
          });
          return;
        }

        const updatedSchemas = schemas.map((s) =>
          s.category === category && s.middleCategory === oldName
            ? { ...s, middleCategory: newName }
            : s,
        );
        onUpdate(updatedSchemas);

        // Cascade to equipment
        const updatedEquipment = masterEquipment.map((eq) =>
          eq.category === category && eq.middleCategory === oldName
            ? { ...eq, middleCategory: newName }
            : eq,
        );
        onUpdateEquipment(updatedEquipment);

        // Cascade to projects
        const updatedProjects = projects.map((p) => {
          let projectChanged = false;

          const newScenarios = p.scenarios.map((s) => {
            let scChanged = false;
            const newLUs = s.lineUnits?.map((lu) => {
              let luChanged = false;
              const newRs = lu.resources.map((r) => {
                if (r.category === category && r.middleCategory === oldName) {
                  luChanged = true;
                  scChanged = true;
                  projectChanged = true;
                  return { ...r, middleCategory: newName };
                }
                return r;
              });
              return luChanged ? { ...lu, resources: newRs } : lu;
            });
            return scChanged ? { ...s, lineUnits: newLUs } : s;
          });

          return projectChanged ? { ...p, scenarios: newScenarios } : p;
        });
        onUpdateProjects(updatedProjects);
        setDialog(null);
      },
    });
  };

  const removeMiddleCategory = (category: string, middleName: string) => {
    // 1. Identify all schemas belonging to this category + middle category
    const relevantSchemas = schemas.filter(
      (s) => s.category === category && s.middleCategory === middleName,
    );
    const relevantSchemaIds = new Set(relevantSchemas.map((s) => s.id));

    // 2. Check if any equipment in Master uses these schemas or this category+middle name
    const isUsedInMaster = masterEquipment.some(
      (eq) =>
        (eq.category === category && eq.middleCategory === middleName) ||
        (eq.schemaId && relevantSchemaIds.has(eq.schemaId)),
    );

    // 3. Check if any projects use these schemas or this category+middle name in resources
    const isUsedInProjects = projects.some((p) => {
      return p.scenarios.some((s) =>
        s.lineUnits?.some((lu) =>
          lu.resources.some(
            (r) =>
              (r.category === category && r.middleCategory === middleName) ||
              (r.schemaId && relevantSchemaIds.has(r.schemaId)),
          ),
        ),
      );
    });

    // 4. Check if any master line units use these schemas or this category+middle name
    const isUsedInMasterLineUnits = masterLineUnits.some((lu) =>
      lu.resources.some(
        (r) =>
          (r.category === category && r.middleCategory === middleName) ||
          (r.schemaId && relevantSchemaIds.has(r.schemaId)),
      ),
    );

    if (isUsedInMaster || isUsedInProjects || isUsedInMasterLineUnits) {
      setDialog({
        type: "alert",
        title: "削除不可",
        message: `「${middleName}」には登録済みの設備が存在するため、削除できません。\n先に所属する設備データを削除してください。`,
        onConfirm: () => setDialog(null),
      });
      return;
    }

    setDialog({
      type: "confirm",
      title: "中分類の削除",
      message: `「${middleName}」とその配下にあるすべての定義を削除しますか？`,
      isDestructive: true,
      onConfirm: () => {
        onUpdate(
          schemas.filter(
            (s) =>
              !(s.category === category && s.middleCategory === middleName),
          ),
        );
        setDialog(null);
      },
    });
  };

  const duplicateError = getDuplicateError();

  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar space-y-8 p-8 relative">
      {/* Header with decorative background */}
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/10 -z-10" />

      <div className="w-full max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm p-6 rounded-3xl border border-white/50 dark:border-gray-800 shadow-xl shadow-blue-900/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                設備構造マスタ管理
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <p className="text-sm text-gray-500 font-medium">
                  全設備共通および大分類・中分類・小分類ごとのパラメータ定義
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-bold shadow-sm">
              <Lock className="w-4 h-4" />
              管理者権限
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDialog({
                    type: "confirm",
                    title: "初期状態にリセット",
                    message:
                      "構造定義をすべて初期状態リセットしますか？作成済みのデータは削除されませんが、定義が失われる可能性があります。",
                    isDestructive: true,
                    onConfirm: () => {
                      onUpdate(DEFAULT_EQUIPMENT_SCHEMAS);
                      setDialog(null);
                    },
                  });
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/30 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
              >
                <History className="w-4 h-4" />
                初期状態にリセット
              </button>
              <button
                onClick={addNewSchema}
                className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-gray-800 dark:hover:bg-blue-700 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                新規構造定義を追加
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4 sticky top-6">
            {/* Global Settings Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-2">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1">
                Global Parameters
              </div>
              <button
                onClick={() => setActiveCategory("__GLOBAL__")}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                  activeCategory === "__GLOBAL__"
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 shadow-[0_2px_0_currentcolor] lg:shadow-[inset_3px_0_0_currentcolor]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Database
                    className={`w-4 h-4 shrink-0 transition-colors ${activeCategory === "__GLOBAL__" ? "text-amber-600" : "text-gray-400 group-hover:text-amber-500"}`}
                  />
                  <span className="truncate">全設備共通</span>
                </div>
              </button>
            </div>

            {categories.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-2">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 mb-1">
                  Equipment Categories
                </div>
                <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1 scrollbar-hide py-1 lg:py-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-shrink-0 lg:w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap lg:whitespace-normal group ${
                        activeCategory === cat
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 shadow-[0_2px_0_currentcolor] lg:shadow-[inset_3px_0_0_currentcolor]"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Layers
                          className={`w-4 h-4 shrink-0 transition-colors ${activeCategory === cat ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"}`}
                        />
                        <span className="truncate">{cat}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-8 w-full">
            <div className="space-y-12">
              {activeCategory === "__GLOBAL__" ? (
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-1.5 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase italic">
                      Global Common Parameters
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-800" />
                  </div>

                  <div className="bg-white dark:bg-gray-900 border-2 border-amber-500/20 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Database className="w-24 h-24 text-amber-500" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black rounded-lg border border-amber-200 dark:border-amber-800 uppercase tracking-widest">
                          System Essential
                        </div>
                        <h4 className="text-2xl font-black text-gray-900 dark:text-white">
                          全設備共通パラメータ設定
                        </h4>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-lg">
                          このセクションで定義されたパラメータは、**すべての設備カテゴリ**において自動的に追加されます。
                          管理番号や設置情報など、設備の種類を問わず必要な基本項目をここで管理してください。
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const globalSchema = schemas.find(
                            (s) => s.id === "global_common",
                          );
                          if (globalSchema) startEditing(globalSchema);
                        }}
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black shadow-lg shadow-amber-500/30 transition-all flex items-center gap-3 active:scale-95"
                      >
                        <Settings className="w-5 h-5" />
                        パラメータを定義する
                      </button>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {schemas
                        .find((s) => s.id === "global_common")
                        ?.groups.map((group) => (
                          <div
                            key={group.id}
                            className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800"
                          >
                            <p className="text-[10px] font-black text-amber-600 uppercase mb-3 tracking-tighter">
                              {group.label}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {group.fields.map((f) => (
                                <span
                                  key={f.id}
                                  className="px-2 py-1 bg-white dark:bg-gray-900 rounded-md text-[10px] font-bold shadow-sm"
                                >
                                  {f.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </section>
              ) : (
                Object.entries(
                  schemas
                    .filter((s) => s.category === activeCategory)
                    .reduce(
                      (acc, s) => {
                        if (!acc[s.category]) acc[s.category] = {};
                        if (s.middleCategory !== "") {
                          if (!acc[s.category][s.middleCategory])
                            acc[s.category][s.middleCategory] = [];
                          if (s.subCategory !== "") {
                            acc[s.category][s.middleCategory].push(s);
                          }
                        }
                        return acc;
                      },
                      {} as Record<string, Record<string, EquipmentSchema[]>>,
                    ),
                ).map(([category, middles]) => {
                  const catSchema = schemas.find(
                    (s) =>
                      s.category === category &&
                      s.middleCategory === "" &&
                      s.subCategory === "",
                  );
                  return (
                    <section key={category} className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                        <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
                          {category}
                        </h3>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (catSchema) {
                                startEditing(catSchema);
                              } else {
                                const newId = `schema_${Date.now()}`;
                                const newS: EquipmentSchema = {
                                  id: newId,
                                  category,
                                  middleCategory: "",
                                  subCategory: "",
                                  groups: [
                                    {
                                      id: `cat_${newId}_common`,
                                      label: `${category} 共通仕様`,
                                      fields: [
                                        {
                                          id: "spm",
                                          label: "SPM",
                                          type: "number",
                                          unit: "spm",
                                          isUndeletable: true,
                                        },
                                        {
                                          id: "ratedPower",
                                          label: "定格電力",
                                          type: "number",
                                          unit: "kW",
                                          isUndeletable: true,
                                        },
                                      ],
                                    },
                                  ],
                                };
                                onUpdate([...schemas, newS]);
                                startEditing(newS);
                              }
                            }}
                            className="px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/20 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            大分類パラメータ設定
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              renameCategory(category);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            title="名称変更"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCategory(category);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent dark:from-gray-800" />
                      </div>

                      <div className="space-y-8 pl-4">
                        {Object.entries(middles).map(([middle, subSchemas]) => {
                          const midSchema = schemas.find(
                            (s) =>
                              s.category === category &&
                              s.middleCategory === middle &&
                              s.subCategory === "",
                          );
                          return (
                            <div key={middle} className="space-y-4">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black rounded-lg border border-blue-200 dark:border-blue-800 uppercase tracking-widest">
                                  {middle}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (midSchema) {
                                        startEditing(midSchema);
                                      } else {
                                        const newId = `schema_${Date.now()}`;
                                        const newS: EquipmentSchema = {
                                          id: newId,
                                          category,
                                          middleCategory: middle,
                                          subCategory: "",
                                          groups: [],
                                        };
                                        onUpdate([...schemas, newS]);
                                        startEditing(newS);
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 rounded-md text-[10px] font-bold hover:bg-blue-100 transition-colors"
                                  >
                                    中分類パラメータ設定
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      renameMiddleCategory(category, middle);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600 rounded-md transition-colors"
                                    title="名称変更"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeMiddleCategory(category, middle);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                                    title="削除"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="flex-1 h-[1px] bg-gray-100 dark:bg-gray-800" />
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {subSchemas.map((schema) => (
                                  <motion.div
                                    key={schema.id}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    onClick={() => startEditing(schema)}
                                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-blue-500/50 cursor-pointer transition-all group flex flex-col justify-between"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <h4 className="font-black text-base group-hover:text-blue-600 transition-colors">
                                          {schema.subCategory}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                          {category} 〉{middle}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditing(schema);
                                          }}
                                          className="p-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 rounded-xl opacity-60 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 hover:bg-blue-100"
                                          title="編集"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeSchema(schema.id);
                                          }}
                                          className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-xl opacity-60 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 hover:bg-red-100 dark:hover:bg-red-900/30"
                                          title="削除"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 space-y-3">
                                      {schema.groups.map((group) => (
                                        <div
                                          key={group.id}
                                          className="space-y-1.5"
                                        >
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                            {group.label}
                                          </p>
                                          <div className="flex flex-wrap gap-1.5">
                                            {group.fields.map((f) => (
                                              <span
                                                key={f.id}
                                                className="inline-flex items-center px-2 py-0.5 bg-gray-50 dark:bg-gray-800/50 rounded-md text-[9px] font-bold text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800"
                                              >
                                                {f.label}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                      {schema.groups.length === 0 && (
                                        <div className="flex items-center gap-2 text-gray-400 italic py-2">
                                          <AlertCircle className="w-3.5 h-3.5" />
                                          <span className="text-[10px] font-bold">
                                            項目未定義
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              )}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-6 rounded-2xl flex gap-4 mt-8">
              <Info className="w-6 h-6 text-blue-600 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-blue-900 dark:text-blue-400 text-sm">
                  Mechanical Press 300t の例
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-500 leading-relaxed">
                  「基本仕様（能力, ストローク）」「寸法仕様（ボルスタ,
                  ダイハイト）」「電気仕様」などの情報グループを作成し、
                  それぞれに、より詳細なパラメータを整理して収めることができます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {localSchema && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[400] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--color-bg-main)] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-[var(--color-border-main)] flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-[var(--color-border-main)] flex items-center justify-between bg-gray-50 dark:bg-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {localSchema.subCategory
                        ? `${localSchema.subCategory} の詳細構造定義`
                        : localSchema.middleCategory
                          ? `${localSchema.middleCategory} (中分類) の共通パラメータ定義`
                          : `${localSchema.category} (大分類) の共通パラメータ定義`}
                    </h3>
                    <p className="text-[10px] text-[var(--color-brand-secondary)] font-medium">
                      情報グループと項目の階層管理
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (localSchema) removeSchema(localSchema.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group/del"
                    title="この定義を削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <Plus className="w-5 h-5 rotate-45" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {duplicateError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    {duplicateError}
                  </div>
                )}

                <div
                  className={`grid grid-cols-3 gap-6 ${!localSchema.subCategory ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-600 uppercase">
                      大分類 (Category)
                    </label>
                    <CategoryTierDropdown
                      value={localSchema.category}
                      options={
                        localSchema.subCategory
                          ? Array.from(new Set(schemas.map((s) => s.category)))
                          : [localSchema.category]
                      }
                      onChange={(v) => updateLocalSchema({ category: v })}
                      error={!!duplicateError}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-600 uppercase">
                      中分類 (Middle)
                    </label>
                    <CategoryTierDropdown
                      value={localSchema.middleCategory}
                      options={
                        localSchema.subCategory
                          ? Array.from(
                              new Set(
                                schemas
                                  .filter(
                                    (s) => s.category === localSchema.category,
                                  )
                                  .map((s) => s.middleCategory),
                              ),
                            )
                          : [localSchema.middleCategory]
                      }
                      onChange={(v) => updateLocalSchema({ middleCategory: v })}
                      error={!!duplicateError}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-600 uppercase">
                      小分類 (Sub)
                    </label>
                    <CategoryTierDropdown
                      value={localSchema.subCategory}
                      options={
                        localSchema.subCategory
                          ? Array.from(
                              new Set(
                                schemas
                                  .filter(
                                    (s) =>
                                      s.category === localSchema.category &&
                                      s.middleCategory ===
                                        localSchema.middleCategory,
                                  )
                                  .map((s) => s.subCategory),
                              ),
                            )
                          : [localSchema.subCategory]
                      }
                      onChange={(v) => updateLocalSchema({ subCategory: v })}
                      error={!!duplicateError}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-blue-600">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-[var(--color-text-main)] uppercase tracking-wider">
                        情報グループ設定
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={addGroup}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      グループを追加
                    </button>
                  </div>

                  <div className="space-y-6">
                    {localSchema.groups.map((group) => (
                      <div
                        key={group.id}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                      >
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-800">
                          <input
                            className="bg-transparent border-none text-sm font-bold text-gray-900 dark:text-white focus:ring-0 w-1/2"
                            value={group.label}
                            onChange={(e) =>
                              updateGroupLabel(group.id, e.target.value)
                            }
                          />
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => addFieldToGroup(group.id)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              項目追加
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGroup(group.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          {group.fields.map((field) => (
                            <div
                              key={field.id}
                              className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
                            >
                              <div className="flex-1">
                                <input
                                  className={`w-full bg-transparent border-none text-xs focus:ring-0 font-medium ${field.isUndeletable ? "text-gray-400" : ""}`}
                                  value={field.label}
                                  disabled={field.isUndeletable}
                                  onChange={(e) =>
                                    updateFieldInGroup(group.id, field.id, {
                                      label: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <select
                                  className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-[10px] font-medium py-1 px-2 focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                                  value={field.type}
                                  disabled={field.isUndeletable}
                                  onChange={(e) =>
                                    updateFieldInGroup(group.id, field.id, {
                                      type: e.target.value as any,
                                    })
                                  }
                                >
                                  <option value="string">文字列</option>
                                  <option value="number">数値</option>
                                  <option value="select">選択肢</option>
                                </select>
                                {field.type === "number" && (
                                  <input
                                    placeholder="単位"
                                    disabled={field.isUndeletable}
                                    className="w-16 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-[10px] font-medium py-1 px-2 focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                                    value={field.unit || ""}
                                    onChange={(e) =>
                                      updateFieldInGroup(group.id, field.id, {
                                        unit: e.target.value,
                                      })
                                    }
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFieldFromGroup(group.id, field.id)
                                  }
                                  disabled={field.isUndeletable}
                                  className={
                                    field.isUndeletable
                                      ? "text-gray-200 dark:text-gray-700 cursor-not-allowed"
                                      : "text-gray-300 hover:text-red-500"
                                  }
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {group.fields.length === 0 && (
                            <p className="text-[10px] text-gray-400 italic text-center py-2">
                              項目がありません
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[var(--color-border-main)] bg-white dark:bg-gray-900 flex justify-end gap-3 shrink-0">
                <button
                  onClick={cancelEditing}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveEditing}
                  disabled={!!duplicateError}
                  className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:grayscale"
                >
                  設定を保存
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
function ResourceAddModal({
  masterEquipment,
  onClose,
  onSelect,
  onManualAdd,
}: {
  masterEquipment: MasterEquipment[];
  onClose: () => void;
  onSelect: (eq: MasterEquipment) => void;
  onManualAdd: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = masterEquipment.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.middleCategory.toLowerCase().includes(search.toLowerCase()) ||
      m.subCategory.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--color-bg-main)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--color-border-main)] flex flex-col max-h-[85vh]"
      >
        <div className="px-6 py-4 border-b border-[var(--color-border-main)] flex items-center justify-between bg-gray-50 dark:bg-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">リソースを選択・追加</h3>
              <p className="text-[10px] text-[var(--color-brand-secondary)] font-medium">
                設備データベースからリソースを選択します
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <div className="p-4 border-b border-[var(--color-border-main)] bg-[var(--color-bg-alt)] shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-sm text-sm"
              placeholder="設備名、ID、カテゴリで検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-[var(--color-bg-main)]">
          <div className="flex items-center justify-between px-2 pb-2">
            <p className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
              設備ライブラリ ({filtered.length}件)
            </p>
          </div>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filtered.map((eq) => (
                <button
                  key={eq.id}
                  onClick={() => onSelect(eq)}
                  className="w-full text-left p-4 rounded-xl border border-[var(--color-border-main)] hover:border-blue-600 hover:bg-blue-600/5 transition-all group flex items-center gap-4 bg-[var(--color-bg-main)] shadow-sm"
                >
                  <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center text-[7.5px] font-bold text-gray-400 border border-transparent group-hover:border-blue-200 transition-all shrink-0 p-1 text-center leading-tight">
                    <Database className="w-4 h-4 text-purple-500 mb-0.5" />
                    <span className="uppercase opacity-40 mb-0.5">
                      {eq.category.substring(0, 4)}
                    </span>
                    <span className="uppercase text-blue-600 line-clamp-2">
                      {eq.middleCategory}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <p className="font-bold text-sm truncate group-hover:text-blue-600 transition-colors">
                          {eq.name}
                        </p>
                        <span className="text-[8px] bg-gray-100 dark:bg-gray-800 text-[var(--color-brand-secondary)] px-1 py-0.5 rounded uppercase font-bold shrink-0">
                          {eq.subCategory}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded border border-[var(--color-border-main)] shrink-0">
                        {eq.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 min-w-[70px]">
                        <Activity className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] text-gray-500">
                          {eq.dynamicSpecs?.capacity ||
                            eq.pressSpecs?.capacity ||
                            "-"}{" "}
                          {eq.subCategory === "プレス機" ? "kN" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-[90px]">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-[10px] text-gray-500 font-mono italic">
                          {eq.spm !== undefined
                            ? eq.spm
                            : eq.dynamicSpecs?.spm ||
                              eq.pressSpecs?.spm ||
                              "-"}{" "}
                          {eq.subCategory === "プレス機" && eq.spm === undefined
                            ? "spm"
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Info className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                          {eq.manufacturer}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="w-6 h-6 rounded-full border border-[var(--color-border-main)] flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all">
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-[var(--color-border-main)] rounded-2xl bg-gray-50/50 dark:bg-gray-800/10">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-300 mb-4">
                <Search className="w-8 h-8" />
              </div>
              <p className="font-bold text-gray-500 mb-1 italic">
                該当する設備が見つかりませんでした
              </p>
              <p className="text-xs text-gray-400 max-w-[200px]">
                検索条件を変えるか、手動でリソースを追加してください
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-[var(--color-border-main)] shrink-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              OR
            </span>
            <div className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          <button
            onClick={onManualAdd}
            className="w-full py-4 bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-3 shadow-sm group"
          >
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-all">
              <Pencil className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-sm">手動でリソースを追加</p>
              <p className="text-[10px] text-gray-400 -mt-0.5 font-medium">
                人員、冶具、金型、その他のリソースを直接入力します
              </p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DbSyncModal({
  onClose,
  onApplyLocal,
  onApplyUnit,
  onApplyProject,
}: {
  onClose: () => void;
  onApplyLocal: () => void;
  onApplyUnit: () => void;
  onApplyProject: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--color-bg-main)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-[var(--color-border-main)]"
      >
        <div className="px-6 py-4 border-b border-[var(--color-border-main)] flex items-center justify-between bg-amber-50 dark:bg-amber-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-400">
                マスタデータ同期
              </h3>
              <p className="text-[10px] text-amber-700 dark:text-amber-500 font-medium">
                データベースとの差異が検出されました
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-amber-200 dark:hover:bg-amber-800/30 rounded-full transition-colors text-amber-600"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[var(--color-brand-secondary)] leading-relaxed">
            選択されたリソースの設定（産出SPM、時間単価）が最新の設備・見積データベースと異なります。どの範囲に更新を適用しますか？
          </p>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={onApplyLocal}
              className="w-full p-4 text-left rounded-xl border border-[var(--color-border-main)] hover:border-blue-600 hover:bg-blue-600/5 transition-all group"
            >
              <p className="font-bold text-sm group-hover:text-blue-600">
                このリソースのみ反映
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                現在選択している行のみ最新値に更新されます
              </p>
            </button>
            <button
              onClick={onApplyUnit}
              className="w-full p-4 text-left rounded-xl border border-[var(--color-border-main)] hover:border-blue-600 hover:bg-blue-600/5 transition-all group"
            >
              <p className="font-bold text-sm group-hover:text-blue-600">
                ラインユニット一括反映
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                この工程内の全ての同一設備リソースを更新します
              </p>
            </button>
            <button
              onClick={onApplyProject}
              className="w-full p-4 text-left rounded-xl border border-[var(--color-border-main)] hover:border-blue-600 hover:bg-blue-600/5 transition-all group"
            >
              <p className="font-bold text-sm group-hover:text-blue-600">
                稟議書（全シナリオ）一括反映
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                この案件に含まれる全シナリオの同一設備を更新します
              </p>
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-[var(--color-border-main)] text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function NewQuoteModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (quote: any) => void;
}) {
  const [formData, setFormData] = useState({
    vendorName: "",
    amount: "",
    currency: "JPY",
    taxType: "Excluded" as "Included" | "Excluded",
    taxRate: "10",
    installationCost: "0",
    shippingCost: "0",
    tax: "0",
    deliveryLeadTime: "",
    validUntil: "",
    remarks: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount) || 0;
    const instCostNum = parseFloat(formData.installationCost) || 0;
    const shipCostNum = parseFloat(formData.shippingCost) || 0;
    const taxNumInput = parseFloat(formData.tax) || 0;
    const taxRateNum = parseFloat(formData.taxRate) || 0;

    // Fallback to calculation only if tax is 0 and it's Excluded
    const taxNum =
      taxNumInput === 0 && formData.taxType === "Excluded"
        ? (amountNum + instCostNum + shipCostNum) * (taxRateNum / 100)
        : taxNumInput;

    onSubmit({
      ...formData,
      id: `q-${Date.now()}`,
      amount: amountNum,
      installationCost: instCostNum,
      shippingCost: shipCostNum,
      tax: taxNum,
      taxRate: taxRateNum,
      baseAmount: amountNum,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--color-bg-main)] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--color-border-main)]"
      >
        <div className="px-8 py-6 border-b border-[var(--color-border-main)] flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h3 className="text-xl font-bold">見積情報の追加</h3>
            <p className="text-xs text-[var(--color-brand-secondary)] mt-1">
              新しい見積書の内容を入力してください
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                ベンダー名
              </label>
              <input
                required
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.vendorName}
                onChange={(e) =>
                  setFormData({ ...formData, vendorName: e.target.value })
                }
                placeholder="例: 株式会社テクノソリューション"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                本体費用
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  required
                  className="flex-1 bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                通貨
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-[var(--color-border-main)]">
                <div className="grid grid-cols-3 gap-1 w-full">
                  {CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, currency: curr.code })
                      }
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        formData.currency === curr.code
                          ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm"
                          : "text-[var(--color-brand-secondary)] hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {curr.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                税区分
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-[var(--color-border-main)]">
                {TAX_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, taxType: type.id as any })
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      formData.taxType === type.id
                        ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm"
                        : "text-[var(--color-brand-secondary)] hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                設置工事費
              </label>
              <input
                type="number"
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.installationCost}
                onChange={(e) =>
                  setFormData({ ...formData, installationCost: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                輸送費
              </label>
              <input
                type="number"
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.shippingCost}
                onChange={(e) =>
                  setFormData({ ...formData, shippingCost: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                消費税率 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none pr-10"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData({ ...formData, taxRate: e.target.value })
                  }
                  placeholder="10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--color-brand-secondary)] font-bold">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                税金
              </label>
              <input
                type="number"
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.tax}
                onChange={(e) =>
                  setFormData({ ...formData, tax: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                納期
              </label>
              <input
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.deliveryLeadTime}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryLeadTime: e.target.value })
                }
                placeholder="例: 6ヶ月"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                有効期限
              </label>
              <input
                type="date"
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData({ ...formData, validUntil: e.target.value })
                }
              />
            </div>

            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                備考
              </label>
              <textarea
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none h-24 resize-none"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                placeholder="特記事項があれば入力してください"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--color-border-main)]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-[var(--color-border-main)] rounded-xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex-1"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg flex-1"
            >
              見積を保存
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function QuoteEditModal({
  quote,
  onClose,
  onUpdate,
  onDelete,
}: {
  quote: MasterQuote;
  onClose: () => void;
  onUpdate: (quote: MasterQuote) => void;
  onDelete: (id: string) => void;
}) {
  const [formData, setFormData] = useState({
    ...quote,
    amount: quote.amount.toString(),
    installationCost: quote.installationCost.toString(),
    shippingCost: quote.shippingCost.toString(),
    tax: quote.tax.toString(),
    taxRate: (quote.taxRate || 10).toString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount) || 0;
    const instCostNum = parseFloat(formData.installationCost) || 0;
    const shipCostNum = parseFloat(formData.shippingCost) || 0;
    const taxNumInput = parseFloat(formData.tax) || 0;
    const taxRateNum = parseFloat(formData.taxRate) || 0;

    // Only calculate if input is 0 and it's Excluded
    const taxNum =
      taxNumInput === 0 && formData.taxType === "Excluded"
        ? (amountNum + instCostNum + shipCostNum) * (taxRateNum / 100)
        : taxNumInput;

    onUpdate({
      ...quote,
      ...formData,
      amount: amountNum,
      installationCost: instCostNum,
      shippingCost: shipCostNum,
      tax: taxNum,
      taxRate: taxRateNum,
      baseAmount: amountNum,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--color-bg-main)] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--color-border-main)]"
      >
        <div className="px-8 py-6 border-b border-[var(--color-border-main)] flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h3 className="text-xl font-bold">見積情報の編集</h3>
            <p className="text-xs text-[var(--color-brand-secondary)] mt-1">
              見積内容の確認・変更ができます
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                ベンダー名
              </label>
              <input
                required
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.vendorName}
                onChange={(e) =>
                  setFormData({ ...formData, vendorName: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                本体費用
              </label>
              <input
                type="number"
                required
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                通貨
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-[var(--color-border-main)]">
                <div className="grid grid-cols-3 gap-1 w-full">
                  {CURRENCIES.map((curr) => (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, currency: curr.code })
                      }
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        formData.currency === curr.code
                          ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm"
                          : "text-[var(--color-brand-secondary)] hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {curr.code}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                税区分
              </label>
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-[var(--color-border-main)]">
                {TAX_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, taxType: type.id as any })
                    }
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      formData.taxType === type.id
                        ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm"
                        : "text-[var(--color-brand-secondary)] hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                設置工事費
              </label>
              <input
                type="number"
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.installationCost}
                onChange={(e) =>
                  setFormData({ ...formData, installationCost: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                輸送費
              </label>
              <input
                type="number"
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.shippingCost}
                onChange={(e) =>
                  setFormData({ ...formData, shippingCost: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                消費税率 (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none pr-10"
                  value={formData.taxRate}
                  onChange={(e) =>
                    setFormData({ ...formData, taxRate: e.target.value })
                  }
                  placeholder="10"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--color-brand-secondary)] font-bold">
                  %
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                税金
              </label>
              <input
                type="number"
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.tax}
                onChange={(e) =>
                  setFormData({ ...formData, tax: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                納期
              </label>
              <input
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.deliveryLeadTime}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryLeadTime: e.target.value })
                }
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                有効期限
              </label>
              <input
                type="date"
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                value={formData.validUntil}
                onChange={(e) =>
                  setFormData({ ...formData, validUntil: e.target.value })
                }
              />
            </div>

            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                備考
              </label>
              <textarea
                className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none h-24 resize-none"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--color-border-main)]">
            <button
              type="button"
              onClick={() => onDelete(quote.id)}
              className="px-6 py-3 border border-rose-200 text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-50 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>削除</span>
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-[var(--color-border-main)] rounded-xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              変更内容を保存
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function MasterLineUnitDatabaseView({
  lineUnits,
  equipment,
  schemas,
  onSave,
  setDialog,
}: {
  lineUnits: LineUnitMaster[];
  equipment: MasterEquipment[];
  schemas: EquipmentSchema[];
  onSave: (lu: LineUnitMaster[]) => void;
  setDialog: (val: any) => void;
  key?: string;
}) {
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(schemas.map((s) => s.category).filter(Boolean)),
    );
    if (!cats.includes("その他")) cats.push("その他");
    return cats;
  }, [schemas]);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const [selectedLUId, setSelectedLUId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<LineUnitMaster | null>(null);

  // Sync activeCategory when schemas/categories change
  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const filteredLineUnits = lineUnits.filter((lu) => {
    if (activeCategory === "その他") {
      return (
        !lu.category ||
        !categories.filter((c) => c !== "その他").includes(lu.category) ||
        lu.category === "その他"
      );
    }
    return lu.category === activeCategory;
  });

  // Ensure an item is selected when category changes
  useEffect(() => {
    if (filteredLineUnits.length > 0) {
      if (
        !selectedLUId ||
        !filteredLineUnits.some((lu) => lu.id === selectedLUId)
      ) {
        setSelectedLUId(filteredLineUnits[0].id);
      }
    } else {
      setSelectedLUId(null);
    }
  }, [activeCategory, lineUnits, selectedLUId]);

  const selectedLU = lineUnits.find((lu) => lu.id === selectedLUId);

  const calculateResourceDiff = (resource: any) => {
    if (resource.type !== "設備") return null;
    const master = equipment.find(
      (m) => m.id === resource.equipmentId || m.name === resource.name,
    );
    if (!master) return null;

    const diffs: any = {};
    let hasDiff = false;

    // Check SPM
    if (resource.spm && master.pressSpecs?.spm) {
      if (resource.spm !== master.pressSpecs.spm) {
        diffs.spm = master.pressSpecs.spm;
        hasDiff = true;
      }
    }

    // Check Hourly Rate (as a proxy for capacity/spec if applicable, but usually SPM is the key here)
    // For now we follow the "SPM" and "Capacity" logic from EditView

    return hasDiff ? diffs : null;
  };

  const startEditing = () => {
    if (selectedLU) {
      setEditValues(JSON.parse(JSON.stringify(selectedLU)));
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValues(null);
  };

  const saveEditing = () => {
    if (editValues) {
      const updated = lineUnits.map((lu) =>
        lu.id === editValues.id ? editValues : lu,
      );
      onSave(updated);
      setIsEditing(false);
      setEditValues(null);
    }
  };

  const handleDelete = (id: string) => {
    setDialog({
      type: "confirm",
      title: "マスタ削除の確認",
      message: "このラインユニットをマスタから削除しますか？",
      isDestructive: true,
      onConfirm: () => {
        const updated = lineUnits.filter((lu) => lu.id !== id);
        onSave(updated);
        if (selectedLUId === id) setSelectedLUId(updated[0]?.id || null);
        setDialog(null);
      },
    });
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg-main)]">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-[var(--color-border-main)] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <Box className="w-8 h-8 text-blue-600" />
              <span>ラインユニットデータベース</span>
            </h1>
            <p className="mt-1 text-sm text-[var(--color-brand-secondary)]">
              登録済みのラインユニット（工程・設備セット）を管理します
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex max-w-7xl mx-auto w-full p-8 gap-8">
        {/* Sidebar List */}
        <div className="w-80 flex flex-col gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[var(--color-border-main)] overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="p-4 border-b border-[var(--color-border-main)] flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
                登録済みユニット
              </span>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                {lineUnits.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {/* Category Tabs */}
              <div className="flex overflow-x-auto scrollbar-hide gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-2 min-w-0 max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    disabled={isEditing}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                      activeCategory === cat
                        ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm"
                        : "text-[var(--color-brand-secondary)] hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filteredLineUnits.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Box className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-xs">
                    このカテゴリに登録されているユニットはありません
                  </p>
                </div>
              ) : (
                filteredLineUnits.map((lu) => (
                  <div
                    key={lu.id}
                    onClick={() => {
                      setSelectedLUId(lu.id);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all group relative cursor-pointer ${
                      selectedLUId === lu.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-[var(--color-brand-secondary)] border border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm mb-0.5 truncate">
                          {lu.name}
                        </div>
                        <div className="text-[10px] opacity-60 flex items-center gap-2 truncate">
                          <span>{lu.resources?.length || 0} リソース</span>
                          <span>•</span>
                          <span>{lu.category || "未分類"}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(lu.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-60 group-hover:opacity-100 z-10 shrink-0"
                        title="マスタから削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Info */}
        <div className="flex-1 overflow-y-auto">
          {selectedLU ? (
            <div className="space-y-6">
              {/* LU Card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-[var(--color-border-main)] overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[var(--color-border-main)] flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Box className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
                        マスタ情報
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {selectedLU.name}
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={cancelEditing}
                          className="px-4 py-2 text-xs font-bold text-[var(--color-brand-secondary)] hover:text-gray-900"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={saveEditing}
                          className="px-6 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>変更を保存</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleDelete(selectedLU.id)}
                          className="px-4 py-2 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>削除</span>
                        </button>
                        <button
                          onClick={startEditing}
                          className="px-6 py-2 text-xs font-bold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:opacity-90 shadow-lg transition-all flex items-center gap-2"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>マスタを編集</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[var(--color-brand-secondary)] uppercase tracking-widest border-b border-[var(--color-border-main)] pb-2">
                          基本設定項目
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          {isEditing ? (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  ユニット名称
                                </label>
                                <input
                                  value={editValues?.name}
                                  onChange={(e) =>
                                    setEditValues((v) =>
                                      v ? { ...v, name: e.target.value } : null,
                                    )
                                  }
                                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  概要・説明
                                </label>
                                <textarea
                                  value={editValues?.description}
                                  onChange={(e) =>
                                    setEditValues((v) =>
                                      v
                                        ? { ...v, description: e.target.value }
                                        : null,
                                    )
                                  }
                                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-4 py-2 text-sm h-24 focus:ring-2 focus:ring-blue-600 outline-none resize-none"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <div className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase mb-1">
                                  ユニット名称
                                </div>
                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                  {selectedLU.name}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase mb-1">
                                  概要・説明
                                </div>
                                <div className="text-sm text-[var(--color-brand-secondary)] leading-relaxed">
                                  {selectedLU.description || "説明はありません"}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[var(--color-brand-secondary)] uppercase tracking-widest border-b border-[var(--color-border-main)] pb-2 flex items-center justify-between">
                          <span>
                            構成リソース ({selectedLU.resources?.length || 0}件)
                          </span>
                          <span className="text-[10px] text-gray-400 normal-case font-normal">
                            登録時のパラメータが保持されます
                          </span>
                        </h3>
                        <div className="space-y-2">
                          {selectedLU.resources?.map((r, i) => {
                            const diff = calculateResourceDiff(r);
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[var(--color-border-main)]/50 relative group"
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-2 h-2 rounded-full ${r.type === "設備" ? "bg-blue-500" : "bg-emerald-500"}`}
                                  />
                                  <div>
                                    <div className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                      <span>{r.name}</span>
                                      {equipment.some(
                                        (me) =>
                                          me.name === r.name ||
                                          me.id === r.equipmentId,
                                      ) && (
                                        <Database className="w-3 h-3 text-blue-500 fill-blue-500/10" />
                                      )}
                                      {diff && (
                                        <div className="relative group/warn">
                                          <AlertCircle className="w-3 h-3 text-rose-500 cursor-help" />
                                          <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 border border-[var(--color-border-main)] rounded-lg p-2 shadow-xl z-20 hidden group-hover/warn:block">
                                            <p className="text-[10px] text-rose-500 font-bold mb-1">
                                              設備DBと差異があります
                                            </p>
                                            {diff.spm && (
                                              <div className="text-[9px] text-[var(--color-brand-secondary)]">
                                                SPM: {r.spm} →{" "}
                                                <span className="font-bold text-emerald-600">
                                                  {diff.spm} (最新)
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-[var(--color-brand-secondary)]">
                                      {r.type} • {r.quantity}
                                      {r.unit}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono font-bold text-blue-600">
                                    ¥
                                    {(
                                      parseFloat(r.hourlyRate) || 0
                                    ).toLocaleString()}
                                    /h
                                  </div>
                                  <div className="text-[10px] text-[var(--color-brand-secondary)]">
                                    SPM: {r.spm}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[var(--color-brand-secondary)] uppercase tracking-widest border-b border-[var(--color-border-main)] pb-2">
                          計算条件プリセット
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {isEditing ? (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  基準稼働時間 (h/月)
                                </label>
                                <input
                                  value={editValues?.workingHours}
                                  onChange={(e) =>
                                    setEditValues((v) =>
                                      v
                                        ? { ...v, workingHours: e.target.value }
                                        : null,
                                    )
                                  }
                                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  想定稼働率 (%)
                                </label>
                                <input
                                  value={editValues?.operatingRate}
                                  onChange={(e) =>
                                    setEditValues((v) =>
                                      v
                                        ? {
                                            ...v,
                                            operatingRate: e.target.value,
                                          }
                                        : null,
                                    )
                                  }
                                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[var(--color-border-main)]/50">
                                <div className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase mb-1">
                                  基準稼働時間
                                </div>
                                <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
                                  {selectedLU.workingHours} h/月
                                </div>
                              </div>
                              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[var(--color-border-main)]/50">
                                <div className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase mb-1">
                                  想定稼働率
                                </div>
                                <div className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
                                  {selectedLU.operatingRate} %
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[var(--color-brand-secondary)] uppercase tracking-widest border-b border-[var(--color-border-main)] pb-2">
                          ライン構成設定プリセット
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                          {isEditing ? (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  前工程
                                </label>
                                <input
                                  value={editValues?.prevUnit}
                                  onChange={(e) =>
                                    setEditValues((v) =>
                                      v
                                        ? { ...v, prevUnit: e.target.value }
                                        : null,
                                    )
                                  }
                                  placeholder="例: U101"
                                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  次工程
                                </label>
                                <input
                                  value={editValues?.nextUnit}
                                  onChange={(e) =>
                                    setEditValues((v) =>
                                      v
                                        ? { ...v, nextUnit: e.target.value }
                                        : null,
                                    )
                                  }
                                  placeholder="例: U103"
                                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  仕掛バッファ
                                </label>
                                <input
                                  value={editValues?.buffer}
                                  onChange={(e) =>
                                    setEditValues((v) =>
                                      v
                                        ? { ...v, buffer: e.target.value }
                                        : null,
                                    )
                                  }
                                  className="w-full bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[var(--color-border-main)]/50">
                                <div className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase mb-1">
                                  前工程
                                </div>
                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                  {selectedLU.prevUnit || "-"}
                                </div>
                              </div>
                              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[var(--color-border-main)]/50">
                                <div className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase mb-1">
                                  次工程
                                </div>
                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                  {selectedLU.nextUnit || "-"}
                                </div>
                              </div>
                              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[var(--color-border-main)]/50">
                                <div className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase mb-1">
                                  仕掛バッファ
                                </div>
                                <div className="font-bold text-gray-900 dark:text-gray-100">
                                  {selectedLU.buffer || "0"}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-[var(--color-brand-secondary)] uppercase tracking-widest border-b border-[var(--color-border-main)] pb-2">
                          メタデータ
                        </h3>
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                          <div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase mb-1 tracking-wider text-sm">
                              カテゴリ
                            </div>
                            {isEditing ? (
                              <input
                                value={editValues?.category}
                                onChange={(e) =>
                                  setEditValues((v) =>
                                    v
                                      ? { ...v, category: e.target.value }
                                      : null,
                                  )
                                }
                                className="w-full bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-1.5 text-sm outline-none"
                              />
                            ) : (
                              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold inline-block">
                                {selectedLU.category || "未分類"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-blue-600 uppercase mb-2 tracking-wider text-sm">
                              タグ
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {selectedLU.tags?.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-bold bg-white dark:bg-gray-800 text-[var(--color-brand-secondary)] px-2.5 py-1 rounded-lg border border-[var(--color-border-main)]"
                                >
                                  {tag}
                                </span>
                              ))}
                              {isEditing && (
                                <button className="text-[10px] font-bold text-blue-600 hover:underline">
                                  + タグを追加
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div className="max-w-md">
                <Box className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-400">
                  ユニットが選択されていません
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  左側のリストから管理したいユニットを選択するか、プラン編集画面から新しいユニットを登録してください。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MasterDatabaseView({
  equipment,
  schemas,
  globalSettings,
  setGlobalSettings,
  onSave,
  setDialog,
}: {
  equipment: MasterEquipment[];
  schemas: EquipmentSchema[];
  globalSettings: any;
  setGlobalSettings: any;
  onSave: (eq: MasterEquipment[]) => void;
  setDialog: (val: any) => void;
  key?: string;
}) {
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(schemas.map((s) => s.category).filter(Boolean)),
    );
    if (!cats.includes("その他")) cats.push("その他");
    return cats;
  }, [schemas]);

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);
  const [selectedEquipId, setSelectedEquipId] = useState<string | null>(null);

  // Sync activeCategory and selectedEquipId when categories change or activeCategory becomes invalid
  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Ensure an item is selected when category changes
  useEffect(() => {
    const filtered = equipment.filter((e) => e.category === activeCategory);
    if (filtered.length > 0) {
      if (!selectedEquipId || !filtered.some((e) => e.id === selectedEquipId)) {
        setSelectedEquipId(filtered[0].id);
      }
    } else {
      setSelectedEquipId(null);
    }
  }, [activeCategory, equipment, selectedEquipId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<MasterEquipment | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isQuoteEditModalOpen, setIsQuoteEditModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<MasterQuote | null>(null);

  const filteredEquipment = equipment.filter(
    (e) => e.category === activeCategory,
  );
  const selectedEquip = equipment.find((e) => e.id === selectedEquipId);

  const addNewEquipment = () => {
    const newId = `EQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const newEquip: MasterEquipment = {
      id: newId,
      category: activeCategory,
      middleCategory: "",
      subCategory: "",
      name: "新規設備",
      modelCode: "",
      manufacturer: "",
      description: "",
      tags: [],
      quotes: [],
      dynamicSpecs: {
        managementNo: `MGT-${newId}`,
        installationDate: new Date().toISOString().split("T")[0],
        location: "未定",
      },
      investmentAmount: 0,
      minOperatingRate: 80,
      depreciationMethod: "定額",
      usefulLife: 10,
      residualValueRatio: 5,
      spm: 0,
      powerConsumption: 0,
    };
    onSave([...equipment, newEquip]);
    setSelectedEquipId(newId);
    // Start editing immediately
    setEditValues(JSON.parse(JSON.stringify(newEquip)));
    setIsEditing(true);
  };

  const startEditing = () => {
    if (selectedEquip) {
      setEditValues(JSON.parse(JSON.stringify(selectedEquip)));
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValues(null);
  };

  const saveEditing = () => {
    if (editValues) {
      if (editValues.spm === undefined || editValues.spm <= 0) {
        setDialog({
          type: "alert",
          title: "入力エラー",
          message: "SPM値には1以上の数値を入力してください。",
          onConfirm: () => setDialog(null),
        });
        return;
      }
      if (
        editValues.powerConsumption === undefined ||
        editValues.powerConsumption <= 0
      ) {
        setDialog({
          type: "alert",
          title: "入力エラー",
          message: "定格電力(kW)には0より大きい数値を入力してください。",
          onConfirm: () => setDialog(null),
        });
        return;
      }
      const updatedEquipment = (equipment || []).map((e) =>
        e.id === editValues.id ? editValues : e,
      );
      onSave(updatedEquipment);
      setIsEditing(false);
      setEditValues(null);
    }
  };

  const handleDeleteEquip = (id: string) => {
    setDialog({
      type: "confirm",
      title: "マスタ削除の確認",
      message: "この設備をマスタから削除しますか？",
      isDestructive: true,
      onConfirm: () => {
        const updated = equipment.filter((e) => e.id !== id);
        onSave(updated);
        if (selectedEquipId === id) {
          const remaining = updated.filter(
            (e) => e.category === activeCategory,
          );
          setSelectedEquipId(remaining[0]?.id || updated[0]?.id || null);
        }
        setDialog(null);
      },
    });
  };

  const handleFieldChange = (path: string, value: any) => {
    setEditValues((prev) => {
      if (!prev) return null;
      const newValues = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let current: any = newValues;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return newValues;
    });
  };

  const handleQuoteSubmit = (newQuote: MasterQuote) => {
    if (!selectedEquipId) return;

    updateQuotesForEquip(selectedEquipId, (quotes) => [
      ...(quotes || []),
      { ...newQuote, isPreferred: true },
    ]);
    setIsQuoteModalOpen(false);
  };

  const handleQuoteUpdate = (updatedQuote: MasterQuote) => {
    if (!selectedEquipId) return;

    updateQuotesForEquip(selectedEquipId, (quotes) =>
      (quotes || []).map((q) => (q.id === updatedQuote.id ? updatedQuote : q)),
    );
    setIsQuoteEditModalOpen(false);
    setSelectedQuote(null);
  };

  const handleQuoteDelete = (quoteId: string) => {
    if (!selectedEquipId) return;

    setDialog({
      type: "confirm",
      title: "見積情報の削除",
      message: "この見積情報を削除しますか？",
      isDestructive: true,
      onConfirm: () => {
        updateQuotesForEquip(selectedEquipId, (quotes) =>
          (quotes || []).filter((q) => q.id !== quoteId),
        );
        setIsQuoteEditModalOpen(false);
        setSelectedQuote(null);
        setDialog(null);
      },
    });
  };

  const updateQuotesForEquip = (
    equipId: string,
    transform: (quotes: MasterQuote[]) => MasterQuote[],
  ) => {
    const updatedEquipment = (equipment || []).map((eq) => {
      if (eq.id === equipId) {
        const nextQuotes = transform(eq.quotes || []);

        // 自動計算: チェックが入っている見積の総額
        const total = nextQuotes
          .filter((q) => q.isPreferred)
          .reduce((sum, q) => {
            const taxToAdd = q.taxType === "Excluded" ? Number(q.tax) || 0 : 0;
            return (
              sum +
              (Number(q.amount) || 0) +
              (Number(q.installationCost) || 0) +
              (Number(q.shippingCost) || 0) +
              taxToAdd
            );
          }, 0);

        return {
          ...eq,
          quotes: nextQuotes,
          investmentAmount: total,
        };
      }
      return eq;
    });

    onSave(updatedEquipment);

    // 編集中の場合はeditValuesも更新する
    if (isEditing && editValues && editValues.id === equipId) {
      const equip = updatedEquipment.find((e) => e.id === equipId);
      if (equip) setEditValues(JSON.parse(JSON.stringify(equip)));
    }
  };

  const setPreferredQuote = (quoteId: string) => {
    if (!selectedEquipId) return;
    updateQuotesForEquip(selectedEquipId, (quotes) =>
      quotes.map((q) => ({
        ...q,
        isPreferred: q.id === quoteId ? !q.isPreferred : q.isPreferred,
      })),
    );
  };

  const getSuggestions = (
    field: string,
  ): { fieldPath: string; items: string[] } => {
    const suggestions = new Set<string>();

    // Helper to get nested value
    const getNestedValue = (obj: any, path: string): any => {
      return path.split(".").reduce((acc, part) => acc && acc[part], obj);
    };

    equipment.forEach((eq) => {
      // Check common fields
      if (eq[field as keyof MasterEquipment]) {
        suggestions.add(String(eq[field as keyof MasterEquipment]));
      }
      // Check spec fields
      if (eq.pressSpecs) {
        const val = getNestedValue(eq.pressSpecs, field);
        if (val) suggestions.add(String(val));
      }
    });

    if (
      globalSettings.customSuggestions &&
      globalSettings.customSuggestions[field]
    ) {
      globalSettings.customSuggestions[field].forEach((s: string) =>
        suggestions.add(s),
      );
    }

    return {
      fieldPath: field,
      items: Array.from(suggestions)
        .filter((s) => s && s.trim() !== "")
        .sort(),
    };
  };

  const displayEquip = isEditing ? editValues : selectedEquip;
  const currentSchema = displayEquip
    ? schemas.find(
        (s) =>
          s.id === displayEquip.schemaId ||
          s.subCategory === displayEquip.subCategory,
      )
    : null;
  const combinedGroups = displayEquip
    ? getCombinedSchemaGroups(
        schemas,
        displayEquip.category,
        displayEquip.middleCategory,
        displayEquip.subCategory,
      )
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col h-full overflow-hidden p-8"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">
            設備・見積データベース
          </h2>
          <p className="text-sm text-[var(--color-brand-secondary)]">
            社内で使用・検討される設備の仕様および見積情報を一元管理します。
          </p>
        </div>
        {!isEditing && (
          <button
            id="btn_master_add_new"
            onClick={addNewEquipment}
            className="flex items-center gap-2.5 px-6 py-2.5 bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-700 text-white rounded-xl transition-all font-black text-sm shadow-xl shadow-blue-600/10 active:scale-95 group"
          >
            <div className="bg-white/20 p-1 rounded-lg group-hover:rotate-90 transition-transform">
              <PlusCircle className="w-4 h-4" />
            </div>
            <span>設備を新規登録</span>
          </button>
        )}
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Category & List Sidebar */}
        <div className="w-80 flex flex-col gap-4 overflow-hidden">
          {/* Category Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide gap-1.5 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl min-w-0 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                disabled={isEditing}
                onClick={() => {
                  setActiveCategory(cat);
                  const first = equipment.find((e) => e.category === cat);
                  if (first) setSelectedEquipId(first.id);
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm"
                    : "text-[var(--color-brand-secondary)] hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Equipment List */}
          <div className="flex-1 overflow-y-auto bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl">
            <div className="p-4 border-b border-[var(--color-border-main)] sticky top-0 bg-[var(--color-bg-main)] z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-brand-secondary)]" />
                <input
                  type="text"
                  disabled={isEditing}
                  placeholder="設備・型式を検索..."
                  className="w-full pl-9 pr-4 py-2 bg-[var(--color-bg-alt)] border-none rounded-lg text-xs focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
                />
              </div>
            </div>
            <div className="divide-y divide-[var(--color-border-main)]">
              {filteredEquipment.length > 0 ? (
                filteredEquipment.map((item) => (
                  <button
                    key={item.id}
                    disabled={isEditing}
                    onClick={() => setSelectedEquipId(item.id)}
                    className={`w-full p-4 text-left hover:bg-blue-600/5 transition-all group disabled:cursor-not-allowed ${
                      selectedEquipId === item.id ? "bg-blue-600/5" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex gap-1.5 overflow-hidden">
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase whitespace-nowrap ${
                            selectedEquipId === item.id
                              ? "bg-blue-500 text-white"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                          }`}
                        >
                          {item.middleCategory}
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase whitespace-nowrap ${
                            selectedEquipId === item.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800 text-[var(--color-brand-secondary)]"
                          }`}
                        >
                          {item.subCategory}
                        </span>
                      </div>
                      <span className="text-[9px] text-[var(--color-brand-secondary)] font-mono shrink-0 ml-2">
                        {item.manufacturer}
                      </span>
                    </div>
                    <div
                      className={`text-sm font-bold mb-1 transition-colors ${selectedEquipId === item.id ? "text-blue-600" : "group-hover:text-blue-600"}`}
                    >
                      {item.name}
                    </div>
                    <div className="text-[10px] text-[var(--color-brand-secondary)] font-mono">
                      {item.modelCode}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[var(--color-brand-secondary)] opacity-50 italic">
                  このカテゴリの登録はありません
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Detail */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl shadow-sm relative">
          {displayEquip ? (
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded border border-gray-200 dark:border-gray-700 uppercase tracking-wider">
                      {displayEquip.category}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                      {displayEquip.middleCategory}
                    </span>
                    <span className="text-[var(--color-brand-secondary)] text-xs font-mono">
                      {displayEquip.id}
                    </span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-4 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-600/5">
                        <div className="flex-1 min-w-[280px] space-y-2">
                          <label className="text-[11px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5" />
                            1. 設備分類（構造定義）を選択してください
                          </label>
                          <select
                            className="bg-white dark:bg-gray-900 border-2 border-blue-500 dark:border-blue-700 rounded-xl px-4 py-2 text-sm font-black w-full outline-none focus:ring-4 focus:ring-blue-600/20 transition-all hover:border-blue-600 shadow-sm"
                            value={
                              displayEquip.schemaId ||
                              schemas.find(
                                (s) =>
                                  s.subCategory === displayEquip.subCategory,
                              )?.id ||
                              (displayEquip.subCategory === "その他"
                                ? "other"
                                : "")
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "other") {
                                handleFieldChange("schemaId", undefined);
                                handleFieldChange("subCategory", "その他");
                                handleFieldChange("category", "");
                                handleFieldChange("middleCategory", "");
                              } else if (val === "") {
                                handleFieldChange("schemaId", undefined);
                                handleFieldChange("subCategory", "");
                                handleFieldChange("category", "");
                                handleFieldChange("middleCategory", "");
                              } else {
                                const schema = schemas.find(
                                  (s) => s.id === val,
                                );
                                if (schema) {
                                  handleFieldChange("schemaId", schema.id);
                                  handleFieldChange(
                                    "subCategory",
                                    schema.subCategory,
                                  );
                                  handleFieldChange(
                                    "category",
                                    schema.category,
                                  );
                                  handleFieldChange(
                                    "middleCategory",
                                    schema.middleCategory,
                                  );
                                }
                              }
                            }}
                          >
                            <option value="">
                              -- 分類を選択してください --
                            </option>
                            {schemas
                              .filter((s) => s.subCategory !== "")
                              .map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.category} 〉{s.middleCategory} 〉
                                  {s.subCategory}
                                </option>
                              ))}
                            <option value="other">
                              その他（個別定義なし）
                            </option>
                          </select>
                          <p className="text-[10px] text-blue-500/70 font-medium italic">
                            ※ 分類を選択すると詳細な入力項目が有効化されます
                          </p>
                        </div>
                        <div
                          className={`flex-1 min-w-[150px] space-y-1 transition-all ${displayEquip.subCategory === "その他" ? "opacity-100 translate-y-0" : "opacity-40 grayscale translate-y-1"}`}
                        >
                          <label className="text-[10px] font-bold text-blue-400 uppercase">
                            大分類
                          </label>
                          {displayEquip.subCategory === "その他" ? (
                            <input
                              className="w-full bg-white dark:bg-gray-900 border-2 border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                              value={displayEquip.category}
                              onChange={(e) =>
                                handleFieldChange("category", e.target.value)
                              }
                              placeholder="例: 加工設備"
                            />
                          ) : (
                            <div className="bg-gray-100 dark:bg-gray-800 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm font-bold text-gray-500">
                              {displayEquip.category || "未設定"}
                            </div>
                          )}
                        </div>
                        <div
                          className={`flex-1 min-w-[150px] space-y-1 transition-all ${displayEquip.subCategory === "その他" ? "opacity-100 translate-y-0" : "opacity-40 grayscale translate-y-1"}`}
                        >
                          <label className="text-[10px] font-bold text-blue-400 uppercase">
                            中分類
                          </label>
                          {displayEquip.subCategory === "その他" ? (
                            <input
                              className="w-full bg-white dark:bg-gray-900 border-2 border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                              value={displayEquip.middleCategory}
                              onChange={(e) =>
                                handleFieldChange(
                                  "middleCategory",
                                  e.target.value,
                                )
                              }
                              placeholder="例: 接合・組立"
                            />
                          ) : (
                            <div className="bg-gray-100 dark:bg-gray-800 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm font-bold text-gray-500">
                              {displayEquip.middleCategory || "未設定"}
                            </div>
                          )}
                        </div>
                        <div
                          className={`flex-1 min-w-[150px] space-y-1 transition-all ${displayEquip.subCategory === "その他" ? "opacity-100 translate-y-0" : "opacity-40 grayscale translate-y-1"}`}
                        >
                          <label className="text-[10px] font-bold text-blue-400 uppercase">
                            小分類
                          </label>
                          {displayEquip.subCategory === "その他" ? (
                            <input
                              className="w-full bg-white dark:bg-gray-900 border-2 border-blue-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none"
                              value={displayEquip.subCategory}
                              onChange={(e) =>
                                handleFieldChange("subCategory", e.target.value)
                              }
                              placeholder="例: 特殊加工機"
                            />
                          ) : (
                            <div className="bg-gray-100 dark:bg-gray-800 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm font-bold text-gray-500">
                              {displayEquip.subCategory || "未設定"}
                            </div>
                          )}
                        </div>
                      </div>

                      {displayEquip.subCategory === "その他" && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-[10px] text-amber-800 dark:text-amber-400 font-bold flex items-center gap-3">
                          <AlertCircle className="w-4 h-4" />
                          <div>
                            「その他」を選択した場合、詳細なスペック項目の形式（構造定義）がないため自由入力のみとなります。
                            よく使用する分類の場合は「設備構造マスタ管理」から定義を追加することを推奨します。
                          </div>
                        </div>
                      )}

                      <div
                        className={`space-y-6 transition-all duration-500 ${!displayEquip.subCategory ? "opacity-20 grayscale pointer-events-none scale-[0.98] blur-[1px]" : "opacity-100 scale-100 blur-0"}`}
                      >
                        <div className="space-y-1">
                          <label className="text-[11px] font-black text-gray-500 uppercase flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-[9px]">
                              2
                            </span>
                            基本情報・スペックの入力
                          </label>
                          <input
                            className="bg-[var(--color-bg-alt)] border-2 border-[var(--color-border-main)] rounded-2xl px-5 py-4 text-2xl font-black w-full focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all placeholder:text-gray-300 shadow-inner"
                            value={displayEquip.name}
                            onChange={(e) =>
                              handleFieldChange("name", e.target.value)
                            }
                            placeholder="設備名称（例: NCプレス機 01）"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                              メーカー
                            </label>
                            <input
                              className="bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-2 text-sm font-bold w-full focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                              value={displayEquip.manufacturer}
                              onChange={(e) =>
                                handleFieldChange(
                                  "manufacturer",
                                  e.target.value,
                                )
                              }
                              placeholder="AMADA, FANUC等"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">
                              型式・品番
                            </label>
                            <input
                              className="bg-[var(--color-bg-alt)] border border-[var(--color-border-main)] rounded-xl px-4 py-2 text-sm font-mono w-full focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                              value={displayEquip.modelCode}
                              onChange={(e) =>
                                handleFieldChange("modelCode", e.target.value)
                              }
                              placeholder="MODEL-XYZ"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-3xl font-bold mb-2">
                        {displayEquip.name}
                      </h3>
                      <div className="flex items-center gap-4 text-[var(--color-brand-secondary)]">
                        <div className="flex items-center gap-1.5">
                          <Settings className="w-3.5 h-3.5" />
                          <span className="text-sm">
                            {displayEquip.manufacturer} /{" "}
                            {displayEquip.modelCode}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 border border-[var(--color-border-main)] rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={saveEditing}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>保存</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDeleteEquip(selectedEquip.id)}
                        className="px-4 py-2 border border-rose-200 dark:border-rose-900/30 rounded-lg text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>削除</span>
                      </button>
                      <button
                        onClick={startEditing}
                        className="px-4 py-2 border border-[var(--color-border-main)] rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                      >
                        編集
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* Dynamic Parameters (Groups from Schema) */}
                {combinedGroups.length > 0 &&
                  combinedGroups.map((group) => (
                    <section key={group.id} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                        <h4 className="text-lg font-bold">{group.label}</h4>
                      </div>

                      <div className="bg-white dark:bg-gray-900 border border-[var(--color-border-main)] rounded-2xl shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 p-6">
                          {group.fields.map((field) => (
                            <React.Fragment key={field.id}>
                              {isEditing ? (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {field.label}{" "}
                                    {field.unit && `(${field.unit})`}
                                  </label>
                                  <div className="relative group">
                                    <input
                                      className="w-full bg-gray-50 dark:bg-gray-800 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all group-hover:border-blue-300"
                                      value={
                                        displayEquip.dynamicSpecs?.[
                                          field.id
                                        ] !== undefined
                                          ? displayEquip.dynamicSpecs[field.id]
                                          : field.id === "spm"
                                            ? displayEquip.spm || ""
                                            : field.id === "powerConsumption"
                                              ? displayEquip.powerConsumption ||
                                                ""
                                              : ""
                                      }
                                      placeholder={`${field.label}を入力`}
                                      type={
                                        field.type === "number"
                                          ? "number"
                                          : "text"
                                      }
                                      onChange={(e) => {
                                        const specs = {
                                          ...(displayEquip.dynamicSpecs || {}),
                                          [field.id]: e.target.value,
                                        };
                                        handleFieldChange(
                                          "dynamicSpecs",
                                          specs,
                                        );

                                        // Global Sync
                                        if (field.id === "spm")
                                          handleFieldChange(
                                            "spm",
                                            parseFloat(e.target.value) || 0,
                                          );
                                        if (field.id === "powerConsumption")
                                          handleFieldChange(
                                            "powerConsumption",
                                            parseFloat(e.target.value) || 0,
                                          );

                                        // Secondary sync: if it's a press field and we have legacy pressSpecs, sync it
                                        if (
                                          displayEquip.subCategory ===
                                            "プレス機" &&
                                          displayEquip.pressSpecs
                                        ) {
                                          // Simple mapping for legacy sync (backwards compatibility for calc logic)
                                          const legacyMap: Record<
                                            string,
                                            string
                                          > = {
                                            motorPower: "motorPower",
                                            spm: "spm",
                                            capacity: "capacity",
                                          };
                                          if (legacyMap[field.id]) {
                                            handleFieldChange(
                                              `pressSpecs.${legacyMap[field.id]}`,
                                              e.target.value,
                                            );
                                          }
                                        }
                                      }}
                                    />
                                    <Pencil className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1 py-1 group">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                                    {field.label}
                                  </span>
                                  <div className="flex items-baseline gap-1.5">
                                    <span
                                      className={`text-base font-black tracking-tight ${field.id === "capacity" || field.id === "spm" ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-100"}`}
                                    >
                                      {displayEquip.dynamicSpecs?.[field.id] !==
                                      undefined
                                        ? displayEquip.dynamicSpecs[field.id]
                                        : field.id === "spm"
                                          ? displayEquip.spm || "-"
                                          : field.id === "powerConsumption"
                                            ? displayEquip.powerConsumption ||
                                              "-"
                                            : "-"}
                                    </span>
                                    {field.unit && (
                                      <span className="text-[10px] font-bold text-gray-400">
                                        {field.unit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </section>
                  ))}

                {/* Legacy pressSpecs rendering - only shown if NO schema matches and it exists */}
                {!currentSchema ? (
                  displayEquip.subCategory === "プレス" &&
                  displayEquip.pressSpecs ? (
                    <div className="space-y-6">
                      {/* 1. 本体主要仕様 */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-[var(--color-border-main)] overflow-hidden">
                        <div className="px-6 py-3 border-b border-[var(--color-border-main)] bg-gray-100/50 dark:bg-gray-700/30">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                            1. 本体主要仕様
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 p-6">
                          {isEditing ? (
                            <>
                              <EditSpecItem
                                label="フレーム形式"
                                value={displayEquip.pressSpecs.frameType}
                                onChange={(v) =>
                                  handleFieldChange("pressSpecs.frameType", v)
                                }
                                suggestions={getSuggestions("frameType")}
                              />
                              <EditSpecItem
                                label="駆動方式"
                                value={displayEquip.pressSpecs.driveSystem}
                                onChange={(v) =>
                                  handleFieldChange("pressSpecs.driveSystem", v)
                                }
                                suggestions={getSuggestions("driveSystem")}
                              />
                              <EditSpecItem
                                label="加圧能力"
                                value={displayEquip.pressSpecs.capacity}
                                onChange={(v) =>
                                  handleFieldChange("pressSpecs.capacity", v)
                                }
                                highlight
                                unit="kN"
                                type="number"
                              />
                              <EditSpecItem
                                label="能力発生位置"
                                value={displayEquip.pressSpecs.capacityPoint}
                                onChange={(v) =>
                                  handleFieldChange(
                                    "pressSpecs.capacityPoint",
                                    v,
                                  )
                                }
                                unit="mm"
                                type="number"
                              />
                              <EditSpecItem
                                label="ストローク長さ"
                                value={displayEquip.pressSpecs.strokeLength}
                                onChange={(v) =>
                                  handleFieldChange(
                                    "pressSpecs.strokeLength",
                                    v,
                                  )
                                }
                                unit="mm"
                                type="number"
                              />
                              <EditRangeFields
                                label="ストローク数"
                                value={displayEquip.pressSpecs.spm}
                                onChange={(v) =>
                                  handleFieldChange("pressSpecs.spm", v)
                                }
                                unit="spm"
                                highlight
                                color="text-emerald-600"
                              />
                              <EditSpecItem
                                label="ダイハイト"
                                value={displayEquip.pressSpecs.dieHeight}
                                onChange={(v) =>
                                  handleFieldChange("pressSpecs.dieHeight", v)
                                }
                                unit="mm"
                                type="number"
                              />
                              <EditSpecItem
                                label="スライド調整量"
                                value={displayEquip.pressSpecs.slideAdjustment}
                                onChange={(v) =>
                                  handleFieldChange(
                                    "pressSpecs.slideAdjustment",
                                    v,
                                  )
                                }
                                unit="mm"
                                type="number"
                              />
                              <EditDimensionFields
                                label="ボルスタ寸法"
                                value={displayEquip.pressSpecs.bolsterSize}
                                onChange={(v) =>
                                  handleFieldChange("pressSpecs.bolsterSize", v)
                                }
                                span={2}
                                unit="mm"
                              />
                              <EditDimensionFields
                                label="スライド下面寸法"
                                value={displayEquip.pressSpecs.slideSize}
                                onChange={(v) =>
                                  handleFieldChange("pressSpecs.slideSize", v)
                                }
                                unit="mm"
                              />
                              <EditSpecItem
                                label="ボルスタ上面高さ"
                                value={displayEquip.pressSpecs.bolsterHeight}
                                onChange={(v) =>
                                  handleFieldChange(
                                    "pressSpecs.bolsterHeight",
                                    v,
                                  )
                                }
                                suggestions={getSuggestions("bolsterHeight")}
                              />
                            </>
                          ) : (
                            <>
                              <SpecItem
                                label="フレーム形式"
                                value={displayEquip.pressSpecs.frameType}
                              />
                              <SpecItem
                                label="駆動方式"
                                value={displayEquip.pressSpecs.driveSystem}
                              />
                              <SpecItem
                                label="加圧能力"
                                value={displayEquip.pressSpecs.capacity}
                                highlight
                              />
                              <SpecItem
                                label="能力発生位置"
                                value={displayEquip.pressSpecs.capacityPoint}
                              />
                              <SpecItem
                                label="ストローク長さ"
                                value={displayEquip.pressSpecs.strokeLength}
                              />
                              <SpecItem
                                label="ストローク数"
                                value={displayEquip.pressSpecs.spm}
                                unit="spm"
                                highlight
                                color="text-emerald-600"
                              />
                              <SpecItem
                                label="ダイハイト"
                                value={displayEquip.pressSpecs.dieHeight}
                              />
                              <SpecItem
                                label="スライド調整量"
                                value={displayEquip.pressSpecs.slideAdjustment}
                              />
                              <SpecItem
                                label="ボルスタ寸法"
                                value={displayEquip.pressSpecs.bolsterSize}
                                span={2}
                              />
                              <SpecItem
                                label="スライド下面寸法"
                                value={displayEquip.pressSpecs.slideSize}
                              />
                              <SpecItem
                                label="ボルスタ上面高さ"
                                value={displayEquip.pressSpecs.bolsterHeight}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* 2. 金型・段取・その他能力 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-[var(--color-border-main)] overflow-hidden">
                          <div className="px-6 py-3 border-b border-[var(--color-border-main)] bg-gray-100/50 dark:bg-gray-700/30">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                              2. 金型・段取関連 / ダイクッション
                            </h5>
                          </div>
                          <div className="p-6 space-y-4">
                            {displayEquip.pressSpecs.dieCushion ? (
                              <div className="grid grid-cols-2 gap-4">
                                {isEditing ? (
                                  <>
                                    <EditSpecItem
                                      label="クッション能力"
                                      value={
                                        displayEquip.pressSpecs.dieCushion
                                          .capacity
                                      }
                                      onChange={(v) =>
                                        handleFieldChange(
                                          "pressSpecs.dieCushion.capacity",
                                          v,
                                        )
                                      }
                                      unit="ton"
                                      type="number"
                                    />
                                    <EditSpecItem
                                      label="ストローク"
                                      value={
                                        displayEquip.pressSpecs.dieCushion
                                          .stroke
                                      }
                                      onChange={(v) =>
                                        handleFieldChange(
                                          "pressSpecs.dieCushion.stroke",
                                          v,
                                        )
                                      }
                                      unit="mm"
                                      type="number"
                                    />
                                    <EditDimensionFields
                                      label="クッション面"
                                      value={
                                        displayEquip.pressSpecs.dieCushion.area
                                      }
                                      onChange={(v) =>
                                        handleFieldChange(
                                          "pressSpecs.dieCushion.area",
                                          v,
                                        )
                                      }
                                      unit="mm"
                                      span={2}
                                    />
                                  </>
                                ) : (
                                  <>
                                    <SpecItem
                                      label="クッション能力"
                                      value={
                                        displayEquip.pressSpecs.dieCushion
                                          .capacity
                                      }
                                    />
                                    <SpecItem
                                      label="ストローク"
                                      value={
                                        displayEquip.pressSpecs.dieCushion
                                          .stroke
                                      }
                                    />
                                    <SpecItem
                                      label="クッション面"
                                      value={
                                        displayEquip.pressSpecs.dieCushion.area
                                      }
                                      span={2}
                                    />
                                  </>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-[var(--color-brand-secondary)] italic">
                                ダイクッション情報なし
                              </p>
                            )}
                            <div className="pt-4 border-t border-[var(--color-border-main)]">
                              {isEditing ? (
                                <EditSpecItem
                                  label="サイドオープニング"
                                  value={displayEquip.pressSpecs.sideOpening}
                                  onChange={(v) =>
                                    handleFieldChange(
                                      "pressSpecs.sideOpening",
                                      v,
                                    )
                                  }
                                />
                              ) : (
                                <SpecItem
                                  label="サイドオープニング"
                                  value={displayEquip.pressSpecs.sideOpening}
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-[var(--color-border-main)] overflow-hidden">
                          <div className="px-6 py-3 border-b border-[var(--color-border-main)] bg-gray-100/50 dark:bg-gray-700/30">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                              3. インフラ・動力仕様
                            </h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 p-6">
                            {isEditing ? (
                              <>
                                <EditSpecItem
                                  label="主電動機出力"
                                  value={displayEquip.pressSpecs.motorPower}
                                  onChange={(v) =>
                                    handleFieldChange(
                                      "pressSpecs.motorPower",
                                      v,
                                    )
                                  }
                                  unit="kW"
                                  type="number"
                                />
                                <EditSpecItem
                                  label="許容仕事量"
                                  value={displayEquip.pressSpecs.workEnergy}
                                  onChange={(v) =>
                                    handleFieldChange(
                                      "pressSpecs.workEnergy",
                                      v,
                                    )
                                  }
                                  unit="kN・m"
                                  type="number"
                                />
                                <EditSpecItem
                                  label="使用空気圧"
                                  value={displayEquip.pressSpecs.airPressure}
                                  onChange={(v) =>
                                    handleFieldChange(
                                      "pressSpecs.airPressure",
                                      v,
                                    )
                                  }
                                  unit="MPa"
                                  type="number"
                                />
                                <EditSelectGroup
                                  label="電源"
                                  value={displayEquip.pressSpecs.powerSource}
                                  options={[
                                    "100V",
                                    "200V",
                                    "220V",
                                    "400V",
                                    "440V",
                                  ]}
                                  onChange={(v) =>
                                    handleFieldChange(
                                      "pressSpecs.powerSource",
                                      v,
                                    )
                                  }
                                />
                              </>
                            ) : (
                              <>
                                <SpecItem
                                  label="主電動機出力"
                                  value={displayEquip.pressSpecs.motorPower}
                                />
                                <SpecItem
                                  label="許容仕事量"
                                  value={displayEquip.pressSpecs.workEnergy}
                                />
                                <SpecItem
                                  label="使用空気圧"
                                  value={displayEquip.pressSpecs.airPressure}
                                />
                                <SpecItem
                                  label="電源"
                                  value={displayEquip.pressSpecs.powerSource}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        {/* 4. 自動化・インターフェース・安全 */}
                        <div className="bg-[var(--color-bg-alt)] rounded-2xl border border-[var(--color-border-main)] p-6 md:col-span-2">
                          <h5 className="text-sm font-bold mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-rose-600" />
                            <span>自動化・安全・運転仕様</span>
                          </h5>
                          {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  説明文（備考）
                                </label>
                                <textarea
                                  className="w-full h-32 bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-600"
                                  value={displayEquip.description}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="設備の特徴、注意事項など..."
                                />
                              </div>
                              <div className="space-y-4">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  タグ（カンマ区切り）
                                </label>
                                <input
                                  className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-600"
                                  value={displayEquip.tags.join(", ")}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "tags",
                                      e.target.value
                                        .split(",")
                                        .map((t) => t.trim()),
                                    )
                                  }
                                  placeholder="高精度, サーボ, 200t..."
                                />
                              </div>
                              <div className="space-y-4">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  参照投資額
                                </label>
                                <input
                                  type="number"
                                  className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-600 font-mono"
                                  value={displayEquip.investmentAmount || ""}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "investmentAmount",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  placeholder="例: 10000000"
                                />
                              </div>
                              <div className="space-y-4">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  想定最低稼働率 (%)
                                </label>
                                <input
                                  type="number"
                                  className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-600 font-mono"
                                  value={displayEquip.minOperatingRate || ""}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "minOperatingRate",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  placeholder="例: 80"
                                />
                              </div>
                              <div className="space-y-4">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  償却方法
                                </label>
                                <select
                                  className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-600 outline-none"
                                  value={
                                    displayEquip.depreciationMethod || "定額"
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "depreciationMethod",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="定額">定額法</option>
                                  <option value="定率">定率法</option>
                                </select>
                              </div>
                              <div className="space-y-4">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  残存価額比率 (%)
                                </label>
                                <input
                                  type="number"
                                  className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-600 font-mono"
                                  value={
                                    displayEquip.residualValueRatio !==
                                    undefined
                                      ? displayEquip.residualValueRatio
                                      : 5
                                  }
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "residualValueRatio",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-4">
                                <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  償却年数 (年)
                                </label>
                                <input
                                  type="number"
                                  className="w-full bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-600 font-mono"
                                  value={displayEquip.usefulLife || 10}
                                  onChange={(e) =>
                                    handleFieldChange(
                                      "usefulLife",
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  生産自動化 I/F
                                </p>
                                <ul className="text-xs space-y-1.5 list-disc pl-4 text-[var(--color-brand-secondary)]">
                                  <li>自動化用エア回路 (3回路)</li>
                                  <li>ミスフィード検出 (PS-662系)</li>
                                  <li>ロータリカム (4連)</li>
                                  <li>コイルライン信号取合い</li>
                                </ul>
                              </div>
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  安全・保守装備
                                </p>
                                <ul className="text-xs space-y-1.5 list-disc pl-4 text-[var(--color-brand-secondary)]">
                                  <li>光線式安全装置 (SUNX SF4B)</li>
                                  <li>重量計ロードモニタ (LOM-SIT)</li>
                                  <li>メンテナンス励行カウンタ</li>
                                  <li>非常停止・スライド開放検出</li>
                                </ul>
                              </div>
                              <div className="space-y-3">
                                <p className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                  運転モード
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                  {["寸動", "連続", "一工程", "安全一工程"].map(
                                    (mode) => (
                                      <span
                                        key={mode}
                                        className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-[var(--color-border-main)] rounded text-[10px] font-medium"
                                      >
                                        {mode}
                                      </span>
                                    ),
                                  )}
                                </div>
                                <p className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase mb-1">
                                  投資・稼働条件 (自動算出用)
                                </p>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">
                                      参照投資額
                                    </span>
                                    <span className="font-mono">
                                      {displayEquip.investmentAmount
                                        ? `${displayEquip.investmentAmount.toLocaleString()} 円`
                                        : "-"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">
                                      想定最低稼働率
                                    </span>
                                    <span className="font-mono">
                                      {displayEquip.minOperatingRate
                                        ? `${displayEquip.minOperatingRate}%`
                                        : "-"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">
                                      償却条件
                                    </span>
                                    <span className="font-mono">
                                      {displayEquip.depreciationMethod ||
                                        "定額"}
                                      /{displayEquip.usefulLife || 10}年(
                                      {displayEquip.residualValueRatio !==
                                      undefined
                                        ? displayEquip.residualValueRatio
                                        : 5}
                                      %)
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-[var(--color-border-main)] flex items-center justify-center min-h-[120px] text-[var(--color-brand-secondary)] text-sm">
                      仕様情報が登録されていません
                    </div>
                  )
                ) : null}

                {/* Quotes Section (Disabled when editing basic info for now) */}
                {!isEditing && (
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-lg font-bold">見積履歴</h4>
                      </div>
                      <button
                        onClick={() => setIsQuoteModalOpen(true)}
                        className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        見積を追加登録
                      </button>
                    </div>

                    <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl overflow-hidden overflow-x-auto scrollbar-thin">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-[var(--color-border-main)]">
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                              ベンダー
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-right">
                              本体費用
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-right">
                              設置工事費
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-right">
                              輸送費
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-right">
                              税金
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-right">
                              合計金額
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-center">
                              納期
                            </th>
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] text-center">
                              有効期限
                            </th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-main)]">
                          {selectedEquip.quotes.length > 0 ? (
                            selectedEquip.quotes.map((quote) => (
                              <tr
                                key={quote.id}
                                onClick={() => setPreferredQuote(quote.id)}
                                className={`group cursor-pointer hover:bg-blue-600/5 transition-all ${quote.isPreferred ? "bg-emerald-600/5" : ""}`}
                              >
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${quote.isPreferred ? "bg-emerald-600 border-emerald-600" : "border-gray-300 group-hover:border-blue-600"}`}
                                    >
                                      {quote.isPreferred && (
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <p
                                        className={`text-sm font-bold ${quote.isPreferred ? "text-emerald-700 dark:text-emerald-400" : ""}`}
                                      >
                                        {quote.vendorName}
                                      </p>
                                      <p className="text-[10px] text-[var(--color-brand-secondary)] truncate max-w-[200px]">
                                        {quote.remarks || "-"}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-right font-mono font-bold">
                                  <span className="text-[10px] font-normal text-[var(--color-brand-secondary)] mr-1">
                                    {quote.currency}
                                  </span>
                                  {quote.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-5 text-right font-mono text-[var(--color-brand-secondary)] text-sm">
                                  {quote.installationCost.toLocaleString()}
                                </td>
                                <td className="px-6 py-5 text-right font-mono text-[var(--color-brand-secondary)] text-sm">
                                  {quote.shippingCost.toLocaleString()}
                                </td>
                                <td className="px-6 py-5 text-right font-mono text-[var(--color-brand-secondary)] text-sm">
                                  <div className="flex flex-col items-end">
                                    <span>{quote.tax.toLocaleString()}</span>
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-[9px] font-bold px-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded">
                                        {quote.taxRate || 10}%
                                      </span>
                                      <span className="text-[9px] font-bold px-1 bg-gray-100 dark:bg-gray-800 rounded">
                                        {quote.taxType === "Included"
                                          ? "内税"
                                          : "外税"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-right font-mono text-blue-600 font-bold text-sm">
                                  {(
                                    (Number(quote.amount) || 0) +
                                    (Number(quote.installationCost) || 0) +
                                    (Number(quote.shippingCost) || 0) +
                                    (quote.taxType === "Excluded"
                                      ? Number(quote.tax) || 0
                                      : 0)
                                  ).toLocaleString()}
                                </td>
                                <td className="px-6 py-5 text-center text-sm font-medium">
                                  {quote.deliveryLeadTime}
                                </td>
                                <td className="px-6 py-5 text-center text-xs text-[var(--color-brand-secondary)] font-mono">
                                  {quote.validUntil}
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedQuote(quote);
                                      setIsQuoteEditModalOpen(true);
                                    }}
                                    className="p-2 text-[var(--color-brand-secondary)] hover:text-blue-600 rounded-lg hover:bg-blue-600/10"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={9}
                                className="px-6 py-12 text-center text-sm text-[var(--color-brand-secondary)] opacity-50 italic"
                              >
                                見積情報が登録されていません
                              </td>
                            </tr>
                          )}
                          <tr className="bg-gray-50/50 dark:bg-gray-800/20">
                            <td colSpan={9} className="p-4">
                              <button
                                onClick={() => setIsQuoteModalOpen(true)}
                                className="w-full py-3 border-2 border-dashed border-[var(--color-border-main)] rounded-xl text-blue-600 text-xs font-bold hover:bg-blue-600/5 transition-all flex items-center justify-center gap-2"
                              >
                                <PlusCircle className="w-4 h-4" />
                                <span>新規見積を追加</span>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-20 opacity-30">
              <Database className="w-20 h-20 mb-6" />
              <p className="text-xl font-bold italic">設備を選択してください</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isQuoteModalOpen && (
          <NewQuoteModal
            onClose={() => setIsQuoteModalOpen(false)}
            onSubmit={handleQuoteSubmit}
          />
        )}
        {isQuoteEditModalOpen && selectedQuote && (
          <QuoteEditModal
            quote={selectedQuote}
            onClose={() => {
              setIsQuoteEditModalOpen(false);
              setSelectedQuote(null);
            }}
            onUpdate={handleQuoteUpdate}
            onDelete={handleQuoteDelete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function EditSpecItem({
  label,
  value,
  onChange,
  unit,
  highlight = false,
  color,
  span = 1,
  suggestions = [],
  type = "text",
  readOnly = false,
  onAddSuggestion,
  onDeleteSuggestion,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  highlight?: boolean;
  color?: string;
  span?: number;
  suggestions?: string[] | { fieldPath: string; items: string[] };
  type?: "text" | "number";
  readOnly?: boolean;
  onAddSuggestion?: (val: string) => void;
  onDeleteSuggestion?: (val: string) => void;
}) {
  const settingsContext = useContext(SettingsContext);

  const suggestionsList = Array.isArray(suggestions)
    ? suggestions
    : suggestions.items;
  const fieldPath = Array.isArray(suggestions)
    ? undefined
    : suggestions.fieldPath;

  const handleAdd =
    onAddSuggestion ||
    ((val: string) => {
      if (fieldPath && settingsContext.onAddSuggestion) {
        settingsContext.onAddSuggestion(fieldPath, val);
      }
    });

  const handleDelete =
    onDeleteSuggestion ||
    ((val: string) => {
      if (fieldPath && settingsContext.onDeleteSuggestion) {
        settingsContext.onDeleteSuggestion(fieldPath, val);
      }
    });

  const hasSuggestions = suggestionsList && suggestionsList.length > 0;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        if (value) {
          handleAdd(value);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, handleAdd]);

  return (
    <div
      className={`space-y-1 ${span === 2 ? "md:col-span-2" : ""}`}
      ref={dropdownRef}
    >
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-tight">
          {label}
        </label>
        {!readOnly && <Pencil className="w-2.5 h-2.5 text-blue-600/40" />}
      </div>
      <div className="flex items-center gap-2 relative">
        <input
          type={type}
          readOnly={readOnly}
          className={`w-full bg-[var(--color-bg-alt)] border border-blue-600/30 ring-1 ring-blue-600/5 hover:border-blue-600/50 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 rounded px-2 py-1 font-mono transition-all ${highlight ? "text-lg font-bold" : "text-sm font-medium"} ${color || (highlight ? "text-blue-600" : "text-gray-900 dark:text-gray-100")} ${readOnly ? "opacity-60 cursor-default" : ""}`}
          value={value || ""}
          onChange={(e) => {
            if (!readOnly) {
              onChange(e.target.value);
              setIsDropdownOpen(true);
            }
          }}
          onFocus={() => {
            if (!readOnly) setIsDropdownOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsDropdownOpen(false);
              if (value) {
                handleAdd(value);
              }
            }
          }}
        />
        {unit && (
          <span className="text-[10px] text-[var(--color-brand-secondary)] font-bold whitespace-nowrap">
            {unit}
          </span>
        )}

        {hasSuggestions && isDropdownOpen && !readOnly && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-[var(--color-border-main)] shadow-lg rounded-lg max-h-48 overflow-y-auto z-50 py-1 custom-scrollbar">
            {suggestionsList.map((opt, i) => (
              <div
                key={`${opt}-${i}`}
                className="flex justify-between items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group"
                onClick={() => {
                  onChange?.(opt);
                  setIsDropdownOpen(false);
                }}
              >
                <span className="text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis mr-2">
                  {opt}
                </span>
                {handleDelete && fieldPath && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(opt);
                    }}
                    className="p-1 rounded-md text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                    title="この選択肢を削除"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditDimensionFields({
  label,
  value,
  onChange,
  unit,
  span = 1,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  span?: number;
}) {
  const parts = (value || "").split(/[x×]/).map((p) => p.trim());
  const x = parts[0] || "";
  const y = parts[1] || "";

  const update = (newX: string, newY: string) => {
    onChange(`${newX} x ${newY}`);
  };

  return (
    <div className={`space-y-1 ${span === 2 ? "md:col-span-2" : ""}`}>
      <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-tight">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          <span className="text-[9px] text-gray-400 font-bold">X:</span>
          <input
            type="number"
            className="w-full bg-[var(--color-bg-alt)] border border-blue-600/30 rounded px-2 py-1 font-mono text-sm focus:ring-1 focus:ring-blue-600 outline-none"
            value={x}
            onChange={(e) => update(e.target.value, y)}
          />
        </div>
        <div className="flex items-center gap-1 flex-1">
          <span className="text-[9px] text-gray-400 font-bold">Y:</span>
          <input
            type="number"
            className="w-full bg-[var(--color-bg-alt)] border border-blue-600/30 rounded px-2 py-1 font-mono text-sm focus:ring-1 focus:ring-blue-600 outline-none"
            value={y}
            onChange={(e) => update(x, e.target.value)}
          />
        </div>
        {unit && (
          <span className="text-[10px] text-[var(--color-brand-secondary)] font-bold">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function EditRangeFields({
  label,
  value,
  onChange,
  unit,
  highlight = false,
  color,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  highlight?: boolean;
  color?: string;
}) {
  const parts = (value || "").split(/[~-]/).map((p) => p.trim());
  const min = parts[0] || "";
  const max = parts[1] || "";

  const update = (newMin: string, newMax: string) => {
    onChange(`${newMin}~${newMax}`);
  };

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-tight">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            placeholder="最小"
            className="w-full bg-[var(--color-bg-alt)] border border-blue-600/30 rounded px-2 py-1 font-mono text-sm focus:ring-1 focus:ring-blue-600 outline-none"
            value={min}
            onChange={(e) => update(e.target.value, max)}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
            MIN
          </span>
        </div>
        <span className="text-gray-400 font-bold">~</span>
        <div className="flex-1 relative">
          <input
            type="number"
            placeholder="最大"
            className={`w-full bg-[var(--color-bg-alt)] border border-blue-600/30 rounded px-2 py-1 font-mono transition-all focus:ring-1 focus:ring-blue-600 outline-none ${highlight ? "text-lg font-bold" : "text-sm font-medium"} ${color || ""}`}
            value={max}
            onChange={(e) => update(min, e.target.value)}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
            MAX
          </span>
        </div>
        {unit && (
          <span className="text-[10px] text-[var(--color-brand-secondary)] font-bold">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function EditSelectGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-tight">
        {label}
      </label>
      <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-[var(--color-border-main)]">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${
              value === opt
                ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm"
                : "text-[var(--color-brand-secondary)] hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function EditView({
  project: initialProject,
  allProjects,
  masterEquipment,
  masterLineUnits,
  masterSchemas,
  globalSettings,
  setGlobalSettings,
  activeCategory,
  setActiveCategory,
  onBack,
  onSave,
  onSaveLineUnitToMaster,
  setDialog,
  convertAmount,
}: {
  project: MockProject;
  allProjects: MockProject[];
  masterEquipment: MasterEquipment[];
  masterLineUnits: LineUnitMaster[];
  masterSchemas: EquipmentSchema[];
  globalSettings: any;
  setGlobalSettings: any;
  activeCategory: "common" | "scenarios" | "reports";
  setActiveCategory: (cat: "common" | "scenarios" | "reports") => void;
  onBack: () => void;
  onSave: (p: any) => void;
  onSaveLineUnitToMaster: (lu: LineUnitMaster) => void;
  setDialog: (val: any) => void;
  convertAmount: (amount: number, from: string, to: string) => number;
  key?: string;
}) {
  const [activeScenarioId, setActiveScenarioId] = useState("a");
  const [activeLineUnitId, setActiveLineUnitId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("基本情報");
  const [editingResource, setEditingResource] = useState<{
    luId: string;
    res: any;
  } | null>(null);
  const [isResourceAddModalOpen, setIsResourceAddModalOpen] = useState(false);
  const [syncModal, setSyncModal] = useState<{
    luId: string;
    resource: any;
    latestSpm: string;
    latestHourlyRate: string;
    latestRemarks: string;
  } | null>(null);
  const [project, setProject] = useState<any>({
    ...initialProject,
    factory: initialProject.factory || "第2工場",
    relatedDepts: initialProject.relatedDepts || "製造部, 保全部, 品質保証部",
    caseType: initialProject.caseType || "老朽更新, 生産能力増強, 省人化",
    scheduleApproval: initialProject.scheduleApproval || "2026年6月",
    scheduleOrder: initialProject.scheduleOrder || "2026年7月",
    scheduleInstall: initialProject.scheduleInstall || "2026年11月",
    scheduleMassProd: initialProject.scheduleMassProd || "2027年1月",
    unitDisplay: initialProject.unitDisplay || "万円",
    calcPeriod: initialProject.calcPeriod || "10年",
    costOfCapital: initialProject.costOfCapital || "8%",

    // Approval Content tab defaults
    introPurpose: initialProject.introPurpose || [],
    purposeDetail: initialProject.purposeDetail || "",
    expectedState: initialProject.expectedState || "",
    bgCategories: initialProject.bgCategories || [],
    bgDetail: initialProject.bgDetail || "",
    bgTiming: initialProject.bgTiming || "",
    bgRelatedProducts: initialProject.bgRelatedProducts || "",
    bgMarketFactors: initialProject.bgMarketFactors || "",
    issueCategories: initialProject.issueCategories || [],
    issueDetail: initialProject.issueDetail || "",
    issueEvidence: initialProject.issueEvidence || "",
    issueProcess: initialProject.issueProcess || "",
    issueInterim: initialProject.issueInterim || "",
    reasonIntro: initialProject.reasonIntro || "",
    reasonExisting: initialProject.reasonExisting || "",
    reasonChoice: initialProject.reasonChoice || "",
    reasonTiming: initialProject.reasonTiming || "",
    impactCategories: initialProject.impactCategories || [],
    impactDetail: initialProject.impactDetail || "",
    impactAmount: initialProject.impactAmount || 0,
    impactTiming: initialProject.impactTiming || "",

    // Production condition defaults
    workingDaysPerMonth: initialProject.workingDaysPerMonth || "20",
    workingHoursPerDay: initialProject.workingHoursPerDay || "8",
    electricityCostPerKwh: initialProject.electricityCostPerKwh || "15",
    electricityCurrency:
      initialProject.electricityCurrency || initialProject.currency || "JPY",

    // Report defaults
    reportConclusion: initialProject.reportConclusion || "",
    reportComparisonResult: initialProject.reportComparisonResult || "",
    reportOutputItems: initialProject.reportOutputItems || [
      "基本情報",
      "稟議内容",
      "投資回収",
    ],
    scenarios: (() => {
      const base = initialProject.scenarios || [
        { id: "a", name: "A案" },
        { id: "b", name: "B案" },
        { id: "c", name: "C案" },
      ];
      if (!base.find((s: any) => s.id === "current")) {
        return [{ id: "current", name: "現状" }, ...base];
      }
      return base;
    })(),
  });

  // Collect unique values for datalist suggestions
  const getSuggestions = (
    fieldPath: string,
  ): { fieldPath: string; items: string[] } => {
    const values = new Set<string>();

    // Add from all projects
    allProjects.forEach((p) => {
      const val = (p as any)[fieldPath];
      if (val && typeof val === "string") values.add(val);

      // Also check scenarios
      p.scenarios?.forEach((s) => {
        const sVal = (s as any)[fieldPath];
        if (sVal && typeof sVal === "string") values.add(sVal);

        // Also check line units
        s.lineUnits?.forEach((lu) => {
          const luVal = (lu as any)[fieldPath];
          if (luVal && typeof luVal === "string") values.add(luVal);

          // Also check resources
          lu.resources?.forEach((r) => {
            const rVal = (r as any)[fieldPath];
            if (rVal && typeof rVal === "string") values.add(rVal);
          });
        });
      });
    });

    // Add from current project values
    if (project) {
      const val = project[fieldPath];
      if (val && typeof val === "string") values.add(val);
      project.scenarios?.forEach((s: any) => {
        const sVal = s[fieldPath];
        if (sVal && typeof sVal === "string") values.add(sVal);
        s.lineUnits?.forEach((lu: any) => {
          const luVal = lu[fieldPath];
          if (luVal && typeof luVal === "string") values.add(luVal);
        });
      });
    }

    if (
      globalSettings.customSuggestions &&
      globalSettings.customSuggestions[fieldPath]
    ) {
      globalSettings.customSuggestions[fieldPath].forEach((s: string) =>
        values.add(s),
      );
    }

    return {
      fieldPath,
      items: Array.from(values)
        .filter((v) => v.trim() !== "")
        .sort(),
    };
  };

  const currentScenario = project.scenarios?.find(
    (s: any) => s.id === activeScenarioId,
  );
  const activeLineUnit = currentScenario?.lineUnits?.find(
    (lu: any) => lu.id === activeLineUnitId,
  );

  const [powerWarning, setPowerWarning] = useState<string | null>(null);

  // Auto-calculate power consumption from equipment resources
  useEffect(() => {
    if (!activeLineUnit) return;

    const equipmentResources =
      activeLineUnit.resources?.filter((r) => r.type === "設備") || [];
    const powerResource = activeLineUnit.resources?.find(
      (r) => r.type === "エネルギー" && r.name === "電力",
    );

    if (!powerResource) return;

    // "数量は集計している設備数量。明細から出しましょう。"
    // This could mean the quantity field of the energy resource should be the sum of equipment quantities.
    const totalEquipQuantity = equipmentResources.reduce(
      (acc, res) => acc + (parseFloat(res.quantity.toString()) || 0),
      0,
    );

    // Also calculate kWh for the remarks or if they want it in another field.
    let totalEnergyKWh = 0;
    equipmentResources.forEach((res) => {
      const master = masterEquipment.find(
        (m) => m.id === res.equipmentId || m.name === res.name,
      );
      if (master && master.pressSpecs?.motorPower) {
        const powerStr = master.pressSpecs.motorPower;
        const powerVal = parseFloat(powerStr.replace(/[^0-9.]/g, "")) || 0;
        // If we move to unit-level usageTime, we'll use that instead of res.usageTime
        const usageTime =
          parseFloat(activeLineUnit.workingHours || "160") *
          (parseFloat(activeLineUnit.operatingRate || "100") / 100);
        totalEnergyKWh += powerVal * res.quantity * usageTime;
      }
    });

    // We'll set the quantity to totalEquipQuantity as requested
    const currentQty = parseFloat(powerResource.quantity.toString()) || 0;
    if (currentQty !== totalEquipQuantity) {
      setProject((prev: any) => {
        const updatedProject = JSON.parse(JSON.stringify(prev));
        const scenario = updatedProject.scenarios.find(
          (s: any) => s.id === activeScenarioId,
        );
        if (scenario && scenario.lineUnits) {
          const lineUnit = scenario.lineUnits.find(
            (lu: any) => lu.id === activeLineUnitId,
          );
          if (lineUnit && lineUnit.resources) {
            const pRes = lineUnit.resources.find(
              (r: any) => r.id === powerResource.id,
            );
            if (pRes) {
              pRes.quantity = totalEquipQuantity;
              pRes.unit = "台相当"; // Changing unit to reflect the requirement
              pRes.remarks = `自動計算: 設備数量合計より算出 (${totalEnergyKWh.toFixed(1)} kWh相当)`;
              return updatedProject;
            }
          }
        }
        return prev;
      });
      setIsDirty(true);
    }
  }, [activeLineUnit, masterEquipment, activeLineUnitId, activeScenarioId]);

  const calculateScenarioAnnualEffect = (
    scenario: any,
    allScenarios: any[],
    projectCtx: any,
  ) => {
    if (!scenario) return 0;

    const calculateProfit = (s: any) => {
      let sales = 0;
      let materialCost = 0;

      (projectCtx.targetProducts || []).forEach((prod: any) => {
        let annualVolume = 0;
        if (prod.volumeType === "月間") annualVolume = (prod.volume || 0) * 12;
        else annualVolume = prod.volume || 0;

        let annualSales = 0;
        if (prod.sellingPriceType === "年間売上")
          annualSales = prod.sellingPrice || 0;
        else if (prod.sellingPriceType === "月間売上")
          annualSales = (prod.sellingPrice || 0) * 12;
        else annualSales = annualVolume * (prod.sellingPrice || 0);

        let annualMaterial = 0;
        if (prod.materialCostType === "材料比率")
          annualMaterial = (annualSales * (prod.materialCost || 0)) / 100;
        else annualMaterial = annualVolume * (prod.materialCost || 0);

        const prodCurrency = prod.currency || projectCtx.currency || "JPY";
        sales += convertAmount(
          annualSales,
          prodCurrency,
          projectCtx.currency || "JPY",
        );
        materialCost += convertAmount(
          annualMaterial,
          prodCurrency,
          projectCtx.currency || "JPY",
        );
      });

      let operatingCost = 0;
      const electricityCostPerKwh =
        parseFloat(projectCtx.electricityCostPerKwh || "15") || 0;
      const elecCurrency =
        projectCtx.electricityCurrency || projectCtx.currency || "JPY";

      (s.lineUnits || []).forEach((lu: any) => {
        const equipmentResources = (lu.resources || []).filter(
          (r: any) => r.type === "設備",
        );
        const totalPowerKw = equipmentResources.reduce(
          (sum: number, er: any) =>
            sum +
            (parseFloat(er.powerConsumption) || 0) *
              (parseFloat(er.quantity) || 0),
          0,
        );

        (lu.resources || []).forEach((r: any) => {
          let monthlyCost = 0;
          let rCurrency = projectCtx.currency || "JPY";

          if (r.type === "エネルギー" && r.name === "電力") {
            const calculatedHourlyCost = totalPowerKw * electricityCostPerKwh;
            monthlyCost = calculatedHourlyCost * (parseFloat(r.usageTime) || 0);
            rCurrency = elecCurrency;
          } else {
            monthlyCost =
              (parseFloat(r.quantity) || 0) *
              (parseFloat(r.hourlyRate) || 0) *
              (parseFloat(r.usageTime) || 0);
          }

          operatingCost += convertAmount(
            monthlyCost * 12,
            rCurrency,
            projectCtx.currency || "JPY",
          );
        });
      });
      return sales - materialCost - operatingCost;
    };

    const targetProfit = calculateProfit(scenario);
    const currentScenario = allScenarios.find((s: any) => s.id === "current");

    if (currentScenario && scenario.id !== "current") {
      const currentProfit = calculateProfit(currentScenario);
      return (targetProfit - currentProfit) / 10000;
    } else {
      return targetProfit / 10000;
    }
  };

  const calculateScenarioInvestment = (scenario: any) => {
    if (!scenario) return 0;

    // Sum from equipmentList, converting each to JPY base first, then to project base units (10000 Yen = 1 unit)
    const equipTotalYen = (scenario.equipmentList || []).reduce(
      (acc: number, item: any) => {
        const itemCurrency = item.currency || project.currency || "JPY";
        const amountInYen = convertAmount(
          (item.price || 0) * (item.quantity || 0) * 10000,
          itemCurrency,
          "JPY",
        );
        return acc + amountInYen;
      },
      0,
    );

    const bonusTotalYen = (scenario.additionalCosts || []).reduce(
      (acc: number, item: any) => {
        const itemCurrency = item.currency || project.currency || "JPY";
        const amountInYen = convertAmount(
          (item.amount || 0) * 10000,
          itemCurrency,
          "JPY",
        );
        return acc + amountInYen;
      },
      0,
    );

    let lineUnitNewEquipTotalYen = 0;
    (scenario.lineUnits || []).forEach((lu: any) => {
      (lu.resources || []).forEach((r: any) => {
        if (r.type === "設備" && r.isNew) {
          const master = masterEquipment.find(
            (m) => m.id === r.equipmentId || m.name === r.name,
          );
          const preferredQuote =
            master?.quotes?.find((q) => q.isPreferred) ||
            (master?.quotes?.length
              ? master.quotes[master.quotes.length - 1]
              : undefined);
          if (preferredQuote) {
            // preferredQuote.baseAmount is already in JPY
            lineUnitNewEquipTotalYen +=
              preferredQuote.baseAmount * (r.quantity || 0);
          }
        }
      });
    });

    const totalYen = equipTotalYen + bonusTotalYen + lineUnitNewEquipTotalYen;
    // We store investmentAmount in Base JPY (unit = 1 Yen)
    return totalYen;
  };

  useEffect(() => {
    if (!project.scenarios) return;

    let isChanged = false;
    const computeFinancials = (s: any, allS: any[], ctx: any) => {
      const newEffect = calculateScenarioAnnualEffect(s, allS, ctx);
      const newInvestment = calculateScenarioInvestment(s) / 10000; // 万円単位に合わせる？
      return { newEffect, newInvestment };
    };

    const n = parseFloat((project.calcPeriod || "10").replace(/[^0-9.]/g, "")) || 10;
    const r = parseFloat(project.discountRate || "5.0") || 5;
    const rate = r / 100;

    const calculateValues = (s: any, newEffect: number, newInvestment: number) => {
      let npv = 0;
      let irr = 0;
      let roi = 0;
      let recoveryYears = 0;

      if (newInvestment > 0) {
        recoveryYears = newEffect > 0 ? newInvestment / newEffect : 0;
        roi = ((newEffect * n - newInvestment) / newInvestment) * 100;

        let npvSum = -newInvestment;
        for (let t = 1; t <= n; t++) {
           npvSum += newEffect / Math.pow(1 + rate, t);
        }
        npv = npvSum;

        if (newEffect > 0 && newEffect * n > newInvestment) {
           let low = 0;
           let high = 1.0; 
           for (let i=0; i<100; i++) {
              let mid = (low + high) / 2;
              let tempNpv = -newInvestment;
              for (let t=1; t<=n; t++) {
                 tempNpv += newEffect / Math.pow(1 + mid, t);
              }
              if (tempNpv > 0) low = mid;
              else high = mid;
           }
           irr = ((low + high) / 2) * 100;
        }
      }
      return { npv, irr, roi, recoveryYears };
    };

    const nextScenarios = project.scenarios.map((s: any) => {
      const { newEffect, newInvestment } = computeFinancials(s, project.scenarios, project);
      const { npv, irr, roi, recoveryYears } = calculateValues(s, newEffect, newInvestment);

      if (
        Math.abs((s.annualEffect || 0) - newEffect) > 0.01 ||
        Math.abs((s.investmentAmount || 0) - (newInvestment * 10000)) > 1 || /* Use full JPY for check */
        Math.abs((s.npv || 0) - npv) > 0.01 ||
        Math.abs((s.irr || 0) - irr) > 0.01 ||
        Math.abs((s.roi || 0) - roi) > 0.01 ||
        Math.abs((s.recoveryYears || 0) - recoveryYears) > 0.01
      ) {
        isChanged = true;
        return {
          ...s,
          annualEffect: newEffect,
          investmentAmount: newInvestment * 10000,
          npv,
          irr,
          roi,
          recoveryYears,
        };
      }
      return s;
    });

    if (isChanged) {
      setProject((prev: any) => {
        const prevScenarios = prev.scenarios || [];
        let needsUpdate = false;
        const updated = prevScenarios.map((s: any) => {
          const { newEffect, newInvestment } = computeFinancials(s, prevScenarios, prev);
          const { npv, irr, roi, recoveryYears } = calculateValues(s, newEffect, newInvestment);

          if (
            Math.abs((s.annualEffect || 0) - newEffect) > 0.01 ||
            Math.abs((s.investmentAmount || 0) - (newInvestment * 10000)) > 1 ||
            Math.abs((s.npv || 0) - npv) > 0.01 ||
            Math.abs((s.irr || 0) - irr) > 0.01 ||
            Math.abs((s.roi || 0) - roi) > 0.01 ||
            Math.abs((s.recoveryYears || 0) - recoveryYears) > 0.01
          ) {
            needsUpdate = true;
            return {
              ...s,
              annualEffect: newEffect,
              investmentAmount: newInvestment * 10000,
              npv,
              irr,
              roi,
              recoveryYears,
            };
          }
          return s;
        });

        if (needsUpdate) {
          setIsDirty(true);
          return { ...prev, scenarios: updated };
        }
        return prev;
      });
    }
  }, [
    project.scenarios, // Will trigger on structural changes like lineUnits or resources
    project.targetProducts,
    project.electricityCostPerKwh,
    project.workingDaysPerMonth,
    project.workingHoursPerDay,
    project.currency,
    project.calcPeriod,
    project.discountRate,
    masterEquipment,
  ]);

  const [isDirty, setIsDirty] = useState(false);

  const evaluatedReportTree = useMemo(
    () => buildEvaluatedTree(getReportOutputTree(project), project),
    [project],
  );

  const handleFieldChange = (field: string, value: any) => {
    setProject((prev: any) => {
      let next = { ...prev, [field]: value };

      setIsDirty(true);
      return next;
    });
  };

  const handleScenarioFieldChange = (
    scenarioId: string,
    field: string,
    value: any,
  ) => {
    setProject((prev: any) => {
      const nextScenarios = (prev.scenarios || []).map((s: any) =>
        s.id === scenarioId ? { ...s, [field]: value } : s,
      );
      const next = { ...prev, scenarios: nextScenarios };
      setIsDirty(true);
      return next;
    });
  };

  const handleLineUnitChange = (lineUnitId: string, updates: any) => {
    setProject((prev: any) => {
      const nextScenarios =
        prev.scenarios?.map((s: any) => {
          if (s.id === activeScenarioId) {
            return {
              ...s,
              lineUnits:
                s.lineUnits?.map((lu: any) =>
                  lu.id === lineUnitId ? { ...lu, ...updates } : lu,
                ) || [],
            };
          }
          return s;
        }) || [];
      setIsDirty(true);
      return { ...prev, scenarios: nextScenarios };
    });
  };

  const handleResourceChange = (
    lineUnitId: string,
    resourceId: string,
    updates: any,
  ) => {
    setProject((prev: any) => {
      const nextScenarios = (prev.scenarios || []).map((s: any) => {
        if (s.id === activeScenarioId) {
          return {
            ...s,
            lineUnits: (s.lineUnits || []).map((lu: any) => {
              if (lu.id === lineUnitId) {
                return {
                  ...lu,
                  resources: (lu.resources || []).map((r: any) => {
                    if (r.id === resourceId) {
                      const newR = { ...r, ...updates };

                      // Auto-fill from Master DB if name or equipmentId changes and it's a '設備'
                      if (
                        (updates.name || updates.equipmentId) &&
                        newR.type === "設備"
                      ) {
                        const master = masterEquipment.find(
                          (m) =>
                            m.id === newR.equipmentId || m.name === newR.name,
                        );
                        if (master) {
                          newR.schemaId = master.schemaId;
                          newR.category = master.category;
                          newR.middleCategory = master.middleCategory;
                          newR.subCategory = master.subCategory;
                          newR.dynamicSpecs = master.dynamicSpecs
                            ? JSON.parse(JSON.stringify(master.dynamicSpecs))
                            : {};
                          if (master.powerConsumption !== undefined) {
                            newR.powerConsumption = master.powerConsumption;
                          }

                          // SPM: Use root spm if available, otherwise fallback to average value from range
                          if (master.spm !== undefined && master.spm > 0) {
                            newR.spm = master.spm.toString();
                          } else if (master.pressSpecs?.spm) {
                            const spmParts = master.pressSpecs.spm
                              .split(/[~-]/)
                              .map((s) => parseFloat(s.trim()));
                            const validParts = spmParts.filter(
                              (n) => !isNaN(n),
                            );
                            if (validParts.length > 0) {
                              const minVal = Math.min(...validParts);
                              const maxVal = Math.max(...validParts);
                              newR.spm = Math.round(
                                (minVal + maxVal) / 2,
                              ).toString();
                            }
                          } else if (master.pressSpecs?.capacity) {
                            // Fallback if spm is missing but capacity is there, though spm is preferred
                            // previous logic used capacity, but user specifically said SPM
                          }

                          // Hourly Rate: Monthly Depreciation / (Hours * MinRate)
                          if (
                            master.investmentAmount &&
                            master.minOperatingRate
                          ) {
                            const unitHours = parseFloat(
                              lu.workingHours || "160",
                            );
                            const minRate = master.minOperatingRate / 100;
                            const investment = master.investmentAmount;
                            const method = master.depreciationMethod || "定額";
                            const residualRatio =
                              (master.residualValueRatio !== undefined
                                ? master.residualValueRatio
                                : 5) / 100;
                            const life = master.usefulLife || 10;

                            let monthlyDepreciation = 0;
                            if (method === "定額") {
                              monthlyDepreciation =
                                (investment * (1 - residualRatio)) /
                                (life * 12);
                            } else {
                              const dbRate = 2.0 / life;
                              monthlyDepreciation = (investment * dbRate) / 12;
                            }

                            const rate =
                              monthlyDepreciation / (unitHours * minRate);
                            if (!isNaN(rate) && isFinite(rate)) {
                              newR.hourlyRate = Math.round(rate).toString();
                              newR.remarks = `償却額(${method})より算出 (投資: ${master.investmentAmount.toLocaleString()}円)`;
                            }
                          }
                        }
                      }
                      return newR;
                    }
                    return r;
                  }),
                };
              }
              return lu;
            }),
          };
        }
        return s;
      });
      setIsDirty(true);
      return { ...prev, scenarios: nextScenarios };
    });
  };

  const handleAddResource = (
    lineUnitId: string,
    masterEq?: MasterEquipment,
  ) => {
    const unitHoursValue = parseFloat(activeLineUnit?.workingHours || "160");
    const unitRateValue =
      parseFloat(activeLineUnit?.operatingRate || "100") / 100;
    const initialUsageTime = (unitHoursValue * unitRateValue).toFixed(1);

    let calculatedHourlyRate = "0";
    let avgSpm = "0";

    if (masterEq) {
      // SPM calculation: Use root spm if given and > 0, else use average value from range
      if (masterEq.spm && masterEq.spm > 0) {
        avgSpm = masterEq.spm.toString();
      } else if (masterEq.pressSpecs?.spm) {
        const spmParts = masterEq.pressSpecs.spm
          .split(/[~-]/)
          .map((s) => parseFloat(s.trim()));
        const validParts = spmParts.filter((n) => !isNaN(n));
        if (validParts.length > 0) {
          const minSpm = Math.min(...validParts);
          const maxSpm = Math.max(...validParts);
          avgSpm = Math.round((minSpm + maxSpm) / 2).toString();
        }
      }

      // Hourly Rate calculation: Monthly Depreciation / (Hours * MinRate)
      if (masterEq.investmentAmount && masterEq.minOperatingRate) {
        const minRate = masterEq.minOperatingRate / 100;
        const hours = unitHoursValue > 0 ? unitHoursValue : 160;
        const investment = masterEq.investmentAmount;
        const method = masterEq.depreciationMethod || "定額";
        const residualRatio =
          (masterEq.residualValueRatio !== undefined
            ? masterEq.residualValueRatio
            : 5) / 100;
        const life = masterEq.usefulLife || 10;

        let monthlyDepreciation = 0;
        if (method === "定額") {
          monthlyDepreciation =
            (investment * (1 - residualRatio)) / (life * 12);
        } else {
          const dbRate = 2.0 / life;
          monthlyDepreciation = (investment * dbRate) / 12;
        }

        const rate = monthlyDepreciation / (hours * minRate);
        if (!isNaN(rate) && isFinite(rate)) {
          calculatedHourlyRate = Math.round(rate).toString();
        }
      }
    }

    const newResource: ResourceItem = masterEq
      ? {
          id: `r-${Date.now()}`,
          schemaId: masterEq.schemaId,
          category: masterEq.category,
          middleCategory: masterEq.middleCategory,
          subCategory: masterEq.subCategory,
          type: "設備",
          name: masterEq.name,
          equipmentId: masterEq.id,
          dynamicSpecs: masterEq.dynamicSpecs
            ? JSON.parse(JSON.stringify(masterEq.dynamicSpecs))
            : {},
          powerConsumption:
            masterEq.powerConsumption !== undefined
              ? masterEq.powerConsumption
              : 0,
          quantity: 1,
          unit: "台",
          spm: avgSpm,
          hourlyRate: calculatedHourlyRate,
          operatingRate: activeLineUnit?.operatingRate || "100",
          usageTime: initialUsageTime,
          remarks: masterEq.investmentAmount
            ? `償却額より算出 (投資: ${masterEq.investmentAmount.toLocaleString()}円)`
            : "",
          isNew: true,
        }
      : {
          id: `r-${Date.now()}`,
          type: "人員",
          name: "新規リソース",
          quantity: 1,
          unit: "名",
          spm: "0",
          hourlyRate: "0",
          operatingRate: activeLineUnit?.operatingRate || "100",
          usageTime: initialUsageTime,
          remarks: "",
        };

    setProject((prev: any) => {
      const nextScenarios = (prev.scenarios || []).map((s: any) => {
        if (s.id === activeScenarioId) {
          return {
            ...s,
            lineUnits: (s.lineUnits || []).map((lu: any) => {
              if (lu.id === lineUnitId) {
                return {
                  ...lu,
                  resources: [...(lu.resources || []), newResource],
                };
              }
              return lu;
            }),
          };
        }
        return s;
      });
      setIsDirty(true);
      return { ...prev, scenarios: nextScenarios };
    });
  };

  const handleDeleteResource = (lineUnitId: string, resourceId: string) => {
    setDialog({
      type: "confirm",
      title: "リソースの削除",
      message: "このリソースを削除しますか？",
      isDestructive: true,
      onConfirm: () => {
        setProject((prev: any) => {
          const nextScenarios = (prev.scenarios || []).map((s: any) => {
            if (s.id === activeScenarioId) {
              return {
                ...s,
                lineUnits: (s.lineUnits || []).map((lu: any) => {
                  if (lu.id === lineUnitId) {
                    return {
                      ...lu,
                      resources: (lu.resources || []).filter(
                        (r: any) => r.id !== resourceId,
                      ),
                    };
                  }
                  return lu;
                }),
              };
            }
            return s;
          });
          setIsDirty(true);
          return { ...prev, scenarios: nextScenarios };
        });
        setDialog(null);
      },
    });
  };

  const handleDeleteLineUnit = (lineUnitId: string) => {
    if (!currentScenario || (currentScenario.lineUnits?.length || 0) <= 1) {
      setDialog({
        type: "alert",
        title: "削除不可",
        message: "これ以上削除できません。",
        onConfirm: () => setDialog(null),
      });
      return;
    }

    setDialog({
      type: "confirm",
      title: "ユニットの削除",
      message:
        "このラインユニットを削除しますか？\n登録されたリソース明細もすべて削除されます。",
      isDestructive: true,
      onConfirm: () => {
        setProject((prev: any) => {
          const nextScenarios = (prev.scenarios || []).map((s: any) => {
            if (s.id === activeScenarioId) {
              const nextLineUnits = (s.lineUnits || []).filter(
                (lu: any) => lu.id !== lineUnitId,
              );
              return {
                ...s,
                lineUnits: nextLineUnits,
                lineUnitCount: nextLineUnits.length,
              };
            }
            return s;
          });
          setIsDirty(true);
          return { ...prev, scenarios: nextScenarios };
        });

        if (activeLineUnitId === lineUnitId) {
          const remaining = currentScenario.lineUnits.filter(
            (lu: any) => lu.id !== lineUnitId,
          );
          if (remaining.length > 0) {
            setActiveLineUnitId(remaining[0].id);
          }
        }
        setDialog(null);
      },
    });
  };

  const calculateLatestMasterValues = (luId: string, resource: any) => {
    if (resource.type !== "設備") return null;
    const master = masterEquipment.find(
      (m) => m.id === resource.equipmentId || m.name === resource.name,
    );
    if (!master) return null;

    let latestSpm = "0";
    let minSpm = -Infinity;
    let maxSpm = Infinity;
    let latestPowerConsumption =
      master.powerConsumption !== undefined ? master.powerConsumption : 0;

    if (master.spm && master.spm > 0) {
      latestSpm = master.spm.toString();
      minSpm = master.spm;
      maxSpm = master.spm;
    } else if (master.pressSpecs?.spm) {
      const spmParts = master.pressSpecs.spm
        .split(/[~-]/)
        .map((s) => parseFloat(s.trim()));
      const validParts = spmParts.filter((n) => !isNaN(n));
      if (validParts.length > 0) {
        minSpm = Math.min(...validParts);
        maxSpm = Math.max(...validParts);
        latestSpm = Math.round((minSpm + maxSpm) / 2).toString();
      }
    }

    const lu = currentScenario?.lineUnits?.find((l: any) => l.id === luId);
    let latestHourlyRate = "0";
    let latestRemarks = "";

    if (master.investmentAmount && master.minOperatingRate && lu) {
      const unitHours = parseFloat(lu.workingHours || "160");
      const minRate = master.minOperatingRate / 100;
      const investment = master.investmentAmount;
      const method = master.depreciationMethod || "定額";
      const residualRatio =
        (master.residualValueRatio !== undefined
          ? master.residualValueRatio
          : 5) / 100;
      const life = master.usefulLife || 10;

      let monthlyDepreciation = 0;
      if (method === "定額") {
        monthlyDepreciation = (investment * (1 - residualRatio)) / (life * 12);
      } else {
        const dbRate = 2.0 / life;
        monthlyDepreciation = (investment * dbRate) / 12;
      }

      const rateValue = monthlyDepreciation / (unitHours * minRate);
      if (!isNaN(rateValue) && isFinite(rateValue)) {
        latestHourlyRate = Math.round(rateValue).toString();
        latestRemarks = `償却額(${method})より算出 (投資: ${master.investmentAmount.toLocaleString()}円)`;
      }
    }

    return {
      latestSpm,
      latestPowerConsumption,
      latestHourlyRate,
      latestRemarks,
      minSpm,
      maxSpm,
    };
  };

  const handleApplySync = (scope: "local" | "unit" | "project") => {
    if (!syncModal) return;
    const {
      luId,
      resource,
      latestSpm,
      latestPowerConsumption,
      latestHourlyRate,
      latestRemarks,
    } = syncModal;

    setProject((prev: any) => {
      const nextScenarios =
        prev.scenarios?.map((s: any) => {
          // 'project' scope updates all scenarios, otherwise just active scenario
          if (scope === "project" || s.id === activeScenarioId) {
            return {
              ...s,
              lineUnits:
                s.lineUnits?.map((lu: any) => {
                  // 'project' and 'unit' scope update all resource within lu or across lu
                  // But 'unit' scope only updates the target luId.
                  const isTargetUnit = lu.id === luId;

                  if (
                    scope === "project" ||
                    (scope === "unit" && isTargetUnit) ||
                    (scope === "local" && isTargetUnit)
                  ) {
                    return {
                      ...lu,
                      resources:
                        lu.resources?.map((r: any) => {
                          const isTargetResource = r.id === resource.id;
                          const isSameEquipment =
                            r.equipmentId === resource.equipmentId ||
                            (r.name === resource.name && r.type === "設備");

                          if (
                            scope === "local"
                              ? isTargetResource
                              : isSameEquipment
                          ) {
                            // Recalculate if unit hours differ between units for 'unit' or 'project' scope
                            const unitLatest = calculateLatestMasterValues(
                              lu.id,
                              r,
                            );
                            return {
                              ...r,
                              spm: unitLatest?.latestSpm || latestSpm,
                              powerConsumption:
                                unitLatest?.latestPowerConsumption !== undefined
                                  ? unitLatest.latestPowerConsumption
                                  : latestPowerConsumption,
                              hourlyRate:
                                unitLatest?.latestHourlyRate ||
                                latestHourlyRate,
                              remarks:
                                unitLatest?.latestRemarks || latestRemarks,
                            };
                          }
                          return r;
                        }) || [],
                    };
                  }
                  return lu;
                }) || [],
            };
          }
          return s;
        }) || [];
      setIsDirty(true);
      return { ...prev, scenarios: nextScenarios };
    });
    setSyncModal(null);
  };

  // Sync resource usageTime and other unit-level derived values
  useEffect(() => {
    if (!activeLineUnit) return;

    const unitHours = parseFloat(activeLineUnit.workingHours || "160");
    const unitRate = parseFloat(activeLineUnit.operatingRate || "100") / 100;
    const calculatedUsageTime = (unitHours * unitRate).toFixed(1);

    let needsUpdate = false;
    const updatedResources = (activeLineUnit.resources || []).map((r: any) => {
      if (r.usageTime !== calculatedUsageTime) {
        needsUpdate = true;
        return { ...r, usageTime: calculatedUsageTime };
      }
      return r;
    });

    if (needsUpdate) {
      handleLineUnitChange(activeLineUnitId!, { resources: updatedResources });
    }
  }, [
    activeLineUnit?.workingHours,
    activeLineUnit?.operatingRate,
    activeLineUnitId,
  ]);

  const handleSave = () => {
    // Recalculate electricity costs for all equipment resources
    const electricityCost =
      parseFloat(project.electricityCostPerKwh || "15") || 0;
    const updatedProject = { ...project };
    if (updatedProject.scenarios) {
      updatedProject.scenarios = updatedProject.scenarios.map((scenario) => {
        if (!scenario.lineUnits) return scenario;
        return {
          ...scenario,
          lineUnits: scenario.lineUnits.map((lu) => {
            if (!lu.resources) return lu;
            return {
              ...lu,
              resources: lu.resources.map((r) => {
                if (
                  r.type === "設備" &&
                  r.powerConsumption !== undefined &&
                  r.powerConsumption > 0
                ) {
                  return {
                    ...r,
                    hourlyRate: (
                      r.powerConsumption * electricityCost
                    ).toString(),
                  };
                }
                return r;
              }),
            };
          }),
        };
      });
    }

    // Also recalculate for equipment lists? No, equipment list doesn't store hourly cost directly, it computes it inline. But we can update if needed.
    setProject(updatedProject);
    onSave(updatedProject);
    setIsDirty(false);
  };

  const selectedOutputs = project.reportOutputItems || [];

  const commonTabs = ["管理情報", "稟議内容・議題", "生産条件"];

  let scenarioTabs: string[] = [];
  if (activeScenarioId === "conclusion") {
    scenarioTabs = ["総合結論"];
  } else if (activeScenarioId === "current") {
    scenarioTabs = ["ラインユニット"];
  } else {
    scenarioTabs = [
      "ラインユニット",
      "購入設備・費用",
      "導入効果",
      "投資回収",
      "損益分岐点",
      "労務費差異",
    ];
  }

  const reportTabs = ["出力項目設定", "プレビュー"];

  const activeTabs =
    activeCategory === "common"
      ? commonTabs
      : activeCategory === "scenarios"
        ? scenarioTabs
        : reportTabs;

  useEffect(() => {
    if (!activeTabs.includes(activeTab)) {
      setActiveTab(activeTabs[0]);
    }
  }, [activeCategory, activeTabs, activeTab]);

  useEffect(() => {
    if (
      activeTab === "ラインユニット" &&
      !activeLineUnitId &&
      currentScenario?.lineUnits?.length > 0
    ) {
      setActiveLineUnitId(currentScenario.lineUnits[0].id);
    }
  }, [activeTab, currentScenario, activeLineUnitId]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col overflow-hidden print:h-auto print:overflow-visible print:block"
    >
      <div className="flex-shrink-0 p-8 pb-0 max-w-7xl mx-auto w-full print:hidden">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-[var(--color-border-main)]/20 rounded-lg transition-colors border border-transparent hover:border-[var(--color-border-main)]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-600/5 px-1.5 py-0.5 rounded border border-blue-600/10">
                  {project.projectNo || "NO-NUMBER"}
                </span>
                <span className="text-xs text-[var(--color-brand-secondary)]">
                  {project.investmentType}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {project.title}
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              disabled={!isDirty}
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${
                isDirty
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 active:scale-95"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>更新保存</span>
            </button>
            <button className="px-4 py-2 border border-[var(--color-border-main)] rounded-lg hover:bg-[var(--color-border-main)]/10 text-sm font-medium">
              稟議申請
            </button>
          </div>
        </div>

        {/* Scenario Selection (Sub-tabs) */}
        {activeCategory === "scenarios" && (
          <div className="flex items-center gap-3 mb-4 overflow-x-auto no-scrollbar pb-1">
            {(project.scenarios || [])
              .filter((s: any) => s.id === "current")
              .map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setActiveScenarioId(s.id)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border shrink-0 ${
                    activeScenarioId === s.id
                      ? "bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-800 dark:border-gray-100 shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {s.name}
                </button>
              ))}

            <div className="w-px h-5 bg-[var(--color-border-main)] flex-shrink-0 mx-1" />

            <div className="flex gap-2">
              {(project.scenarios || [])
                .filter((s: any) => s.id !== "current")
                .map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveScenarioId(s.id)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border shrink-0 ${
                      activeScenarioId === s.id
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/20"
                        : "bg-white dark:bg-gray-900 border-[var(--color-border-main)] text-[var(--color-brand-secondary)] hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
            </div>

            <div className="w-px h-5 bg-[var(--color-border-main)] flex-shrink-0 mx-1" />

            <button
              onClick={() => setActiveScenarioId("conclusion")}
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border shrink-0 flex items-center gap-1.5 ${
                activeScenarioId === "conclusion"
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              総合結論項目
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-[var(--color-border-main)] flex overflow-x-auto no-scrollbar">
          {activeTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-all whitespace-nowrap relative ${
                activeTab === tab
                  ? "text-blue-600"
                  : "text-[var(--color-brand-secondary)] hover:text-[var(--color-text-main)]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto print:overflow-visible p-8 pt-6 print:p-0 print:block">
        <div className="max-w-7xl mx-auto">
          {/* Scenario Overview Cards */}
          {activeCategory === "scenarios" && (
            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <SummaryCard
                  label="ラインユニット"
                  value={
                    currentScenario?.lineUnits?.length
                      ? `${currentScenario.lineUnits.length} ブロック`
                      : "-"
                  }
                  unit=""
                  subLabel="生産ブロック数"
                  icon={Database}
                  color="gray"
                />
                {activeScenarioId !== "current" && (
                  <>
                    <SummaryCard
                      label="投資総額"
                      value={
                        currentScenario?.investmentAmount
                          ? convertAmount(
                              currentScenario.investmentAmount,
                              project.currency,
                              project.reportCurrency || "JPY",
                            ).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })
                          : "-"
                      }
                      unit={project.reportCurrency || "JPY"}
                      icon={Calculator}
                      color="blue"
                    />
                    <SummaryCard
                      label="年間効果額"
                      value={
                        currentScenario?.annualEffect
                          ? convertAmount(
                              currentScenario.annualEffect * 10000,
                              "JPY",
                              project.reportCurrency || "JPY",
                            ).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })
                          : "-"
                      }
                      unit={project.reportCurrency || "JPY"}
                      icon={TrendingUp}
                      color="emerald"
                    />
                    <SummaryCard
                      label="投資回収"
                      value={currentScenario?.recoveryYears?.toString() || "-"}
                      unit="年"
                      icon={Clock}
                      color="indigo"
                    />
                    <SummaryCard
                      label="NPV"
                      value={
                        currentScenario?.npv
                          ? convertAmount(
                              currentScenario.npv * 10000,
                              "JPY",
                              project.reportCurrency || "JPY",
                            ).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })
                          : "-"
                      }
                      unit={project.reportCurrency || "JPY"}
                      icon={BarChart3}
                      color="purple"
                    />
                    <SummaryCard
                      label="IRR"
                      value={currentScenario?.irr?.toString() || "-"}
                      unit="%"
                      icon={TrendingUp}
                      color="amber"
                    />
                    <SummaryCard
                      label="ROI"
                      value={currentScenario?.roi?.toString() || "-"}
                      unit="%"
                      icon={TrendingUp}
                      color="rose"
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === "管理情報" ? (
                <motion.div
                  key="basic-info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    {/* 案件管理 */}
                    <EditSection title="案件管理" icon={FileText}>
                      <EditField
                        label="案件番号"
                        value={project.projectNo}
                        readOnly
                      />
                      <EditField
                        label="件名"
                        value={project.title}
                        onChange={(v) => handleFieldChange("title", v)}
                        suggestions={getSuggestions("title")}
                      />
                      <EditField
                        label="ステータス"
                        value={
                          project.status === "draft" ? "下書き" : project.status
                        }
                        badge
                      />
                      <EditField
                        label="作成者"
                        value={project.applicant}
                        onChange={(v) => handleFieldChange("applicant", v)}
                        suggestions={getSuggestions("applicant")}
                      />
                    </EditSection>

                    {/* 申請者・部署 */}
                    <EditSection title="申請者・部署" icon={LayoutDashboard}>
                      <EditField
                        label="申請部署"
                        value={project.department}
                        onChange={(v) => handleFieldChange("department", v)}
                        suggestions={getSuggestions("department")}
                        forceSelect
                      />
                      <EditField
                        label="申請者"
                        value={project.applicant}
                        onChange={(v) => handleFieldChange("applicant", v)}
                        suggestions={getSuggestions("applicant")}
                        forceSelect
                      />
                      <EditField
                        label="所属工場"
                        value={project.factory}
                        onChange={(v) => handleFieldChange("factory", v)}
                        suggestions={getSuggestions("factory")}
                        forceSelect
                      />
                      <EditField
                        label="関係部署"
                        value={project.relatedDepts}
                        onChange={(v) => handleFieldChange("relatedDepts", v)}
                        suggestions={getSuggestions("relatedDepts")}
                        forceSelect
                      />
                    </EditSection>

                    {/* 投資区分 */}
                    <EditSection title="投資区分" icon={TrendingUp}>
                      <EditField
                        label="投資区分"
                        value={project.investmentType}
                        onChange={(v) => handleFieldChange("investmentType", v)}
                        suggestions={getSuggestions("investmentType")}
                        forceSelect
                      />
                      <EditField
                        label="案件タイプ"
                        value={project.caseType}
                        onChange={(v) => handleFieldChange("caseType", v)}
                        suggestions={getSuggestions("caseType")}
                        forceSelect
                      />
                    </EditSection>
                  </div>
                </motion.div>
              ) : activeTab === "稟議内容・議題" ? (
                <motion.div
                  key="approval-content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                      各項目はPDF出力時に反映されます。未入力の項目はPDFには表示されません。具体的な状況が伝わるよう、数値や具体的な事例を交えて入力してください。
                    </p>
                  </div>

                  {/* 1. 目的 */}
                  <ContentEditCard title="1. 目的" icon={BarChart3}>
                    <BadgeSelect
                      label="導入目的 *"
                      options={PURPOSE_OPTIONS}
                      selected={project.introPurpose}
                      onChange={(v) => handleFieldChange("introPurpose", v)}
                    />
                    <LongTextField
                      label="目的詳細 *"
                      value={project.purposeDetail}
                      onChange={(v) => handleFieldChange("purposeDetail", v)}
                      placeholder="例：○○工程における生産能力向上と省人化を目的として、○○設備を導入する。"
                    />
                    <LongTextField
                      label="期待する到達状態"
                      value={project.expectedState}
                      onChange={(v) => handleFieldChange("expectedState", v)}
                      placeholder="導入後、どのような状態になっていることを目指すか入力してください。"
                    />
                  </ContentEditCard>

                  {/* 2. 背景 */}
                  <ContentEditCard title="2. 背景" icon={History}>
                    <BadgeSelect
                      label="背景分類"
                      options={BACKGROUND_OPTIONS}
                      selected={project.bgCategories}
                      onChange={(v) => handleFieldChange("bgCategories", v)}
                    />
                    <LongTextField
                      label="背景詳細"
                      value={project.bgDetail}
                      onChange={(v) => handleFieldChange("bgDetail", v)}
                      placeholder="例：対象製品の受注増加により、現行設備では月次生産計画への対応が困難になっている。"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SimpleInputField
                        label="発生時期"
                        value={project.bgTiming}
                        onChange={(v) => handleFieldChange("bgTiming", v)}
                        placeholder="2026年5月頃"
                      />
                      <SimpleInputField
                        label="関連する受注・製品"
                        value={project.bgRelatedProducts}
                        onChange={(v) =>
                          handleFieldChange("bgRelatedProducts", v)
                        }
                        placeholder="○○向け △△製品"
                      />
                    </div>
                    <SimpleInputField
                      label="顧客・市場要因"
                      value={project.bgMarketFactors}
                      onChange={(v) => handleFieldChange("bgMarketFactors", v)}
                      placeholder="顧客からの増産要請、市場シェア拡大など"
                    />
                  </ContentEditCard>

                  {/* 3. 現状課題 */}
                  <ContentEditCard title="3. 現状課題" icon={Database}>
                    <BadgeSelect
                      label="課題分類"
                      options={ISSUE_OPTIONS}
                      selected={project.issueCategories}
                      onChange={(v) => handleFieldChange("issueCategories", v)}
                    />
                    <LongTextField
                      label="現状課題詳細"
                      value={project.issueDetail}
                      onChange={(v) => handleFieldChange("issueDetail", v)}
                      placeholder="例：既存設備の老朽化により停止頻度が増加しており、月間○○時間の停止が発生している。"
                    />
                    <LongTextField
                      label="数値根拠"
                      value={project.issueEvidence}
                      onChange={(v) => handleFieldChange("issueEvidence", v)}
                      placeholder="故障率、残業時間、外注費などの具体的な数値を入力してください。"
                    />
                    <SimpleInputField
                      label="対象工程・作業"
                      value={project.issueProcess}
                      onChange={(v) => handleFieldChange("issueProcess", v)}
                      placeholder="○○工程の△△作業"
                    />
                    <LongTextField
                      label="現在の暫定対応"
                      value={project.issueInterim}
                      onChange={(v) => handleFieldChange("issueInterim", v)}
                      placeholder="現在、課題に対してどのように対応しているか入力してください（残業、人海戦術など）。"
                    />
                  </ContentEditCard>

                  {/* 4. 導入理由 */}
                  <ContentEditCard title="4. 導入理由" icon={TrendingUp}>
                    <LongTextField
                      label="導入理由"
                      value={project.reasonIntro}
                      onChange={(v) => handleFieldChange("reasonIntro", v)}
                      placeholder="例：既存設備の改造では必要能力を満たせないため、新規設備導入により能力向上と品質安定を図る。"
                    />
                    <LongTextField
                      label="既存設備で対応できない理由"
                      value={project.reasonExisting}
                      onChange={(v) => handleFieldChange("reasonExisting", v)}
                      placeholder="スペック不足、老朽化による精度不足など"
                    />
                    <LongTextField
                      label="他案ではなく本案を選ぶ理由"
                      value={project.reasonChoice}
                      onChange={(v) => handleFieldChange("reasonChoice", v)}
                      placeholder="コスト面、機能面、納期面などでの優位性"
                    />
                    <LongTextField
                      label="導入タイミングの理由"
                      value={project.reasonTiming}
                      onChange={(v) => handleFieldChange("reasonTiming", v)}
                      placeholder="なぜ今導入する必要があるのか"
                    />
                  </ContentEditCard>

                  {/* 5. 導入しない場合の影響 */}
                  <ContentEditCard title="5. 導入しない場合の影響" icon={Info}>
                    <BadgeSelect
                      label="影響分類"
                      options={IMPACT_OPTIONS}
                      selected={project.impactCategories}
                      onChange={(v) => handleFieldChange("impactCategories", v)}
                    />
                    <LongTextField
                      label="導入しない場合の影響"
                      value={project.impactDetail}
                      onChange={(v) => handleFieldChange("impactDetail", v)}
                      placeholder="例：導入しない場合、残業・外注対応が継続し、納期遅延およびコスト増加のリスクがある。"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 px-4 py-2 bg-[var(--color-border-main)]/5 rounded-lg border border-[var(--color-border-main)]/10">
                        <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
                          影響金額 ({project.currency})
                        </label>
                        <input
                          type="number"
                          value={project.impactAmount}
                          onChange={(e) =>
                            handleFieldChange(
                              "impactAmount",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-gray-400"
                        />
                      </div>
                      <SimpleInputField
                        label="影響時期"
                        value={project.impactTiming}
                        onChange={(v) => handleFieldChange("impactTiming", v)}
                        placeholder="2026年後半以降など"
                      />
                    </div>
                  </ContentEditCard>
                </motion.div>
              ) : activeTab === "生産条件" ? (
                <motion.div
                  key="prod-conditions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-12"
                >
                  <ContentEditCard title="共通生産条件" icon={Calculator}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditField
                        label="月稼働日"
                        value={project.workingDaysPerMonth}
                        onChange={(v) =>
                          handleFieldChange("workingDaysPerMonth", v)
                        }
                        placeholder="例：20"
                        unit="日"
                        type="number"
                      />
                      <EditField
                        label="業務時間/日(h)"
                        value={project.workingHoursPerDay}
                        onChange={(v) =>
                          handleFieldChange("workingHoursPerDay", v)
                        }
                        placeholder="例：8"
                        unit="h"
                        type="number"
                      />
                      <EditField
                        label={`電気代`}
                        value={project.electricityCostPerKwh}
                        onChange={(v) =>
                          handleFieldChange("electricityCostPerKwh", v)
                        }
                        placeholder="例：15"
                        unit={`${project.electricityCurrency || project.currency}/kWh`}
                        type="number"
                      />
                      <EditField
                        label="電気代通貨"
                        value={project.electricityCurrency || project.currency}
                        onChange={(v) =>
                          handleFieldChange("electricityCurrency", v)
                        }
                        suggestions={CURRENCIES.map((c) => c.code)}
                        forceSelect
                      />
                      <EditField
                        label="デフォルト割引率"
                        value={project.discountRate}
                        onChange={(v) => handleFieldChange("discountRate", v)}
                        placeholder="例：5.0"
                        unit="%"
                        type="number"
                      />
                    </div>
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 leading-relaxed italic mb-2">
                        ※
                        ここで入力した生産条件は、各「対策案・シナリオ」でのシミュレーション（導入効果、投資回収、損益分岐点など）の共通の計算前提として使用されます。
                      </p>
                      {globalSettings.exchangeRateSource &&
                        globalSettings.exchangeRateDate && (
                          <p className="text-[10px] text-gray-500 leading-relaxed italic">
                            ※ 為替換算には、設定の「
                            {globalSettings.exchangeRateSource}」(
                            {globalSettings.exchangeRateDate}
                            時点)のレートが適用されます。
                          </p>
                        )}
                    </div>
                  </ContentEditCard>

                  <ContentEditCard
                    title="対象製品・詳細（費用・売上算出用）"
                    icon={Package}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          製品の生産数、材料比率もしくは材料費、販売価格を年間/月間/個別のいずれかを選択して入力します。
                        </p>
                        <button
                          onClick={() => {
                            const newProducts = [
                              ...(project.targetProducts || []),
                              {
                                id: `prod-${Date.now()}`,
                                name: "",
                                volumeType: "年間",
                                volume: 0,
                                unit: "個",
                                materialCostType: "材料費",
                                materialCost: 0,
                                sellingPriceType: "販売価格",
                                sellingPrice: 0,
                              },
                            ];
                            handleFieldChange("targetProducts", newProducts);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          製品を追加
                        </button>
                      </div>

                      {!project.targetProducts ||
                      project.targetProducts.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-[var(--color-border-main)] rounded-xl opacity-50">
                          <p className="text-sm font-bold text-gray-500">
                            対象製品が登録されていません
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {project.targetProducts.map(
                            (prod: any, idx: number) => (
                              <div
                                key={prod.id}
                                className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-[var(--color-border-main)]"
                              >
                                <div className="flex justify-between items-center mb-4">
                                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    製品 {idx + 1}
                                  </span>
                                  <button
                                    onClick={() => {
                                      const newProducts =
                                        project.targetProducts.filter(
                                          (p: any) => p.id !== prod.id,
                                        );
                                      handleFieldChange(
                                        "targetProducts",
                                        newProducts,
                                      );
                                    }}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                      <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                        製品名
                                      </label>
                                      <input
                                        type="text"
                                        value={prod.name}
                                        onChange={(e) => {
                                          const newProducts = [
                                            ...project.targetProducts,
                                          ];
                                          newProducts[idx].name =
                                            e.target.value;
                                          handleFieldChange(
                                            "targetProducts",
                                            newProducts,
                                          );
                                        }}
                                        className="w-full bg-transparent border-b border-[var(--color-border-main)] py-1 text-sm focus:outline-none focus:border-blue-600"
                                        placeholder="例: 製品A"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--color-border-main)]/50 pt-4 mt-2">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                          生産数
                                        </label>
                                        <select
                                          value={prod.volumeType}
                                          onChange={(e) => {
                                            const newProducts = [
                                              ...project.targetProducts,
                                            ];
                                            newProducts[idx].volumeType =
                                              e.target.value;
                                            handleFieldChange(
                                              "targetProducts",
                                              newProducts,
                                            );
                                          }}
                                          className="text-[10px] bg-transparent font-bold text-blue-600 border border-blue-200 rounded px-1 outline-none dark:text-blue-400 dark:border-blue-800"
                                        >
                                          <option value="年間">年間</option>
                                          <option value="月間">月間</option>
                                        </select>
                                      </div>
                                      <div className="flex gap-2">
                                        <input
                                          type="number"
                                          value={prod.volume || ""}
                                          onChange={(e) => {
                                            const newProducts = [
                                              ...project.targetProducts,
                                            ];
                                            newProducts[idx].volume = Number(
                                              e.target.value,
                                            );
                                            handleFieldChange(
                                              "targetProducts",
                                              newProducts,
                                            );
                                          }}
                                          className="w-full bg-transparent border-b border-[var(--color-border-main)] py-1 text-sm focus:outline-none focus:border-blue-600"
                                          placeholder="0"
                                        />
                                        <input
                                          type="text"
                                          value={prod.unit || ""}
                                          onChange={(e) => {
                                            const newProducts = [
                                              ...project.targetProducts,
                                            ];
                                            newProducts[idx].unit =
                                              e.target.value;
                                            handleFieldChange(
                                              "targetProducts",
                                              newProducts,
                                            );
                                          }}
                                          className="w-16 bg-transparent border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-blue-600 text-center"
                                          placeholder="単位"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                          材料費設定
                                        </label>
                                        <select
                                          value={prod.materialCostType}
                                          onChange={(e) => {
                                            const newProducts = [
                                              ...project.targetProducts,
                                            ];
                                            newProducts[idx].materialCostType =
                                              e.target.value;
                                            handleFieldChange(
                                              "targetProducts",
                                              newProducts,
                                            );
                                          }}
                                          className="text-[10px] bg-transparent font-bold text-blue-600 border border-blue-200 rounded px-1 outline-none dark:text-blue-400 dark:border-blue-800"
                                        >
                                          <option value="材料費">材料費</option>
                                          <option value="材料比率">
                                            材料比率(%)
                                          </option>
                                        </select>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={prod.materialCost || ""}
                                          onChange={(e) => {
                                            const newProducts = [
                                              ...project.targetProducts,
                                            ];
                                            newProducts[idx].materialCost =
                                              Number(e.target.value);
                                            handleFieldChange(
                                              "targetProducts",
                                              newProducts,
                                            );
                                          }}
                                          className="w-full bg-transparent border-b border-[var(--color-border-main)] py-1 text-sm focus:outline-none focus:border-blue-600"
                                          placeholder="0"
                                        />
                                        {prod.materialCostType === "材料比率" ? (
                                          <span className="text-xs text-gray-500">%</span>
                                        ) : (
                                          <select
                                            value={prod.currency || project.currency || "JPY"}
                                            onChange={(e) => {
                                              const newProducts = [...project.targetProducts];
                                              newProducts[idx].currency = e.target.value;
                                              handleFieldChange("targetProducts", newProducts);
                                            }}
                                            className="text-xs text-gray-500 bg-transparent border-none focus:ring-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 min-w-[3rem]"
                                          >
                                            {CURRENCIES.map(c => (
                                              <option key={c.code} value={c.code}>{c.code}</option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                                          売上・価格設定
                                        </label>
                                        <select
                                          value={prod.sellingPriceType || "販売価格"}
                                          onChange={(e) => {
                                            const newProducts = [
                                              ...project.targetProducts,
                                            ];
                                            newProducts[idx].sellingPriceType =
                                              e.target.value;
                                            handleFieldChange(
                                              "targetProducts",
                                              newProducts,
                                            );
                                          }}
                                          className="text-[10px] bg-transparent font-bold text-blue-600 border border-blue-200 rounded px-1 outline-none dark:text-blue-400 dark:border-blue-800"
                                        >
                                          <option value="年間売上">年間売上</option>
                                          <option value="月間売上">月間売上</option>
                                          <option value="販売価格">販売価格</option>
                                        </select>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="number"
                                          value={prod.sellingPrice || ""}
                                          onChange={(e) => {
                                            const newProducts = [
                                              ...project.targetProducts,
                                            ];
                                            newProducts[idx].sellingPrice =
                                              Number(e.target.value);
                                            handleFieldChange(
                                              "targetProducts",
                                              newProducts,
                                            );
                                          }}
                                          className="w-full bg-transparent border-b border-[var(--color-border-main)] py-1 text-sm focus:outline-none focus:border-blue-600"
                                          placeholder="0"
                                        />
                                        <select
                                          value={prod.currency || project.currency || "JPY"}
                                          onChange={(e) => {
                                            const newProducts = [...project.targetProducts];
                                            newProducts[idx].currency = e.target.value;
                                            handleFieldChange("targetProducts", newProducts);
                                          }}
                                          className="text-xs text-gray-500 bg-transparent border-none focus:ring-0 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 min-w-[3rem]"
                                        >
                                          {CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.code}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </ContentEditCard>
                </motion.div>
              ) : activeTab === "購入設備・費用" ? (
                <motion.div
                  key="equip-config"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-20"
                >
                  {/* 1. シナリオ概要 */}
                  <ContentEditCard title="1. シナリオ概要" icon={FileText}>
                    <LongTextField
                      label="案の概要・コンセプト"
                      value={currentScenario?.overview || ""}
                      onChange={(v) =>
                        handleScenarioFieldChange(
                          activeScenarioId,
                          "overview",
                          v,
                        )
                      }
                      placeholder="例：既存ラインにロボットアームを追加し、後工程への自動搬送を実現する。省スペースかつ低コストな自動化案。"
                    />
                  </ContentEditCard>

                  {/* 2. 導入設備一覧 */}
                  <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[var(--color-border-main)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-sm">
                          2. 導入（購入）設備一覧
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {}}
                          className="px-3 py-1.5 text-[10px] font-bold bg-blue-600/10 text-blue-600 border border-blue-600/20 rounded-lg hover:bg-blue-600/20 transition-colors flex items-center gap-1.5"
                        >
                          <Database className="w-3 h-3" />
                          設備DBから追加
                        </button>
                        <button
                          onClick={() => {}}
                          className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 rounded-lg hover:bg-emerald-600/20 transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3 h-3" />
                          見積DBから追加
                        </button>
                        <button
                          onClick={() => {
                            const newItem: EquipmentItem = {
                              id: Math.random().toString(36).substr(2, 9),
                              name: "新規設備",
                              spec: "",
                              quantity: 1,
                              price: 0,
                              category: "償却対象",
                            };
                            const currentList =
                              currentScenario?.equipmentList || [];
                            handleScenarioFieldChange(
                              activeScenarioId,
                              "equipmentList",
                              [...currentList, newItem],
                            );
                          }}
                          className="px-3 py-1.5 text-[10px] font-bold bg-gray-600/10 text-[var(--color-brand-secondary)] border border-[var(--color-border-main)] rounded-lg hover:bg-gray-600/20 transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3 h-3" />
                          手入力で設備追加
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                          <tr className="bg-[var(--color-border-main)]/5 border-b border-[var(--color-border-main)] whitespace-nowrap">
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                              設備名
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                              仕様・型番
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-20 text-right">
                              数量
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-32 border-l border-[var(--color-border-main)]/50">
                              ベンダー (見積先)
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-32">
                              見積No
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-24 text-center border-l border-[var(--color-border-main)]/50">
                              見積通貨
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-32 text-right">
                              単価
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-32 text-right">
                              見積合計
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-blue-600 w-32 text-right border-l border-blue-600/20 bg-blue-50/50 dark:bg-blue-900/10">
                              換算合計 ({project.unitDisplay || "万円"})
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-28 text-center border-l border-[var(--color-border-main)]/50">
                              償却区分
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-16 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-main)]">
                          {(() => {
                            const newEquipmentsFromLU = (
                              currentScenario?.lineUnits || []
                            ).flatMap((lu: any) =>
                              (lu.resources || [])
                                .filter(
                                  (r: any) => r.type === "設備" && r.isNew,
                                )
                                .map((r: any) => {
                                  const master = masterEquipment.find(
                                    (m) =>
                                      m.id === r.equipmentId ||
                                      m.name === r.name,
                                  );
                                  const preferredQuote =
                                    master?.quotes?.find(
                                      (q) => q.isPreferred,
                                    ) ||
                                    (master?.quotes?.length
                                      ? master.quotes[master.quotes.length - 1]
                                      : undefined);
                                  return {
                                    id: `lu-${lu.id}-${r.id}`,
                                    name: r.name || master?.name || "",
                                    spec: master?.modelCode || "",
                                    quantity: parseFloat(r.quantity) || 1,
                                    vendor: preferredQuote?.vendorName || "",
                                    quoteRef: preferredQuote?.quoteNumber || "",
                                    currency:
                                      preferredQuote?.currency ||
                                      project.currency ||
                                      "JPY",
                                    price: preferredQuote
                                      ? preferredQuote.baseAmount / 10000
                                      : 0,
                                    category: "償却対象",
                                    luName: lu.name,
                                    isAutoRendered: true,
                                  };
                                }),
                            );

                            const allEquipments = [
                              ...newEquipmentsFromLU,
                              ...(currentScenario?.equipmentList || []).map(
                                (e: any) => ({ ...e, isAutoRendered: false }),
                              ),
                            ];

                            if (allEquipments.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={10}
                                    className="px-6 py-12 text-center text-xs text-[var(--color-brand-secondary)] italic"
                                  >
                                    設備が登録されていません。「追加」ボタンから登録するか、ラインユニットで「新規」チェックを入れてください。
                                  </td>
                                </tr>
                              );
                            }

                            return allEquipments.map((item: any) => {
                              const itemTotalCost =
                                (item.price || 0) * (item.quantity || 0);
                              const itemTotalCostFormatted =
                                itemTotalCost.toLocaleString(undefined, {
                                  maximumFractionDigits: 1,
                                });
                              const convertedTotal = convertAmount(
                                itemTotalCost,
                                item.currency || project.currency || "JPY",
                                project.currency || "JPY",
                              );
                              const convertedTotalFormatted =
                                convertedTotal.toLocaleString(undefined, {
                                  maximumFractionDigits: 1,
                                });

                              if (item.isAutoRendered) {
                                return (
                                  <tr
                                    key={item.id}
                                    className="group bg-[var(--color-border-main)]/5 transition-colors"
                                  >
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium">
                                          {item.name}
                                        </span>
                                        <span className="text-[9px] text-amber-600 font-bold tracking-wider uppercase">
                                          {" "}
                                          {item.luName} 由来
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[var(--color-brand-secondary)]">
                                      {item.spec || (
                                        <span className="opacity-50">
                                          未入力
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right">
                                      {item.quantity}
                                    </td>
                                    <td className="px-4 py-3 border-l border-[var(--color-border-main)]/50">
                                      <span className="text-sm text-[var(--color-brand-secondary)]">
                                        {item.vendor || (
                                          <span className="opacity-50">
                                            未指定
                                          </span>
                                        )}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-sm font-mono text-[var(--color-brand-secondary)]">
                                        {item.quoteRef || (
                                          <span className="opacity-50">
                                            未指定
                                          </span>
                                        )}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-[10px] font-bold border-l border-[var(--color-border-main)]/50">
                                      {item.currency}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono text-right whitespace-nowrap">
                                      {item.price.toLocaleString(undefined, {
                                        maximumFractionDigits: 1,
                                      })}
                                      <span className="text-[10px] opacity-70 ml-1">
                                        万
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono font-bold text-[var(--color-text-main)] text-right whitespace-nowrap">
                                      {itemTotalCostFormatted}
                                      <span className="text-[10px] opacity-70 ml-1">
                                        万
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600 text-right border-l border-blue-600/20 bg-blue-50/50 dark:bg-blue-900/10">
                                      {convertedTotalFormatted}
                                    </td>
                                    <td className="px-4 py-3 text-[10px] font-bold text-center border-l border-[var(--color-border-main)]/50">
                                      {item.category}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <span className="text-[9px] text-gray-400 font-bold">
                                        自動抽出
                                      </span>
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr
                                  key={item.id}
                                  className="group hover:bg-[var(--color-border-main)]/5 transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <input
                                      className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full font-medium"
                                      value={item.name}
                                      onChange={(e) => {
                                        const newList =
                                          currentScenario.equipmentList.map(
                                            (i: any) =>
                                              i.id === item.id
                                                ? { ...i, name: e.target.value }
                                                : i,
                                          );
                                        handleScenarioFieldChange(
                                          activeScenarioId,
                                          "equipmentList",
                                          newList,
                                        );
                                      }}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-[var(--color-brand-secondary)]"
                                      value={item.spec}
                                      placeholder="未入力"
                                      onChange={(e) => {
                                        const newList =
                                          currentScenario.equipmentList.map(
                                            (i: any) =>
                                              i.id === item.id
                                                ? { ...i, spec: e.target.value }
                                                : i,
                                          );
                                        handleScenarioFieldChange(
                                          activeScenarioId,
                                          "equipmentList",
                                          newList,
                                        );
                                      }}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      type="number"
                                      className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full text-right"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const newList =
                                          currentScenario.equipmentList.map(
                                            (i: any) =>
                                              i.id === item.id
                                                ? {
                                                    ...i,
                                                    quantity:
                                                      parseInt(
                                                        e.target.value,
                                                      ) || 0,
                                                  }
                                                : i,
                                          );
                                        handleScenarioFieldChange(
                                          activeScenarioId,
                                          "equipmentList",
                                          newList,
                                        );
                                      }}
                                    />
                                  </td>
                                  <td className="px-4 py-3 border-l border-[var(--color-border-main)]/50">
                                    <input
                                      className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full"
                                      value={item.vendor || ""}
                                      placeholder="ベンダー名を入力"
                                      onChange={(e) => {
                                        const newList =
                                          currentScenario.equipmentList.map(
                                            (i: any) =>
                                              i.id === item.id
                                                ? {
                                                    ...i,
                                                    vendor: e.target.value,
                                                  }
                                                : i,
                                          );
                                        handleScenarioFieldChange(
                                          activeScenarioId,
                                          "equipmentList",
                                          newList,
                                        );
                                      }}
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <input
                                      className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full font-mono"
                                      value={item.quoteRef || ""}
                                      placeholder="見積No"
                                      onChange={(e) => {
                                        const newList =
                                          currentScenario.equipmentList.map(
                                            (i: any) =>
                                              i.id === item.id
                                                ? {
                                                    ...i,
                                                    quoteRef: e.target.value,
                                                  }
                                                : i,
                                          );
                                        handleScenarioFieldChange(
                                          activeScenarioId,
                                          "equipmentList",
                                          newList,
                                        );
                                      }}
                                    />
                                  </td>
                                  <td className="px-4 py-3 border-l border-[var(--color-border-main)]/50">
                                    <select
                                      className="bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 w-full cursor-pointer text-center"
                                      value={
                                        item.currency ||
                                        project.currency ||
                                        "JPY"
                                      }
                                      onChange={(e) => {
                                        const newList =
                                          currentScenario.equipmentList.map(
                                            (i: any) =>
                                              i.id === item.id
                                                ? {
                                                    ...i,
                                                    currency: e.target.value,
                                                  }
                                                : i,
                                          );
                                        handleScenarioFieldChange(
                                          activeScenarioId,
                                          "equipmentList",
                                          newList,
                                        );
                                      }}
                                    >
                                      {CURRENCIES.map((c) => (
                                        <option key={c.code} value={c.code}>
                                          {c.code}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-3 flex items-center justify-end gap-1 whitespace-nowrap">
                                    <input
                                      type="number"
                                      className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full font-mono text-right"
                                      value={item.price}
                                      onChange={(e) => {
                                        const newList =
                                          currentScenario.equipmentList.map(
                                            (i: any) =>
                                              i.id === item.id
                                                ? {
                                                    ...i,
                                                    price:
                                                      parseFloat(
                                                        e.target.value,
                                                      ) || 0,
                                                  }
                                                : i,
                                          );
                                        handleScenarioFieldChange(
                                          activeScenarioId,
                                          "equipmentList",
                                          newList,
                                        );
                                      }}
                                    />
                                    <span className="text-[10px] opacity-70">
                                      万
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-mono font-bold text-[var(--color-text-main)] text-right whitespace-nowrap">
                                    {itemTotalCostFormatted}
                                    <span className="text-[10px] opacity-70 ml-1">
                                      万
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600 text-right border-l border-blue-600/20 bg-blue-50/50 dark:bg-blue-900/10">
                                    {convertedTotalFormatted}
                                  </td>
                                  <td className="px-4 py-3 border-l border-[var(--color-border-main)]/50">
                                    <select
                                      className="bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 w-full cursor-pointer text-center"
                                      value={item.category}
                                      onChange={(e) => {
                                        const newList =
                                          currentScenario.equipmentList.map(
                                            (i: any) =>
                                              i.id === item.id
                                                ? {
                                                    ...i,
                                                    category: e.target.value,
                                                  }
                                                : i,
                                          );
                                        handleScenarioFieldChange(
                                          activeScenarioId,
                                          "equipmentList",
                                          newList,
                                        );
                                      }}
                                    >
                                      <option value="償却対象">償却対象</option>
                                      <option value="非償却対象">
                                        非償却対象
                                      </option>
                                      <option value="要確認">要確認</option>
                                    </select>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      onClick={() => {
                                        setDialog({
                                          type: "confirm",
                                          title: "項目の削除",
                                          message: "この項目を削除しますか？",
                                          isDestructive: true,
                                          onConfirm: () => {
                                            const newList =
                                              currentScenario.equipmentList.filter(
                                                (i: any) => i.id !== item.id,
                                              );
                                            handleScenarioFieldChange(
                                              activeScenarioId,
                                              "equipmentList",
                                              newList,
                                            );
                                            setDialog(null);
                                          },
                                        });
                                      }}
                                      className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3. 手入力費用・追加費用 */}
                  <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-[var(--color-border-main)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-sm">
                          3. その他費用（工事・諸経費）
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          const newItem: CostItem = {
                            id: Math.random().toString(36).substr(2, 9),
                            name: "工事・経費項目",
                            amount: 0,
                            category: "非償却対象",
                          };
                          const currentCosts =
                            currentScenario?.additionalCosts || [];
                          handleScenarioFieldChange(
                            activeScenarioId,
                            "additionalCosts",
                            [...currentCosts, newItem],
                          );
                        }}
                        className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 rounded-lg hover:bg-emerald-600/20 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3" />
                        手入力費用追加
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-[var(--color-border-main)]/5 border-b border-[var(--color-border-main)]">
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)]">
                              項目名
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-24 text-center">
                              通貨
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-40 text-right">
                              金額
                            </th>
                            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-blue-600 w-32 text-right border-l border-blue-600/20 bg-blue-50/50 dark:bg-blue-900/10">
                              換算合計 ({project.unitDisplay || "万円"})
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-32 text-center border-l border-[var(--color-border-main)]/50">
                              償却区分
                            </th>
                            <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] w-20 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-main)]">
                          {(currentScenario?.additionalCosts || []).length ===
                          0 ? (
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-12 text-center text-xs text-[var(--color-brand-secondary)] italic"
                              >
                                追加費用が登録されていません。「追加」ボタンから登録してください。
                              </td>
                            </tr>
                          ) : (
                            (currentScenario?.additionalCosts || []).map(
                              (cost: CostItem) => {
                                const convertedAmt = convertAmount(
                                  cost.amount || 0,
                                  cost.currency || project.currency || "JPY",
                                  project.currency || "JPY",
                                );
                                return (
                                  <tr
                                    key={cost.id}
                                    className="group hover:bg-[var(--color-border-main)]/5 transition-colors"
                                  >
                                    <td className="px-6 py-3">
                                      <input
                                        className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full font-medium"
                                        value={cost.name}
                                        onChange={(e) => {
                                          const newCosts =
                                            currentScenario.additionalCosts.map(
                                              (c: any) =>
                                                c.id === cost.id
                                                  ? {
                                                      ...c,
                                                      name: e.target.value,
                                                    }
                                                  : c,
                                            );
                                          handleScenarioFieldChange(
                                            activeScenarioId,
                                            "additionalCosts",
                                            newCosts,
                                          );
                                        }}
                                      />
                                    </td>
                                    <td className="px-6 py-3">
                                      <select
                                        className="bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 w-full cursor-pointer text-center"
                                        value={
                                          cost.currency ||
                                          project.currency ||
                                          "JPY"
                                        }
                                        onChange={(e) => {
                                          const newCosts =
                                            currentScenario.additionalCosts.map(
                                              (c: any) =>
                                                c.id === cost.id
                                                  ? {
                                                      ...c,
                                                      currency: e.target.value,
                                                    }
                                                  : c,
                                            );
                                          handleScenarioFieldChange(
                                            activeScenarioId,
                                            "additionalCosts",
                                            newCosts,
                                          );
                                        }}
                                      >
                                        {CURRENCIES.map((c) => (
                                          <option key={c.code} value={c.code}>
                                            {c.code}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-6 py-3 flex items-center justify-end gap-1">
                                      <input
                                        type="number"
                                        className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full font-mono text-right"
                                        value={cost.amount}
                                        onChange={(e) => {
                                          const newCosts =
                                            currentScenario.additionalCosts.map(
                                              (c: any) =>
                                                c.id === cost.id
                                                  ? {
                                                      ...c,
                                                      amount:
                                                        parseFloat(
                                                          e.target.value,
                                                        ) || 0,
                                                    }
                                                  : c,
                                            );
                                          handleScenarioFieldChange(
                                            activeScenarioId,
                                            "additionalCosts",
                                            newCosts,
                                          );
                                        }}
                                      />
                                      <span className="text-[10px] opacity-70">
                                        万
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono font-bold text-blue-600 text-right border-l border-blue-600/20 bg-blue-50/50 dark:bg-blue-900/10">
                                      {convertedAmt.toLocaleString(undefined, {
                                        maximumFractionDigits: 1,
                                      })}
                                    </td>
                                    <td className="px-6 py-3 border-l border-[var(--color-border-main)]/50">
                                      <select
                                        className="bg-transparent border-none p-0 text-[10px] font-bold focus:ring-0 w-full cursor-pointer text-center"
                                        value={cost.category}
                                        onChange={(e) => {
                                          const newCosts =
                                            currentScenario.additionalCosts.map(
                                              (c: any) =>
                                                c.id === cost.id
                                                  ? {
                                                      ...c,
                                                      category: e.target.value,
                                                    }
                                                  : c,
                                            );
                                          handleScenarioFieldChange(
                                            activeScenarioId,
                                            "additionalCosts",
                                            newCosts,
                                          );
                                        }}
                                      >
                                        <option value="償却対象">
                                          償却対象
                                        </option>
                                        <option value="非償却対象">
                                          非償却対象
                                        </option>
                                        <option value="要確認">要確認</option>
                                      </select>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                      <button
                                        onClick={() => {
                                          setDialog({
                                            type: "confirm",
                                            title: "項目の削除",
                                            message: "この項目を削除しますか？",
                                            isDestructive: true,
                                            onConfirm: () => {
                                              const newCosts =
                                                currentScenario.additionalCosts.filter(
                                                  (c: any) => c.id !== cost.id,
                                                );
                                              handleScenarioFieldChange(
                                                activeScenarioId,
                                                "additionalCosts",
                                                newCosts,
                                              );
                                              setDialog(null);
                                            },
                                          });
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              },
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. 設備構成説明 */}
                  <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <HelpCircle className="w-5 h-5 text-gray-400" />
                      <h3 className="font-bold text-sm">
                        4. 設備（購入品）構成説明・技術的根拠
                      </h3>
                    </div>
                    <LongTextField
                      label="技術的な選定理由・導入の妥当性"
                      value={currentScenario?.equipmentConfig || ""}
                      onChange={(v) =>
                        handleScenarioFieldChange(
                          activeScenarioId,
                          "equipmentConfig",
                          v,
                        )
                      }
                      placeholder="なぜこの構成・スペックを導入・購入する必要があるのか、根拠を入力してください。"
                    />
                  </div>

                  {/* 5. 投資額サマリー */}
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                      <Calculator className="w-6 h-6 text-blue-500" />
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        5. 案件投資額サマリー
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Total */}
                      <div className="bg-blue-600/10 border border-blue-600/30 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Calculator className="w-12 h-12 text-blue-600" />
                        </div>
                        <div className="relative z-10">
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                            総投資額
                          </p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-white font-mono tracking-tighter">
                              {convertAmount(
                                currentScenario?.investmentAmount
                                  ? currentScenario.investmentAmount / 10000
                                  : 0,
                                "JPY",
                                project.currency || "JPY",
                              ).toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                              })}
                            </span>
                            <span className="text-xs font-bold text-blue-400">
                              {project.unitDisplay || "万円"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Depreciable */}
                      <div className="bg-emerald-600/5 border border-emerald-600/20 rounded-2xl p-6">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Check className="w-3 h-3" />
                          償却対象額 (推計)
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white font-mono tracking-tighter">
                            {(() => {
                              const equipTotal = (
                                currentScenario?.equipmentList || []
                              )
                                .filter((i: any) => i.category === "償却対象")
                                .reduce(
                                  (acc: number, item: any) =>
                                    acc +
                                    convertAmount(
                                      (item.price || 0) * (item.quantity || 0),
                                      item.currency ||
                                        project.currency ||
                                        "JPY",
                                      project.currency || "JPY",
                                    ),
                                  0,
                                );
                              const bonusTotal = (
                                currentScenario?.additionalCosts || []
                              )
                                .filter((i: any) => i.category === "償却対象")
                                .reduce(
                                  (acc: number, item: any) =>
                                    acc +
                                    convertAmount(
                                      item.amount || 0,
                                      item.currency ||
                                        project.currency ||
                                        "JPY",
                                      project.currency || "JPY",
                                    ),
                                  0,
                                );

                              // Assume new line unit equipment is depreciable
                              let luDepreciable = 0;
                              (currentScenario?.lineUnits || []).forEach(
                                (lu: any) => {
                                  (lu.resources || []).forEach((r: any) => {
                                    if (r.type === "設備" && r.isNew) {
                                      const master = masterEquipment.find(
                                        (m) =>
                                          m.id === r.equipmentId ||
                                          m.name === r.name,
                                      );
                                      const preferredQuote =
                                        master?.quotes?.find(
                                          (q) => q.isPreferred,
                                        ) ||
                                        (master?.quotes?.length
                                          ? master.quotes[
                                              master.quotes.length - 1
                                            ]
                                          : undefined);
                                      if (preferredQuote)
                                        luDepreciable +=
                                          convertAmount(
                                            preferredQuote.baseAmount / 10000,
                                            "JPY",
                                            project.currency || "JPY",
                                          ) * (r.quantity || 0); // Need to use base logic
                                    }
                                  });
                                },
                              );

                              return (
                                equipTotal +
                                bonusTotal +
                                luDepreciable
                              ).toLocaleString(undefined, {
                                maximumFractionDigits: 1,
                              });
                            })()}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-400/70">
                            {project.unitDisplay || "万円"}
                          </span>
                        </div>
                      </div>

                      {/* Non-Depreciable */}
                      <div className="bg-gray-600/5 border border-gray-600/20 rounded-2xl p-6">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                          非償却対象額
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white font-mono tracking-tighter">
                            {(() => {
                              const equipTotal = (
                                currentScenario?.equipmentList || []
                              )
                                .filter((i: any) => i.category === "非償却対象")
                                .reduce(
                                  (acc: number, item: any) =>
                                    acc +
                                    convertAmount(
                                      (item.price || 0) * (item.quantity || 0),
                                      item.currency ||
                                        project.currency ||
                                        "JPY",
                                      project.currency || "JPY",
                                    ),
                                  0,
                                );
                              const bonusTotal = (
                                currentScenario?.additionalCosts || []
                              )
                                .filter((i: any) => i.category === "非償却対象")
                                .reduce(
                                  (acc: number, item: any) =>
                                    acc +
                                    convertAmount(
                                      item.amount || 0,
                                      item.currency ||
                                        project.currency ||
                                        "JPY",
                                      project.currency || "JPY",
                                    ),
                                  0,
                                );
                              return (equipTotal + bonusTotal).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 1 },
                              );
                            })()}
                          </span>
                          <span className="text-[10px] font-medium text-gray-600/70">
                            {project.unitDisplay || "万円"}
                          </span>
                        </div>
                      </div>

                      {/* To Confirm */}
                      <div className="bg-amber-600/5 border border-amber-600/20 rounded-2xl p-6">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          要確認額
                        </p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-white font-mono tracking-tighter">
                            {(() => {
                              const equipTotal = (
                                currentScenario?.equipmentList || []
                              )
                                .filter((i: any) => i.category === "要確認")
                                .reduce(
                                  (acc: number, item: any) =>
                                    acc +
                                    convertAmount(
                                      (item.price || 0) * (item.quantity || 0),
                                      item.currency ||
                                        project.currency ||
                                        "JPY",
                                      project.currency || "JPY",
                                    ),
                                  0,
                                );
                              const bonusTotal = (
                                currentScenario?.additionalCosts || []
                              )
                                .filter((i: any) => i.category === "要確認")
                                .reduce(
                                  (acc: number, item: any) =>
                                    acc +
                                    convertAmount(
                                      item.amount || 0,
                                      item.currency ||
                                        project.currency ||
                                        "JPY",
                                      project.currency || "JPY",
                                    ),
                                  0,
                                );
                              return (equipTotal + bonusTotal).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 1 },
                              );
                            })()}
                          </span>
                          <span className="text-[10px] font-medium text-amber-600/70">
                            {project.unitDisplay || "万円"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === "ラインユニット" ? (
                <motion.div
                  key="line-unit-config"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span className="text-blue-600">
                        {currentScenario?.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span>ラインユニット（リソース / 能力）</span>
                    </h3>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-4 shadow-sm">
                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                      <Info className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                        ラインユニットは生産ブロックを表します。能力やコストの根拠はリソース明細に持たせ、ラインバランス分析はラインユニット単位で行います。
                      </p>
                      <p className="text-[10px] text-blue-700 dark:text-blue-300 opacity-80 italic leading-relaxed">
                        ※
                        購入設備・費用では「何を買うか・いくらかかるか」を整理し、ラインユニットでは「人・設備・時間を使ってどれだけ生産できるか」を整理します。
                      </p>
                    </div>
                  </div>

                  {/* Line Unit Tabs */}
                  <div className="flex flex-wrap gap-2 mb-4 bg-gray-100 dark:bg-gray-800/50 p-1.5 rounded-xl border border-[var(--color-border-main)]/50">
                    {currentScenario?.lineUnits?.map((lu: any) => (
                      <div key={lu.id} className="relative group">
                        <button
                          onClick={() => setActiveLineUnitId(lu.id)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                            activeLineUnitId === lu.id
                              ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm border border-blue-600/20"
                              : "text-[var(--color-brand-secondary)] hover:text-gray-900 dark:hover:text-gray-100"
                          }`}
                        >
                          <span className="opacity-50">{lu.number}</span>
                          <span>{lu.name}</span>
                          {masterLineUnits.some(
                            (mlu) => mlu.name === lu.name,
                          ) && <Database className="w-3 h-3 text-blue-500" />}
                        </button>
                        {currentScenario.lineUnits.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteLineUnit(lu.id);
                            }}
                            className={`absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center transition-all z-10 shadow-sm ${
                              activeLineUnitId === lu.id
                                ? "opacity-100 scale-100"
                                : "opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                            }`}
                            title="ユニットをプロジェクトから外す"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        // Get all unique numbers from ALL projects and scenarios to find the global next one
                        const allScenarioNumbers =
                          allProjects
                            .flatMap((p) => p.scenarios || [])
                            .flatMap((s) => s.lineUnits || [])
                            .map((lu) =>
                              parseInt(lu.number.replace("U", "")),
                            ) || [];
                        // Also check the current unsaved state of the project
                        const currentProjectNumbers =
                          project.scenarios
                            ?.flatMap((s: any) => s.lineUnits || [])
                            .map((lu: any) =>
                              parseInt(lu.number.replace("U", "")),
                            ) || [];
                        const allNumbers = [
                          ...allScenarioNumbers,
                          ...currentProjectNumbers,
                        ];

                        const nextNum =
                          allNumbers.length > 0
                            ? Math.max(...allNumbers) + 1
                            : 101;
                        const newId = `lu-${Date.now()}`;
                        const newNumber = `U${nextNum}`;

                        const updatedScenarios = (project.scenarios || []).map(
                          (s: any) => {
                            if (s.id === activeScenarioId) {
                              return {
                                ...s,
                                lineUnits: [
                                  ...(s.lineUnits || []),
                                  {
                                    id: newId,
                                    number: newNumber,
                                    name: `新ユニット ${nextNum}`,
                                    order: (s.lineUnits?.length || 0) + 1,
                                    line: "",
                                    prevUnit: "",
                                    nextUnit: "",
                                    buffer: "0",
                                    resources: [],
                                  },
                                ],
                                lineUnitCount: (s.lineUnits?.length || 0) + 1,
                              };
                            }
                            return s;
                          },
                        );

                        setProject({ ...project, scenarios: updatedScenarios });
                        setActiveLineUnitId(newId);
                        setIsDirty(true);
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-blue-600 border border-dashed border-blue-600/30 hover:bg-blue-600/5 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ラインユニット追加</span>
                    </button>
                    {masterLineUnits.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[var(--color-brand-secondary)] ml-2">
                          マスタ読込:
                        </span>
                        <select
                          className="text-[10px] font-bold bg-white dark:bg-gray-800 border border-[var(--color-border-main)] rounded px-2 py-1 outline-none"
                          onChange={(e) => {
                            const master = masterLineUnits.find(
                              (m) => m.id === e.target.value,
                            );
                            if (!master) return;
                            const allScenarioNumbers =
                              allProjects
                                .flatMap((p) => p.scenarios || [])
                                .flatMap((s) => s.lineUnits || [])
                                .map((lu) =>
                                  parseInt(lu.number.replace("U", "")),
                                ) || [];
                            const currentProjectNumbers =
                              project.scenarios
                                ?.flatMap((s: any) => s.lineUnits || [])
                                .map((lu: any) =>
                                  parseInt(lu.number.replace("U", "")),
                                ) || [];
                            const allNumbers = [
                              ...allScenarioNumbers,
                              ...currentProjectNumbers,
                            ];
                            const nextNum =
                              allNumbers.length > 0
                                ? Math.max(...allNumbers) + 1
                                : 101;
                            const newId = `lu-${Date.now()}`;
                            const newNumber = `U${nextNum}`;
                            const updatedScenarios = (
                              project.scenarios || []
                            ).map((s: any) => {
                              if (s.id === activeScenarioId) {
                                return {
                                  ...s,
                                  lineUnits: [
                                    ...(s.lineUnits || []),
                                    {
                                      ...JSON.parse(JSON.stringify(master)),
                                      id: newId,
                                      number: newNumber,
                                      order: (s.lineUnits?.length || 0) + 1,
                                    },
                                  ],
                                  lineUnitCount: (s.lineUnits?.length || 0) + 1,
                                };
                              }
                              return s;
                            });
                            setProject({
                              ...project,
                              scenarios: updatedScenarios,
                            });
                            setActiveLineUnitId(newId);
                            setIsDirty(true);
                            e.target.value = "";
                          }}
                        >
                          <option value="">選択...</option>
                          {masterLineUnits.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {activeLineUnit ? (
                    <div className="space-y-6">
                      <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <Box className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-sm">
                              ラインユニット設定
                            </h3>
                          </div>
                          <button
                            onClick={() => {
                              const luMaster: LineUnitMaster = {
                                id: `LUM-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                                name: activeLineUnit.name,
                                description: "",
                                workingHours:
                                  activeLineUnit.workingHours || "160",
                                operatingRate:
                                  activeLineUnit.operatingRate || "100",
                                prevUnit: activeLineUnit.prevUnit || "",
                                nextUnit: activeLineUnit.nextUnit || "",
                                buffer: activeLineUnit.buffer || "0",
                                resources: JSON.parse(
                                  JSON.stringify(
                                    activeLineUnit.resources || [],
                                  ),
                                ),
                                tags: [],
                                category: "一般",
                              };
                              onSaveLineUnitToMaster(luMaster);
                              setDialog({
                                type: "alert",
                                title: "登録完了",
                                message: "マスタに登録しました。",
                                onConfirm: () => setDialog(null),
                              });
                            }}
                            className="px-3 py-1.5 text-[10px] font-bold bg-blue-600/10 text-blue-600 border border-blue-600/20 rounded-lg hover:bg-blue-600/20 transition-colors flex items-center gap-1.5"
                          >
                            <Save className="w-3 h-3" />
                            <span>マスタに登録</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                          <EditField
                            label="ユニット番号"
                            value={activeLineUnit.number}
                            readOnly={true}
                            onChange={() => {}}
                          />
                          <EditField
                            label="ユニット名"
                            value={activeLineUnit.name}
                            suggestions={getSuggestions("name")}
                            onChange={(v) =>
                              handleLineUnitChange(activeLineUnitId!, {
                                name: v,
                              })
                            }
                          />
                          <EditField
                            label="稼働率 (%)"
                            value={activeLineUnit.operatingRate || "100"}
                            type="number"
                            onChange={(v) =>
                              handleLineUnitChange(activeLineUnitId!, {
                                operatingRate: v,
                              })
                            }
                          />
                          <EditField
                            label="月間稼働時間 (h)"
                            value={activeLineUnit.workingHours || "160"}
                            type="number"
                            onChange={(v) =>
                              handleLineUnitChange(activeLineUnitId!, {
                                workingHours: v,
                              })
                            }
                          />
                          <div className="flex justify-end pb-1">
                            <button className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                              <span>詳細設定を表示</span>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Resource List Table */}
                      <ContentEditCard title="リソース明細" icon={Database}>
                        {powerWarning && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3 text-amber-800 dark:text-amber-200 text-xs"
                          >
                            <Info className="w-4 h-4 flex-shrink-0" />
                            <p className="font-bold">{powerWarning}</p>
                          </motion.div>
                        )}
                        <div className="overflow-x-auto -mx-6 px-6 scrollbar-thin">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                              <tr className="border-b border-[var(--color-border-main)] text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
                                <th className="py-3 pr-4 w-32 text-center">
                                  種別
                                </th>
                                <th className="py-3 px-4 min-w-[200px]">リソース名</th>
                                <th className="py-3 px-4 w-12 text-center">
                                  新規
                                </th>
                                <th className="py-3 px-4 w-24 text-right">
                                  数量
                                </th>
                                <th className="py-3 px-4 w-20">単位</th>
                                <th className="py-3 px-4 w-28 text-right">
                                  産出SPM
                                </th>
                                <th className="py-3 px-4 w-28 text-right">
                                  定格電力
                                  <br />
                                  <span className="text-[8px] opacity-70">
                                    (kW)
                                  </span>
                                </th>
                                <th className="py-3 px-4 w-32 text-right">
                                  時間単価
                                </th>
                                <th className="py-3 px-4">備考</th>
                                <th className="py-3 pl-4 w-16"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border-main)]/50">
                              {(activeLineUnit?.resources || [])
                                .filter((r: any) => r.type !== "エネルギー")
                                .map((r: any) => {
                                  const latest = calculateLatestMasterValues(
                                    activeLineUnitId!,
                                    r,
                                  );

                                  // Check for Hourly Rate deviation
                                  const hasRateDiff =
                                    latest &&
                                    latest.latestHourlyRate !==
                                      r.hourlyRate.toString();

                                  // Check if SPM is strictly outside the database range (only for '設備')
                                  const currentSpm = parseFloat(r.spm);
                                  const isSpmOutOfRange =
                                    latest &&
                                    r.type === "設備" &&
                                    (currentSpm < latest.minSpm ||
                                      currentSpm > latest.maxSpm);

                                  const hasAnyAlert =
                                    hasRateDiff || isSpmOutOfRange;

                                  return (
                                    <tr
                                      key={r.id}
                                      className="text-sm hover:bg-[var(--color-border-main)]/5 group transition-colors"
                                    >
                                      <td className="py-3 pr-4 text-center">
                                        <button
                                          onClick={() =>
                                            setEditingResource({
                                              luId: activeLineUnitId!,
                                              res: r,
                                            })
                                          }
                                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border transition-transform hover:scale-105 active:scale-95 ${
                                            r.type === "人員"
                                              ? "bg-blue-100 text-blue-700 border-blue-200"
                                              : r.type === "設備"
                                                ? "bg-purple-100 text-purple-700 border-purple-200"
                                                : "bg-gray-100 text-gray-700 border-gray-200"
                                          }`}
                                        >
                                          {r.type}
                                        </button>
                                      </td>
                                      <td className="py-3 px-4 font-bold">
                                        <div className="w-full relative flex items-center gap-1 min-w-[200px]">
                                          <input
                                            className="bg-transparent border-none p-0 text-sm focus:ring-0 w-full font-bold"
                                            value={r.name}
                                            list={`res-name-${r.id}`}
                                            onChange={(e) =>
                                              handleResourceChange(
                                                activeLineUnitId!,
                                                r.id,
                                                { name: e.target.value },
                                              )
                                            }
                                          />
                                          {masterEquipment.some(
                                            (me) =>
                                              me.name === r.name ||
                                              me.id === r.equipmentId,
                                          ) && (
                                            <Database
                                              className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 flex-shrink-0"
                                              title="DB登録済み"
                                            />
                                          )}
                                          {hasAnyAlert && (
                                            <button
                                              onClick={() =>
                                                setSyncModal({
                                                  luId: activeLineUnitId!,
                                                  resource: r,
                                                  latestSpm: latest.latestSpm,
                                                  latestHourlyRate:
                                                    latest.latestHourlyRate,
                                                  latestRemarks:
                                                    latest.latestRemarks,
                                                })
                                              }
                                              className="text-amber-500 hover:text-amber-600 transition-colors tooltip flex-shrink-0"
                                              title={
                                                isSpmOutOfRange
                                                  ? `SPMがデータベース規定値外です(規定: ${latest.minSpm}~${latest.maxSpm})。クリックして平均値に修正。`
                                                  : "最新データベースと差異があります。クリックして反映。"
                                              }
                                            >
                                              <AlertCircle className="w-4 h-4 fill-amber-500/10" />
                                            </button>
                                          )}
                                          <datalist id={`res-name-${r.id}`}>
                                            {getSuggestions("name").items.map(
                                              (opt, i) => (
                                                <option key={i} value={opt} />
                                              ),
                                            )}
                                          </datalist>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        {r.type === "設備" && (
                                          <input
                                            type="checkbox"
                                            checked={!!r.isNew}
                                            onChange={(e) =>
                                              handleResourceChange(
                                                activeLineUnitId!,
                                                r.id,
                                                { isNew: e.target.checked },
                                              )
                                            }
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                          />
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono">
                                        <input
                                          type="number"
                                          className="bg-transparent border-none p-0 text-right w-full font-mono text-sm focus:ring-0"
                                          value={r.quantity}
                                          onChange={(e) =>
                                            handleResourceChange(
                                              activeLineUnitId!,
                                              r.id,
                                              {
                                                quantity:
                                                  parseFloat(e.target.value) ||
                                                  0,
                                              },
                                            )
                                          }
                                        />
                                      </td>
                                      <td className="py-3 px-4">
                                        <input
                                          className="bg-transparent border-none p-0 text-gray-500 w-full text-sm focus:ring-0"
                                          value={r.unit}
                                          list={`res-unit-${r.id}`}
                                          onChange={(e) =>
                                            handleResourceChange(
                                              activeLineUnitId!,
                                              r.id,
                                              { unit: e.target.value },
                                            )
                                          }
                                        />
                                        <datalist id={`res-unit-${r.id}`}>
                                          {getSuggestions("unit").items.map(
                                            (opt, i) => (
                                              <option key={i} value={opt} />
                                            ),
                                          )}
                                        </datalist>
                                      </td>
                                      <td className="py-3 px-4 text-right relative group/spm">
                                        <div className="flex flex-col items-end">
                                          <input
                                            type="number"
                                            className={`bg-transparent border-none p-0 text-right w-full font-mono text-sm focus:ring-0 ${isSpmOutOfRange ? "text-rose-600 font-bold" : "text-emerald-600"}`}
                                            value={r.spm}
                                            min={
                                              latest &&
                                              latest.minSpm !== -Infinity
                                                ? latest.minSpm
                                                : undefined
                                            }
                                            max={
                                              latest &&
                                              latest.maxSpm !== Infinity
                                                ? latest.maxSpm
                                                : undefined
                                            }
                                            onChange={(e) =>
                                              handleResourceChange(
                                                activeLineUnitId!,
                                                r.id,
                                                {
                                                  spm:
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                },
                                              )
                                            }
                                          />
                                          {latest &&
                                            latest.minSpm !== -Infinity && (
                                              <div
                                                className={`text-[9px] font-bold ${isSpmOutOfRange ? "text-rose-500" : "text-gray-400"}`}
                                              >
                                                規定: {latest.minSpm}~
                                                {latest.maxSpm}
                                              </div>
                                            )}
                                        </div>
                                        {isSpmOutOfRange && (
                                          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        {r.type === "設備" ? (
                                          <input
                                            type="number"
                                            className="bg-transparent border-none p-0 text-right w-full font-mono text-sm focus:ring-0 text-emerald-600"
                                            value={
                                              r.powerConsumption !== undefined
                                                ? r.powerConsumption
                                                : "-"
                                            }
                                            onChange={(e) =>
                                              handleResourceChange(
                                                activeLineUnitId!,
                                                r.id,
                                                {
                                                  powerConsumption:
                                                    parseFloat(
                                                      e.target.value,
                                                    ) || 0,
                                                },
                                              )
                                            }
                                          />
                                        ) : (
                                          <span className="text-gray-400 font-mono text-sm">
                                            -
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-right relative">
                                        <input
                                          type="number"
                                          className={`bg-transparent border-none p-0 text-right w-full font-mono text-sm focus:ring-0 ${hasRateDiff ? "text-amber-600" : "text-emerald-600"}`}
                                          value={r.hourlyRate}
                                          onChange={(e) =>
                                            handleResourceChange(
                                              activeLineUnitId!,
                                              r.id,
                                              {
                                                hourlyRate:
                                                  parseFloat(e.target.value) ||
                                                  0,
                                              },
                                            )
                                          }
                                          title={
                                            r.type === "設備"
                                              ? "保存時に定格電力×電力単価で再計算されます"
                                              : "1時間あたりの単価"
                                          }
                                        />
                                        {hasRateDiff && (
                                          <div
                                            className="absolute top-1 right-1 w-1 h-1 bg-amber-500 rounded-full tooltip"
                                            title="マスターデータと差異があります"
                                          />
                                        )}
                                      </td>
                                      <td className="py-3 px-4">
                                        <input
                                          className="bg-transparent border-none p-0 text-xs text-[var(--color-brand-secondary)] italic w-full focus:ring-0"
                                          value={r.remarks}
                                          onChange={(e) =>
                                            handleResourceChange(
                                              activeLineUnitId!,
                                              r.id,
                                              { remarks: e.target.value },
                                            )
                                          }
                                          placeholder="備考を入力..."
                                        />
                                      </td>
                                      <td className="py-3 pl-4 text-right pr-2">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() =>
                                              setEditingResource({
                                                luId: activeLineUnitId!,
                                                res: r,
                                              })
                                            }
                                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-all"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeleteResource(
                                                activeLineUnitId!,
                                                r.id,
                                              )
                                            }
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-all"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}

                              {/* --- 追加ボタン --- */}
                              <tr>
                                <td colSpan={9} className="py-2 px-4">
                                  <button
                                    onClick={() =>
                                      setIsResourceAddModalOpen(true)
                                    }
                                    className="w-full py-4 border border-dashed border-[var(--color-border-main)] rounded-xl text-blue-600 text-xs font-bold hover:bg-blue-600/5 transition-all flex items-center justify-center gap-2 group"
                                  >
                                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                    <span>リソース明細行を新しく追加</span>
                                  </button>
                                </td>
                              </tr>

                              {/* --- エネルギーセクション --- */}
                              {(activeLineUnit?.resources || []).filter(
                                (r: any) => r.type === "エネルギー",
                              ).length > 0 && (
                                <tr className="bg-amber-50/20 dark:bg-amber-900/5">
                                  <td
                                    colSpan={10}
                                    className="px-4 py-2 border-t border-[var(--color-border-main)]"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="h-[1px] flex-1 bg-amber-200/50 dark:bg-amber-800/30"></div>
                                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest px-2">
                                        エネルギー・付帯リソース (自動計算分)
                                      </span>
                                      <div className="h-[1px] flex-1 bg-amber-200/50 dark:bg-amber-800/30"></div>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {(activeLineUnit?.resources || [])
                                .filter((r: any) => r.type === "エネルギー")
                                .map((r: any) => {
                                  const equipmentResources = (
                                    activeLineUnit?.resources || []
                                  ).filter((er: any) => er.type === "設備");
                                  const totalEquipCount =
                                    equipmentResources.reduce(
                                      (sum: number, er: any) =>
                                        sum + (parseFloat(er.quantity) || 0),
                                      0,
                                    );
                                  const totalPowerKw =
                                    equipmentResources.reduce(
                                      (sum: number, er: any) =>
                                        sum +
                                        (parseFloat(er.powerConsumption) || 0) *
                                          (parseFloat(er.quantity) || 0),
                                      0,
                                    );
                                  const electricityCost =
                                    parseFloat(
                                      project.electricityCostPerKwh || "15",
                                    ) || 0;
                                  const calculatedHourlyCost =
                                    totalPowerKw * electricityCost;
                                  const formulaText = `設備全体: ${totalEquipCount}台 / 計: ${totalPowerKw.toFixed(1)}kW × ${electricityCost} = ${calculatedHourlyCost.toFixed(0)}`;

                                  return (
                                    <tr
                                      key={r.id}
                                      className="text-sm bg-amber-50/10 dark:bg-amber-900/5 transition-colors group"
                                    >
                                      <td className="py-3 pr-4 text-center">
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-100 text-amber-700 border-amber-200">
                                          {r.type}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 font-bold text-amber-900 dark:text-amber-100">
                                        <div className="flex items-center gap-2">
                                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                                          <span>{r.name}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-center"></td>
                                      <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400 font-bold">
                                        {totalEquipCount}
                                      </td>
                                      <td className="py-3 px-4 text-gray-400 text-xs">
                                        台
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-gray-400 text-xs">
                                        -
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                        {totalPowerKw.toLocaleString(
                                          undefined,
                                          { maximumFractionDigits: 1 },
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400 font-bold">
                                        {calculatedHourlyCost.toLocaleString(
                                          undefined,
                                          { maximumFractionDigits: 0 },
                                        )}
                                      </td>
                                      <td className="py-3 px-4 max-w-[200px] truncate">
                                        <div className="flex items-center gap-1.5 text-[10px] text-amber-600 italic">
                                          <ShieldCheck className="w-3 h-3 shrink-0" />
                                          <span
                                            className="truncate"
                                            title={formulaText}
                                          >
                                            {formulaText}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 pl-4 pr-2 text-right">
                                        <button
                                          onClick={() =>
                                            setEditingResource({
                                              luId: activeLineUnitId!,
                                              res: r,
                                            })
                                          }
                                          className="p-1.5 hover:bg-amber-100 dark:hover:bg-amber-800/30 text-amber-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </ContentEditCard>

                      {/* Unit Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <SummaryCard
                          label="代表産出SPM"
                          value={(() => {
                            const spms = (activeLineUnit?.resources || [])
                              .filter(
                                (r: any) =>
                                  (r.type === "設備" || r.type === "人員") &&
                                  parseFloat(r.spm) > 0,
                              )
                              .map((r: any) => parseFloat(r.spm) || 0);
                            return spms.length > 0
                              ? Math.min(...spms).toString()
                              : "-";
                          })()}
                          unit="spm"
                          icon={BarChart3}
                          color="blue"
                        />
                        <SummaryCard
                          label="実効産出SPM"
                          value={(() => {
                            const spms = (activeLineUnit?.resources || [])
                              .filter(
                                (r: any) =>
                                  (r.type === "設備" || r.type === "人員") &&
                                  parseFloat(r.spm) > 0,
                              )
                              .map((r: any) => parseFloat(r.spm) || 0);
                            const operatingRate =
                              parseFloat(
                                activeLineUnit?.operatingRate || "100",
                              ) / 100;
                            return spms.length > 0
                              ? Math.round(
                                  Math.min(...spms) * operatingRate,
                                ).toString()
                              : "-";
                          })()}
                          unit="spm"
                          icon={TrendingUp}
                          color="emerald"
                        />
                        <SummaryCard
                          label="月稼働時間"
                          value={activeLineUnit?.workingHours || "160"}
                          unit="h"
                          icon={Clock}
                          color="indigo"
                        />
                        <SummaryCard
                          label="月間能力"
                          value={(() => {
                            const spms = (activeLineUnit?.resources || [])
                              .filter(
                                (r: any) =>
                                  (r.type === "設備" || r.type === "人員") &&
                                  parseFloat(r.spm) > 0,
                              )
                              .map((r: any) => parseFloat(r.spm) || 0);
                            const operatingRate =
                              parseFloat(
                                activeLineUnit?.operatingRate || "100",
                              ) / 100;
                            const hours = parseFloat(
                              activeLineUnit?.workingHours || "160",
                            );
                            if (spms.length === 0) return "-";
                            const monthlyPcs =
                              Math.min(...spms) * 60 * hours * operatingRate;
                            return Math.round(monthlyPcs).toLocaleString();
                          })()}
                          unit="pcs"
                          icon={Database}
                          color="purple"
                        />
                        <SummaryCard
                          label="能力制約リソース"
                          value={(() => {
                            const resources = (
                              activeLineUnit?.resources || []
                            ).filter(
                              (r: any) =>
                                (r.type === "設備" || r.type === "人員") &&
                                parseFloat(r.spm) > 0,
                            );
                            if (resources.length === 0) return "-";
                            const minSpm = Math.min(
                              ...resources.map(
                                (r: any) => parseFloat(r.spm) || 0,
                              ),
                            );
                            const bottleneck = resources.find(
                              (r: any) => parseFloat(r.spm) === minSpm,
                            );
                            return bottleneck?.type || "-";
                          })()}
                          unit=""
                          icon={Filter}
                          color="amber"
                        />
                        <SummaryCard
                          label="稼働率"
                          value={activeLineUnit?.operatingRate || "100"}
                          unit="%"
                          icon={TrendingUp}
                          color="rose"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[var(--color-border-main)] rounded-3xl opacity-50">
                      <Database className="w-12 h-12 mb-4 text-[var(--color-brand-secondary)]" />
                      <p className="font-bold">
                        ラインユニットを選択してください
                      </p>
                    </div>
                  )}

                  <ContentEditCard title="ラインバランス分析" icon={BarChart3}>
                    <div className="flex flex-col gap-2 mb-6">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        各ラインユニットの処理能力を比較し、最も能力の低いブロックをボトルネックとしてライン全体能力を確認します。
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <PlaceholderResult label="ラインユニット別 代表産出SPM" />
                      <PlaceholderResult label="ラインユニット別 実効産出SPM" />
                      <PlaceholderResult label="ラインユニット別 月間能力" />
                      <PlaceholderResult label="ボトルネックラインユニット" />
                      <PlaceholderResult label="ライン全体能力" />
                      <PlaceholderResult label="各ユニットの余力" />
                      <PlaceholderResult label="各ユニットの負荷率" />
                    </div>
                  </ContentEditCard>
                </motion.div>
              ) : activeTab === "導入効果" ? (
                <motion.div
                  key="intro-effects"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-12"
                >
                  <ContentEditCard
                    title={`${currentScenario?.name} - 導入効果`}
                    icon={TrendingUp}
                  >
                    <LongTextField
                      label="生産性比較（導入前 vs 導入後）"
                      value={currentScenario?.effects || ""}
                      onChange={(v) =>
                        handleScenarioFieldChange(
                          activeScenarioId,
                          "effects",
                          v,
                        )
                      }
                      placeholder="導入前後のサイクルタイム、人件費、不良率などの比較を入力してください。"
                    />
                  </ContentEditCard>
                </motion.div>
              ) : activeTab === "投資回収" ? (
                <motion.div
                  key="recovery-calc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-12"
                >
                  <ContentEditCard
                    title={`${currentScenario?.name} - 投資回収シミュレーション`}
                    icon={Clock}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <p className="text-xs text-slate-500 mb-1">投資額 (初期投資)</p>
                        <p className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                           {(currentScenario?.investmentAmount / 10000 || 0).toLocaleString(undefined, {maximumFractionDigits:0})} <span className="text-sm font-normal">万円</span>
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                        <p className="text-xs text-blue-600 mb-1">年間効果額</p>
                        <p className="font-mono text-xl font-bold text-blue-700 dark:text-blue-400">
                           {(currentScenario?.annualEffect || 0).toLocaleString(undefined, {maximumFractionDigits:0})} <span className="text-sm font-normal">万円/年</span>
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
                        <p className="text-xs text-purple-600 mb-1">投資回収期間</p>
                        <p className="font-mono text-2xl font-black text-purple-700 dark:text-purple-400">
                           {(currentScenario?.recoveryYears || 0).toLocaleString(undefined, {maximumFractionDigits:1})} <span className="text-sm font-normal">年</span>
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                        <p className="text-xs text-emerald-600 mb-1">ROI (投資利益率)</p>
                        <p className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-400">
                           {(currentScenario?.roi || 0).toLocaleString(undefined, {maximumFractionDigits:1})} <span className="text-sm font-normal">%</span>
                        </p>
                        <p className="text-[10px] text-emerald-500/70 mt-1">※ {project.calcPeriod || "10年"}間累計の単純収益率</p>
                      </div>
                      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
                        <p className="text-xs text-indigo-600 mb-1">NPV (正味現在価値)</p>
                        <p className="font-mono text-xl font-bold text-indigo-700 dark:text-indigo-400">
                           {(currentScenario?.npv || 0).toLocaleString(undefined, {maximumFractionDigits:0})} <span className="text-sm font-normal">万円</span>
                        </p>
                        <p className="text-[10px] text-indigo-500/70 mt-1">※ 割引率 {project.discountRate || "5.0"}% 考慮</p>
                      </div>
                      <div className="p-4 bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-xl border border-fuchsia-200 dark:border-fuchsia-800 shadow-sm">
                        <p className="text-xs text-fuchsia-600 mb-1">IRR (内部収益率)</p>
                        <p className="font-mono text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400">
                           {(currentScenario?.irr || 0).toLocaleString(undefined, {maximumFractionDigits:1})} <span className="text-sm font-normal">%</span>
                        </p>
                        <p className="text-[10px] text-fuchsia-500/70 mt-1">※ NPVがゼロになる割引率</p>
                      </div>
                    </div>

                    <LongTextField
                      label="回収シミュレーション特記事項"
                      value={currentScenario?.recovery || ""}
                      onChange={(v) =>
                        handleScenarioFieldChange(
                          activeScenarioId,
                          "recovery",
                          v,
                        )
                      }
                      placeholder="キャッシュフロー推移や投資回収期間の算出に関する補足などを入力してください。"
                    />
                  </ContentEditCard>
                </motion.div>
              ) : activeTab === "損益分岐点" ? (
                <motion.div
                  key="be-point"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-12"
                >
                  <ContentEditCard
                    title={`${currentScenario?.name} - 損益分岐点分析`}
                    icon={BarChart3}
                  >
                    {(() => {
                      // 1. Calculate sales price, material cost per PCS
                      let totalVol = 0;
                      let totalSalesAmt = 0;
                      let totalMatAmt = 0;
                      (project.targetProducts || []).forEach((p: any) => {
                        let v = p.volume || 0;
                        if (p.volumeType === "年間") v = v / 12;
                        
                        let price = p.sellingPrice || 0;
                        if (p.sellingPriceType === "年間売上") price = price / 12 / (v || 1);
                        else if (p.sellingPriceType === "月間売上") price = price / (v || 1);
                        
                        let mCost = p.materialCost || 0;
                        let matUnitPrice = p.materialCostType === "材料比率" ? price * (mCost / 100) : mCost;
                        
                        let sInProj = convertAmount(price, p.currency || project.currency || "JPY", project.currency || "JPY");
                        let mInProj = convertAmount(matUnitPrice, p.currency || project.currency || "JPY", project.currency || "JPY");
                        
                        totalVol += v;
                        totalSalesAmt += v * sInProj;
                        totalMatAmt += v * mInProj;
                      });
                      const avgSalesPrice = totalVol > 0 ? totalSalesAmt / totalVol : 0;
                      const avgMaterialCost = totalVol > 0 ? totalMatAmt / totalVol : 0;

                      // 2. Capacity & Variable/Fixed Costs
                      let minSpm = Infinity;
                      (currentScenario?.lineUnits || []).forEach((lu: any) => {
                        (lu.resources || []).forEach((r: any) => {
                          let spm = parseFloat(r.spm) || 0;
                          if (spm > 0 && spm < minSpm) minSpm = spm;
                        });
                      });
                      if (minSpm === Infinity) minSpm = 0;

                      let monthlyDepreciation = 0;
                      let pcsLabor = 0;
                      let totalPowerKw = 0;
                      
                      (currentScenario?.lineUnits || []).forEach((lu: any) => {
                        const eqResources = (lu.resources || []).filter((r: any) => r.type === "設備");
                        (lu.resources || []).forEach((r: any) => {
                          if (r.type === "人員") {
                            const hr = parseFloat(r.hourlyRate) || 0;
                            const qty = parseFloat(r.quantity) || 0;
                            const costPerHour = hr * qty;
                            const rSpm = parseFloat(r.spm) || 0;
                            const effectiveSpm = rSpm > 0 ? rSpm : minSpm;
                            if (effectiveSpm > 0) {
                              pcsLabor += costPerHour / (effectiveSpm * 60);
                            }
                          }
                        });
                        totalPowerKw += eqResources.reduce((sum: number, r: any) => sum + (parseFloat(r.powerConsumption)||0) * (parseFloat(r.quantity)||0), 0);
                        
                        eqResources.forEach((r: any) => {
                          const master = masterEquipment.find((m) => m.id === r.equipmentId || m.name === r.name);
                          if (master && master.investmentAmount) {
                            const method = master.depreciationMethod || "定額";
                            const life = master.usefulLife || 10;
                            const residual = (master.residualValueRatio !== undefined ? master.residualValueRatio : 5) / 100;
                            let yDep = 0;
                            if (method === "定額") {
                              yDep = (master.investmentAmount * (1 - residual)) / life;
                            } else {
                              const dbRate = 1 - Math.pow(residual, 1 / life);
                              yDep = master.investmentAmount * dbRate;
                            }
                            monthlyDepreciation += (yDep / 12) * (parseFloat(r.quantity)||1);
                          }
                        });
                      });
                      
                      if (minSpm === Infinity) minSpm = 0;
                      const hours = parseFloat(project.workingHoursPerDay || "8");
                      const days = parseFloat(project.workingDaysPerMonth || "20");
                      const maxMonthlyVolume = minSpm * 60 * hours * days;
                      
                      const elecKwhCost = parseFloat(project.electricityCostPerKwh || "15");
                      const elecCurrency = project.electricityCurrency || project.currency || "JPY";
                      const convertedElecKwhCost = convertAmount(elecKwhCost, elecCurrency, project.currency || "JPY");
                      const hourlyElecCost = totalPowerKw * convertedElecKwhCost;
                      
                      const pcsElec = minSpm > 0 ? hourlyElecCost / (minSpm * 60) : 0;
                      const pcsTotalVar = avgMaterialCost + pcsLabor + pcsElec;

                      const cmPerUnit = avgSalesPrice - pcsTotalVar;
                      const bepVolume = cmPerUnit > 0 ? monthlyDepreciation / cmPerUnit : 0;
                      const bepSales = bepVolume * avgSalesPrice;

                      // Chart Data
                      const chartData = [];
                      const step = maxMonthlyVolume > 0 ? maxMonthlyVolume / 10 : 100;
                      const volumes = [];
                      for (let i = 0; i <= 10; i++) volumes.push(i * step);
                      if (bepVolume > 0 && bepVolume <= maxMonthlyVolume) volumes.push(bepVolume);
                      volumes.sort((a,b) => a-b);
                      const uniqueVolumes = Array.from(new Set(volumes.map(v => Math.round(v))));

                      uniqueVolumes.forEach(vol => {
                        chartData.push({
                          volume: vol,
                          sales: vol * avgSalesPrice,
                          fixedCost: monthlyDepreciation,
                          variableCost: vol * pcsTotalVar,
                          totalCost: monthlyDepreciation + (vol * pcsTotalVar),
                        });
                      });

                      const ccy = project.currency || "JPY";

                      return (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                             <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                               <p className="text-xs text-slate-500 mb-1">代表販売価格</p>
                               <p className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                                  {avgSalesPrice.toLocaleString(undefined, {maximumFractionDigits:1})} <span className="text-sm font-normal">{ccy}/pcs</span>
                               </p>
                               <p className="text-[10px] text-slate-400 mt-1 truncate">※ 対象製品群の売上・数量比重より自動算出</p>
                             </div>
                             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                               <p className="text-xs text-blue-600 mb-1">月間固定費</p>
                               <p className="font-mono text-lg font-bold text-blue-700 dark:text-blue-400">
                                  {monthlyDepreciation.toLocaleString(undefined, {maximumFractionDigits:0})} <span className="text-sm font-normal">{ccy}</span>
                               </p>
                               <p className="text-[10px] text-blue-500/70 mt-1 line-clamp-2">※ 計算式: Σ(各設備投資額 × 対象償却率) / 12ヶ月<br />(現在の合計額: {monthlyDepreciation.toLocaleString(undefined, {maximumFractionDigits:0})} {ccy})</p>
                             </div>
                             <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                               <p className="text-xs text-orange-600 mb-1">変動単価 (1pcsあたり)</p>
                               <p className="font-mono text-lg font-bold text-orange-700 dark:text-orange-400">
                                  {pcsTotalVar.toLocaleString(undefined, {maximumFractionDigits:2})} <span className="text-sm font-normal">{ccy}</span>
                               </p>
                               <p className="text-[10px] text-orange-500/70 mt-1 line-clamp-2">
                                  ※ 計算式: 材料費 + 労務費 + 電力費<br />
                                  (材料:{avgMaterialCost.toFixed(1)} ＋ 労務:{pcsLabor.toFixed(1)} ＋ 電力:{pcsElec.toFixed(1)})
                               </p>
                             </div>
                             <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
                               <p className="text-xs text-emerald-600 font-bold mb-1">損益分岐点</p>
                               <p className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-400">
                                  売上: {bepSales.toLocaleString(undefined, {maximumFractionDigits:0})} <span className="text-sm font-normal">{ccy}</span>
                               </p>
                               <p className="text-xs font-bold text-emerald-600/80 mt-1">
                                  (生産数: {Math.round(bepVolume).toLocaleString()} pcs)
                               </p>
                             </div>
                          </div>

                          <div className="h-[450px] w-full mt-4 bg-white dark:bg-gray-800 p-6 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                <XAxis 
                                  type="number"
                                  domain={[0, Math.round(maxMonthlyVolume)]}
                                  dataKey="volume" 
                                  tickFormatter={(v) => v.toLocaleString()}
                                  label={{ value: '生産量 (pcs/月) (0 ~ 理論上月間最大数)', position: 'insideBottom', offset: -15, fontSize: 12, fill: "#64748b" }} 
                                  tick={{ fontSize: 12, fill: "#64748b" }}
                                />
                                <YAxis 
                                  tickFormatter={(v) => (v / 10000).toLocaleString() + '万'} 
                                  label={{ value: `金額 (${ccy})`, angle: -90, position: 'insideLeft', offset: 10, fontSize: 12, fill: "#64748b" }}
                                  tick={{ fontSize: 12, fill: "#64748b" }}
                                />
                                <RechartsTooltip 
                                  formatter={(value: number, name: string) => [value.toLocaleString(undefined, {maximumFractionDigits:0}) + ' ' + ccy, name]}
                                  labelFormatter={(label) => '生産量: ' + label.toLocaleString() + ' pcs'}
                                  contentStyle={{
                                    borderRadius: "0.5rem",
                                    border: "1px solid #e2e8f0",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    fontSize: "13px"
                                  }}
                                />
                                <Legend verticalAlign="top" height={40} />
                                <Area type="monotone" dataKey="fixedCost" name="固定費" stackId="1" stroke="#3b82f6" fill="#bfdbfe" />
                                <Area type="monotone" dataKey="variableCost" name="変動費" stackId="1" stroke="#f59e0b" fill="#fde68a" />
                                <Line type="monotone" dataKey="sales" name="売上高" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                                
                                {bepVolume > 0 && bepVolume <= maxMonthlyVolume && (
                                  <>
                                    <ReferenceDot x={Math.round(bepVolume)} y={bepSales} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                                    <ReferenceLine x={Math.round(bepVolume)} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '損益分岐点', fill: '#ef4444', fontSize: 13, fontWeight: "bold" }} />
                                  </>
                                )}
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                      
                        </div>
                      );
                    })()}
                  </ContentEditCard>
                </motion.div>
              ) : activeTab === "労務費差異" ? (
                <motion.div
                  key="labor-diff"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-12"
                >
                  <ContentEditCard
                    title={`${currentScenario?.name} - 労務費差異`}
                    icon={LayoutDashboard}
                  >
                    {(() => {
                      const currentStatus = project.scenarios?.find(
                        (s: any) => s.id === "current",
                      );
                      const currentLineUnits = currentStatus?.lineUnits || [];
                      const proposalLineUnits =
                        currentScenario?.lineUnits || [];

                      // Check if SPM is calculated/entered for any resource
                      const hasCurrentProd = currentLineUnits.some((lu: any) =>
                        (lu.resources || []).some(
                          (r: any) => parseFloat(r.spm) > 0,
                        ),
                      );
                      const hasProposalProd = proposalLineUnits.some(
                        (lu: any) =>
                          (lu.resources || []).some(
                            (r: any) => parseFloat(r.spm) > 0,
                          ),
                      );

                      const isAvailable = hasCurrentProd && hasProposalProd;

                      const getLaborTotal = (scenario: any) => {
                        let minSpm = Infinity;
                        (scenario?.lineUnits || []).forEach((lu: any) => {
                           (lu.resources || []).forEach((r: any) => {
                              let spm = parseFloat(r.spm) || 0;
                              if (spm > 0 && spm < minSpm) minSpm = spm;
                           });
                        });
                        if (minSpm === Infinity) minSpm = 0;

                        let totalHourly = 0;
                        let totalPeople = 0;
                        let pcsLabor = 0;
                        (scenario?.lineUnits || []).forEach((lu: any) => {
                          (lu.resources || []).forEach((r: any) => {
                            if (r.type === "人員") {
                               const hr = parseFloat(r.hourlyRate) || 0;
                               const qty = parseFloat(r.quantity) || 0;
                               const costPerHour = hr * qty;
                               totalHourly += costPerHour;
                               totalPeople += qty;

                               const rSpm = parseFloat(r.spm) || 0;
                               const effectiveSpm = rSpm > 0 ? rSpm : minSpm;
                               if (effectiveSpm > 0) {
                                  pcsLabor += costPerHour / (effectiveSpm * 60);
                               }
                            }
                          });
                        });
                        
                        return { totalHourly, totalPeople, minSpm, pcsLabor };
                      };
                      
                      const curr = getLaborTotal(currentStatus);
                      const target = getLaborTotal(currentScenario);
                      
                      const ccy = project.currency || "JPY";
                      
                      const hours = parseFloat(project.workingHoursPerDay || "8");
                      const days = parseFloat(project.workingDaysPerMonth || "20");
                      const monthHours = hours * days;
                      
                      const currMonthlyPcs = curr.minSpm * 60 * monthHours;
                      const targetMonthlyPcs = target.minSpm * 60 * monthHours;
                      
                      const currMonthlyCost = curr.pcsLabor * currMonthlyPcs;
                      const targetMonthlyCost = target.pcsLabor * targetMonthlyPcs;
                      const diffMonthlyCost = targetMonthlyCost - currMonthlyCost;
                      
                      const currPcsCost = curr.pcsLabor;
                      const targetPcsCost = target.pcsLabor;
                      const diffPcsCost = targetPcsCost - currPcsCost;

                      return (
                        <div className="space-y-4">
                          {!isAvailable && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-200 text-xs flex items-center gap-3">
                              <Info className="w-4 h-4 flex-shrink-0" />
                              <p>
                                労務費差異は、「現状」の生産情報と「対策案」の生産情報の両方が入力されると記入可能になります。
                              </p>
                            </div>
                          )}
                          
                          {isAvailable && activeScenarioId !== "current" && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="border border-slate-200 rounded overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                                 <div className="bg-slate-200 dark:bg-slate-700 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">現状 (Current)</div>
                                 <div className="p-3">
                                   <p className="text-[10px] text-slate-500 mb-1">作業人員 / 月間労務費</p>
                                   <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{curr.totalPeople} 人 / {currMonthlyCost.toLocaleString(undefined, {maximumFractionDigits:0})} {ccy}</p>
                                   <div className="mt-2 text-[10px] text-slate-500">1pcsあたり換算</div>
                                   <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{currPcsCost.toLocaleString(undefined, {maximumFractionDigits:2})} {ccy}/pcs</p>
                                 </div>
                              </div>
                              <div className="border border-blue-200 dark:border-blue-800 rounded overflow-hidden shadow-sm bg-blue-50/50 dark:bg-blue-900/20">
                                 <div className="bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-xs font-bold text-blue-800 dark:text-blue-300">対策案 ({currentScenario?.name})</div>
                                 <div className="p-3">
                                   <p className="text-[10px] text-blue-500 mb-1">作業人員 / 月間労務費</p>
                                   <p className="font-mono text-sm font-bold text-blue-800 dark:text-blue-300">{target.totalPeople} 人 / {targetMonthlyCost.toLocaleString(undefined, {maximumFractionDigits:0})} {ccy}</p>
                                   <div className="mt-2 text-[10px] text-blue-500">1pcsあたり換算</div>
                                   <p className="font-mono text-sm text-blue-700 dark:text-blue-400">{targetPcsCost.toLocaleString(undefined, {maximumFractionDigits:2})} {ccy}/pcs</p>
                                 </div>
                              </div>
                              <div className="border border-rose-200 dark:border-rose-800 rounded overflow-hidden shadow-sm bg-rose-50/50 dark:bg-rose-900/20">
                                 <div className="bg-rose-100 dark:bg-rose-900/40 px-3 py-1 text-xs font-bold text-rose-800 dark:text-rose-300">差異 (Current比)</div>
                                 <div className="p-3">
                                   <p className="text-[10px] text-rose-500 mb-1">人員増減 / 月間労務費増減</p>
                                   <p className="font-mono text-sm font-bold text-rose-800 dark:text-rose-300">{(target.totalPeople - curr.totalPeople) > 0 ? "+" : ""}{target.totalPeople - curr.totalPeople} 人 / {diffMonthlyCost > 0 ? "+" : ""}{diffMonthlyCost.toLocaleString(undefined, {maximumFractionDigits:0})} {ccy}</p>
                                   <div className="mt-2 text-[10px] text-rose-500">1pcsあたり原価増減</div>
                                   <p className="font-mono text-sm font-bold text-rose-700 dark:text-rose-400">{diffPcsCost > 0 ? "+" : ""}{diffPcsCost.toLocaleString(undefined, {maximumFractionDigits:2})} {ccy}/pcs</p>
                                 </div>
                              </div>
                            </div>
                          )}
                          
                          {activeScenarioId === "current" ? (
                            <div className="p-8 text-center border-2 border-dashed border-[var(--color-border-main)] rounded-2xl opacity-50">
                              <p className="text-sm font-bold">
                                現状比較は各「案」のタブから行ってください
                              </p>
                            </div>
                          ) : (
                            <LongTextField
                              label="労務費の増減分析"
                              value={currentScenario?.laborCostDiff || ""}
                              onChange={(v) =>
                                handleScenarioFieldChange(
                                  activeScenarioId,
                                  "laborCostDiff",
                                  v,
                                )
                              }
                              placeholder="人員削減、残業削減、賃率変更などの詳細を入力してください。"
                              readOnly={!isAvailable}
                            />
                          )}
                        </div>
                      );
                    })()}
                  </ContentEditCard>
                </motion.div>
              ) : activeTab === "総合結論" ? (
                <motion.div
                  key="report-summary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-12"
                >
                  <ContentEditCard title="レポート総合結論" icon={FileText}>
                    <LongTextField
                      label="比較検討の結論・最終判断"
                      value={project.reportConclusion}
                      onChange={(v) => handleFieldChange("reportConclusion", v)}
                      placeholder="A案、B案、C案を比較した結果、どの案を採択し、どのような効果を最も期待しているか要約してください。"
                    />
                    <LongTextField
                      label="特記事項・懸念点"
                      value={project.reportComparisonResult}
                      onChange={(v) =>
                        handleFieldChange("reportComparisonResult", v)
                      }
                      placeholder="投資にあたっての条件や、導入後の運用上の注意点などがあれば記入してください。"
                    />
                  </ContentEditCard>

                  <ContentEditCard title="各案の定量比較" icon={BarChart3}>
                    <div className="flex flex-col gap-8 mb-8">
                      <div className="w-full">
                        <p className="text-sm font-bold text-center mb-4 text-gray-700 dark:text-gray-300">
                          キャッシュフローと投資回収
                        </p>
                        <div className="h-80 w-full overflow-x-auto scrollbar-thin">
                          <div
                            style={{
                              minWidth: `max(100%, ${(() => {
                                const active = (project.scenarios || []).filter((s: any) => s.id !== "current");
                                const totalYears = active.reduce((sum: number, s: any) => sum + Math.max(1, Math.ceil(s.recoveryYears || (project.calcPeriod ? parseFloat(project.calcPeriod) : 10))), 0) + (active.length > 0 ? active.length - 1 : 0);
                                return totalYears * 80;
                              })()}px)`,
                              height: "100%",
                            }}
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart
                                data={(() => {
                                  const data: any[] = [];
                                  const activeScenarios = (project.scenarios || []).filter(
                                    (s: any) => s.id !== "current"
                                  );
                                  activeScenarios.forEach((s: any, idx: number) => {
                                    const years =
                                      s.recoveryYears && s.recoveryYears > 0
                                        ? Math.ceil(s.recoveryYears) + 1 // Add 1 more year to show recovery point crossing 0 clearly
                                        : project.calcPeriod
                                          ? parseInt(project.calcPeriod)
                                          : 10;
                                    let cumulative = 0;
                                    for (let i = 1; i <= Math.max(years, 1); i++) {
                                      const cost =
                                        i === 1
                                          ? -(
                                              convertAmount(
                                                s.investmentAmount || 0,
                                                project.currency,
                                                project.reportCurrency || "JPY"
                                              ) / (project.unitMultiplier || 10000)
                                            )
                                          : 0;
                                      const effect =
                                        convertAmount(
                                          (s.annualEffect || 0) * (project.unitMultiplier || 10000),
                                          project.currency,
                                          project.reportCurrency || "JPY"
                                        ) / (project.unitMultiplier || 10000);
                                      cumulative += cost + effect;
                                      data.push({
                                        name: `${s.name} ${i}年目`,
                                        費用: cost,
                                        効果: effect,
                                        累積額: cumulative,
                                      });
                                    }
                                    if (idx < activeScenarios.length - 1) {
                                      data.push({
                                        name: `_space_${idx}`,
                                        費用: 0,
                                        効果: 0,
                                        累積額: null,
                                      });
                                    }
                                  });
                                  return data;
                                })()}
                                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-main)" opacity={0.5} />
                                <XAxis
                                  dataKey="name"
                                  axisLine={false}
                                  tickLine={false}
                                  tick={{ fontSize: 11, fill: "var(--color-brand-secondary)" }}
                                  interval={0}
                                  tickFormatter={(val: string) => (val && val.startsWith("_space_") ? "" : val)}
                                  angle={-30}
                                  textAnchor="end"
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                <RechartsTooltip
                                  cursor={{ fill: "var(--color-border-main)", opacity: 0.1 }}
                                  contentStyle={{
                                    borderRadius: "0.5rem",
                                    border: "none",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                  }}
                                  labelFormatter={(label: any) => (label && label.startsWith("_space_") ? "" : label)}
                                  formatter={(value: any, name: any) => (value === null || typeof name === "string" && name.startsWith("_space_")) ? [null, null] : [value, name]}
                                />
                                <ReferenceLine y={0} stroke="var(--color-border-main)" strokeWidth={2} />
                                <Legend wrapperStyle={{ fontSize: "12px", bottom: -10 }} />
                                <Bar dataKey="費用" fill="#ef4444" radius={[0, 0, 4, 4]} name={`費用 (${project.unitDisplay || "万円"})`} stackId="a" />
                                <Bar dataKey="効果" fill="#10b981" radius={[4, 4, 0, 0]} name={`効果 (${project.unitDisplay || "万円"})`} stackId="a" />
                                <Line type="monotone" dataKey="累積額" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name={`累積回収額 (${project.unitDisplay || "万円"})`} connectNulls={false} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[var(--color-border-main)]">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">比較項目</th>
                            {(project.scenarios || []).map((s: any) => (
                              <th
                                key={s.id}
                                className={`px-6 py-4 ${s.id === "current" ? "text-gray-400" : ""}`}
                              >
                                {s.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border-main)]/50">
                          <tr>
                            <td className="px-6 py-4 font-semibold text-[var(--color-brand-secondary)] whitespace-nowrap">
                              投資総額
                            </td>
                            {(project.scenarios || []).map((s: any) => (
                              <td
                                key={s.id}
                                className="px-6 py-4 font-mono font-bold"
                              >
                                {s.investmentAmount
                                  ? convertAmount(
                                      s.investmentAmount,
                                      project.currency,
                                      project.reportCurrency || "JPY",
                                    ).toLocaleString(undefined, {
                                      maximumFractionDigits: 0,
                                    })
                                  : "-"}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="px-6 py-4 font-semibold text-[var(--color-brand-secondary)] whitespace-nowrap">
                              投資回収（年）
                            </td>
                            {(project.scenarios || []).map((s: any) => (
                              <td
                                key={s.id}
                                className="px-6 py-4 font-mono font-bold"
                              >
                                {s.recoveryYears || "-"}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="px-6 py-4 font-semibold text-[var(--color-brand-secondary)] whitespace-nowrap align-top">
                              損益分岐点・回収詳細
                            </td>
                            {(project.scenarios || []).map((s: any) => (
                              <td
                                key={s.id}
                                className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap min-w-[200px]"
                              >
                                {s.breakEven || s.recovery || "-"}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="px-6 py-4 font-semibold text-[var(--color-brand-secondary)] whitespace-nowrap align-top">
                              労務費差異
                            </td>
                            {(project.scenarios || []).map((s: any) => (
                              <td
                                key={s.id}
                                className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap min-w-[200px]"
                              >
                                {s.laborCostDiff || "-"}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </ContentEditCard>
                </motion.div>
              ) : activeTab === "出力項目設定" ? (
                <motion.div
                  key="report-output"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 pb-12"
                >
                  <ContentEditCard title="レポート設定" icon={Settings}>
                    <EditField
                      label="レポート表示通貨"
                      value={
                        project.reportCurrency || globalSettings.defaultCurrency
                      }
                      onChange={(v) => handleFieldChange("reportCurrency", v)}
                      suggestions={CURRENCIES.map((c) => c.code)}
                      forceSelect
                    />
                  </ContentEditCard>
                  <ContentEditCard
                    title="レポート出力項目の選択"
                    icon={Database}
                  >
                    <TreeChecklist
                      nodes={evaluatedReportTree}
                      selected={project.reportOutputItems || []}
                      onChange={(v) =>
                        handleFieldChange("reportOutputItems", v)
                      }
                    />
                  </ContentEditCard>
                </motion.div>
              ) : activeTab === "プレビュー" ? (
                <motion.div
                  key="report-preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pb-12"
                >
                  <div className="flex justify-end mb-4 print:hidden">
                    <button
                      onClick={() => window.print()}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      レポートをPDFで出力（印刷）
                    </button>
                  </div>

                  <div className="bg-gray-100 rounded-2xl p-4 md:p-8 overflow-x-auto print:p-0 print:bg-white print:overflow-visible">
                    <div className="min-w-[800px] print:min-w-0">
                      <ReportPreview
                        project={project}
                        globalSettings={globalSettings}
                        selectedOutputs={project.reportOutputItems || []}
                        convertAmount={convertAmount}
                        masterEquipment={masterEquipment}
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-[var(--color-border-main)]/50 w-full flex items-center justify-center text-left print:hidden">
                    {globalSettings.exchangeRateSource &&
                    globalSettings.exchangeRateDate ? (
                      <div className="text-xs text-[var(--color-brand-secondary)] bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20 w-full max-w-2xl text-center">
                        <span className="font-bold block mb-1">
                          【出力レポートの為替レートに関する注記】
                        </span>
                        出力されるレポート内の換算金額は、「
                        {globalSettings.exchangeRateSource}」の「
                        {globalSettings.exchangeRateDate}
                        」時点の為替レートに基づいて計算されます。
                      </div>
                    ) : (
                      <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-200 dark:border-orange-900/20 w-full max-w-2xl text-center">
                        設定画面から為替レートの参照日時と参照元を設定してください。レポートに出力されます。
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="fallback"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl p-12 min-h-[400px] flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--color-border-main)]/10 flex items-center justify-center mb-4">
                    <Info className="w-8 h-8 text-[var(--color-brand-secondary)]" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{activeTab}画面</h3>
                  <p className="text-[var(--color-brand-secondary)] max-w-sm">
                    設計に基づいた入力フォーム・シミュレータ・プレビューが表示されます。
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {editingResource && (
            <ResourceEditModal
              resource={editingResource.res}
              onClose={() => setEditingResource(null)}
              schemas={masterSchemas}
              onSave={(updates) => {
                handleResourceChange(
                  editingResource.luId,
                  editingResource.res.id,
                  updates,
                );
                setEditingResource(null);
              }}
            />
          )}
          {isResourceAddModalOpen && (
            <ResourceAddModal
              masterEquipment={masterEquipment}
              onClose={() => setIsResourceAddModalOpen(false)}
              onSelect={(eq) => {
                handleAddResource(activeLineUnitId!, eq);
                setIsResourceAddModalOpen(false);
              }}
              onManualAdd={() => {
                handleAddResource(activeLineUnitId!);
                setIsResourceAddModalOpen(false);
              }}
            />
          )}
          {syncModal && (
            <DbSyncModal
              onClose={() => setSyncModal(null)}
              onApplyLocal={() => handleApplySync("local")}
              onApplyUnit={() => handleApplySync("unit")}
              onApplyProject={() => handleApplySync("project")}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ReportPreview({
  project,
  globalSettings,
  selectedOutputs,
  convertAmount,
  masterEquipment,
}: {
  project: any;
  globalSettings: any;
  selectedOutputs: string[];
  convertAmount: (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ) => number;
  masterEquipment: MasterEquipment[];
}) {
  const isSelected = (id: string) => selectedOutputs.includes(id);

  let commonMonthlyVolume = 0;
  (project.targetProducts || []).forEach((p: any) => {
    let v = p.volume || 0;
    if (p.volumeType === "年間") v = v / 12;
    commonMonthlyVolume += v;
  });
  
  const dailyHours = parseFloat(project.workingHoursPerDay || "8");
  const monthlyDays = parseFloat(project.workingDaysPerMonth || "20");
  const defaultMonthHours = dailyHours * monthlyDays;

  const getLaborStats = (scenario: any) => {
      let minSpm = Infinity;
      (scenario?.lineUnits || []).forEach((lu: any) => {
        (lu.resources || []).forEach((r: any) => {
          let spm = parseFloat(r.spm) || 0;
          if (spm > 0 && spm < minSpm) minSpm = spm;
        });
      });
      if (minSpm === Infinity) minSpm = 0;

      let totalHourly = 0;
      let totalPeople = 0;
      (scenario?.lineUnits || []).forEach((lu: any) => {
        (lu.resources || []).forEach((r: any) => {
          if (r.type === "人員") {
            const hr = parseFloat(r.hourlyRate) || 0;
            const qty = parseFloat(r.quantity) || 0;
            const costPerHour = hr * qty;
            totalHourly += costPerHour;
            totalPeople += qty;
          }
        });
      });

      const speedPcsPerHour = minSpm * 60;
      let usedVolume = commonMonthlyVolume > 0 ? commonMonthlyVolume : (speedPcsPerHour * defaultMonthHours);
      if (usedVolume === 0) usedVolume = 10000;
      
      const timeNeeded = speedPcsPerHour > 0 ? usedVolume / speedPcsPerHour : 0;
      const daysNeeded = dailyHours > 0 ? timeNeeded / dailyHours : 0;
      const avgWage = totalPeople > 0 ? totalHourly / totalPeople : 0;
      const manHours = timeNeeded * totalPeople;
      
      return {
        speedPcsPerHour,
        totalHourly,
        totalPeople,
        avgWage,
        timeNeeded,
        daysNeeded,
        manHours,
        usedVolume
      };
  };

  const currStatsForReport = project.scenarios?.find((x: any) => x.id === "current") ? getLaborStats(project.scenarios?.find((x: any) => x.id === "current")) : null;

  return (
    <div
      className="bg-white text-black p-10 mt-8 w-full shadow-2xl rounded"
      style={{ minHeight: "1056px", width: "210mm", margin: "0 auto" }}
    >
      <h1 className="text-3xl font-black mb-10 text-center border-b-[3px] border-black pb-4 uppercase tracking-widest">
        {project.title || "（無題のプロジェクト）"}
      </h1>

      {/* 1. 管理情報 & スケジュール (Side by Side) */}
      <div className="flex gap-8 mb-10">
        {(isSelected("management.subject") ||
          isSelected("management.project_no") ||
          isSelected("management.author") ||
          isSelected("management.department") ||
          isSelected("management.created_date")) && (
          <div className="flex-1">
            <h2 className="text-lg text-white font-bold mb-3 bg-slate-800 px-4 py-2 border-l-4 border-blue-500">
              ■ 管理情報
            </h2>
            <table className="w-full text-sm border-collapse border border-slate-300">
              <tbody>
                {isSelected("management.subject") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/3 text-left">
                      件名
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.title}
                    </td>
                  </tr>
                )}
                {isSelected("management.project_no") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/3 text-left">
                      プロジェクト番号
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.projectNo}
                    </td>
                  </tr>
                )}
                {isSelected("management.author") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/3 text-left">
                      作成・申請者
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.applicant}
                    </td>
                  </tr>
                )}
                {isSelected("management.department") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/3 text-left">
                      申請部署
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.department}
                    </td>
                  </tr>
                )}
                {isSelected("management.created_date") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/3 text-left">
                      最終更新日
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.updatedDate}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {(isSelected("schedule.approval_date") ||
          isSelected("schedule.order_date") ||
          isSelected("schedule.delivery_date")) && (
          <div className="flex-1">
            <h2 className="text-lg text-white font-bold mb-3 bg-slate-800 px-4 py-2 border-l-4 border-emerald-500">
              ■ スケジュール
            </h2>
            <table className="w-full text-sm border-collapse border border-slate-300">
              <tbody>
                {isSelected("schedule.approval_date") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/3 text-left">
                      稟議承認予定
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.scheduleApproval}
                    </td>
                  </tr>
                )}
                {isSelected("schedule.order_date") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/3 text-left">
                      発注予定
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.scheduleOrder}
                    </td>
                  </tr>
                )}
                {isSelected("schedule.delivery_date") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/3 text-left">
                      納入・稼働予定
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.scheduleInstall && project.scheduleMassProd
                        ? `${project.scheduleInstall} (据付) / ${project.scheduleMassProd} (量産)`
                        : project.scheduleInstall || project.scheduleMassProd}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. 稟議内容 */}
      {(isSelected("approval.purpose") ||
        isSelected("approval.background") ||
        isSelected("approval.reason") ||
        isSelected("approval.impact") ||
        isSelected("approval.issues")) && (
        <section className="mb-10">
          <h2 className="text-lg text-white font-bold mb-4 bg-slate-800 px-4 py-2 border-l-4 border-amber-500">
            ■ 稟議内容・課題
          </h2>
          <div className="space-y-6">
            {isSelected("approval.purpose") && (
              <div>
                <h3 className="font-bold border-b border-slate-300 pb-1 mb-2 text-slate-800 flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 text-white text-[10px] rounded flex justify-center items-center font-black">
                    1
                  </div>{" "}
                  目的
                </h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap pl-6 leading-relaxed">
                  {project.purposeDetail}
                </p>
              </div>
            )}
            {isSelected("approval.background") && (
              <div>
                <h3 className="font-bold border-b border-slate-300 pb-1 mb-2 text-slate-800 flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 text-white text-[10px] rounded flex justify-center items-center font-black">
                    2
                  </div>{" "}
                  背景
                </h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap pl-6 leading-relaxed">
                  {project.bgDetail}
                </p>
              </div>
            )}
            {isSelected("approval.issues") && (
              <div>
                <h3 className="font-bold border-b border-slate-300 pb-1 mb-2 text-slate-800 flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 text-white text-[10px] rounded flex justify-center items-center font-black">
                    3
                  </div>{" "}
                  現状課題
                </h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap pl-6 leading-relaxed">
                  {project.issueDetail}
                </p>
              </div>
            )}
            {isSelected("approval.reason") && (
              <div>
                <h3 className="font-bold border-b border-slate-300 pb-1 mb-2 text-slate-800 flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 text-white text-[10px] rounded flex justify-center items-center font-black">
                    4
                  </div>{" "}
                  導入理由
                </h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap pl-6 leading-relaxed">
                  {project.reasonIntro}
                </p>
              </div>
            )}
            {isSelected("approval.impact") && (
              <div>
                <h3 className="font-bold border-b border-slate-300 pb-1 mb-2 text-slate-800 flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 text-white text-[10px] rounded flex justify-center items-center font-black">
                    5
                  </div>{" "}
                  導入しない場合の影響
                </h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap pl-6 leading-relaxed">
                  {project.impactDetail}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. 生産条件 */}
      {(isSelected("conditions.common.product_name") ||
        isSelected("conditions.common.annual_production") ||
        isSelected("conditions.common.operating_days") ||
        isSelected("conditions.common.operating_hours") ||
        isSelected("conditions.common.operating_rate")) && (
        <section className="mb-10">
          <h2 className="text-lg text-white font-bold mb-4 bg-slate-800 px-4 py-2 border-l-4 border-indigo-500">
            ■ 生産条件
          </h2>
          <div className="flex flex-col gap-4">
            <table className="w-full text-sm border-collapse border border-slate-300">
              <tbody>
                {isSelected("conditions.common.product_name") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/4 text-left">
                      製品・ワーク
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.targetProducts
                        ?.map(
                          (p: any) =>
                            `${p.name} (${p.sellingPriceType || "販売価格"}: ${p.sellingPrice?.toLocaleString() || 0} ${p.currency || project.currency || "JPY"}, ${p.materialCostType}: ${p.materialCostType === "材料比率" ? (p.materialCost || 0) + "%" : (p.materialCost?.toLocaleString() || 0) + " " + (p.currency || project.currency || "JPY")})`,
                        )
                        .join(" / ") || "-"}
                    </td>
                  </tr>
                )}
                {isSelected("conditions.common.annual_production") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/4 text-left">
                      生産量
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.targetProducts
                        ?.map(
                          (p: any) =>
                            `${p.name}: ${p.volumeType} ${p.volume || 0} ${p.unit || ""}`,
                        )
                        .join(" / ") || "-"}
                    </td>
                  </tr>
                )}
                {isSelected("conditions.common.operating_days") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/4 text-left">
                      年間稼働日数
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.workingDaysPerMonth
                        ? project.workingDaysPerMonth * 12 + " 日"
                        : "-"}
                    </td>
                  </tr>
                )}
                {isSelected("conditions.common.operating_hours") && (
                  <tr>
                    <th className="border border-slate-300 p-2 bg-slate-100 w-1/4 text-left">
                      1日あたり稼働時間
                    </th>
                    <td className="border border-slate-300 p-2 font-medium">
                      {project.workingHoursPerDay
                        ? project.workingHoursPerDay + " 時間"
                        : "-"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4. 対策案比較 */}
      {(isSelected("scenarios.overview") ||
        isSelected("scenarios.roi") ||
        isSelected("scenarios.effect") ||
        isSelected("scenarios.bep") ||
        isSelected("scenarios.labor_cost") ||
        isSelected("scenarios.equipment_details") ||
        isSelected("scenarios.line_units")) &&
        project.scenarios &&
        project.scenarios.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg text-white font-bold mb-4 bg-slate-800 px-4 py-2 border-l-4 border-rose-500">
              ■ 対策案・投資効果一覧
            </h2>
            <table className="w-full text-sm border-collapse border border-slate-300">
              <thead className="bg-slate-100 text-slate-800">
                <tr>
                  <th className="border border-slate-300 p-3 text-left">
                    比較項目
                  </th>
                  {project.scenarios
                    .filter(
                      (s: any) =>
                        s.id !== "current" &&
                        isSelected(`scenarios.target.${s.id}`),
                    )
                    .map((s: any) => (
                      <th
                        key={s.id}
                        className="border border-slate-300 p-3 w-[25%] bg-rose-50 text-rose-900 border-b-2 border-b-rose-400"
                      >
                        {s.name}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="border border-slate-300 p-3 bg-slate-50 text-left font-bold text-slate-700">
                    投資総額
                  </th>
                  {project.scenarios
                    .filter(
                      (s: any) =>
                        s.id !== "current" &&
                        isSelected(`scenarios.target.${s.id}`),
                    )
                    .map((s: any) => (
                      <td
                        key={s.id}
                        className="border border-slate-300 p-3 text-right font-black font-mono"
                      >
                        {s.investmentAmount
                          ? convertAmount(
                              s.investmentAmount,
                              project.currency,
                              project.reportCurrency || "JPY",
                            ).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })
                          : "-"}{" "}
                        {s.investmentAmount
                          ? project.reportCurrency || project.currency || "JPY"
                          : ""}
                      </td>
                    ))}
                </tr>
                {isSelected("scenarios.effect") && (
                  <tr>
                    <th className="border border-slate-300 p-3 bg-slate-50 text-left font-bold text-slate-700">
                      年間効果・削減額
                    </th>
                    {project.scenarios
                      .filter(
                        (s: any) =>
                          s.id !== "current" &&
                          isSelected(`scenarios.target.${s.id}`),
                      )
                      .map((s: any) => (
                        <td
                          key={s.id}
                          className="border border-slate-300 p-3 text-right font-black font-mono text-emerald-700"
                        >
                          {s.annualEffect
                            ? convertAmount(
                                s.annualEffect * 10000,
                                project.currency,
                                project.reportCurrency || "JPY",
                              ).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })
                            : "-"}{" "}
                          {s.annualEffect
                            ? project.reportCurrency ||
                              project.currency ||
                              "JPY"
                            : ""}
                        </td>
                      ))}
                  </tr>
                )}
                {isSelected("scenarios.roi") && (
                  <tr>
                    <th className="border border-slate-300 p-3 bg-slate-50 text-left font-bold text-slate-700">
                      投資回収年数
                    </th>
                    {project.scenarios
                      .filter(
                        (s: any) =>
                          s.id !== "current" &&
                          isSelected(`scenarios.target.${s.id}`),
                      )
                      .map((s: any) => (
                        <td
                          key={s.id}
                          className="border border-slate-300 p-3 text-right font-black font-mono"
                        >
                          {s.recoveryYears || "-"} {s.recoveryYears ? "年" : ""}
                        </td>
                      ))}
                  </tr>
                )}
                {isSelected("scenarios.npv_irr_roi") && (
                  <>
                    <tr>
                      <th className="border border-slate-300 p-3 bg-slate-50 text-left font-bold text-slate-700">
                        NPV (正味現在価値)
                      </th>
                      {project.scenarios
                        .filter((s: any) => s.id !== "current" && isSelected(`scenarios.target.${s.id}`))
                        .map((s: any) => (
                          <td key={s.id} className="border border-slate-300 p-3 text-right font-black font-mono text-indigo-700">
                            {s.npv ? s.npv.toLocaleString(undefined, {maximumFractionDigits:0}) + " 万円" : "-"}
                          </td>
                        ))}
                    </tr>
                    <tr>
                      <th className="border border-slate-300 p-3 bg-slate-50 text-left font-bold text-slate-700">
                        IRR (内部収益率)
                      </th>
                      {project.scenarios
                        .filter((s: any) => s.id !== "current" && isSelected(`scenarios.target.${s.id}`))
                        .map((s: any) => (
                          <td key={s.id} className="border border-slate-300 p-3 text-right font-black font-mono text-fuchsia-700">
                            {s.irr ? s.irr.toLocaleString(undefined, {maximumFractionDigits:1}) + " %" : "-"}
                          </td>
                        ))}
                    </tr>
                    <tr>
                      <th className="border border-slate-300 p-3 bg-slate-50 text-left font-bold text-slate-700">
                        ROI (投資利益率)
                      </th>
                      {project.scenarios
                        .filter((s: any) => s.id !== "current" && isSelected(`scenarios.target.${s.id}`))
                        .map((s: any) => (
                          <td key={s.id} className="border border-slate-300 p-3 text-right font-black font-mono text-emerald-700">
                            {s.roi ? s.roi.toLocaleString(undefined, {maximumFractionDigits:1}) + " %" : "-"}
                          </td>
                        ))}
                    </tr>
                  </>
                )}
                {isSelected("scenarios.bep") && (
                  <tr>
                    <th className="border border-slate-300 p-3 bg-slate-50 text-left font-bold text-slate-700">
                      損益分岐点詳細
                    </th>
                    {project.scenarios
                      .filter(
                        (s: any) =>
                          s.id !== "current" &&
                          isSelected(`scenarios.target.${s.id}`),
                      )
                      .map((s: any) => (
                        <td
                          key={s.id}
                          className="border border-slate-300 p-3 text-xs leading-relaxed text-slate-700 align-top"
                        >
                          {s.breakEven || s.recovery || "-"}
                        </td>
                      ))}
                  </tr>
                )}
                {isSelected("scenarios.labor_cost") && (
                  <tr>
                    <th className="border border-slate-300 p-3 bg-slate-50 text-left font-bold text-slate-700">
                      労務費差異・人員
                    </th>
                    {project.scenarios
                      .filter(
                        (s: any) =>
                          s.id !== "current" &&
                          isSelected(`scenarios.target.${s.id}`),
                      )
                      .map((s: any) => (
                        <td
                          key={s.id}
                          className="border border-slate-300 p-3 text-xs leading-relaxed text-slate-700 align-top"
                        >
                          {s.laborCostDiff || "-"}
                        </td>
                      ))}
                  </tr>
                )}
              </tbody>
            </table>

            {/* 各シナリオの詳細出力 */}
            {project.scenarios
              .filter((s: any) => isSelected(`scenarios.target.${s.id}`))
              .map((s: any) => (
                <div
                  key={`detail-${s.id}`}
                  className="mb-8 border border-slate-300 rounded overflow-hidden mt-6"
                >
                  <h3 className="text-md text-white font-bold bg-slate-700 px-4 py-2 border-l-4 border-slate-400">
                    シナリオ詳細：{s.name}
                  </h3>
                  <div className="p-6 space-y-6">
                    {isSelected("scenarios.overview") && s.overview && (
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 border-b border-slate-300 pb-1 mb-2">
                          概要
                        </h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {s.overview}
                        </p>
                      </div>
                    )}

                    {isSelected("scenarios.line_units") &&
                      s.lineUnits &&
                      s.lineUnits.length > 0 && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 border-b border-slate-300 pb-1 mb-2">
                            ライン構成・工程
                          </h4>
                          <table className="w-full text-xs border-collapse border border-slate-300 mt-2">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="border border-slate-300 p-2">
                                  No
                                </th>
                                <th className="border border-slate-300 p-2 text-left">
                                  工程名
                                </th>
                                <th className="border border-slate-300 p-2 text-left">
                                  設備・作業リソース
                                </th>
                                <th className="border border-slate-300 p-2">
                                  人員設定
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.lineUnits.map((lu: any) => (
                                <tr key={lu.id}>
                                  <td className="border border-slate-300 p-2 text-center">
                                    {lu.number}
                                  </td>
                                  <td className="border border-slate-300 p-2 font-bold">
                                    {lu.name}
                                  </td>
                                  <td className="border border-slate-300 p-2">
                                    {lu.resources
                                      ?.map((r: any) =>
                                        r.type === "equipment"
                                          ? "機:" + r.count
                                          : "人:" + r.count,
                                      )
                                      .join(" / ") || "-"}
                                  </td>
                                  <td className="border border-slate-300 p-2 text-center">
                                    {lu.workingHours || "-"} Hr / 稼働率:{" "}
                                    {lu.operatingRate || "-"}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                    {isSelected("scenarios.equipment_details") &&
                      s.equipmentList &&
                      s.equipmentList.length > 0 && (
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 border-b border-slate-300 pb-1 mb-2">
                            購入設備明細一覧
                          </h4>
                          <table className="w-full text-xs border-collapse border border-slate-300 mt-2">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="border border-slate-300 p-2 text-left">
                                  設備・項目名
                                </th>
                                <th className="border border-slate-300 p-2">
                                  数量
                                </th>
                                <th className="border border-slate-300 p-2 text-right">
                                  単価
                                </th>
                                <th className="border border-slate-300 p-2 text-right">
                                  合計
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.equipmentList.map((eq: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="border border-slate-300 p-2">
                                    {eq.name}
                                  </td>
                                  <td className="border border-slate-300 p-2 text-center font-mono">
                                    {eq.quantity || 0}
                                  </td>
                                  <td className="border border-slate-300 p-2 text-right font-mono">
                                    {eq.price
                                      ? convertAmount(
                                          eq.price,
                                          eq.currency ||
                                            project.currency ||
                                            "JPY",
                                          project.reportCurrency || "JPY",
                                        ).toLocaleString(undefined, {
                                          maximumFractionDigits: 1,
                                        })
                                      : 0}{" "}
                                    万
                                  </td>
                                  <td className="border border-slate-300 p-2 text-right font-bold font-mono">
                                    {convertAmount(
                                      (eq.price || 0) * (eq.quantity || 0),
                                      eq.currency || project.currency || "JPY",
                                      project.reportCurrency || "JPY",
                                    ).toLocaleString(undefined, {
                                      maximumFractionDigits: 1,
                                    })}{" "}
                                    万
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                    {isSelected("scenarios.bep") && s.breakEven && (
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 border-b border-slate-300 pb-1 mb-2">
                          損益分岐点・回収詳細
                        </h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {s.breakEven}
                        </p>
                      </div>
                    )}
                    
                    {isSelected("scenarios.bep_chart") && (
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 border-b border-slate-300 pb-1 mb-2">
                          損益分岐点グラフ
                        </h4>
                        
                        {(() => {
                          const currentScenario = s;
                          // 1. Calculate sales price, material cost per PCS
                          let totalVol = 0;
                          let totalSalesAmt = 0;
                          let totalMatAmt = 0;
                          (project.targetProducts || []).forEach((p: any) => {
                            let v = p.volume || 0;
                            if (p.volumeType === "年間") v = v / 12;
                            
                            let price = p.sellingPrice || 0;
                            if (p.sellingPriceType === "年間売上") price = price / 12 / (v || 1);
                            else if (p.sellingPriceType === "月間売上") price = price / (v || 1);
                            
                            let mCost = p.materialCost || 0;
                            let matUnitPrice = p.materialCostType === "材料比率" ? price * (mCost / 100) : mCost;
                            
                            let sInProj = convertAmount(price, p.currency || project.currency || "JPY", project.currency || "JPY");
                            let mInProj = convertAmount(matUnitPrice, p.currency || project.currency || "JPY", project.currency || "JPY");
                            
                            totalVol += v;
                            totalSalesAmt += v * sInProj;
                            totalMatAmt += v * mInProj;
                          });
                          const avgSalesPrice = totalVol > 0 ? totalSalesAmt / totalVol : 0;
                          const avgMaterialCost = totalVol > 0 ? totalMatAmt / totalVol : 0;

                          // 2. Capacity & Variable/Fixed Costs
                          let minSpm = Infinity;
                          (currentScenario?.lineUnits || []).forEach((lu: any) => {
                            (lu.resources || []).forEach((r: any) => {
                              let spm = parseFloat(r.spm) || 0;
                              if (spm > 0 && spm < minSpm) minSpm = spm;
                            });
                          });
                          if (minSpm === Infinity) minSpm = 0;

                          let monthlyDepreciation = 0;
                          let pcsLabor = 0;
                          let totalPowerKw = 0;
                          
                          (currentScenario?.lineUnits || []).forEach((lu: any) => {
                            const eqResources = (lu.resources || []).filter((r: any) => r.type === "設備");
                            (lu.resources || []).forEach((r: any) => {
                              if (r.type === "人員") {
                                const hr = parseFloat(r.hourlyRate) || 0;
                                const qty = parseFloat(r.quantity) || 0;
                                const costPerHour = hr * qty;
                                const rSpm = parseFloat(r.spm) || 0;
                                const effectiveSpm = rSpm > 0 ? rSpm : minSpm;
                                if (effectiveSpm > 0) {
                                  pcsLabor += costPerHour / (effectiveSpm * 60);
                                }
                              }
                            });
                            totalPowerKw += eqResources.reduce((sum: number, r: any) => sum + (parseFloat(r.powerConsumption)||0) * (parseFloat(r.quantity)||0), 0);
                            
                            eqResources.forEach((r: any) => {
                              const master = masterEquipment.find((m) => m.id === r.equipmentId || m.name === r.name);
                              if (master && master.investmentAmount) {
                                const method = master.depreciationMethod || "定額";
                                const life = master.usefulLife || 10;
                                const residual = (master.residualValueRatio !== undefined ? master.residualValueRatio : 5) / 100;
                                let yDep = 0;
                                if (method === "定額") {
                                  yDep = (master.investmentAmount * (1 - residual)) / life;
                                } else {
                                  const dbRate = 1 - Math.pow(residual, 1 / life);
                                  yDep = master.investmentAmount * dbRate;
                                }
                                monthlyDepreciation += (yDep / 12) * (parseFloat(r.quantity)||1);
                              }
                            });
                          });
                          
                          if (minSpm === Infinity) minSpm = 0;
                          const hours = parseFloat(project.workingHoursPerDay || "8");
                          const days = parseFloat(project.workingDaysPerMonth || "20");
                          const maxMonthlyVolume = minSpm * 60 * hours * days;
                          
                          const elecKwhCost = parseFloat(project.electricityCostPerKwh || "15");
                          const elecCurrency = project.electricityCurrency || project.currency || "JPY";
                          const convertedElecKwhCost = convertAmount(elecKwhCost, elecCurrency, project.currency || "JPY");
                          const hourlyElecCost = totalPowerKw * convertedElecKwhCost;
                          
                          const pcsElec = minSpm > 0 ? hourlyElecCost / (minSpm * 60) : 0;
                          const pcsTotalVar = avgMaterialCost + pcsLabor + pcsElec;

                          const cmPerUnit = avgSalesPrice - pcsTotalVar;
                          const bepVolume = cmPerUnit > 0 ? monthlyDepreciation / cmPerUnit : 0;
                          const bepSales = bepVolume * avgSalesPrice;

                          // Chart Data
                          const chartData = [];
                          const step = maxMonthlyVolume > 0 ? maxMonthlyVolume / 10 : 100;
                          const volumes = [];
                          for (let i = 0; i <= 10; i++) volumes.push(i * step);
                          if (bepVolume > 0 && bepVolume <= maxMonthlyVolume) volumes.push(bepVolume);
                          volumes.sort((a,b) => a-b);
                          const uniqueVolumes = Array.from(new Set(volumes.map(v => Math.round(v))));

                          uniqueVolumes.forEach(vol => {
                            chartData.push({
                              volume: vol,
                              sales: vol * avgSalesPrice,
                              fixedCost: monthlyDepreciation,
                              variableCost: vol * pcsTotalVar,
                              totalCost: monthlyDepreciation + (vol * pcsTotalVar),
                            });
                          });

                          const ccy = project.currency || "JPY";

                          return (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                                 <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                   <p className="text-[10px] text-slate-500 mb-1">代表販売価格</p>
                                   <p className="font-mono text-sm font-bold text-slate-900">
                                      {avgSalesPrice.toLocaleString(undefined, {maximumFractionDigits:1})} <span className="text-[10px] font-normal">{ccy}/pcs</span>
                                   </p>
                                 </div>
                                 <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                   <p className="text-[10px] text-blue-600 mb-1">月間固定費</p>
                                   <p className="font-mono text-sm font-bold text-blue-700">
                                      {monthlyDepreciation.toLocaleString(undefined, {maximumFractionDigits:0})} <span className="text-[10px] font-normal">{ccy}</span>
                                   </p>
                                 </div>
                                 <div className="p-3 bg-orange-50 rounded border border-orange-200">
                                   <p className="text-[10px] text-orange-600 mb-1">変動単価 (1pcsあたり)</p>
                                   <p className="font-mono text-sm font-bold text-orange-700">
                                      {pcsTotalVar.toLocaleString(undefined, {maximumFractionDigits:2})} <span className="text-[10px] font-normal">{ccy}</span>
                                   </p>
                                 </div>
                                 <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                                   <p className="text-[10px] text-emerald-600 font-bold mb-1">損益分岐点</p>
                                   <p className="font-mono text-sm font-black text-emerald-700">
                                      売上: {bepSales.toLocaleString(undefined, {maximumFractionDigits:0})} <span className="text-[10px] font-normal">{ccy}</span>
                                   </p>
                                   <p className="text-[10px] font-bold text-emerald-600/80 mt-1">
                                      (生産数: {Math.round(bepVolume).toLocaleString()} pcs)
                                   </p>
                                 </div>
                              </div>
                              <div className="h-[300px] w-full mt-2 border border-slate-200 rounded p-2 text-xs">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                                    <XAxis 
                                      type="number"
                                      domain={[0, Math.round(maxMonthlyVolume)]}
                                      dataKey="volume" 
                                      tickFormatter={(v) => v.toLocaleString()}
                                      label={{ value: '生産量 (pcs/月)', position: 'insideBottom', offset: -15, fontSize: 10, fill: "#64748b" }} 
                                      tick={{ fontSize: 10, fill: "#64748b" }}
                                    />
                                    <YAxis 
                                      tickFormatter={(v) => (v / 10000).toLocaleString() + '万'} 
                                      label={{ value: `金額 (${ccy})`, angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: "#64748b" }}
                                      tick={{ fontSize: 10, fill: "#64748b" }}
                                    />
                                    <RechartsTooltip 
                                      formatter={(value: number, name: string) => [value.toLocaleString(undefined, {maximumFractionDigits:0}) + ' ' + ccy, name]}
                                      labelFormatter={(label) => '生産量: ' + label.toLocaleString() + ' pcs'}
                                    />
                                    <Legend verticalAlign="top" height={36} wrapperStyle={{fontSize: "11px"}} />
                                    <Area type="monotone" dataKey="fixedCost" name="固定費" stackId="1" stroke="#3b82f6" fill="#bfdbfe" />
                                    <Area type="monotone" dataKey="variableCost" name="変動費" stackId="1" stroke="#f59e0b" fill="#fde68a" />
                                    <Line type="monotone" dataKey="sales" name="売上高" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                    {bepVolume > 0 && bepVolume <= maxMonthlyVolume && (
                                      <>
                                        <ReferenceDot x={Math.round(bepVolume)} y={bepSales} r={4} fill="#ef4444" stroke="#fff" strokeWidth={1} />
                                        <ReferenceLine x={Math.round(bepVolume)} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '損益分岐点', fill: '#ef4444', fontSize: 10, fontWeight: "bold" }} />
                                      </>
                                    )}
                                  </ComposedChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {isSelected("scenarios.labor_cost") && currStatsForReport && (
                      <div className="mt-6">
                        <table className="w-full text-xs xl:text-sm border-collapse border border-slate-300">
                          <thead className="bg-[#1f4e79] text-white">
                            <tr>
                              <th className="border border-slate-400 p-2 w-1/4">直接労務費差異計算</th>
                              <th className="border border-slate-400 p-2 w-[18%]">改善前 (現行)</th>
                              <th className="border border-slate-400 p-2 w-[18%]">改善後 ({s.name})</th>
                              <th className="border border-slate-400 p-2 w-[15%]">比較差</th>
                              <th className="border border-slate-400 p-2">備考</th>
                            </tr>
                          </thead>
                          {(() => {
                            const tStats = getLaborStats(s);
                            const rateDiff = (tStats.avgWage - currStatsForReport.avgWage) * tStats.manHours;
                            const timeDiff = (tStats.manHours - currStatsForReport.manHours) * currStatsForReport.avgWage;
                            const totalDiff = rateDiff + timeDiff;
                            const ccy = project.currency || "JPY";
                            return (
                              <>
                                <tbody className="bg-slate-50">
                                  <tr>
                                    <td className="border border-slate-300 p-2 font-bold text-[#1f4e79] text-right">生産人数(人)</td>
                                    <td className="border border-slate-300 p-2 text-right">{currStatsForReport.totalPeople}</td>
                                    <td className="border border-slate-300 p-2 text-right bg-indigo-50">{tStats.totalPeople}</td>
                                    <td className="border border-slate-300 p-2 text-right">{(tStats.totalPeople - currStatsForReport.totalPeople) > 0 ? "+" : ""}{tStats.totalPeople - currStatsForReport.totalPeople}</td>
                                    <td className="border border-slate-300 p-2 text-slate-500 text-[10px] xl:text-xs">作業人数の増減</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-slate-300 p-2 font-bold text-[#1f4e79] text-right">生産速度(pcs/h)</td>
                                    <td className="border border-slate-300 p-2 text-right">{currStatsForReport.speedPcsPerHour.toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-right bg-indigo-50">{tStats.speedPcsPerHour.toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className={`border border-slate-300 p-2 text-right font-bold ${(tStats.speedPcsPerHour - currStatsForReport.speedPcsPerHour) > 0 ? 'text-emerald-700' : ''}`}>{(tStats.speedPcsPerHour - currStatsForReport.speedPcsPerHour > 0 ? '+' : '')}{(tStats.speedPcsPerHour - currStatsForReport.speedPcsPerHour).toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-slate-500 text-[10px] xl:text-xs">ラインSPM×60</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-slate-300 p-2 font-bold text-[#1f4e79] text-right">生産時間(h)</td>
                                    <td className="border border-slate-300 p-2 text-right">{currStatsForReport.timeNeeded.toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-right bg-indigo-50">{tStats.timeNeeded.toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-right font-bold {(tStats.timeNeeded - currStatsForReport.timeNeeded) < 0 ? 'text-emerald-700' : ''}">{(tStats.timeNeeded - currStatsForReport.timeNeeded > 0 ? '+' : '')}{(tStats.timeNeeded - currStatsForReport.timeNeeded).toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-slate-500 text-[10px] xl:text-xs text-left" rowSpan={2}>
                                      目標月産 {tStats.usedVolume.toLocaleString()} pcs を生産するのに必要な時間と日数
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="border border-slate-300 p-2 font-bold text-[#1f4e79] text-right">生産日数(日/月)</td>
                                    <td className="border border-slate-300 p-2 text-right">{currStatsForReport.daysNeeded.toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-right bg-indigo-50">{tStats.daysNeeded.toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-right font-bold {(tStats.daysNeeded - currStatsForReport.daysNeeded) < 0 ? 'text-emerald-700' : ''}">{(tStats.daysNeeded - currStatsForReport.daysNeeded > 0 ? '+' : '')}{(tStats.daysNeeded - currStatsForReport.daysNeeded).toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                  </tr>
                                  <tr>
                                    <td className="border border-slate-300 p-2 font-bold text-[#1f4e79] text-right">時間単価({ccy})</td>
                                    <td className="border border-slate-300 p-2 text-right">{currStatsForReport.avgWage.toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-right bg-indigo-50">{tStats.avgWage.toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-right">{(tStats.avgWage - currStatsForReport.avgWage > 0 ? '+' : '')}{(tStats.avgWage - currStatsForReport.avgWage).toLocaleString(undefined, {maximumFractionDigits:1})}</td>
                                    <td className="border border-slate-300 p-2 text-slate-500 text-[10px] xl:text-xs">
                                      加重平均時間単価
                                    </td>
                                  </tr>
                                </tbody>
                                <tbody className="bg-white border-t-[3px] border-double border-[#1f4e79]">
                                  <tr>
                                    <td colSpan={2} rowSpan={3} className="border border-slate-300 p-3 bg-slate-100 text-[10px] xl:text-xs text-slate-700 align-top whitespace-pre-wrap">
                                      {s.laborCostDiff}
                                    </td>
                                    <td className="border border-slate-300 p-2 font-bold text-[#1f4e79] text-right bg-slate-50">賃率差異({ccy}/月)</td>
                                    <td colSpan={2} className={`border border-slate-300 p-2 text-right font-mono font-bold ${rateDiff > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                      {rateDiff > 0 ? '+' : ''}{rateDiff.toLocaleString(undefined, {maximumFractionDigits:0})}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="border border-slate-300 p-2 font-bold text-[#1f4e79] text-right bg-slate-50">時間差異({ccy}/月)</td>
                                    <td colSpan={2} className={`border border-slate-300 p-2 text-right font-mono font-bold ${timeDiff > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                      {timeDiff > 0 ? '+' : ''}{timeDiff.toLocaleString(undefined, {maximumFractionDigits:0})}
                                    </td>
                                  </tr>
                                  <tr className="bg-[#f0f9ff]">
                                    <td className="border border-slate-300 p-2 font-bold text-[#1f4e79] text-right bg-[#e0f2fe]">月間労務費差異</td>
                                    <td colSpan={2} className={`border border-slate-300 p-3 text-right font-black font-mono text-lg ${totalDiff > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                      {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString(undefined, {maximumFractionDigits:0})} {ccy}
                                    </td>
                                  </tr>
                                </tbody>
                              </>
                            );
                          })()}
                        </table>
                      </div>
                    )}

                    {isSelected("scenarios.roi") && s.recovery && (
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 border-b border-slate-300 pb-1 mb-2">
                          投資回収計算根拠
                        </h4>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {s.recovery}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </section>
        )}

      {/* 5. 総合結論 */}
      {isSelected("conclusion.summary") && (
        <section className="mb-10 page-break-inside-avoid">
          <h2 className="text-lg text-white font-bold mb-4 bg-slate-800 px-4 py-2 border-l-4 border-fuchsia-500">
            ■ 総合結論・比較検証結果
          </h2>
          <div className="border border-fuchsia-200 bg-fuchsia-50/30 p-6 rounded relative">
            <div className="absolute top-0 right-0 p-2 text-fuchsia-800/10">
              <FileText className="w-16 h-16" />
            </div>
            <h3 className="font-bold text-fuchsia-900 border-b border-fuchsia-200 pb-2 mb-4 flex items-center gap-2">
              比較検討の結論・最終判断
            </h3>
            <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed relative z-10">
              {project.reportConclusion || "結論が入力されていません。"}
            </p>

            {project.reportComparisonResult && (
              <div className="mt-6">
                <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-3 text-sm">
                  特記事項・懸念点
                </h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed relative z-10">
                  {project.reportComparisonResult}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. 各案の定量比較 */}
      {(isSelected("conclusion.chart_investment") ||
        isSelected("conclusion.chart_recovery") ||
        isSelected("conclusion.table_comparison")) &&
        project.scenarios &&
        project.scenarios.length > 0 && (
          <section className="mb-10 page-break-inside-avoid">
            <h2 className="text-lg text-white font-bold mb-4 bg-slate-800 px-4 py-2 border-l-4 border-cyan-500">
              ■ 各案の定量比較
            </h2>

            {(isSelected("conclusion.chart_investment") ||
              isSelected("conclusion.chart_recovery")) && (
              <div className="flex flex-col gap-6 mb-6">
                <div className="w-full border border-slate-300 p-4 rounded bg-white shadow-sm">
                  <p className="text-sm font-bold text-center mb-4 text-slate-700">
                    キャッシュフローと投資回収
                  </p>
                  <div className="h-64 w-full overflow-x-auto scrollbar-thin">
                    <div
                      style={{
                        minWidth: `max(100%, ${(() => {
                          const active = (project.scenarios || []).filter((s: any) => s.id !== "current" && isSelected(`scenarios.target.${s.id}`));
                          const totalYears = active.reduce((sum: number, s: any) => sum + Math.max(1, Math.ceil(s.recoveryYears || (project.calcPeriod ? parseFloat(project.calcPeriod) : 10))), 0) + (active.length > 0 ? active.length - 1 : 0);
                          return totalYears * 80;
                        })()}px)`,
                        height: "100%",
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={(() => {
                            const data: any[] = [];
                            const activeScenarios = (project.scenarios || []).filter(
                              (s: any) => s.id !== "current" && isSelected(`scenarios.target.${s.id}`)
                            );
                            activeScenarios.forEach((s: any, idx: number) => {
                              const years =
                                s.recoveryYears && s.recoveryYears > 0
                                  ? Math.ceil(s.recoveryYears) + 1
                                  : project.calcPeriod
                                    ? parseInt(project.calcPeriod)
                                    : 10;
                              let cumulative = 0;
                              for (let i = 1; i <= Math.max(years, 1); i++) {
                                const cost =
                                  i === 1
                                    ? -(
                                        convertAmount(
                                          s.investmentAmount || 0,
                                          project.currency,
                                          project.reportCurrency || "JPY"
                                        ) / (project.unitMultiplier || 10000)
                                      )
                                    : 0;
                                const effect =
                                  convertAmount(
                                    (s.annualEffect || 0) * (project.unitMultiplier || 10000),
                                    project.currency,
                                    project.reportCurrency || "JPY"
                                  ) / (project.unitMultiplier || 10000);
                                cumulative += cost + effect;
                                data.push({
                                  name: `${s.name} ${i}年目`,
                                  費用: cost,
                                  効果: effect,
                                  累積額: cumulative,
                                });
                              }
                              if (idx < activeScenarios.length - 1) {
                                data.push({
                                  name: `_space_${idx}`,
                                  費用: 0,
                                  効果: 0,
                                  累積額: null,
                                });
                              }
                            });
                            return data;
                          })()}
                          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: "#64748b" }}
                            interval={0}
                            tickFormatter={(val: string) => (val && val.startsWith("_space_") ? "" : val)}
                            angle={-30}
                            textAnchor="end"
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                          <RechartsTooltip
                            cursor={{ fill: "#f1f5f9" }}
                            contentStyle={{
                              borderRadius: "0.25rem",
                              border: "1px solid #cbd5e1",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                              fontSize: "12px",
                            }}
                            labelFormatter={(label: any) => (label && label.startsWith("_space_") ? "" : label)}
                            formatter={(value: any, name: any) => (value === null || typeof name === "string" && name.startsWith("_space_")) ? [null, null] : [value, name]}
                          />
                          <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} />
                          <Legend wrapperStyle={{ fontSize: "11px", bottom: -10 }} />
                          <Bar dataKey="費用" fill="#ef4444" radius={[0, 0, 4, 4]} name={`費用 (${project.unitDisplay || "万円"})`} stackId="a" />
                          <Bar dataKey="効果" fill="#10b981" radius={[4, 4, 0, 0]} name={`効果 (${project.unitDisplay || "万円"})`} stackId="a" />
                          <Line type="monotone" dataKey="累積額" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name={`累積回収額 (${project.unitDisplay || "万円"})`} connectNulls={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isSelected("conclusion.table_comparison") && (
              <div className="border border-slate-300 rounded bg-white overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-300 w-1/5">
                        比較項目
                      </th>
                      {project.scenarios
                        .filter((s: any) =>
                          isSelected(`scenarios.target.${s.id}`),
                        )
                        .map((s: any) => (
                          <th
                            key={s.id}
                            className={`px-4 py-3 border-b border-slate-300 w-[26%] ${s.id === "current" ? "text-slate-400" : ""}`}
                          >
                            {s.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap bg-slate-50">
                        投資総額
                      </td>
                      {project.scenarios
                        .filter((s: any) =>
                          isSelected(`scenarios.target.${s.id}`),
                        )
                        .map((s: any) => (
                          <td
                            key={s.id}
                            className="px-4 py-3 font-mono font-bold text-slate-800"
                          >
                            {s.investmentAmount
                              ? convertAmount(
                                  s.investmentAmount,
                                  project.currency,
                                  project.reportCurrency || "JPY",
                                ).toLocaleString(undefined, {
                                  maximumFractionDigits: 0,
                                })
                              : "-"}{" "}
                            {s.investmentAmount
                              ? project.reportCurrency ||
                                project.currency ||
                                "JPY"
                              : ""}
                          </td>
                        ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap bg-slate-50">
                        投資回収（年）
                      </td>
                      {project.scenarios
                        .filter((s: any) =>
                          isSelected(`scenarios.target.${s.id}`),
                        )
                        .map((s: any) => (
                          <td
                            key={s.id}
                            className="px-4 py-3 font-mono font-bold text-slate-800"
                          >
                            {s.recoveryYears || "-"}{" "}
                            {s.recoveryYears ? "年" : ""}
                          </td>
                        ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap bg-slate-50">
                        NPV（万円）
                      </td>
                      {project.scenarios
                        .filter((s: any) => isSelected(`scenarios.target.${s.id}`))
                        .map((s: any) => (
                          <td key={s.id} className="px-4 py-3 font-mono font-bold text-indigo-700">
                            {s.npv ? s.npv.toLocaleString(undefined, {maximumFractionDigits:0}) : "-"}
                          </td>
                        ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap bg-slate-50">
                        IRR（%）
                      </td>
                      {project.scenarios
                        .filter((s: any) => isSelected(`scenarios.target.${s.id}`))
                        .map((s: any) => (
                          <td key={s.id} className="px-4 py-3 font-mono font-bold text-fuchsia-700">
                            {s.irr ? s.irr.toLocaleString(undefined, {maximumFractionDigits:1}) : "-"}
                          </td>
                        ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap bg-slate-50">
                        ROI（%）
                      </td>
                      {project.scenarios
                        .filter((s: any) => isSelected(`scenarios.target.${s.id}`))
                        .map((s: any) => (
                          <td key={s.id} className="px-4 py-3 font-mono font-bold text-emerald-700">
                            {s.roi ? s.roi.toLocaleString(undefined, {maximumFractionDigits:1}) : "-"}
                          </td>
                        ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap align-top bg-slate-50">
                        損益分岐点詳細
                      </td>
                      {project.scenarios
                        .filter((s: any) =>
                          isSelected(`scenarios.target.${s.id}`),
                        )
                        .map((s: any) => (
                          <td
                            key={s.id}
                            className="px-4 py-3 text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed align-top"
                          >
                            {s.breakEven || s.recovery || "-"}
                          </td>
                        ))}
                    </tr>
                    {isSelected("scenarios.labor_cost") && currStatsForReport && (() => {
                       const validScenarios = project.scenarios.filter((s: any) => isSelected(`scenarios.target.${s.id}`));
                       return (
                         <>
                           <tr className="border-t-2 border-slate-300">
                             <td className="px-4 py-3 text-slate-700 font-bold bg-slate-100 uppercase text-xs" colSpan={validScenarios.length + 1}>
                               直接労務費 (月間生産目標 {currStatsForReport.usedVolume.toLocaleString()} pcs想定)
                             </td>
                           </tr>
                           <tr>
                             <td className="px-4 py-2 font-semibold text-slate-700 bg-slate-50 whitespace-nowrap text-xs">
                               &nbsp;&nbsp;・生産人数 / 速度
                             </td>
                             {validScenarios.map((s: any) => {
                               if (s.id === "current") {
                                 return <td key={s.id} className="px-4 py-2 font-mono text-slate-500 text-xs">{currStatsForReport.totalPeople}人 / {currStatsForReport.speedPcsPerHour.toLocaleString()} pcs/h</td>;
                               }
                               const tStats = getLaborStats(s);
                               return <td key={s.id} className="px-4 py-2 font-mono text-slate-800 text-xs">{tStats.totalPeople}人 / {tStats.speedPcsPerHour.toLocaleString()} pcs/h</td>;
                             })}
                           </tr>
                           <tr>
                             <td className="px-4 py-2 font-semibold text-slate-700 bg-slate-50 whitespace-nowrap text-xs">
                               &nbsp;&nbsp;・月間生産時間 (h)
                             </td>
                             {validScenarios.map((s: any) => {
                               if (s.id === "current") {
                                 return <td key={s.id} className="px-4 py-2 font-mono text-slate-500 text-xs">{currStatsForReport.timeNeeded.toLocaleString(undefined, {maximumFractionDigits:1})} h</td>;
                               }
                               const tStats = getLaborStats(s);
                               return <td key={s.id} className="px-4 py-2 font-mono text-slate-800 text-xs">{tStats.timeNeeded.toLocaleString(undefined, {maximumFractionDigits:1})} h</td>;
                             })}
                           </tr>
                           <tr>
                             <td className="px-4 py-3 font-bold text-[#1f4e79] bg-[#f0f9ff] whitespace-nowrap border-b border-slate-300 text-sm">
                               &nbsp;&nbsp;・月間労務費差異
                             </td>
                             {validScenarios.map((s: any) => {
                               if (s.id === "current") {
                                 return <td key={s.id} className="px-4 py-3 font-mono text-slate-400 border-b border-slate-300 text-sm">- (現状基準)</td>;
                               }
                               const tStats = getLaborStats(s);
                               const rateDiff = (tStats.avgWage - currStatsForReport.avgWage) * tStats.manHours;
                               const timeDiff = (tStats.manHours - currStatsForReport.manHours) * currStatsForReport.avgWage;
                               const totalDiff = rateDiff + timeDiff;
                               const ccy = project.currency || "JPY";
                               return (
                                 <td key={s.id} className={`px-4 py-3 font-mono font-bold border-b border-slate-300 text-sm ${totalDiff < 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                   {totalDiff > 0 ? '+' : ''}{totalDiff.toLocaleString(undefined, {maximumFractionDigits:0})} {ccy}
                                 </td>
                               );
                             })}
                           </tr>
                         </>
                       );
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

      {/* Footer Notes */}
      <div className="border-t-2 border-dashed border-slate-300 mt-12 pt-6 flex justify-between items-center text-xs text-slate-500">
        <div>
          {globalSettings.exchangeRateSource &&
            globalSettings.exchangeRateDate && (
              <p>
                ※ 各種費用・効果金額は「{globalSettings.exchangeRateSource}
                」の「{globalSettings.exchangeRateDate}
                」時点の為替レートに基づいて換算・計算されています。
              </p>
            )}
          <p>This report was automatically compiled by the system.</p>
        </div>
        <div className="text-right">
          <p>
            作成日: {new Date().toLocaleDateString("ja-JP")}{" "}
            {new Date().toLocaleTimeString("ja-JP")}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatsView() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full overflow-y-auto p-8"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-8">統計・分析</h2>
        <div className="border-2 border-dashed border-[var(--color-border-main)] rounded-2xl p-20 flex flex-col items-center justify-center text-center">
          <TrendingUp className="w-12 h-12 text-blue-600/30 mb-4" />
          <h3 className="text-xl font-bold mb-3">分析データがまだありません</h3>
          <p className="text-[var(--color-brand-secondary)] max-w-md">
            案件データが蓄積されると、年度別投資額、平均回収年数、投資案件タイプ別傾向などの高度な分析が表示されます。
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsView({
  isAdmin,
  setIsAdmin,
  settings,
  onUpdateSettings,
}: {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  settings: any;
  onUpdateSettings: (s: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<"general" | "display" | "admin">(
    "general",
  );

  const handleRateChange = (code: string, value: string) => {
    const rate = parseFloat(value) || 0;
    onUpdateSettings({
      ...settings,
      exchangeRates: {
        ...settings.exchangeRates,
        [code]: rate,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full overflow-y-auto p-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">システム設定</h2>
          <div className="flex bg-[var(--color-border-main)]/10 p-1 rounded-xl border border-[var(--color-border-main)]/20">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "general" ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600" : "text-[var(--color-brand-secondary)] hover:text-gray-900"}`}
            >
              基本設定
            </button>
            <button
              onClick={() => setActiveTab("display")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "display" ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600" : "text-[var(--color-brand-secondary)] hover:text-gray-900"}`}
            >
              表示・会計
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "admin" ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600" : "text-[var(--color-brand-secondary)] hover:text-gray-900"}`}
            >
              管理者権限
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {activeTab === "general" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] mb-4">
                  データ管理
                </h3>
                <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl overflow-hidden divide-y divide-[var(--color-border-main)]">
                  {[
                    "保存先パス設定",
                    "自動バックアップ設定",
                    "データのエクスポート",
                  ].map((item) => (
                    <div
                      key={item}
                      className="p-4 flex items-center justify-between hover:bg-[var(--color-border-main)]/5 cursor-pointer"
                    >
                      <span className="text-sm">{item}</span>
                      <ChevronRight className="w-4 h-4 text-[var(--color-brand-secondary)]" />
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-secondary)] mb-4">
                  外観設定
                </h3>
                <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">ダークモード</span>
                    <span className="text-xs text-[var(--color-brand-secondary)]">
                      システム全体のカラーテーマを切り替えます。
                    </span>
                  </div>
                  <ThemeToggle />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "display" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <section className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex gap-3 mb-6">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  レポート出力時に使用されるデフォルトの通貨と割引率、および各通貨から基軸通貨（JPY）への換算レートを設定します。
                  案件ごとの個別設定は、案件編集画面の「生産条件」タブから変更可能です。
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold">基本会計設定</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                        デフォルト・レポート通貨
                      </label>
                      <select
                        value={settings.defaultCurrency}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            defaultCurrency: e.target.value,
                          })
                        }
                        className="w-full bg-[var(--color-border-main)]/5 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      >
                        {CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                        デフォルト割引率 (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={settings.defaultDiscountRate}
                          onChange={(e) =>
                            onUpdateSettings({
                              ...settings,
                              defaultDiscountRate: e.target.value,
                            })
                          }
                          className="w-full bg-[var(--color-border-main)]/5 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-brand-secondary)]">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl p-6 space-y-4 shadow-sm">
                  <div className="flex flex-col gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold">
                        為替レート設定 (1 {settings.defaultCurrency}あたり)
                      </h3>
                    </div>
                    {settings.exchangeRateSource &&
                      settings.exchangeRateDate && (
                        <p className="text-xs text-[var(--color-brand-secondary)]">
                          ※ 現在の為替レートは、「{settings.exchangeRateSource}
                          」の「{settings.exchangeRateDate}
                          」時点のものを参照しています。
                        </p>
                      )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                        参照元
                      </label>
                      <input
                        type="text"
                        value={settings.exchangeRateSource || ""}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            exchangeRateSource: e.target.value,
                          })
                        }
                        className="w-full bg-[var(--color-border-main)]/5 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        placeholder="例: 三菱UFJ銀行"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                        参照日時
                      </label>
                      <input
                        type="date"
                        value={settings.exchangeRateDate || ""}
                        onChange={(e) =>
                          onUpdateSettings({
                            ...settings,
                            exchangeRateDate: e.target.value,
                          })
                        }
                        className="w-full bg-[var(--color-border-main)]/5 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {CURRENCIES.filter(
                      (c) => c.code !== settings.defaultCurrency,
                    ).map((c) => (
                      <div key={c.code} className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase">
                          {c.name} ({c.code})
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.0001"
                            value={settings.exchangeRates[c.code] || ""}
                            onChange={(e) =>
                              handleRateChange(c.code, e.target.value)
                            }
                            className="w-full bg-[var(--color-border-main)]/5 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 pr-10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--color-brand-secondary)] uppercase font-bold">
                            {settings.defaultCurrency}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "admin" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <section className="bg-red-50/5 dark:bg-red-900/5 border border-red-200 dark:border-red-900/30 rounded-xl p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-red-950 dark:text-red-400">
                      管理者モード
                    </span>
                    <span className="text-sm text-red-800 dark:text-red-500/80">
                      設備構造の定義やシステムマスタのメンテナンス。機密設定の変更が可能になります。
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsAdmin(!isAdmin)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-transform duration-300 focus:outline-none ${isAdmin ? "bg-red-600" : "bg-gray-200 dark:bg-gray-700"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${isAdmin ? "translate-x-[22px]" : "translate-x-[4px]"}`}
                  />
                </button>
              </section>

              <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-xl overflow-hidden divide-y divide-[var(--color-border-main)] opacity-50 pointer-events-none">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">ユーザー管理</span>
                    <span className="text-[10px] text-[var(--color-brand-secondary)]">
                      アクセス権限とグループの設定
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-brand-secondary)]" />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      システムログ表示
                    </span>
                    <span className="text-[10px] text-[var(--color-brand-secondary)]">
                      操作履歴とエラーログの確認
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-brand-secondary)]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- Common UI Components ---
// --- UI Components ---
function ContentEditCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-[var(--color-border-main)] bg-[var(--color-border-main)]/5 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-600/5 text-blue-600">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

function LongTextField({
  label,
  value,
  placeholder,
  onChange,
  readOnly = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => !readOnly && onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full min-h-[120px] bg-[var(--color-border-main)]/5 border border-[var(--color-border-main)]/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600/50 transition-all resize-y ${readOnly ? "opacity-60 cursor-default" : ""}`}
      />
    </div>
  );
}

function SimpleInputField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-2 bg-[var(--color-border-main)]/5 rounded-lg border border-[var(--color-border-main)]/10">
      <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="text-sm font-medium bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-gray-400"
      />
    </div>
  );
}

const OPTION_EXAMPLES: Record<string, string> = {
  // 導入目的
  省人化: "◯◯工程現状◯人から◯人へ削減",
  生産能力向上: "◯◯工程のサイクルタイムを◯秒から◯秒に短縮し生産量を◯%向上",
  品質安定化: "手作業によるバラツキを排除し、不良率を◯%から◯%へ低減",
  安全性向上: "重量物搬送の自動化により腰痛リスクおよび接触災害リスクをゼロ化",
  コスト低減: "内製化により外注加工費を年間◯万円削減",

  // 背景分類
  受注増加: "主要顧客からの次期モデル受注に伴い、現行キャパシティ不足を解消",
  設備老朽化:
    "導入後◯年が経過し、予備部品の供給終了（EOL）により故障時の長期停止リスク増",

  // 課題分類
  生産能力不足: "現状の月産◯個に対し、計画値が◯個に増加するため◯個分の能力不足",
  故障頻度増加:
    "直近1年間の突発故障回数が◯回に達し、稼働率が当初計画を◯%下回る",

  // 影響分類
  納期遅延:
    "導入を見送る場合、増加する受注に対応できず供給責任が果たせない可能性",
  外注費増加: "自社生産不可能なため外部委託を継続し、年間◯万円の利益を圧迫",
};

export const buildEvaluatedTree = (
  nodes: TreeNodeInfo[],
  project: any,
): TreeNodeInfo[] => {
  return nodes.map((node) => {
    let disabled = false;
    let reason = "";

    if (!node.children || node.children.length === 0) {
      switch (node.id) {
        case "management.subject":
          if (!project.title) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "management.project_no":
          if (!project.projectNo) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "management.author":
          if (!project.applicant) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "management.department":
          if (!project.department) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "management.created_date":
          if (!project.updatedDate) {
            disabled = true;
            reason = "未入力";
          }
          break;

        case "schedule.approval_date":
          if (!project.scheduleApproval) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "schedule.order_date":
          if (!project.scheduleOrder) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "schedule.delivery_date":
          if (!project.scheduleInstall && !project.scheduleMassProd) {
            disabled = true;
            reason = "未入力";
          }
          break;

        case "approval.purpose":
          if (
            !project.purposeDetail &&
            (!project.introPurpose || project.introPurpose.length === 0)
          ) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "approval.background":
          if (
            !project.bgDetail &&
            (!project.bgCategories || project.bgCategories.length === 0)
          ) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "approval.reason":
          if (
            !project.reasonIntro &&
            !project.reasonChoice &&
            !project.reasonExisting
          ) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "approval.impact":
          if (
            !project.impactDetail &&
            (!project.impactCategories || project.impactCategories.length === 0)
          ) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "approval.issues":
          if (
            !project.issueDetail &&
            (!project.issueCategories || project.issueCategories.length === 0)
          ) {
            disabled = true;
            reason = "未入力";
          }
          break;

        case "conditions.common.operating_days":
          if (!project.workingDaysPerMonth) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "conditions.common.operating_hours":
          if (!project.workingHoursPerDay) {
            disabled = true;
            reason = "未入力";
          }
          break;

        case "scenarios.overview":
          if (!project.scenarios || project.scenarios.length === 0) {
            disabled = true;
            reason = "未入力";
          }
          break;
        case "scenarios.line_units":
          if (
            !project.scenarios ||
            project.scenarios.every(
              (s: any) => !s.lineUnits || s.lineUnits.length === 0,
            )
          ) {
            disabled = true;
            reason = "データなし";
          }
          break;
        case "scenarios.equipment_details":
          if (
            !project.scenarios ||
            project.scenarios.every(
              (s: any) => !s.equipmentList || s.equipmentList.length === 0,
            )
          ) {
            disabled = true;
            reason = "データなし";
          }
          break;

        case "scenarios.effect":
          if (
            !project.scenarios ||
            project.scenarios.every((s: any) => !s.annualEffect)
          ) {
            disabled = true;
            reason = "効果未算出";
          }
          break;
        case "scenarios.roi":
          if (
            !project.scenarios ||
            project.scenarios.every((s: any) => !s.roi)
          ) {
            disabled = true;
            reason = "基準値不足";
          }
          break;
        case "scenarios.bep":
          if (
            !project.scenarios ||
            project.scenarios.every((s: any) => !s.annualEffect)
          ) {
            disabled = true;
            reason = "基準値不足";
          }
          break;
        case "scenarios.labor_cost":
          if (
            !project.scenarios ||
            project.scenarios.every((s: any) => !s.targetStaffVal)
          ) {
            disabled = true;
            reason = "人員設定なし";
          }
          break;

        case "conclusion.summary":
          if (!project.reportConclusion) {
            disabled = true;
            reason = "未入力";
          }
          break;
      }
    }

    let mappedChildren = undefined;
    if (node.children) {
      mappedChildren = buildEvaluatedTree(node.children, project);
      if (mappedChildren.every((c) => c.disabled)) {
        disabled = true;
      }
    }

    return {
      ...node,
      children: mappedChildren,
      disabled,
      reason,
    };
  });
};

function TreeChecklist({
  nodes,
  selected,
  onChange,
}: {
  nodes: TreeNodeInfo[];
  selected: string[];
  onChange: (selectedIds: string[]) => void;
}) {
  const [expanded, setExpanded] = useState<string[]>(nodes.map((n) => n.id));

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const getAllDescendantIds = (node: TreeNodeInfo): string[] => {
    let ids: string[] = [];
    if (node.children) {
      for (const child of node.children) {
        ids.push(child.id);
        ids.push(...getAllDescendantIds(child));
      }
    }
    return ids;
  };

  const findNode = (
    nodesList: TreeNodeInfo[],
    targetId: string,
  ): TreeNodeInfo | null => {
    for (const n of nodesList) {
      if (n.id === targetId) return n;
      if (n.children) {
        const found = findNode(n.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const getCheckState = (
    node: TreeNodeInfo,
  ): "checked" | "unchecked" | "indeterminate" => {
    if (!node.children || node.children.length === 0) {
      if (node.disabled) return "unchecked";
      return selected.includes(node.id) ? "checked" : "unchecked";
    }
    const descendantIds = getAllDescendantIds(node);
    const leafIds = descendantIds.filter((id) => {
      const n = findNode(nodes, id);
      return n && (!n.children || n.children.length === 0) && !n.disabled;
    });
    if (leafIds.length === 0) return "unchecked";

    const checkedCount = leafIds.filter((id) => selected.includes(id)).length;
    if (checkedCount === 0) return "unchecked";
    if (checkedCount === leafIds.length) return "checked";
    return "indeterminate";
  };

  const handleCheck = (node: TreeNodeInfo) => {
    if (node.disabled) return;
    const currentState = getCheckState(node);
    const isLeaf = !node.children || node.children.length === 0;

    if (isLeaf) {
      if (currentState === "checked") {
        onChange(selected.filter((id) => id !== node.id));
      } else {
        onChange([...selected, node.id]);
      }
    } else {
      const leafIds = getAllDescendantIds(node).filter((id) => {
        const n = findNode(nodes, id);
        return n && (!n.children || n.children.length === 0) && !n.disabled;
      });

      if (leafIds.length === 0) return;

      if (currentState === "checked") {
        onChange(selected.filter((id) => !leafIds.includes(id)));
      } else {
        const newSelected = [...selected];
        for (const id of leafIds) {
          if (!newSelected.includes(id)) newSelected.push(id);
        }
        onChange(newSelected);
      }
    }
  };

  const renderNode = (node: TreeNodeInfo, depth: number) => {
    const isExpanded = expanded.includes(node.id);
    const checkState = getCheckState(node);
    const isDisabled = node.disabled;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          className={`flex items-center gap-2 py-1.5 px-2 rounded select-none transition-colors 
            ${depth === 0 ? "mt-3 first:mt-0" : ""} 
            ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-[var(--color-border-main)]/5"}
          `}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => {
            if (!isDisabled) handleCheck(node);
          }}
        >
          <div
            className={`w-4 h-4 flex items-center justify-center cursor-pointer transition-colors 
              ${!node.children ? "opacity-0 pointer-events-none" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}
            `}
            onClick={(e) => {
              if (node.children) toggleExpand(node.id, e);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </div>
          <div
            className={`flex items-center transition-colors ${isDisabled ? "text-gray-400" : "text-[var(--color-brand-secondary)] hover:text-[var(--color-brand-primary)]"}`}
          >
            {checkState === "checked" && (
              <CheckSquare
                className={`w-4 h-4 ${isDisabled ? "text-gray-400" : "text-emerald-600"}`}
              />
            )}
            {checkState === "unchecked" && (
              <Square className="w-4 h-4 opacity-50" />
            )}
            {checkState === "indeterminate" && (
              <MinusSquare
                className={`w-4 h-4 ${isDisabled ? "text-gray-400" : "text-emerald-500"}`}
              />
            )}
          </div>
          <span
            className={`text-sm flex items-center gap-2 ${depth === 0 ? "font-bold" : depth === 1 ? "font-semibold" : "text-gray-700 dark:text-gray-300"}`}
          >
            {node.label}
            {isDisabled && node.reason && (
              <span className="text-xs font-normal text-red-500 dark:text-red-400">
                ({node.reason})
              </span>
            )}
          </span>
        </div>
        {node.children && isExpanded && (
          <div className="flex flex-col">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1 rounded-xl p-4 bg-[var(--color-border-main)]/5 border border-[var(--color-border-main)]/20 shadow-sm max-h-[70vh] overflow-y-auto">
      {nodes.map((node) => renderNode(node, 0))}
    </div>
  );
}

function BadgeSelect({
  label,
  options,
  selected = [],
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((i) => i !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const activeExamples = (selected || [])
    .map((s) => OPTION_EXAMPLES[s])
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      <label className="text-[11px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = (selected || []).includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 font-bold shadow-sm"
                  : "bg-[var(--color-border-main)]/10 text-[var(--color-brand-secondary)] border-transparent hover:border-[var(--color-border-main)]/40 hover:bg-[var(--color-border-main)]/20"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {activeExamples.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  入力のヒント
                </span>
              </div>
              {activeExamples.map((ex, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed block py-0.5">
                    {ex}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PURPOSE_OPTIONS = [
  "生産能力向上",
  "省人化",
  "品質安定化",
  "不良率低減",
  "安全性向上",
  "老朽設備更新",
  "保守性向上",
  "新製品対応",
  "外注費削減",
  "残業削減",
  "作業負荷低減",
  "省エネ",
  "法令・顧客要求対応",
  "レイアウト改善",
  "コスト低減",
];

const BACKGROUND_OPTIONS = [
  "受注増加",
  "新規案件対応",
  "生産量増加",
  "設備老朽化",
  "故障頻度増加",
  "部品供給終了",
  "作業者不足",
  "熟練者依存",
  "品質要求強化",
  "安全基準対応",
  "顧客要求対応",
  "外注依存",
  "コスト増加",
  "納期逼迫",
  "工程ボトルネック",
];

const ISSUE_OPTIONS = [
  "生産能力不足",
  "人員不足",
  "作業時間過多",
  "残業増加",
  "外注費増加",
  "不良率増加",
  "品質ばらつき",
  "設備停止増加",
  "修理費増加",
  "保守部品廃番",
  "安全リスク",
  "重量物作業",
  "作業者依存",
  "工程間搬送ロス",
  "段取り時間過多",
  "エネルギーコスト増",
];

const IMPACT_OPTIONS = [
  "納期遅延",
  "受注機会損失",
  "外注費増加",
  "残業増加",
  "品質不良継続",
  "設備故障停止",
  "修理費増加",
  "安全リスク継続",
  "人員不足悪化",
  "顧客要求未達",
  "生産能力不足",
  "利益率悪化",
];

function ClassificationTree({
  schemas,
  selectedId,
  onSelect,
}: {
  schemas: EquipmentSchema[];
  selectedId?: string;
  onSelect: (schema: EquipmentSchema) => void;
}) {
  const tree = React.useMemo(() => {
    const categories: Record<string, Record<string, EquipmentSchema[]>> = {};
    schemas.forEach((s) => {
      if (s.id === "global_common") return; // Skip global common from the selection tree
      if (!s.category || s.category.trim() === "") return;
      if (!s.subCategory || s.subCategory.trim() === "") return;
      if (!categories[s.category]) categories[s.category] = {};
      if (!categories[s.category][s.middleCategory])
        categories[s.category][s.middleCategory] = [];
      categories[s.category][s.middleCategory].push(s);
    });
    return categories;
  }, [schemas]);

  return (
    <div className="space-y-4">
      {Object.entries(tree).map(([cat, middles]) => (
        <div key={cat} className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <Layers className="w-3 h-3" />
            {cat}
          </div>
          <div className="pl-4 space-y-3 border-l-2 border-gray-100 dark:border-gray-800 ml-2">
            {Object.entries(middles).map(([mid, subs]) => {
              const validSubs = subs.filter(
                (sub) => sub.subCategory && sub.subCategory.trim() !== "",
              );
              if (validSubs.length === 0) return null;
              return (
                <div key={mid} className="space-y-1.5">
                  <div className="text-[10px] font-bold text-[var(--color-brand-secondary)] px-2">
                    {mid}
                  </div>
                  <div className="pl-2 flex flex-wrap gap-1.5">
                    {validSubs.map((sub) => {
                      const isSelected = selectedId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => onSelect(sub)}
                          className={`group relative px-3 py-1.5 rounded-lg text-xs transition-all border shadow-sm ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 font-bold ring-2 ring-blue-600/20"
                              : "bg-white dark:bg-gray-900 border-[var(--color-border-main)] text-[var(--color-brand-secondary)] hover:border-blue-600/30 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                          }`}
                        >
                          {sub.subCategory}
                          {isSelected && (
                            <motion.div
                              layoutId="selected-category-glow"
                              className="absolute inset-0 rounded-lg bg-blue-400/20 animate-pulse"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EditSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-[var(--color-border-main)] bg-[var(--color-border-main)]/5 flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}

function EditField({
  label,
  value,
  placeholder,
  badge = false,
  readOnly = false,
  onChange,
  unit,
  suggestions = [],
  type = "text",
  forceSelect = false,
  disabled = false,
  onAddSuggestion,
  onDeleteSuggestion,
}: {
  label: string;
  value: string;
  placeholder?: string;
  badge?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  unit?: string;
  suggestions?: string[] | { fieldPath: string; items: string[] };
  type?: "text" | "number";
  forceSelect?: boolean;
  disabled?: boolean;
  onAddSuggestion?: (val: string) => void;
  onDeleteSuggestion?: (val: string) => void;
}) {
  const settingsContext = useContext(SettingsContext);

  const suggestionsList = Array.isArray(suggestions)
    ? suggestions
    : suggestions.items;
  const fieldPath = Array.isArray(suggestions)
    ? undefined
    : suggestions.fieldPath;

  const handleAdd =
    onAddSuggestion ||
    ((val: string) => {
      if (fieldPath && settingsContext.onAddSuggestion) {
        settingsContext.onAddSuggestion(fieldPath, val);
      }
    });

  const handleDelete =
    onDeleteSuggestion ||
    ((val: string) => {
      if (fieldPath && settingsContext.onDeleteSuggestion) {
        settingsContext.onDeleteSuggestion(fieldPath, val);
      }
    });

  const hasSuggestions = suggestionsList && suggestionsList.length > 0;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        if (value) {
          handleAdd(value);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, handleAdd]);

  return (
    <div
      className={`flex flex-col gap-1.5 px-4 py-2 rounded-lg border transition-all ${
        readOnly || disabled
          ? "bg-gray-50/50 dark:bg-gray-800/30 border-gray-100 dark:border-gray-800 opacity-90"
          : "bg-white dark:bg-gray-900 border-[var(--color-border-main)] hover:border-blue-600/30 focus-within:border-blue-600/50 focus-within:ring-1 focus-within:ring-blue-600/20"
      } ${disabled ? "opacity-50 grayscale pointer-events-none" : ""}`}
      ref={dropdownRef}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
          {label}
        </span>
        {readOnly || disabled ? (
          <Lock className="w-2.5 h-2.5 text-gray-400" />
        ) : (
          <div className="flex items-center gap-1.5">
            <Pencil className="w-2.5 h-2.5 text-blue-600/40" />
          </div>
        )}
      </div>
      {badge ? (
        <div className="flex">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/10 text-blue-600 border border-blue-600/20">
            {value}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 relative">
          <input
            type={type}
            value={value || ""}
            readOnly={readOnly}
            disabled={disabled}
            onChange={(e) => {
              onChange?.(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setIsDropdownOpen(false);
                if (value) {
                  handleAdd(value);
                }
              }
            }}
            className={`text-sm font-medium bg-transparent border-none p-0 focus:ring-0 w-full placeholder:text-gray-400 ${readOnly || disabled ? "cursor-default text-gray-500 dark:text-gray-400" : "cursor-text text-gray-900 dark:text-gray-100"}`}
            placeholder={placeholder || `${label}を入力...`}
          />
          {unit && (
            <span className="text-xs text-[var(--color-brand-secondary)] font-bold whitespace-nowrap mb-0.5">
              {unit}
            </span>
          )}

          {hasSuggestions && isDropdownOpen && !readOnly && !disabled && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-gray-800 border border-[var(--color-border-main)] shadow-lg rounded-lg max-h-48 overflow-y-auto z-50 py-1 custom-scrollbar">
              {suggestionsList.map((opt, i) => (
                <div
                  key={`${opt}-${i}`}
                  className="flex justify-between items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group"
                  onClick={() => {
                    onChange?.(opt);
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis mr-2">
                    {opt}
                  </span>
                  {handleDelete && fieldPath && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(opt);
                      }}
                      className="p-1 rounded-md text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                      title="この選択肢を削除"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SpecItem({
  label,
  value,
  unit,
  highlight = false,
  color,
  span = 1,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  color?: string;
  span?: number;
}) {
  return (
    <div className={`space-y-1 ${span === 2 ? "md:col-span-2" : ""}`}>
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-tight">
          {label}
        </label>
        <Lock className="w-2.5 h-2.5 text-gray-400 opacity-50" />
      </div>
      <div className="flex items-baseline gap-1">
        <p
          className={`font-mono ${highlight ? "text-lg font-bold" : "text-sm font-medium"} ${color || (highlight ? "text-blue-600" : "text-gray-900 dark:text-gray-100")}`}
        >
          {value}
        </p>
        {unit && (
          <span className="text-[10px] text-[var(--color-brand-secondary)]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function PlaceholderResult({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-[var(--color-border-main)]/5 rounded-xl border border-dashed border-[var(--color-border-main)]/20">
      <span className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs text-gray-400 italic">
        将来計算結果表示エリア
      </span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
  subLabel,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  subLabel?: string;
  icon: LucideIcon;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-600/5 text-blue-600",
    emerald: "bg-emerald-600/5 text-emerald-600",
    indigo: "bg-indigo-600/5 text-indigo-600",
    purple: "bg-purple-600/5 text-purple-600",
    amber: "bg-amber-600/5 text-amber-600",
    rose: "bg-rose-600/5 text-rose-600",
    gray: "bg-gray-600/5 text-gray-600",
  };

  return (
    <div className="bg-[var(--color-bg-main)] border border-[var(--color-border-main)] p-4 rounded-xl shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${colors[color]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold text-[var(--color-brand-secondary)] uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold">{value}</span>
          <span className="text-[10px] text-[var(--color-brand-secondary)]">
            {unit}
          </span>
        </div>
      </div>
      {subLabel && (
        <div className="mt-2 text-[10px] text-[var(--color-brand-secondary)] opacity-60 border-t border-[var(--color-border-main)]/50 pt-1 italic">
          {subLabel}
        </div>
      )}
    </div>
  );
}

function NewProjectModal({
  onClose,
  onSubmit,
  suggestedNo,
  projects,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  suggestedNo: string;
  projects: any[];
  key?: string;
}) {
  const [formData, setFormData] = useState({
    projectNo: suggestedNo,
    title: "",
    department: "",
    applicant: "",
    investmentType: "更新",
  });

  // Extract unique departments and applicants for suggestions
  const departmentSuggestions = useMemo(() => {
    return Array.from(
      new Set(projects.map((p) => p.applicationDepartment).filter(Boolean)),
    );
  }, [projects]);

  const applicantSuggestions = useMemo(() => {
    return Array.from(
      new Set(projects.map((p) => p.applicant).filter(Boolean)),
    );
  }, [projects]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-[var(--color-bg-main)] rounded-2xl shadow-2xl border border-[var(--color-border-main)] overflow-hidden"
      >
        <div className="p-6 border-b border-[var(--color-border-main)] flex items-center justify-between">
          <h3 className="text-xl font-bold">新規案件作成</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-border-main)]/20 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 rotate-90" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-brand-secondary)]">
                案件番号 *
              </label>
              <input
                type="text"
                placeholder="2026-001"
                className="w-full bg-[var(--color-border-main)]/10 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                value={formData.projectNo}
                onChange={(e) =>
                  setFormData({ ...formData, projectNo: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-brand-secondary)]">
                投資区分
              </label>
              <select
                className="w-full bg-[var(--color-border-main)]/10 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                value={formData.investmentType}
                onChange={(e) =>
                  setFormData({ ...formData, investmentType: e.target.value })
                }
              >
                <option>新規</option>
                <option>更新</option>
                <option>合理化</option>
                <option>増産</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-brand-secondary)]">
              案件名（件名）*
            </label>
            <input
              type="text"
              placeholder="例：第2工場プレス機自動化の件"
              className="w-full bg-[var(--color-border-main)]/10 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-brand-secondary)]">
                申請部署
              </label>
              <input
                type="text"
                list="department-suggestions"
                placeholder="生産技術部"
                className="w-full bg-[var(--color-border-main)]/10 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
              <datalist id="department-suggestions">
                {departmentSuggestions.map((dept) => (
                  <option key={dept} value={dept} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-brand-secondary)]">
                申請者
              </label>
              <input
                type="text"
                list="applicant-suggestions"
                placeholder="山田 太郎"
                className="w-full bg-[var(--color-border-main)]/10 border border-[var(--color-border-main)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                value={formData.applicant}
                onChange={(e) =>
                  setFormData({ ...formData, applicant: e.target.value })
                }
              />
              <datalist id="applicant-suggestions">
                {applicantSuggestions.map((app) => (
                  <option key={app} value={app} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[var(--color-border-main)] rounded-xl text-sm font-medium hover:bg-[var(--color-border-main)]/10 transition-colors"
            >
              キャンセル
            </button>
            <button
              disabled={!formData.projectNo.trim() || !formData.title.trim()}
              onClick={() => {
                if (formData.projectNo.trim() && formData.title.trim())
                  onSubmit(formData);
              }}
              className={`flex-[2] px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] ${
                !formData.projectNo.trim() || !formData.title.trim()
                  ? "bg-gray-400 cursor-not-allowed opacity-50"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
              }`}
            >
              案件を作成する
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SidebarSubItem({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer relative group ${
        active
          ? "bg-white dark:bg-gray-800 text-blue-600 font-bold shadow-sm ring-1 ring-black/5 dark:ring-white/5"
          : "text-[var(--color-brand-secondary)] hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-[var(--color-text-main)]"
      }`}
    >
      <Icon
        className={`w-3.5 h-3.5 ${active ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"}`}
      />
      <span className="text-[11px] leading-none">{label}</span>
      {active && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute left-0 w-1 h-4 bg-blue-600 rounded-r-full"
        />
      )}
    </div>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${
        active
          ? "bg-blue-600/10 text-blue-600 font-bold shadow-inner"
          : !disabled
            ? "hover:bg-[var(--color-border-main)]/20 text-[var(--color-brand-secondary)] hover:text-[var(--color-text-main)]"
            : ""
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? "text-blue-600" : ""}`} />
      <span className="text-sm">{label}</span>
      {active && (
        <motion.div layoutId="navArrow" className="ml-auto">
          <ChevronRight className="w-3 h-3" />
        </motion.div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-[var(--color-border-main)] hover:bg-[var(--color-border-main)]/10 transition-all overflow-hidden relative w-10 h-10 flex items-center justify-center bg-[var(--color-bg-main)] shadow-sm"
      aria-label="Toggle Theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {theme === "light" ? (
            <Moon className="w-5 h-5 text-gray-700" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-400" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
