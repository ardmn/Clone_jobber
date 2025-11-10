package com.jobber.android

import android.content.Context
import android.content.SharedPreferences
import com.jobber.network.AuthTokens
import com.jobber.network.RefreshTokenRequest
import com.jobber.network.RefreshTokenResponse
import com.jobber.network.TokenProvider
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.okhttp.OkHttp
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class AndroidTokenProvider(context: Context) : TokenProvider {
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "jobber_tokens",
        Context.MODE_PRIVATE
    )

    // Separate HTTP client for auth refresh (no auth interceptor)
    private val refreshClient = HttpClient(OkHttp) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
    }

    override suspend fun getTokens(): AuthTokens? {
        val accessToken = prefs.getString(KEY_ACCESS_TOKEN, null) ?: return null
        val refreshToken = prefs.getString(KEY_REFRESH_TOKEN, null) ?: return null
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
        prefs.edit()
            .putString(KEY_ACCESS_TOKEN, tokens.accessToken)
            .putString(KEY_REFRESH_TOKEN, tokens.refreshToken)
            .apply()
    }

    override suspend fun clearTokens() {
        prefs.edit()
            .remove(KEY_ACCESS_TOKEN)
            .remove(KEY_REFRESH_TOKEN)
            .apply()
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
    }
}
