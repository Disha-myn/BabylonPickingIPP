# Picking IPP — Android WebView App

Opens Babylon Picking with the **full IPP counter** auto-injected — no bookmarks, no manual tap.

## Features

| Feature | Details |
|---------|---------|
| **Full counter** | Hourly count, avg IPP, drag widget, multi/single SKU detection |
| **Auto-run** | Script injects on Picking pages automatically |
| **Keep screen on** | Screen stays awake while you are on a Picking URL |
| **Logout cleanup** | Counter removed when you leave Picking / log out |
| **Home shortcut** | First launch asks to pin; menu → **Add home shortcut** anytime |

## Daily use

1. Tap **Picking IPP** on home screen (or app drawer)
2. Log in to Babylon if needed
3. Counter appears at bottom — drag to move
4. Close app when shift ends

Use this app **instead of Chrome** for picking.

## Build APK

### Option A — VS Code (terminal / tasks)

You can edit and build in **VS Code** without opening the Android Studio IDE — but you still need **JDK 17** and the **Android SDK** installed once.

#### One-time setup (Windows)

1. **Install JDK 17**  
   - [Microsoft OpenJDK 17](https://learn.microsoft.com/en-us/java/openjdk/download) or [Oracle JDK 17](https://www.oracle.com/java/technologies/downloads/#java17)  
   - Confirm in a new terminal: `java -version`

2. **Install Android SDK** (pick one)  
   - **Easiest:** install [Android Studio](https://developer.android.com/studio) once → SDK lands at  
     `C:\Users\<YOU>\AppData\Local\Android\Sdk`  
   - **Or:** [command-line tools only](https://developer.android.com/studio#command-tools)

3. **Set environment variables** (System → Environment Variables):

   | Variable | Value |
   |----------|--------|
   | `JAVA_HOME` | e.g. `C:\Program Files\Microsoft\jdk-17.x.x` |
   | `ANDROID_HOME` | e.g. `C:\Users\<YOU>\AppData\Local\Android\Sdk` |

   Add to **Path**: `%JAVA_HOME%\bin` and `%ANDROID_HOME%\platform-tools`

4. **Tell Gradle where the SDK is** — in `babylon_picking_app` folder create `local.properties`:

   ```properties
   sdk.dir=C\:\\Users\\YOUR_NAME\\AppData\\Local\\Android\\Sdk
   ```

   (Copy from `local.properties.example` and fix the path.)

5. **Open in VS Code:** File → Open Folder → `babylon_picking_app`

6. **Build:**
   - Terminal: `.\gradlew.bat assembleDebug`
   - Or: **Terminal → Run Build Task** (`Ctrl+Shift+B`)

7. **APK output:**  
   `app\build\outputs\apk\debug\app-debug.apk`

Optional VS Code extensions: **Kotlin**, **Gradle for Java** (syntax/help only — not required).

> First build downloads Gradle + Android dependencies — can take 5–15 minutes.

---

### Option B — Android Studio (GUI)

1. Install [Android Studio](https://developer.android.com/studio)
2. **File → Open** → `babylon_picking_app`
3. Gradle sync
4. **Build → Build APK(s)**
5. Output: `app/build/outputs/apk/debug/app-debug.apk`

### Command line (any folder with wrapper)

```bat
cd babylon_picking_app
gradlew.bat assembleDebug
```

## Install on phone

1. Copy APK to phone
2. Allow install from unknown sources
3. Install → Open **Picking IPP**

## Home screen shortcut

- On **first open**, tap **Add shortcut** in the dialog
- Or tap **⋮ menu → Add home shortcut** later
- Android 8+ shows a confirmation to pin the icon

## Update counter logic

1. Edit `XYZ_PICKING_IPP_COUNTER_MOBILE.txt` (master script)
2. Run: `node gen_assets.js`
3. Rebuild APK and reinstall

Or edit `app/src/main/assets/picking_counter.js` directly.

## Project layout

```
babylon_picking_app/
  app/src/main/assets/picking_counter.js   ← injected counter (full)
  app/src/main/java/.../MainActivity.kt    ← WebView, screen-on, shortcut
  gen_assets.js                            ← rebuild JS from mobile .txt
```

## Notes

- Sideload only (not Play Store)
- Requires network access to `babylon.mynt.myntra.com`
- Counter data stored in WebView `localStorage` on the phone
