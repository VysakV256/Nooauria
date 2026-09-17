package com.nooauria.app.model

enum class EdmGenre(val displayName: String, val defaultBpm: Int, val description: String) {
    MELODIC_TECHNO("Melodic Techno", 124, "Deep hypnotic basslines & atmospheric synth arps"),
    PROGRESSIVE_HOUSE("Progressive House", 128, "Euphoric chord progressions & mainstage drops"),
    CYBERPUNK_TRANCE("Cyberpunk Trance", 138, "Futuristic arpeggios & high-tempo energy"),
    AMBIENT_LOFI("Ambient Lo-Fi", 95, "Chill beat loops, relaxed pads & Solfeggio warmth"),
    PSYTRANCE("Psytrance", 142, "Rolling triplet bass & fast trippy synth leads")
}

enum class TrackSection(val displayName: String) {
    INTRO("Intro Groove"),
    BUILDUP("Buildup"),
    DROP("HIGH DROP!"),
    BREAKDOWN("Melodic Breakdown"),
    OUTRO("Outro Groove")
}

data class TrackAnalysisResult(
    val title: String = "Imported Track",
    val detectedBpm: Int = 124,
    val detectedKey: String = "A Minor",
    val energyLevel: Float = 0.8f,
    val scaleNotesHz: List<Float> = listOf(220.0f, 246.94f, 261.63f, 293.66f, 329.63f)
)

data class DjState(
    val isPlaying: Boolean = false,
    val bpm: Int = 128,
    val genre: EdmGenre = EdmGenre.MELODIC_TECHNO,
    val activeSection: TrackSection = TrackSection.DROP,
    val pitchShift: Int = 0,
    val crossfader: Float = 0.0f,
    val filterCutoff: Float = 0.8f,
    val resonance: Float = 0.3f,
    val eqLow: Float = 0.0f,
    val eqMid: Float = 0.0f,
    val eqHigh: Float = 0.0f,
    val reverb: Float = 0.2f,
    val delay: Float = 0.15f,
    val currentBar: Int = 1,
    val leadSynthNotes: List<Int> = listOf(60, 63, 65, 67, 70, 72, 75, 77),
    val importedTrackName: String? = null,
    val isAnalyzingTrack: Boolean = false,
    val trackAnalysis: TrackAnalysisResult? = null,
    val isExtendingTrack: Boolean = false
)

enum class BrainwaveBand(val displayName: String, val frequencyHz: Float, val benefit: String) {
    EPSILON("Epsilon (Deep Cosmic)", 0.2f, "Extraordinary deep meditation & nervous system reset"),
    DELTA("Delta (Deep Sleep)", 2.5f, "Physical recovery & deep subconscious healing"),
    THETA("Theta (Meditation)", 6.0f, "Deep intuition, emotional release & creativity"),
    SCHUMANN("Schumann Resonance", 7.83f, "Earth's ionospheric frequency (7.83 Hz) for grounding"),
    ALPHA("Alpha (Flow State)", 10.0f, "Relaxed alertness, stress relief & mental focus"),
    BETA("Beta (Active Brain)", 18.0f, "Active problem solving & analytical focus"),
    GAMMA("Gamma (Peak Mind)", 40.0f, "40 Hz neuro-stimulation & cognitive peak"),
    LAMBDA("Lambda (Mystical Consciousness)", 120.0f, "High-frequency transcendent awareness")
}

enum class SolfeggioFrequency(val hz: Int, val nameTitle: String, val description: String) {
    SOL_174(174, "174 Hz - Natural Anesthetic", "Pain relief, physical security & grounding"),
    SOL_285(285, "285 Hz - Cellular Repair", "Restores tissue structure & energy fields"),
    SOL_396(396, "396 Hz - Liberation", "Clears guilt, fear, and emotional blocks"),
    SOL_417(417, "417 Hz - Transformation", "Undoes negative situations & facilitates positive change"),
    SOL_432(432, "432 Hz - Sacred Tuning", "Verdi's natural pitch ratio for cosmic harmony"),
    SOL_440(440, "440 Hz - Concert Pitch Standard", "Universal bright orchestral & EDM pitch standard"),
    SOL_528(528, "528 Hz - Miracle & Love", "DNA repair, transformation & inner peace"),
    SOL_639(639, "639 Hz - Harmony", "Enhances relationships & emotional connections"),
    SOL_741(741, "741 Hz - Intuition", "Awakens intuition, problem solving & expression"),
    SOL_852(852, "852 Hz - Spiritual Order", "Restores spiritual order & raises awareness"),
    SOL_963(963, "963 Hz - Crown Light", "Connects to pure divine consciousness")
}

enum class EntrainmentType(val displayName: String, val description: String) {
    BINAURAL("Binaural Beats (Headphones)", "Stereo channel differential for central brain entrainment"),
    MONAURAL("Monaural Beats (Speaker friendly)", "Pre-mixed physical acoustic interference beats"),
    ISOCHRONIC("Isochronic Pulses", "Sharply modulated amplitude pulse trains"),
    SHEPARD_TONE("Shepard-Risset Tone", "Continuous auditory illusion of infinite falling pitch")
}

data class CognitiveState(
    val binauralEnabled: Boolean = true,
    val entrainmentType: EntrainmentType = EntrainmentType.BINAURAL,
    val binauralBand: BrainwaveBand = BrainwaveBand.ALPHA,
    val binauralVolume: Float = 0.4f,
    val carrierHz: Float = 216.0f,
    val isochronicEnabled: Boolean = false,
    val isochronicHz: Float = 10.0f,
    val isochronicVolume: Float = 0.3f,
    val solfeggioEnabled: Boolean = true,
    val solfeggioFrequency: SolfeggioFrequency = SolfeggioFrequency.SOL_528,
    val solfeggioVolume: Float = 0.35f,
    val brownNoiseEnabled: Boolean = true,
    val brownNoiseVolume: Float = 0.25f,
    val tuning432HzEnabled: Boolean = true,
    val presetName: String = "Alpha Flow (528Hz)"
)

enum class VisualizerGeometry(val displayName: String) {
    NEON_GRID("Neon Grid Tunnel"),
    COSMIC_TUNNEL("Cosmic Wormhole"),
    SACRED_MANDALA("Sacred Geometry Mandala"),
    CYBER_MATRIX("Cyber Matrix Rain"),
    QUANTUM_PARTICLES("Quantum Particle Cloud"),
    AURORA_WAVES("Spectrum Aurora Waves")
}

data class ChatMessage(
    val sender: String,
    val text: String,
    val id: String = java.util.UUID.randomUUID().toString(),
    val timestamp: String = java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault()).format(java.util.Date())
)

data class VisualizerState(
    val geometry: VisualizerGeometry = VisualizerGeometry.COSMIC_TUNNEL,
    val primaryColor: String = "#B8F35A",
    val secondaryColor: String = "#67E8C2",
    val accentColor: String = "#FF8066",
    val audioSensitivity: Float = 1.0f,
    val speed: Float = 1.0f,
    val particleDensity: Int = 300,
    val bloomIntensity: Float = 0.7f,
    val isRotating: Boolean = true,
    val activePrompt: String = "Living mycelial habitat breathing with sub bass and 528Hz",
    val chatHistory: List<ChatMessage> = listOf(
        ChatMessage("Nooauria", "The habitat is listening. Describe a living scene and I’ll evolve it with your sound.")
    )
)
