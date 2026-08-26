package com.example.esclerometria.ui.dialogs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.esclerometria.model.*
import com.example.esclerometria.ui.theme.*
import com.example.esclerometria.utils.SclerometryNorms
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TestFormDialog(
    projectId: String,
    initialTest: SclerometryTest?,
    onDismiss: () -> Unit,
    onSave: (SclerometryTest) -> Unit
) {
    var elementTag by remember { mutableStateOf(initialTest?.elementTag ?: "") }
    var elementType by remember { mutableStateOf(initialTest?.elementType ?: ElementType.COLUMNA) }
    var levelAxis by remember { mutableStateOf(initialTest?.levelAxis ?: "Nivel 1 / Eje A-1") }
    var fcDesignMpa by remember { mutableDoubleStateOf(initialTest?.fcDesignMpa ?: 28.0) }
    var concreteAgeDays by remember { mutableIntStateOf(initialTest?.concreteAgeDays ?: 28) }
    var impactAngle by remember { mutableStateOf(initialTest?.impactAngle ?: ImpactAngle.HORIZONTAL) }
    var surfaceCondition by remember { mutableStateOf(initialTest?.surfaceCondition ?: SurfaceCondition.CARBORUNDUM) }
    var curveModel by remember { mutableStateOf(initialTest?.curveModel ?: CurveModel.PROCEQ_N_STANDARD) }
    var customA by remember { mutableDoubleStateOf(initialTest?.customA ?: 0.0245) }
    var customB by remember { mutableDoubleStateOf(initialTest?.customB ?: 2.052) }
    var customC by remember { mutableDoubleStateOf(initialTest?.customC ?: 0.0) }
    var upvKmS by remember { mutableDoubleStateOf(initialTest?.ultrasonicPulseVelocity ?: 0.0) }
    var carbonationDepthMm by remember { mutableDoubleStateOf(initialTest?.carbonationDepthMm ?: 1.0) }
    var moistureFactor by remember { mutableDoubleStateOf(initialTest?.moistureFactor ?: 1.0) }
    var formworkFactor by remember { mutableDoubleStateOf(initialTest?.formworkFactor ?: 1.0) }
    var coreCalibrationData by remember { mutableStateOf(initialTest?.coreCalibrationData ?: "32:24.5; 36:31.2; 40:38.9") }
    var showCoreFittingDialog by remember { mutableStateOf(false) }
    var operatorName by remember { mutableStateOf(initialTest?.operatorName ?: "Tec. Jhon Fredy Piraquive") }
    var notes by remember { mutableStateOf(initialTest?.notes ?: "") }

    // 10-12 readings state
    val initialReadings = remember {
        val list = initialTest?.readings?.toMutableList() ?: mutableListOf(36, 37, 35, 38, 36, 37, 39, 36, 37, 36)
        while (list.size < 10) list.add(35)
        list
    }
    val readings = remember { mutableStateListOf<Int>().apply { addAll(initialReadings) } }

    // Live reactive calculation
    val evaluation = remember(
        readings.toList(),
        impactAngle,
        fcDesignMpa,
        curveModel,
        customA,
        customB,
        customC,
        upvKmS,
        carbonationDepthMm,
        moistureFactor,
        formworkFactor
    ) {
        SclerometryNorms.evaluateSclerometryTest(
            readings = readings.toList(),
            angle = impactAngle,
            fcDesignMpa = fcDesignMpa,
            model = curveModel,
            customA = customA,
            customB = customB,
            customC = customC,
            upvKmS = upvKmS,
            carbonationDepthMm = carbonationDepthMm,
            moistureFactor = moistureFactor,
            formworkFactor = formworkFactor
        )
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
            shape = RoundedCornerShape(20.dp),
            color = Slate900,
            border = BorderStroke(1.dp, Slate700)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Dialog Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate850)
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Science,
                            contentDescription = null,
                            tint = BrandSkyLight,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (initialTest == null) "Nuevo Ensayo de Esclerometría" else "Editar Ensayo: ${initialTest.elementTag}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = Slate400)
                    }
                }

                // Scrollable Form Body
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Live Calculation Status Banner
                    LiveCalculationCard(evaluation = evaluation, fcDesignMpa = fcDesignMpa)

                    // 1. Element Identification
                    Text("1. Identificación del Elemento Estructural", fontWeight = FontWeight.Bold, color = BrandSkyLight, fontSize = 13.sp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = elementTag,
                            onValueChange = { elementTag = it },
                            label = { Text("Código Elemento *") },
                            placeholder = { Text("ej: C-101, V-202") },
                            singleLine = true,
                            modifier = Modifier.weight(1f).testTag("input_element_tag")
                        )

                        var expandedType by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.weight(1f)) {
                            OutlinedTextField(
                                value = elementType.label,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Tipo Elemento") },
                                trailingIcon = {
                                    IconButton(onClick = { expandedType = true }) {
                                        Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                                    }
                                },
                                modifier = Modifier.fillMaxWidth().clickable { expandedType = true }
                            )
                            DropdownMenu(
                                expanded = expandedType,
                                onDismissRequest = { expandedType = false },
                                modifier = Modifier.background(Slate850)
                            ) {
                                ElementType.entries.forEach { type ->
                                    DropdownMenuItem(
                                        text = { Text(type.label, color = Slate100) },
                                        onClick = {
                                            elementType = type
                                            expandedType = false
                                        }
                                    )
                                }
                            }
                        }
                    }

                    OutlinedTextField(
                        value = levelAxis,
                        onValueChange = { levelAxis = it },
                        label = { Text("Nivel / Eje / Ubicación") },
                        placeholder = { Text("ej: Nivel 2 / Eje A-1 (Cara Norte)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // 2. Concrete Design & Age
                    Text("2. Especificación del Concreto", fontWeight = FontWeight.Bold, color = AmberGold, fontSize = 13.sp)

                    // Preset chips
                    Text("Resistencia de Diseño f'c:", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(SclerometryNorms.COLOMBIAN_CONCRETE_PRESETS) { preset ->
                            FilterChip(
                                selected = fcDesignMpa == preset.mpa,
                                onClick = { fcDesignMpa = preset.mpa },
                                label = { Text("${preset.mpa} MPa (${preset.psi} PSI)", fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = AmberGold,
                                    selectedLabelColor = Slate950
                                )
                            )
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = "$fcDesignMpa",
                            onValueChange = { fcDesignMpa = it.toDoubleOrNull() ?: fcDesignMpa },
                            label = { Text("f'c Diseño (MPa)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = "$concreteAgeDays",
                            onValueChange = { concreteAgeDays = it.toIntOrNull() ?: concreteAgeDays },
                            label = { Text("Edad Concreto (días)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // 3. Impact Angle Selector
                    Text("3. Ángulo de Impacto Schmidt (NTC 3692)", fontWeight = FontWeight.Bold, color = BrandSkyLight, fontSize = 13.sp)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(ImpactAngle.entries) { angle ->
                            FilterChip(
                                selected = impactAngle == angle,
                                onClick = { impactAngle = angle },
                                label = { Text("${angle.icon} ${angle.label}", fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = BrandSky,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }

                    // 4. Per-Element Calibration Curve (NTC 3692 / NSR-10 / ISO 1920-7)
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Slate850),
                        border = BorderStroke(1.dp, BrandSky.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Tune, contentDescription = null, tint = BrandSkyLight, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("4. Curva de Calibración & Parámetros por Elemento", fontWeight = FontWeight.Bold, color = Slate100, fontSize = 13.sp)
                                }
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = BrandSky.copy(alpha = 0.2f)
                                ) {
                                    Text("NSR-10 / ISO 1920-7", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = BrandSkyLight, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                }
                            }

                            Text("Selecciona el modelo de correlación específico para este elemento:", style = MaterialTheme.typography.labelSmall, color = Slate400)

                            LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                items(CurveModel.entries) { model ->
                                    FilterChip(
                                        selected = curveModel == model,
                                        onClick = { curveModel = model },
                                        label = { Text(model.label, fontSize = 11.sp) },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = BrandSky,
                                            selectedLabelColor = Color.White
                                        )
                                    )
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Slate900,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    text = "Ecuación activa: ${evaluation.formulaUsed}",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontFamily = FontFamily.Monospace,
                                    color = AmberGold,
                                    modifier = Modifier.padding(8.dp)
                                )
                            }

                            // Dynamic inputs according to model
                            if (curveModel == CurveModel.CUSTOM_CALIBRATED) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    OutlinedTextField(
                                        value = "$customA",
                                        onValueChange = { customA = it.toDoubleOrNull() ?: customA },
                                        label = { Text("Coeficiente a") },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        singleLine = true,
                                        modifier = Modifier.weight(1f)
                                    )
                                    OutlinedTextField(
                                        value = "$customB",
                                        onValueChange = { customB = it.toDoubleOrNull() ?: customB },
                                        label = { Text("Exponente b") },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        singleLine = true,
                                        modifier = Modifier.weight(1f)
                                    )
                                    Button(
                                        onClick = { showCoreFittingDialog = true },
                                        colors = ButtonDefaults.buttonColors(containerColor = Slate700),
                                        modifier = Modifier.padding(top = 6.dp)
                                    ) {
                                        Icon(Icons.Default.AutoFixHigh, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Ajustar Núcleos", fontSize = 11.sp)
                                    }
                                }
                            }

                            if (curveModel == CurveModel.SONREB_COMBINED) {
                                OutlinedTextField(
                                    value = if (upvKmS == 0.0) "" else "$upvKmS",
                                    onValueChange = { upvKmS = it.toDoubleOrNull() ?: 0.0 },
                                    label = { Text("Velocidad de Pulso Ultrasónico UPV (km/s)") },
                                    placeholder = { Text("ej: 4.15 km/s (NTC 4325)") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }

                            // Environmental & Pathological Factors
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = "$carbonationDepthMm",
                                    onValueChange = { carbonationDepthMm = it.toDoubleOrNull() ?: carbonationDepthMm },
                                    label = { Text("Profundidad Carbonatación (mm)") },
                                    placeholder = { Text("0 a 10 mm (Fenolftaleína)") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    modifier = Modifier.weight(1f)
                                )

                                var expandedMoist by remember { mutableStateOf(false) }
                                Box(modifier = Modifier.weight(1f)) {
                                    OutlinedTextField(
                                        value = if (moistureFactor == 1.0) "Seco al aire (1.0)" else "Saturado/Húmedo (1.15)",
                                        onValueChange = {},
                                        readOnly = true,
                                        label = { Text("Estado de Humedad") },
                                        trailingIcon = {
                                            IconButton(onClick = { expandedMoist = true }) {
                                                Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                                            }
                                        },
                                        modifier = Modifier.fillMaxWidth().clickable { expandedMoist = true }
                                    )
                                    DropdownMenu(
                                        expanded = expandedMoist,
                                        onDismissRequest = { expandedMoist = false },
                                        modifier = Modifier.background(Slate850)
                                    ) {
                                        DropdownMenuItem(
                                            text = { Text("Seco al aire (Factor = 1.00)", color = Slate100) },
                                            onClick = {
                                                moistureFactor = 1.0
                                                expandedMoist = false
                                            }
                                        )
                                        DropdownMenuItem(
                                            text = { Text("Húmedo / Saturado (Factor = 1.15)", color = Slate100) },
                                            onClick = {
                                                moistureFactor = 1.15
                                                expandedMoist = false
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // 5. 10 Readings Input Grid
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("5. Lecturas de Rebote (10 Impactos)", fontWeight = FontWeight.Bold, color = EmeraldSuccess, fontSize = 13.sp)
                        TextButton(
                            onClick = {
                                // Random realistic readings around 36
                                for (i in readings.indices) {
                                    readings[i] = (34..39).random()
                                }
                            }
                        ) {
                            Text("Generar Simulación", fontSize = 11.sp, color = AmberGold)
                        }
                    }

                    // 10 reading boxes in 2 rows of 5
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        for (row in 0..1) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                for (col in 0..4) {
                                    val index = row * 5 + col
                                    if (index < readings.size) {
                                        val isExcluded = evaluation.excludedIndices.contains(index)

                                        Column(
                                            modifier = Modifier.weight(1f),
                                            horizontalAlignment = Alignment.CenterHorizontally
                                        ) {
                                            Text("R-${index + 1}", style = MaterialTheme.typography.labelSmall, color = if (isExcluded) RoseAlert else Slate400, fontSize = 10.sp)
                                            OutlinedTextField(
                                                value = if (readings[index] == 0) "" else "${readings[index]}",
                                                onValueChange = { newVal ->
                                                    readings[index] = newVal.toIntOrNull() ?: 0
                                                },
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                                singleLine = true,
                                                colors = OutlinedTextFieldDefaults.colors(
                                                    focusedBorderColor = if (isExcluded) RoseAlert else BrandSky,
                                                    unfocusedBorderColor = if (isExcluded) RoseAlert else Slate700,
                                                    focusedContainerColor = if (isExcluded) RoseAlert.copy(alpha = 0.15f) else Slate800,
                                                    unfocusedContainerColor = if (isExcluded) RoseAlert.copy(alpha = 0.15f) else Slate800,
                                                    focusedTextColor = if (isExcluded) RoseAlert else Slate100,
                                                    unfocusedTextColor = if (isExcluded) RoseAlert else Slate100
                                                ),
                                                modifier = Modifier.fillMaxWidth().testTag("reading_input_${index + 1}")
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 6. Operator & Notes
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = operatorName,
                            onValueChange = { operatorName = it },
                            label = { Text("Técnico / Operador") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Observaciones de Campo") },
                        placeholder = { Text("ej: Superficie pulida con piedra de carborundo, sonido seco y metálico...") },
                        maxLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Dialog Footer Action Buttons
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate850)
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancelar", color = Slate300)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            if (elementTag.isBlank()) {
                                elementTag = "E-${(100..999).random()}"
                            }
                            val testId = initialTest?.id ?: "t-${System.currentTimeMillis()}"
                            val newTest = SclerometryTest(
                                id = testId,
                                projectId = projectId,
                                elementTag = elementTag.trim(),
                                elementType = elementType,
                                levelAxis = levelAxis.trim(),
                                fcDesignMpa = fcDesignMpa,
                                fcDesignPsi = SclerometryNorms.mpaToPsi(fcDesignMpa),
                                concreteAgeDays = concreteAgeDays,
                                hammerModel = "Schmidt Original Tipo N (2.207 Nm)",
                                hammerSerial = "SCH-N-88492-COL",
                                impactAngle = impactAngle,
                                surfaceCondition = surfaceCondition,
                                carbonationDepthMm = carbonationDepthMm,
                                curveModel = curveModel,
                                customA = customA,
                                customB = customB,
                                customC = customC,
                                ultrasonicPulseVelocity = upvKmS,
                                moistureFactor = moistureFactor,
                                formworkFactor = formworkFactor,
                                uncertaintyMpa = evaluation.uncertaintyMpa,
                                coreCalibrationData = coreCalibrationData,
                                readings = readings.toList(),
                                excludedIndices = evaluation.excludedIndices,
                                meanRaw = evaluation.meanRaw,
                                correctionAngle = evaluation.correctionAngle,
                                meanCorrected = evaluation.meanCorrected,
                                stdDev = evaluation.stdDev,
                                cov = evaluation.cov,
                                estimatedFcMpa = evaluation.estimatedFcMpa,
                                estimatedFcKgcm2 = evaluation.estimatedFcKgcm2,
                                estimatedFcPsi = evaluation.estimatedFcPsi,
                                complianceRatio = evaluation.complianceRatio,
                                status = evaluation.status,
                                statusNotes = evaluation.statusNotes,
                                photos = initialTest?.photos ?: emptyList(),
                                notes = notes.trim(),
                                operatorName = operatorName.trim(),
                                createdAt = initialTest?.createdAt ?: System.currentTimeMillis(),
                                updatedAt = System.currentTimeMillis()
                            )
                            onSave(newTest)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandSky),
                        modifier = Modifier.testTag("btn_save_test")
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Guardar Ensayo", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // Modal to fit regression coefficients from Core drilling results
    if (showCoreFittingDialog) {
        var dataInput by remember { mutableStateOf(coreCalibrationData) }
        var regressionResult by remember { mutableStateOf<Triple<Double, Double, Double>?>(null) }

        AlertDialog(
            onDismissRequest = { showCoreFittingDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Analytics, contentDescription = null, tint = AmberGold)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Regresión por Núcleos In-Situ (ISO 1920-7)", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Ingresa los pares de datos [Rebote : f'c Núcleo (MPa)] obtenidos de ensayos destructivos (NTC 3658 / ASTM C42) separados por punto y coma:",
                        style = MaterialTheme.typography.bodySmall,
                        color = Slate300
                    )
                    OutlinedTextField(
                        value = dataInput,
                        onValueChange = {
                            dataInput = it
                            regressionResult = SclerometryNorms.fitPowerRegressionFromCoreData(it)
                        },
                        placeholder = { Text("ej: 30:22.5; 35:31.0; 40:39.5") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    val fit = regressionResult ?: SclerometryNorms.fitPowerRegressionFromCoreData(dataInput)
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Slate850,
                        border = BorderStroke(1.dp, AmberGold.copy(alpha = 0.5f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("Curva Ajustada: f'c = ${fit.first} · R^${fit.second}", fontWeight = FontWeight.Bold, color = AmberGold, fontSize = 13.sp)
                            Text("Coeficiente de Determinación R² = ${fit.third}", style = MaterialTheme.typography.labelSmall, color = Slate300)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val fit = regressionResult ?: SclerometryNorms.fitPowerRegressionFromCoreData(dataInput)
                        customA = fit.first
                        customB = fit.second
                        coreCalibrationData = dataInput
                        showCoreFittingDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AmberGold)
                ) {
                    Text("Aplicar al Elemento", color = Slate950, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCoreFittingDialog = false }) {
                    Text("Cancelar", color = Slate400)
                }
            },
            containerColor = Slate900
        )
    }
}

@Composable
fun LiveCalculationCard(evaluation: EvaluationResult, fcDesignMpa: Double) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Slate850),
        border = BorderStroke(1.dp, when (evaluation.status) {
            TestStatus.CUMPLE -> EmeraldSuccess
            TestStatus.DUDOSO -> AmberGold
            TestStatus.NO_CUMPLE -> RoseAlert
            TestStatus.INVALIDO -> Color(0xFF8B5CF6)
        }),
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
                        text = "Evaluación Metrológica NTC 3692 / NSR-10",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold,
                        color = Slate300
                    )
                    if (evaluation.formulaUsed.isNotBlank()) {
                        Text(
                            text = evaluation.formulaUsed,
                            style = MaterialTheme.typography.labelSmall,
                            fontFamily = FontFamily.Monospace,
                            color = BrandSkyLight,
                            fontSize = 9.sp
                        )
                    }
                }
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = when (evaluation.status) {
                        TestStatus.CUMPLE -> EmeraldSuccess.copy(alpha = 0.2f)
                        TestStatus.DUDOSO -> AmberGold.copy(alpha = 0.2f)
                        TestStatus.NO_CUMPLE -> RoseAlert.copy(alpha = 0.2f)
                        TestStatus.INVALIDO -> Color(0xFF8B5CF6).copy(alpha = 0.2f)
                    }
                ) {
                    Text(
                        text = "${evaluation.status.label} (${evaluation.complianceRatio}%)",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Black,
                        color = when (evaluation.status) {
                            TestStatus.CUMPLE -> EmeraldSuccess
                            TestStatus.DUDOSO -> AmberGold
                            TestStatus.NO_CUMPLE -> RoseAlert
                            TestStatus.INVALIDO -> Color(0xFFC4B5FD)
                        },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Rebote Corregido (R_corr)", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    Text(
                        "${evaluation.meanCorrected} (ΔR: ${evaluation.correctionAngle})",
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text("CV: ${evaluation.cov}% | s: ${evaluation.stdDev}", style = MaterialTheme.typography.labelSmall, color = Slate400)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("f'c Estimado (± U)", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    Text(
                        "${evaluation.estimatedFcMpa} ± ${evaluation.uncertaintyMpa} MPa",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = BrandSkyLight
                    )
                    Text("${evaluation.estimatedFcPsi} PSI (${evaluation.estimatedFcKgcm2} kg/cm²)", style = MaterialTheme.typography.labelSmall, color = Slate300)
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = evaluation.statusNotes,
                style = MaterialTheme.typography.bodySmall,
                color = Slate300,
                fontSize = 11.sp
            )
        }
    }
}
