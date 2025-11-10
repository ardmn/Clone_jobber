package com.jobber.domain.models

import kotlinx.datetime.Instant

data class Job(
    val id: String,
    val jobNumber: String,
    val clientId: String,
    val client: Client? = null,
    val quoteId: String? = null,
    val title: String,
    val description: String,
    val status: JobStatus,
    val priority: JobPriority = JobPriority.MEDIUM,
    val scheduledAt: Instant? = null,
    val scheduledDuration: Int? = null,
    val startedAt: Instant? = null,
    val completedAt: Instant? = null,
    val assignedToId: String? = null,
    val assignedTo: User? = null,
    val address: Address? = null,
    val instructions: String? = null,
    val photos: List<JobPhoto> = emptyList(),
    val createdAt: Instant,
    val updatedAt: Instant
) {
    val isScheduled: Boolean
        get() = status == JobStatus.SCHEDULED

    val canStart: Boolean
        get() = status == JobStatus.SCHEDULED

    val canComplete: Boolean
        get() = status == JobStatus.IN_PROGRESS
}

enum class JobStatus {
    SCHEDULED,
    EN_ROUTE,
    IN_PROGRESS,
    ON_HOLD,
    COMPLETED,
    CANCELLED
}

enum class JobPriority {
    LOW,
    MEDIUM,
    HIGH,
    URGENT
}
