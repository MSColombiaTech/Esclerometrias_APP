import { ImpactAngle, CurveModel, TestStatus } from '../types';

/**
 * Tabla y formulación de corrección por ángulo de impacto (ΔR) para Martillo Schmidt Tipo N
 * según NTC 3692 / ASTM C805 y calibración estándar Proceq (energía de impacto 2.207 N·m).
 * 
 * La fuerza de gravedad altera la energía cinética de la masa percutora:
 * - Ángulo 0° (Horizontal): Sin alteración gravitatoria (ΔR = 0).
 * - Ángulo +90° (Hacia abajo en losas/pisos): La gravedad asiste el rebote; debe restarse.
 * - Ángulo -90° (Hacia arriba en fondos de vigas/losas): La gravedad frena el rebote; debe sumarse.
 * - Ángulo ±45° (Inclinado): Se escala trigonométricamente con el seno del ángulo.
 */
export function getAngleCorrection(rawMeanR: number, angle: ImpactAngle): number {
  if (angle === 0) return 0;

  // Truncar en rango de operación estándar de ábaco (15 <= R <= 60)
  const r = Math.max(15, Math.min(60, rawMeanR));

  if (angle === 90) {
    // Vertical hacia abajo (+90°): ΔR = -7.1 + 0.08 * R (Negativo, resta al rebote)
    // Para R=20: -5.50 | R=30: -4.70 | R=40: -3.90 | R=50: -3.10
    return -7.1 + 0.08 * r;
  } else if (angle === -90) {
    // Vertical hacia arriba (-90°): ΔR = +4.3 - 0.043 * R (Positivo, suma al rebote)
    // Para R=20: +3.44 | R=30: +3.01 | R=40: +2.58 | R=50: +2.15
    return +(4.3 - 0.043 * r);
  } else if (angle === 45) {
    // Inclinado 45° hacia abajo: escala con sin(45°) ≈ 0.7071
    return (-7.1 + 0.08 * r) * 0.70710678;
  } else if (angle === -45) {
    // Inclinado 45° hacia arriba: escala con sin(45°) ≈ 0.7071
    return (4.3 - 0.043 * r) * 0.70710678;
  }

  return 0;
}

/**
 * Factor de corrección por profundidad de carbonatación superficial (RILEM CPC-18 / NTC 3692)
 * La carbonatación incrementa la dureza de la capa exterior sin aumentar la resistencia interior.
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
 * 
 * Normativa y Estándares:
 * 1. PROCEQ_N_STANDARD: Proceq Schmidt Tipo N para Cilindro Estándar 15x30 cm (NTC 3692 / NSR-10 / ASTM C805).
 *    f'c_cyl (MPa) = 0.85 * [1.05 * (0.01078 * R^2 + 0.904 * R - 12.91)]
 *    = 0.8925 * (0.01078 * R^2 + 0.904 * R - 12.91)
 *    Ejemplos exactos:
 *    - R = 20 ->  8.5 MPa ( 1230 PSI)
 *    - R = 25 -> 14.7 MPa ( 2130 PSI)
 *    - R = 28 -> 18.6 MPa ( 2700 PSI)
 *    - R = 30 -> 21.3 MPa ( 3100 PSI ~ 3000 PSI)
 *    - R = 32 -> 24.2 MPa ( 3500 PSI)
 *    - R = 35 -> 28.5 MPa ( 4130 PSI ~ 4000 PSI)
 *    - R = 40 -> 36.1 MPa ( 5240 PSI ~ 5000 PSI)
 *    - R = 45 -> 44.3 MPa ( 6420 PSI ~ 6000 PSI)
 *    - R = 50 -> 52.9 MPa ( 7670 PSI)
 * 
 * 2. PROCEQ_N_CUBE: Probeta Cúbica de 150 mm (EN 12504-2 / DIN 1048)
 *    f_ck,cube (MPa) = 1.05 * (0.01078 * R^2 + 0.904 * R - 12.91)
 * 
 * 3. NSR10_COLOMBIA: Curva NSR-10 / ASOCRETO (Concretos con agregados andesíticos y aluviales colombianos)
 *    f'c_cyl (MPa) = 0.0098 * R^2 + 0.795 * R - 11.40
 * 
 * 4. ASTM_POLYNOMIAL: Regresión Polinomial ASTM C805 / ACI 228.1R
 *    f'c_cyl (MPa) = 0.0115 * R^2 + 0.680 * R - 8.60
 * 
 * 5. CUSTOM_CALIBRATED: Calibrada in-situ con extracción de núcleos diamantados (NTC 3658 / ASTM C42)
 */
export function calculateFcFromRebound(
  rCorr: number, 
  model: CurveModel = 'PROCEQ_N_STANDARD',
  customParams?: { a: number; b: number }
): number {
  if (rCorr <= 12) return 0;

  let fcMpa = 0;

  switch (model) {
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
          // Modelo potencial: f'c = a * R^b
          fcMpa = customParams.a * Math.pow(rCorr, customParams.b);
        } else {
          // Modelo lineal si b es intercepto: f'c = a * R + b
          fcMpa = customParams.a * rCorr + customParams.b;
        }
      } else {
        fcMpa = 0.8925 * (0.01078 * Math.pow(rCorr, 2) + 0.904 * rCorr - 12.91);
      }
      break;
    }

    default: {
      fcMpa = 0.8925 * (0.01078 * Math.pow(rCorr, 2) + 0.904 * rCorr - 12.91);
      break;
    }
  }

  // Si R está entre 12 y 16, asegurar continuidad no negativa
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
  model: CurveModel = 'PROCEQ_N_STANDARD',
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
  const correctionAngle = Number(getAngleCorrection(meanRaw, angle).toFixed(2));
  const meanCorrected = Number(Math.max(10, meanRaw + correctionAngle).toFixed(2));

  // Paso 6: Resistencia estimada a la compresión
  let estimatedFcMpa = calculateFcFromRebound(meanCorrected, model, customParams);
  
  // Aplicar factor de corrección por carbonatación si existe
  if (carbonationFactor && carbonationFactor > 0 && carbonationFactor !== 1.0) {
    estimatedFcMpa = Number((estimatedFcMpa * carbonationFactor).toFixed(2));
  }

  const estimatedFcKgcm2 = mpaToKgcm2(estimatedFcMpa);
  const estimatedFcPsi = mpaToPsi(estimatedFcMpa);

  // Paso 7: Evaluación de conformidad respecto al f'c de diseño
  const complianceRatio = fcDesignMpa > 0 ? Number(((estimatedFcMpa / fcDesignMpa) * 100).toFixed(1)) : 100;

  let status: TestStatus = 'CUMPLE';
  let statusNotes = '';

  if (isInvalidByDiscard || cleanReadings.length < 10) {
    status = 'INVALIDO';
    statusNotes = isInvalidByDiscard 
      ? `NTC 3692: Se descartaron ${totalExcluded} lecturas (> 6 unidades del promedio). Ensayo no válido, debe repetirse en una zona adyacente.`
      : `Muestra incompleta (${cleanReadings.length}/10 impactos).`;
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
