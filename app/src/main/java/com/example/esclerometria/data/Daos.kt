package com.example.esclerometria.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ProjectDao {
    @Query("SELECT * FROM projects ORDER BY updatedAt DESC")
    fun getAllProjects(): Flow<List<ProjectEntity>>

    @Query("SELECT COUNT(*) FROM projects")
    fun getProjectCount(): Int

    @Query("SELECT * FROM projects WHERE id = :id")
    fun getProjectById(id: String): ProjectEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertProject(project: ProjectEntity): Long

    @Update
    fun updateProject(project: ProjectEntity): Int

    @Delete
    fun deleteProject(project: ProjectEntity): Int

    @Query("DELETE FROM projects WHERE id = :id")
    fun deleteProjectById(id: String): Int
}

@Dao
interface TestDao {
    @Query("SELECT * FROM tests ORDER BY createdAt DESC")
    fun getAllTests(): Flow<List<SclerometryTestEntity>>

    @Query("SELECT * FROM tests WHERE projectId = :projectId ORDER BY createdAt DESC")
    fun getTestsByProject(projectId: String): Flow<List<SclerometryTestEntity>>

    @Query("SELECT * FROM tests WHERE id = :id")
    fun getTestById(id: String): SclerometryTestEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertTest(test: SclerometryTestEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertAllTests(tests: List<SclerometryTestEntity>): List<Long>

    @Update
    fun updateTest(test: SclerometryTestEntity): Int

    @Delete
    fun deleteTest(test: SclerometryTestEntity): Int

    @Query("DELETE FROM tests WHERE id = :id")
    fun deleteTestById(id: String): Int

    @Query("DELETE FROM tests WHERE projectId = :projectId")
    fun deleteTestsByProject(projectId: String): Int
}
