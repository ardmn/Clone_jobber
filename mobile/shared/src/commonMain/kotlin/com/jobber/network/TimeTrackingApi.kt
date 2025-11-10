package com.jobber.network

import com.jobber.data.dto.TimeEntryDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import kotlinx.serialization.Serializable

class TimeTrackingApi(private val httpClient: HttpClient) {
    suspend fun clockIn(request: ClockInRequest): ApiResponse<TimeEntryDto> {
        return try {
            val response = httpClient.post("time-tracking/clock-in") {
                setBody(request)
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun clockOut(entryId: String, request: ClockOutRequest): ApiResponse<TimeEntryDto> {
        return try {
            val response = httpClient.post("time-tracking/$entryId/clock-out") {
                setBody(request)
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun getActiveEntry(): ApiResponse<TimeEntryDto?> {
        return try {
            val response = httpClient.get("time-tracking/active")
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun getEntries(jobId: String? = null): ApiResponse<List<TimeEntryDto>> {
        return try {
            val response = httpClient.get("time-tracking") {
                jobId?.let { parameter("jobId", it) }
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }
}

@Serializable
data class ClockInRequest(
    val jobId: String,
    val latitude: Double? = null,
    val longitude: Double? = null
)

@Serializable
data class ClockOutRequest(
    val latitude: Double? = null,
    val longitude: Double? = null
)
