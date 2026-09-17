package com.myntra.babylonpickingipp

import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.view.Menu
import android.view.MenuItem
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var prefs: android.content.SharedPreferences
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())
    private var counterScript: String = ""
    private var lastInjectedUrl: String = ""

    private val injectRunnable = object : Runnable {
        override fun run() {
            if (::webView.isInitialized) {
                val url = webView.url ?: ""
                injectCounterIfNeeded(url)
                updateKeepScreenOn(url)
            }
            handler.postDelayed(this, INJECT_INTERVAL_MS)
        }
    }

    @android.annotation.SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WebView.setWebContentsDebuggingEnabled(true)

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
        counterScript = assets.open("picking_counter.js")
            .bufferedReader()
            .use { it.readText() }

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            settings.builtInZoomControls = true
            settings.displayZoomControls = false
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            settings.userAgentString = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"

            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.javaScriptCanOpenWindowsAutomatically = true
            settings.setGeolocationEnabled(true)
            settings.setSupportMultipleWindows(true)

            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)

            webChromeClient = object : WebChromeClient() {
                override fun onGeolocationPermissionsShowPrompt(
                    origin: String?,
                    callback: GeolocationPermissions.Callback?
                ) {
                    callback?.invoke(origin, true, false)
                }

                override fun onCreateWindow(
                    view: WebView?,
                    isDialog: Boolean,
                    isUserGesture: Boolean,
                    resultMsg: Message?
                ): Boolean {
                    val transport = resultMsg?.obj as? WebView.WebViewTransport
                    transport?.webView = view
                    resultMsg?.sendToTarget()
                    return true
                }
            }
            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
                    lastInjectedUrl = ""
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    val u = url ?: ""
                    injectCounterIfNeeded(u)
                    updateKeepScreenOn(u)
                }

                override fun shouldOverrideUrlLoading(
                    view: WebView?,
                    request: WebResourceRequest?
                ): Boolean = false
            }
        }

        setContentView(webView)
        supportActionBar?.title = getString(R.string.app_name)
        webView.loadUrl(START_URL)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        handler.postDelayed(injectRunnable, INJECT_INTERVAL_MS)

        if (!prefs.getBoolean(KEY_SHORTCUT_ASKED, false)) {
            webView.postDelayed({ offerHomeScreenShortcut() }, 1500)
        }
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, MENU_SHORTCUT, 0, getString(R.string.add_home_shortcut))
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        if (item.itemId == MENU_SHORTCUT) {
            pinHomeScreenShortcut(showToast = true)
            return true
        }
        return super.onOptionsItemSelected(item)
    }

    private fun offerHomeScreenShortcut() {
        prefs.edit().putBoolean(KEY_SHORTCUT_ASKED, true).apply()
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            pinHomeScreenShortcut(showToast = true)
            return
        }
        val sm = getSystemService(ShortcutManager::class.java)
        if (!sm.isRequestPinShortcutSupported) return

        AlertDialog.Builder(this)
            .setTitle(R.string.shortcut_title)
            .setMessage(R.string.shortcut_message)
            .setPositiveButton(R.string.shortcut_add) { _, _ ->
                pinHomeScreenShortcut(showToast = true)
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun pinHomeScreenShortcut(showToast: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val sm = getSystemService(ShortcutManager::class.java)
            if (!sm.isRequestPinShortcutSupported) {
                if (showToast) {
                    Toast.makeText(this, R.string.shortcut_not_supported, Toast.LENGTH_LONG).show()
                }
                return
            }
            val shortcut = ShortcutInfo.Builder(this, SHORTCUT_ID)
                .setShortLabel(getString(R.string.app_name))
                .setLongLabel(getString(R.string.app_name_long))
                .setIcon(Icon.createWithResource(this, R.drawable.ic_launcher))
                .setIntent(
                    Intent(this, MainActivity::class.java).apply {
                        action = Intent.ACTION_VIEW
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }
                )
                .build()
            sm.requestPinShortcut(shortcut, null)
            if (showToast) {
                Toast.makeText(this, R.string.shortcut_confirm, Toast.LENGTH_LONG).show()
            }
        } else {
            @Suppress("DEPRECATION")
            val intent = Intent("com.android.launcher.action.INSTALL_SHORTCUT").apply {
                putExtra(Intent.EXTRA_SHORTCUT_INTENT, Intent(this@MainActivity, MainActivity::class.java))
                putExtra(Intent.EXTRA_SHORTCUT_NAME, getString(R.string.app_name))
                putExtra(Intent.EXTRA_SHORTCUT_ICON_RESOURCE,
                    Intent.ShortcutIconResource.fromContext(this@MainActivity, R.drawable.ic_launcher))
            }
            sendBroadcast(intent)
            if (showToast) {
                Toast.makeText(this, R.string.shortcut_added, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun injectCounterIfNeeded(url: String) {
        if (!isBabylonUrl(url)) return
        if (url == lastInjectedUrl && url.isNotEmpty()) return
        webView.evaluateJavascript(counterScript, null)
        lastInjectedUrl = url
    }

    private fun updateKeepScreenOn(url: String) {
        if (isPickingUrl(url)) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    private fun isBabylonUrl(url: String): Boolean {
        return url.contains("babylon.mynt.myntra.com") ||
            url.contains("babylon.myntrainfo.com")
    }

    private fun isPickingUrl(url: String): Boolean {
        return url.contains("babylon.mynt.myntra.com/Picking") ||
            url.contains("babylon.myntrainfo.com/Picking")
    }

    override fun onDestroy() {
        handler.removeCallbacks(injectRunnable)
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        private const val PREFS = "picking_ipp_prefs"
        private const val KEY_SHORTCUT_ASKED = "shortcut_asked"
        private const val SHORTCUT_ID = "picking_ipp_launch"
        private const val MENU_SHORTCUT = 1
        private const val START_URL = "https://babylon.mynt.myntra.com/Picking/Index"
        private const val INJECT_INTERVAL_MS = 2000L
    }
}
