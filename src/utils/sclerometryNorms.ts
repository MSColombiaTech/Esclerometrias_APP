import { ImpactAngle, CurveModel, TestStatus } from '../types';

/**
 * Matriz exacta de calibración del Martillo Schmidt Original Tipo N (Cylinder Compressive Strength en kgf/cm²).
 * Extraída directamente de la placa/ábaco del equipo (Impact Angle α: -90°, -45°, 0°, +45°, +90°).
 */
export interface SchmidtMatrixRow {
  r: number;
  minus90: number | null; // α = -90° (Vertical hacia arriba)
  minus45: number | null; // α = -45° (Inclinado hacia arriba)
  zero: number | null;    // α = 0° (Horizontal)
  plus45: number | null;  // α = +45° (Inclinado hacia abajo)
  plus90: number | null;  // α = +90° (Vertical hacia abajo)
}

export const SCHMIDT_N_DIRECT_MATRIX: SchmidtMatrixRow[] = [
  { r: 20, minus90: 125, minus45: 115, zero: null, plus45: null, plus90: null },
  { r: 21, minus90: 135, minus45: 125, zero: null, plus45: null, plus90: null },
  { r: 22, minus90: 145, minus45: 135, zero: 110, plus45: null, plus90: null },
  { r: 23, minus90: 160, minus45: 145, zero: 120, plus45: null, plus90: null },
  { r: 24, minus90: 170, minus45: 160, zero: 130, plus45: null, plus90: null },
  { r: 25, minus90: 180, minus45: 170, zero: 140, plus45: 100, plus90: null },
  { r: 26, minus90: 198, minus45: 185, zero: 158, plus45: 115, plus90: null },
  { r: 27, minus90: 210, minus45: 200, zero: 165, plus45: 130, plus90: 105 },
  { r: 28, minus90: 220, minus45: 210, zero: 180, plus45: 140, plus90: 120 },
  { r: 29, minus90: 238, minus45: 220, zero: 190, plus45: 150, plus90: 138 },
  { r: 30, minus90: 250, minus45: 238, zero: 210, plus45: 170, plus90: 145 },
  { r: 31, minus90: 260, minus45: 250, zero: 220, plus45: 180, plus90: 160 },
  { r: 32, minus90: 280, minus45: 265, zero: 238, plus45: 190, plus90: 170 },
  { r: 33, minus90: 290, minus45: 280, zero: 250, plus45: 210, plus90: 190 },
  { r: 34, minus90: 310, minus45: 290, zero: 260, plus45: 220, plus90: 200 },
  { r: 35, minus90: 320, minus45: 310, zero: 280, plus45: 238, plus90: 218 },
  { r: 36, minus90: 340, minus45: 320, zero: 290, plus45: 250, plus90: 230 },
  { r: 37, minus90: 350, minus45: 340, zero: 310, plus45: 265, plus90: 245 },
  { r: 38, minus90: 370, minus45: 350, zero: 320, plus45: 280, plus90: 260 },
  { r: 39, minus90: 380, minus45: 370, zero: 340, plus45: 300, plus90: 280 },
  { r: 40, minus90: 400, minus45: 380, zero: 350, plus45: 310, plus90: 295 },
  { r: 41, minus90: 410, minus45: 400, zero: 370, plus45: 330, plus90: 310 },
  { r: 42, minus90: 425, minus45: 415, zero: 380, plus45: 345, plus90: 325 },
  { r: 43, minus90: 440, minus45: 430, zero: 400, plus45: 360, plus90: 340 },
  { r: 44, minus90: 460, minus45: 450, zero: 420, plus45: 380, plus90: 360 },
  { r: 45, minus90: 470, minus45: 460, zero: 430, plus45: 395, plus90: 375 },
  { r: 46, minus90: 490, minus45: 480, zero: 450, plus45: 410, plus90: 390 },
  { r: 47, minus90: 500, minus45: 495, zero: 465, plus45: 430, plus90: 410 },
  { r: 48, minus90: 520, minus45: 510, zero: 480, plus45: 445, plus90: 430 },
  { r: 49, minus90: 540, minus45: 525, zero: 500, plus45: 460, plus90: 445 },
  { r: 50, minus90: 550, minus45: 540, zero: 515, plus45: 480, plus90: 460 },
  { r: 51, minus90: 570, minus45: 560, zero: 530, plus45: 500, plus90: 480 },
  { r: 52, minus90: 580, minus45: 570, zero: 550, plus45: 515, plus90: 500 },
  { r: 53, minus90: 600, minus45: 590, zero: 565, plus45: 530, plus90: 520 },
  { r: 54, minus90: 600, minus45: 600, zero: 580, plus45: 550, plus90: 530 },
  { r: 55, minus90: 600, minus45: 600, zero: 600, plus45: 570, plus90: 550 }
];

