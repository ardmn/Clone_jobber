package com.jobber.domain.models

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate

data class Invoice(
    val id: String,
    val invoiceNumber: String,
    val clientId: String,
    val client: Client? = null,
    val jobId: String? = null,
    val status: InvoiceStatus,
    val dueDate: LocalDate,
    val totalAmount: Double,
    val tax: Double = 0.0,
    val amountPaid: Double = 0.0,
    val lineItems: List<InvoiceLineItem> = emptyList(),
    val createdAt: Instant,
    val updatedAt: Instant
) {
    val subtotal: Double
        get() = lineItems.sumOf { it.total }

    val grandTotal: Double
        get() = subtotal + tax

    val balance: Double
        get() = grandTotal - amountPaid

    val isPaid: Boolean
        get() = balance <= 0.0
}

enum class InvoiceStatus {
    DRAFT,
    SENT,
    VIEWED,
    PARTIAL,
    PAID,
    OVERDUE,
    VOID
}

data class InvoiceLineItem(
    val id: String,
    val description: String,
    val quantity: Double,
    val unitPrice: Double,
    val total: Double
)
