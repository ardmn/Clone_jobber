package com.jobber.ui.components

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jobber.ui.theme.JobberColors

@Composable
fun StatusChip(
    status: String,
    modifier: Modifier = Modifier
) {
    val (color, backgroundColor) = getStatusColors(status)

    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = backgroundColor
    ) {
        Text(
            text = formatStatusText(status),
            color = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

private fun getStatusColors(status: String): Pair<Color, Color> {
    return when (status.uppercase()) {
        "SCHEDULED" -> JobberColors.Primary to JobberColors.Primary.copy(alpha = 0.1f)
        "EN_ROUTE" -> JobberColors.Warning to JobberColors.WarningLight
        "IN_PROGRESS" -> JobberColors.Error to JobberColors.ErrorLight
        "COMPLETED" -> JobberColors.Success to JobberColors.SuccessLight
        "CANCELLED" -> JobberColors.Gray500 to JobberColors.Gray100
        "ON_HOLD" -> JobberColors.Warning to JobberColors.WarningLight
        else -> JobberColors.Gray500 to JobberColors.Gray100
    }
}

private fun formatStatusText(status: String): String {
    return when (status.uppercase()) {
        "SCHEDULED" -> "Scheduled"
        "EN_ROUTE" -> "En Route"
        "IN_PROGRESS" -> "In Progress"
        "COMPLETED" -> "Completed"
        "CANCELLED" -> "Cancelled"
        "ON_HOLD" -> "On Hold"
        else -> status
    }
}
