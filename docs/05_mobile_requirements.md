# Mobile Application Requirements (Kotlin Multiplatform)

## Document Information
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete

---

## 1. Technology Stack - Kotlin Multiplatform (KMP)

### 1.1 Core Technologies

**Kotlin Multiplatform (KMP)**
- Shared business logic between iOS and Android
- ~70-80% code sharing
- Platform-specific code for native features

**Compose Multiplatform**
- Declarative UI framework
- Shared UI code across platforms
- Native performance

**Decompose**
- Navigation and component lifecycle
- Screen stack management
- Deep linking support

**MVIKotlin**
- Model-View-Intent architecture
- Unidirectional data flow
- Predictable state management
- Time-travel debugging

---

## 2. Project Structure

```
mobile/
├── shared/                           # Shared KMP module
│   ├── commonMain/
│   │   ├── kotlin/
│   │   │   ├── domain/               # Business logic
│   │   │   │   ├── models/
│   │   │   │   ├── usecases/
│   │   │   │   └── repositories/
│   │   │   ├── data/                 # Data layer
│   │   │   │   ├── repository/
│   │   │   │   ├── datasource/
│   │   │   │   └── dto/
│   │   │   ├── network/              # API client
│   │   │   ├── database/             # Local DB
│   │   │   ├── store/                # MVI stores
│   │   │   └── utils/
│   │   └── resources/
│   ├── androidMain/                  # Android-specific
│   │   └── kotlin/
│   │       └── platform/
│   └── iosMain/                      # iOS-specific
│       └── kotlin/
│           └── platform/
├── androidApp/                       # Android app
│   └── src/main/
│       ├── kotlin/
│       │   ├── ui/                   # Compose UI
│       │   ├── navigation/
│       │   └── MainActivity.kt
│       └── AndroidManifest.xml
└── iosApp/                           # iOS app
    ├── iosApp/
    │   ├── ui/                       # Compose UI
    │   ├── navigation/
    │   └── iOSApp.swift
    └── Info.plist
```

---

## 3. Shared Module (commonMain)

### 3.1 Domain Layer

**Models (Data Classes):**
```kotlin
// shared/commonMain/kotlin/domain/models/

data class Client(
    val id: String,
    val firstName: String,
    val lastName: String,
    val email: String?,
    val phone: String?,
    val addresses: List<Address>,
    val createdAt: Instant
)

data class Job(
    val id: String,
    val clientId: String,
    val title: String,
    val description: String,
    val status: JobStatus,
    val scheduledAt: Instant?,
    val completedAt: Instant?
)

enum class JobStatus {
    SCHEDULED, EN_ROUTE, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
}
```

**Use Cases:**
```kotlin
// shared/commonMain/kotlin/domain/usecases/

class GetScheduleUseCase(
    private val jobRepository: JobRepository
) {
    suspend operator fun invoke(date: LocalDate): Result<List<Job>> {
        return jobRepository.getJobsByDate(date)
    }
}

class CompleteJobUseCase(
    private val jobRepository: JobRepository,
    private val invoiceRepository: InvoiceRepository
) {
    suspend operator fun invoke(
        jobId: String,
        signature: ByteArray,
        photos: List<ByteArray>
    ): Result<Unit> {
        return try {
            jobRepository.completeJob(jobId, signature, photos)
            invoiceRepository.generateInvoice(jobId)
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 3.2 Data Layer

**Repository Interface:**
```kotlin
// shared/commonMain/kotlin/domain/repositories/

interface JobRepository {
    suspend fun getJobsByDate(date: LocalDate): Result<List<Job>>
    suspend fun getJobDetails(id: String): Result<Job>
    suspend fun completeJob(id: String, signature: ByteArray, photos: List<ByteArray>): Result<Unit>
}
```

**Repository Implementation:**
```kotlin
// shared/commonMain/kotlin/data/repository/

