package com.jobber.network

import com.jobber.data.dto.JobDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.forms.formData
import io.ktor.client.request.forms.submitFormWithBinaryData
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import kotlinx.serialization.Serializable

class JobApi(private val httpClient: HttpClient) {
    suspend fun getJobs(date: String? = null): ApiResponse<List<JobDto>> {
        return try {
            val response = httpClient.get("jobs") {
                date?.let { parameter("date", it) }
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun getJobById(id: String): ApiResponse<JobDto> {
        return try {
            val response = httpClient.get("jobs/$id")
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun updateJobStatus(id: String, status: String): ApiResponse<JobDto> {
        return try {
            val response = httpClient.patch("jobs/$id") {
                setBody(mapOf("status" to status))
            }
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun startJob(id: String): ApiResponse<JobDto> {
        return try {
            val response = httpClient.post("jobs/$id/start")
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun completeJob(
        id: String,
        signature: ByteArray?,
        photos: List<ByteArray>
    ): ApiResponse<JobDto> {
        return try {
            val response = httpClient.submitFormWithBinaryData(
                url = "jobs/$id/complete",
                formData = formData {
                    signature?.let {
                        append("signature", it, Headers.build {
                            append(HttpHeaders.ContentType, "image/png")
                            append(HttpHeaders.ContentDisposition, "filename=signature.png")
                        })
                    }
                    photos.forEachIndexed { index, photoBytes ->
                        append("photos", photoBytes, Headers.build {
                            append(HttpHeaders.ContentType, "image/jpeg")
                            append(HttpHeaders.ContentDisposition, "filename=photo$index.jpg")
                        })
                    }
                }
            )
            ApiResponse.Success(response.body())
        } catch (e: Exception) {
            ApiResponse.Error(e.message ?: "Unknown error")
        }
    }
}

sealed class ApiResponse<out T> {
    data class Success<T>(val data: T) : ApiResponse<T>()
    data class Error(val message: String, val code: Int? = null) : ApiResponse<Nothing>()
}

@Serializable
data class ApiErrorResponse(
    val message: String,
    val statusCode: Int,
    val error: String
)
