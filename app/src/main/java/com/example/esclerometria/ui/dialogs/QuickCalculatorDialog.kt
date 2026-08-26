package com.example.esclerometria.ui.dialogs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.esclerometria.model.ImpactAngle
import com.example.esclerometria.ui.theme.*
import com.example.esclerometria.utils.SclerometryNorms

@Composable
fun QuickCalculatorDialog(onDismiss: () -> Unit) {
    var impactAngle by remember { mutableStateOf(ImpactAngle.HORIZONTAL) }
    var fcDesignMpa by remember { mutableDoubleStateOf(28.0) }
    val readings = remember { mutableStateListOf(36, 37, 35, 38, 36, 37, 39, 36, 37, 36) }

    val evaluation = remember(readings.toList(), impactAngle, fcDesignMpa) {
        SclerometryNorms.evaluateSclerometryTest(
            readings = readings.toList(),
            angle = impactAngle,
            fcDesignMpa = fcDesignMpa
        )
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            shape = RoundedCornerShape(20.dp),
            color = Slate900,
            border = BorderStroke(1.dp, Slate700)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate850)
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Calculate, contentDescription = null, tint = AmberGold, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text("Calculadora Rápida NTC 3692", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                            Text("Estimación f'c inmediata en obra", style = MaterialTheme.typography.labelSmall, color = Slate400)
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = Slate400)
                    }
                }

                // Body
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Result Card
                    LiveCalculationCard(evaluation = evaluation, fcDesignMpa = fcDesignMpa)

                    // Angle Selector
                    Text("Ángulo de Impacto:", style = MaterialTheme.typography.labelSmall, color = Slate400)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(ImpactAngle.entries) { angle ->
                            FilterChip(
                                selected = impactAngle == angle,
                                onClick = { impactAngle = angle },
                                label = { Text("${angle.icon} ${angle.label}", fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = AmberGold,
                                    selectedLabelColor = Slate950
                                )
                            )
                        }
                    }

                    // f'c Design input
                    OutlinedTextField(
                        value = "$fcDesignMpa",
                        onValueChange = { fcDesignMpa = it.toDoubleOrNull() ?: fcDesignMpa },
                        label = { Text("f'c de Diseño Referencia (MPa)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // 10 Readings
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("10 Lecturas de Impacto:", style = MaterialTheme.typography.labelSmall, color = Slate300)
                        TextButton(
                            onClick = {
                                for (i in readings.indices) readings[i] = (33..40).random()
                            }
                        ) {
                            Text("Aleatorio", fontSize = 11.sp, color = AmberGold)
                        }
                    }

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
                                        OutlinedTextField(
                                            value = if (readings[index] == 0) "" else "${readings[index]}",
                                            onValueChange = { readings[index] = it.toIntOrNull() ?: 0 },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            singleLine = true,
                                            colors = OutlinedTextFieldDefaults.colors(
                                                focusedBorderColor = if (isExcluded) RoseAlert else BrandSky,
                                                unfocusedBorderColor = if (isExcluded) RoseAlert else Slate700,
                                                focusedTextColor = if (isExcluded) RoseAlert else Slate100,
                                                unfocusedTextColor = if (isExcluded) RoseAlert else Slate100
                                            ),
                                            modifier = Modifier.weight(1f)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Footer
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate850)
                        .padding(12.dp),
                    contentAlignment = Alignment.CenterEnd
                ) {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(containerColor = AmberGold),
                        modifier = Modifier.testTag("btn_close_calc")
                    ) {
                        Text("Listo", color = Slate950, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
