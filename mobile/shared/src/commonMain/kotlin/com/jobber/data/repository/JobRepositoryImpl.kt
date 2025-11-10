package com.jobber.data.repository

import com.jobber.data.dto.toDomain
import com.jobber.db.JobberDatabase
import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Job
import com.jobber.domain.repositories.JobRepository
import com.jobber.network.ApiResponse
import com.jobber.network.JobApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate

class JobRepositoryImpl(
    private val jobApi: JobApi,
    private val database: JobberDatabase
) : JobRepository {

    override suspend fun getJobs(date: LocalDate): ApiResult<List<Job>> {
        return try {
            when (val response = jobApi.getJobs(date.toString())) {
                is ApiResponse.Success -> {
                    val jobs = response.data.map { dto ->
                        database.jobQueries.insertOrReplace(
                            id = dto.id,
                            jobNumber = dto.jobNumber,
                            clientId = dto.clientId,
                            quoteId = dto.quoteId,
                            title = dto.title,
                            description = dto.description,
                            status = dto.status,
                            priority = dto.priority ?: "MEDIUM",
                            scheduledAt = dto.scheduledAt?.let { Instant.parse(it).toEpochMilliseconds() },
                            scheduledDuration = dto.scheduledDuration?.toLong(),
                            startedAt = dto.startedAt?.let { Instant.parse(it).toEpochMilliseconds() },
                            completedAt = dto.completedAt?.let { Instant.parse(it).toEpochMilliseconds() },
                            assignedToId = dto.assignedToId,
                            instructions = dto.instructions,
                            createdAt = Instant.parse(dto.createdAt).toEpochMilliseconds(),
                            updatedAt = Instant.parse(dto.updatedAt).toEpochMilliseconds(),
                            syncStatus = "synced"
                        )
                        dto.toDomain()
                    }
                    ApiResult.Success(jobs)
                }
                is ApiResponse.Error -> {
                    val cachedJobs = database.jobQueries.selectByDate(date.toString())
                        .executeAsList()
                        .map { dbJob ->
                            Job(
                                id = dbJob.id,
                                jobNumber = dbJob.jobNumber,
                                clientId = dbJob.clientId,
                                quoteId = dbJob.quoteId,
                                title = dbJob.title,
                                description = dbJob.description,
                                status = com.jobber.domain.models.JobStatus.valueOf(dbJob.status),
                                priority = com.jobber.domain.models.JobPriority.valueOf(dbJob.priority),
                                scheduledAt = dbJob.scheduledAt?.let { Instant.fromEpochMilliseconds(it) },
                                scheduledDuration = dbJob.scheduledDuration?.toInt(),
                                startedAt = dbJob.startedAt?.let { Instant.fromEpochMilliseconds(it) },
                                completedAt = dbJob.completedAt?.let { Instant.fromEpochMilliseconds(it) },
                                assignedToId = dbJob.assignedToId,
                                instructions = dbJob.instructions,
                                createdAt = Instant.fromEpochMilliseconds(dbJob.createdAt),
                                updatedAt = Instant.fromEpochMilliseconds(dbJob.updatedAt)
                            )
                        }
                    if (cachedJobs.isNotEmpty()) {
                        ApiResult.Success(cachedJobs)
                    } else {
                        ApiResult.Error(response.message)
                    }
                }
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Unknown error")
        }
    }

    override suspend fun getJobById(id: String): ApiResult<Job> {
        return try {
            when (val response = jobApi.getJobById(id)) {
                is ApiResponse.Success -> {
                    ApiResult.Success(response.data.toDomain())
                }
                is ApiResponse.Error -> {
                    ApiResult.Error(response.message)
                }
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Unknown error")
        }
    }

    override suspend fun updateJobStatus(id: String, status: String): ApiResult<Job> {
        return try {
            when (val response = jobApi.updateJobStatus(id, status)) {
                is ApiResponse.Success -> {
                    ApiResult.Success(response.data.toDomain())
                }
                is ApiResponse.Error -> {
                    database.jobQueries.updateStatus(status, System.currentTimeMillis(), id)
                    ApiResult.Error(response.message)
                }
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Unknown error")
        }
    }

    override suspend fun startJob(id: String): ApiResult<Job> {
        return try {
            when (val response = jobApi.startJob(id)) {
                is ApiResponse.Success -> {
                    ApiResult.Success(response.data.toDomain())
                }
                is ApiResponse.Error -> {
                    ApiResult.Error(response.message)
                }
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Unknown error")
        }
    }

    override suspend fun completeJob(
        id: String,
        signature: ByteArray?,
        photos: List<ByteArray>
    ): ApiResult<Job> {
        return try {
            when (val response = jobApi.completeJob(id, signature, photos)) {
                is ApiResponse.Success -> {
                    ApiResult.Success(response.data.toDomain())
                }
                is ApiResponse.Error -> {
                    ApiResult.Error(response.message)
                }
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Unknown error")
        }
    }

    override suspend fun addPhoto(
        jobId: String,
        photo: ByteArray,
        caption: String?,
        type: String
    ): ApiResult<Unit> {
        return ApiResult.Success(Unit)
    }

    override fun observeJobs(date: LocalDate): Flow<List<Job>> {
        return database.jobQueries.selectByDate(date.toString())
            .asFlow()
            .map { query ->
                query.executeAsList().map { dbJob ->
                    Job(
                        id = dbJob.id,
                        jobNumber = dbJob.jobNumber,
                        clientId = dbJob.clientId,
                        quoteId = dbJob.quoteId,
                        title = dbJob.title,
                        description = dbJob.description,
                        status = com.jobber.domain.models.JobStatus.valueOf(dbJob.status),
                        priority = com.jobber.domain.models.JobPriority.valueOf(dbJob.priority),
                        scheduledAt = dbJob.scheduledAt?.let { Instant.fromEpochMilliseconds(it) },
                        scheduledDuration = dbJob.scheduledDuration?.toInt(),
                        startedAt = dbJob.startedAt?.let { Instant.fromEpochMilliseconds(it) },
                        completedAt = dbJob.completedAt?.let { Instant.fromEpochMilliseconds(it) },
                        assignedToId = dbJob.assignedToId,
                        instructions = dbJob.instructions,
                        createdAt = Instant.fromEpochMilliseconds(dbJob.createdAt),
                        updatedAt = Instant.fromEpochMilliseconds(dbJob.updatedAt)
                    )
                }
            }
    }

    override fun observeJob(id: String): Flow<Job?> {
        return database.jobQueries.selectById(id)
            .asFlow()
            .map { query ->
                query.executeAsOneOrNull()?.let { dbJob ->
                    Job(
                        id = dbJob.id,
                        jobNumber = dbJob.jobNumber,
                        clientId = dbJob.clientId,
                        quoteId = dbJob.quoteId,
                        title = dbJob.title,
                        description = dbJob.description,
                        status = com.jobber.domain.models.JobStatus.valueOf(dbJob.status),
                        priority = com.jobber.domain.models.JobPriority.valueOf(dbJob.priority),
                        scheduledAt = dbJob.scheduledAt?.let { Instant.fromEpochMilliseconds(it) },
                        scheduledDuration = dbJob.scheduledDuration?.toInt(),
                        startedAt = dbJob.startedAt?.let { Instant.fromEpochMilliseconds(it) },
                        completedAt = dbJob.completedAt?.let { Instant.fromEpochMilliseconds(it) },
                        assignedToId = dbJob.assignedToId,
                        instructions = dbJob.instructions,
                        createdAt = Instant.fromEpochMilliseconds(dbJob.createdAt),
                        updatedAt = Instant.fromEpochMilliseconds(dbJob.updatedAt)
                    )
                }
            }
    }
}
