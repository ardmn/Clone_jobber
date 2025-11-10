package com.jobber.domain.usecases

import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Location
import com.jobber.domain.models.TimeEntry
import com.jobber.domain.repositories.TimeTrackingRepository

class ClockInUseCase(
    private val timeTrackingRepository: TimeTrackingRepository
) {
    suspend operator fun invoke(jobId: String, location: Location?): ApiResult<TimeEntry> {
        return timeTrackingRepository.clockIn(jobId, location)
    }
}
