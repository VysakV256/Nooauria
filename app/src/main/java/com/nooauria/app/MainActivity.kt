package com.nooauria.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Album
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
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
import com.nooauria.app.ui.theme.BioCream
import com.nooauria.app.ui.theme.BioGlassBorder
import com.nooauria.app.ui.theme.BioSurface
import com.nooauria.app.ui.theme.BioMuted

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
        containerColor = Color.Transparent,
        bottomBar = {
            NavigationBar(
                containerColor = BioSurface,
                contentColor = BioCream,
                tonalElevation = 0.dp,
                modifier = Modifier
                    .padding(horizontal = 12.dp, vertical = 10.dp)
                    .height(72.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .border(1.dp, BioGlassBorder, RoundedCornerShape(28.dp)),
                windowInsets = WindowInsets(0, 0, 0, 0)
            ) {
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.DJ_CONSOLE,
                    onClick = { selectedTab = NavigationTab.DJ_CONSOLE },
                    icon = { Icon(Icons.Default.Album, contentDescription = "Organism mixer") },
                    label = { Text("MIX", fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp) },
                    colors = livingNavColors()
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.COGNITIVE,
                    onClick = { selectedTab = NavigationTab.COGNITIVE },
                    icon = { Icon(Icons.Default.Psychology, contentDescription = "Neural field") },
                    label = { Text("MIND", fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp) },
                    colors = livingNavColors()
                )
                NavigationBarItem(
                    selected = selectedTab == NavigationTab.VISUALIZER,
                    onClick = { selectedTab = NavigationTab.VISUALIZER },
                    icon = { Icon(Icons.Default.AutoAwesome, contentDescription = "Generative habitat") },
                    label = { Text("HABITAT", fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp) },
                    colors = livingNavColors()
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0xFF173124), DarkBackground),
                        radius = 1100f
                    )
                )
        ) {
            LivingField(modifier = Modifier.fillMaxSize())
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

@Composable
private fun livingNavColors() = NavigationBarItemDefaults.colors(
    selectedIconColor = DarkBackground,
    selectedTextColor = NeonCyan,
    indicatorColor = NeonCyan,
    unselectedIconColor = BioMuted,
    unselectedTextColor = BioMuted
)

@Composable
private fun LivingField(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val membrane = Path().apply {
            moveTo(-40f, size.height * .18f)
            cubicTo(size.width * .18f, size.height * .08f, size.width * .22f, size.height * .34f, size.width * .5f, size.height * .25f)
            cubicTo(size.width * .78f, size.height * .16f, size.width * .82f, size.height * .38f, size.width + 40f, size.height * .28f)
        }
        drawPath(membrane, color = NeonCyan.copy(alpha = .09f), style = Stroke(width = 2f))
        drawCircle(NeonCyan.copy(alpha = .08f), radius = size.minDimension * .26f, center = center)
        drawCircle(NeonMagenta.copy(alpha = .06f), radius = size.minDimension * .13f, center = center)
    }
}
