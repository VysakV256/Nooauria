package com.nooauria.app.visuals

import com.nooauria.app.model.ChatMessage
import com.nooauria.app.model.VisualizerGeometry
import com.nooauria.app.model.VisualizerState
import java.util.Locale

class VisualizerChatEngine {

    fun processPrompt(prompt: String, currentState: VisualizerState): Pair<VisualizerState, ChatMessage> {
        val text = prompt.lowercase(Locale.getDefault())
        var newGeometry = currentState.geometry
        var primaryColor = currentState.primaryColor
        var secondaryColor = currentState.secondaryColor
        var accentColor = currentState.accentColor
        var speed = currentState.speed
        var sensitivity = currentState.audioSensitivity
        var density = currentState.particleDensity
        var bloom = currentState.bloomIntensity

        if (text.contains("grid") || text.contains("cyberpunk") || text.contains("synthwave") || text.contains("matrix")) {
            newGeometry = VisualizerGeometry.NEON_GRID
        } else if (text.contains("mandala") || text.contains("sacred") || text.contains("geometry") || text.contains("flower") || text.contains("zen")) {
            newGeometry = VisualizerGeometry.SACRED_MANDALA
        } else if (text.contains("wormhole") || text.contains("tunnel") || text.contains("cosmic") || text.contains("space") || text.contains("hypnotic")) {
            newGeometry = VisualizerGeometry.COSMIC_TUNNEL
        } else if (text.contains("matrix") || text.contains("code") || text.contains("rain") || text.contains("digital")) {
            newGeometry = VisualizerGeometry.CYBER_MATRIX
        } else if (text.contains("particle") || text.contains("star") || text.contains("galaxy") || text.contains("quantum")) {
            newGeometry = VisualizerGeometry.QUANTUM_PARTICLES
        } else if (text.contains("aurora") || text.contains("wave") || text.contains("spectrum") || text.contains("liquid")) {
            newGeometry = VisualizerGeometry.AURORA_WAVES
        }

        if (text.contains("gold") || text.contains("yellow") || text.contains("sun")) {
            primaryColor = "#FFD700"
            secondaryColor = "#FF8C00"
            accentColor = "#FFFFFF"
        } else if (text.contains("neon") || text.contains("cyan") || text.contains("pink")) {
            primaryColor = "#00FFFF"
            secondaryColor = "#FF00FF"
            accentColor = "#9D4EDD"
        } else if (text.contains("green") || text.contains("emerald") || text.contains("nature")) {
            primaryColor = "#00FF66"
            secondaryColor = "#00B4D8"
            accentColor = "#CCFF00"
        } else if (text.contains("red") || text.contains("fire") || text.contains("crimson")) {
            primaryColor = "#FF0055"
            secondaryColor = "#FF6600"
            accentColor = "#FFCC00"
        } else if (text.contains("purple") || text.contains("violet") || text.contains("deep")) {
            primaryColor = "#9D4EDD"
            secondaryColor = "#5A189A"
            accentColor = "#00FFFF"
        }

        if (text.contains("fast") || text.contains("hyper") || text.contains("intense") || text.contains("crazy")) {
            speed = 2.0f
            sensitivity = 1.6f
            density = 500
            bloom = 0.9f
        } else if (text.contains("slow") || text.contains("calm") || text.contains("relax") || text.contains("smooth")) {
            speed = 0.5f
            sensitivity = 0.7f
            density = 150
            bloom = 0.4f
        }

        val updatedState = currentState.copy(
            geometry = newGeometry,
            primaryColor = primaryColor,
            secondaryColor = secondaryColor,
            accentColor = accentColor,
            speed = speed,
            audioSensitivity = sensitivity,
            particleDensity = density,
            bloomIntensity = bloom,
            activePrompt = prompt
        )

        val aiResponseText = "✨ Generated custom ${newGeometry.displayName} scene with ${primaryColor}/${secondaryColor} palette tuned for '${prompt}'!"
        val aiMessage = ChatMessage(sender = "Nooauria AI", text = aiResponseText)

        return Pair(updatedState, aiMessage)
    }
}
