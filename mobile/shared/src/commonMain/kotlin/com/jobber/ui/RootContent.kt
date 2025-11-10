package com.jobber.ui

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.arkivanov.decompose.extensions.compose.stack.Children
import com.arkivanov.decompose.extensions.compose.stack.animation.slide
import com.arkivanov.decompose.extensions.compose.stack.animation.stackAnimation
import com.jobber.navigation.RootComponent
import com.jobber.store.JobListStore
import com.jobber.ui.jobdetails.JobDetailsScreen
import com.jobber.ui.schedule.ScheduleScreen

@Composable
fun RootContent(
    component: RootComponent,
    jobListStore: JobListStore,
    modifier: Modifier = Modifier
) {
    Children(
        stack = component.childStack,
        modifier = modifier,
        animation = stackAnimation(slide())
    ) { child ->
        when (val instance = child.instance) {
            is RootComponent.Child.Schedule -> {
                ScheduleScreen(
                    component = instance.component,
                    store = jobListStore
                )
            }
            is RootComponent.Child.JobDetails -> {
                JobDetailsScreen(
                    component = instance.component
                )
            }
        }
    }
}
