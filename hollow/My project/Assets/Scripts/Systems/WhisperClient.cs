using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;

[Serializable]
public class WhisperResponse
{
    public string text;
    public string language;
}

public class WhisperClient : MonoBehaviour
{
    public string serverUrl = "http://localhost:5000/transcribe";
    public int maxRecordSeconds = 3;
    public int recordFrequency = 16000;

    public IEnumerator TranscribeAudioClip(AudioClip clip, Action<string> onResult)
    {
        var wav = WavUtility.FromAudioClip(clip, out var err);
        if (!string.IsNullOrEmpty(err) || wav.Length == 0)
        {
            onResult?.Invoke(null);
            yield break;
        }

        var form = new WWWForm();
        form.AddBinaryData("audio", wav, "recording.wav", "audio/wav");

        using var req = UnityWebRequest.Post(serverUrl, form);
        yield return req.SendWebRequest();

        if (req.result != UnityWebRequest.Result.Success)
        {
            onResult?.Invoke(null);
            yield break;
        }

        var json = JsonUtility.FromJson<WhisperResponse>(req.downloadHandler.text);
        onResult?.Invoke(json?.text);

        if (!string.IsNullOrEmpty(json?.text) && json.text.Length > 3 && NoiseSystem.Instance != null)
            NoiseSystem.Instance.EmitNoise(transform.position, 40f, NoiseType.Microphone);
    }

    public void RequestTranscriptionFromMicrophone(MonoBehaviour runner, Action<string> onResult)
    {
        if (Microphone.devices.Length == 0)
        {
            onResult?.Invoke(null);
            return;
        }

        var dev = Microphone.devices[0];
        var clip = Microphone.Start(dev, false, maxRecordSeconds, recordFrequency);
        runner.StartCoroutine(RecordThenTranscribe(dev, clip, onResult));
    }

    IEnumerator RecordThenTranscribe(string device, AudioClip clip, Action<string> onResult)
    {
        yield return new WaitForSeconds(maxRecordSeconds);
        Microphone.End(device);
        yield return TranscribeAudioClip(clip, onResult);
        Destroy(clip);
    }
}
