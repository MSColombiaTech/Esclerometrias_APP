import { Project, SclerometryTest } from '../types';
import { evaluateSclerometryTest } from './sclerometryNorms';

const STORAGE_PROJECTS_KEY = 'esclerometria_pro_projects_v2';
const STORAGE_TESTS_KEY = 'esclerometria_pro_tests_v2';
const STORAGE_ACTIVE_PROJECT_KEY = 'esclerometria_pro_active_prj_v2';

export function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
    if (!raw) {
      const initial = getInitialProjects();
      saveProjects(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading projects from storage', e);
    return getInitialProjects();
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
}

export function getStoredTests(): SclerometryTest[] {
  try {
    const raw = localStorage.getItem(STORAGE_TESTS_KEY);
    if (!raw) {
      const initial = getInitialTests();
      saveTests(initial);
      return initial;
    }
    const parsed: SclerometryTest[] = JSON.parse(raw);
    
    // Auto-recalculate each test with the high-precision calibrated engine to guarantee consistency
    const recalibrated = parsed.map(t => {
      const carbonationFactor = t.carbonationDepthMm && t.carbonationDepthMm > 5 ? 0.94 : 1.0;
      const evalRes = evaluateSclerometryTest(
        t.readings,
        t.impactAngle,
        t.fcDesignMpa,
        t.curveModel || 'PROCEQ_N_STANDARD',
        carbonationFactor,
        t.customCurveParams
      );

      return {
        ...t,
        excludedIndices: evalRes.excludedIndices,
        meanRaw: evalRes.meanRaw,
        correctionAngle: evalRes.correctionAngle,
        meanCorrected: evalRes.meanCorrected,
        stdDev: evalRes.stdDev,
        cov: evalRes.cov,
        estimatedFcMpa: evalRes.estimatedFcMpa,
        estimatedFcKgcm2: evalRes.estimatedFcKgcm2,
        estimatedFcPsi: evalRes.estimatedFcPsi,
        complianceRatio: evalRes.complianceRatio,
        status: evalRes.status,
        statusNotes: evalRes.statusNotes
      };
    });

    return recalibrated;
  } catch (e) {
    console.error('Error loading tests from storage', e);
    return getInitialTests();
  }
}

export function saveTests(tests: SclerometryTest[]): void {
  localStorage.setItem(STORAGE_TESTS_KEY, JSON.stringify(tests));
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(STORAGE_ACTIVE_PROJECT_KEY) || (getStoredProjects()[0]?.id ?? null);
}

export function setActiveProjectId(id: string): void {
  localStorage.setItem(STORAGE_ACTIVE_PROJECT_KEY, id);
}

// Generador de datos iniciales representativos de ingeniería en Colombia
function getInitialProjects(): Project[] {
  const now = Date.now();
  return [
    {
      id: 'prj-bogota-01',
      code: 'OBRA-BOG-2026-04',
      name: 'Edificio Residencial Torres de Monserrate',
      client: 'Constructora Bolívar S.A.',
      location: 'Calle 94 # 11A-32, Chicó Norte',
      municipality: 'Bogotá D.C.',
      department: 'Cundinamarca',
      contractor: 'Ingeniería & Estructuras Andinas SAS',
      supervision: 'Interventoría Técnica Colombiana SAS',
      engineerInCharge: 'Ing. Carlos Andrés Restrepo M.',
      licenseNumber: 'TP 25202-18456 CND',
      defaultHammerModel: 'Schmidt Original Tipo N (2.207 Nm)',
      defaultHammerSerial: 'SCH-N-88492-COL',
      defaultCurve: 'PROCEQ_N_STANDARD',
      notes: 'Evaluación de control de calidad no destructivo en elementos de concreto reforzado a los 28 días según NSR-10 Título C.',
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 1
    },
    {
      id: 'prj-girardot-02',
      code: 'INFRA-GIR-2026-11',
      name: 'Puente Vehicular Río Magdalena - Variante Girardot',
      client: 'Agencia Nacional de Infraestructura (ANI)',
      location: 'Sector Puente Flandes - Girardot, PK 12+400',
      municipality: 'Girardot',
      department: 'Cundinamarca',
      contractor: 'Consorcio Vial Magdalena Centro',
      supervision: 'Consorcio Interventor del Río',
      engineerInCharge: 'Ing. María Fernanda Gómez',
      licenseNumber: 'TP 25202-99321 CND',
      defaultHammerModel: 'SilverSchmidt Tipo N Electrónico',
      defaultHammerSerial: 'SS-N-44102-B',
      defaultCurve: 'NSR10_COLOMBIA',
      notes: 'Verificación de homogeneidad y resistencia en estribos, vigas postensadas y pilas en concreto de 35 MPa (5000 PSI).',
      createdAt: now - 86400000 * 12,
      updatedAt: now - 86400000 * 2
    }
  ];
}

function getInitialTests(): SclerometryTest[] {
  const now = Date.now();

  // Helper to build evaluation
  const createMockTest = (
    id: string,
    projectId: string,
    elementTag: string,
    elementType: any,
    levelAxis: string,
    fcDesignMpa: number,
    fcDesignPsi: number,
    age: number,
    angle: any,
    readings: number[],
    notes: string,
    createdAt: number
  ): SclerometryTest => {
    const evalRes = evaluateSclerometryTest(readings, angle, fcDesignMpa, 'PROCEQ_N_STANDARD', 1.0);
    return {
      id,
      projectId,
      elementTag,
      elementType,
      levelAxis,
      fcDesignMpa,
      fcDesignPsi,
      concreteAgeDays: age,
      hammerModel: 'Schmidt Original Tipo N (2.207 Nm)',
      hammerSerial: 'SCH-N-88492-COL',
      impactAngle: angle,
      surfaceCondition: 'Pulido con piedra Carborundum',
      carbonationDepthMm: 1.5,
      curveModel: 'PROCEQ_N_STANDARD',
      readings,
      excludedIndices: evalRes.excludedIndices,
      meanRaw: evalRes.meanRaw,
      correctionAngle: evalRes.correctionAngle,
      meanCorrected: evalRes.meanCorrected,
      stdDev: evalRes.stdDev,
      cov: evalRes.cov,
      estimatedFcMpa: evalRes.estimatedFcMpa,
      estimatedFcKgcm2: evalRes.estimatedFcKgcm2,
      estimatedFcPsi: evalRes.estimatedFcPsi,
      complianceRatio: evalRes.complianceRatio,
      status: evalRes.status,
      statusNotes: evalRes.statusNotes,
      photos: [],
      notes,
      operatorName: 'Tec. Jhon Fredy Piraquive',
      createdAt,
      updatedAt: createdAt
    };
  };

  return [
    // Prj 1 Tests (Edificio Torres de Monserrate)
    createMockTest(
      't-01', 'prj-bogota-01', 'C-101', 'Columna', 'Nivel 1 / Eje A-1 (Cara Norte)',
      28, 4000, 28, 0,
      [35, 36, 35, 37, 36, 35, 36, 35, 36, 35],
      'Superficie desbastada con piedra de carburo de silicio. Sonido metálico uniforme.',
      now - 86400000 * 3
    ),
    createMockTest(
      't-02', 'prj-bogota-01', 'C-102', 'Columna', 'Nivel 1 / Eje B-2 (Cara Este)',
      28, 4000, 28, 0,
      [34, 35, 35, 36, 34, 35, 35, 34, 35, 35],
      'Concreto homogéneo, buena compacidad en zona central.',
      now - 86400000 * 3
    ),
    createMockTest(
      't-03', 'prj-bogota-01', 'V-201', 'Viga', 'Nivel 2 / Eje 2 entre A y C (Fondo Viga)',
      28, 4000, 28, -90,
      [32, 33, 33, 31, 32, 33, 32, 33, 32, 33],
      'Impacto vertical hacia arriba (-90°) en fondo de viga desencofrada.',
      now - 86400000 * 2
    ),
    createMockTest(
      't-04', 'prj-bogota-01', 'LOSA-N3', 'Losa', 'Nivel 3 / Paño Central Ejes C-D',
      21, 3000, 28, 90,
      [35, 36, 35, 34, 35, 36, 35, 36, 35, 35],
      'Impacto vertical hacia abajo (+90°) sobre superficie superior afinada.',
      now - 86400000 * 2
    ),
    createMockTest(
      't-05', 'prj-bogota-01', 'M-CONT-01', 'Muro Estructural', 'Sótano 1 / Eje 1 Perimetral',
      28, 4000, 21, 0,
      [30, 31, 30, 29, 31, 30, 29, 30, 31, 30],
      'Lecturas en zona de desencofrado temprano. En seguimiento para verificación a los 28 días.',
      now - 86400000 * 1
    ),

    // Prj 2 Tests (Puente Río Magdalena)
    createMockTest(
      't-06', 'prj-girardot-02', 'PILOTE-P1', 'Pilote', 'Eje Central Pila 1 - Cabezal',
      35, 5000, 56, 0,
      [40, 41, 39, 41, 40, 40, 41, 39, 40, 40],
      'Excelente compactación en concreto estructural para cimentación profunda.',
      now - 86400000 * 8
    ),
    createMockTest(
      't-07', 'prj-girardot-02', 'ESTRIBO-OCC', 'Cimentación', 'Estribo Costado Occidental',
      35, 5000, 45, 0,
      [39, 40, 39, 41, 39, 40, 38, 40, 39, 40],
      'Prueba en cara vertical previa a colocación de apoyos elastoméricos.',
      now - 86400000 * 6
    ),
    createMockTest(
      't-08', 'prj-girardot-02', 'VIGA-POST-01', 'Viga', 'Viga Cajón 1 - Tramo Central',
      35, 5000, 28, -90,
      [36, 37, 36, 38, 36, 37, 36, 37, 36, 37],
      'Lectura vertical hacia arriba (-90°) en dovela postensada.',
      now - 86400000 * 4
    )
  ];
}

// Backup Export & Import
export function exportBackupJSON(): void {
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    projects: getStoredProjects(),
    tests: getStoredTests()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_Esclerometria_Pro_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.projects && Array.isArray(parsed.projects) && parsed.tests && Array.isArray(parsed.tests)) {
      saveProjects(parsed.projects);
      saveTests(parsed.tests);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error importing JSON backup', e);
    return false;
  }
}
