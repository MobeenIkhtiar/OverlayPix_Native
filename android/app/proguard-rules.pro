###########################################################
# React Native + Hermes Safe ProGuard Rules
###########################################################

# Keep React Native core classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep React Native Reanimated and Gesture Handler
-keep class com.swmansion.reanimated.** { *; }
-keep class com.swmansion.gesturehandler.** { *; }

# Keep Metro JS bundle loading
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.modules.** { *; }

###########################################################
# Firebase SDK
###########################################################
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

###########################################################
# Facebook SDK
###########################################################
-keep class com.facebook.** { *; }
-dontwarn com.facebook.**

###########################################################
# AndroidX and Kotlin Reflection
###########################################################
-keep class androidx.** { *; }
-dontwarn androidx.**
-dontwarn kotlin.**
-dontwarn javax.annotation.**

###########################################################
# Miscellaneous
###########################################################
# Keep model classes used via reflection (if any)
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep entry points
-keep public class * extends android.app.Application
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

###########################################################
# Silence warnings & strip debug info
###########################################################
-dontnote
-dontwarn
