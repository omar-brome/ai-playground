using UnityEngine;

/// <summary>
/// 3D breathing/rumble loop on the creature; loudness shaped by distance to the player.
/// When <c>HOLLOW_FMOD</c> is defined and <see cref="MonsterPresenceAudio.useUnityFallbackWhenFmod"/> is false,
/// disable this component and drive presence from FMOD (see README / FMODProject notes).
/// </summary>
public class MonsterPresenceAudio : MonoBehaviour
{
    [Tooltip("If true, keep this Unity AudioSource even when FMOD is compiled in (useful until monster body event exists).")]
    public bool useUnityFallbackWhenFmod = true;

    public float baseVolume = 0.42f;
    public float minDistance = 2.2f;
    public float maxDistance = 26f;
    [Tooltip("Distance at which extra volume curve reaches ~0 (meters).")]
    public float audibleRange = 30f;
    [Tooltip("Distance at which presence is strongest (meters).")]
    public float closeRange = 5f;

    AudioSource _src;
    Transform _player;

    void Start()
    {
#if HOLLOW_FMOD
        if (!useUnityFallbackWhenFmod)
        {
            enabled = false;
            return;
        }
#endif
        _player = GameObject.FindGameObjectWithTag("Player")?.transform;

        _src = gameObject.AddComponent<AudioSource>();
        _src.clip = ProceduralAudio.MonsterPresenceLoop(3.5f, 44100);
        _src.loop = true;
        _src.spatialBlend = 1f;
        _src.spatialize = false;
        _src.rolloffMode = AudioRolloffMode.Logarithmic;
        _src.minDistance = minDistance;
        _src.maxDistance = maxDistance;
        _src.dopplerLevel = 0f;
        _src.playOnAwake = true;
        _src.priority = 16;
        _src.ignoreListenerPause = true;
        _src.volume = 0f;
        _src.Play();
    }

    void Update()
    {
        if (_src == null)
            return;

        if (GameStateManager.Instance != null && GameStateManager.Instance.IsLevelComplete)
        {
            _src.volume = 0f;
            return;
        }

        if (_player == null)
        {
            _player = GameObject.FindGameObjectWithTag("Player")?.transform;
            if (_player == null)
                return;
        }

        var d = Vector3.Distance(transform.position, _player.position);
        var curve = Mathf.InverseLerp(audibleRange, closeRange, d);
        curve = Mathf.SmoothStep(0.04f, 1f, curve);
        _src.volume = baseVolume * curve;
        _src.pitch = Mathf.Lerp(0.94f, 1.06f, curve);
    }
}
