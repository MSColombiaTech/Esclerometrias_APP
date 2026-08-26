package com.example.esclerometria.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.esclerometria.model.*
import com.example.esclerometria.ui.theme.*
import com.example.esclerometria.utils.SclerometryNorms
import kotlin.math.max
import kotlin.math.roundToInt

@Composable
fun ProjectDetailScreen(
    project: Project,
    tests: List<SclerometryTest>,
    onNewTest: () -> Unit,
    onEditTest: (SclerometryTest) -> Unit,
    onDeleteTest: (String) -> Unit,
    onEditProject: () -> Unit,
    onOpenExport: () -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Ensayos (${tests.size})", "Curvas NTC 3692", "Estadísticas NSR-10", "Fotos (${tests.sumOf { it.photos.size }})")

    // Stats calculations
    val compliesCount = tests.count { it.status == TestStatus.CUMPLE }
    val doubtfulCount = tests.count { it.status == TestStatus.DUDOSO }
    val failCount = tests.count { it.status == TestStatus.NO_CUMPLE }
    val invalidCount = tests.count { it.status == TestStatus.INVALIDO }
    val complianceRate = if (tests.isNotEmpty()) ((compliesCount.toDouble() / tests.size) * 100.0).roundToInt() else 0

    val validTests = tests.filter { it.status != TestStatus.INVALIDO && it.estimatedFcMpa > 0 }
    val avgFcMpa = if (validTests.isNotEmpty()) {
        ((validTests.map { it.estimatedFcMpa }.average()) * 10.0).roundToInt() / 10.0
    } else 0.0
    val avgFcPsi = SclerometryNorms.mpaToPsi(avgFcMpa)

    Scaffold(
        containerColor = Slate950,
        floatingActionButton = {
            if (selectedTab == 0) {
                FloatingActionButton(
                    onClick = onNewTest,
                    containerColor = BrandSky,
                    contentColor = Color.White,
                    modifier = Modifier.testTag("fab_new_test")
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Nuevo Ensayo")
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Nuevo Ensayo", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            // Project Metadata Banner
            ProjectHeaderCard(
                project = project,
                onEditProject = onEditProject,
                onOpenExport = onOpenExport
            )

            // KPI Overview Row
            KpiOverviewRow(
                totalTests = tests.size,
                complianceRate = complianceRate,
                avgFcMpa = avgFcMpa,
                avgFcPsi = avgFcPsi,
                doubtfulCount = doubtfulCount,
                failCount = failCount
            )

            // Navigation Tabs
            ScrollableTabRow(
                selectedTabIndex = selectedTab,
                containerColor = Slate900,
                contentColor = Slate100,
                edgePadding = 12.dp,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = BrandSkyLight,
                        height = 3.dp
                    )
                },
                divider = { HorizontalDivider(color = Slate800) }
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = {
                            Text(
                                text = title,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Medium,
                                color = if (selectedTab == index) BrandSkyLight else Slate400,
                                fontSize = 13.sp
                            )
                        }
                    )
                }
            }

            // Tab Content
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
            ) {
                when (selectedTab) {
                    0 -> TestsListTab(
                        tests = tests,
                        onNewTest = onNewTest,
                        onEditTest = onEditTest,
                        onDeleteTest = onDeleteTest
                    )
                    1 -> CurveViewerTab(tests = tests, project = project)
                    2 -> AnalyticsTab(tests = tests)
                    3 -> PhotoGalleryTab(tests = tests)
                }
            }
        }
    }
}

@Composable
fun ProjectHeaderCard(
    project: Project,
    onEditProject: () -> Unit,
    onOpenExport: () -> Unit
) {
    Surface(
        color = Slate900,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = BrandSky.copy(alpha = 0.2f),
                        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(BrandSky, BrandSkyLight)))
                    ) {
                        Text(
                            text = project.code,
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = BrandSkyLight,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${project.municipality}, ${project.department}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Slate300
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onOpenExport, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Description, contentDescription = "Informe", tint = EmeraldSuccess, modifier = Modifier.size(18.dp))
                    }
                    IconButton(onClick = onEditProject, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Editar", tint = Slate300, modifier = Modifier.size(18.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = project.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Cliente: ${project.client}", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    Text("Contratista: ${project.contractor}", style = MaterialTheme.typography.labelSmall, color = Slate400)
                }
                Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                    Text("Ing. ${project.engineerInCharge}", style = MaterialTheme.typography.labelSmall, color = Slate300, fontWeight = FontWeight.SemiBold)
                    Text(project.defaultHammerModel, style = MaterialTheme.typography.labelSmall, color = AmberGold)
                }
            }
        }
    }
}

@Composable
fun KpiOverviewRow(
    totalTests: Int,
    complianceRate: Int,
    avgFcMpa: Double,
    avgFcPsi: Int,
    doubtfulCount: Int,
    failCount: Int
) {
    Surface(
        color = Slate850,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Card 1: Total
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Ensayos", style = MaterialTheme.typography.labelSmall, color = Slate400)
                Text(
                    text = "$totalTests",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
            }

            // Card 2: Compliance
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Conformidad", style = MaterialTheme.typography.labelSmall, color = Slate400)
                Text(
                    text = "$complianceRate%",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = if (complianceRate >= 90) EmeraldSuccess else if (complianceRate >= 70) AmberGold else RoseAlert
                )
            }

            // Card 3: Avg fc
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("f'c Promedio", style = MaterialTheme.typography.labelSmall, color = Slate400)
                Text(
                    text = "$avgFcMpa MPa",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = BrandSkyLight
                )
            }

            // Card 4: Alerts
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("Dudosos / Falla", style = MaterialTheme.typography.labelSmall, color = Slate400)
                Text(
                    text = "$doubtfulCount / $failCount",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = if (failCount > 0) RoseAlert else if (doubtfulCount > 0) AmberGold else EmeraldSuccess
                )
            }
        }
    }
}

