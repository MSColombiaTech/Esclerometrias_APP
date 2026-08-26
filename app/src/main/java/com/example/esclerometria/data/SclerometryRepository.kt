package com.example.esclerometria.data

import com.example.esclerometria.model.Project
import com.example.esclerometria.model.SclerometryTest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

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

    suspend fun getProjectById(id: String): Project? {
        return projectDao.getProjectById(id)?.toDomain()
    }

    suspend fun insertProject(project: Project) {
        projectDao.insertProject(ProjectEntity.fromDomain(project))
    }

    suspend fun updateProject(project: Project) {
        projectDao.updateProject(ProjectEntity.fromDomain(project))
    }

    suspend fun deleteProject(project: Project) {
        testDao.deleteTestsByProject(project.id)
        projectDao.deleteProject(ProjectEntity.fromDomain(project))
    }

    suspend fun deleteProjectById(id: String) {
        testDao.deleteTestsByProject(id)
        projectDao.deleteProjectById(id)
    }

    suspend fun insertTest(test: SclerometryTest) {
        testDao.insertTest(SclerometryTestEntity.fromDomain(test))
    }

    suspend fun updateTest(test: SclerometryTest) {
        testDao.updateTest(SclerometryTestEntity.fromDomain(test))
    }

    suspend fun deleteTest(test: SclerometryTest) {
        testDao.deleteTest(SclerometryTestEntity.fromDomain(test))
    }

    suspend fun deleteTestById(id: String) {
        testDao.deleteTestById(id)
    }

    suspend fun insertAllTests(tests: List<SclerometryTest>) {
        testDao.insertAllTests(tests.map { SclerometryTestEntity.fromDomain(it) })
    }
}
