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
        _micClip = Microphone.Start(_micDevice, true, 1, 44100);
    }

    void Update()
    {
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
        var samples = new float[_sampleWindow];
        var micPos = Microphone.GetPosition(_micDevice) - _sampleWindow;
        if (micPos < 0)
            return 0f;

        _micClip.GetData(samples, micPos);

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
