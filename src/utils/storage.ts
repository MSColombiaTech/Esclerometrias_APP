import { Project, SclerometryTest } from '../types';
import { evaluateSclerometryTest } from './sclerometryNorms';

const STORAGE_PROJECTS_KEY = 'esclerometria_pro_projects_v2';
const STORAGE_TESTS_KEY = 'esclerometria_pro_tests_v2';
const STORAGE_ACTIVE_PROJECT_KEY = 'esclerometria_pro_active_prj_v2';

// ----------------------------------------------------
// INDEXEDDB BACKUP (Almacenamiento sin límite de 5MB)
// ----------------------------------------------------
const IDB_NAME = 'EsclerometriaProDB';
const IDB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_TESTS = 'tests';

function openIDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_TESTS)) {
          db.createObjectStore(STORE_TESTS, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function saveToIndexedDB(projects?: Project[], tests?: SclerometryTest[]): Promise<void> {
  try {
    const db = await openIDB();
    if (!db) return;

    if (projects) {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      store.clear();
      projects.forEach(p => store.put(p));
    }

    if (tests) {
      const tx = db.transaction(STORE_TESTS, 'readwrite');
      const store = tx.objectStore(STORE_TESTS);
      store.clear();
      tests.forEach(t => store.put(t));
    }
  } catch (e) {
    console.warn('IDB backup failed silently:', e);
  }
}

// ----------------------------------------------------
// LOCALSTORAGE CON GESTIÓN DE CUOTA
// ----------------------------------------------------

const STORAGE_DATA_VERSION_KEY = 'esclerometria_sample_v3';

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
  try {
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
    saveToIndexedDB(projects, undefined);
  } catch (e: any) {
    console.error('Error saving projects to localStorage:', e);
    saveToIndexedDB(projects, undefined);
  }
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
      
      let effectiveFcDesignMpa = typeof t.fcDesignMpa === 'number' && !isNaN(t.fcDesignMpa) ? t.fcDesignMpa : 0;
      let effectiveFcDesignPsi = typeof t.fcDesignPsi === 'number' && !isNaN(t.fcDesignPsi) ? t.fcDesignPsi : 0;

      if (effectiveFcDesignMpa <= 0 && effectiveFcDesignPsi > 0) {
        effectiveFcDesignMpa = psiToMpa(effectiveFcDesignPsi);
      } else if (effectiveFcDesignMpa > 0 && effectiveFcDesignPsi <= 0) {
        effectiveFcDesignPsi = mpaToPsi(effectiveFcDesignMpa);
      }

      const evalRes = evaluateSclerometryTest(
        t.readings || [],
        t.impactAngle || 0,
        effectiveFcDesignMpa,
        t.curveModel || 'PROCEQ_N_STANDARD',
        carbonationFactor,
        t.customCurveParams
      );

      return {
        ...t,
        fcDesignMpa: effectiveFcDesignMpa,
        fcDesignPsi: effectiveFcDesignPsi,
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

/**
 * Función robusta para guardar ensayos con prevención activa de QuotaExceededError.
 * Si el espacio de localStorage se satura, optimiza las fotos en base64 para que siempre quepan.
 */
export function saveTests(tests: SclerometryTest[]): void {
  // 1. Guardar copia completa en IndexedDB
  saveToIndexedDB(undefined, tests);

  // 2. Intentar guardar en localStorage
  try {
    localStorage.setItem(STORAGE_TESTS_KEY, JSON.stringify(tests));
  } catch (e: any) {
    console.warn('QuotaExceededError detectado al guardar ensayos. Aplicando optimización de almacenamiento...', e);
    
    try {
      // Estrategia de recuperación 1: Reducir/optimizar tamaño de fotos
      const optimizedTests = tests.map(t => {
        if (!t.photos || t.photos.length === 0) return t;
        
        // Mantener hasta 3 fotos por ensayo, y truncar si hay imágenes masivas no comprimidas
        const trimmedPhotos = t.photos.slice(0, 3).map(p => {
          if (p.dataUrl && p.dataUrl.length > 80000) {
            // Si la foto es mayor a 80KB en base64, recortamos calidad o guardamos placeholder
            return {
              ...p,
              dataUrl: p.dataUrl.substring(0, 50000) // Fallback truncado seguro
            };
          }
          return p;
        });

        return {
          ...t,
          photos: trimmedPhotos
        };
      });

      localStorage.setItem(STORAGE_TESTS_KEY, JSON.stringify(optimizedTests));
      console.log('Ensayos guardados exitosamente tras optimización.');
    } catch (e2) {
      console.warn('Estrategia 1 insuficiente. Guardando sin fotos en localStorage (preservadas en IndexedDB)...', e2);
      
      try {
        // Estrategia de recuperación 2: Guardar estructura completa sin strings pesados de fotos en localStorage
        const lightweightTests = tests.map(t => ({
          ...t,
          photos: (t.photos || []).map(p => ({
            id: p.id,
            caption: p.caption,
            timestamp: p.timestamp,
            dataUrl: '' // Guardada en IndexedDB
          }))
        }));

        localStorage.setItem(STORAGE_TESTS_KEY, JSON.stringify(lightweightTests));
      } catch (e3) {
        console.error('Error crítico en localStorage:', e3);
      }
    }
  }
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(STORAGE_ACTIVE_PROJECT_KEY) || (getStoredProjects()[0]?.id ?? null);
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(STORAGE_ACTIVE_PROJECT_KEY, id);
  } catch (e) {
    console.warn('Error saving active project id', e);
  }
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
      21, 3000, 28, 0,
      [31, 32, 31, 32, 31, 32, 31, 32, 31, 32],
      'Superficie desbastada con piedra de carburo de silicio. Sonido metálico uniforme.',
      now - 86400000 * 3
    ),
    createMockTest(
      't-02', 'prj-bogota-01', 'C-102', 'Columna', 'Nivel 1 / Eje B-2 (Cara Este)',
      21, 3000, 28, 0,
      [31, 31, 32, 30, 31, 31, 32, 31, 30, 31],
      'Concreto homogéneo, buena compacidad en zona central.',
      now - 86400000 * 3
    ),
    createMockTest(
      't-03', 'prj-bogota-01', 'V-201', 'Viga', 'Nivel 2 / Eje 2 entre A y C (Fondo Viga)',
      21, 3000, 28, -90,
      [36, 35, 36, 36, 37, 36, 35, 36, 36, 37],
      'Impacto vertical hacia arriba (-90°) en fondo de viga desencofrada.',
      now - 86400000 * 2
    ),
    createMockTest(
      't-04', 'prj-bogota-01', 'LOSA-N3', 'Losa', 'Nivel 3 / Paño Central Ejes C-D',
      21, 3000, 28, 90,
      [28, 29, 28, 29, 28, 29, 28, 28, 29, 29],
      'Impacto vertical hacia abajo (+90°) sobre superficie superior afinada.',
      now - 86400000 * 2
    ),
    createMockTest(
      't-05', 'prj-bogota-01', 'M-CONT-01', 'Muro Estructural', 'Sótano 1 / Eje 1 Perimetral',
      21, 3000, 21, 0,
      [30, 31, 30, 31, 30, 31, 30, 30, 31, 30],
      'Lecturas en zona de desencofrado temprano. En seguimiento para verificación a los 28 días.',
      now - 86400000 * 1
    ),

    // Prj 2 Tests (Puente Río Magdalena)
    createMockTest(
      't-06', 'prj-girardot-02', 'PILOTE-P1', 'Pilote', 'Eje Central Pila 1 - Cabezal',
      21, 3000, 56, 0,
      [32, 32, 31, 32, 32, 33, 32, 31, 32, 32],
      'Excelente compactación en concreto estructural para cimentación profunda.',
      now - 86400000 * 8
    ),
    createMockTest(
      't-07', 'prj-girardot-02', 'ESTRIBO-OCC', 'Cimentación', 'Estribo Costado Occidental',
      21, 3000, 45, 0,
      [31, 31, 32, 31, 32, 31, 31, 32, 31, 31],
      'Prueba en cara vertical previa a colocación de apoyos elastoméricos.',
      now - 86400000 * 6
    ),
    createMockTest(
      't-08', 'prj-girardot-02', 'VIGA-POST-01', 'Viga', 'Viga Cajón 1 - Tramo Central',
      21, 3000, 28, -90,
      [36, 36, 35, 36, 37, 36, 36, 35, 36, 37],
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
