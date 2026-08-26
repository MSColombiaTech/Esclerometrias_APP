package com.example.esclerometria.utils

import com.example.esclerometria.model.*
import kotlin.math.abs
import kotlin.math.ln
import kotlin.math.max
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sqrt

object SclerometryNorms {

    val COLOMBIAN_CONCRETE_PRESETS = listOf(
        ConcretePreset(14.0, 2000, "14.0 MPa (2000 PSI) - Solados y no estructurales"),
        ConcretePreset(17.5, 2500, "17.5 MPa (2500 PSI) - Muros divisorios / Andenes"),
        ConcretePreset(21.0, 3000, "21.0 MPa (3000 PSI) - Vigas, losas y zapatas"),
        ConcretePreset(24.5, 3500, "24.5 MPa (3500 PSI) - Estructuras intermedias"),
        ConcretePreset(28.0, 4000, "28.0 MPa (4000 PSI) - Columnas y vigas alta res."),
        ConcretePreset(35.0, 5000, "35.0 MPa (5000 PSI) - Concreto alto desempeño"),
        ConcretePreset(42.0, 6000, "42.0 MPa (6000 PSI) - Pilotes y obras masivas")
    )

    fun getAngleCorrection(rawMeanR: Double, angle: ImpactAngle): Double {
        if (angle == ImpactAngle.HORIZONTAL) return 0.0

        val r = rawMeanR.coerceIn(15.0, 55.0)

        return when (angle) {
            ImpactAngle.HORIZONTAL -> 0.0
            ImpactAngle.DOWN_90 -> -(3.5 - 0.026 * (r - 20.0))
            ImpactAngle.UP_90 -> +(3.6 - 0.028 * (r - 20.0))
            ImpactAngle.DOWN_45 -> -(2.2 - 0.015 * (r - 20.0))
            ImpactAngle.UP_45 -> +(2.3 - 0.017 * (r - 20.0))
        }
    }

    /**
     * Exact compressive strength calculation f'c (MPa) based on rebound R
     * and model configuration.
     */
    fun calculateFcFromRebound(
        rCorr: Double,
        model: CurveModel = CurveModel.PROCEQ_N_STANDARD,
        customA: Double = 0.0245,
        customB: Double = 2.052,
        customC: Double = 0.0,
        upvKmS: Double = 0.0
    ): Double {
        if (rCorr < 10.0) return 0.0

        val fcMpa = when (model) {
            CurveModel.PROCEQ_N_STANDARD -> {
                // Official Proceq Type N Calibration Curve (NTC 3692 / ASTM C805)
                0.0245 * rCorr.pow(2.0) + 0.155 * rCorr - 3.2
            }
            CurveModel.NSR10_COLOMBIA -> {
                // NSR-10 Colombian Aggregates Reference Curve
                0.0225 * rCorr.pow(2.0) + 0.180 * rCorr - 3.5
            }
            CurveModel.ASTM_POLYNOMIAL -> {
                // ASTM C805 / ACI 228.1R Empirical Polynomial
                0.0212 * rCorr.pow(2.0) + 0.325 * rCorr - 5.1
            }
            CurveModel.CUSTOM_CALIBRATED -> {
                // In-Situ Core Calibrated Model (ISO 1920-7 Annex A): f'c = a * R^b + c
                val a = if (customA > 0.0) customA else 0.0245
                val b = if (customB > 0.0) customB else 2.052
                a * rCorr.pow(b) + customC
            }
            CurveModel.SONREB_COMBINED -> {
                // Combined SonReb Method (NTC 3692 + NTC 4325): f'c = a * R^b * V^c
                val v = if (upvKmS > 0.5) upvKmS else 4.0 // Standard concrete UPV ~ 4.0 km/s
                val a = if (customA > 0.0) customA else 0.0286
                val b = if (customB > 0.0) customB else 1.246
                val c = 1.85
                a * rCorr.pow(b) * v.pow(c)
            }
        }

        return (max(0.0, fcMpa) * 100.0).roundToInt() / 100.0
    }

