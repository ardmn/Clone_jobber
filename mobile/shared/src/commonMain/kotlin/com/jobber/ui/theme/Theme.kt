package com.jobber.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Color palette matching UI/UX requirements
object JobberColors {
    val Primary = Color(0xFF2563EB)
    val PrimaryDark = Color(0xFF1E40AF)
    val PrimaryLight = Color(0xFF3B82F6)

    val Success = Color(0xFF10B981)
    val SuccessLight = Color(0xFFD1FAE5)

    val Warning = Color(0xFFF59E0B)
    val WarningLight = Color(0xFFFEF3C7)

    val Error = Color(0xFFEF4444)
    val ErrorLight = Color(0xFFFEE2E2)

    val Gray900 = Color(0xFF1F2937)
    val Gray700 = Color(0xFF374151)
    val Gray600 = Color(0xFF4B5563)
    val Gray500 = Color(0xFF6B7280)
    val Gray400 = Color(0xFF9CA3AF)
    val Gray300 = Color(0xFFD1D5DB)
    val Gray200 = Color(0xFFE5E7EB)
    val Gray100 = Color(0xFFF3F4F6)
    val Gray50 = Color(0xFFF9FAFB)

    val Background = Color(0xFFFFFFFF)
    val Surface = Color(0xFFFFFFFF)
}

private val LightColorScheme = lightColorScheme(
    primary = JobberColors.Primary,
    onPrimary = Color.White,
    secondary = JobberColors.Success,
    onSecondary = Color.White,
    error = JobberColors.Error,
    onError = Color.White,
    background = JobberColors.Background,
    onBackground = JobberColors.Gray900,
    surface = JobberColors.Surface,
    onSurface = JobberColors.Gray900
)

@Composable
fun JobberTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
