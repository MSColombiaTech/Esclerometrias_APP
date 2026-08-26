import { ImpactAngle, CurveModel, TestStatus } from '../types';

/**
 * Tabla de corrección por ángulo de impacto (ΔR) para Martillo Schmidt Tipo N
 * según NTC 3692 / ASTM C805 y ábacos de calibración Proceq.
 */
export function getAngleCorrection(rawMeanR: number, angle: ImpactAngle): number {
  if (angle === 0) return 0;

  // Si el rebote está fuera de rango operativo estándar, truncar para interpolar
  const r = Math.max(15, Math.min(55, rawMeanR));

  if (angle === 90) {
    // Hacia abajo (vertical en pisos/losas superiores) - La gravedad ayuda al rebote, se resta
    // R=20: -3.2, R=30: -3.0, R=40: -2.7, R=50: -2.2
    return -(3.5 - 0.026 * (r - 20));
  } else if (angle === -90) {
    // Hacia arriba (vertical en fondos de vigas/losas) - La gravedad frena el rebote, se suma
    // R=20: +3.4, R=30: +3.1, R=40: +2.7, R=50: +2.2
    return +(3.6 - 0.028 * (r - 20));
  } else if (angle === 45) {
    // Inclinado 45° hacia abajo
    return -(2.2 - 0.015 * (r - 20));
  } else if (angle === -45) {
    // Inclinado 45° hacia arriba
    return +(2.3 - 0.017 * (r - 20));
  }

  return 0;
}

/**
 * Curva de conversión de Rebote Corregido (R) a Resistencia a la Compresión f'c (MPa)
 */
export function calculateFcFromRebound(
  rCorr: number, 
  model: CurveModel = 'PROCEQ_N_STANDARD',
  customParams?: { a: number; b: number }
): number {
  if (rCorr < 10) return 0;

  let fcMpa = 0;

  switch (model) {
    case 'PROCEQ_N_STANDARD':
      // Curva universal estándar de fabricante Tipo N
      // f'c (MPa) = 0.0436 * R^2.052
      fcMpa = 0.0436 * Math.pow(rCorr, 2.052);
      break;

    case 'NSR10_COLOMBIA':
      // Curva ajustada para concretos con agregados andesíticos/calizos colombianos (NSR-10 C.5)
      // f'c (MPa) = 0.0385 * R^2.085
      fcMpa = 0.0385 * Math.pow(rCorr, 2.085);
      break;

    case 'ASTM_POLYNOMIAL':
      // Modelo polinomial de segundo grado según ASTM C805
      fcMpa = 0.0212 * Math.pow(rCorr, 2) + 0.325 * rCorr - 5.1;
      break;

    case 'CUSTOM_CALIBRATED':
      // Modelo calibrado in-situ con núcleos o cilindros: f'c = a * R^b o a * R + b
      if (customParams && customParams.a && customParams.b) {
        fcMpa = customParams.a * Math.pow(rCorr, customParams.b);
      } else {
        fcMpa = 0.0436 * Math.pow(rCorr, 2.052);
      }
      break;

    default:
      fcMpa = 0.0436 * Math.pow(rCorr, 2.052);
  }

  return Math.max(0, Number(fcMpa.toFixed(2)));
}

/**
 * Conversión de Unidades
 */
export function mpaToPsi(mpa: number): number {
  return Math.round(mpa * 145.0377);
}

export function psiToMpa(psi: number): number {
  return Number((psi / 145.0377).toFixed(2));
}

export function mpaToKgcm2(mpa: number): number {
  return Number((mpa * 10.19716).toFixed(2));
}