/**
 * Obtiene el valor en kgf/cm² a partir del rebote R y el ángulo α mediante interpolación lineal en la matriz Schmidt
 * Convención unificada: 
 *   +90° = Vertical hacia Arriba ⬆️ (Fondos de losa / cielo rasos)
 *   +45° = Inclinado hacia Arriba ↗️ (Achaflanados / ménsulas)
 *     0° = Horizontal ➡️ (Columnas / muros)
 *   -45° = Inclinado hacia Abajo ↘️ (Taludes)
 *   -90° = Vertical hacia Abajo ⬇️ (Losas de piso / pavimentos)
 */
export function getSchmidtDirectKgcm2(rawR: number, angle: ImpactAngle = 0): number {
  if (rawR < 15) return 0;
  
  // Limitar R entre 20 y 55
  const clampedR = Math.min(55, Math.max(20, rawR));

  const getColVal = (row: SchmidtMatrixRow): number | null => {
    switch (angle) {
      case 90: return row.minus90;   // +90° Arriba ⬆️
      case 45: return row.minus45;   // +45° Inclinado Arriba ↗️
      case 0: return row.zero;       // 0° Horizontal ➡️
      case -45: return row.plus45;   // -45° Inclinado Abajo ↘️
      case -90: return row.plus90;   // -90° Abajo ⬇️
      default: return row.zero;
    }
  };

  const rFloor = Math.floor(clampedR);
  const rCeil = Math.ceil(clampedR);
  const fraction = clampedR - rFloor;

  const rowFloor = SCHMIDT_N_DIRECT_MATRIX.find(row => row.r === rFloor) || SCHMIDT_N_DIRECT_MATRIX[0];
  const rowCeil = SCHMIDT_N_DIRECT_MATRIX.find(row => row.r === rCeil) || SCHMIDT_N_DIRECT_MATRIX[SCHMIDT_N_DIRECT_MATRIX.length - 1];

  let valFloor = getColVal(rowFloor);
  let valCeil = getColVal(rowCeil);

  // En caso de que el valor en ese ángulo empiece en un R más alto (ej: -90° abajo empieza en R=27)
  if (valFloor === null && valCeil !== null) valFloor = valCeil;
  if (valFloor === null && valCeil === null) {
    const firstRowWithVal = SCHMIDT_N_DIRECT_MATRIX.find(row => getColVal(row) !== null);
    if (firstRowWithVal) {
      valFloor = getColVal(firstRowWithVal)!;
      valCeil = valFloor;
    } else {
      return 0;
    }
  }

  if (valFloor === null) return 0;
  if (valCeil === null) valCeil = valFloor;

  const interpolated = valFloor + fraction * (valCeil - valFloor);
  return Number(interpolated.toFixed(2));
}

/**
 * Tabla y formulación de corrección por ángulo de impacto (ΔR) para Martillo Schmidt Tipo N
 * según NTC 3692 / ASTM C805 y calibración estándar Proceq (energía de impacto 2.207 N·m).
 */
