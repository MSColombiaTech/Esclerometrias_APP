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
}
