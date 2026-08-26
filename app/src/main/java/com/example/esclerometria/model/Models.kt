package com.example.esclerometria.model

enum class ElementType(val label: String) {
    COLUMNA("Columna"),
    VIGA("Viga"),
    LOSA("Losa"),
    MURO_ESTRUCTURAL("Muro Estructural"),
    ZAPATA("Zapata"),
    PAVIMENTO_PISO("Pavimento / Piso"),
    PILOTE("Pilote"),
    CIMENTACION("Cimentación"),
    PEDESTAL("Pedestal"),
    OTRO("Otro");

    companion object {
        fun fromString(value: String): ElementType {
            return entries.find { it.label.equals(value, ignoreCase = true) || it.name.equals(value, ignoreCase = true) } ?: COLUMNA
        }
    }
}

enum class ImpactAngle(val angle: Int, val label: String, val description: String, val icon: String) {
    HORIZONTAL(0, "0° Horizontal", "Columnas, muros y caras laterales", "➡️"),
    DOWN_90(90, "+90° Abajo", "Losas superiores, pisos y pavimentos", "⬇️"),
    UP_90(-90, "-90° Arriba", "Fondos de vigas y losas (cielos)", "⬆️"),
    DOWN_45(45, "+45° Inclinado Abajo", "Taludes y caras inclinadas", "↘️"),
    UP_45(-45, "-45° Inclinado Arriba", "Achaflanados y ménsulas", "↗️");

    companion object {
        fun fromAngle(angle: Int): ImpactAngle {
            return entries.find { it.angle == angle } ?: HORIZONTAL
        }
    }
}

enum class SurfaceCondition(val label: String) {
    CARBORUNDUM("Pulido con piedra Carborundum"),
    DRY_AIR("Seco al aire"),
    METALLIC_FORM("Encofrado metálico liso"),
    WOOD_FORM("Encofrado de madera"),
    WET("Superficie Húmeda");

    companion object {
        fun fromString(value: String): SurfaceCondition {
            return entries.find { it.label.equals(value, ignoreCase = true) || it.name.equals(value, ignoreCase = true) } ?: CARBORUNDUM
        }
    }
}

enum class CurveModel(val label: String, val formula: String) {
    PROCEQ_N_STANDARD("Curva Universal NTC 3692 / Tipo N", "f'c = 0.0436 · R^2.052"),
    NSR10_COLOMBIA("Curva NSR-10 Agregados Colombianos", "f'c = 0.0385 · R^2.085"),
    ASTM_POLYNOMIAL("Modelo Polinomial ASTM C805", "f'c = 0.0212·R² + 0.325·R - 5.1"),
    CUSTOM_CALIBRATED("Curva Calibrada in-situ", "f'c = a · R^b");

    companion object {
        fun fromString(value: String): CurveModel {
            return entries.find { it.name.equals(value, ignoreCase = true) } ?: PROCEQ_N_STANDARD
        }
    }
}

enum class TestStatus(val label: String) {
    CUMPLE("CUMPLE"),
    DUDOSO("DUDOSO"),
    NO_CUMPLE("NO CUMPLE"),
    INVALIDO("INVÁLIDO");

    companion object {
        fun fromString(value: String): TestStatus {
            return entries.find { it.name.equals(value, ignoreCase = true) || it.label.equals(value, ignoreCase = true) } ?: CUMPLE
        }
    }
}

data class TestPhoto(
    val id: String,
    val dataUrl: String,
    val caption: String = "",
    val timestamp: Long = System.currentTimeMillis()
)

data class ConcretePreset(
    val mpa: Double,
    val psi: Int,
    val label: String
)

data class EvaluationResult(
    val validReadings: List<Int>,
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
    val status: TestStatus,
    val statusNotes: String
)

data class Project(
    val id: String,
    val code: String,
    val name: String,
    val client: String,
    val location: String,
    val municipality: String,
    val department: String,
    val contractor: String,
    val supervision: String,
    val engineerInCharge: String,
    val licenseNumber: String = "",
    val defaultHammerModel: String = "Schmidt Original Tipo N (2.207 Nm)",
    val defaultHammerSerial: String = "SCH-N-88492-COL",
    val defaultCurve: CurveModel = CurveModel.PROCEQ_N_STANDARD,
    val notes: String = "",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

data class SclerometryTest(
    val id: String,
    val projectId: String,
    val elementTag: String,
    val elementType: ElementType,
    val levelAxis: String,
    val fcDesignMpa: Double,
    val fcDesignPsi: Int,
    val concreteAgeDays: Int,
    val hammerModel: String,
    val hammerSerial: String,
    val impactAngle: ImpactAngle,
    val surfaceCondition: SurfaceCondition,
    val carbonationDepthMm: Double,
    val curveModel: CurveModel,
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
    val status: TestStatus,
    val statusNotes: String,
    val photos: List<TestPhoto> = emptyList(),
    val notes: String = "",
    val operatorName: String = "Tec. Jhon Fredy Piraquive",
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
