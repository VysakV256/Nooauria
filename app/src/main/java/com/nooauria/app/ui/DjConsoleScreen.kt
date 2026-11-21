package com.nooauria.app.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ElectricBolt
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nooauria.app.model.DjState
import com.nooauria.app.model.EdmGenre
import com.nooauria.app.model.TrackSection
import com.nooauria.app.ui.theme.*

@Composable
fun DjConsoleScreen(
    djState: DjState,
    onStateChange: (DjState) -> Unit,
    onTriggerPad: (String) -> Unit,
    onImportTrackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    val infiniteTransition = rememberInfiniteTransition(label = "DeckRotate")
    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (djState.isPlaying) (60000 / djState.bpm * 4) else 100000, easing = LinearEasing)
        ),
        label = "angle"
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(BioDarkBackground, Color(0xFF01120F), BioDarkBackground)
                )
            )
            .padding(12.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Bio-Cyber Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.ElectricBolt, contentDescription = "Bolt", tint = BioEmerald, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "NOOAURIA",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = BioEmerald,
                        letterSpacing = 3.sp
                    )
                }
                Text(
                    text = "living audio system · habitat 01",
                    fontSize = 9.sp,
                    color = BioMuted,
                    letterSpacing = 1.sp
                )
            }

            // Bioluminescent Play Button
            Button(
                onClick = { onStateChange(djState.copy(isPlaying = !djState.isPlaying)) },
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (djState.isPlaying) GlowPink else BioEmerald
                ),
                shape = RoundedCornerShape(24.dp)
            ) {
                Icon(
                    imageVector = if (djState.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = "Play/Pause",
                    tint = Color.Black
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (djState.isPlaying) "REST" else "AWAKEN",
                    fontWeight = FontWeight.Black,
                    color = Color.Black,
                    fontSize = 11.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Paired audio organisms
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(145.dp)
                .background(BioGlassBg, RoundedCornerShape(topStart = 30.dp, topEnd = 12.dp, bottomEnd = 30.dp, bottomStart = 12.dp))
                .border(1.dp, BioGlassBorder, RoundedCornerShape(topStart = 30.dp, topEnd = 12.dp, bottomEnd = 30.dp, bottomStart = 12.dp))
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            BioTurntableDeck(
                deckName = "ORGANISM A",
                bpm = djState.bpm,
                rotationAngle = if (djState.isPlaying) rotationAngle else 0f,
                accentColor = BioEmerald
            )

            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "${djState.bpm} BPM",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = SynapticGold
                )
                Text(
                    text = djState.activeSection.displayName,
                    fontSize = 10.sp,
                    color = BioCyan,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Icon(
                    imageVector = Icons.Default.GraphicEq,
                    contentDescription = "Eq",
                    tint = if (djState.isPlaying) BioEmerald else Color.Gray,
                    modifier = Modifier.size(28.dp)
                )
            }

            BioTurntableDeck(
                deckName = "ORGANISM B",
                bpm = djState.bpm,
                rotationAngle = if (djState.isPlaying) -rotationAngle else 0f,
                accentColor = BioCyan
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Sub-Genre Organoid Carousel
        Text(
            text = "SONIC SPECIES",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = BioCyan,
            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(EdmGenre.values()) { genre ->
                val isSelected = djState.genre == genre
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(if (isSelected) BioEmerald else BioGlassBg)
                        .border(
                            1.dp,
                            if (isSelected) Color.White else BioGlassBorder,
                            RoundedCornerShape(14.dp)
                        )
                        .clickable {
                            onStateChange(djState.copy(genre = genre, bpm = genre.defaultBpm))
                        }
                        .padding(horizontal = 14.dp, vertical = 10.dp)
                ) {
                    Column {
                        Text(
                            text = genre.displayName,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.Black else Color.White
                        )
                        Text(
                            text = "${genre.defaultBpm} BPM",
                            fontSize = 9.sp,
                            color = if (isSelected) Color.DarkGray else Color.Gray
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Track Extension Card
        Card(
            colors = CardDefaults.cardColors(containerColor = BioGlassBg),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BioGlassBorder, RoundedCornerShape(18.dp))
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.MusicNote, contentDescription = "Music", tint = SynapticGold)
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(text = "GROW FROM A SAMPLE", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BioCream)
                            Text(text = "Let the neural composer continue its DNA", fontSize = 9.sp, color = BioMuted)
                        }
                    }
                    Button(
                        onClick = { onImportTrackClick() },
                        colors = ButtonDefaults.buttonColors(containerColor = CyberViolet),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.FileDownload, contentDescription = "Import", tint = Color.White, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = "IMPORT", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }

                if (djState.importedTrackName != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(BioEmerald.copy(alpha = 0.2f))
                            .border(1.dp, BioEmerald, RoundedCornerShape(10.dp))
                            .padding(10.dp)
                    ) {
                        Column {
                            Text(text = "🌿 Synapse Audio: ${djState.importedTrackName}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            djState.trackAnalysis?.let { analysis ->
                                Text(
                                    text = "Detected BPM: ${analysis.detectedBpm} | Key: ${analysis.detectedKey} | Neural Extender Active",
                                    fontSize = 10.sp,
                                    color = BioCyan
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(text = "MUSICGEN NEURAL MODE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = BioEmerald)
                                Switch(
                                    checked = djState.isExtendingTrack,
                                    onCheckedChange = { onStateChange(djState.copy(isExtendingTrack = it)) },
                                    colors = SwitchDefaults.colors(checkedThumbColor = BioEmerald)
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Track Section Pills
        Text(
            text = "EVOLUTION STAGE",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = BioCyan,
            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            TrackSection.values().forEach { section ->
                val isSelected = djState.activeSection == section
                Button(
                    onClick = { onStateChange(djState.copy(activeSection = section)) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isSelected) BioEmerald else BioGlassBg
                    ),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(4.dp)
                ) {
                    Text(
                        text = section.name,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isSelected) Color.Black else Color.Gray
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Bioluminescent Remix Trigger Pads
        Text(
            text = "MUTATION GARDEN",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = BioCyan,
            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BioRemixPad(title = "DROP SHIFT", subtitle = "Energy Burst", color = GlowPink) {
                onTriggerPad("DROP_SHIFT")
                onStateChange(djState.copy(activeSection = TrackSection.DROP))
            }
            BioRemixPad(title = "BREAKDOWN", subtitle = "Bio-Zen Shift", color = BioCyan) {
                onTriggerPad("BREAKDOWN")
                onStateChange(djState.copy(activeSection = TrackSection.BREAKDOWN))
            }
            BioRemixPad(title = "SHUFFLE", subtitle = "Nerve Rhythm", color = BioEmerald) {
                onTriggerPad("SHUFFLE_DRUMS")
            }
            BioRemixPad(title = "MUTATE LEAD", subtitle = "DNA Notes", color = SynapticGold) {
                onTriggerPad("MUTATE_LEAD")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Sliders Card
        Card(
            colors = CardDefaults.cardColors(containerColor = BioGlassBg),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, BioGlassBorder, RoundedCornerShape(18.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Speed, contentDescription = "BPM", tint = BioEmerald)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "TEMPO / BPM", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                    Text(text = "${djState.bpm} BPM", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BioEmerald)
                }
                Slider(
                    value = djState.bpm.toFloat(),
                    onValueChange = { onStateChange(djState.copy(bpm = it.toInt())) },
                    valueRange = 80f..160f,
                    colors = SliderDefaults.colors(thumbColor = BioEmerald, activeTrackColor = BioEmerald)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(text = "CHLOROPHYLL FILTER CUTOFF", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text(text = "${(djState.filterCutoff * 100).toInt()}%", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = BioCyan)
                }
                Slider(
                    value = djState.filterCutoff,
                    onValueChange = { onStateChange(djState.copy(filterCutoff = it)) },
                    valueRange = 0.05f..1.0f,
                    colors = SliderDefaults.colors(thumbColor = BioCyan, activeTrackColor = BioCyan)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "SYNAPTIC CROSSFADER",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Gray,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center
                )
                Slider(
                    value = djState.crossfader,
                    onValueChange = { onStateChange(djState.copy(crossfader = it)) },
                    valueRange = -1.0f..1.0f,
                    colors = SliderDefaults.colors(thumbColor = Color.White, activeTrackColor = CyberViolet)
                )
            }
        }
    }
}

@Composable
fun BioTurntableDeck(
    deckName: String,
    bpm: Int,
    rotationAngle: Float,
    accentColor: Color
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = deckName, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = accentColor)
        Spacer(modifier = Modifier.height(4.dp))
        Box(
            modifier = Modifier
                .size(90.dp)
                .clip(CircleShape)
                .background(Color.Black)
                .border(2.dp, accentColor, CircleShape)
                .rotate(rotationAngle),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                drawCircle(color = accentColor.copy(alpha = 0.3f), radius = size.minDimension / 2.2f, style = Stroke(width = 3f))
                drawCircle(color = Color.DarkGray, radius = size.minDimension / 3f, style = Stroke(width = 2f))
                drawCircle(color = accentColor, radius = size.minDimension / 6f)
            }
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(Color.White)
            )
        }
    }
}

@Composable
fun RowScope.BioRemixPad(
    title: String,
    subtitle: String,
    color: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .weight(1f)
            .height(60.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.2f))
            .border(1.5.dp, color, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(4.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = title, fontSize = 9.sp, fontWeight = FontWeight.Black, color = color, textAlign = TextAlign.Center)
            Text(text = subtitle, fontSize = 8.sp, color = Color.LightGray, textAlign = TextAlign.Center)
        }
    }
}