class JobRepositoryImpl(
    private val remoteDataSource: JobRemoteDataSource,
    private val localDataSource: JobLocalDataSource,
    private val networkMonitor: NetworkMonitor
) : JobRepository {

    override suspend fun getJobsByDate(date: LocalDate): Result<List<Job>> {
        return if (networkMonitor.isConnected) {
            // Fetch from remote and cache
            remoteDataSource.getJobsByDate(date)
                .onSuccess { jobs ->
                    localDataSource.saveJobs(jobs)
                }
        } else {
            // Fetch from local cache
            localDataSource.getJobsByDate(date)
        }
    }

    override suspend fun completeJob(
        id: String,
        signature: ByteArray,
        photos: List<ByteArray>
    ): Result<Unit> {
        return if (networkMonitor.isConnected) {
            remoteDataSource.completeJob(id, signature, photos)
        } else {
            // Queue for sync when online
            localDataSource.queueJobCompletion(id, signature, photos)
            Result.success(Unit)
        }
    }
}
```

### 3.3 Network Layer (Ktor Client)

```kotlin
// shared/commonMain/kotlin/network/

class ApiClient(
    private val httpClient: HttpClient
) {
    suspend fun getJobs(date: String): Result<List<JobDto>> {
        return try {
            val response = httpClient.get("/api/v1/jobs") {
                parameter("date", date)
            }
            Result.success(response.body())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun completeJob(id: String, request: CompleteJobRequest): Result<Unit> {
        return try {
            httpClient.post("/api/v1/jobs/$id/complete") {
                setBody(request)
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// HTTP Client setup
fun createHttpClient(): HttpClient {
    return HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
        install(Logging) {
            level = LogLevel.INFO
        }
        install(Auth) {
            bearer {
                loadTokens {
                    // Load from storage
                    BearerTokens(accessToken, refreshToken)
                }
                refreshTokens {
                    // Refresh token logic
                }
            }
        }
    }
}
```

### 3.4 Database (SQLDelight)

**Schema Definition:**
```sql
-- shared/commonMain/sqldelight/com/jobber/db/Job.sq

CREATE TABLE Job (
    id TEXT PRIMARY KEY NOT NULL,
    clientId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    scheduledAt INTEGER,
    completedAt INTEGER,
    syncStatus TEXT NOT NULL DEFAULT 'synced'
);

selectByDate:
SELECT * FROM Job
WHERE date(scheduledAt / 1000, 'unixepoch') = ?
ORDER BY scheduledAt ASC;

insertOrReplace:
INSERT OR REPLACE INTO Job
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

markPendingSync:
UPDATE Job
SET syncStatus = 'pending'
WHERE id = ?;
```

**Database Access:**
```kotlin
class JobLocalDataSource(
    private val database: JobberDatabase
) {
    suspend fun getJobsByDate(date: LocalDate): Result<List<Job>> {
        return try {
            val jobs = database.jobQueries
                .selectByDate(date.toString())
                .executeAsList()
                .map { it.toModel() }
            Result.success(jobs)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun saveJobs(jobs: List<Job>) {
        database.jobQueries.transaction {
            jobs.forEach { job ->
                database.jobQueries.insertOrReplace(
                    id = job.id,
                    clientId = job.clientId,
                    title = job.title,
                    // ... other fields
                )
            }
        }
    }
}
```

---

## 4. MVI Architecture (MVIKotlin)

### 4.1 Store Implementation

```kotlin
// shared/commonMain/kotlin/store/

sealed interface JobListIntent {
    object LoadJobs : JobListIntent
    data class SelectJob(val jobId: String) : JobListIntent
    data class CompleteJob(val jobId: String, val signature: ByteArray) : JobListIntent
}

data class JobListState(
    val jobs: List<Job> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedJobId: String? = null
)

sealed interface JobListLabel {
    data class NavigateToJobDetails(val jobId: String) : JobListLabel
    data class ShowError(val message: String) : JobListLabel
}

class JobListStoreFactory(
    private val storeFactory: StoreFactory,
    private val getScheduleUseCase: GetScheduleUseCase,
    private val completeJobUseCase: CompleteJobUseCase
) {
    fun create(): JobListStore {
        return object : JobListStore, Store<JobListIntent, JobListState, JobListLabel> by storeFactory.create(
            name = "JobListStore",
            initialState = JobListState(),
            executorFactory = ::ExecutorImpl,
            reducer = ReducerImpl
        ) {}
    }

    private inner class ExecutorImpl : CoroutineExecutor<JobListIntent, Unit, JobListState, Message, JobListLabel>() {
        override fun executeIntent(intent: JobListIntent, getState: () -> JobListState) {
            when (intent) {
                is JobListIntent.LoadJobs -> loadJobs()
                is JobListIntent.SelectJob -> selectJob(intent.jobId)
                is JobListIntent.CompleteJob -> completeJob(intent.jobId, intent.signature)
            }
        }

        private fun loadJobs() {
            dispatch(Message.Loading(true))
            scope.launch {
                getScheduleUseCase(LocalDate.now())
                    .onSuccess { jobs ->
                        dispatch(Message.JobsLoaded(jobs))
                    }
                    .onFailure { error ->
                        dispatch(Message.Error(error.message ?: "Unknown error"))
                    }
            }
        }

        private fun completeJob(jobId: String, signature: ByteArray) {
            scope.launch {
                completeJobUseCase(jobId, signature, emptyList())
                    .onSuccess {
                        loadJobs() // Reload jobs
                        publish(JobListLabel.ShowError("Job completed"))
                    }
                    .onFailure { error ->
                        publish(JobListLabel.ShowError(error.message ?: "Error"))
                    }
            }
        }
    }

    private sealed interface Message {
        data class Loading(val isLoading: Boolean) : Message
        data class JobsLoaded(val jobs: List<Job>) : Message
        data class Error(val message: String) : Message
    }

    private object ReducerImpl : Reducer<JobListState, Message> {
        override fun JobListState.reduce(msg: Message): JobListState {
            return when (msg) {
                is Message.Loading -> copy(isLoading = msg.isLoading)
                is Message.JobsLoaded -> copy(jobs = msg.jobs, isLoading = false, error = null)
                is Message.Error -> copy(error = msg.message, isLoading = false)
            }
        }
    }
}

interface JobListStore : Store<JobListIntent, JobListState, JobListLabel>
```

---

## 5. Navigation (Decompose)

### 5.1 Root Component

```kotlin
// shared/commonMain/kotlin/navigation/

sealed class Config : Parcelable {
    @Parcelize object Schedule : Config()
    @Parcelize data class JobDetails(val jobId: String) : Config()
    @Parcelize object Clients : Config()
    @Parcelize data class ClientDetails(val clientId: String) : Config()
    @Parcelize object Quotes : Config()
    @Parcelize object Invoices : Config()
}

interface RootComponent {
    val childStack: Value<ChildStack<*, Child>>

    sealed class Child {
        data class Schedule(val component: ScheduleComponent) : Child()
        data class JobDetails(val component: JobDetailsComponent) : Child()
        data class Clients(val component: ClientsComponent) : Child()
        // ... other children
    }
}

class DefaultRootComponent(
    componentContext: ComponentContext,
    private val scheduleComponentFactory: ScheduleComponentFactory,
    // ... other component factories
) : RootComponent, ComponentContext by componentContext {

    private val navigation = StackNavigation<Config>()

    override val childStack: Value<ChildStack<*, RootComponent.Child>> =
        childStack(
            source = navigation,
            initialConfiguration = Config.Schedule,
            handleBackButton = true,
            childFactory = ::createChild
        )

    private fun createChild(config: Config, componentContext: ComponentContext): RootComponent.Child {
        return when (config) {
            is Config.Schedule -> RootComponent.Child.Schedule(
                scheduleComponentFactory.create(
                    componentContext = componentContext,
                    onJobSelected = { jobId ->
                        navigation.push(Config.JobDetails(jobId))
                    }
                )
            )
            is Config.JobDetails -> RootComponent.Child.JobDetails(
                jobDetailsComponentFactory.create(
                    componentContext = componentContext,
                    jobId = config.jobId,
                    onBack = { navigation.pop() }
                )
            )
            // ... other configs
        }
    }
}
```

---

## 6. UI Layer (Compose Multiplatform)

### 6.1 Schedule Screen

```kotlin
// androidApp/src/main/kotlin/ui/schedule/

@Composable
fun ScheduleScreen(component: ScheduleComponent) {
    val state by component.state.subscribeAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Schedule") },
                actions = {
                    IconButton(onClick = { /* filter */ }) {
                        Icon(Icons.Default.FilterList, "Filter")
                    }
                }
            )
        }
    ) { padding ->
        when {
            state.isLoading -> LoadingIndicator()
            state.error != null -> ErrorMessage(state.error!!)
            else -> JobList(
                jobs = state.jobs,
                onJobClick = component::onJobClick,
                modifier = Modifier.padding(padding)
            )
        }
    }
}

@Composable
fun JobList(
    jobs: List<Job>,
    onJobClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(modifier = modifier) {
        items(jobs) { job ->
            JobCard(
                job = job,
                onClick = { onJobClick(job.id) }
            )
        }
    }
}

@Composable
fun JobCard(job: Job, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = job.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = job.scheduledAt?.toString() ?: "Not scheduled",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            JobStatusChip(status = job.status)
        }
    }
}

@Composable
fun JobStatusChip(status: JobStatus) {
    val (text, color) = when (status) {
        JobStatus.SCHEDULED -> "Scheduled" to Color(0xFF2196F3)
        JobStatus.EN_ROUTE -> "En Route" to Color(0xFFFF9800)
        JobStatus.IN_PROGRESS -> "In Progress" to Color(0xFFFF5722)
        JobStatus.COMPLETED -> "Completed" to Color(0xFF4CAF50)
        JobStatus.CANCELLED -> "Cancelled" to Color(0xFF9E9E9E)
        JobStatus.ON_HOLD -> "On Hold" to Color(0xFFFFC107)
    }

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = color.copy(alpha = 0.1f)
    ) {
        Text(
            text = text,
            color = color,
            style = MaterialTheme.typography.labelSmall,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}
```

### 6.2 Job Details Screen

```kotlin
@Composable
fun JobDetailsScreen(component: JobDetailsComponent) {
    val state by component.state.subscribeAsState()
    val job = state.job

    if (job == null) {
        LoadingIndicator()
        return
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Job Details") },
                navigationIcon = {
                    IconButton(onClick = component::onBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                }
            )
        },
        bottomBar = {
            if (job.status == JobStatus.SCHEDULED || job.status == JobStatus.IN_PROGRESS) {
                BottomAppBar {
                    Button(
                        onClick = component::onCompleteJob,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                    ) {
                        Text("Complete Job")
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            item { ClientInfo(client = state.client) }
            item { JobInfo(job = job) }
            item { JobPhotos(photos = state.photos) }
            item { JobForms(forms = state.forms) }
        }
    }
}
```

---

## 7. Platform-Specific Features

### 7.1 Android-Specific

**Location Services:**
```kotlin
// shared/androidMain/kotlin/platform/

actual class LocationService(private val context: Context) {
    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    actual suspend fun getCurrentLocation(): Location? {
        return suspendCoroutine { continuation ->
            fusedLocationClient.lastLocation
                .addOnSuccessListener { location ->
                    continuation.resume(location?.toCommon())
                }
                .addOnFailureListener {
                    continuation.resume(null)
                }
        }
    }
}

fun android.location.Location.toCommon(): Location {
    return Location(latitude = latitude, longitude = longitude)
}
```

**NFC Tap-to-Pay:**
```kotlin
actual class PaymentService(private val activity: Activity) {
    actual suspend fun processContactlessPayment(amount: Double): PaymentResult {
        // Integrate with Stripe Terminal or Square SDK
        // Return result
    }
}
```

### 7.2 iOS-Specific

**Location Services:**
```kotlin
// shared/iosMain/kotlin/platform/

actual class LocationService {
    private val locationManager = CLLocationManager()

    actual suspend fun getCurrentLocation(): Location? {
        return suspendCoroutine { continuation ->
            locationManager.requestLocation()
            // Handle location update
        }
    }
}
```

**Push Notifications:**
```kotlin
actual class NotificationService {
    actual fun requestPermission() {
        UNUserNotificationCenter.currentNotificationCenter()
            .requestAuthorizationWithOptions(/* ... */)
    }

    actual fun showNotification(title: String, body: String) {
        // Show local notification
    }
}
```

---

## 8. Offline-First Architecture

### 8.1 Sync Strategy

**Data Flow:**
1. User performs action
2. Save to local database immediately
3. Mark as "pending sync"
4. Queue background sync job
5. When online, sync to server
6. Mark as "synced" on success

**Implementation:**
```kotlin
class SyncManager(
    private val database: JobberDatabase,
    private val apiClient: ApiClient,
    private val networkMonitor: NetworkMonitor
) {
    init {
        // Start sync when network becomes available
        networkMonitor.isConnected.onEach { isConnected ->
            if (isConnected) {
                syncPendingChanges()
            }
        }.launchIn(scope)
    }

    private suspend fun syncPendingChanges() {
        val pendingJobs = database.jobQueries
            .selectPendingSync()
            .executeAsList()

        pendingJobs.forEach { job ->
            apiClient.completeJob(job.id, job.toRequest())
                .onSuccess {
                    database.jobQueries.markSynced(job.id)
                }
                .onFailure {
                    // Retry later
                }
        }
    }
}
```

### 8.2 Conflict Resolution

**Strategy:**
- Last-write-wins for most fields
- Server always wins for payment/invoice data
- User notified of conflicts

---

## 9. Performance Optimization

### 9.1 Image Loading

```kotlin
// Use Coil for Compose Multiplatform
@Composable
fun JobPhoto(url: String) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(url)
            .crossfade(true)
            .build(),
        contentDescription = "Job photo",
        modifier = Modifier.size(200.dp)
    )
}
```

### 9.2 Lazy Loading

- Paginate large lists
- Load images on demand
- Cache API responses

### 9.3 Memory Management

- Use WeakReference for large objects
- Clear unused resources
- Profile with Android Studio Profiler / Xcode Instruments

---

## 10. Testing

### 10.1 Shared Code Tests

```kotlin
// shared/commonTest/kotlin/

class GetScheduleUseCaseTest {
    private val jobRepository = mockk<JobRepository>()
    private val useCase = GetScheduleUseCase(jobRepository)

    @Test
    fun `returns jobs for date`() = runTest {
        val date = LocalDate.now()
        val expectedJobs = listOf(Job(/* ... */))
        coEvery { jobRepository.getJobsByDate(date) } returns Result.success(expectedJobs)

        val result = useCase(date)

        assertEquals(expectedJobs, result.getOrNull())
    }
}
```

### 10.2 UI Tests (Android)

```kotlin
@RunWith(AndroidJUnit4::class)
class ScheduleScreenTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun displaysJobList() {
        val jobs = listOf(Job(id = "1", title = "Test Job"))
        composeTestRule.setContent {
            JobList(jobs = jobs, onJobClick = {})
        }

        composeTestRule.onNodeWithText("Test Job").assertIsDisplayed()
    }
}
```

---

## 11. Security

### 11.1 Secure Storage

**Android:**
```kotlin
// Use EncryptedSharedPreferences
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()

val sharedPreferences = EncryptedSharedPreferences.create(
    context,
    "secure_prefs",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

**iOS:**
```kotlin
// Use Keychain
actual class SecureStorage {
    actual fun saveToken(token: String) {
        // Save to Keychain
    }

    actual fun getToken(): String? {
        // Retrieve from Keychain
    }
}
```

### 11.2 Certificate Pinning

```kotlin
val client = HttpClient {
    install(HttpClientPlugin) {
        // Certificate pinning configuration
    }
}
```

---

## Document Version Control
- **Version:** 1.0
- **Last Updated:** 2025-11-09
- **Status:** Complete
