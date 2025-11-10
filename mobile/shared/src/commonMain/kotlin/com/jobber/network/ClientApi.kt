package com.jobber.network

import com.jobber.data.dto.ClientDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import kotlinx.serialization.Serializable

class ClientApi(private val httpClient: HttpClient) {
    suspend fun getClients(
        search: String? = null,
        page: Int = 1,
        limit: Int = 20
    ): ApiResponse<PaginatedResponse<ClientDto>> {
        return try {
            val response = httpClient.get("clients") {
                parameter("page", page)
                parameter("limit", limit)
                search?.let { parameter("search", it) }
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun getClientById(id: String): ApiResponse<ClientDto> {
        return try {
            val response = httpClient.get("clients/$id")
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun createClient(client: ClientDto): ApiResponse<ClientDto> {
        return try {
            val response = httpClient.post("clients") {
                setBody(client)
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun updateClient(id: String, client: ClientDto): ApiResponse<ClientDto> {
        return try {
            val response = httpClient.put("clients/$id") {
                setBody(client)
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun deleteClient(id: String): ApiResponse<Unit> {
        return try {
            httpClient.delete("clients/$id")
            ApiResponse.Success(Unit)
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }
}

@Serializable
data class PaginatedResponse<T>(
    val data: List<T>,
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int
)
