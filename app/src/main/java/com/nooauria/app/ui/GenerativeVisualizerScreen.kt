package com.nooauria.app.ui

import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.nooauria.app.model.ChatMessage
import com.nooauria.app.model.CognitiveState
import com.nooauria.app.model.DjState
import com.nooauria.app.model.VisualizerState
import com.nooauria.app.ui.theme.*
import com.nooauria.app.visuals.VisualizerChatEngine
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GenerativeVisualizerScreen(
    djState: DjState,
    cognitiveState: CognitiveState,
    visualizerState: VisualizerState,
    onVisualizerStateChange: (VisualizerState) -> Unit,
    modifier: Modifier = Modifier
) {
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var promptInput by remember { mutableStateOf("") }
    val chatEngine = remember { VisualizerChatEngine() }

    LaunchedEffect(djState, cognitiveState, visualizerState, webViewInstance) {
        webViewInstance?.let { webView ->
            val jsonObj = JSONObject().apply {
                put("isPlaying", djState.isPlaying)
                put("bpm", djState.bpm)
                put("genre", djState.genre.name)
                put("activeSection", djState.activeSection.name)
                put("filterCutoff", djState.filterCutoff)
                put("eqLow", djState.eqLow)
                put("eqMid", djState.eqMid)
                put("eqHigh", djState.eqHigh)
                put("binauralEnabled", cognitiveState.binauralEnabled)
                put("binauralCarrierHz", cognitiveState.carrierHz)
                put("binauralBeatHz", cognitiveState.binauralBand.frequencyHz)
                put("binauralVol", cognitiveState.binauralVolume)
                put("solfeggioEnabled", cognitiveState.solfeggioEnabled)
                put("solfeggioHz", cognitiveState.solfeggioFrequency.hz)
                put("solfeggioVol", cognitiveState.solfeggioVolume)
                put("geometry", visualizerState.geometry.name)
                put("primaryColor", visualizerState.primaryColor)
                put("secondaryColor", visualizerState.secondaryColor)
                put("accentColor", visualizerState.accentColor)
                put("audioSensitivity", visualizerState.audioSensitivity)
                put("speed", visualizerState.speed)
                put("particleDensity", visualizerState.particleDensity)
                put("bloomIntensity", visualizerState.bloomIntensity)
            }
            val jsCommand = "javascript:setEngineState('${jsonObj.toString().replace("'", "\\'")}');"
            webView.evaluateJavascript(jsCommand, null)
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.mediaPlaybackRequiresUserGesture = false
                    settings.allowFileAccess = true
                    settings.allowContentAccess = true
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView?, url: String?) {
                            webViewInstance = view
                        }
                    }
                    loadUrl("file:///android_asset/web/index.html")
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .fillMaxHeight(0.46f)
                .padding(horizontal = 10.dp, vertical = 8.dp)
                .clip(RoundedCornerShape(topStart = 32.dp, topEnd = 14.dp, bottomEnd = 32.dp, bottomStart = 14.dp))
                .background(BioSurface.copy(alpha = 0.94f))
                .border(1.dp, GlassBorder, RoundedCornerShape(topStart = 32.dp, topEnd = 14.dp, bottomEnd = 32.dp, bottomStart = 14.dp))
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = "AI", tint = NeonCyan)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "HABITAT DESIGNER",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = NeonCyan,
                        letterSpacing = 1.sp
                    )
                }
                Text(
                    text = "LIVE · LISTENING",
                    fontSize = 10.sp,
                    color = Color.Gray
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
            ) {
                val suggestions = listOf(
                    "Mycelium breathing with the bass",
                    "Golden 528Hz seed mandala",
                    "Coral bloom with slow violet pulses",
                    "Aurora algae in a liquid current",
                    "Quantum spores drifting in deep space"
                )
                items(suggestions) { sugg ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(GlassCardBg)
                            .border(1.dp, NeonCyan.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                            .clickable {
                                val (newState, aiMsg) = chatEngine.processPrompt(sugg, visualizerState)
                                val updatedMessages = visualizerState.chatHistory + ChatMessage("User", sugg) + aiMsg
                                onVisualizerStateChange(newState.copy(chatHistory = updatedMessages))
                            }
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(text = sugg, fontSize = 9.sp, color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth(),
                reverseLayout = true
            ) {
                items(visualizerState.chatHistory.reversed()) { msg ->
                    val isUser = msg.sender == "User"
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp),
                        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                    ) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isUser) NeonCyan.copy(alpha = 0.25f) else ElectricPurple.copy(alpha = 0.35f))
                                .border(1.dp, if (isUser) NeonCyan else ElectricPurple, RoundedCornerShape(12.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Column {
                                Text(
                                    text = msg.sender,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isUser) NeonCyan else NeonMagenta
                                )
                                Text(
                                    text = msg.text,
                                    fontSize = 11.sp,
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = promptInput,
                    onValueChange = { promptInput = it },
                    placeholder = { Text("Describe how the habitat should evolve…", fontSize = 11.sp, color = BioMuted) },
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = NeonCyan,
                        unfocusedBorderColor = GlassBorder,
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    ),
                    shape = RoundedCornerShape(20.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.width(6.dp))

                IconButton(
                    onClick = {
                        if (promptInput.isNotBlank()) {
                            val userText = promptInput
                            promptInput = ""
                            val (newState, aiMsg) = chatEngine.processPrompt(userText, visualizerState)
                            val updatedMessages = visualizerState.chatHistory + ChatMessage("User", userText) + aiMsg
                            onVisualizerStateChange(newState.copy(chatHistory = updatedMessages))
                        }
                    },
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(NeonCyan)
                ) {
                    Icon(imageVector = Icons.Default.Send, contentDescription = "Send", tint = Color.Black)
                }
            }
        }
    }
}
