package com.jobber.store

import com.arkivanov.mvikotlin.core.store.Reducer
import com.arkivanov.mvikotlin.core.store.Store
import com.arkivanov.mvikotlin.core.store.StoreFactory
import com.arkivanov.mvikotlin.extensions.coroutines.CoroutineExecutor
import com.jobber.domain.models.ApiResult
import com.jobber.domain.models.Job
import com.jobber.domain.repositories.JobRepository
import kotlinx.coroutines.launch

interface JobDetailsStore : Store<JobDetailsStore.Intent, JobDetailsStore.State, JobDetailsStore.Label> {

    sealed interface Intent {
        data object LoadJob : Intent
        data object StartJob : Intent
        data object CompleteJob : Intent
    }

    data class State(
        val job: Job? = null,
        val isLoading: Boolean = false,
        val error: String? = null
    )

    sealed interface Label {
        data class ShowMessage(val message: String) : Label
        data object NavigateBack : Label
    }
}

class JobDetailsStoreFactory(
    private val storeFactory: StoreFactory,
    private val jobRepository: JobRepository,
    private val jobId: String
) {
    fun create(): JobDetailsStore =
        object : JobDetailsStore, Store<JobDetailsStore.Intent, JobDetailsStore.State, JobDetailsStore.Label> by storeFactory.create(
            name = "JobDetailsStore",
            initialState = JobDetailsStore.State(),
            executorFactory = ::ExecutorImpl,
            reducer = ReducerImpl
        ) {}

    private sealed interface Message {
        data class Loading(val isLoading: Boolean) : Message
        data class JobLoaded(val job: Job) : Message
        data class Error(val message: String) : Message
    }

    private inner class ExecutorImpl : CoroutineExecutor<JobDetailsStore.Intent, Unit, JobDetailsStore.State, Message, JobDetailsStore.Label>() {
        override fun executeIntent(intent: JobDetailsStore.Intent, getState: () -> JobDetailsStore.State) {
            when (intent) {
                is JobDetailsStore.Intent.LoadJob -> loadJob()
                is JobDetailsStore.Intent.StartJob -> startJob()
                is JobDetailsStore.Intent.CompleteJob -> completeJob()
            }
        }

        private fun loadJob() {
            dispatch(Message.Loading(true))
            scope.launch {
                when (val result = jobRepository.getJobById(jobId)) {
                    is ApiResult.Success -> {
                        dispatch(Message.JobLoaded(result.data))
                    }
                    is ApiResult.Error -> {
                        dispatch(Message.Error(result.message))
                    }
                    ApiResult.Loading -> {}
                }
            }
        }

        private fun startJob() {
            scope.launch {
                when (jobRepository.startJob(jobId)) {
                    is ApiResult.Success -> {
                        publish(JobDetailsStore.Label.ShowMessage("Job started"))
                        loadJob()
                    }
                    is ApiResult.Error -> {
                        publish(JobDetailsStore.Label.ShowMessage("Failed to start job"))
                    }
                    ApiResult.Loading -> {}
                }
            }
        }

        private fun completeJob() {
            scope.launch {
                when (jobRepository.completeJob(jobId, null, emptyList())) {
                    is ApiResult.Success -> {
                        publish(JobDetailsStore.Label.ShowMessage("Job completed"))
                        publish(JobDetailsStore.Label.NavigateBack)
                    }
                    is ApiResult.Error -> {
                        publish(JobDetailsStore.Label.ShowMessage("Failed to complete job"))
                    }
                    ApiResult.Loading -> {}
                }
            }
        }
    }

    private object ReducerImpl : Reducer<JobDetailsStore.State, Message> {
        override fun JobDetailsStore.State.reduce(msg: Message): JobDetailsStore.State =
            when (msg) {
                is Message.Loading -> copy(isLoading = msg.isLoading)
                is Message.JobLoaded -> copy(job = msg.job, isLoading = false, error = null)
                is Message.Error -> copy(error = msg.message, isLoading = false)
            }
    }
}
