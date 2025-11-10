package com.jobber.di

import com.arkivanov.mvikotlin.core.store.StoreFactory
import com.arkivanov.mvikotlin.main.store.DefaultStoreFactory
import com.jobber.data.repository.JobRepositoryImpl
import com.jobber.database.DatabaseDriverFactory
import com.jobber.db.JobberDatabase
import com.jobber.domain.repositories.JobRepository
import com.jobber.domain.usecases.ClockInUseCase
import com.jobber.domain.usecases.ClockOutUseCase
import com.jobber.domain.usecases.CompleteJobUseCase
import com.jobber.domain.usecases.GetScheduleUseCase
import com.jobber.network.ClientApi
import com.jobber.network.HttpClientFactory
import com.jobber.network.JobApi
import com.jobber.network.TimeTrackingApi
import com.jobber.network.TokenProvider
import com.jobber.store.JobListStore
import com.jobber.store.JobListStoreFactory
import io.ktor.client.HttpClient

class AppDependencies(
    databaseDriverFactory: DatabaseDriverFactory,
    tokenProvider: TokenProvider
) {
    // Database
    private val database: JobberDatabase = JobberDatabase(databaseDriverFactory.createDriver())

    // Network
    private val httpClient: HttpClient = HttpClientFactory.create(tokenProvider)
    val jobApi = JobApi(httpClient)
    val clientApi = ClientApi(httpClient)
    val timeTrackingApi = TimeTrackingApi(httpClient)

    // Repositories
    val jobRepository: JobRepository = JobRepositoryImpl(jobApi, database)

    // Use Cases
    val getScheduleUseCase = GetScheduleUseCase(jobRepository)
    val completeJobUseCase = CompleteJobUseCase(jobRepository)
    val clockInUseCase = ClockInUseCase(
        // TODO: Add TimeTrackingRepository implementation
        TODO("TimeTrackingRepository not implemented yet")
    )
    val clockOutUseCase = ClockOutUseCase(
        // TODO: Add TimeTrackingRepository implementation
        TODO("TimeTrackingRepository not implemented yet")
    )

    // Stores
    private val storeFactory: StoreFactory = DefaultStoreFactory()

    fun createJobListStore(): JobListStore {
        return JobListStoreFactory(
            storeFactory = storeFactory,
            getScheduleUseCase = getScheduleUseCase,
            completeJobUseCase = completeJobUseCase
        ).create()
    }
}
