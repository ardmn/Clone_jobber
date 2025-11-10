package com.jobber.domain.repositories

import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Invoice
import kotlinx.coroutines.flow.Flow

interface InvoiceRepository {
    suspend fun getInvoices(clientId: String? = null, page: Int = 1, limit: Int = 20): ApiResult<List<Invoice>>
    suspend fun getInvoiceById(id: String): ApiResult<Invoice>
    suspend fun createInvoice(invoice: Invoice): ApiResult<Invoice>
    suspend fun updateInvoice(id: String, invoice: Invoice): ApiResult<Invoice>
    suspend fun sendInvoice(id: String): ApiResult<Unit>
    suspend fun recordPayment(invoiceId: String, amount: Double, method: String): ApiResult<Unit>
    fun observeInvoices(): Flow<List<Invoice>>
    fun observeInvoice(id: String): Flow<Invoice?>
}
