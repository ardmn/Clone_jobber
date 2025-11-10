package com.jobber.domain.usecases

import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Job
import com.jobber.domain.repositories.JobRepository
import kotlinx.datetime.LocalDate

class GetScheduleUseCase(
    private val jobRepository: JobRepository
) {
    suspend operator fun invoke(date: LocalDate): ApiResult<List<Job>> {
        return jobRepository.getJobs(date)
    }
}
