package com.example.esclerometria.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ProjectDao {
    @Query("SELECT * FROM projects ORDER BY updatedAt DESC")
    fun getAllProjects(): Flow<List<ProjectEntity>>

    @Query("SELECT * FROM projects WHERE id = :id")
    suspend fun getProjectById(id: String): ProjectEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProject(project: ProjectEntity)

    @Update
    suspend fun updateProject(project: ProjectEntity)

    @Delete
    suspend fun deleteProject(project: ProjectEntity)

    @Query("DELETE FROM projects WHERE id = :id")
    suspend fun deleteProjectById(id: String)
}

@Dao
interface TestDao {
    @Query("SELECT * FROM tests ORDER BY createdAt DESC")
    fun getAllTests(): Flow<List<SclerometryTestEntity>>

    @Query("SELECT * FROM tests WHERE projectId = :projectId ORDER BY createdAt DESC")
    fun getTestsByProject(projectId: String): Flow<List<SclerometryTestEntity>>

    @Query("SELECT * FROM tests WHERE id = :id")
    suspend fun getTestById(id: String): SclerometryTestEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTest(test: SclerometryTestEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllTests(tests: List<SclerometryTestEntity>)

    @Update
    suspend fun updateTest(test: SclerometryTestEntity)

    @Delete
    suspend fun deleteTest(test: SclerometryTestEntity)

    @Query("DELETE FROM tests WHERE id = :id")
    suspend fun deleteTestById(id: String)

    @Query("DELETE FROM tests WHERE projectId = :projectId")
    suspend fun deleteTestsByProject(projectId: String)
}
