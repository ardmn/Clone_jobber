package com.jobber.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.jobber.domain.models.Job
import com.jobber.ui.theme.JobberColors

@Composable
fun JobCard(
    job: Job,
    onClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick(job.id) },
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = JobberColors.Surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = job.title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = JobberColors.Gray900
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = job.client?.fullName ?: "No client",
                fontSize = 14.sp,
                color = JobberColors.Gray600
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = formatJobTime(job),
                    fontSize = 12.sp,
                    color = JobberColors.Gray500
                )

                StatusChip(status = job.status.name)
            }
        }
    }
}

private fun formatJobTime(job: Job): String {
    return job.scheduledAt?.toString() ?: "Not scheduled"
}
