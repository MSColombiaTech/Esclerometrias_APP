package com.example.esclerometria.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.esclerometria.data.AppDatabase
import com.example.esclerometria.data.SclerometryRepository
import com.example.esclerometria.model.Project
import com.example.esclerometria.model.SclerometryTest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: SclerometryRepository
    val allProjects: StateFlow<List<Project>>
    val allTests: StateFlow<List<SclerometryTest>>

    private val _activeProjectId = MutableStateFlow<String?>(null)
    val activeProjectId: StateFlow<String?> = _activeProjectId.asStateFlow()

    // Dialog & Navigation states
    private val _editingProject = MutableStateFlow<Project?>(null)
    val editingProject = _editingProject.asStateFlow()

    private val _showProjectForm = MutableStateFlow(false)
    val showProjectForm = _showProjectForm.asStateFlow()

    private val _editingTest = MutableStateFlow<SclerometryTest?>(null)
    val editingTest = _editingTest.asStateFlow()

    private val _showTestForm = MutableStateFlow(false)
    val showTestForm = _showTestForm.asStateFlow()

    private val _showQuickCalculator = MutableStateFlow(false)
    val showQuickCalculator = _showQuickCalculator.asStateFlow()

    private val _showNormativeInfo = MutableStateFlow(false)
    val showNormativeInfo = _showNormativeInfo.asStateFlow()

    private val _showExportDialog = MutableStateFlow(false)
    val showExportDialog = _showExportDialog.asStateFlow()

    init {
        val database = AppDatabase.getDatabase(application, viewModelScope)
        repository = SclerometryRepository(database.projectDao(), database.testDao())

        allProjects = repository.allProjects.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        allTests = repository.allTests.stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

        // Ensure database has demo projects and tests if empty
        viewModelScope.launch(Dispatchers.IO) {
            try {
                if (repository.getProjectCount() == 0) {
                    val db = AppDatabase.getDatabase(application, viewModelScope)
                    com.example.esclerometria.data.populateInitialData(db.projectDao(), db.testDao())
                }
            } catch (e: Exception) {
                android.util.Log.e("MainViewModel", "Error initializing data", e)
            }
        }
    }

    val activeProject: StateFlow<Project?> = combine(allProjects, activeProjectId) { projects, activeId ->
        projects.find { it.id == activeId }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val activeProjectTests: StateFlow<List<SclerometryTest>> = combine(allTests, activeProjectId) { tests, activeId ->
        if (activeId == null) emptyList() else tests.filter { it.projectId == activeId }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun selectProject(id: String?) {
        _activeProjectId.value = id
    }

    fun openNewProjectDialog() {
        _editingProject.value = null
        _showProjectForm.value = true
    }

    fun openEditProjectDialog(project: Project) {
        _editingProject.value = project
        _showProjectForm.value = true
    }

    fun closeProjectFormDialog() {
        _showProjectForm.value = false
        _editingProject.value = null
    }

    fun saveProject(project: Project) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertProject(project)
            _activeProjectId.value = project.id
        }
        closeProjectFormDialog()
    }

    fun deleteProject(projectId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteProjectById(projectId)
            if (_activeProjectId.value == projectId) {
                _activeProjectId.value = null
            }
        }
    }

    fun openNewTestDialog() {
        _editingTest.value = null
        _showTestForm.value = true
    }

    fun openEditTestDialog(test: SclerometryTest) {
        _editingTest.value = test
        _showTestForm.value = true
    }

    fun closeTestFormDialog() {
        _showTestForm.value = false
        _editingTest.value = null
    }

    fun saveTest(test: SclerometryTest) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.insertTest(test)
        }
        closeTestFormDialog()
    }

    fun deleteTest(testId: String) {
        viewModelScope.launch(Dispatchers.IO) {
            repository.deleteTestById(testId)
        }
    }

    fun openQuickCalculator() {
        _showQuickCalculator.value = true
    }

    fun closeQuickCalculator() {
        _showQuickCalculator.value = false
    }

    fun openNormativeInfo() {
        _showNormativeInfo.value = true
    }

    fun closeNormativeInfo() {
        _showNormativeInfo.value = false
    }

    fun openExportDialog() {
        _showExportDialog.value = true
    }

    fun closeExportDialog() {
        _showExportDialog.value = false
    }
}
