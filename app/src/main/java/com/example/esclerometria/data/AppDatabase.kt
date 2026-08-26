package com.example.esclerometria.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.esclerometria.model.CurveModel
import com.example.esclerometria.model.ElementType
import com.example.esclerometria.model.ImpactAngle
import com.example.esclerometria.model.SurfaceCondition
import com.example.esclerometria.utils.SclerometryNorms
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [ProjectEntity::class, SclerometryTestEntity::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun projectDao(): ProjectDao
    abstract fun testDao(): TestDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "esclerometria_database.db"
                )
                    .addCallback(DatabaseCallback(scope))
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }

    private class DatabaseCallback(
        private val scope: CoroutineScope
    ) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                scope.launch(Dispatchers.IO) {
                    populateInitialData(database.projectDao(), database.testDao())
                }
            }
        }
    }
}

suspend fun populateInitialData(projectDao: ProjectDao, testDao: TestDao) {
    val now = System.currentTimeMillis()

    val p1 = ProjectEntity(
        id = "prj-bogota-01",
        code = "OBRA-BOG-2026-04",
        name = "Edificio Residencial Torres de Monserrate",
        client = "Constructora Bolívar S.A.",
        location = "Calle 94 # 11A-32, Chicó Norte",
        municipality = "Bogotá D.C.",
        department = "Cundinamarca",
        contractor = "Ingeniería & Estructuras Andinas SAS",
        supervision = "Interventoría Técnica Colombiana SAS",
        engineerInCharge = "Ing. Carlos Andrés Restrepo M.",
        licenseNumber = "TP 25202-18456 CND",
        defaultHammerModel = "Schmidt Original Tipo N (2.207 Nm)",
        defaultHammerSerial = "SCH-N-88492-COL",
        defaultCurve = CurveModel.PROCEQ_N_STANDARD.name,
        notes = "Evaluación de control de calidad no destructivo en elementos de concreto reforzado a los 28 días según NSR-10 Título C.",
        createdAt = now - 86400000L * 5,
        updatedAt = now - 86400000L * 1
    )

    val p2 = ProjectEntity(
        id = "prj-girardot-02",
        code = "INFRA-GIR-2026-11",
        name = "Puente Vehicular Río Magdalena - Variante Girardot",
        client = "Agencia Nacional de Infraestructura (ANI)",
        location = "Sector Puente Flandes - Girardot, PK 12+400",
        municipality = "Girardot",
        department = "Cundinamarca",
        contractor = "Consorcio Vial Magdalena Centro",
        supervision = "Consorcio Interventor del Río",
        engineerInCharge = "Ing. María Fernanda Gómez",
        licenseNumber = "TP 25202-99321 CND",
        defaultHammerModel = "SilverSchmidt Tipo N Electrónico",
        defaultHammerSerial = "SS-N-44102-B",
        defaultCurve = CurveModel.NSR10_COLOMBIA.name,
        notes = "Verificación de homogeneidad y resistencia en estribos, vigas postensadas y pilas en concreto de 35 MPa (5000 PSI).",
        createdAt = now - 86400000L * 12,
        updatedAt = now - 86400000L * 2
    )

    projectDao.insertProject(p1)
    projectDao.insertProject(p2)

    fun createTest(
        id: String,
        projectId: String,
        elementTag: String,
        elementType: ElementType,
        levelAxis: String,
        fcDesignMpa: Double,
        fcDesignPsi: Int,
        age: Int,
        angle: ImpactAngle,
        readings: List<Int>,
        notes: String,
        createdAt: Long
    ): SclerometryTestEntity {
        val eval = SclerometryNorms.evaluateSclerometryTest(
            readings = readings,
            angle = angle,
            fcDesignMpa = fcDesignMpa,
            model = CurveModel.PROCEQ_N_STANDARD,
            carbonationDepthMm = 1.5
        )
        return SclerometryTestEntity(
            id = id,
            projectId = projectId,
            elementTag = elementTag,
            elementType = elementType.label,
            levelAxis = levelAxis,
            fcDesignMpa = fcDesignMpa,
            fcDesignPsi = fcDesignPsi,
            concreteAgeDays = age,
            hammerModel = "Schmidt Original Tipo N (2.207 Nm)",
            hammerSerial = "SCH-N-88492-COL",
            impactAngle = angle.angle,
            surfaceCondition = SurfaceCondition.CARBORUNDUM.label,
            carbonationDepthMm = 1.5,
            curveModel = CurveModel.PROCEQ_N_STANDARD.name,
            readings = readings,
            excludedIndices = eval.excludedIndices,
            meanRaw = eval.meanRaw,
            correctionAngle = eval.correctionAngle,
            meanCorrected = eval.meanCorrected,
            stdDev = eval.stdDev,
            cov = eval.cov,
            estimatedFcMpa = eval.estimatedFcMpa,
            estimatedFcKgcm2 = eval.estimatedFcKgcm2,
            estimatedFcPsi = eval.estimatedFcPsi,
            complianceRatio = eval.complianceRatio,
            status = eval.status.name,
            statusNotes = eval.statusNotes,
            photos = emptyList(),
            notes = notes,
            operatorName = "Tec. Jhon Fredy Piraquive",
            createdAt = createdAt,
            updatedAt = createdAt
        )
    }

    val tests = listOf(
        createTest(
            "t-01", "prj-bogota-01", "C-101", ElementType.COLUMNA, "Nivel 1 / Eje A-1 (Cara Norte)",
            28.0, 4000, 28, ImpactAngle.HORIZONTAL,
            listOf(36, 37, 35, 38, 36, 37, 39, 36, 37, 36),
            "Superficie previamente desbastada con piedra de carburo de silicio. Sonido metálico seco durante el impacto.",
            now - 86400000L * 3
        ),
        createTest(
            "t-02", "prj-bogota-01", "C-102", ElementType.COLUMNA, "Nivel 1 / Eje B-2 (Cara Este)",
            28.0, 4000, 28, ImpactAngle.HORIZONTAL,
            listOf(35, 36, 34, 37, 35, 36, 35, 34, 36, 35),
            "Concreto homogéneo, buena densidad en zona central de columna.",
            now - 86400000L * 3
        ),
        createTest(
            "t-03", "prj-bogota-01", "V-201", ElementType.VIGA, "Nivel 2 / Eje 2 entre A y C (Fondo Viga)",
            28.0, 4000, 28, ImpactAngle.UP_90,
            listOf(33, 34, 35, 32, 34, 33, 35, 34, 33, 34),
            "Impacto vertical hacia arriba (-90°) en fondo de viga desencofrada.",
            now - 86400000L * 2
        ),
        createTest(
            "t-04", "prj-bogota-01", "LOSA-N3", ElementType.LOSA, "Nivel 3 / Paño Central Ejes C-D",
            21.0, 3000, 28, ImpactAngle.DOWN_90,
            listOf(32, 31, 33, 30, 32, 31, 33, 32, 31, 32),
            "Impacto vertical hacia abajo (+90°) sobre superficie superior afinada.",
            now - 86400000L * 2
        ),
        createTest(
            "t-05", "prj-bogota-01", "M-CONT-01", ElementType.MURO_ESTRUCTURAL, "Sótano 1 / Eje 1 Perimetral",
            28.0, 4000, 21, ImpactAngle.HORIZONTAL,
            listOf(29, 30, 28, 31, 29, 30, 28, 29, 30, 29),
            "Lecturas ligeramente bajas por edad temprana de desencofrado (21 días). En seguimiento.",
            now - 86400000L * 1
        ),
        createTest(
            "t-06", "prj-girardot-02", "PILOTE-P1", ElementType.PILOTE, "Eje Central Pila 1 - Cabezal",
            35.0, 5000, 56, ImpactAngle.HORIZONTAL,
            listOf(42, 43, 41, 44, 42, 43, 42, 41, 44, 43),
            "Excelente compactación en concreto de alto desempeño para cimentación profunda.",
            now - 86400000L * 8
        ),
        createTest(
            "t-07", "prj-girardot-02", "ESTRIBO-OCC", ElementType.CIMENTACION, "Estribo Costado Occidental",
            35.0, 5000, 45, ImpactAngle.HORIZONTAL,
            listOf(40, 41, 39, 42, 40, 41, 39, 40, 42, 41),
            "Prueba en cara vertical previa a colocación de apoyos de neopreno.",
            now - 86400000L * 6
        ),
        createTest(
            "t-08", "prj-girardot-02", "VIGA-POST-01", ElementType.VIGA, "Viga Cajón 1 - Tramo Central",
            35.0, 5000, 28, ImpactAngle.UP_90,
            listOf(38, 39, 37, 40, 38, 39, 38, 37, 40, 39),
            "Lectura vertical hacia arriba en zona postensada.",
            now - 86400000L * 4
        )
    )

    testDao.insertAllTests(tests)
}