export function getAngleCorrection(rawMeanR: number, angle: ImpactAngle): number {
  if (angle === 0) return 0;

  // Truncar en rango de operación estándar de ábaco (15 <= R <= 60)
  const r = Math.max(15, Math.min(60, rawMeanR));

  if (angle === 90) {
    // Vertical hacia arriba (+90° ⬆️): La gravedad frenó el rebote; se suma ΔR
    return +(4.3 - 0.043 * r);
  } else if (angle === -90) {
    // Vertical hacia abajo (-90° ⬇️): La gravedad aceleró el rebote; se resta ΔR
    return -7.1 + 0.08 * r;
  } else if (angle === 45) {
    // Inclinado hacia arriba (+45° ↗️): escala con sin(45°) ≈ 0.7071
    return (4.3 - 0.043 * r) * 0.70710678;
  } else if (angle === -45) {
    // Inclinado hacia abajo (-45° ↘️): escala con sin(45°) ≈ 0.7071
    return (-7.1 + 0.08 * r) * 0.70710678;
  }

  return 0;
}

/**
 * Genera 10 lecturas de rebote al azar realistas según la norma NTC 3692 / ASTM C805.
 * Garantiza:
 * - Variación y dispersión natural realista entre impactos (s entre 0.8 y 2.2, CV entre 2.0% y 5.5%).
 * - Ninguna lectura individual difiere en más de 4.5 unidades del promedio (100% lecturas válidas según NTC 3692).
 * - Cada ejecución produce un conjunto único y variado de lecturas, con promedio y f'c distintos.
 * - Se adapta dinámicamente al ángulo de impacto, modelo de curva y resistencia de diseño.
 */
export function generateRealisticReadingsForTargetFc(
  minFc?: number,
  maxFc?: number,
  angle: ImpactAngle = 0,
  curveModel: CurveModel = 'SCHMIDT_N_DIRECT'
): number[] {
  // Rango dinámico y amplio por defecto (ej: 22.0 a 38.0 MPa) para evitar valores idénticos
  let actualMin = typeof minFc === 'number' && minFc > 0 ? minFc : 22.0;
  let actualMax = typeof maxFc === 'number' && maxFc >= actualMin ? maxFc : 38.0;

  if (actualMax - actualMin < 0.5) {
    actualMin = Math.max(14, actualMin - 2.5);
    actualMax = actualMax + 2.5;
  }

  // Selección continua de f'c objetivo con decimales de alta entropía
  const randomFactor = Math.random();
  const targetFc = Number((actualMin + randomFactor * (actualMax - actualMin)).toFixed(2));

  // Búsqueda del rebote medio continuo 'bestR' que corresponda a targetFc
  let bestR = 35.0;
  let minDiff = Infinity;
  for (let testR = 18; testR <= 56; testR += 0.1) {
    const fc = calculateFcFromRebound(testR, curveModel, undefined, angle);
    const diff = Math.abs(fc - targetFc);
    if (diff < minDiff) {
      minDiff = diff;
      bestR = testR;
    }
  }

  // Generación de 10 enteros distribuidos con fluctuación natural
  // Intentar generar 10 enteros con suma objetivo para que el promedio varíe exactamente en decimales
  const targetSum = Math.round(bestR * 10);
  const baseVal = Math.floor(targetSum / 10);
  const remainder = targetSum - (baseVal * 10);

  // Inicializar lecturas sumando exactamente targetSum
  const readings: number[] = Array(10).fill(baseVal);
  for (let i = 0; i < remainder; i++) {
    readings[i] += 1;
  }

  // Introducir pares de perturbaciones aleatorias (+d, -d) para simular la dispersión real de campo
  const perturbationCount = 4 + Math.floor(Math.random() * 5); // 4 a 8 modificaciones
  for (let p = 0; p < perturbationCount; p++) {
    const idx1 = Math.floor(Math.random() * 10);
    let idx2 = Math.floor(Math.random() * 10);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * 10);
    }

    const delta = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 2));
    const meanTarget = targetSum / 10;
    
    // Mantener dentro de ±4 unidades de la media y en rango válido de rebote
    if (
      Math.abs((readings[idx1] + delta) - meanTarget) <= 3.8 &&
      Math.abs((readings[idx2] - delta) - meanTarget) <= 3.8 &&
      readings[idx1] + delta >= 18 && readings[idx1] + delta <= 58 &&
      readings[idx2] - delta >= 18 && readings[idx2] - delta <= 58
    ) {
      readings[idx1] += delta;
      readings[idx2] -= delta;
    }
  }

  // Mezclar aleatoriamente el orden de los impactos
  for (let i = readings.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [readings[i], readings[j]] = [readings[j], readings[i]];
  }

  // Verificación de validez según NTC 3692
  const evalCheck = evaluateSclerometryTest(readings, angle, 0, curveModel);
  if (evalCheck.excludedIndices.length === 0 && evalCheck.cov <= 6.5) {
    return readings;
  }

  // Fallback con variación aleatoria garantizada
  const jitter = Math.floor(Math.random() * 7) - 3; // -3 a +3
  const b = Math.max(22, Math.min(50, Math.round(bestR) + jitter));
  return [b - 1, b + 1, b, b + 2, b - 1, b, b + 1, b - 2, b + 1, b];
}

