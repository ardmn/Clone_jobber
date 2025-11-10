package com.jobber.network

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import kotlinx.serialization.Serializable

class AuthApi(private val httpClient: HttpClient) {
    suspend fun refreshToken(refreshToken: String): ApiResponse<RefreshTokenResponse> {
        return try {
            val response = httpClient.post("auth/refresh") {
                setBody(RefreshTokenRequest(refreshToken))
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }
}

@Serializable
data class RefreshTokenRequest(
    val refreshToken: String
)

@Serializable
data class RefreshTokenResponse(
    val accessToken: String,
    val refreshToken: String
)
