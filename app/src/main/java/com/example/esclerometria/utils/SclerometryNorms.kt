package com.example.esclerometria.utils

import com.example.esclerometria.model.*
import kotlin.math.abs
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

    fun calculateFcFromRebound(
        rCorr: Double,
        model: CurveModel = CurveModel.PROCEQ_N_STANDARD
    ): Double {
        if (rCorr < 10.0) return 0.0

        val fcMpa = when (model) {
            CurveModel.PROCEQ_N_STANDARD -> 0.0436 * rCorr.pow(2.052)
            CurveModel.NSR10_COLOMBIA -> 0.0385 * rCorr.pow(2.085)
            CurveModel.ASTM_POLYNOMIAL -> 0.0212 * rCorr.pow(2.0) + 0.325 * rCorr - 5.1
            CurveModel.CUSTOM_CALIBRATED -> 0.0436 * rCorr.pow(2.052)
        }

        return (fcMpa.coerceAtLeast(0.0) * 100.0).roundToInt() / 100.0
    }

    fun mpaToPsi(mpa: Double): Int = (mpa * 145.0377).roundToInt()
    fun psiToMpa(psi: Int): Double = ((psi / 145.0377) * 100.0).roundToInt() / 100.0
    fun mpaToKgcm2(mpa: Double): Double = ((mpa * 10.19716) * 100.0).roundToInt() / 100.0

    fun evaluateSclerometryTest(
        readings: List<Int>,
        angle: ImpactAngle = ImpactAngle.HORIZONTAL,
        fcDesignMpa: Double = 21.0,
        model: CurveModel = CurveModel.PROCEQ_N_STANDARD,
        carbonationFactor: Double = 1.0
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
                status = TestStatus.INVALIDO,
                statusNotes = "Se requieren mínimo 10 impactos según NTC 3692 para una evaluación válida."
            )
        }

        // 1. Promedio preliminar
        val initialMean = cleanReadings.sum().toDouble() / cleanReadings.size

        // 2. Identificar descartes (|r - initialMean| > 6)
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

        // 5. Corrección por ángulo
        val correctionAngle = (getAngleCorrection(meanRaw, angle) * 100.0).roundToInt() / 100.0
        val meanCorrected = ((meanRaw + correctionAngle).coerceAtLeast(10.0) * 100.0).roundToInt() / 100.0

        // 6. Resistencia estimada
        var estimatedFcMpa = calculateFcFromRebound(meanCorrected, model)
        if (carbonationFactor > 0.0 && carbonationFactor != 1.0) {
            estimatedFcMpa = ((estimatedFcMpa * carbonationFactor) * 100.0).roundToInt() / 100.0
        }

        val estimatedFcKgcm2 = mpaToKgcm2(estimatedFcMpa)
        val estimatedFcPsi = mpaToPsi(estimatedFcMpa)

        // 7. Conformidad respecto al f'c de diseño
        val complianceRatio = if (fcDesignMpa > 0) {
            (((estimatedFcMpa / fcDesignMpa) * 100.0) * 10.0).roundToInt() / 10.0
        } else 100.0

        val status: TestStatus
        val statusNotes: String

        if (isInvalidByDiscard || cleanReadings.size < 10) {
            status = TestStatus.INVALIDO
            statusNotes = if (isInvalidByDiscard) {
                "NTC 3692: Se descartaron $totalExcluded lecturas (> 6 del promedio). Ensayo no válido, repetir en zona adyacente."
            } else {
                "Muestra incompleta (${cleanReadings.size}/10 impactos)."
            }
        } else if (complianceRatio >= 95.0) {
            status = TestStatus.CUMPLE
            statusNotes = "Resistencia estimada ($estimatedFcMpa MPa) satisface el f'c de diseño ($fcDesignMpa MPa) con $complianceRatio%."
        } else if (complianceRatio >= 80.0) {
            status = TestStatus.DUDOSO
            statusNotes = "Resistencia estimada ($estimatedFcMpa MPa) está entre el 80% y 95% del diseño. Según NSR-10 C.5.6 se recomienda verificar con extracción de núcleos (NTC 3658 / ASTM C42)."
        } else {
            status = TestStatus.NO_CUMPLE
            statusNotes = "Resistencia estimada ($estimatedFcMpa MPa) es deficiente (< 80% de $fcDesignMpa MPa). Alerta estructural según NSR-10."
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
            status = status,
            statusNotes = statusNotes
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
