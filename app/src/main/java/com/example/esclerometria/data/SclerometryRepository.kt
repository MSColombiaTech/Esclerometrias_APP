package com.example.esclerometria.data

import com.example.esclerometria.model.Project
import com.example.esclerometria.model.SclerometryTest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

class SclerometryRepository(
    private val projectDao: ProjectDao,
    private val testDao: TestDao
) {
    val allProjects: Flow<List<Project>> = projectDao.getAllProjects().map { list ->
        list.map { it.toDomain() }
    }

    val allTests: Flow<List<SclerometryTest>> = testDao.getAllTests().map { list ->
        list.map { it.toDomain() }
    }

    fun getTestsByProject(projectId: String): Flow<List<SclerometryTest>> {
        return testDao.getTestsByProject(projectId).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun getProjectCount(): Int = withContext(Dispatchers.IO) {
        projectDao.getProjectCount()
    }

    suspend fun getProjectById(id: String): Project? = withContext(Dispatchers.IO) {
        projectDao.getProjectById(id)?.toDomain()
    }

    suspend fun insertProject(project: Project) = withContext(Dispatchers.IO) {
        projectDao.insertProject(ProjectEntity.fromDomain(project))
    }

    suspend fun updateProject(project: Project) = withContext(Dispatchers.IO) {
        projectDao.updateProject(ProjectEntity.fromDomain(project))
    }

    suspend fun deleteProject(project: Project) = withContext(Dispatchers.IO) {
        testDao.deleteTestsByProject(project.id)
        projectDao.deleteProject(ProjectEntity.fromDomain(project))
    }

    suspend fun deleteProjectById(id: String) = withContext(Dispatchers.IO) {
        testDao.deleteTestsByProject(id)
        projectDao.deleteProjectById(id)
    }

    suspend fun insertTest(test: SclerometryTest) = withContext(Dispatchers.IO) {
        testDao.insertTest(SclerometryTestEntity.fromDomain(test))
    }

    suspend fun updateTest(test: SclerometryTest) = withContext(Dispatchers.IO) {
        testDao.updateTest(SclerometryTestEntity.fromDomain(test))
    }

    suspend fun deleteTest(test: SclerometryTest) = withContext(Dispatchers.IO) {
        testDao.deleteTest(SclerometryTestEntity.fromDomain(test))
    }

    suspend fun deleteTestById(id: String) = withContext(Dispatchers.IO) {
        testDao.deleteTestById(id)
    }

    suspend fun insertAllTests(tests: List<SclerometryTest>) = withContext(Dispatchers.IO) {
        testDao.insertAllTests(tests.map { SclerometryTestEntity.fromDomain(it) })
    }
}