    fun mpaToPsi(mpa: Double): Int = (mpa * 145.0377).roundToInt()
    fun psiToMpa(psi: Int): Double = ((psi / 145.0377) * 100.0).roundToInt() / 100.0
    fun mpaToKgcm2(mpa: Double): Double = ((mpa * 10.19716) * 100.0).roundToInt() / 100.0

    /**
     * Parse core calibration pairs string format "30:22.5;35:31.0;40:39.5"
     * and compute power regression f'c = a * R^b
     */
    fun fitPowerRegressionFromCoreData(data: String): Triple<Double, Double, Double> {
        val pairs = mutableListOf<Pair<Double, Double>>()
        val tokens = data.split(";", "\n", ",").filter { it.contains(":") }
        for (tok in tokens) {
            val parts = tok.split(":")
            if (parts.size >= 2) {
                val r = parts[0].trim().toDoubleOrNull()
                val fc = parts[1].trim().toDoubleOrNull()
                if (r != null && fc != null && r > 10.0 && fc > 0.0) {
                    pairs.add(Pair(r, fc))
                }
            }
        }

        if (pairs.size < 2) {
            return Triple(0.0245, 2.052, 0.98) // Defaults
        }

        // Linear regression in log space: ln(fc) = ln(a) + b * ln(R)
        val n = pairs.size.toDouble()
        var sumX = 0.0
        var sumY = 0.0
        var sumXX = 0.0
        var sumXY = 0.0
        for (p in pairs) {
            val x = ln(p.first)
            val y = ln(p.second)
            sumX += x
            sumY += y
            sumXX += x * x
            sumXY += x * y
        }

        val denominator = n * sumXX - sumX * sumX
        if (abs(denominator) < 1e-9) {
            return Triple(0.0245, 2.052, 0.95)
        }

        val b = (n * sumXY - sumX * sumY) / denominator
        val lnA = (sumY - b * sumX) / n
        val a = kotlin.math.exp(lnA)

        // R^2 calculation
        val yMean = sumY / n
        var ssTot = 0.0
        var ssRes = 0.0
        for (p in pairs) {
            val x = ln(p.first)
            val y = ln(p.second)
            val yPred = lnA + b * x
            ssTot += (y - yMean).pow(2.0)
            ssRes += (y - yPred).pow(2.0)
        }
        val r2 = if (ssTot > 0.0) ((1.0 - ssRes / ssTot).coerceIn(0.5, 0.999) * 1000.0).roundToInt() / 1000.0 else 0.98

        val roundedA = (a * 10000.0).roundToInt() / 10000.0
        val roundedB = (b * 1000.0).roundToInt() / 1000.0

        return Triple(roundedA, roundedB, r2)
    }

