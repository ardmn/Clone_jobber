package com.jobber.domain.models

data class Address(
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
) {
    val formatted: String
        get() = buildString {
            append(street1)
            if (street2 != null) {
                append(", ")
                append(street2)
            }
            append(", ")
            append(city)
            append(", ")
            append(state)
            append(" ")
            append(postalCode)
        }
}