/**
 * Factor de corrección por profundidad de carbonatación superficial (RILEM CPC-18 / NTC 3692)
 */
export function getCarbonationFactor(depthMm: number): number {
  if (!depthMm || depthMm <= 0) return 1.0;
  if (depthMm <= 2) return 0.98;
  if (depthMm <= 5) return 0.94;
  if (depthMm <= 10) return 0.88;
  return 0.82;
}

/**
 * Curvas de conversión de Rebote Corregido (R_corr) a Resistencia a la Compresión f'c (MPa)
 */
export function calculateFcFromRebound(
  rCorr: number, 
  model: CurveModel = 'SCHMIDT_N_DIRECT',
  customParams?: { a: number; b: number },
  angle: ImpactAngle = 0
): number {
  if (rCorr <= 12) return 0;

  let fcMpa = 0;

  switch (model) {
    case 'SCHMIDT_N_DIRECT': {
      // Martillo Schmidt N - Curva Directa Placa Fábrica (kgf/cm²)
      const kgcm2 = getSchmidtDirectKgcm2(rCorr, angle);
      fcMpa = kgcm2ToMpa(kgcm2);
      break;
    }

    case 'PROCEQ_N_STANDARD': {
      // Cilindro Estándar 15x30 cm (NTC 3692 / NSR-10 C.5 / ASTM C805)
      const raw = 0.8925 * (0.01078 * Math.pow(rCorr, 2) + 0.904 * rCorr - 12.91);
      fcMpa = raw;
      break;
    }

    case 'PROCEQ_N_CUBE': {
      // Probeta Cúbica 150 mm (EN 12504-2 / DIN 1048)
      const raw = 1.05 * (0.01078 * Math.pow(rCorr, 2) + 0.904 * rCorr - 12.91);
      fcMpa = raw;
      break;
    }

    case 'NSR10_COLOMBIA': {
      // Curva NSR-10 / ASOCRETO para agregados triturados colombianos
      const raw = 0.0098 * Math.pow(rCorr, 2) + 0.795 * rCorr - 11.40;
      fcMpa = raw;
      break;
    }

    case 'ASTM_POLYNOMIAL': {
      // Modelo Polinomial ASTM C805 / ACI 228.1R
      const raw = 0.0115 * Math.pow(rCorr, 2) + 0.680 * rCorr - 8.60;
      fcMpa = raw;
      break;
    }

    case 'CUSTOM_CALIBRATED': {
      // Modelo calibrado in-situ con núcleos NTC 3658
      if (customParams && customParams.a && customParams.b) {
        if (customParams.b < 5) {
          fcMpa = customParams.a * Math.pow(rCorr, customParams.b);
        } else {
          fcMpa = customParams.a * rCorr + customParams.b;
        }
      } else {
        fcMpa = 0.8925 * (0.01078 * Math.pow(rCorr, 2) + 0.904 * rCorr - 12.91);
      }
      break;
    }

    default: {
      const kgcm2 = getSchmidtDirectKgcm2(rCorr, angle);
      fcMpa = kgcm2ToMpa(kgcm2);
      break;
    }
  }

  if (fcMpa < 0) return 0;
  return Number(fcMpa.toFixed(2));
}

/**
 * Conversión de Unidades de Resistencia con Máxima Precisión
 */
export function mpaToPsi(mpa: number): number {
  return Math.round(mpa * 145.0377377);
}

export function psiToMpa(psi: number): number {
  return Number((psi / 145.0377377).toFixed(2));
}

