package com.jobber.domain.models

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate

data class Quote(
    val id: String,
    val quoteNumber: String,
    val clientId: String,
    val client: Client? = null,
    val title: String,
    val description: String,
    val status: QuoteStatus,
    val totalAmount: Double,
    val tax: Double = 0.0,
    val validUntil: LocalDate? = null,
    val lineItems: List<QuoteLineItem> = emptyList(),
    val createdAt: Instant,
    val updatedAt: Instant
) {
    val subtotal: Double
        get() = lineItems.sumOf { it.total }

    val grandTotal: Double
        get() = subtotal + tax
}

enum class QuoteStatus {
    DRAFT,
    SENT,
    VIEWED,
    APPROVED,
    DECLINED,
    EXPIRED,
    CONVERTED
}

data class QuoteLineItem(
    val id: String,
    val description: String,
    val quantity: Double,
    val unitPrice: Double,
    val total: Double
)
