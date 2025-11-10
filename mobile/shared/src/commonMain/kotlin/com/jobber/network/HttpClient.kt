package com.jobber.network

import io.ktor.client.HttpClient
import io.ktor.client.plugins.auth.Auth
import io.ktor.client.plugins.auth.providers.BearerTokens
import io.ktor.client.plugins.auth.providers.bearer
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.plugins.logging.SIMPLE
import io.ktor.client.request.header
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.URLProtocol
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

object HttpClientFactory {
    private const val BASE_URL = "localhost"
    private const val PORT = 8080
    private const val API_PATH = "/api"

    fun create(tokenProvider: TokenProvider): HttpClient {
        return HttpClient {
            install(ContentNegotiation) {
                json(Json {
                    ignoreUnknownKeys = true
                    isLenient = true
                    encodeDefaults = true
                    prettyPrint = true
                })
            }

            install(Logging) {
                logger = Logger.SIMPLE
                level = LogLevel.ALL
            }

            install(Auth) {
                bearer {
                    loadTokens {
                        val tokens = tokenProvider.getTokens()
                        tokens?.let {
                            BearerTokens(
                                accessToken = it.accessToken,
                                refreshToken = it.refreshToken
                            )
                        }
                    }

                    refreshTokens {
                        val refreshToken = tokenProvider.getTokens()?.refreshToken
                        if (refreshToken != null) {
                            val newTokens = tokenProvider.refreshToken(refreshToken)
                            newTokens?.let {
                                BearerTokens(
                                    accessToken = it.accessToken,
                                    refreshToken = it.refreshToken
                                )
                            }
                        } else {
                            null
                        }
                    }
                }
            }

            defaultRequest {
                url {
                    protocol = URLProtocol.HTTP
                    host = BASE_URL
                    port = PORT
                    path(API_PATH)
                }
                header(HttpHeaders.ContentType, ContentType.Application.Json)
            }
        }
    }
}

interface TokenProvider {
    suspend fun getTokens(): AuthTokens?
    suspend fun refreshToken(refreshToken: String): AuthTokens?
    suspend fun saveTokens(tokens: AuthTokens)
    suspend fun clearTokens()
}

data class AuthTokens(
    val accessToken: String,
    val refreshToken: String
)
