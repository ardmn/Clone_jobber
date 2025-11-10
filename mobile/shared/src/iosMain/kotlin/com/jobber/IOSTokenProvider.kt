package com.jobber

import com.jobber.network.AuthTokens
import com.jobber.network.RefreshTokenRequest
import com.jobber.network.RefreshTokenResponse
import com.jobber.network.TokenProvider
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.darwin.Darwin
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import platform.Foundation.NSUserDefaults

class IOSTokenProvider : TokenProvider {
    private val userDefaults = NSUserDefaults.standardUserDefaults

    // Separate HTTP client for auth refresh (no auth interceptor)
    private val refreshClient = HttpClient(Darwin) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
    }

    override suspend fun getTokens(): AuthTokens? {
        val accessToken = userDefaults.stringForKey(KEY_ACCESS_TOKEN) ?: return null
        val refreshToken = userDefaults.stringForKey(KEY_REFRESH_TOKEN) ?: return null
        return AuthTokens(accessToken, refreshToken)
    }

    override suspend fun refreshToken(refreshToken: String): AuthTokens? {
        return try {
            val response = refreshClient.post("http://localhost:8080/api/auth/refresh") {
                contentType(ContentType.Application.Json)
                setBody(RefreshTokenRequest(refreshToken))
            }
            val refreshResponse: RefreshTokenResponse = response.body()
            val newTokens = AuthTokens(refreshResponse.accessToken, refreshResponse.refreshToken)
            saveTokens(newTokens)
            newTokens
        } catch (e: Exception) {
            // Clear invalid tokens
            clearTokens()
            null
        }
    }

    override suspend fun saveTokens(tokens: AuthTokens) {
        userDefaults.setObject(tokens.accessToken, KEY_ACCESS_TOKEN)
        userDefaults.setObject(tokens.refreshToken, KEY_REFRESH_TOKEN)
    }

    override suspend fun clearTokens() {
        userDefaults.removeObjectForKey(KEY_ACCESS_TOKEN)
        userDefaults.removeObjectForKey(KEY_REFRESH_TOKEN)
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
    }
}
