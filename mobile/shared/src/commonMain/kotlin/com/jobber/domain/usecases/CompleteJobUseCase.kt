package com.jobber.domain.usecases

import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Job
import com.jobber.domain.repositories.JobRepository

class CompleteJobUseCase(
    private val jobRepository: JobRepository
) {
    suspend operator fun invoke(
        jobId: String,
        signature: ByteArray?,
        photos: List<ByteArray>
    ): ApiResult<Job> {
        return jobRepository.completeJob(jobId, signature, photos)
    }
}
