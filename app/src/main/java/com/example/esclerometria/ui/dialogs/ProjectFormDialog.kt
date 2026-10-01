package com.example.esclerometria.ui.dialogs

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.esclerometria.model.CurveModel
import com.example.esclerometria.model.Project
import com.example.esclerometria.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectFormDialog(
    initialProject: Project?,
    onDismiss: () -> Unit,
    onSave: (Project) -> Unit
) {
    val currentYear = 2026
    var code by remember { mutableStateOf(initialProject?.code ?: "OBRA-COL-$currentYear-${(100..999).random()}") }
    var name by remember { mutableStateOf(initialProject?.name ?: "") }
    var client by remember { mutableStateOf(initialProject?.client ?: "") }
    var location by remember { mutableStateOf(initialProject?.location ?: "") }
    var municipality by remember { mutableStateOf(initialProject?.municipality ?: "Bogotá D.C.") }
    var department by remember { mutableStateOf(initialProject?.department ?: "Cundinamarca") }
    var contractor by remember { mutableStateOf(initialProject?.contractor ?: "") }
    var supervision by remember { mutableStateOf(initialProject?.supervision ?: "") }
    var engineerInCharge by remember { mutableStateOf(initialProject?.engineerInCharge ?: "Ing. Residente") }
    var licenseNumber by remember { mutableStateOf(initialProject?.licenseNumber ?: "") }
    var defaultHammerModel by remember { mutableStateOf(initialProject?.defaultHammerModel ?: "Schmidt Original Tipo N (2.207 Nm)") }
    var defaultHammerSerial by remember { mutableStateOf(initialProject?.defaultHammerSerial ?: "SCH-N-88492-COL") }
    var defaultCurve by remember { mutableStateOf(initialProject?.defaultCurve ?: CurveModel.PROCEQ_N_STANDARD) }
    var notes by remember { mutableStateOf(initialProject?.notes ?: "") }

    val departments = listOf(
        "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá",
        "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca",
        "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño",
        "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia",
        "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"
    )

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .systemBarsPadding()
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
                        Icon(Icons.Default.Apartment, contentDescription = null, tint = AmberGold, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (initialProject == null) "Nuevo Proyecto de Obra" else "Editar Proyecto: ${initialProject.code}",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
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
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("1. Identificación del Proyecto", fontWeight = FontWeight.Bold, color = BrandSkyLight, fontSize = 13.sp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = code,
                            onValueChange = { code = it },
                            label = { Text("Código de Obra *") },
                            singleLine = true,
                            modifier = Modifier.weight(1f).testTag("input_project_code")
                        )

                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Nombre del Proyecto *") },
                            placeholder = { Text("ej: Torres de San Jerónimo") },
                            singleLine = true,
                            modifier = Modifier.weight(2f).testTag("input_project_name")
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = client,
                            onValueChange = { client = it },
                            label = { Text("Cliente / Contratante") },
                            placeholder = { Text("ej: Constructora Bolívar") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = location,
                            onValueChange = { location = it },
                            label = { Text("Dirección / Sector") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Department Dropdown
                        var expandedDept by remember { mutableStateOf(false) }
                        Box(modifier = Modifier.weight(1f)) {
                            OutlinedTextField(
                                value = department,
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Departamento") },
                                trailingIcon = {
                                    IconButton(onClick = { expandedDept = true }) {
                                        Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                                    }
                                },
                                modifier = Modifier.fillMaxWidth().clickable { expandedDept = true }
                            )
                            DropdownMenu(
                                expanded = expandedDept,
                                onDismissRequest = { expandedDept = false },
                                modifier = Modifier.background(Slate850)
                            ) {
                                departments.forEach { dep ->
                                    DropdownMenuItem(
                                        text = { Text(dep, color = Slate100) },
                                        onClick = {
                                            department = dep
                                            expandedDept = false
                                        }
                                    )
                                }
                            }
                        }

                        OutlinedTextField(
                            value = municipality,
                            onValueChange = { municipality = it },
                            label = { Text("Municipio / Ciudad") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // 2. Technical Stakeholders
                    Text("2. Responsables Técnicos & Interventoría", fontWeight = FontWeight.Bold, color = EmeraldSuccess, fontSize = 13.sp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = contractor,
                            onValueChange = { contractor = it },
                            label = { Text("Empresa Contratista") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = supervision,
                            onValueChange = { supervision = it },
                            label = { Text("Supervisión / Interventoría") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = engineerInCharge,
                            onValueChange = { engineerInCharge = it },
                            label = { Text("Ingeniero Responsable") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = licenseNumber,
                            onValueChange = { licenseNumber = it },
                            label = { Text("Matrícula Prof. (T.P.)") },
                            placeholder = { Text("ej: TP 25202-18456 CND") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    // 3. Hammer Equipment & Default Curve
                    Text("3. Esclerómetro & Curva Base", fontWeight = FontWeight.Bold, color = AmberGold, fontSize = 13.sp)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = defaultHammerModel,
                            onValueChange = { defaultHammerModel = it },
                            label = { Text("Modelo Esclerómetro") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )

                        OutlinedTextField(
                            value = defaultHammerSerial,
                            onValueChange = { defaultHammerSerial = it },
                            label = { Text("Serial de Calibración") },
                            singleLine = true,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text("Alcance de la Inspección / Notas") },
                        maxLines = 2,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Footer Actions
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
                            if (name.isBlank()) name = "Proyecto Obra"
                            if (code.isBlank()) code = "OBRA-$currentYear"

                            val prj = Project(
                                id = initialProject?.id ?: "prj-${System.currentTimeMillis()}",
                                code = code.trim(),
                                name = name.trim(),
                                client = client.trim().ifEmpty { "Particular" },
                                location = location.trim().ifEmpty { "En obra" },
                                municipality = municipality.trim().ifEmpty { "Colombia" },
                                department = department.trim().ifEmpty { "Colombia" },
                                contractor = contractor.trim().ifEmpty { "N/A" },
                                supervision = supervision.trim().ifEmpty { "N/A" },
                                engineerInCharge = engineerInCharge.trim().ifEmpty { "Ingeniero Residente" },
                                licenseNumber = licenseNumber.trim(),
                                defaultHammerModel = defaultHammerModel.trim(),
                                defaultHammerSerial = defaultHammerSerial.trim(),
                                defaultCurve = defaultCurve,
                                notes = notes.trim(),
                                createdAt = initialProject?.createdAt ?: System.currentTimeMillis(),
                                updatedAt = System.currentTimeMillis()
                            )
                            onSave(prj)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AmberGold),
                        modifier = Modifier.testTag("btn_save_project")
                    ) {
                        Icon(Icons.Default.Save, contentDescription = null, tint = Slate950, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(if (initialProject == null) "Crear Proyecto" else "Guardar Cambios", color = Slate950, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
