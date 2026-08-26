export type ElementType = 
  | 'Columna' 
  | 'Viga' 
  | 'Losa' 
  | 'Muro Estructural' 
  | 'Zapata' 
  | 'Pavimento / Piso' 
  | 'Pilote' 
  | 'Cimentación' 
  | 'Pedestal' 
  | 'Otro';

export type ImpactAngle = 0 | 90 | -90 | 45 | -45;

export type SurfaceCondition = 
  | 'Seco al aire' 
  | 'Húmedo' 
  | 'Pulido con piedra Carborundum' 
  | 'Encofrado metálico liso' 
  | 'Encofrado de madera';

export type CurveModel = 
  | 'SCHMIDT_N_DIRECT'
  | 'PROCEQ_N_STANDARD' 
  | 'PROCEQ_N_CUBE'
  | 'NSR10_COLOMBIA' 
  | 'ASTM_POLYNOMIAL'
  | 'CUSTOM_CALIBRATED';

export type TestStatus = 'CUMPLE' | 'DUDOSO' | 'NO_CUMPLE' | 'INVALIDO' | 'DIAGNOSTICO';

export interface TestPhoto {
  id: string;
  dataUrl: string;
  caption?: string;
  timestamp: number;
}

export interface SclerometryTest {
  id: string;
  projectId: string;
  elementTag: string; // ej: C-101, V-204, Losa Nivel 3
  elementType: ElementType;
  levelAxis: string; // ej: Nivel +3.50 / Eje B-4
  fcDesignMpa: number; // Resistencia de diseño (ej: 21, 28, 35 MPa)
  fcDesignPsi: number; // Correspondiente en PSI (ej: 3000, 4000, 5000)
  concreteAgeDays: number; // Edad del concreto en días
  hammerModel: string; // ej: Schmidt Tipo N
  hammerSerial: string;
  impactAngle: ImpactAngle;
  surfaceCondition: SurfaceCondition;
  carbonationDepthMm: number; // Profundidad de carbonatación (fenolftaleína)
  curveModel: CurveModel;
  customCurveParams?: {
    a: number;
    b: number;
    description: string;
  };
  readings: number[]; // 10 a 12 lecturas
  excludedIndices: number[]; // Índices descartados por norma (> 6 del promedio)
  meanRaw: number; // Promedio aritmético de lecturas válidas
  correctionAngle: number; // Delta R según ángulo
  meanCorrected: number; // R corregido
  stdDev: number; // Desviación estándar
  cov: number; // Coeficiente de variación (%)
  estimatedFcMpa: number; // Resistencia estimada f'c en MPa
  estimatedFcKgcm2: number; // en kg/cm²
  estimatedFcPsi: number; // en PSI
  complianceRatio: number; // % respecto al f'c de diseño (estimated / design * 100)
  status: TestStatus;
  statusNotes: string;
  photos: TestPhoto[];
  notes?: string;
  operatorName: string;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  code: string; // ej: PRJ-2026-01
  name: string;
  client: string;
  location: string; // ej: Carrera 7 # 72-41
  municipality: string; // ej: Bogotá D.C.
  department: string; // ej: Cundinamarca
  contractor: string;
  supervision: string;
  engineerInCharge: string;
  licenseNumber?: string; // Tarjeta profesional
  defaultHammerModel: string;
  defaultHammerSerial: string;
  defaultCurve: CurveModel;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  testsCount?: number;
  userId?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  provider?: string;
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
