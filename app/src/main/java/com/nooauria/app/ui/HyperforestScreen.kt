package com.nooauria.app.ui

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.webkit.WebViewAssetLoader
import com.nooauria.app.ui.theme.BioDarkBackground
import java.io.ByteArrayInputStream

private const val ASSET_HOST = WebViewAssetLoader.DEFAULT_DOMAIN
private const val WEB_ROOT = "/assets/web/"
private const val FOREST_ROOT = "${WEB_ROOT}hyperforest/"
private const val FOREST_PAGE = "${FOREST_ROOT}index.html"
private val ForestUri = Uri.parse("https://$ASSET_HOST$FOREST_PAGE")
private const val AUDIO_CAPTURE = PermissionRequest.RESOURCE_AUDIO_CAPTURE

@Composable
fun HyperforestScreen(onBack: () -> Unit, modifier: Modifier = Modifier) {
    val currentBack by rememberUpdatedState(onBack)
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    var forestView by remember { mutableStateOf<WebView?>(null) }
    var pendingPermission by remember { mutableStateOf<PermissionRequest?>(null) }
    var requestingPermission by remember { mutableStateOf(false) }
    val microphone = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        val request = pendingPermission
        pendingPermission = null
        requestingPermission = false
        if (granted) request?.grant(arrayOf(AUDIO_CAPTURE)) else request?.deny()
    }

    BackHandler { currentBack() }

    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_START -> forestView?.onResume()
                Lifecycle.Event.ON_STOP -> {
                    forestView?.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))", null)
                    forestView?.onPause()
                }
                else -> Unit
            }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }

    AndroidView(
        modifier = modifier,
        factory = { context ->
            val assets = WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
                .build()

            WebView(context).apply {
                setBackgroundColor(BioDarkBackground.toArgb())
                settings.javaScriptEnabled = true
                settings.allowFileAccess = false
                settings.allowContentAccess = false
                settings.mediaPlaybackRequiresUserGesture = true
                webViewClient = object : WebViewClient() {
                    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                        val uri = request.url
                        if (isForestAsset(uri)) {
                            val assetUri = if (uri.path == FOREST_ROOT) ForestUri else uri
                            assets.shouldInterceptRequest(assetUri)?.let { response ->
                                if (assetUri.path?.endsWith(".js") == true && response.data != null) {
                                    response.mimeType = "text/javascript"
                                }
                                return response
                            }
                        }
                        return WebResourceResponse(
                            "text/plain", "UTF-8", 404, "Not Found", emptyMap(), ByteArrayInputStream(byteArrayOf())
                        )
                    }

                    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                        val uri = request.url
                        if (!request.isForMainFrame || !isAssetOrigin(uri)) return true
                        return when (uri.path) {
                            WEB_ROOT, "${WEB_ROOT}index.html" -> {
                                currentBack()
                                true
                            }
                            FOREST_ROOT, FOREST_PAGE -> false
                            else -> true
                        }
                    }
                }
                webChromeClient = object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest) {
                        val currentPage = this@apply.url?.let(Uri::parse)
                        val supportsAudio = request.resources.contentEquals(arrayOf(AUDIO_CAPTURE))
                        if (!isAssetOrigin(request.origin) || !isForestPage(currentPage) || !supportsAudio) {
                            request.deny()
                            return
                        }
                        if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                            request.grant(arrayOf(AUDIO_CAPTURE))
                        } else if (requestingPermission) {
                            request.deny()
                        } else {
                            pendingPermission = request
                            requestingPermission = true
                            microphone.launch(Manifest.permission.RECORD_AUDIO)
                        }
                    }

                    override fun onPermissionRequestCanceled(request: PermissionRequest) {
                        if (pendingPermission === request) pendingPermission = null
                    }
                }
                forestView = this
                loadUrl(ForestUri.toString())
            }
        },
        onRelease = { view ->
            pendingPermission?.deny()
            pendingPermission = null
            forestView = null
            view.stopLoading()
            view.destroy()
        }
    )
}

private fun isAssetOrigin(uri: Uri): Boolean =
    uri.scheme == "https" && uri.host == ASSET_HOST && (uri.port == -1 || uri.port == 443)

private fun isForestAsset(uri: Uri): Boolean =
    isAssetOrigin(uri) && uri.path?.startsWith(FOREST_ROOT) == true && ".." !in uri.pathSegments

private fun isForestPage(uri: Uri?): Boolean =
    uri != null && isAssetOrigin(uri) && (uri.path == FOREST_PAGE || uri.path == FOREST_ROOT)
