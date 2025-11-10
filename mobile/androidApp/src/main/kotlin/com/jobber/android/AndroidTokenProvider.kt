package com.jobber.android

import android.content.Context
import android.content.SharedPreferences
import com.jobber.network.AuthTokens
import com.jobber.network.TokenProvider

class AndroidTokenProvider(context: Context) : TokenProvider {
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "jobber_tokens",
        Context.MODE_PRIVATE
    )

    override suspend fun getTokens(): AuthTokens? {
        val accessToken = prefs.getString(KEY_ACCESS_TOKEN, null) ?: return null
        val refreshToken = prefs.getString(KEY_REFRESH_TOKEN, null) ?: return null
        return AuthTokens(accessToken, refreshToken)
    }

    override suspend fun refreshToken(refreshToken: String): AuthTokens? {
        // TODO: Implement token refresh API call
        return null
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
