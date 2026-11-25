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
        versionCode = (System.getenv("APP_VERSION_CODE")?.takeIf { it.isNotBlank() } ?: "1").toInt()
        versionName = System.getenv("APP_VERSION_NAME")?.takeIf { it.isNotBlank() } ?: "1.0"
    }

    signingConfigs {
        create("yayin") {
            // Boş ortam değişkeni de yok sayılır: CI'da yalnızca KEYSTORE_BASE64
            // secret'ı zorunlu, diğerleri bu varsayılanlara düşer.
            fun cevre(ad: String) = System.getenv(ad)?.takeIf { it.isNotBlank() }
            storeFile = file(cevre("KEYSTORE_FILE") ?: "akaryakit-release.jks")
            storePassword = cevre("KEYSTORE_PASSWORD") ?: "akaryakit2026"
            keyAlias = cevre("KEY_ALIAS") ?: "akaryakit"
            keyPassword = cevre("KEY_PASSWORD") ?: "akaryakit2026"
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
    implementation("androidx.work:work-runtime-ktx:2.9.1")
}
