using UnityEngine;

/// <summary>
/// Real-time microphone RMS level. Renamed from MicrophoneListener to avoid clashing with UnityEngine.MicrophoneListener (audio spatializer type).
/// </summary>
public class MicrophoneNoiseListener : MonoBehaviour
{
    [Header("Microphone Settings")]
    public float updateInterval = 0.1f;
    public float noiseThreshold = 0.02f;
    public float loudThreshold = 0.08f;
    [Range(0.001f, 1f)] public float sensitivityMultiplier = 1f;

    AudioClip _micClip;
    string _micDevice;
    float _timer;
    int _sampleWindow = 256;

    public float CurrentNoiseLevel { get; private set; }
    public bool IsLoud => CurrentNoiseLevel > loudThreshold;
    public bool IsAudible => CurrentNoiseLevel > noiseThreshold;
    public bool MicrophoneAvailable { get; private set; }

    void Start()
    {
        if (Microphone.devices.Length == 0)
        {
            MicrophoneAvailable = false;
            Debug.LogWarning("[Hollow] No microphone devices found.");
            return;
        }

        MicrophoneAvailable = true;
        _micDevice = Microphone.devices[0];
        // Longer buffer reduces ring-buffer edge cases; GetData must not run until the buffer has samples.
        _micClip = Microphone.Start(_micDevice, true, 2, 44100);
        if (_micClip == null || _micClip.samples < _sampleWindow)
        {
            MicrophoneAvailable = false;
            Debug.LogWarning("[Hollow] Microphone failed to start or clip has no samples.");
        }
    }

    void Update()
    {
        if (GameStateManager.Instance != null && GameStateManager.Instance.IsLevelComplete)
            return;
        if (!MicrophoneAvailable || _micClip == null)
            return;

        _timer += Time.deltaTime;
        if (_timer < updateInterval)
            return;
        _timer = 0f;

        CurrentNoiseLevel = GetRmsLevel() * sensitivityMultiplier;

        if (NoiseSystem.Instance != null && IsAudible)
        {
            NoiseSystem.Instance.EmitNoise(
                transform.position,
                CurrentNoiseLevel * 100f,
                NoiseType.Microphone);
        }
    }

    float GetRmsLevel()
    {
        if (_micClip == null || _micClip.samples < _sampleWindow)
            return 0f;

        if (!Microphone.IsRecording(_micDevice))
            return 0f;

        var pos = Microphone.GetPosition(_micDevice);
        if (pos <= 0 || pos < _sampleWindow)
            return 0f;

        var micPos = pos - _sampleWindow;
        var samples = new float[_sampleWindow];

        if (micPos + _sampleWindow <= _micClip.samples)
        {
            if (!_micClip.GetData(samples, micPos))
                return 0f;
        }
        else
        {
            var first = _micClip.samples - micPos;
            if (first <= 0)
                return 0f;
            var tailLen = _sampleWindow - first;
            var head = new float[first];
            if (!_micClip.GetData(head, micPos))
                return 0f;
            System.Array.Copy(head, 0, samples, 0, first);
            if (tailLen > 0)
            {
                var tail = new float[tailLen];
                if (!_micClip.GetData(tail, 0))
                    return 0f;
                System.Array.Copy(tail, 0, samples, first, tailLen);
            }
        }

        var sum = 0f;
        foreach (var s in samples)
            sum += s * s;

        return Mathf.Sqrt(sum / samples.Length);
    }

    void OnDestroy()
    {
        if (!MicrophoneAvailable || string.IsNullOrEmpty(_micDevice))
            return;
        Microphone.End(_micDevice);
    }
}