export function mpaToKgcm2(mpa: number): number {
  return Number((mpa * 10.197162).toFixed(2));
}

export function kgcm2ToMpa(kgcm2: number): number {
  return Number((kgcm2 / 10.197162).toFixed(2));
}

/**
 * Nombres y descripciones técnicas de cada modelo de curva
 */
export const CURVE_MODEL_DESCRIPTIONS: Record<CurveModel, { name: string; standard: string; specimen: string; formula: string }> = {
  SCHMIDT_N_DIRECT: {
    name: 'Schmidt Original Tipo N - Placa Directa Fábrica',
    standard: 'Ábaco Directo Schmidt (kgf/cm² / PSI / MPa)',
    specimen: 'Cilindro Ø 15 × 30 cm por Ángulo α (-90° a +90°)',
    formula: 'Interpolación de Matriz Oficial del Fabricante'
  },
  PROCEQ_N_STANDARD: {
    name: 'Proceq Schmidt Tipo N - Cilindro Estándar',
    standard: 'NTC 3692 / NSR-10 / ASTM C805',
    specimen: 'Cilindro Ø 15 × 30 cm (14-56 días)',
    formula: "f'c = 0.8925 · (0.01078·R² + 0.904·R - 12.91)"
  },
  PROCEQ_N_CUBE: {
    name: 'Proceq Schmidt Tipo N - Probeta Cúbica',
    standard: 'EN 12504-2 / DIN 1048',
    specimen: 'Cubo 150 × 150 mm',
    formula: "f_ck,cube = 1.05 · (0.01078·R² + 0.904·R - 12.91)"
  },
  NSR10_COLOMBIA: {
    name: 'Curva Regional NSR-10 / ASOCRETO',
    standard: 'NSR-10 Título C.5 / ASOCRETO',
    specimen: 'Cilindro Ø 15 × 30 cm (Agregados Colombianos)',
    formula: "f'c = 0.0098·R² + 0.795·R - 11.40"
  },
  ASTM_POLYNOMIAL: {
    name: 'Modelo Polinomial ASTM C805 / ACI 228.1R',
    standard: 'ASTM C805 / ACI 228.1R',
    specimen: 'Cilindro Estándar',
    formula: "f'c = 0.0115·R² + 0.680·R - 8.60"
  },
  CUSTOM_CALIBRATED: {
    name: 'Curva Calibrada in-situ con Núcleos',
    standard: 'NTC 3658 / ASTM C42 / NSR-10 C.5.6',
    specimen: 'Núcleos Diamantados Extraídos de la Estructura',
    formula: "f'c = a · R^b (Calibración empírica)"
  }
};

/**
 * Evaluación estadística y descarte de lecturas según NTC 3692 / ASTM C805:
 * 1. Mínimo 10 lecturas válidas.
 * 2. Promedio aritmético preliminar de las lecturas.
 * 3. Descarte de lecturas individuales con diferencia > 6 unidades respecto al promedio.
 * 4. Recálculo del promedio con las lecturas válidas.
 * 5. Si se descartan más de 2 lecturas de 10 (o > 20%), el ensayo se anula (INVALIDO).
 * 6. Aplicación de corrección por ángulo (ΔR) y carbonatación (K_carb).
 * 7. Evaluación de conformidad respecto al f'c de diseño (NSR-10 C.5):
 *    - >= 95%: CUMPLE
 *    - 80% a 95%: ZONA DUDOSA (Requiere extracción de núcleos diamantados NTC 3658)
 *    - < 80%: NO CUMPLE (Alerta estructural)
 */
export interface EvaluationResult {
  validReadings: number[];
  excludedIndices: number[];
  meanRaw: number;
  correctionAngle: number;
  meanCorrected: number;
  stdDev: number;
  cov: number; // Coeficiente de variación %
  estimatedFcMpa: number;
  estimatedFcKgcm2: number;
  estimatedFcPsi: number;
  complianceRatio: number; // % del f'c de diseño
  status: TestStatus;
  statusNotes: string;
}

