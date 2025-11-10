package com.jobber.navigation

import com.arkivanov.decompose.ComponentContext
import com.arkivanov.decompose.router.stack.ChildStack
import com.arkivanov.decompose.router.stack.StackNavigation
import com.arkivanov.decompose.router.stack.childStack
import com.arkivanov.decompose.router.stack.pop
import com.arkivanov.decompose.router.stack.push
import com.arkivanov.decompose.value.Value
import kotlinx.serialization.Serializable

interface RootComponent {
    val childStack: Value<ChildStack<*, Child>>

    sealed class Child {
        data class Schedule(val component: ScheduleComponent) : Child()
        data class JobDetails(val component: JobDetailsComponent) : Child()
    }
}

class DefaultRootComponent(
    componentContext: ComponentContext
) : RootComponent, ComponentContext by componentContext {

    private val navigation = StackNavigation<Config>()

    override val childStack: Value<ChildStack<*, RootComponent.Child>> =
        childStack(
            source = navigation,
            serializer = Config.serializer(),
            initialConfiguration = Config.Schedule,
            handleBackButton = true,
            childFactory = ::createChild
        )

    private fun createChild(config: Config, componentContext: ComponentContext): RootComponent.Child =
        when (config) {
            is Config.Schedule -> RootComponent.Child.Schedule(
                DefaultScheduleComponent(
                    componentContext = componentContext,
                    onJobSelected = { jobId ->
                        navigation.push(Config.JobDetails(jobId))
                    }
                )
            )
            is Config.JobDetails -> RootComponent.Child.JobDetails(
                DefaultJobDetailsComponent(
                    componentContext = componentContext,
                    jobId = config.jobId,
                    onBack = { navigation.pop() }
                )
            )
        }

    @Serializable
    sealed interface Config {
        @Serializable
        data object Schedule : Config

        @Serializable
        data class JobDetails(val jobId: String) : Config
    }
}

interface ScheduleComponent {
    fun onJobSelected(jobId: String)
}

class DefaultScheduleComponent(
    componentContext: ComponentContext,
    private val onJobSelected: (String) -> Unit
) : ScheduleComponent, ComponentContext by componentContext {
    override fun onJobSelected(jobId: String) {
        onJobSelected.invoke(jobId)
    }
}

interface JobDetailsComponent {
    val jobId: String
    fun onBack()
}

class DefaultJobDetailsComponent(
    componentContext: ComponentContext,
    override val jobId: String,
    private val onBack: () -> Unit
) : JobDetailsComponent, ComponentContext by componentContext {
    override fun onBack() {
        onBack.invoke()
    }
}