// ----------------------------------------------------
// TAB 0: TESTS LIST
// ----------------------------------------------------
@Composable
fun TestsListTab(
    tests: List<SclerometryTest>,
    onNewTest: () -> Unit,
    onEditTest: (SclerometryTest) -> Unit,
    onDeleteTest: (String) -> Unit
) {
    var selectedElementType by remember { mutableStateOf("ALL") }
    var selectedStatus by remember { mutableStateOf("ALL") }
    var testToDelete by remember { mutableStateOf<SclerometryTest?>(null) }

    val filteredTests = remember(tests, selectedElementType, selectedStatus) {
        tests.filter { test ->
            val matchType = if (selectedElementType == "ALL") true else test.elementType.label == selectedElementType
            val matchStatus = if (selectedStatus == "ALL") true else test.status.name == selectedStatus
            matchType && matchStatus
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 14.dp),
        contentPadding = PaddingValues(top = 14.dp, bottom = 80.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Filter Chips Row
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                // Element Type Filter Row
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    item {
                        FilterChip(
                            selected = selectedElementType == "ALL",
                            onClick = { selectedElementType = "ALL" },
                            label = { Text("Todos (${tests.size})", fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = BrandSky,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                    items(ElementType.entries) { type ->
                        val count = tests.count { it.elementType == type }
                        if (count > 0) {
                            FilterChip(
                                selected = selectedElementType == type.label,
                                onClick = { selectedElementType = type.label },
                                label = { Text("${type.label} ($count)", fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = BrandSky,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }

                // Status Filter Row
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    item {
                        FilterChip(
                            selected = selectedStatus == "ALL",
                            onClick = { selectedStatus = "ALL" },
                            label = { Text("Todos los Estados", fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Slate700,
                                selectedLabelColor = Color.White
                            )
                        )
                    }
                    items(TestStatus.entries) { status ->
                        val count = tests.count { it.status == status }
                        if (count > 0) {
                            FilterChip(
                                selected = selectedStatus == status.name,
                                onClick = { selectedStatus = status.name },
                                label = { Text("${status.label} ($count)", fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = when (status) {
                                        TestStatus.CUMPLE -> EmeraldSuccess
                                        TestStatus.DUDOSO -> AmberGold
                                        TestStatus.NO_CUMPLE -> RoseAlert
                                        TestStatus.INVALIDO -> Color(0xFF8B5CF6)
                                    },
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }
            }
        }

        if (filteredTests.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Slate900),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp)
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Science, contentDescription = null, tint = Slate500, modifier = Modifier.size(44.dp))
                        Spacer(modifier = Modifier.height(10.dp))
                        Text("No hay ensayos en esta categoría", style = MaterialTheme.typography.titleMedium, color = Slate200)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("Registra un nuevo ensayo con 10 lecturas de impacto.", style = MaterialTheme.typography.bodySmall, color = Slate400)
                    }
                }
            }
        }

        items(filteredTests, key = { it.id }) { test ->
            TestCard(
                test = test,
                onEdit = { onEditTest(test) },
                onDelete = { testToDelete = test }
            )
        }
    }

    // Delete Test Dialog
    testToDelete?.let { t ->
        AlertDialog(
            onDismissRequest = { testToDelete = null },
            title = { Text("¿Eliminar Ensayo?", fontWeight = FontWeight.Bold, color = Slate100) },
            text = {
                Text("Se eliminará el ensayo del elemento '${t.elementTag}' (${t.elementType.label}) permanentemente.", color = Slate300)
            },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteTest(t.id)
                        testToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoseAlert)
                ) {
                    Text("Eliminar", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { testToDelete = null }) {
                    Text("Cancelar", color = Slate300)
                }
            },
            containerColor = Slate900
        )
    }
}

@Composable
fun TestCard(
    test: SclerometryTest,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(Slate700, Slate800))),
        modifier = Modifier.fillMaxWidth().testTag("test_card_${test.elementTag}")
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(14.dp)
        ) {
            // Top Row: Tag, Element Type, Status Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Slate800,
                        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(Slate600, Slate700)))
                    ) {
                        Text(
                            text = test.elementTag,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Black,
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = test.elementType.label,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = BrandSkyLight
                    )
                }

                // Status Badge
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = when (test.status) {
                        TestStatus.CUMPLE -> EmeraldSuccess.copy(alpha = 0.2f)
                        TestStatus.DUDOSO -> AmberGold.copy(alpha = 0.2f)
                        TestStatus.NO_CUMPLE -> RoseAlert.copy(alpha = 0.2f)
                        TestStatus.INVALIDO -> Color(0xFF8B5CF6).copy(alpha = 0.2f)
                    },
                    border = BorderStroke(
                        1.dp,
                        when (test.status) {
                            TestStatus.CUMPLE -> EmeraldSuccess
                            TestStatus.DUDOSO -> AmberGold
                            TestStatus.NO_CUMPLE -> RoseAlert
                            TestStatus.INVALIDO -> Color(0xFF8B5CF6)
                        }
                    )
                ) {
                    Text(
                        text = "${test.status.label} (${test.complianceRatio}%)",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Black,
                        color = when (test.status) {
                            TestStatus.CUMPLE -> EmeraldSuccess
                            TestStatus.DUDOSO -> AmberGold
                            TestStatus.NO_CUMPLE -> RoseAlert
                            TestStatus.INVALIDO -> Color(0xFFC4B5FD)
                        },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Location Axis & Angle
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = test.levelAxis,
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate300
                )
                Text(
                    text = "${test.impactAngle.icon} ${test.impactAngle.label} (Edad: ${test.concreteAgeDays}d)",
                    style = MaterialTheme.typography.labelSmall,
                    color = AmberGold
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // 10 Rebound Readings Chips Row
            Text(
                text = "Lecturas de Rebote Schmidt (${test.readings.size} impactos):",
                style = MaterialTheme.typography.labelSmall,
                color = Slate400
            )

            Spacer(modifier = Modifier.height(4.dp))

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(test.readings.size) { idx ->
                    val r = test.readings[idx]
                    val isExcluded = test.excludedIndices.contains(idx)

                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = if (isExcluded) RoseAlert.copy(alpha = 0.25f) else Slate800,
                        border = BorderStroke(1.dp, if (isExcluded) RoseAlert else Slate700)
                    ) {
                        Text(
                            text = "$r",
                            style = MaterialTheme.typography.labelSmall.copy(
                                textDecoration = if (isExcluded) TextDecoration.LineThrough else TextDecoration.None,
                                fontFamily = FontFamily.Monospace
                            ),
                            fontWeight = FontWeight.Bold,
                            color = if (isExcluded) RoseAlert else Slate100,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                        )
                    }
                }
            }

            if (test.excludedIndices.isNotEmpty()) {
                Text(
                    text = "⚠️ Se descartaron ${test.excludedIndices.size} lectura(s) por diferir >6 unidades del promedio preliminar.",
                    style = MaterialTheme.typography.labelSmall,
                    color = AmberGold,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Rebound & Resistance Stats Card
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = Slate850,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("R Corregido", style = MaterialTheme.typography.labelSmall, color = Slate400)
                        Text(
                            "${test.meanCorrected} (ΔR: ${test.correctionAngle})",
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text("CV: ${test.cov}% (s: ${test.stdDev})", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text("f'c Estimado vs Diseño", style = MaterialTheme.typography.labelSmall, color = Slate400)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "${test.estimatedFcMpa} MPa",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Black,
                                color = BrandSkyLight
                            )
                            Text(
                                " / ${test.fcDesignMpa} MPa",
                                style = MaterialTheme.typography.bodySmall,
                                color = Slate400
                            )
                        }
                        Text("${test.estimatedFcPsi} PSI (${test.estimatedFcKgcm2} kg/cm²)", style = MaterialTheme.typography.labelSmall, color = Slate300)
                    }
                }
            }

            if (test.notes.isNotBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Nota: ${test.notes}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate300
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            HorizontalDivider(color = Slate800)
            Spacer(modifier = Modifier.height(6.dp))

            // Footer Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Op: ${test.operatorName}",
                    style = MaterialTheme.typography.labelSmall,
                    color = Slate500
                )

                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Editar", tint = Slate300, modifier = Modifier.size(18.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.DeleteOutline, contentDescription = "Eliminar", tint = RoseAlert, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}

