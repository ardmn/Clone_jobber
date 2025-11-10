package com.jobber.ui.timetracking

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.arkivanov.decompose.ComponentContext
import com.jobber.domain.model.TimeEntry
import com.jobber.store.TimeTrackingStore
import com.arkivanov.mvikotlin.extensions.coroutines.states
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlin.time.Duration.Companion.milliseconds

@Composable
fun TimeTrackingScreen(
    component: TimeTrackingComponent,
    store: TimeTrackingStore,
    modifier: Modifier = Modifier
) {
    val state by store.states.map { it }.collectAsState(initial = TimeTrackingStore.State())

    LaunchedEffect(Unit) {
        store.accept(TimeTrackingStore.Intent.LoadActiveEntry)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Time Tracking") }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // Clock In/Out Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    if (state.activeEntry != null) {
                        // Currently clocked in
                        Text(
                            text = "Clocked In",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        // Elapsed time display
                        val elapsedTime = remember(state.activeEntry) {
                            derivedStateOf {
                                val now = Clock.System.now()
                                val start = state.activeEntry!!.clockIn
                                val diff = now - start
                                val hours = diff.inWholeHours
                                val minutes = (diff.inWholeMinutes % 60)
                                "%02d:%02d".format(hours, minutes)
                            }
                        }

                        Text(
                            text = elapsedTime.value,
                            style = MaterialTheme.typography.displayMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "Started at ${formatTime(state.activeEntry!!.clockIn)}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        if (state.activeEntry?.job != null) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "Job: ${state.activeEntry!!.job!!.title}",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = { store.accept(TimeTrackingStore.Intent.ClockOut) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.error
                            )
                        ) {
                            Text("Clock Out")
                        }
                    } else {
                        // Not clocked in
                        Text(
                            text = "Not Clocked In",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "Ready to start your shift?",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Spacer(modifier = Modifier.height(24.dp))

                        Button(
                            onClick = { store.accept(TimeTrackingStore.Intent.ClockIn(jobId = null)) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        ) {
                            Text("Clock In")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Today's Summary
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Today's Summary",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    val todayTotal = state.todayEntries.sumOf { it.totalMinutes ?: 0 }
                    val hours = todayTotal / 60
                    val minutes = todayTotal % 60

                    Text(
                        text = "${hours}h ${minutes}m",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    Text(
                        text = "${state.todayEntries.size} ${if (state.todayEntries.size == 1) "entry" else "entries"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Recent Time Entries
            Text(
                text = "Recent Entries",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            if (state.recentEntries.isEmpty()) {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No recent time entries",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(state.recentEntries) { entry ->
                        TimeEntryCard(entry = entry)
                    }
                }
            }
        }
    }
}

@Composable
fun TimeEntryCard(entry: TimeEntry) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = formatDate(entry.clockIn),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "${formatTime(entry.clockIn)} - ${entry.clockOut?.let { formatTime(it) } ?: "In Progress"}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                if (entry.job != null) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = entry.job!!.title,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                val hours = (entry.totalMinutes ?: 0) / 60
                val minutes = (entry.totalMinutes ?: 0) % 60

                Text(
                    text = "${hours}h ${minutes}m",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(4.dp))

                Surface(
                    shape = MaterialTheme.shapes.small,
                    color = when (entry.status) {
                        com.jobber.domain.model.TimeEntryStatus.APPROVED -> MaterialTheme.colorScheme.primaryContainer
                        com.jobber.domain.model.TimeEntryStatus.REJECTED -> MaterialTheme.colorScheme.errorContainer
                        else -> MaterialTheme.colorScheme.surfaceVariant
                    }
                ) {
                    Text(
                        text = entry.status.name,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}

fun formatTime(instant: Instant): String {
    // Format as HH:MM AM/PM
    // This is a simplified version - in production use kotlinx-datetime formatting
    val epochMillis = instant.toEpochMilliseconds()
    val hours = ((epochMillis / 3600000) % 24).toInt()
    val minutes = ((epochMillis / 60000) % 60).toInt()
    val amPm = if (hours >= 12) "PM" else "AM"
    val displayHours = if (hours % 12 == 0) 12 else hours % 12
    return "%02d:%02d %s".format(displayHours, minutes, amPm)
}

fun formatDate(instant: Instant): String {
    // Format as MMM DD, YYYY
    // This is a simplified version - in production use kotlinx-datetime formatting
    return "Today" // Simplified for now
}

// Component interface
interface TimeTrackingComponent {
    fun onBack()
}

class DefaultTimeTrackingComponent(
    componentContext: ComponentContext
) : TimeTrackingComponent, ComponentContext by componentContext {
    override fun onBack() {
        // Navigation back
    }
}
