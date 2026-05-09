using UnityEngine;

/// <summary>
/// Minimal procedural audio so the prototype is audible without FMOD or imported clips.
/// </summary>
public class HollowGameplayAudio : MonoBehaviour
{
    public float masterVolume = 0.52f;

    AudioSource _ambience;
    AudioSource _fx;
    AudioClip _footClip;
    float _footstepCd;

    void Awake()
    {
        if (GetComponent<AudioListener>() == null)
            Debug.LogWarning(
                "[Hollow] HollowGameplayAudio expects a Unity AudioListener on this camera. " +
                "Procedural audio uses AudioSources.");

        _ambience = gameObject.AddComponent<AudioSource>();
        _ambience.loop = true;
        _ambience.spatialBlend = 0f;
        _ambience.priority = 0;
        _ambience.volume = masterVolume * 0.42f;
        _ambience.ignoreListenerPause = true;
        _ambience.clip = ProceduralAudio.AmbientHum(3f, 44100);
        _ambience.Play();

        _fx = gameObject.AddComponent<AudioSource>();
        _fx.loop = false;
        _fx.spatialBlend = 0f;
        _fx.priority = 0;
        _fx.ignoreListenerPause = true;
        _footClip = ProceduralAudio.ShortThud(0.07f, 44100);
    }

    float _hiddenMuffle = 1f;

    void Update()
    {
        _footstepCd -= Time.deltaTime;

        var monster = Object.FindAnyObjectByType<MonsterBrain>();
        var player = GameObject.FindGameObjectWithTag("Player");
        if (monster == null || player == null)
            return;

        var d = Vector3.Distance(monster.transform.position, player.transform.position);
        var tension = 1f - Mathf.Clamp01(d / 28f);
        var ph = player.GetComponent<PlayerHiding>();
        var hide = ph != null && ph.IsHiding;
        _hiddenMuffle = Mathf.MoveTowards(_hiddenMuffle, hide ? 0.38f : 1f, Time.deltaTime * 3f);

        _ambience.pitch = Mathf.Lerp(0.92f, 1.08f, tension) * Mathf.Lerp(0.88f, 1f, _hiddenMuffle);
        _ambience.volume = masterVolume * Mathf.Lerp(0.18f, 0.42f, tension) * _hiddenMuffle;
    }

    public void PlayFootstep(float volumeMultiplier = 1f)
    {
        if (_footstepCd > 0f || _footClip == null)
            return;
        _footstepCd = 0.08f;
        var v = masterVolume * 0.62f * Mathf.Clamp(volumeMultiplier, 0.05f, 3f);
        _fx.PlayOneShot(_footClip, v);
    }
}
