package com.nooauria.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Album
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nooauria.app.model.CognitiveState
import com.nooauria.app.model.DjState
import com.nooauria.app.model.TrackAnalysisResult
import com.nooauria.app.model.VisualizerState
import com.nooauria.app.ui.CognitiveScreen
import com.nooauria.app.ui.DjConsoleScreen
import com.nooauria.app.ui.GenerativeVisualizerScreen
import com.nooauria.app.ui.theme.DarkBackground
import com.nooauria.app.ui.theme.NooauriaTheme
import com.nooauria.app.ui.theme.NeonCyan
import com.nooauria.app.ui.theme.NeonMagenta

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NooauriaTheme {
                MainAppScreen()
            }
        }
    }
}

enum class NavigationTab(val title: String) {
    DJ_CONSOLE("DJ Console"),
    COGNITIVE("Brain Entrainment"),
    VISUALIZER("AI Visualizer")
}

@Composable
fun MainAppScreen() {
    val context = LocalContext.current
    var selectedTab by remember { mutableStateOf(NavigationTab.DJ_CONSOLE) }

    var djState by remember { mutableStateOf(DjState()) }
    var cognitiveState by remember { mutableStateOf(CognitiveState()) }
    var visualizerState by remember { mutableStateOf(VisualizerState()) }

    val audioPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let { audioUri ->
            val fileName = audioUri.lastPathSegment ?: "Track.mp3"
            djState = djState.copy(
                importedTrackName = fileName,
                isAnalyzingTrack = true,
                trackAnalysis = TrackAnalysisResult(
                    title = fileName,
                    detectedBpm = 126,
                    detectedKey = "A Minor",
                    energyLevel = 0.85f
                ),
                isPlaying = true
            )
        }
    }

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = DarkBackground,
                contentColor = Color.White,
                tonalElevation = 8.dp,
                modifier = Modifier.height(70.dp)
            ) {
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.DJ_CONSOLE,
                    onClick = { selectedTab = NavigationTab.DJ_CONSOLE },
                    icon = { Icon(Icons.Default.Album, contentDescription = "DJ", tint = if (selectedTab == NavigationTab.DJ_CONSOLE) NeonCyan else Color.Gray) },
                    label = { Text("DJ Console", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (selectedTab == NavigationTab.DJ_CONSOLE) NeonCyan else Color.Gray) }
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.COGNITIVE,
                    onClick = { selectedTab = NavigationTab.COGNITIVE },
                    icon = { Icon(Icons.Default.Psychology, contentDescription = "Brain", tint = if (selectedTab == NavigationTab.COGNITIVE) NeonCyan else Color.Gray) },
                    label = { Text("Brain Frequency", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (selectedTab == NavigationTab.COGNITIVE) NeonCyan else Color.Gray) }
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.VISUALIZER,
                    onClick = { selectedTab = NavigationTab.VISUALIZER },
                    icon = { Icon(Icons.Default.AutoAwesome, contentDescription = "Visualizer", tint = if (selectedTab == NavigationTab.VISUALIZER) NeonMagenta else Color.Gray) },
                    label = { Text("AI Visualizer", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (selectedTab == NavigationTab.VISUALIZER) NeonMagenta else Color.Gray) }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(DarkBackground)
        ) {
            // Always mount GenerativeVisualizerScreen (hosts WebAudio & Visualizer Engine)
            GenerativeVisualizerScreen(
                djState = djState,
                cognitiveState = cognitiveState,
                visualizerState = visualizerState,
                onVisualizerStateChange = { visualizerState = it },
                modifier = Modifier.fillMaxSize()
            )

            // Overlay DJ Console or Cognitive Screen on top when selected
            when (selectedTab) {
                NavigationTab.DJ_CONSOLE -> {
                    DjConsoleScreen(
                        djState = djState,
                        onStateChange = { djState = it },
                        onTriggerPad = { _ -> },
                        onImportTrackClick = {
                            audioPickerLauncher.launch("audio/*")
                        },
                        modifier = Modifier.fillMaxSize()
                    )
                }
                NavigationTab.COGNITIVE -> {
                    CognitiveScreen(
                        cognitiveState = cognitiveState,
                        onStateChange = { cognitiveState = it },
                        modifier = Modifier.fillMaxSize()
                    )
                }
                NavigationTab.VISUALIZER -> {
                    // Visualizer chat drawer is shown inside GenerativeVisualizerScreen
                }
            }
        }
    }
}
