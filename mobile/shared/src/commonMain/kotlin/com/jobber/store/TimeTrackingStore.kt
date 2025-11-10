package com.jobber.store

import com.arkivanov.mvikotlin.core.store.Reducer
import com.arkivanov.mvikotlin.core.store.Store
import com.arkivanov.mvikotlin.core.store.StoreFactory
import com.arkivanov.mvikotlin.extensions.coroutines.CoroutineExecutor
import com.jobber.domain.model.TimeEntry
import com.jobber.domain.repository.TimeTrackingRepository
import com.jobber.domain.usecase.ClockInUseCase
import com.jobber.domain.usecase.ClockOutUseCase
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.todayIn

interface TimeTrackingStore : Store<TimeTrackingStore.Intent, TimeTrackingStore.State, TimeTrackingStore.Label> {

    sealed interface Intent {
        data object LoadActiveEntry : Intent
        data class ClockIn(val jobId: String?) : Intent
        data object ClockOut : Intent
    }

    data class State(
        val activeEntry: TimeEntry? = null,
        val todayEntries: List<TimeEntry> = emptyList(),
        val recentEntries: List<TimeEntry> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null
    )

    sealed interface Label {
        data class ShowMessage(val message: String) : Label
    }
}

class TimeTrackingStoreFactory(
    private val storeFactory: StoreFactory,
    private val timeTrackingRepository: TimeTrackingRepository,
    private val clockInUseCase: ClockInUseCase,
    private val clockOutUseCase: ClockOutUseCase
) {
    fun create(): TimeTrackingStore = object : TimeTrackingStore,
        Store<TimeTrackingStore.Intent, TimeTrackingStore.State, TimeTrackingStore.Label>
        by storeFactory.create(
            name = "TimeTrackingStore",
            initialState = TimeTrackingStore.State(),
            executorFactory = ::ExecutorImpl,
            reducer = ReducerImpl
        ) {}

    private sealed interface Msg {
        data class ActiveEntryLoaded(val entry: TimeEntry?) : Msg
        data class TodayEntriesLoaded(val entries: List<TimeEntry>) : Msg
        data class RecentEntriesLoaded(val entries: List<TimeEntry>) : Msg
        data class Loading(val isLoading: Boolean) : Msg
        data class Error(val message: String) : Msg
        data object ClearError : Msg
    }

    private inner class ExecutorImpl :
        CoroutineExecutor<TimeTrackingStore.Intent, Nothing, TimeTrackingStore.State, Msg, TimeTrackingStore.Label>() {

        override fun executeIntent(intent: TimeTrackingStore.Intent, getState: () -> TimeTrackingStore.State) {
            when (intent) {
                is TimeTrackingStore.Intent.LoadActiveEntry -> loadActiveEntry()
                is TimeTrackingStore.Intent.ClockIn -> clockIn(intent.jobId)
                is TimeTrackingStore.Intent.ClockOut -> clockOut()
            }
        }

        private fun loadActiveEntry() {
            dispatch(Msg.Loading(true))
            scope.launch {
                try {
                    // Load active entry
                    timeTrackingRepository.getActiveEntry().collect { entry ->
                        dispatch(Msg.ActiveEntryLoaded(entry))
                    }

                    // Load today's entries
                    val today = Clock.System.todayIn(TimeZone.currentSystemDefault())
                    val todayResult = timeTrackingRepository.getEntriesByDate(today)
                    if (todayResult.isSuccess) {
                        dispatch(Msg.TodayEntriesLoaded(todayResult.getOrNull() ?: emptyList()))
                    }

                    // Load recent entries (last 7 days)
                    val recentResult = timeTrackingRepository.getRecentEntries(limit = 20)
                    if (recentResult.isSuccess) {
                        dispatch(Msg.RecentEntriesLoaded(recentResult.getOrNull() ?: emptyList()))
                    }

                    dispatch(Msg.Loading(false))
                } catch (e: Exception) {
                    dispatch(Msg.Error(e.message ?: "Failed to load time entries"))
                    dispatch(Msg.Loading(false))
                }
            }
        }

        private fun clockIn(jobId: String?) {
            dispatch(Msg.Loading(true))
            scope.launch {
                when (val result = clockInUseCase(jobId = jobId, location = null)) {
                    is com.jobber.domain.model.ApiResult.Success -> {
                        dispatch(Msg.ActiveEntryLoaded(result.data))
                        publish(TimeTrackingStore.Label.ShowMessage("Clocked in successfully"))
                        loadActiveEntry() // Reload data
                    }
                    is com.jobber.domain.model.ApiResult.Error -> {
                        dispatch(Msg.Error(result.message))
                        publish(TimeTrackingStore.Label.ShowMessage("Failed to clock in"))
                    }
                }
                dispatch(Msg.Loading(false))
            }
        }

        private fun clockOut() {
            val activeEntry = state().activeEntry
            if (activeEntry == null) {
                publish(TimeTrackingStore.Label.ShowMessage("No active time entry"))
                return
            }

            dispatch(Msg.Loading(true))
            scope.launch {
                when (val result = clockOutUseCase(entryId = activeEntry.id, location = null)) {
                    is com.jobber.domain.model.ApiResult.Success -> {
                        dispatch(Msg.ActiveEntryLoaded(null))
                        publish(TimeTrackingStore.Label.ShowMessage("Clocked out successfully"))
                        loadActiveEntry() // Reload data
                    }
                    is com.jobber.domain.model.ApiResult.Error -> {
                        dispatch(Msg.Error(result.message))
                        publish(TimeTrackingStore.Label.ShowMessage("Failed to clock out"))
                    }
                }
                dispatch(Msg.Loading(false))
            }
        }
    }

    private object ReducerImpl : Reducer<TimeTrackingStore.State, Msg> {
        override fun TimeTrackingStore.State.reduce(msg: Msg): TimeTrackingStore.State =
            when (msg) {
                is Msg.ActiveEntryLoaded -> copy(activeEntry = msg.entry, error = null)
                is Msg.TodayEntriesLoaded -> copy(todayEntries = msg.entries)
                is Msg.RecentEntriesLoaded -> copy(recentEntries = msg.entries)
                is Msg.Loading -> copy(isLoading = msg.isLoading)
                is Msg.Error -> copy(error = msg.message, isLoading = false)
                is Msg.ClearError -> copy(error = null)
            }
    }
}
