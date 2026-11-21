package com.nooauria.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Nooauria living-system palette: soft chlorophyll, fungal warmth and coral signals.
val BioEmerald = Color(0xFFB8F35A)
val BioCyan = Color(0xFF67E8C2)
val SynapticGold = Color(0xFFF3D58B)
val CyberViolet = Color(0xFF7967E8)
val BioDarkBackground = Color(0xFF07100C)
val BioSurface = Color(0xFF101D17)
val BioSurfaceRaised = Color(0xFF17261E)
val BioCream = Color(0xFFF1F3DC)
val BioMuted = Color(0xFF93A89B)
val BioGlassBg = Color(0xCC101D17)
val BioGlassBorder = Color(0x385D846F)
val GlowPink = Color(0xFFFF8066)

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
    surface = BioSurface,
    surfaceVariant = BioSurfaceRaised,
    outline = BioGlassBorder,
    onPrimary = BioDarkBackground,
    onSecondary = BioDarkBackground,
    onBackground = BioCream,
    onSurface = BioCream,
    onSurfaceVariant = BioMuted
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