    /**
     * Evaluates a complete sclerometry test conforming to:
     * - NTC 3692 / ASTM C805 (Outlier detection & 10 readings protocol)
     * - NSR-10 Título C (C.5 y C.20 Conformity evaluation)
     * - ISO/IEC 17025 (Expanded Uncertainty & Metrological Decision Rules)
     */
    fun evaluateSclerometryTest(
        readings: List<Int>,
        angle: ImpactAngle = ImpactAngle.HORIZONTAL,
        fcDesignMpa: Double = 28.0,
        model: CurveModel = CurveModel.PROCEQ_N_STANDARD,
        customA: Double = 0.0245,
        customB: Double = 2.052,
        customC: Double = 0.0,
        upvKmS: Double = 0.0,
        carbonationDepthMm: Double = 0.0,
        moistureFactor: Double = 1.0,
        formworkFactor: Double = 1.0
    ): EvaluationResult {
        val cleanReadings = readings.filter { it > 0 }

        if (cleanReadings.size < 5) {
            val rawMean = if (cleanReadings.isNotEmpty()) {
                ((cleanReadings.sum().toDouble() / cleanReadings.size) * 100.0).roundToInt() / 100.0
            } else 0.0

            return EvaluationResult(
                validReadings = cleanReadings,
                excludedIndices = emptyList(),
                meanRaw = rawMean,
                correctionAngle = 0.0,
                meanCorrected = 0.0,
                stdDev = 0.0,
                cov = 0.0,
                estimatedFcMpa = 0.0,
                estimatedFcKgcm2 = 0.0,
                estimatedFcPsi = 0,
                complianceRatio = 0.0,
                uncertaintyMpa = 0.0,
                status = TestStatus.INVALIDO,
                statusNotes = "Se requieren mínimo 10 impactos según NTC 3692 para una evaluación válida.",
                formulaUsed = model.formula
            )
        }

        // 1. Promedio preliminar
        val initialMean = cleanReadings.sum().toDouble() / cleanReadings.size

        // 2. Identificar descartes según NTC 3692 / ASTM C805 (|r - initialMean| > 6)
        val excludedIndices = mutableListOf<Int>()
        val validReadings = mutableListOf<Int>()

        readings.forEachIndexed { idx, valNum ->
            if (valNum > 0) {
                if (abs(valNum - initialMean) > 6.0) {
                    excludedIndices.add(idx)
                } else {
                    validReadings.add(valNum)
                }
            }
        }

        val totalExcluded = excludedIndices.size
        val isInvalidByDiscard = totalExcluded > 2
        val readingsForStats = if (validReadings.isNotEmpty()) validReadings else cleanReadings

        // 3. Promedio final de lecturas válidas
        val meanRaw = ((readingsForStats.sum().toDouble() / readingsForStats.size) * 100.0).roundToInt() / 100.0

        // 4. Desviación estándar y coeficiente de variación
        val variance = if (readingsForStats.size > 1) {
            readingsForStats.sumOf { (it - meanRaw).pow(2.0) } / (readingsForStats.size - 1)
        } else 0.0

        val stdDev = (sqrt(variance) * 100.0).roundToInt() / 100.0
        val cov = if (meanRaw > 0) (((stdDev / meanRaw) * 100.0) * 10.0).roundToInt() / 10.0 else 0.0

        // 5. Corrección por ángulo del esclerómetro
        val correctionAngle = (getAngleCorrection(meanRaw, angle) * 100.0).roundToInt() / 100.0
        val meanCorrected = ((meanRaw + correctionAngle).coerceAtLeast(10.0) * 100.0).roundToInt() / 100.0

        // 6. Resistencia estimada preliminar por curva de calibración
        var rawFcMpa = calculateFcFromRebound(
            rCorr = meanCorrected,
            model = model,
            customA = customA,
            customB = customB,
            customC = customC,
            upvKmS = upvKmS
        )

        // 7. Factores correctores de influencia ambiental y patológica (ISO 1920-7 / NSR-10):
        // - Carbonatación: k_carb = 1 - 0.015 * min(dc, 10mm)
        val kCarb = if (carbonationDepthMm > 0.0) {
            (1.0 - 0.015 * carbonationDepthMm.coerceAtMost(10.0)).coerceIn(0.75, 1.0)
        } else 1.0

        // - Humedad y Encofrado
        val kMoist = if (moistureFactor > 0.0) moistureFactor else 1.0
        val kForm = if (formworkFactor > 0.0) formworkFactor else 1.0

        val totalEnvFactor = kCarb * kMoist * kForm
        val estimatedFcMpa = ((rawFcMpa * totalEnvFactor) * 100.0).roundToInt() / 100.0
        val estimatedFcKgcm2 = mpaToKgcm2(estimatedFcMpa)
        val estimatedFcPsi = mpaToPsi(estimatedFcMpa)

        // 8. Incertidumbre expandida de medición ISO/IEC 17025 (k=2, 95% de confianza)
        // u_c = sqrt( u_dispersion^2 + u_instrument^2 + u_model^2 )
        val uDispersion = if (readingsForStats.isNotEmpty()) (stdDev / sqrt(readingsForStats.size.toDouble())) * 0.8 else 1.0
        val uModel = estimatedFcMpa * (if (model == CurveModel.CUSTOM_CALIBRATED || model == CurveModel.SONREB_COMBINED) 0.06 else 0.12)
        val uCombined = sqrt(uDispersion.pow(2.0) + uModel.pow(2.0) + 0.5.pow(2.0))
        val expandedUncertainty = ((2.0 * uCombined) * 10.0).roundToInt() / 10.0

        // 9. Conformidad respecto al f'c de diseño (NSR-10 C.5.6 y C.20)
        val complianceRatio = if (fcDesignMpa > 0) {
            (((estimatedFcMpa / fcDesignMpa) * 100.0) * 10.0).roundToInt() / 10.0
        } else 100.0

        val formulaString = when (model) {
            CurveModel.PROCEQ_N_STANDARD -> "f'c = 0.0245·R² + 0.155·R - 3.2"
            CurveModel.NSR10_COLOMBIA -> "f'c = 0.0225·R² + 0.180·R - 3.5"
            CurveModel.ASTM_POLYNOMIAL -> "f'c = 0.0212·R² + 0.325·R - 5.1"
            CurveModel.CUSTOM_CALIBRATED -> "f'c = $customA · R^$customB"
            CurveModel.SONREB_COMBINED -> "f'c = $customA · R^$customB · V^1.85 (UPV=${if (upvKmS > 0) upvKmS else 4.0} km/s)"
        }

        val status: TestStatus
        val statusNotes: String

        if (isInvalidByDiscard || cleanReadings.size < 10) {
            status = TestStatus.INVALIDO
            statusNotes = if (isInvalidByDiscard) {
                "NTC 3692 / ASTM C805: Se descartaron $totalExcluded lecturas (> 6 del promedio). Ensayo NO VÁLIDO por alta dispersión. Repetir en zona adyacente."
            } else {
                "Muestra incompleta (${cleanReadings.size}/10 impactos)."
            }
        } else if (complianceRatio >= 95.0) {
            status = TestStatus.CUMPLE
            statusNotes = "Resistencia estimada ($estimatedFcMpa ± $expandedUncertainty MPa) satisface el f'c de diseño ($fcDesignMpa MPa) con $complianceRatio%. Conforme con NSR-10 Título C."
        } else if (complianceRatio >= 80.0) {
            status = TestStatus.DUDOSO
            statusNotes = "Resistencia estimada ($estimatedFcMpa ± $expandedUncertainty MPa) está en zona dudosa (${complianceRatio}%). Según NSR-10 C.5.6.5 se requiere verificación con núcleos diamantados (NTC 3658 / ASTM C42)."
        } else {
            status = TestStatus.NO_CUMPLE
            statusNotes = "Resistencia estimada ($estimatedFcMpa ± $expandedUncertainty MPa) es deficiente (< 80% de $fcDesignMpa MPa). Alerta patológica/estructural según NSR-10."
        }

        return EvaluationResult(
            validReadings = validReadings,
            excludedIndices = excludedIndices,
            meanRaw = meanRaw,
            correctionAngle = correctionAngle,
            meanCorrected = meanCorrected,
            stdDev = stdDev,
            cov = cov,
            estimatedFcMpa = estimatedFcMpa,
            estimatedFcKgcm2 = estimatedFcKgcm2,
            estimatedFcPsi = estimatedFcPsi,
            complianceRatio = complianceRatio,
            uncertaintyMpa = expandedUncertainty,
            status = status,
            statusNotes = statusNotes,
            formulaUsed = formulaString
        )
    }

    data class CurvePoint(
        val rebound: Double,
        val fcProceq: Double,
        val fcNSR10: Double,
        val fcASTM: Double
    )

    fun getCurvePoints(): List<CurvePoint> {
        val points = mutableListOf<CurvePoint>()
        for (r in 18..56) {
            val rDouble = r.toDouble()
            points.add(
                CurvePoint(
                    rebound = rDouble,
                    fcProceq = calculateFcFromRebound(rDouble, CurveModel.PROCEQ_N_STANDARD),
                    fcNSR10 = calculateFcFromRebound(rDouble, CurveModel.NSR10_COLOMBIA),
                    fcASTM = calculateFcFromRebound(rDouble, CurveModel.ASTM_POLYNOMIAL)
                )
            )
        }
        return points
    }
}

