package com.jobber.store

import com.arkivanov.mvikotlin.core.store.Reducer
import com.arkivanov.mvikotlin.core.store.Store
import com.arkivanov.mvikotlin.core.store.StoreFactory
import com.arkivanov.mvikotlin.extensions.coroutines.CoroutineExecutor
import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Job
import com.jobber.domain.usecases.CompleteJobUseCase
import com.jobber.domain.usecases.GetScheduleUseCase
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

interface JobListStore : Store<JobListStore.Intent, JobListStore.State, JobListStore.Label> {

    sealed interface Intent {
        data object LoadJobs : Intent
        data class SelectJob(val jobId: String) : Intent
        data class StartJob(val jobId: String) : Intent
        data class CompleteJob(val jobId: String) : Intent
    }

    data class State(
        val jobs: List<Job> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null,
        val selectedJobId: String? = null
    )

    sealed interface Label {
        data class NavigateToJobDetails(val jobId: String) : Label
        data class ShowMessage(val message: String) : Label
    }
}

internal class JobListStoreFactory(
    private val storeFactory: StoreFactory,
    private val getScheduleUseCase: GetScheduleUseCase,
    private val completeJobUseCase: CompleteJobUseCase
) {
    fun create(): JobListStore =
        object : JobListStore, Store<JobListStore.Intent, JobListStore.State, JobListStore.Label> by storeFactory.create(
            name = "JobListStore",
            initialState = JobListStore.State(),
            executorFactory = ::ExecutorImpl,
            reducer = ReducerImpl
        ) {}

    private sealed interface Message {
        data class Loading(val isLoading: Boolean) : Message
        data class JobsLoaded(val jobs: List<Job>) : Message
        data class Error(val message: String) : Message
        data class JobSelected(val jobId: String?) : Message
    }

    private inner class ExecutorImpl : CoroutineExecutor<JobListStore.Intent, Unit, JobListStore.State, Message, JobListStore.Label>() {
        override fun executeIntent(intent: JobListStore.Intent, getState: () -> JobListStore.State) {
            when (intent) {
                is JobListStore.Intent.LoadJobs -> loadJobs()
                is JobListStore.Intent.SelectJob -> selectJob(intent.jobId)
                is JobListStore.Intent.StartJob -> startJob(intent.jobId)
                is JobListStore.Intent.CompleteJob -> completeJob(intent.jobId)
            }
        }

        private fun loadJobs() {
            dispatch(Message.Loading(true))
            scope.launch {
                val today = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date
                when (val result = getScheduleUseCase(today)) {
                    is ApiResult.Success -> {
                        dispatch(Message.JobsLoaded(result.data))
                    }
                    is ApiResult.Error -> {
                        dispatch(Message.Error(result.message))
                    }
                    ApiResult.Loading -> {}
                }
            }
        }

        private fun selectJob(jobId: String) {
            dispatch(Message.JobSelected(jobId))
            publish(JobListStore.Label.NavigateToJobDetails(jobId))
        }

        private fun startJob(jobId: String) {
            scope.launch {
                publish(JobListStore.Label.ShowMessage("Starting job..."))
                loadJobs()
            }
        }

        private fun completeJob(jobId: String) {
            scope.launch {
                when (val result = completeJobUseCase(jobId, null, emptyList())) {
                    is ApiResult.Success -> {
                        publish(JobListStore.Label.ShowMessage("Job completed successfully"))
                        loadJobs()
                    }
                    is ApiResult.Error -> {
                        publish(JobListStore.Label.ShowMessage("Error: ${result.message}"))
                    }
                    ApiResult.Loading -> {}
                }
            }
        }
    }

    private object ReducerImpl : Reducer<JobListStore.State, Message> {
        override fun JobListStore.State.reduce(msg: Message): JobListStore.State =
            when (msg) {
                is Message.Loading -> copy(isLoading = msg.isLoading)
                is Message.JobsLoaded -> copy(jobs = msg.jobs, isLoading = false, error = null)
                is Message.Error -> copy(error = msg.message, isLoading = false)
                is Message.JobSelected -> copy(selectedJobId = msg.jobId)
            }
    }
}
