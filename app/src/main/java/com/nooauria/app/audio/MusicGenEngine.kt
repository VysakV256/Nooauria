package com.nooauria.app.audio

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class MusicGenEngine(
    private var serverUrl: String = "http://10.0.2.2:8000/api/generate_extension"
) {

    suspend fun generateMusicGenExtension(
        audioPromptBytes: ByteArray,
        genrePrompt: String = "Energetic EDM track continuation with synth lead and heavy bass",
        durationSeconds: Float = 10.0f
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val audioPromptBase64 = Base64.encodeToString(audioPromptBytes, Base64.NO_WRAP)

            val payload = JSONObject().apply {
                put("audio_prompt_base64", audioPromptBase64)
                put("text_prompt", genrePrompt)
                put("duration_seconds", durationSeconds.toDouble())
                put("model_name", "facebook/musicgen-small")
            }

            val url = URL(serverUrl)
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                doOutput = true
                connectTimeout = 15000
                readTimeout = 60000
            }

            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(payload.toString())
                writer.flush()
            }

            val responseCode = connection.responseCode
            if (responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(connection.inputStream))
                val responseStr = reader.use { it.readText() }
                val jsonResp = JSONObject(responseStr)
                val wavBase64 = jsonResp.getString("audio_wav_base64")
                Result.success(wavBase64)
            } else {
                Result.failure(Exception("Server returned HTTP $responseCode"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
