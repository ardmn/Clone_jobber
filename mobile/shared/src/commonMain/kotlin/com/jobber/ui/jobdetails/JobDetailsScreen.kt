package com.jobber.ui.jobdetails

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.arkivanov.mvikotlin.extensions.coroutines.states
import com.jobber.domain.models.Job
import com.jobber.navigation.JobDetailsComponent
import com.jobber.store.JobDetailsStore
import com.jobber.ui.components.StatusChip
import com.jobber.ui.theme.JobberColors
import kotlinx.coroutines.flow.map

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JobDetailsScreen(
    component: JobDetailsComponent,
    store: JobDetailsStore,
    modifier: Modifier = Modifier
) {
    val state by store.states.map { it }.collectAsState(initial = JobDetailsStore.State())

    LaunchedEffect(Unit) {
        store.accept(JobDetailsStore.Intent.LoadJob)
    }

    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text("Job Details") },
                navigationIcon = {
                    IconButton(onClick = { component.onBack() }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = Color.White,
                    navigationIconContentColor = Color.White
                )
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when {
                state.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                state.error != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = "Error: ${state.error}",
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
                state.job != null -> {
                    JobDetailsContent(
                        job = state.job!!,
                        onStartJob = { store.accept(JobDetailsStore.Intent.StartJob) },
                        onCompleteJob = { store.accept(JobDetailsStore.Intent.CompleteJob) }
                    )
                }
            }
        }
    }
}

@Composable
private fun JobDetailsContent(
    job: Job,
    onStartJob: () -> Unit,
    onCompleteJob: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Job Info Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = JobberColors.Surface
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = job.jobNumber,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = JobberColors.Gray900
                    )
                    StatusChip(status = job.status.name)
                }

                Spacer(modifier = Modifier.height(16.dp))

                InfoRow(label = "Client", value = job.client?.fullName ?: "No client")
                InfoRow(label = "Address", value = job.address?.formatted ?: "No address")
                InfoRow(label = "Scheduled", value = job.scheduledAt?.toString() ?: "Not scheduled")
                InfoRow(label = "Duration", value = job.scheduledDuration?.let { "$it minutes" } ?: "N/A")
                if (job.assignedTo != null) {
                    InfoRow(label = "Assigned To", value = job.assignedTo!!.fullName)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Description Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = JobberColors.Surface
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Description",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = JobberColors.Gray900
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = job.description,
                    fontSize = 14.sp,
                    color = JobberColors.Gray600
                )
                if (job.instructions != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Instructions",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = JobberColors.Gray900
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = job.instructions!!,
                        fontSize = 14.sp,
                        color = JobberColors.Gray600
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Action Buttons
        if (job.canStart) {
            Button(
                onClick = onStartJob,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Start Job")
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        if (job.canComplete) {
            Button(
                onClick = onCompleteJob,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Complete Job")
            }
        }
    }
}

@Composable
private fun InfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 14.sp,
            color = JobberColors.Gray600
        )
        Text(
            text = value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = JobberColors.Gray900
        )
    }
}
