package com.jobber.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.arkivanov.decompose.defaultComponentContext
import com.jobber.database.DatabaseDriverFactory
import com.jobber.di.AppDependencies
import com.jobber.navigation.DefaultRootComponent
import com.jobber.ui.RootContent
import com.jobber.ui.theme.JobberTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize dependencies
        val tokenProvider = AndroidTokenProvider(applicationContext)
        val databaseDriverFactory = DatabaseDriverFactory(applicationContext)
        val appDependencies = AppDependencies(databaseDriverFactory, tokenProvider)

        // Create root navigation component
        val rootComponent = DefaultRootComponent(
            componentContext = defaultComponentContext()
        )

        // Create MVI store
        val jobListStore = appDependencies.createJobListStore()

        setContent {
            JobberTheme {
                Surface(
                    modifier = Modifier.fillMaxSize()
                ) {
                    RootContent(
                        component = rootComponent,
                        jobListStore = jobListStore
                    )
                }
            }
        }
    }
}
