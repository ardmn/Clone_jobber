package com.jobber.data.dto

import com.jobber.domain.models.Location
import com.jobber.domain.models.TimeEntry
import com.jobber.domain.models.TimeEntryStatus
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class TimeEntryDto(
    val id: String,
    val jobId: String,
    val userId: String,
    val user: UserDto? = null,
    val startTime: String,
    val endTime: String? = null,
    val breakDurationMinutes: Int? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val notes: String? = null,
    val status: String,
    val createdAt: String
)

fun TimeEntryDto.toDomain(): TimeEntry = TimeEntry(
    id = id,
    jobId = jobId,
    userId = userId,
    user = user?.toDomain(),
    startTime = Instant.parse(startTime),
    endTime = endTime?.let { Instant.parse(it) },
    breakDuration = breakDurationMinutes?.let { kotlin.time.Duration.parse("${it}m") },
    location = if (latitude != null && longitude != null) Location(latitude, longitude) else null,
    notes = notes,
    status = TimeEntryStatus.valueOf(status.uppercase()),
    createdAt = Instant.parse(createdAt)
)
