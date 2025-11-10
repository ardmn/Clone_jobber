package com.jobber.data.dto

import com.jobber.domain.models.JobPhoto
import com.jobber.domain.models.PhotoType
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class JobPhotoDto(
    val id: String,
    val jobId: String,
    val url: String,
    val thumbnailUrl: String? = null,
    val caption: String? = null,
    val type: String = "before",
    val uploadedAt: String
)

fun JobPhotoDto.toDomain(): JobPhoto = JobPhoto(
    id = id,
    jobId = jobId,
    url = url,
    thumbnailUrl = thumbnailUrl,
    caption = caption,
    type = PhotoType.valueOf(type.uppercase()),
    uploadedAt = Instant.parse(uploadedAt)
)