// ----------------------------------------------------
// TAB 1: CALIBRATION CURVES CANVAS (PER-ELEMENT & NTC 3692 / NSR-10 / ISO 1920-7)
// ----------------------------------------------------
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CurveViewerTab(tests: List<SclerometryTest>, project: Project) {
    var selectedElementId by remember { mutableStateOf<String?>("ALL") }
    var selectedTestOnChart by remember { mutableStateOf<SclerometryTest?>(null) }
    
    // Toggle options for data visibility ("Agregar o Quitar Datos")
    var showProceqCurve by remember { mutableStateOf(true) }
    var showNsr10Curve by remember { mutableStateOf(true) }
    var showAstmCurve by remember { mutableStateOf(false) }
    var showElementCurve by remember { mutableStateOf(true) }
    var showUncertaintyBand by remember { mutableStateOf(true) }
    var showTestPoints by remember { mutableStateOf(true) }
    var showCorePoints by remember { mutableStateOf(true) }
    var pointStatusFilter by remember { mutableStateOf("ALL") }

    // User-added empirical calibration core points
    val customCorePoints = remember {
        mutableStateListOf(
            CalibrationPoint("cp-1", 32.0, 24.5, "Núcleo N-1 (Columna C-101)", "C-101"),
            CalibrationPoint("cp-2", 36.5, 31.8, "Núcleo N-2 (Viga V-202)", "V-202"),
            CalibrationPoint("cp-3", 40.0, 39.2, "Núcleo N-3 (Muro M-1)", "M-1")
        )
    }
    var showAddPointDialog by remember { mutableStateOf(false) }

    val activeSelectedTest = if (selectedElementId != "ALL") {
        tests.find { it.id == selectedElementId }
    } else null

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. Element Selector Banner (Curvas por Elemento Analizado)
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate900),
                border = BorderStroke(1.dp, BrandSky.copy(alpha = 0.4f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Tune, contentDescription = null, tint = AmberGold, modifier = Modifier.size(22.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = "Curvas por Elemento Analizado (NSR-10 / NTC 3692)",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "Visualiza la correlación específica calibrada para cada elemento estructural.",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Slate400
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Element Selection Chips
                    Text("Seleccionar Elemento a Analizar:", style = MaterialTheme.typography.labelSmall, color = Slate300, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(4.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        item {
                            FilterChip(
                                selected = selectedElementId == "ALL",
                                onClick = {
                                    selectedElementId = "ALL"
                                    selectedTestOnChart = null
                                },
                                label = { Text("🌐 Todos los Elementos (${tests.size})", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = BrandSky,
                                    selectedLabelColor = Color.White,
                                    containerColor = Slate800,
                                    labelColor = Slate300
                                )
                            )
                        }
                        items(tests) { test ->
                            val isSelected = selectedElementId == test.id
                            FilterChip(
                                selected = isSelected,
                                onClick = {
                                    selectedElementId = test.id
                                    selectedTestOnChart = test
                                },
                                label = { Text("${test.elementTag} (${test.elementType.label})", fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = AmberGold,
                                    selectedLabelColor = Slate950,
                                    containerColor = Slate800,
                                    labelColor = Slate300
                                )
                            )
                        }
                    }
                }
            }
        }

        // 2. Interactive Controls: "Agregar o Quitar Datos del Gráfico"
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate900),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.FilterList, contentDescription = null, tint = BrandSkyLight, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Opciones: Agregar o Quitar Datos", fontWeight = FontWeight.Bold, color = Slate100, fontSize = 14.sp)
                        }

                        Button(
                            onClick = { showAddPointDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSuccess),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp), tint = Slate950)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Agregar Núcleo", color = Slate950, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Toggle Chips Row
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        item {
                            FilterChip(
                                selected = showProceqCurve,
                                onClick = { showProceqCurve = !showProceqCurve },
                                label = { Text("NTC 3692 Tipo N", fontSize = 10.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = BrandSkyLight.copy(alpha = 0.25f),
                                    selectedLabelColor = BrandSkyLight,
                                    containerColor = Slate800,
                                    labelColor = Slate400
                                )
                            )
                        }
                        item {
                            FilterChip(
                                selected = showNsr10Curve,
                                onClick = { showNsr10Curve = !showNsr10Curve },
                                label = { Text("NSR-10 Agregados Col.", fontSize = 10.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = AmberGold.copy(alpha = 0.25f),
                                    selectedLabelColor = AmberGold,
                                    containerColor = Slate800,
                                    labelColor = Slate400
                                )
                            )
                        }
                        item {
                            FilterChip(
                                selected = showAstmCurve,
                                onClick = { showAstmCurve = !showAstmCurve },
                                label = { Text("ASTM C805 / ACI 228", fontSize = 10.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFFC084FC).copy(alpha = 0.25f),
                                    selectedLabelColor = Color(0xFFC084FC),
                                    containerColor = Slate800,
                                    labelColor = Slate400
                                )
                            )
                        }
                        if (activeSelectedTest != null) {
                            item {
                                FilterChip(
                                    selected = showElementCurve,
                                    onClick = { showElementCurve = !showElementCurve },
                                    label = { Text("Curva del Elemento (${activeSelectedTest.elementTag})", fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = EmeraldSuccess.copy(alpha = 0.25f),
                                        selectedLabelColor = EmeraldSuccess,
                                        containerColor = Slate800,
                                        labelColor = Slate400
                                    )
                                )
                            }
                        }
                        item {
                            FilterChip(
                                selected = showUncertaintyBand,
                                onClick = { showUncertaintyBand = !showUncertaintyBand },
                                label = { Text("Banda Incertidumbre (±U ISO 17025)", fontSize = 10.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFF38BDF8).copy(alpha = 0.25f),
                                    selectedLabelColor = Color(0xFF38BDF8),
                                    containerColor = Slate800,
                                    labelColor = Slate400
                                )
                            )
                        }
                        item {
                            FilterChip(
                                selected = showTestPoints,
                                onClick = { showTestPoints = !showTestPoints },
                                label = { Text("Puntos Ensayos", fontSize = 10.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Slate700,
                                    selectedLabelColor = Slate100,
                                    containerColor = Slate800,
                                    labelColor = Slate400
                                )
                            )
                        }
                        item {
                            FilterChip(
                                selected = showCorePoints,
                                onClick = { showCorePoints = !showCorePoints },
                                label = { Text("Núcleos Diamantados (${customCorePoints.size})", fontSize = 10.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = AmberGold.copy(alpha = 0.25f),
                                    selectedLabelColor = AmberGold,
                                    containerColor = Slate800,
                                    labelColor = Slate400
                                )
                            )
                        }
                    }

                    // Filter points by status
                    if (showTestPoints) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Filtrar Puntos:", style = MaterialTheme.typography.labelSmall, color = Slate400, fontSize = 10.sp)
                            Spacer(modifier = Modifier.width(6.dp))
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                item {
                                    FilterChip(
                                        selected = pointStatusFilter == "ALL",
                                        onClick = { pointStatusFilter = "ALL" },
                                        label = { Text("Todos", fontSize = 9.sp) }
                                    )
                                }
                                items(TestStatus.entries) { st ->
                                    FilterChip(
                                        selected = pointStatusFilter == st.name,
                                        onClick = { pointStatusFilter = st.name },
                                        label = { Text(st.label, fontSize = 9.sp) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // 3. Main 2D Interactive Canvas Chart
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate900),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = if (activeSelectedTest != null) "Curva de Calibración: ${activeSelectedTest.elementTag} (${activeSelectedTest.elementType.label})" else "Curvas de Calibración & Resistencia (NTC 3692 / NSR-10)",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = if (activeSelectedTest != null) "Modelo: ${activeSelectedTest.curveModel.label} | f'c Diseño: ${activeSelectedTest.fcDesignMpa} MPa" else "Gráfico interactivo bidimensional con soporte multi-curva y puntos in-situ.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Slate400
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Canvas Chart Box
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(310.dp)
                            .background(Slate950, RoundedCornerShape(12.dp))
                            .border(1.dp, Slate800, RoundedCornerShape(12.dp))
                            .padding(10.dp)
                    ) {
                        Canvas(
                            modifier = Modifier
                                .fillMaxSize()
                                .pointerInput(tests, customCorePoints.toList(), activeSelectedTest) {
                                    detectTapGestures { offset ->
                                        val chartW = size.width - 45f
                                        val chartH = size.height - 30f
                                        val minR = 15f
                                        val maxR = 55f
                                        val minFc = 0f
                                        val maxFc = 55f

                                        // Find closest test point
                                        val tapped = tests.find { t ->
                                            val rVal = t.meanCorrected.toFloat().coerceIn(minR, maxR)
                                            val fcVal = t.estimatedFcMpa.toFloat().coerceIn(minFc, maxFc)

                                            val px = 35f + ((rVal - minR) / (maxR - minR)) * chartW
                                            val py = (size.height - 20f) - ((fcVal - minFc) / (maxFc - minFc)) * chartH

                                            val distSq = (offset.x - px) * (offset.x - px) + (offset.y - py) * (offset.y - py)
                                            distSq < 1000f
                                        }
                                        if (tapped != null) {
                                            selectedTestOnChart = tapped
                                            selectedElementId = tapped.id
                                        }
                                    }
                                }
                        ) {
                            val w = size.width
                            val h = size.height
                            val originX = 35f
                            val originY = h - 25f
                            val chartW = w - originX - 10f
                            val chartH = originY - 15f

                            val minR = 15.0
                            val maxR = 55.0
                            val minFc = 0.0
                            val maxFc = 55.0

                            fun toX(r: Double): Float = (originX + ((r - minR) / (maxR - minR)) * chartW).toFloat()
                            fun toY(fc: Double): Float = (originY - ((fc - minFc) / (maxFc - minFc)) * chartH).toFloat()

                            // Draw Grid & Axes
                            for (gridR in 20..50 step 10) {
                                val gx = toX(gridR.toDouble())
                                drawLine(Slate800, Offset(gx, 15f), Offset(gx, originY), strokeWidth = 1f)
                            }
                            for (gridFc in 10..50 step 10) {
                                val gy = toY(gridFc.toDouble())
                                drawLine(Slate800, Offset(originX, gy), Offset(w - 10f, gy), strokeWidth = 1f)
                            }

                            // Axes
                            drawLine(Slate600, Offset(originX, originY), Offset(w - 10f, originY), strokeWidth = 2f)
                            drawLine(Slate600, Offset(originX, originY), Offset(originX, 15f), strokeWidth = 2f)

                            // 1. Proceq NTC 3692 Curve
                            if (showProceqCurve) {
                                val pathProceq = Path()
                                var first = true
                                for (r in 18..55) {
                                    val fc = SclerometryNorms.calculateFcFromRebound(r.toDouble(), CurveModel.PROCEQ_N_STANDARD)
                                    val x = toX(r.toDouble())
                                    val y = toY(fc)
                                    if (first) { pathProceq.moveTo(x, y); first = false } else { pathProceq.lineTo(x, y) }
                                }
                                drawPath(pathProceq, BrandSkyLight, style = Stroke(width = 3f))
                            }

                            // 2. NSR-10 Colombian Aggregates Curve
                            if (showNsr10Curve) {
                                val pathNSR10 = Path()
                                var first = true
                                for (r in 18..55) {
                                    val fc = SclerometryNorms.calculateFcFromRebound(r.toDouble(), CurveModel.NSR10_COLOMBIA)
                                    val x = toX(r.toDouble())
                                    val y = toY(fc)
                                    if (first) { pathNSR10.moveTo(x, y); first = false } else { pathNSR10.lineTo(x, y) }
                                }
                                drawPath(
                                    pathNSR10,
                                    AmberGold,
                                    style = Stroke(width = 2.5f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 5f)))
                                )
                            }

                            // 3. ASTM C805 Polynomial
                            if (showAstmCurve) {
                                val pathAstm = Path()
                                var first = true
                                for (r in 18..55) {
                                    val fc = SclerometryNorms.calculateFcFromRebound(r.toDouble(), CurveModel.ASTM_POLYNOMIAL)
                                    val x = toX(r.toDouble())
                                    val y = toY(fc)
                                    if (first) { pathAstm.moveTo(x, y); first = false } else { pathAstm.lineTo(x, y) }
                                }
                                drawPath(
                                    pathAstm,
                                    Color(0xFFC084FC),
                                    style = Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f)))
                                )
                            }

                            // 4. Dedicated Per-Element Calibrated Curve (if single element selected)
                            if (activeSelectedTest != null && showElementCurve) {
                                val pathElement = Path()
                                var first = true
                                for (r in 18..55) {
                                    val fc = SclerometryNorms.calculateFcFromRebound(
                                        rCorr = r.toDouble(),
                                        model = activeSelectedTest.curveModel,
                                        customA = activeSelectedTest.customA,
                                        customB = activeSelectedTest.customB,
                                        customC = activeSelectedTest.customC,
                                        upvKmS = activeSelectedTest.ultrasonicPulseVelocity
                                    )
                                    val x = toX(r.toDouble())
                                    val y = toY(fc)
                                    if (first) { pathElement.moveTo(x, y); first = false } else { pathElement.lineTo(x, y) }
                                }
                                drawPath(pathElement, EmeraldSuccess, style = Stroke(width = 4f))

                                // Uncertainty Band (+/- U)
                                if (showUncertaintyBand) {
                                    val uVal = if (activeSelectedTest.uncertaintyMpa > 0) activeSelectedTest.uncertaintyMpa else 3.5
                                    val pathUpper = Path()
                                    val pathLower = Path()
                                    var f1 = true
                                    for (r in 18..55) {
                                        val fc = SclerometryNorms.calculateFcFromRebound(
                                            rCorr = r.toDouble(),
                                            model = activeSelectedTest.curveModel,
                                            customA = activeSelectedTest.customA,
                                            customB = activeSelectedTest.customB,
                                            customC = activeSelectedTest.customC,
                                            upvKmS = activeSelectedTest.ultrasonicPulseVelocity
                                        )
                                        val x = toX(r.toDouble())
                                        val yUp = toY(fc + uVal)
                                        val yLow = toY(max(0.0, fc - uVal))
                                        if (f1) {
                                            pathUpper.moveTo(x, yUp)
                                            pathLower.moveTo(x, yLow)
                                            f1 = false
                                        } else {
                                            pathUpper.lineTo(x, yUp)
                                            pathLower.lineTo(x, yLow)
                                        }
                                    }
                                    drawPath(pathUpper, Color(0xFF38BDF8), style = Stroke(width = 1.5f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f))))
                                    drawPath(pathLower, Color(0xFF38BDF8), style = Stroke(width = 1.5f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f))))
                                }

                                // Target f'c Design Reference line
                                val fcDesignY = toY(activeSelectedTest.fcDesignMpa)
                                drawLine(
                                    RoseAlert.copy(alpha = 0.7f),
                                    Offset(originX, fcDesignY),
                                    Offset(w - 10f, fcDesignY),
                                    strokeWidth = 2f,
                                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f))
                                )

                                // Element point projection dashed lines
                                val elX = toX(activeSelectedTest.meanCorrected.coerceIn(minR, maxR))
                                val elY = toY(activeSelectedTest.estimatedFcMpa.coerceIn(minFc, maxFc))
                                drawLine(EmeraldSuccess.copy(alpha = 0.6f), Offset(elX, originY), Offset(elX, elY), strokeWidth = 1.5f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f)))
                                drawLine(EmeraldSuccess.copy(alpha = 0.6f), Offset(originX, elY), Offset(elX, elY), strokeWidth = 1.5f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(4f, 4f)))
                            }

                            // 5. Test Points
                            if (showTestPoints) {
                                val displayedTests = if (activeSelectedTest != null) {
                                    tests.filter { it.id == activeSelectedTest.id }
                                } else {
                                    tests.filter {
                                        pointStatusFilter == "ALL" || it.status.name == pointStatusFilter
                                    }
                                }

                                displayedTests.forEach { test ->
                                    if (test.status != TestStatus.INVALIDO && test.meanCorrected > 0) {
                                        val px = toX(test.meanCorrected.coerceIn(minR, maxR))
                                        val py = toY(test.estimatedFcMpa.coerceIn(minFc, maxFc))

                                        val pointColor = when (test.status) {
                                            TestStatus.CUMPLE -> EmeraldSuccess
                                            TestStatus.DUDOSO -> AmberGold
                                            TestStatus.NO_CUMPLE -> RoseAlert
                                            TestStatus.INVALIDO -> Color(0xFF8B5CF6)
                                        }

                                        val isHighlighted = selectedTestOnChart?.id == test.id
                                        val radius = if (isHighlighted) 9f else 6f

                                        drawCircle(color = pointColor, radius = radius, center = Offset(px, py))
                                        drawCircle(color = Color.White, radius = radius + 1.5f, center = Offset(px, py), style = Stroke(width = if (isHighlighted) 2.5f else 1.5f))
                                    }
                                }
                            }

                            // 6. Empirical Core Calibration Points (Diamantes amarillos)
                            if (showCorePoints) {
                                customCorePoints.forEach { cp ->
                                    val px = toX(cp.rebound.coerceIn(minR, maxR))
                                    val py = toY(cp.fcMpa.coerceIn(minFc, maxFc))
                                    val dSize = 7f

                                    val diamondPath = Path().apply {
                                        moveTo(px, py - dSize)
                                        lineTo(px + dSize, py)
                                        lineTo(px, py + dSize)
                                        lineTo(px - dSize, py)
                                        close()
                                    }
                                    drawPath(diamondPath, AmberGold)
                                    drawPath(diamondPath, Slate950, style = Stroke(width = 1.5f))
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Dynamic Legend
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        if (showProceqCurve) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(12.dp, 3.dp).background(BrandSkyLight))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("NTC 3692", style = MaterialTheme.typography.labelSmall, color = Slate300, fontSize = 10.sp)
                            }
                        }
                        if (showNsr10Curve) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(12.dp, 3.dp).background(AmberGold))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("NSR-10 Col.", style = MaterialTheme.typography.labelSmall, color = Slate300, fontSize = 10.sp)
                            }
                        }
                        if (activeSelectedTest != null && showElementCurve) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(12.dp, 3.dp).background(EmeraldSuccess))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Curva Elemento", style = MaterialTheme.typography.labelSmall, color = EmeraldSuccess, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        if (showCorePoints && customCorePoints.isNotEmpty()) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(8.dp).background(AmberGold, RoundedCornerShape(2.dp)))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Núcleos Diamantados", style = MaterialTheme.typography.labelSmall, color = AmberGold, fontSize = 10.sp)
                            }
                        }
                    }
                }
            }
        }

        // 4. Per-Element Technical Audit & Metrology Card (When element selected)
        activeSelectedTest?.let { test ->
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Slate850),
                    border = BorderStroke(1.dp, EmeraldSuccess.copy(alpha = 0.6f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Surface(shape = RoundedCornerShape(6.dp), color = EmeraldSuccess.copy(alpha = 0.2f)) {
                                    Text(test.elementTag, fontWeight = FontWeight.Black, color = EmeraldSuccess, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
                                }
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(test.elementType.label, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            Text("${test.status.label} (${test.complianceRatio}%)", fontWeight = FontWeight.Black, color = when(test.status) {
                                TestStatus.CUMPLE -> EmeraldSuccess
                                TestStatus.DUDOSO -> AmberGold
                                TestStatus.NO_CUMPLE -> RoseAlert
                                TestStatus.INVALIDO -> Color(0xFF8B5CF6)
                            })
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Metrological parameters table
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("Curva / Modelo:", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                Text(test.curveModel.label, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = Slate100)
                                Text("Ecuación: ${test.statusNotes.let { test.curveModel.formula }}", style = MaterialTheme.typography.labelSmall, color = AmberGold, fontFamily = FontFamily.Monospace, fontSize = 10.sp)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("f'c Estimado (± U):", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                Text("${test.estimatedFcMpa} ± ${test.uncertaintyMpa} MPa", fontWeight = FontWeight.Black, color = BrandSkyLight, fontSize = 15.sp)
                                Text("${test.estimatedFcPsi} PSI (Diseño: ${test.fcDesignMpa} MPa)", style = MaterialTheme.typography.labelSmall, color = Slate300)
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        HorizontalDivider(color = Slate700)
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Rebote: R_crudo=${test.meanRaw} (ΔR=${test.correctionAngle}) → R_corr=${test.meanCorrected}", style = MaterialTheme.typography.labelSmall, color = Slate300)
                            Text("CV: ${test.cov}% | s: ${test.stdDev}", style = MaterialTheme.typography.labelSmall, color = Slate300)
                        }

                        if (test.carbonationDepthMm > 0.0 || test.ultrasonicPulseVelocity > 0.0) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                if (test.carbonationDepthMm > 0.0) {
                                    Text("Carbonatación: ${test.carbonationDepthMm} mm", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                }
                                if (test.ultrasonicPulseVelocity > 0.0) {
                                    Text("UPV SonReb: ${test.ultrasonicPulseVelocity} km/s", style = MaterialTheme.typography.labelSmall, color = BrandSkyLight)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(test.statusNotes, style = MaterialTheme.typography.bodySmall, color = Slate300, fontSize = 11.sp)
                    }
                }
            }
        }

        // 5. Empirical Core Drilling Points List (Núcleos de Calibración In-Situ)
        if (customCorePoints.isNotEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Slate900),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Engineering, contentDescription = null, tint = AmberGold, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Datos de Calibración In-Situ (Núcleos NTC 3658)", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                            }
                            Text("${customCorePoints.size} puntos", style = MaterialTheme.typography.labelSmall, color = Slate400)
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        customCorePoints.forEach { cp ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .background(Slate850, RoundedCornerShape(8.dp))
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(cp.source, fontWeight = FontWeight.Bold, color = Slate200, fontSize = 12.sp)
                                    Text("Rebote Schmidt R = ${cp.rebound} → f'c Núcleo = ${cp.fcMpa} MPa (${SclerometryNorms.mpaToPsi(cp.fcMpa)} PSI)", style = MaterialTheme.typography.labelSmall, color = AmberGold)
                                }
                                IconButton(
                                    onClick = { customCorePoints.remove(cp) },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(Icons.Default.DeleteOutline, contentDescription = "Eliminar", tint = RoseAlert, modifier = Modifier.size(16.dp))
                                }
                            }
                        }
                    }
                }
            }
        }

        // 6. Comparative Model Table
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate900),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text("Comparativa Normativa de Modelos (NTC 3692 / NSR-10 / ASTM)", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(modifier = Modifier.height(8.dp))

                    val referencePoints = listOf(20, 25, 30, 35, 40, 45, 50)
                    referencePoints.forEach { r ->
                        val fcNtc = SclerometryNorms.calculateFcFromRebound(r.toDouble(), CurveModel.PROCEQ_N_STANDARD)
                        val fcCol = SclerometryNorms.calculateFcFromRebound(r.toDouble(), CurveModel.NSR10_COLOMBIA)
                        val fcAstm = SclerometryNorms.calculateFcFromRebound(r.toDouble(), CurveModel.ASTM_POLYNOMIAL)

                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("Rebote R=$r", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = Slate200)
                            Text("NTC: $fcNtc MPa", style = MaterialTheme.typography.bodySmall, color = BrandSkyLight)
                            Text("NSR-10: $fcCol MPa", style = MaterialTheme.typography.bodySmall, color = AmberGold)
                            Text("ASTM: $fcAstm MPa", style = MaterialTheme.typography.bodySmall, color = Color(0xFFC084FC))
                        }
                        HorizontalDivider(color = Slate800)
                    }
                }
            }
        }
    }

    // Modal to add a new calibration / core extraction data point to the chart
    if (showAddPointDialog) {
        var newRebound by remember { mutableStateOf("38.0") }
        var newFcMpa by remember { mutableStateOf("34.5") }
        var newSource by remember { mutableStateOf("Extracción de Núcleo (NTC 3658)") }

        AlertDialog(
            onDismissRequest = { showAddPointDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.AddCircle, contentDescription = null, tint = EmeraldSuccess)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Agregar Dato de Calibración / Núcleo", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Ingresa los resultados del ensayo de compresión en núcleo diamantado o correlación local:",
                        style = MaterialTheme.typography.bodySmall,
                        color = Slate300
                    )
                    OutlinedTextField(
                        value = newRebound,
                        onValueChange = { newRebound = it },
                        label = { Text("Rebote Schmidt R") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newFcMpa,
                        onValueChange = { newFcMpa = it },
                        label = { Text("f'c Núcleo (MPa)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newSource,
                        onValueChange = { newSource = it },
                        label = { Text("Descripción / Identificación Núcleo") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val r = newRebound.toDoubleOrNull() ?: 35.0
                        val fc = newFcMpa.toDoubleOrNull() ?: 28.0
                        customCorePoints.add(
                            CalibrationPoint(
                                id = "cp-${System.currentTimeMillis()}",
                                rebound = r,
                                fcMpa = fc,
                                source = newSource.trim()
                            )
                        )
                        showAddPointDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldSuccess)
                ) {
                    Text("Agregar al Gráfico", color = Slate950, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showAddPointDialog = false }) {
                    Text("Cancelar", color = Slate400)
                }
            },
            containerColor = Slate900
        )
    }
}

