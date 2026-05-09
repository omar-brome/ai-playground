using UnityEngine;

/// <summary>
/// Audio sting + local light pulse when the monster shifts to more dangerous states.
/// </summary>
public class MonsterTelegraph : MonoBehaviour
{
    public MonsterBrain brain;

    Light _pulse;
    AudioSource _sting;
    MonsterState _last;
    float _pulseDecay;

    void Awake()
    {
        if (brain == null)
            brain = GetComponent<MonsterBrain>();

        var lightGo = new GameObject("TelegraphLight");
        lightGo.transform.SetParent(transform, false);
        lightGo.transform.localPosition = new Vector3(0f, 1.8f, 0f);
        _pulse = lightGo.AddComponent<Light>();
        _pulse.type = LightType.Point;
        _pulse.range = 22f;
        _pulse.intensity = 0f;
        _pulse.color = new Color(0.35f, 0.55f, 1f);

        _sting = gameObject.AddComponent<AudioSource>();
        _sting.spatialBlend = 1f;
        _sting.minDistance = 2f;
        _sting.maxDistance = 35f;
        _sting.rolloffMode = AudioRolloffMode.Linear;
    }

    void Start()
    {
        if (brain != null)
            _last = brain.currentState;
    }

    void Update()
    {
        if (brain == null || GameStateManager.Instance != null && GameStateManager.Instance.IsLevelComplete)
            return;

        if (brain.currentState != _last)
        {
            OnStateChanged(_last, brain.currentState);
            _last = brain.currentState;
        }

        if (_pulse != null)
        {
            _pulseDecay = Mathf.MoveTowards(_pulseDecay, 0f, Time.deltaTime * 3.2f);
            _pulse.intensity = _pulseDecay;
        }
    }

    void OnStateChanged(MonsterState from, MonsterState to)
    {
        switch (to)
        {
            case MonsterState.Investigating:
                _pulse.color = new Color(0.35f, 0.55f, 1f);
                _pulseDecay = 2.2f;
                PlaySting(420f, 0.22f);
                break;
            case MonsterState.Hunting:
                _pulse.color = new Color(1f, 0.2f, 0.15f);
                _pulseDecay = 4.5f;
                PlaySting(180f, 0.35f);
                break;
            case MonsterState.Searching:
                _pulse.color = new Color(0.7f, 0.5f, 0.2f);
                _pulseDecay = 1.4f;
                PlaySting(300f, 0.12f);
                break;
        }
    }

    void PlaySting(float freqHz, float volume)
    {
        var clip = ProceduralAudio.ShortSting(0.14f, 44100, freqHz);
        _sting.PlayOneShot(clip, volume);
        Destroy(clip, clip.length + 0.05f);
    }
}
