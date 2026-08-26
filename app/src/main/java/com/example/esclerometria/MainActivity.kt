package com.example.esclerometria

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.esclerometria.ui.MainViewModel
import com.example.esclerometria.ui.components.AppTopBar
import com.example.esclerometria.ui.dialogs.*
import com.example.esclerometria.ui.screens.ProjectDetailScreen
import com.example.esclerometria.ui.screens.ProjectListScreen
import com.example.esclerometria.ui.theme.EsclerometriaProTheme
import com.example.esclerometria.ui.theme.Slate950

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            EsclerometriaProTheme {
                MainAppContent(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun MainAppContent(viewModel: MainViewModel) {
    val projects by viewModel.allProjects.collectAsStateWithLifecycle()
    val tests by viewModel.allTests.collectAsStateWithLifecycle()
    val activeProject by viewModel.activeProject.collectAsStateWithLifecycle()
    val activeProjectTests by viewModel.activeProjectTests.collectAsStateWithLifecycle()

    val showProjectForm by viewModel.showProjectForm.collectAsStateWithLifecycle()
    val editingProject by viewModel.editingProject.collectAsStateWithLifecycle()

    val showTestForm by viewModel.showTestForm.collectAsStateWithLifecycle()
    val editingTest by viewModel.editingTest.collectAsStateWithLifecycle()

    val showQuickCalculator by viewModel.showQuickCalculator.collectAsStateWithLifecycle()
    val showNormativeInfo by viewModel.showNormativeInfo.collectAsStateWithLifecycle()
    val showExportDialog by viewModel.showExportDialog.collectAsStateWithLifecycle()

    val snackbarHostState = remember { SnackbarHostState() }

    Scaffold(
        containerColor = Slate950,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            AppTopBar(
                projects = projects,
                activeProject = activeProject,
                onSelectProject = { projectId -> viewModel.selectProject(projectId) },
                onNewProject = { viewModel.openNewProjectDialog() },
                onNewTest = { viewModel.openNewTestDialog() },
                onOpenCalculator = { viewModel.openQuickCalculator() },
                onOpenNorms = { viewModel.openNormativeInfo() },
                onOpenExport = { viewModel.openExportDialog() }
            )
        }
    ) { innerPadding ->
        androidx.compose.foundation.layout.Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            val currentProject = activeProject
            if (currentProject == null) {
                ProjectListScreen(
                    projects = projects,
                    tests = tests,
                    onSelectProject = { id -> viewModel.selectProject(id) },
                    onNewProject = { viewModel.openNewProjectDialog() },
                    onEditProject = { prj -> viewModel.openEditProjectDialog(prj) },
                    onDeleteProject = { id -> viewModel.deleteProject(id) },
                    onOpenExport = { prj ->
                        viewModel.selectProject(prj.id)
                        viewModel.openExportDialog()
                    }
                )
            } else {
                ProjectDetailScreen(
                    project = currentProject,
                    tests = activeProjectTests,
                    onNewTest = { viewModel.openNewTestDialog() },
                    onEditTest = { test -> viewModel.openEditTestDialog(test) },
                    onDeleteTest = { testId -> viewModel.deleteTest(testId) },
                    onEditProject = { viewModel.openEditProjectDialog(currentProject) },
                    onOpenExport = { viewModel.openExportDialog() }
                )
            }
        }
    }

    // Dialogs
    if (showProjectForm) {
        ProjectFormDialog(
            initialProject = editingProject,
            onDismiss = { viewModel.closeProjectFormDialog() },
            onSave = { prj -> viewModel.saveProject(prj) }
        )
    }

    if (showTestForm) {
        val targetProjectId = activeProject?.id ?: (projects.firstOrNull()?.id ?: "prj-1")
        TestFormDialog(
            projectId = targetProjectId,
            initialTest = editingTest,
            onDismiss = { viewModel.closeTestFormDialog() },
            onSave = { test -> viewModel.saveTest(test) }
        )
    }

    if (showQuickCalculator) {
        QuickCalculatorDialog(
            onDismiss = { viewModel.closeQuickCalculator() }
        )
    }

    if (showNormativeInfo) {
        NormativeInfoDialog(
            onDismiss = { viewModel.closeNormativeInfo() }
        )
    }

    if (showExportDialog && activeProject != null) {
        ExportReportDialog(
            project = activeProject!!,
            tests = activeProjectTests,
            onDismiss = { viewModel.closeExportDialog() }
        )
    }
}