// ----------------------------------------------------
// TAB 2: ANALYTICS & QUALITY NSR-10
// ----------------------------------------------------
@Composable
fun AnalyticsTab(tests: List<SclerometryTest>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Status Distribution Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate900),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Distribución de Conformidad Estructural", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(modifier = Modifier.height(12.dp))

                    val complies = tests.count { it.status == TestStatus.CUMPLE }
                    val doubtful = tests.count { it.status == TestStatus.DUDOSO }
                    val fail = tests.count { it.status == TestStatus.NO_CUMPLE }
                    val invalid = tests.count { it.status == TestStatus.INVALIDO }
                    val total = tests.size.coerceAtLeast(1)

                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        StatusProgressBar(label = "Conforme (≥ 95% f'c diseño)", count = complies, total = total, color = EmeraldSuccess)
                        StatusProgressBar(label = "Zona Dudosa (80% - 95% f'c) NSR-10", count = doubtful, total = total, color = AmberGold)
                        StatusProgressBar(label = "No Conforme (< 80% f'c)", count = fail, total = total, color = RoseAlert)
                        StatusProgressBar(label = "Inválido (Dispersión > 6)", count = invalid, total = total, color = Color(0xFF8B5CF6))
                    }
                }
            }
        }

        // Typology Summary Breakdown
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate900),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Resumen de Resistencia por Tipología", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(modifier = Modifier.height(10.dp))

                    ElementType.entries.forEach { type ->
                        val typeTests = tests.filter { it.elementType == type }
                        if (typeTests.isNotEmpty()) {
                            val avgR = ((typeTests.map { it.meanCorrected }.average()) * 10.0).roundToInt() / 10.0
                            val avgFc = ((typeTests.map { it.estimatedFcMpa }.average()) * 10.0).roundToInt() / 10.0
                            val typeComplies = typeTests.count { it.status == TestStatus.CUMPLE }
                            val typeRate = ((typeComplies.toDouble() / typeTests.size) * 100.0).roundToInt()

                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = Slate850,
                                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(type.label, fontWeight = FontWeight.Bold, color = Color.White)
                                        Text("${typeTests.size} ensayos | Rebote prom: $avgR", style = MaterialTheme.typography.labelSmall, color = Slate400)
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text("$avgFc MPa", fontWeight = FontWeight.Black, color = BrandSkyLight)
                                        Text("$typeRate% conforme", style = MaterialTheme.typography.labelSmall, color = if (typeRate >= 90) EmeraldSuccess else AmberGold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatusProgressBar(label: String, count: Int, total: Int, color: Color) {
    val pct = (count.toFloat() / total.toFloat()).coerceIn(0f, 1f)
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.bodySmall, color = Slate300)
            Text("$count (${(pct * 100).roundToInt()}%)", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = color)
        }
        Spacer(modifier = Modifier.height(4.dp))
        LinearProgressIndicator(
            progress = { pct },
            color = color,
            trackColor = Slate800,
            modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp))
        )
    }
}

