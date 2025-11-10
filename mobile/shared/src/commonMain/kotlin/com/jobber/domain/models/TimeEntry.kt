package com.jobber.domain.models

import kotlinx.datetime.Instant
import kotlin.time.Duration

data class TimeEntry(
    val id: String,
    val jobId: String,
    val userId: String,
    val user: User? = null,
    val startTime: Instant,
    val endTime: Instant? = null,
    val breakDuration: Duration? = null,
    val location: Location? = null,
    val notes: String? = null,
    val status: TimeEntryStatus = TimeEntryStatus.APPROVED,
    val createdAt: Instant
) {
    val duration: Duration?
        get() = endTime?.let { end ->
            val total = end - startTime
            breakDuration?.let { total - it } ?: total
        }

    val isActive: Boolean
        get() = endTime == null
}

enum class TimeEntryStatus {
    PENDING,
    APPROVED,
    REJECTED
}

data class Location(
    val latitude: Double,
    val longitude: Double
)
