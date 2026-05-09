using UnityEngine;

/// <summary>
/// Minimal procedural audio so the prototype is audible without FMOD or imported clips.
/// </summary>
public class HollowGameplayAudio : MonoBehaviour
{
    public float masterVolume = 0.35f;

    AudioSource _ambience;
    AudioSource _fx;
    AudioClip _footClip;
    float _footstepCd;

    void Awake()
    {
        _ambience = gameObject.AddComponent<AudioSource>();
        _ambience.loop = true;
        _ambience.spatialBlend = 0f;
        _ambience.volume = masterVolume * 0.25f;
        _ambience.clip = ProceduralAudio.AmbientHum(3f, 44100);
        _ambience.Play();

        _fx = gameObject.AddComponent<AudioSource>();
        _fx.loop = false;
        _fx.spatialBlend = 0f;
        _footClip = ProceduralAudio.ShortThud(0.07f, 44100);
    }

    void Update()
    {
        _footstepCd -= Time.deltaTime;

        var monster = FindFirstObjectByType<MonsterBrain>();
        var player = GameObject.FindGameObjectWithTag("Player");
        if (monster == null || player == null)
            return;

        var d = Vector3.Distance(monster.transform.position, player.transform.position);
        var tension = 1f - Mathf.Clamp01(d / 28f);
        _ambience.pitch = Mathf.Lerp(0.92f, 1.08f, tension);
        _ambience.volume = masterVolume * Mathf.Lerp(0.12f, 0.32f, tension);
    }

    public void PlayFootstep()
    {
        if (_footstepCd > 0f || _footClip == null)
            return;
        _footstepCd = 0.08f;
        _fx.PlayOneShot(_footClip, masterVolume * 0.55f);
    }
}

static class ProceduralAudio
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
}
