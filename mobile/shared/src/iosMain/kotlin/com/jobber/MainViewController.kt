package com.jobber

import androidx.compose.ui.window.ComposeUIViewController
import com.arkivanov.decompose.DefaultComponentContext
import com.arkivanov.essenty.lifecycle.LifecycleRegistry
import com.jobber.database.DatabaseDriverFactory
import com.jobber.di.AppDependencies
import com.jobber.navigation.DefaultRootComponent
import com.jobber.ui.RootContent
import com.jobber.ui.theme.JobberTheme
import platform.UIKit.UIViewController

/**
 * Creates the main UIViewController for iOS app with Compose Multiplatform UI
 */
fun MainViewController(): UIViewController {
    // Initialize dependencies
    val tokenProvider = IOSTokenProvider()
    val databaseDriverFactory = DatabaseDriverFactory()
    val appDependencies = AppDependencies(databaseDriverFactory, tokenProvider)

    // Create lifecycle
    val lifecycle = LifecycleRegistry()

    // Create root navigation component
    val rootComponent = DefaultRootComponent(
        componentContext = DefaultComponentContext(lifecycle = lifecycle)
    )

    // Create MVI store
    val jobListStore = appDependencies.createJobListStore()

    return ComposeUIViewController {
        JobberTheme {
            RootContent(
                component = rootComponent,
                jobListStore = jobListStore
            )
        }
    }
}
