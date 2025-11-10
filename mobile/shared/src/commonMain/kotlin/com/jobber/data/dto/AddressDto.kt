package com.jobber.data.dto

import com.jobber.domain.models.Address
import kotlinx.serialization.Serializable

@Serializable
data class AddressDto(
    val id: String,
    val clientId: String,
    val street1: String,
    val street2: String? = null,
    val city: String,
    val state: String,
    val postalCode: String,
    val country: String = "USA",
    val isPrimary: Boolean = false,
    val latitude: Double? = null,
    val longitude: Double? = null
)

fun AddressDto.toDomain(): Address = Address(
    id = id,
    clientId = clientId,
    street1 = street1,
    street2 = street2,
    city = city,
    state = state,
    postalCode = postalCode,
    country = country,
    isPrimary = isPrimary,
    latitude = latitude,
    longitude = longitude
)