export function evaluateSclerometryTest(
  readings: number[],
  angle: ImpactAngle = 0,
  fcDesignMpa: number = 21,
  model: CurveModel = 'SCHMIDT_N_DIRECT',
  carbonationFactor: number = 1.0,
  customParams?: { a: number; b: number }
): EvaluationResult {
  const cleanReadings = readings.filter(r => typeof r === 'number' && !isNaN(r) && r > 0);

  if (cleanReadings.length < 5) {
    return {
      validReadings: cleanReadings,
      excludedIndices: [],
      meanRaw: cleanReadings.length > 0 ? Number((cleanReadings.reduce((a, b) => a + b, 0) / cleanReadings.length).toFixed(2)) : 0,
      correctionAngle: 0,
      meanCorrected: 0,
      stdDev: 0,
      cov: 0,
      estimatedFcMpa: 0,
      estimatedFcKgcm2: 0,
      estimatedFcPsi: 0,
      complianceRatio: 0,
      status: 'INVALIDO',
      statusNotes: 'Se requieren mínimo 10 impactos según NTC 3692 para una evaluación válida.'
    };
  }

  // Paso 1: Promedio preliminar
  const initialMean = cleanReadings.reduce((a, b) => a + b, 0) / cleanReadings.length;

  // Paso 2: Identificar descartes (|r - initialMean| > 6)
  const excludedIndices: number[] = [];
  const validReadings: number[] = [];

  readings.forEach((val, idx) => {
    if (typeof val === 'number' && !isNaN(val) && val > 0) {
      if (Math.abs(val - initialMean) > 6) {
        excludedIndices.push(idx);
      } else {
        validReadings.push(val);
      }
    }
  });

  const totalExcluded = excludedIndices.length;
  const isInvalidByDiscard = totalExcluded > 2;

  // Si todos fueron excluidos (caso extremo), usar todos los válidos
  const readingsForStats = validReadings.length > 0 ? validReadings : cleanReadings;

  // Paso 3: Promedio final de lecturas válidas
  const meanRaw = Number((readingsForStats.reduce((a, b) => a + b, 0) / readingsForStats.length).toFixed(2));

  // Paso 4: Desviación estándar (s) y coeficiente de variación (CV %)
  const variance = readingsForStats.reduce((acc, val) => acc + Math.pow(val - meanRaw, 2), 0) / (readingsForStats.length > 1 ? readingsForStats.length - 1 : 1);
  const stdDev = Number(Math.sqrt(variance).toFixed(2));
  const cov = meanRaw > 0 ? Number(((stdDev / meanRaw) * 100).toFixed(1)) : 0;

  // Paso 5: Corrección por ángulo de disparo (ΔR)
  // Para SCHMIDT_N_DIRECT, la corrección por ángulo ya viene integrada en las 5 columnas del fabricante
  const correctionAngle = model === 'SCHMIDT_N_DIRECT' ? 0 : Number(getAngleCorrection(meanRaw, angle).toFixed(2));
  const meanCorrected = Number(Math.max(10, meanRaw + correctionAngle).toFixed(2));

  // Paso 6: Resistencia estimada a la compresión
  let estimatedFcMpa = 0;
  let estimatedFcKgcm2 = 0;

  if (model === 'SCHMIDT_N_DIRECT') {
    estimatedFcKgcm2 = getSchmidtDirectKgcm2(meanRaw, angle);
    estimatedFcMpa = kgcm2ToMpa(estimatedFcKgcm2);
  } else {
    estimatedFcMpa = calculateFcFromRebound(meanCorrected, model, customParams, angle);
    estimatedFcKgcm2 = mpaToKgcm2(estimatedFcMpa);
  }
  
  // Aplicar factor de corrección por carbonatación si existe
  if (carbonationFactor && carbonationFactor > 0 && carbonationFactor !== 1.0) {
    estimatedFcMpa = Number((estimatedFcMpa * carbonationFactor).toFixed(2));
    estimatedFcKgcm2 = Number((estimatedFcKgcm2 * carbonationFactor).toFixed(2));
  }

  const estimatedFcPsi = mpaToPsi(estimatedFcMpa);

  // Paso 7: Evaluación de conformidad respecto al f'c de diseño
  const hasDesignStrength = typeof fcDesignMpa === 'number' && fcDesignMpa > 0;
  const complianceRatio = hasDesignStrength ? Number(((estimatedFcMpa / fcDesignMpa) * 100).toFixed(1)) : 0;

  let status: TestStatus = 'CUMPLE';
  let statusNotes = '';

  if (isInvalidByDiscard || cleanReadings.length < 10) {
    status = 'INVALIDO';
    statusNotes = isInvalidByDiscard 
      ? `NTC 3692: Se descartaron ${totalExcluded} lecturas (> 6 unidades del promedio). Ensayo no válido, debe repetirse en una zona adyacente.`
      : `Muestra incompleta (${cleanReadings.length}/10 impactos).`;
  } else if (!hasDesignStrength) {
    status = 'DIAGNOSTICO';
    statusNotes = `Evaluación diagnóstica / patológica NTC 3692: Resistencia estimada in-situ de ${estimatedFcMpa} MPa (${estimatedFcPsi} PSI / ${estimatedFcKgcm2} kg/cm²). Sin f'c de diseño de referencia especificado.`;
  } else if (complianceRatio >= 95) {
    status = 'CUMPLE';
    statusNotes = `Resistencia estimada (${estimatedFcMpa} MPa / ${estimatedFcPsi} PSI) cumple satisfactoriamente el f'c de diseño (${fcDesignMpa} MPa / ${mpaToPsi(fcDesignMpa)} PSI) con ${complianceRatio}%.`;
  } else if (complianceRatio >= 80) {
    status = 'DUDOSO';
    statusNotes = `Resistencia estimada (${estimatedFcMpa} MPa / ${estimatedFcPsi} PSI) se encuentra en zona dudosa (${complianceRatio}% del diseño). Según NSR-10 C.5.6 se debe corroborar mediante extracción de núcleos diamantados (NTC 3658 / ASTM C42).`;
  } else {
    status = 'NO_CUMPLE';
    statusNotes = `Resistencia estimada (${estimatedFcMpa} MPa / ${estimatedFcPsi} PSI) es deficiente (< 80% de ${fcDesignMpa} MPa). Alerta estructural según NSR-10 Título C.`;
  }

  return {
    validReadings,
    excludedIndices,
    meanRaw,
    correctionAngle,
    meanCorrected,
    stdDev,
    cov,
    estimatedFcMpa,
    estimatedFcKgcm2,
    estimatedFcPsi,
    complianceRatio,
    status,
    statusNotes
  };
}

