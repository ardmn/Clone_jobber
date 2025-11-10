package com.jobber.data.dto

import com.jobber.domain.models.Client
import com.jobber.domain.models.ClientStatus
import kotlinx.datetime.Instant
import kotlinx.serialization.Serializable

@Serializable
data class ClientDto(
    val id: String,
    val firstName: String,
    val lastName: String,
    val companyName: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val status: String,
    val tags: List<String>? = null,
    val addresses: List<AddressDto>? = null,
    val createdAt: String,
    val updatedAt: String
)

fun ClientDto.toDomain(): Client = Client(
    id = id,
    firstName = firstName,
    lastName = lastName,
    companyName = companyName,
    email = email,
    phone = phone,
    status = ClientStatus.valueOf(status.uppercase()),
    tags = tags ?: emptyList(),
    addresses = addresses?.map { it.toDomain() } ?: emptyList(),
    createdAt = Instant.parse(createdAt),
    updatedAt = Instant.parse(updatedAt)
)
