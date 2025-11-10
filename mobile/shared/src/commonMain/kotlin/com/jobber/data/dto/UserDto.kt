package com.jobber.data.dto

import com.jobber.domain.models.User
import com.jobber.domain.models.UserRole
import com.jobber.domain.models.UserStatus
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class UserDto(
    val id: String,
    val accountId: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val phone: String? = null,
    val role: String,
    val status: String,
    val createdAt: String
)

fun UserDto.toDomain(): User = User(
    id = id,
    accountId = accountId,
    email = email,
    firstName = firstName,
    lastName = lastName,
    phone = phone,
    role = UserRole.valueOf(role.uppercase()),
    status = UserStatus.valueOf(status.uppercase()),
    createdAt = Instant.parse(createdAt)
)
