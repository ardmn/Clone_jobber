package com.jobber.domain.repositories

import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Location
import com.jobber.domain.models.TimeEntry
import kotlinx.coroutines.flow.Flow

interface TimeTrackingRepository {
    suspend fun clockIn(jobId: String, location: Location?): ApiResult<TimeEntry>
    suspend fun clockOut(entryId: String, location: Location?): ApiResult<TimeEntry>
    suspend fun getActiveEntry(): ApiResult<TimeEntry?>
    suspend fun getEntries(jobId: String? = null): ApiResult<List<TimeEntry>>
    fun observeActiveEntry(): Flow<TimeEntry?>
}