/**
 * Evaluación estadística y descarte de lecturas según NTC 3692 / ASTM C805:
 * 1. Se toman mínimo 10 lecturas.
 * 2. Se calcula el promedio preliminar de todas las lecturas.
 * 3. Se descarta cualquier lectura individual que difiera en más de 6 unidades respecto al promedio.
 * 4. Se calcula el nuevo promedio con las lecturas válidas.
 * 5. Si se descartan más de 2 lecturas de 10 (o > 20%), el ensayo se considera INVALIDO.
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

  // Si todos fueron excluidos (caso extremo), usar todos
  const readingsForStats = validReadings.length > 0 ? validReadings : cleanReadings;

  // Paso 3: Promedio final de lecturas válidas
  const meanRaw = Number((readingsForStats.reduce((a, b) => a + b, 0) / readingsForStats.length).toFixed(2));

  // Paso 4: Desviación estándar y coeficiente de variación
  const variance = readingsForStats.reduce((acc, val) => acc + Math.pow(val - meanRaw, 2), 0) / (readingsForStats.length > 1 ? readingsForStats.length - 1 : 1);
  const stdDev = Number(Math.sqrt(variance).toFixed(2));
  const cov = meanRaw > 0 ? Number(((stdDev / meanRaw) * 100).toFixed(1)) : 0;

  // Paso 5: Corrección por ángulo
  const correctionAngle = Number(getAngleCorrection(meanRaw, angle).toFixed(2));
  const meanCorrected = Number(Math.max(10, meanRaw + correctionAngle).toFixed(2));

  // Paso 6: Resistencia estimada
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
      ? `NTC 3692: Se descartaron ${totalExcluded} lecturas (> 6 del promedio). Ensayo no válido, repetir en zona adyacente.`
      : `Muestra incompleta (${cleanReadings.length}/10 impactos).`;
  } else if (complianceRatio >= 95) {
    status = 'CUMPLE';
    statusNotes = `Resistencia estimada (${estimatedFcMpa} MPa) satisface el f'c de diseño (${fcDesignMpa} MPa) con ${complianceRatio}%.`;
  } else if (complianceRatio >= 80) {
    status = 'DUDOSO';
    statusNotes = `Resistencia estimada (${estimatedFcMpa} MPa) está entre el 80% y 95% del diseño. Según NSR-10 C.5.6 se recomienda verificar con extracción de núcleos (NTC 3658 / ASTM C42).`;
  } else {
    status = 'NO_CUMPLE';
    statusNotes = `Resistencia estimada (${estimatedFcMpa} MPa) es deficiente (< 80% de ${fcDesignMpa} MPa). Alerta estructural según NSR-10.`;
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
 * Puntos de la curva teórica para visualización gráfica
 */
export function generateCurveDataPoints(model: CurveModel = 'PROCEQ_N_STANDARD', customParams?: { a: number; b: number }) {
  const points: { rebound: number; fcMpa: number; fcPsi: number }[] = [];
  for (let r = 15; r <= 60; r += 1) {
    const fc = calculateFcFromRebound(r, model, customParams);
    points.push({
      rebound: r,
      fcMpa: fc,
      fcPsi: mpaToPsi(fc)
    });
  }
  return points;
}

/**
 * Presets de resistencias comunes en Colombia
 */
export const COLOMBIAN_CONCRETE_PRESETS = [
  { mpa: 14.0, psi: 2000, label: '14.0 MPa (2000 PSI) - Solados y elementos no estructurales' },
  { mpa: 17.5, psi: 2500, label: '17.5 MPa (2500 PSI) - Muros divisorios / Andenes' },
  { mpa: 21.0, psi: 3000, label: '21.0 MPa (3000 PSI) - Vigas, losas y zapatas convencionales' },
  { mpa: 24.5, psi: 3500, label: '24.5 MPa (3500 PSI) - Estructuras intermedias' },
  { mpa: 28.0, psi: 4000, label: '28.0 MPa (4000 PSI) - Columnas y vigas de alta resistencia' },
  { mpa: 35.0, psi: 5000, label: '35.0 MPa (5000 PSI) - Concreto de alto desempeño / Puentes' },
  { mpa: 42.0, psi: 6000, label: '42.0 MPa (6000 PSI) - Pilotes y estructuras masivas' },
];
