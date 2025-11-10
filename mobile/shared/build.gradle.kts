plugins {
    kotlin("multiplatform")
    kotlin("plugin.serialization")
    id("com.android.library")
    id("app.cash.sqldelight")
}

kotlin {
    androidTarget {
        compilations.all {
            kotlinOptions {
                jvmTarget = "11"
            }
        }
    }

    listOf(
        iosX64(),
        iosArm64(),
        iosSimulatorArm64()
    ).forEach { iosTarget ->
        iosTarget.binaries.framework {
            baseName = "shared"
            isStatic = true
        }
    }

    sourceSets {
        val commonMain by getting {
            dependencies {
                // Coroutines
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.9.0")

                // Serialization
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")

                // DateTime
                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.1")

                // Ktor Client
                implementation("io.ktor:ktor-client-core:3.0.2")
                implementation("io.ktor:ktor-client-content-negotiation:3.0.2")
                implementation("io.ktor:ktor-serialization-kotlinx-json:3.0.2")
                implementation("io.ktor:ktor-client-logging:3.0.2")
                implementation("io.ktor:ktor-client-auth:3.0.2")

                // SQLDelight
                implementation("app.cash.sqldelight:runtime:2.0.2")
                implementation("app.cash.sqldelight:coroutines-extensions:2.0.2")

                // MVIKotlin
                implementation("com.arkivanov.mvikotlin:mvikotlin:4.2.0")
                implementation("com.arkivanov.mvikotlin:mvikotlin-main:4.2.0")
                implementation("com.arkivanov.mvikotlin:mvikotlin-extensions-coroutines:4.2.0")

                // Decompose
                implementation("com.arkivanov.decompose:decompose:3.2.0-beta02")
                implementation("com.arkivanov.decompose:extensions-compose:3.2.0-beta02")

                // Essenty (for Decompose)
                implementation("com.arkivanov.essenty:lifecycle:2.2.0")
                implementation("com.arkivanov.essenty:state-keeper:2.2.0")
                implementation("com.arkivanov.essenty:instance-keeper:2.2.0")
                implementation("com.arkivanov.essenty:back-handler:2.2.0")
            }
        }

        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
                implementation("io.mockk:mockk:1.13.13")
            }
        }

        val androidMain by getting {
            dependencies {
                // Ktor Client Android
                implementation("io.ktor:ktor-client-okhttp:3.0.2")

                // SQLDelight Android
                implementation("app.cash.sqldelight:android-driver:2.0.2")

                // Android Location Services
                implementation("com.google.android.gms:play-services-location:21.3.0")

                // Encrypted SharedPreferences
                implementation("androidx.security:security-crypto:1.1.0-alpha06")
            }
        }

        val iosMain by creating {
            dependsOn(commonMain)
            dependencies {
                // Ktor Client iOS
                implementation("io.ktor:ktor-client-darwin:3.0.2")

                // SQLDelight iOS
                implementation("app.cash.sqldelight:native-driver:2.0.2")
            }
        }

        val iosX64Main by getting { dependsOn(iosMain) }
        val iosArm64Main by getting { dependsOn(iosMain) }
        val iosSimulatorArm64Main by getting { dependsOn(iosMain) }
    }
}

android {
    namespace = "com.jobber.shared"
    compileSdk = 35

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

sqldelight {
    databases {
        create("JobberDatabase") {
            packageName.set("com.jobber.db")
        }
    }
}
