package com.nooauria.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Bio-Cyber-Utopian Color Tokens
val BioEmerald = Color(0xFF00FF9D)        // Bioluminescent Emerald Green
val BioCyan = Color(0xFF00F5D4)           // Bio-Cyan Glow
val SynapticGold = Color(0xFFFFD700)      // True Gold (24K Pure Gold)
val CyberViolet = Color(0xFF7000FF)       // Cybernetic Deep Violet
val BioDarkBackground = Color(0xFF020E0C) // Deep Chlorophyll Darkness
val BioGlassBg = Color(0x2000FF9D)        // Bioluminescent Glass Card
val BioGlassBorder = Color(0x4000FF9D)    // Cell-Wall Border
val GlowPink = Color(0xFFFF007F)          // Cyber Bloom Pink

// Theme aliases for seamless UI integration
val DarkBackground = BioDarkBackground
val GlassCardBg = BioGlassBg
val GlassBorder = BioGlassBorder
val NeonCyan = BioEmerald
val NeonMagenta = BioCyan
val ElectricPurple = CyberViolet
val GlowGreen = BioEmerald
val GlowOrange = SynapticGold

private val DarkColorScheme = darkColorScheme(
    primary = BioEmerald,
    secondary = BioCyan,
    tertiary = SynapticGold,
    background = BioDarkBackground,
    surface = BioDarkBackground,
    onPrimary = Color.Black,
    onSecondary = Color.Black,
    onBackground = Color.White,
    onSurface = Color.White
)

@Composable
fun NooauriaTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
