package com.example.esclerometria.ui.dialogs

import android.content.Context
import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.esclerometria.model.Project
import com.example.esclerometria.model.SclerometryTest
import com.example.esclerometria.model.TestStatus
import com.example.esclerometria.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ExportReportDialog(
    project: Project,
    tests: List<SclerometryTest>,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current

    val reportText = remember(project, tests) {
        generateTechnicalReport(project, tests)
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
                        Icon(Icons.Default.Description, contentDescription = null, tint = EmeraldSuccess, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text("Informe Técnico de Esclerometría", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                            Text("Formato oficial NTC 3692 / NSR-10", style = MaterialTheme.typography.labelSmall, color = Slate400)
                        }
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = Slate400)
                    }
                }

                // Scrollable Body
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = Slate950,
                        border = BorderStroke(1.dp, Slate800),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = reportText,
                            style = MaterialTheme.typography.bodySmall.copy(
                                fontFamily = FontFamily.Monospace,
                                fontSize = 11.sp,
                                lineHeight = 16.sp
                            ),
                            color = Slate200,
                            modifier = Modifier.padding(14.dp)
                        )
                    }
                }

                // Footer Actions
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Slate850)
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cerrar", color = Slate300)
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                clipboardManager.setText(AnnotatedString(reportText))
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Slate700),
                            modifier = Modifier.testTag("btn_copy_report")
                        ) {
                            Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Copiar")
                        }

                        Button(
                            onClick = {
                                val sendIntent = Intent().apply {
                                    action = Intent.ACTION_SEND
                                    putExtra(Intent.EXTRA_TEXT, reportText)
                                    putExtra(Intent.EXTRA_TITLE, "Informe Esclerometria ${project.code}")
                                    type = "text/plain"
                                }
                                val shareIntent = Intent.createChooser(sendIntent, "Compartir Informe Técnico")
                                context.startActivity(shareIntent)
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldSuccess),
                            modifier = Modifier.testTag("btn_share_report")
                        ) {
                            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Compartir", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

fun generateTechnicalReport(project: Project, tests: List<SclerometryTest>): String {
    val dateFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale("es", "CO"))
    val sb = StringBuilder()

    sb.appendLine("================================================================================")
    sb.appendLine("  INFORME TÉCNICO DE ENSAYOS DE ESCLEROMETRÍA (NTC 3692 / NSR-10)")
    sb.appendLine("  Generado por Esclerometría Pro Colombia • Fecha: ${dateFormat.format(Date())}")
    sb.appendLine("================================================================================")
    sb.appendLine()
    sb.appendLine("1. DATOS GENERALES DEL PROYECTO")
    sb.appendLine("--------------------------------------------------------------------------------")
    sb.appendLine("Código de Obra:        ${project.code}")
    sb.appendLine("Nombre del Proyecto:   ${project.name}")
    sb.appendLine("Cliente / Contratante: ${project.client}")
    sb.appendLine("Ubicación:             ${project.location}, ${project.municipality}, ${project.department}")
    sb.appendLine("Empresa Contratista:   ${project.contractor}")
    sb.appendLine("Interventoría:         ${project.supervision}")
    sb.appendLine("Ingeniero Responsable: ${project.engineerInCharge} (T.P. ${project.licenseNumber})")
    sb.appendLine("Equipo Esclerómetro:   ${project.defaultHammerModel} [Serial: ${project.defaultHammerSerial}]")
    sb.appendLine("Curva Predeterminada:  ${project.defaultCurve.label}")
    sb.appendLine()

    val complies = tests.count { it.status == TestStatus.CUMPLE }
    val doubtful = tests.count { it.status == TestStatus.DUDOSO }
    val fails = tests.count { it.status == TestStatus.NO_CUMPLE }
    val invalid = tests.count { it.status == TestStatus.INVALIDO }
    val compliancePct = if (tests.isNotEmpty()) ((complies.toDouble() / tests.size) * 100.0).toInt() else 0

    sb.appendLine("2. RESUMEN ESTADÍSTICO DE CONTROL DE CALIDAD")
    sb.appendLine("--------------------------------------------------------------------------------")
    sb.appendLine("Total de Elementos Ensayados:     ${tests.size}")
    sb.appendLine("Elementos Conformes (CUMPLE):     $complies")
    sb.appendLine("Elementos en Zona Dudosa (80-95%): $doubtful")
    sb.appendLine("Elementos No Conformes (<80%):    $fails")
    sb.appendLine("Ensayos Inválidos (Dispersión >6): $invalid")
    sb.appendLine("Tasa Global de Conformidad:       $compliancePct%")
    sb.appendLine()

    sb.appendLine("3. DETALLE DE ELEMENTOS Y ENSAYOS DE IMPACTO")
    sb.appendLine("--------------------------------------------------------------------------------")
    tests.forEachIndexed { i, t ->
        sb.appendLine("[${i + 1}] Elemento: ${t.elementTag} (${t.elementType.label}) - ${t.levelAxis}")
        sb.appendLine("    f'c Diseño:       ${t.fcDesignMpa} MPa (${t.fcDesignPsi} PSI) | Edad: ${t.concreteAgeDays} días | Ángulo: ${t.impactAngle.label}")
        sb.appendLine("    Modelo Curva:     ${t.curveModel.label}")
        sb.appendLine("    Lecturas (10):    ${t.readings.joinToString(", ")}")
        if (t.excludedIndices.isNotEmpty()) {
            sb.appendLine("    Descartes NTC:    ${t.excludedIndices.map { "R-${it + 1} (${t.readings[it]})" }.joinToString(", ")} (Lecturas con desviación > 6 unidades)")
        } else {
            sb.appendLine("    Descartes NTC:    Ninguno (100% lecturas válidas)")
        }
        sb.appendLine("    Estadística R:    R_crudo = ${t.meanRaw} | ΔR = ${t.correctionAngle} | R_corregido = ${t.meanCorrected} | s = ${t.stdDev} | CV = ${t.cov}%")
        if (t.carbonationDepthMm > 0.0 || t.ultrasonicPulseVelocity > 0.0 || t.moistureFactor != 1.0) {
            sb.appendLine("    Factores Campo:   Carbonatación = ${t.carbonationDepthMm} mm | Humedad = ${t.moistureFactor} | UPV = ${if (t.ultrasonicPulseVelocity > 0) "${t.ultrasonicPulseVelocity} km/s" else "N/A"}")
        }
        sb.appendLine("    f'c Estimado (±U): ${t.estimatedFcMpa} ± ${t.uncertaintyMpa} MPa (${t.estimatedFcPsi} PSI, ${t.estimatedFcKgcm2} kg/cm²)")
        sb.appendLine("    Conformidad:      ${t.status.label} (${t.complianceRatio}% del diseño)")
        sb.appendLine("    Dictamen:         ${t.statusNotes}")
        sb.appendLine()
    }

    sb.appendLine("================================================================================")
    sb.appendLine("  DICTAMEN NORMATIVO Y REGLAS DE DECISIÓN (NSR-10 / ISO 17025 / NTC 3692):")
    sb.appendLine("  1. CONFORME (CUMPLE): f'c estimado >= 95% del f'c de diseño especificado.")
    sb.appendLine("  2. ZONA DUDOSA: 80% <= f'c estimado < 95%. Se recomienda realizar ensayos")
    sb.appendLine("     complementarios de extracción de núcleos diamantados según NSR-10 C.5.6.5")
    sb.appendLine("     y NTC 3658 (ASTM C42) o ultrasonido SonReb (NTC 4325).")
    sb.appendLine("  3. NO CONFORME: f'c estimado < 80%. Requiere evaluación estructural inmediata.")
    sb.appendLine("  4. INCERTIDUMBRE (U, k=2): Calculada bajo lineamientos GUM / ISO 17025.")
    sb.appendLine("================================================================================")

    return sb.toString()
}
