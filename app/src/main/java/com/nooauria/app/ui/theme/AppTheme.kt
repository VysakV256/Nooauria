package com.nooauria.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Turquoise surfaces and highlights with warm accents for individual controls.
val BioEmerald = Color(0xFF59EBDD)
val BioCyan = Color(0xFF7FDFED)
val SynapticGold = Color(0xFFF3D58B)
val CyberViolet = Color(0xFF8F88F2)
val BioDarkBackground = Color(0xFF051A1B)
val BioSurface = Color(0xFF092626)
val BioSurfaceRaised = Color(0xFF103739)
val BioCream = Color(0xFFE8FCF7)
val BioMuted = Color(0xFFA5CFCA)
val BioGlassBg = BioSurface.copy(alpha = 0.8f)
val BioGlassBorder = Color(0x526AB9B3)
val GlowPink = Color(0xFFFF8066)
private val BioOutline = Color(0xFF6AA6A1)

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
    primaryContainer = BioSurfaceRaised,
    secondary = BioCyan,
    secondaryContainer = BioSurfaceRaised,
    tertiary = SynapticGold,
    background = BioDarkBackground,
    surface = BioSurface,
    surfaceVariant = BioSurfaceRaised,
    surfaceTint = BioEmerald,
    outline = BioOutline,
    outlineVariant = BioGlassBorder,
    onPrimary = BioDarkBackground,
    onPrimaryContainer = BioCream,
    onSecondary = BioDarkBackground,
    onSecondaryContainer = BioCream,
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
