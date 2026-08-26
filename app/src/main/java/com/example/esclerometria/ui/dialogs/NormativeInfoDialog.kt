package com.example.esclerometria.ui.dialogs

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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.esclerometria.ui.theme.*

@Composable
fun NormativeInfoDialog(onDismiss: () -> Unit) {
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
                        Icon(Icons.Default.MenuBook, contentDescription = null, tint = BrandSkyLight, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text("Normativa Colombiana & Estándares", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                            Text("NTC 3692 / NSR-10 Título C / ASTM C805", style = MaterialTheme.typography.labelSmall, color = AmberGold)
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
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Card 1: NTC 3692 / ASTM C805
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Slate850),
                        border = BorderStroke(1.dp, Slate700),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                "🛡️ NTC 3692 (ASTM C805) - Método del Número de Rebote",
                                fontWeight = FontWeight.Bold,
                                color = BrandSkyLight,
                                fontSize = 14.sp
                            )
                            Text(
                                "Establece el procedimiento técnico para determinar el número de rebote en concreto endurecido mediante el esclerómetro Schmidt (Tipo N, 2.207 N·m):",
                                style = MaterialTheme.typography.bodySmall,
                                color = Slate300
                            )

                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                NormBullet("Preparación Superficial: Pulir con piedra de carburo de silicio (carborundum) en un diámetro mínimo de 150 mm para remover la lechada.")
                                NormBullet("Malla de Ensayo: Tomar al menos 10 lecturas espaciadas al menos 25 mm (1 pulgada) entre sí y a más de 25 mm de los bordes.")
                                NormBullet("Criterio de Descarte: Descartar lecturas individuales que difieran en más de 6 unidades del promedio preliminar.")
                                NormBullet("Anulación del Ensayo: Si se descartan más de 2 lecturas de 10 (>20%), el ensayo se anula y debe repetirse en zona contigua.")
                                NormBullet("Yunque de Calibración: El equipo debe verificarse periódicamente en yunque templado con rebote 80 ± 2.")
                            }
                        }
                    }

                    // Card 2: NSR-10 Título C
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Slate850),
                        border = BorderStroke(1.dp, Slate700),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                "⚖️ NSR-10 Título C (Concreto Estructural) - Capítulo C.5",
                                fontWeight = FontWeight.Bold,
                                color = AmberGold,
                                fontSize = 14.sp
                            )
                            Text(
                                "La NSR-10 define los criterios de aceptación y evaluación de uniformidad en estructuras:",
                                style = MaterialTheme.typography.bodySmall,
                                color = Slate300
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = Slate900,
                                    border = BorderStroke(1.dp, EmeraldSuccess.copy(alpha = 0.5f)),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Text("Zona Conforme (≥95%)", fontWeight = FontWeight.Bold, color = EmeraldSuccess, fontSize = 12.sp)
                                        Text("Cumple con la resistencia de diseño especificada.", style = MaterialTheme.typography.labelSmall, color = Slate300)
                                    }
                                }

                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = Slate900,
                                    border = BorderStroke(1.dp, AmberGold.copy(alpha = 0.5f)),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Text("Zona Dudosa (80-95%)", fontWeight = FontWeight.Bold, color = AmberGold, fontSize = 12.sp)
                                        Text("Requiere verificar con testigos diamantados (NTC 3658).", style = MaterialTheme.typography.labelSmall, color = Slate300)
                                    }
                                }
                            }
                        }
                    }

                    // Card 3: NTC 3658 Correlación Núcleos
                    Card(
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Slate850),
                        border = BorderStroke(1.dp, Slate700),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                "📄 Correlación con Núcleos Diamantados (NTC 3658 / ASTM C42)",
                                fontWeight = FontWeight.Bold,
                                color = EmeraldSuccess,
                                fontSize = 14.sp
                            )
                            Text(
                                "Para curvas in-situ calibradas, la NSR-10 recomienda extraer mínimo 3 núcleos diamantados por tipología y ajustar los coeficientes de la curva potencial:",
                                style = MaterialTheme.typography.bodySmall,
                                color = Slate300
                            )
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Slate900,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    "f'c (MPa) = a · (R corregido)^b",
                                    fontWeight = FontWeight.Bold,
                                    color = BrandSkyLight,
                                    fontSize = 14.sp,
                                    modifier = Modifier.padding(10.dp)
                                )
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
                        colors = ButtonDefaults.buttonColors(containerColor = BrandSky),
                        modifier = Modifier.testTag("btn_close_normative")
                    ) {
                        Text("Entendido", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun NormBullet(text: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
        Text("• ", color = AmberGold, fontWeight = FontWeight.Bold)
        Text(text, style = MaterialTheme.typography.bodySmall, color = Slate300, fontSize = 12.sp)
    }
}
