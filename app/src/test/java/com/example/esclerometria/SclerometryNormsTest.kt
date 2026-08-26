package com.example.esclerometria

import com.example.esclerometria.model.CurveModel
import com.example.esclerometria.model.ImpactAngle
import com.example.esclerometria.model.TestStatus
import com.example.esclerometria.utils.SclerometryNorms
import org.junit.Assert.*
import org.junit.Test

class SclerometryNormsTest {

    @Test
    fun testAngleCorrections() {
        val r = 35.0
        val corrHoriz = SclerometryNorms.getAngleCorrection(r, ImpactAngle.HORIZONTAL)
        assertEquals(0.0, corrHoriz, 0.001)

        val corrDown = SclerometryNorms.getAngleCorrection(r, ImpactAngle.DOWN_90)
        assertTrue("Correction for +90 down should be negative", corrDown < 0)

        val corrUp = SclerometryNorms.getAngleCorrection(r, ImpactAngle.UP_90)
        assertTrue("Correction for -90 up should be positive", corrUp > 0)
    }

    @Test
    fun testFcEstimationProceq() {
        val fc = SclerometryNorms.calculateFcFromRebound(36.0, CurveModel.PROCEQ_N_STANDARD)
        assertTrue("f'c for R=36 should be around 25-35 MPa", fc in 25.0..35.0)

        val psi = SclerometryNorms.mpaToPsi(fc)
        assertTrue("PSI conversion for ~30 MPa should be ~4350 PSI", psi in 3600..5000)
    }

    @Test
    fun testNtc3692EvaluationCompliant() {
        val readings = listOf(36, 37, 35, 38, 36, 37, 39, 36, 37, 36)
        val result = SclerometryNorms.evaluateSclerometryTest(
            readings = readings,
            angle = ImpactAngle.HORIZONTAL,
            fcDesignMpa = 28.0,
            model = CurveModel.PROCEQ_N_STANDARD
        )

        assertEquals(0, result.excludedIndices.size)
        assertTrue("Mean corrected should be ~36.7", result.meanCorrected in 36.0..37.5)
        assertEquals(TestStatus.CUMPLE, result.status)
        assertTrue("Compliance ratio should be >= 100%", result.complianceRatio >= 100)
    }

    @Test
    fun testNtc3692EvaluationWithOutlier() {
        // One reading is 20 (more than 6 away from mean of ~36)
        val readings = listOf(36, 37, 35, 38, 36, 37, 39, 36, 37, 20)
        val result = SclerometryNorms.evaluateSclerometryTest(
            readings = readings,
            angle = ImpactAngle.HORIZONTAL,
            fcDesignMpa = 28.0,
            model = CurveModel.PROCEQ_N_STANDARD
        )

        assertTrue("Should exclude the outlier at index 9", result.excludedIndices.contains(9))
        assertEquals(1, result.excludedIndices.size)
    }

    @Test
    fun testNtc3692InvalidTestWhenMoreThanTwoExcluded() {
        // Three readings differ >6
        val readings = listOf(36, 37, 35, 38, 36, 37, 39, 20, 21, 22)
        val result = SclerometryNorms.evaluateSclerometryTest(
            readings = readings,
            angle = ImpactAngle.HORIZONTAL,
            fcDesignMpa = 28.0,
            model = CurveModel.PROCEQ_N_STANDARD
        )

        assertEquals(TestStatus.INVALIDO, result.status)
        assertTrue("Should contain invalid status explanation", result.statusNotes.contains("ANULADO") || result.statusNotes.contains("descartaron"))
    }

    @Test
    fun testCustomPowerCurveEvaluation() {
        val readings = listOf(35, 35, 36, 35, 36, 35, 35, 36, 35, 35)
        val result = SclerometryNorms.evaluateSclerometryTest(
            readings = readings,
            angle = ImpactAngle.HORIZONTAL,
            fcDesignMpa = 28.0,
            model = CurveModel.CUSTOM_CALIBRATED,
            customA = 0.0245,
            customB = 2.052
        )

        assertTrue("Custom curve f'c should be calculated accurately", result.estimatedFcMpa > 20.0)
        assertTrue("Uncertainty U should be calculated", result.uncertaintyMpa > 0.0)
        assertTrue("Formula used should reflect custom curve", result.formulaUsed.contains("0.0245"))
    }

    @Test
    fun testSonRebCombinedMethod() {
        val readings = listOf(38, 38, 39, 38, 37, 38, 38, 39, 38, 38)
        val result = SclerometryNorms.evaluateSclerometryTest(
            readings = readings,
            angle = ImpactAngle.HORIZONTAL,
            fcDesignMpa = 30.0,
            model = CurveModel.SONREB_COMBINED,
            upvKmS = 4.20
        )

        assertTrue("SonReb f'c should be in realistic structural range", result.estimatedFcMpa in 25.0..45.0)
        assertTrue("Formula used should include UPV", result.formulaUsed.contains("4.2"))
    }

    @Test
    fun testCarbonationAndMoistureCorrection() {
        val readings = listOf(35, 35, 36, 35, 36, 35, 35, 36, 35, 35)
        val resultUncorrected = SclerometryNorms.evaluateSclerometryTest(
            readings = readings,
            angle = ImpactAngle.HORIZONTAL,
            fcDesignMpa = 28.0,
            carbonationDepthMm = 0.0,
            moistureFactor = 1.0
        )

        val resultCarbonated = SclerometryNorms.evaluateSclerometryTest(
            readings = readings,
            angle = ImpactAngle.HORIZONTAL,
            fcDesignMpa = 28.0,
            carbonationDepthMm = 4.0, // 4mm carbonation reduces overestimated surface hardness
            moistureFactor = 1.0
        )

        assertTrue(
            "Carbonated concrete should have a reduced estimated f'c to avoid overestimation",
            resultCarbonated.estimatedFcMpa < resultUncorrected.estimatedFcMpa
        )
    }

    @Test
    fun testFitPowerRegressionFromCoreData() {
        val coreData = "30:22.0; 35:30.0; 40:39.0"
        val fit = SclerometryNorms.fitPowerRegressionFromCoreData(coreData)
        assertTrue("Coefficient a should be positive", fit.first > 0.0)
        assertTrue("Exponent b should be around 1.5 - 2.5", fit.second in 1.0..3.0)
        assertTrue("R^2 should be close to 1.0", fit.third > 0.90)
    }
}
