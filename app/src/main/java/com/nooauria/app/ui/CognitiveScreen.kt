package com.nooauria.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material.icons.filled.Waves
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.nooauria.app.model.BrainwaveBand
import com.nooauria.app.model.CognitiveState
import com.nooauria.app.model.SolfeggioFrequency
import com.nooauria.app.ui.theme.*

@Composable
fun CognitiveScreen(
    cognitiveState: CognitiveState,
    onStateChange: (CognitiveState) -> Unit,
    modifier: Modifier = Modifier
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(BioDarkBackground)
            .padding(16.dp)
            .verticalScroll(scrollState),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(imageVector = Icons.Default.Psychology, contentDescription = "Brain", tint = BioEmerald, modifier = Modifier.size(32.dp))
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = "BIOCYBER ENTRAINMENT",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = BioEmerald,
                    letterSpacing = 1.5.sp
                )
                Text(
                    text = "Organoid Frequency & Neural Resonance Matrix",
                    fontSize = 10.sp,
                    color = BioCyan
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "SYNAPTIC MIND PRESETS",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = BioCyan,
            modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            BioPresetButton("440Hz Mainstage", GlowPink, Modifier.weight(1f)) {
                onStateChange(
                    cognitiveState.copy(
                        binauralEnabled = true,
                        binauralBand = BrainwaveBand.GAMMA,
                        solfeggioEnabled = true,
                        solfeggioFrequency = SolfeggioFrequency.SOL_440,
                        tuning432HzEnabled = false,
                        presetName = "440Hz Concert Pitch Peak"
                    )
                )
            }
            BioPresetButton("7.83Hz Earth", SynapticGold, Modifier.weight(1f)) {
                onStateChange(
                    cognitiveState.copy(
                        binauralEnabled = true,
                        binauralBand = BrainwaveBand.SCHUMANN,
                        solfeggioEnabled = true,
                        solfeggioFrequency = SolfeggioFrequency.SOL_432,
                        brownNoiseEnabled = true,
                        presetName = "Schumann 7.83Hz Earth Sync"
                    )
                )
            }
            BioPresetButton("Alpha Flow (528Hz)", BioEmerald, Modifier.weight(1f)) {
                onStateChange(
                    cognitiveState.copy(
                        binauralEnabled = true,
                        binauralBand = BrainwaveBand.ALPHA,
                        solfeggioEnabled = true,
                        solfeggioFrequency = SolfeggioFrequency.SOL_528,
                        presetName = "Alpha Flow (528Hz)"
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = BioGlassBg),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.5.dp, BioGlassBorder, RoundedCornerShape(18.dp))
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "432 Hz SACRED TUNING MODE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = SynapticGold)
                    Switch(
                        checked = cognitiveState.tuning432HzEnabled,
                        onCheckedChange = { onStateChange(cognitiveState.copy(tuning432HzEnabled = it)) },
                        colors = SwitchDefaults.colors(checkedThumbColor = SynapticGold)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "BROWN NOISE AMBIENT SHIELD", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = BioCyan)
                    Switch(
                        checked = cognitiveState.brownNoiseEnabled,
                        onCheckedChange = { onStateChange(cognitiveState.copy(brownNoiseEnabled = it)) },
                        colors = SwitchDefaults.colors(checkedThumbColor = BioCyan)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = BioGlassBg),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.5.dp, BioGlassBorder, RoundedCornerShape(18.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Waves, contentDescription = "Waves", tint = BioEmerald)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "BINAURAL BEATS ENGINE", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                    Switch(
                        checked = cognitiveState.binauralEnabled,
                        onCheckedChange = { onStateChange(cognitiveState.copy(binauralEnabled = it)) },
                        colors = SwitchDefaults.colors(checkedThumbColor = BioEmerald)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(text = "Brainwave Target Band:", fontSize = 11.sp, color = Color.Gray)
                Spacer(modifier = Modifier.height(6.dp))

                BrainwaveBand.values().forEach { band ->
                    val isSelected = cognitiveState.binauralBand == band
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) BioEmerald.copy(alpha = 0.25f) else Color.Transparent)
                            .clickable { onStateChange(cognitiveState.copy(binauralBand = band)) }
                            .padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = band.displayName, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (isSelected) BioEmerald else Color.White)
                            Text(text = band.benefit, fontSize = 9.sp, color = Color.Gray)
                        }
                        Text(text = "${band.frequencyHz} Hz", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = BioEmerald)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Binaural Beats Volume", fontSize = 11.sp, color = Color.LightGray)
                    Text(text = "${(cognitiveState.binauralVolume * 100).toInt()}%", fontSize = 11.sp, color = BioEmerald)
                }
                Slider(
                    value = cognitiveState.binauralVolume,
                    onValueChange = { onStateChange(cognitiveState.copy(binauralVolume = it)) },
                    valueRange = 0.0f..1.0f,
                    colors = SliderDefaults.colors(thumbColor = BioEmerald, activeTrackColor = BioEmerald)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            colors = CardDefaults.cardColors(containerColor = BioGlassBg),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.5.dp, BioGlassBorder, RoundedCornerShape(18.dp))
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.SelfImprovement, contentDescription = "Solfeggio", tint = BioCyan)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "SOLFEGGIO FREQUENCY MIXER", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                    Switch(
                        checked = cognitiveState.solfeggioEnabled,
                        onCheckedChange = { onStateChange(cognitiveState.copy(solfeggioEnabled = it)) },
                        colors = SwitchDefaults.colors(checkedThumbColor = BioCyan)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                SolfeggioFrequency.values().forEach { sol ->
                    val isSelected = cognitiveState.solfeggioFrequency == sol
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 3.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (isSelected) BioCyan.copy(alpha = 0.25f) else Color.Transparent)
                            .clickable { onStateChange(cognitiveState.copy(solfeggioFrequency = sol)) }
                            .padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(text = sol.nameTitle, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (isSelected) BioCyan else Color.White)
                            Text(text = sol.description, fontSize = 9.sp, color = Color.Gray)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Solfeggio Tone Volume", fontSize = 11.sp, color = Color.LightGray)
                    Text(text = "${(cognitiveState.solfeggioVolume * 100).toInt()}%", fontSize = 11.sp, color = BioCyan)
                }
                Slider(
                    value = cognitiveState.solfeggioVolume,
                    onValueChange = { onStateChange(cognitiveState.copy(solfeggioVolume = it)) },
                    valueRange = 0.0f..1.0f,
                    colors = SliderDefaults.colors(thumbColor = BioCyan, activeTrackColor = BioCyan)
                )
            }
        }
    }
}

@Composable
fun BioPresetButton(title: String, color: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.2f))
            .border(1.dp, color, RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(vertical = 10.dp, horizontal = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(text = title, fontSize = 9.sp, fontWeight = FontWeight.Bold, color = color)
    }
}