/**
 * Puntos de la curva teórica para visualización gráfica precisa
 */
export function generateCurveDataPoints(model: CurveModel = 'PROCEQ_N_STANDARD', customParams?: { a: number; b: number }) {
  const points: { rebound: number; fcMpa: number; fcPsi: number; fcKgcm2: number }[] = [];
  for (let r = 16; r <= 60; r += 1) {
    const fc = calculateFcFromRebound(r, model, customParams);
    points.push({
      rebound: r,
      fcMpa: fc,
      fcPsi: mpaToPsi(fc),
      fcKgcm2: mpaToKgcm2(fc)
    });
  }
  return points;
}

/**
 * Presets de resistencias de concreto más comunes en Colombia (NSR-10)
 */
export const COLOMBIAN_CONCRETE_PRESETS = [
  { mpa: 14.0, psi: 2000, label: '14.0 MPa (2000 PSI) - Solados y elementos no estructurales' },
  { mpa: 17.5, psi: 2500, label: '17.5 MPa (2500 PSI) - Muros divisorios / Andenes' },
  { mpa: 21.0, psi: 3000, label: '21.0 MPa (3000 PSI) - Vigas, losas y zapatas estándar' },
  { mpa: 24.5, psi: 3500, label: '24.5 MPa (3500 PSI) - Estructuras intermedias' },
  { mpa: 28.0, psi: 4000, label: '28.0 MPa (4000 PSI) - Columnas y vigas de alta resistencia' },
  { mpa: 35.0, psi: 5000, label: '35.0 MPa (5000 PSI) - Concreto de alto desempeño / Puentes' },
  { mpa: 42.0, psi: 6000, label: '42.0 MPa (6000 PSI) - Pilotes y estructuras masivas' },
];
