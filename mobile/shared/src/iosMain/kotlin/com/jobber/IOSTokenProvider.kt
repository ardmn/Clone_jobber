package com.jobber

import com.jobber.network.AuthTokens
import com.jobber.network.TokenProvider
import platform.Foundation.NSUserDefaults

class IOSTokenProvider : TokenProvider {
    private val userDefaults = NSUserDefaults.standardUserDefaults

    override suspend fun getTokens(): AuthTokens? {
        val accessToken = userDefaults.stringForKey(KEY_ACCESS_TOKEN) ?: return null
        val refreshToken = userDefaults.stringForKey(KEY_REFRESH_TOKEN) ?: return null
        return AuthTokens(accessToken, refreshToken)
    }

    override suspend fun refreshToken(refreshToken: String): AuthTokens? {
        // TODO: Implement token refresh API call
        return null
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
