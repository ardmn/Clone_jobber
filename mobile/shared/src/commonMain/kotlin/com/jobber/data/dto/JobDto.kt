package com.jobber.data.dto

import com.jobber.domain.models.Job
import com.jobber.domain.models.JobPriority
import com.jobber.domain.models.JobStatus
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class JobDto(
    val id: String,
    val jobNumber: String,
    val clientId: String,
    val client: ClientDto? = null,
    val quoteId: String? = null,
    val title: String,
    val description: String,
    val status: String,
    val priority: String? = null,
    val scheduledAt: String? = null,
    val scheduledDuration: Int? = null,
    val startedAt: String? = null,
    val completedAt: String? = null,
    val assignedToId: String? = null,
    val assignedTo: UserDto? = null,
    val address: AddressDto? = null,
    val instructions: String? = null,
    val photos: List<JobPhotoDto>? = null,
    val createdAt: String,
    val updatedAt: String
)

fun JobDto.toDomain(): Job = Job(
    id = id,
    jobNumber = jobNumber,
    clientId = clientId,
    client = client?.toDomain(),
    quoteId = quoteId,
    title = title,
    description = description,
    status = JobStatus.valueOf(status.uppercase().replace(' ', '_')),
    priority = priority?.let { JobPriority.valueOf(it.uppercase()) } ?: JobPriority.MEDIUM,
    scheduledAt = scheduledAt?.let { Instant.parse(it) },
    scheduledDuration = scheduledDuration,
    startedAt = startedAt?.let { Instant.parse(it) },
    completedAt = completedAt?.let { Instant.parse(it) },
    assignedToId = assignedToId,
    assignedTo = assignedTo?.toDomain(),
    address = address?.toDomain(),
    instructions = instructions,
    photos = photos?.map { it.toDomain() } ?: emptyList(),
    createdAt = Instant.parse(createdAt),
    updatedAt = Instant.parse(updatedAt)
)
