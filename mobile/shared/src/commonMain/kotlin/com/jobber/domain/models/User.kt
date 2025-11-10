package com.jobber.domain.models

import kotlinx.datetime.Instant

data class User(
    val id: String,
    val accountId: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phone: String? = null,
    val role: UserRole,
    val status: UserStatus = UserStatus.ACTIVE,
    val createdAt: Instant
) {
    val fullName: String
        get() = "$firstName $lastName"
}

enum class UserRole {
    ADMIN,
    MANAGER,
    DISPATCHER,
    WORKER
}

enum class UserStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED
}
