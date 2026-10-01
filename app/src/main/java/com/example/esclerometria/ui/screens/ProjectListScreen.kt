package com.example.esclerometria.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.esclerometria.model.Project
import com.example.esclerometria.model.SclerometryTest
import com.example.esclerometria.model.TestStatus
import com.example.esclerometria.ui.theme.*

@Composable
fun ProjectListScreen(
    projects: List<Project>,
    tests: List<SclerometryTest>,
    onSelectProject: (String) -> Unit,
    onNewProject: () -> Unit,
    onEditProject: (Project) -> Unit,
    onDeleteProject: (String) -> Unit,
    onOpenExport: (Project) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }
    var projectToDelete by remember { mutableStateOf<Project?>(null) }

    val filteredProjects = remember(projects, searchQuery) {
        if (searchQuery.isBlank()) projects
        else {
            val q = searchQuery.trim().lowercase()
            projects.filter {
                it.name.lowercase().contains(q) ||
                it.code.lowercase().contains(q) ||
                it.client.lowercase().contains(q) ||
                it.municipality.lowercase().contains(q)
            }
        }
    }

    Scaffold(
        containerColor = Slate950,
        contentWindowInsets = WindowInsets.navigationBars,
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNewProject,
                containerColor = AmberGold,
                contentColor = Slate950,
                modifier = Modifier.testTag("fab_new_project")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Nuevo Proyecto")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Nuevo Proyecto", fontWeight = FontWeight.Bold)
                }
            }
        }
    ) { innerPadding ->
        val navBottom = innerPadding.calculateBottomPadding()
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = navBottom + 88.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Banner
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Slate900),
                    border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(Slate700, Slate800))),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.verticalGradient(
                                    listOf(Slate850, Slate900)
                                )
                            )
                            .padding(20.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = BrandSky.copy(alpha = 0.2f),
                            border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(BrandSkyLight, BrandSky)))
                        ) {
                            Text(
                                text = "🇨🇴 Normativa Colombiana NTC 3692 / NSR-10",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = BrandSkyLight,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "Proyectos de Esclerometría en Concreto",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Black,
                            color = Color.White
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Control de calidad no destructivo, calibración de curvas de rebote Schmidt, registro fotográfico y reportes de obra conforme a NTC 3692 y NSR-10.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = Slate300
                        )
                    }
                }
            }

            // Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Buscar por código, obra, cliente o municipio...", color = Slate400, fontSize = 13.sp) },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = "Buscar", tint = Slate400)
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Clear, contentDescription = "Limpiar", tint = Slate400)
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Slate900,
                        unfocusedContainerColor = Slate900,
                        focusedBorderColor = BrandSky,
                        unfocusedBorderColor = Slate800,
                        focusedTextColor = Slate100,
                        unfocusedTextColor = Slate200
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("search_projects_input")
                )
            }

            // Projects List Count
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Obras Registradas (${filteredProjects.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Slate200
                    )
                    Text(
                        text = "${tests.size} ensayos totales",
                        style = MaterialTheme.typography.labelSmall,
                        color = Slate400
                    )
                }
            }

            if (filteredProjects.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Slate900),
                        modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.SearchOff,
                                contentDescription = null,
                                tint = Slate500,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No se encontraron proyectos",
                                style = MaterialTheme.typography.titleMedium,
                                color = Slate200
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Intenta con otro término o crea un nuevo proyecto de obra.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Slate400
                            )
                        }
                    }
                }
            }

            // Projects Cards
            items(filteredProjects, key = { it.id }) { project ->
                val projectTests = tests.filter { it.projectId == project.id }
                val compliesCount = projectTests.count { it.status == TestStatus.CUMPLE }
                val complianceRate = if (projectTests.isNotEmpty()) {
                    ((compliesCount.toDouble() / projectTests.size) * 100.0).toInt()
                } else 0

                ProjectCard(
                    project = project,
                    testsCount = projectTests.size,
                    complianceRate = complianceRate,
                    onClick = { onSelectProject(project.id) },
                    onEdit = { onEditProject(project) },
                    onDelete = { projectToDelete = project },
                    onExport = { onOpenExport(project) }
                )
            }
        }
    }

    // Delete Confirmation Dialog
    projectToDelete?.let { prj ->
        AlertDialog(
            onDismissRequest = { projectToDelete = null },
            title = { Text("¿Eliminar Proyecto?", fontWeight = FontWeight.Bold, color = Slate100) },
            text = {
                Text(
                    "Se eliminará el proyecto '${prj.name}' (${prj.code}) y todos sus ensayos registrados de forma permanente.",
                    color = Slate300
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        onDeleteProject(prj.id)
                        projectToDelete = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = RoseAlert)
                ) {
                    Text("Eliminar Obra", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { projectToDelete = null }) {
                    Text("Cancelar", color = Slate300)
                }
            },
            containerColor = Slate900
        )
    }
}

@Composable
fun ProjectCard(
    project: Project,
    testsCount: Int,
    complianceRate: Int,
    onClick: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onExport: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Slate900),
        border = CardDefaults.outlinedCardBorder().copy(brush = Brush.linearGradient(listOf(Slate700, Slate800))),
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .testTag("project_card_${project.code}")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp)
        ) {
            // Top Row: Code & Location
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
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
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Place,
                        contentDescription = "Ubicación",
                        tint = RoseAlert,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${project.municipality}, ${project.department}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Slate300,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Project Title
            Text(
                text = project.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Metadata Lines
            Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    text = "Cliente: ${project.client}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate300
                )
                Text(
                    text = "Contratista: ${project.contractor}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate400
                )
                Text(
                    text = "Ingeniero: ${project.engineerInCharge} ${if (project.licenseNumber.isNotBlank()) "(${project.licenseNumber})" else ""}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Slate400
                )
                Text(
                    text = "Esclerómetro: ${project.defaultHammerModel}",
                    style = MaterialTheme.typography.labelSmall,
                    color = AmberGold
                )
            }

            Spacer(modifier = Modifier.height(14.dp))
            HorizontalDivider(color = Slate800)
            Spacer(modifier = Modifier.height(12.dp))

            // Stats & Action Buttons Footer
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Test Stats
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Column {
                        Text("Ensayos", style = MaterialTheme.typography.labelSmall, color = Slate400)
                        Text(
                            "$testsCount elementos",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                    Column {
                        Text("Conformidad", style = MaterialTheme.typography.labelSmall, color = Slate400)
                        Text(
                            "$complianceRate%",
                            style = MaterialTheme.typography.bodyMedium,
                            fontWeight = FontWeight.Bold,
                            color = if (complianceRate >= 90) EmeraldSuccess else if (complianceRate >= 70) AmberGold else RoseAlert
                        )
                    }
                }

                // Action Icons
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(
                        onClick = onExport,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Description,
                            contentDescription = "Informe",
                            tint = EmeraldSuccess,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    IconButton(
                        onClick = onEdit,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Editar",
                            tint = Slate300,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.DeleteOutline,
                            contentDescription = "Eliminar",
                            tint = RoseAlert,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = BrandSky.copy(alpha = 0.15f),
                        modifier = Modifier
                            .size(34.dp)
                            .clickable(onClick = onClick),
                        contentColor = BrandSkyLight
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.ChevronRight,
                                contentDescription = "Abrir Proyecto",
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
