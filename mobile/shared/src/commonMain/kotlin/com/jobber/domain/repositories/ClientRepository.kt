package com.jobber.domain.repositories

import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Client
import kotlinx.coroutines.flow.Flow

interface ClientRepository {
    suspend fun getClients(search: String? = null, page: Int = 1, limit: Int = 20): ApiResult<List<Client>>
    suspend fun getClientById(id: String): ApiResult<Client>
    suspend fun createClient(client: Client): ApiResult<Client>
    suspend fun updateClient(id: String, client: Client): ApiResult<Client>
    suspend fun deleteClient(id: String): ApiResult<Unit>
    fun observeClients(): Flow<List<Client>>
    fun observeClient(id: String): Flow<Client?>
}
