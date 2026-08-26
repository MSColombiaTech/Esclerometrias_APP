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
    val evaluation = remember(readings.toList(), impactAngle, fcDesignMpa, curveModel) {
        SclerometryNorms.evaluateSclerometryTest(
            readings = readings.toList(),
            angle = impactAngle,
            fcDesignMpa = fcDesignMpa,
            model = curveModel
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

                    // 4. 10 Readings Input Grid
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("4. Lecturas de Rebote (10 Impactos)", fontWeight = FontWeight.Bold, color = EmeraldSuccess, fontSize = 13.sp)
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

                    // 5. Operator & Notes
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
                        placeholder = { Text("ej: Superficie pulida, sonido seco y metálico...") },
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
                                carbonationDepthMm = 1.5,
                                curveModel = curveModel,
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
                Text(
                    text = "Cálculo en Tiempo Real NTC 3692",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = Slate300
                )
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
                    Text("Rebote Corregido", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    Text(
                        "${evaluation.meanCorrected} (ΔR: ${evaluation.correctionAngle})",
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text("CV: ${evaluation.cov}% | s: ${evaluation.stdDev}", style = MaterialTheme.typography.labelSmall, color = Slate400)
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text("f'c Estimado", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    Text(
                        "${evaluation.estimatedFcMpa} MPa",
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