// ----------------------------------------------------
// TAB 3: PHOTO GALLERY
// ----------------------------------------------------
@Composable
fun PhotoGalleryTab(tests: List<SclerometryTest>) {
    val allPhotosWithTest = remember(tests) {
        val list = mutableListOf<Pair<TestPhoto, SclerometryTest>>()
        tests.forEach { test ->
            test.photos.forEach { photo ->
                list.add(photo to test)
            }
        }
        list
    }

    var selectedPhotoPair by remember { mutableStateOf<Pair<TestPhoto, SclerometryTest>?>(null) }

    if (allPhotosWithTest.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate900),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Default.PhotoCamera, contentDescription = null, tint = Slate500, modifier = Modifier.size(48.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("No hay fotos registradas en este proyecto", style = MaterialTheme.typography.titleMedium, color = Slate200)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Al registrar o editar un ensayo puedes adjuntar fotos de la superficie y del elemento.", style = MaterialTheme.typography.bodySmall, color = Slate400, textAlign = TextAlign.Center)
                }
            }
        }
    } else {
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.fillMaxSize().padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(allPhotosWithTest) { (photo, test) ->
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Slate900),
                    border = BorderStroke(1.dp, Slate800),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { selectedPhotoPair = photo to test }
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp)
                                .background(Slate800),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Photo, contentDescription = null, tint = Slate500, modifier = Modifier.size(36.dp))
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = Slate950.copy(alpha = 0.8f),
                                modifier = Modifier.align(Alignment.TopStart).padding(6.dp)
                            ) {
                                Text(test.elementTag, style = MaterialTheme.typography.labelSmall, color = Color.White, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                            }
                        }
                        Column(modifier = Modifier.padding(8.dp)) {
                            Text(test.elementType.label, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodySmall, color = Slate100)
                            Text("${test.estimatedFcMpa} MPa (${test.status.label})", style = MaterialTheme.typography.labelSmall, color = BrandSkyLight)
                        }
                    }
                }
            }
        }
    }

    // Photo Lightbox Dialog
    selectedPhotoPair?.let { (photo, test) ->
        AlertDialog(
            onDismissRequest = { selectedPhotoPair = null },
            title = {
                Text("Elemento ${test.elementTag} (${test.elementType.label})", fontWeight = FontWeight.Bold, color = Slate100)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                            .background(Slate800, RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Image, contentDescription = null, tint = Slate400, modifier = Modifier.size(48.dp))
                    }
                    Text("Ubicación: ${test.levelAxis}", style = MaterialTheme.typography.bodySmall, color = Slate300)
                    Text("Rebote Corregido: ${test.meanCorrected} | f'c Estimado: ${test.estimatedFcMpa} MPa (${test.estimatedFcPsi} PSI)", style = MaterialTheme.typography.bodySmall, color = BrandSkyLight)
                    Text("Estado: ${test.status.label} (${test.complianceRatio}%)", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Bold, color = if (test.status == TestStatus.CUMPLE) EmeraldSuccess else AmberGold)
                }
            },
            confirmButton = {
                Button(onClick = { selectedPhotoPair = null }) {
                    Text("Cerrar")
                }
            },
            containerColor = Slate900
        )
    }
}
