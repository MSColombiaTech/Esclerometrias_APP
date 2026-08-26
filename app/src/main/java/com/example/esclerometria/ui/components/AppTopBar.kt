package com.example.esclerometria.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.example.esclerometria.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppTopBar(
    projects: List<Project>,
    activeProject: Project?,
    onSelectProject: (String?) -> Unit,
    onNewProject: () -> Unit,
    onNewTest: () -> Unit,
    onOpenCalculator: () -> Unit,
    onOpenNorms: () -> Unit,
    onOpenExport: () -> Unit
) {
    var expandedProjectMenu by remember { mutableStateOf(false) }

    Surface(
        color = Slate900.copy(alpha = 0.95f),
        tonalElevation = 6.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Left Brand Logo & Title
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { onSelectProject(null) }
                ) {
                    if (activeProject != null) {
                        IconButton(
                            onClick = { onSelectProject(null) },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Volver a Proyectos",
                                tint = Slate200
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(
                                Brush.linearGradient(
                                    listOf(BrandSky, AmberGold)
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Construction,
                            contentDescription = "Logo",
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(10.dp))

                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Esclerometría",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                            Text(
                                text = "PRO",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Black,
                                color = BrandSkyLight
                            )
                        }
                        Text(
                            text = "🇨🇴 NTC 3692 / NSR-10",
                            style = MaterialTheme.typography.labelSmall,
                            color = AmberGold,
                            fontSize = 9.sp
                        )
                    }
                }

                // Right Actions
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Quick Calculator Button
                    IconButton(
                        onClick = onOpenCalculator,
                        modifier = Modifier.testTag("btn_quick_calc")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Calculate,
                            contentDescription = "Calculadora Rápida",
                            tint = AmberGold
                        )
                    }

                    // Normative Info Button
                    IconButton(
                        onClick = onOpenNorms,
                        modifier = Modifier.testTag("btn_normative_guide")
                    ) {
                        Icon(
                            imageVector = Icons.Default.MenuBook,
                            contentDescription = "Guía Normativa",
                            tint = BrandSkyLight
                        )
                    }

                    // Export Report Button
                    if (activeProject != null) {
                        IconButton(
                            onClick = onOpenExport,
                            modifier = Modifier.testTag("btn_export_pdf")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Description,
                                contentDescription = "Informe Técnico",
                                tint = EmeraldSuccess
                            )
                        }
                    }

                    // Project Selector Dropdown
                    Box {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Slate800,
                            modifier = Modifier
                                .clickable { expandedProjectMenu = true }
                                .padding(horizontal = 8.dp, vertical = 6.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.widthIn(max = 130.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Apartment,
                                    contentDescription = null,
                                    tint = BrandSkyLight,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = activeProject?.code ?: "Proyectos",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Slate200,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Icon(
                                    imageVector = Icons.Default.ArrowDropDown,
                                    contentDescription = null,
                                    tint = Slate400,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }

                        DropdownMenu(
                            expanded = expandedProjectMenu,
                            onDismissRequest = { expandedProjectMenu = false },
                            modifier = Modifier.background(Slate850)
                        ) {
                            DropdownMenuItem(
                                text = {
                                    Text(
                                        "Ver Todos los Proyectos",
                                        fontWeight = FontWeight.Bold,
                                        color = Slate100
                                    )
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.List, contentDescription = null, tint = BrandSkyLight)
                                },
                                onClick = {
                                    onSelectProject(null)
                                    expandedProjectMenu = false
                                }
                            )

                            HorizontalDivider(color = Slate700)

                            projects.forEach { project ->
                                DropdownMenuItem(
                                    text = {
                                        Column {
                                            Text(
                                                project.name,
                                                fontWeight = if (activeProject?.id == project.id) FontWeight.Bold else FontWeight.Normal,
                                                color = if (activeProject?.id == project.id) BrandSkyLight else Slate200,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                            Text(
                                                "${project.code} • ${project.municipality}",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = Slate400
                                            )
                                        }
                                    },
                                    onClick = {
                                        onSelectProject(project.id)
                                        expandedProjectMenu = false
                                    }
                                )
                            }

                            HorizontalDivider(color = Slate700)

                            DropdownMenuItem(
                                text = {
                                    Text(
                                        "+ Nuevo Proyecto",
                                        fontWeight = FontWeight.Bold,
                                        color = AmberGold
                                    )
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Add, contentDescription = null, tint = AmberGold)
                                },
                                onClick = {
                                    onNewProject()
                                    expandedProjectMenu = false
                                }
                            )
                        }
                    }

                    // New Test CTA Button (if in project)
                    if (activeProject != null) {
                        Button(
                            onClick = onNewTest,
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = BrandSky
                            ),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            modifier = Modifier
                                .height(34.dp)
                                .testTag("btn_new_test_top")
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                "Ensayo",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
            HorizontalDivider(color = Slate800)
        }
    }
}
