package com.jobber.domain.repositories

import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Quote
import kotlinx.coroutines.flow.Flow

interface QuoteRepository {
    suspend fun getQuotes(clientId: String? = null, page: Int = 1, limit: Int = 20): ApiResult<List<Quote>>
    suspend fun getQuoteById(id: String): ApiResult<Quote>
    suspend fun createQuote(quote: Quote): ApiResult<Quote>
    suspend fun updateQuote(id: String, quote: Quote): ApiResult<Quote>
    suspend fun sendQuote(id: String): ApiResult<Unit>
    suspend fun approveQuote(id: String): ApiResult<Unit>
    suspend fun convertToJob(id: String): ApiResult<String>
    fun observeQuotes(): Flow<List<Quote>>
}
