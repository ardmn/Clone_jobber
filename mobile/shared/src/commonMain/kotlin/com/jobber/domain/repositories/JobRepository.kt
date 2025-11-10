package com.jobber.domain.repositories

import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Job
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.LocalDate

interface JobRepository {
    suspend fun getJobs(date: LocalDate): ApiResult<List<Job>>
    suspend fun getJobById(id: String): ApiResult<Job>
    suspend fun updateJobStatus(id: String, status: String): ApiResult<Job>
    suspend fun startJob(id: String): ApiResult<Job>
    suspend fun completeJob(id: String, signature: ByteArray?, photos: List<ByteArray>): ApiResult<Job>
    suspend fun addPhoto(jobId: String, photo: ByteArray, caption: String?, type: String): ApiResult<Unit>
    fun observeJobs(date: LocalDate): Flow<List<Job>>
    fun observeJob(id: String): Flow<Job?>
}
