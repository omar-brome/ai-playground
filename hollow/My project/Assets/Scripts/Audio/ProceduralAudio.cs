using UnityEngine;

/// <summary>
/// Tiny synthetic clips for mood SFX before imported audio / FMOD. Safe to call from any thread? No — use main thread only.
/// </summary>
public static class ProceduralAudio
{
    public static AudioClip AmbientHum(float duration, int hz)
    {
        var n = Mathf.CeilToInt(duration * hz);
        var samples = new float[n];
        var rng = new System.Random(42);
        for (var i = 0; i < n; i++)
        {
            var t = (float)i / hz;
            var hum = Mathf.Sin(t * Mathf.PI * 2f * 55f) * 0.12f;
            var hum2 = Mathf.Sin(t * Mathf.PI * 2f * 110f) * 0.06f;
            var noise = (float)(rng.NextDouble() * 2.0 - 1.0) * 0.04f;
            samples[i] = hum + hum2 + noise;
        }

        var clip = AudioClip.Create("hollow_amb", n, 1, hz, false);
        clip.SetData(samples, 0);
        return clip;
    }

    /// <summary>Lower, calmer drone for the main menu (2D).</summary>
    public static AudioClip MenuAmbience(float duration, int hz)
    {
        var n = Mathf.CeilToInt(duration * hz);
        var samples = new float[n];
        var rng = new System.Random(91);
        for (var i = 0; i < n; i++)
        {
            var t = (float)i / hz;
            var hum = Mathf.Sin(t * Mathf.PI * 2f * 41f) * 0.08f;
            var hum2 = Mathf.Sin(t * Mathf.PI * 2f * 82f) * 0.035f;
            var noise = (float)(rng.NextDouble() * 2.0 - 1.0) * 0.025f;
            samples[i] = hum + hum2 + noise;
        }

        var clip = AudioClip.Create("hollow_menu_amb", n, 1, hz, false);
        clip.SetData(samples, 0);
        return clip;
    }

    /// <summary>Low breathing + rumble loop for 3D monster presence (Unity AudioSource).</summary>
    public static AudioClip MonsterPresenceLoop(float duration, int hz)
    {
        var n = Mathf.CeilToInt(duration * hz);
        var samples = new float[n];
        var rng = new System.Random(7);
        for (var i = 0; i < n; i++)
        {
            var t = (float)i / hz;
            var breath = Mathf.Sin(t * Mathf.PI * 2f * 0.32f);
            var rumble = Mathf.Sin(t * Mathf.PI * 2f * 46f) * 0.14f;
            var rumble2 = Mathf.Sin(t * Mathf.PI * 2f * 71f) * 0.07f;
            var grit = Mathf.Sin(t * Mathf.PI * 2f * 120f) * 0.02f;
            var noise = (float)(rng.NextDouble() * 2.0 - 1.0) * 0.018f;
            var am = 0.5f + 0.5f * breath;
            samples[i] = (rumble + rumble2 + grit + noise) * am;
        }

        var clip = AudioClip.Create("hollow_monster_presence", n, 1, hz, false);
        clip.SetData(samples, 0);
        return clip;
    }

    public static AudioClip ShortThud(float duration, int hz)
    {
        var n = Mathf.Max(8, Mathf.CeilToInt(duration * hz));
        var samples = new float[n];
        for (var i = 0; i < n; i++)
        {
            var e = 1f - (float)i / n;
            var ping = Mathf.Sin((float)i / hz * Mathf.PI * 2f * 180f) * e * e;
            samples[i] = ping * 0.35f;
        }

        var clip = AudioClip.Create("hollow_step", n, 1, hz, false);
        clip.SetData(samples, 0);
        return clip;
    }

    public static AudioClip ShortSting(float duration, int sampleRate, float freqHz)
    {
        var n = Mathf.Max(16, Mathf.CeilToInt(duration * sampleRate));
        var samples = new float[n];
        for (var i = 0; i < n; i++)
        {
            var t = (float)i / sampleRate;
            var e = 1f - (float)i / n;
            var wobble = Mathf.Sin(t * Mathf.PI * 2f * (freqHz * 0.5f + 40f));
            samples[i] = Mathf.Sin(t * Mathf.PI * 2f * freqHz) * e * e * (0.5f + 0.5f * wobble);
        }

        var clip = AudioClip.Create("hollow_sting", n, 1, sampleRate, false);
        clip.SetData(samples, 0);
        return clip;
    }
}
