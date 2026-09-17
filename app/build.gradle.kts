plugins {
    id("com.android.application")
}

android {
    namespace = "com.myntra.babylonpickingipp"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.myntra.babylonpickingipp"
        minSdk = 24
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }
    packaging {
        jniLibs {
            // Standard alignment for Android 15+ 16 KB devices
            useLegacyPackaging = false
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
}
