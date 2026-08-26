package com.example.esclerometria.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.esclerometria.model.CurveModel
import com.example.esclerometria.model.ElementType
import com.example.esclerometria.model.ImpactAngle
import com.example.esclerometria.model.Project
import com.example.esclerometria.model.SclerometryTest
import com.example.esclerometria.model.SurfaceCondition
import com.example.esclerometria.model.TestPhoto
import com.example.esclerometria.model.TestStatus

@Entity(tableName = "projects")
data class ProjectEntity(
    @PrimaryKey val id: String,
    val code: String,
    val name: String,
    val client: String,
    val location: String,
    val municipality: String,
    val department: String,
    val contractor: String,
    val supervision: String,
    val engineerInCharge: String,
    val licenseNumber: String,
    val defaultHammerModel: String,
    val defaultHammerSerial: String,
    val defaultCurve: String,
    val notes: String,
    val createdAt: Long,
    val updatedAt: Long
) {
    fun toDomain(): Project = Project(
        id = id,
        code = code,
        name = name,
        client = client,
        location = location,
        municipality = municipality,
        department = department,
        contractor = contractor,
        supervision = supervision,
        engineerInCharge = engineerInCharge,
        licenseNumber = licenseNumber,
        defaultHammerModel = defaultHammerModel,
        defaultHammerSerial = defaultHammerSerial,
        defaultCurve = CurveModel.fromString(defaultCurve),
        notes = notes,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    companion object {
        fun fromDomain(p: Project): ProjectEntity = ProjectEntity(
            id = p.id,
            code = p.code,
            name = p.name,
            client = p.client,
            location = p.location,
            municipality = p.municipality,
            department = p.department,
            contractor = p.contractor,
            supervision = p.supervision,
            engineerInCharge = p.engineerInCharge,
            licenseNumber = p.licenseNumber,
            defaultHammerModel = p.defaultHammerModel,
            defaultHammerSerial = p.defaultHammerSerial,
            defaultCurve = p.defaultCurve.name,
            notes = p.notes,
            createdAt = p.createdAt,
            updatedAt = p.updatedAt
        )
    }
}

@Entity(tableName = "tests")
data class SclerometryTestEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val elementTag: String,
    val elementType: String,
    val levelAxis: String,
    val fcDesignMpa: Double,
    val fcDesignPsi: Int,
    val concreteAgeDays: Int,
    val hammerModel: String,
    val hammerSerial: String,
    val impactAngle: Int,
    val surfaceCondition: String,
    val carbonationDepthMm: Double,
    val curveModel: String,
    val customA: Double = 0.0245,
    val customB: Double = 2.052,
    val customC: Double = 0.0,
    val ultrasonicPulseVelocity: Double = 0.0,
    val moistureFactor: Double = 1.0,
    val formworkFactor: Double = 1.0,
    val uncertaintyMpa: Double = 0.0,
    val coreCalibrationData: String = "",
    val readings: List<Int>,
    val excludedIndices: List<Int>,
    val meanRaw: Double,
    val correctionAngle: Double,
    val meanCorrected: Double,
    val stdDev: Double,
    val cov: Double,
    val estimatedFcMpa: Double,
    val estimatedFcKgcm2: Double,
    val estimatedFcPsi: Int,
    val complianceRatio: Double,
    val status: String,
    val statusNotes: String,
    val photos: List<TestPhoto>,
    val notes: String,
    val operatorName: String,
    val createdAt: Long,
    val updatedAt: Long
) {
    fun toDomain(): SclerometryTest = SclerometryTest(
        id = id,
        projectId = projectId,
        elementTag = elementTag,
        elementType = ElementType.fromString(elementType),
        levelAxis = levelAxis,
        fcDesignMpa = fcDesignMpa,
        fcDesignPsi = fcDesignPsi,
        concreteAgeDays = concreteAgeDays,
        hammerModel = hammerModel,
        hammerSerial = hammerSerial,
        impactAngle = ImpactAngle.fromAngle(impactAngle),
        surfaceCondition = SurfaceCondition.fromString(surfaceCondition),
        carbonationDepthMm = carbonationDepthMm,
        curveModel = CurveModel.fromString(curveModel),
        customA = customA,
        customB = customB,
        customC = customC,
        ultrasonicPulseVelocity = ultrasonicPulseVelocity,
        moistureFactor = moistureFactor,
        formworkFactor = formworkFactor,
        uncertaintyMpa = uncertaintyMpa,
        coreCalibrationData = coreCalibrationData,
        readings = readings,
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
        status = TestStatus.fromString(status),
        statusNotes = statusNotes,
        photos = photos,
        notes = notes,
        operatorName = operatorName,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    companion object {
        fun fromDomain(t: SclerometryTest): SclerometryTestEntity = SclerometryTestEntity(
            id = t.id,
            projectId = t.projectId,
            elementTag = t.elementTag,
            elementType = t.elementType.label,
            levelAxis = t.levelAxis,
            fcDesignMpa = t.fcDesignMpa,
            fcDesignPsi = t.fcDesignPsi,
            concreteAgeDays = t.concreteAgeDays,
            hammerModel = t.hammerModel,
            hammerSerial = t.hammerSerial,
            impactAngle = t.impactAngle.angle,
            surfaceCondition = t.surfaceCondition.label,
            carbonationDepthMm = t.carbonationDepthMm,
            curveModel = t.curveModel.name,
            customA = t.customA,
            customB = t.customB,
            customC = t.customC,
            ultrasonicPulseVelocity = t.ultrasonicPulseVelocity,
            moistureFactor = t.moistureFactor,
            formworkFactor = t.formworkFactor,
            uncertaintyMpa = t.uncertaintyMpa,
            coreCalibrationData = t.coreCalibrationData,
            readings = t.readings,
            excludedIndices = t.excludedIndices,
            meanRaw = t.meanRaw,
            correctionAngle = t.correctionAngle,
            meanCorrected = t.meanCorrected,
            stdDev = t.stdDev,
            cov = t.cov,
            estimatedFcMpa = t.estimatedFcMpa,
            estimatedFcKgcm2 = t.estimatedFcKgcm2,
            estimatedFcPsi = t.estimatedFcPsi,
            complianceRatio = t.complianceRatio,
            status = t.status.name,
            statusNotes = t.statusNotes,
            photos = t.photos,
            notes = t.notes,
            operatorName = t.operatorName,
            createdAt = t.createdAt,
            updatedAt = t.updatedAt
        )
    }
}
