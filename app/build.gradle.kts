plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.kamil.akaryakit"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.kamil.akaryakit"
        minSdk = 24
        targetSdk = 35
        versionCode = (System.getenv("APP_VERSION_CODE") ?: "1").toInt()
        versionName = System.getenv("APP_VERSION_NAME") ?: "1.0"
    }

    signingConfigs {
        create("yayin") {
            storeFile = file(System.getenv("KEYSTORE_FILE") ?: "akaryakit-release.jks")
            storePassword = System.getenv("KEYSTORE_PASSWORD") ?: "akaryakit2026"
            keyAlias = System.getenv("KEY_ALIAS") ?: "akaryakit"
            keyPassword = System.getenv("KEY_PASSWORD") ?: "akaryakit2026"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("yayin")
        }
    }

    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
    implementation("androidx.activity:activity:1.9.3")
}
