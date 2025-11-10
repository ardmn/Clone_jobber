package com.jobber.domain.models

import kotlinx.datetime.Instant

data class Client(
    val id: String,
    val firstName: String,
    val lastName: String,
    val companyName: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val status: ClientStatus = ClientStatus.ACTIVE,
    val tags: List<String> = emptyList(),
    val addresses: List<Address> = emptyList(),
    val createdAt: Instant,
    val updatedAt: Instant
) {
    val fullName: String
        get() = "$firstName $lastName"
}

enum class ClientStatus {
    ACTIVE,
    INACTIVE
}
