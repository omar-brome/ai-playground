using UnityEngine;

public class AdaptiveDifficulty : MonoBehaviour
{
    public MonsterBrain monster;
    public MicrophoneNoiseListener mic;

    [Header("Tracking")]
    public int timesPlayerHidden;
    public int timesPlayerCaught;
    public float totalPlayTime;
    public float avgNoiseLevel;

    [Header("Thresholds")]
    public int hidingThresholdToAdapt = 3;

    float _noiseAccumulator;
    int _noiseSamples;

    void Update()
    {
        totalPlayTime += Time.deltaTime;

        if (mic != null)
        {
            _noiseAccumulator += mic.CurrentNoiseLevel;
            _noiseSamples++;
            if (_noiseSamples > 0)
                avgNoiseLevel = _noiseAccumulator / _noiseSamples;
        }

        if (monster == null)
            return;

        if (avgNoiseLevel < 0.01f && totalPlayTime > 60f)
        {
            monster.aggressionLevel = Mathf.Clamp01(
                monster.aggressionLevel + Time.deltaTime * 0.005f);
        }
    }

    public void OnPlayerHid()
    {
        timesPlayerHidden++;
        if (monster == null)
            return;
        if (timesPlayerHidden % hidingThresholdToAdapt == 0)
        {
            monster.intelligenceLevel = Mathf.Clamp01(
                monster.intelligenceLevel + 0.15f);
        }
    }

    public void OnPlayerCaught()
    {
        timesPlayerCaught++;
        if (monster != null)
            monster.aggressionLevel = Mathf.Clamp01(monster.aggressionLevel - 0.1f);
    }
}
