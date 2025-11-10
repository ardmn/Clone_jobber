package com.jobber.domain.models

import kotlinx.datetime.Instant

data class JobPhoto(
    val id: String,
    val jobId: String,
    val url: String,
    val thumbnailUrl: String? = null,
    val caption: String? = null,
    val type: PhotoType = PhotoType.BEFORE,
    val uploadedAt: Instant
)

enum class PhotoType {
    BEFORE,
    DURING,
    AFTER
}
