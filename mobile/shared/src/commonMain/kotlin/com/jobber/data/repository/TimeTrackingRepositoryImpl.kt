package com.jobber.data.repository

import com.jobber.data.dto.toDomain
import com.jobber.db.JobberDatabase
import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Location
import com.jobber.domain.models.TimeEntry
import com.jobber.domain.repositories.TimeTrackingRepository
import com.jobber.network.ApiResponse
import com.jobber.network.ClockInRequest
import com.jobber.network.ClockOutRequest
import com.jobber.network.TimeTrackingApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Instant

class TimeTrackingRepositoryImpl(
    private val timeTrackingApi: TimeTrackingApi,
    private val database: JobberDatabase
) : TimeTrackingRepository {

    override suspend fun clockIn(jobId: String, location: Location?): ApiResult<TimeEntry> {
        return try {
            val request = ClockInRequest(
                jobId = jobId,
                latitude = location?.latitude,
                longitude = location?.longitude
            )
            when (val response = timeTrackingApi.clockIn(request)) {
                is ApiResponse.Success -> {
                    val entry = response.data.toDomain()
                    // Save to local database
                    database.timeEntryQueries.insertOrReplace(
                        id = entry.id,
                        jobId = entry.jobId,
                        userId = entry.userId,
                        startTime = entry.startTime.toEpochMilliseconds(),
                        endTime = entry.endTime?.toEpochMilliseconds(),
                        breakDurationMinutes = entry.breakDuration?.inWholeMinutes,
                        latitude = entry.location?.latitude,
                        longitude = entry.location?.longitude,
                        notes = entry.notes,
                        status = entry.status.name,
                        createdAt = entry.createdAt.toEpochMilliseconds(),
                        syncStatus = "synced"
                    )
                    ApiResult.Success(entry)
                }
                is ApiResponse.Error -> ApiResult.Error(response.message)
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Unknown error")
        }
    }

    override suspend fun clockOut(entryId: String, location: Location?): ApiResult<TimeEntry> {
        return try {
            val request = ClockOutRequest(
                latitude = location?.latitude,
                longitude = location?.longitude
            )
            when (val response = timeTrackingApi.clockOut(entryId, request)) {
                is ApiResponse.Success -> {
                    val entry = response.data.toDomain()
                    // Update in local database
                    database.timeEntryQueries.updateEndTime(
                        endTime = entry.endTime?.toEpochMilliseconds(),
                        latitude = entry.location?.latitude,
                        longitude = entry.location?.longitude,
                        id = entry.id
                    )
                    ApiResult.Success(entry)
                }
                is ApiResponse.Error -> ApiResult.Error(response.message)
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Unknown error")
        }
    }

    override suspend fun getActiveEntry(): ApiResult<TimeEntry?> {
        return try {
            when (val response = timeTrackingApi.getActiveEntry()) {
                is ApiResponse.Success -> ApiResult.Success(response.data?.toDomain())
                is ApiResponse.Error -> {
                    // Try to get from local database
                    val localEntry = database.timeEntryQueries.selectActive()
                        .executeAsOneOrNull()
                        ?.let { dbEntry ->
                            TimeEntry(
                                id = dbEntry.id,
                                jobId = dbEntry.jobId,
                                userId = dbEntry.userId,
                                startTime = Instant.fromEpochMilliseconds(dbEntry.startTime),
                                endTime = dbEntry.endTime?.let { Instant.fromEpochMilliseconds(it) },
                                breakDuration = dbEntry.breakDurationMinutes?.let { kotlin.time.Duration.parse("${it}m") },
                                location = if (dbEntry.latitude != null && dbEntry.longitude != null) {
                                    Location(dbEntry.latitude, dbEntry.longitude)
                                } else null,
                                notes = dbEntry.notes,
                                status = com.jobber.domain.models.TimeEntryStatus.valueOf(dbEntry.status),
                                createdAt = Instant.fromEpochMilliseconds(dbEntry.createdAt)
                            )
                        }
                    if (localEntry != null) {
                        ApiResult.Success(localEntry)
                    } else {
                        ApiResult.Error(response.message)
                    }
                }
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Unknown error")
        }
    }

    override suspend fun getEntries(jobId: String?): ApiResult<List<TimeEntry>> {
        return try {
            when (val response = timeTrackingApi.getEntries(jobId)) {
                is ApiResponse.Success -> {
                    val entries = response.data.map { it.toDomain() }
                    ApiResult.Success(entries)
                }
                is ApiResponse.Error -> ApiResult.Error(response.message)
            }
        } catch (e: Exception) {
            ApiResult.Error(e.message ?: "Unknown error")
        }
    }

    override fun observeActiveEntry(): Flow<TimeEntry?> {
        return database.timeEntryQueries.selectActive()
            .asFlow()
            .map { query ->
                query.executeAsOneOrNull()?.let { dbEntry ->
                    TimeEntry(
                        id = dbEntry.id,
                        jobId = dbEntry.jobId,
                        userId = dbEntry.userId,
                        startTime = Instant.fromEpochMilliseconds(dbEntry.startTime),
                        endTime = dbEntry.endTime?.let { Instant.fromEpochMilliseconds(it) },
                        breakDuration = dbEntry.breakDurationMinutes?.let { kotlin.time.Duration.parse("${it}m") },
                        location = if (dbEntry.latitude != null && dbEntry.longitude != null) {
                            Location(dbEntry.latitude, dbEntry.longitude)
                        } else null,
                        notes = dbEntry.notes,
                        status = com.jobber.domain.models.TimeEntryStatus.valueOf(dbEntry.status),
                        createdAt = Instant.fromEpochMilliseconds(dbEntry.createdAt)
                    )
                }
            }
    }
}
