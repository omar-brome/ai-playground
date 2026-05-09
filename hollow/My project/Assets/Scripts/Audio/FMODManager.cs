using UnityEngine;

#if HOLLOW_FMOD
using FMOD.Studio;
using FMODUnity;

public class FMODManager : MonoBehaviour
{
    public static FMODManager Instance { get; private set; }

    [Header("FMOD Events")]
    public EventReference ambienceEvent;
    public EventReference monsterStingerEvent;
    public EventReference heartbeatEvent;
    public EventReference jumpScareEvent;

    EventInstance _ambienceInstance;
    EventInstance _heartbeatInstance;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    void Start()
    {
        _ambienceInstance = RuntimeManager.CreateInstance(ambienceEvent);
        _ambienceInstance.start();

        _heartbeatInstance = RuntimeManager.CreateInstance(heartbeatEvent);
        _heartbeatInstance.start();
    }

    public void OnMonsterStateChange(MonsterState state)
    {
        var tension = state switch
        {
            MonsterState.Patrolling => 0.1f,
            MonsterState.Investigating => 0.4f,
            MonsterState.Stalking => 0.7f,
            MonsterState.Searching => 0.5f,
            MonsterState.CheckingSpots => 0.6f,
            MonsterState.Hunting => 1.0f,
            _ => 0.1f
        };

        _ambienceInstance.setParameterByName("tension", tension);

        if (state == MonsterState.Hunting)
            RuntimeManager.PlayOneShot(monsterStingerEvent);
    }

    public void SetMonsterDistance(float normalizedDist)
    {
        _ambienceInstance.setParameterByName("monsterDist", normalizedDist);
        _heartbeatInstance.setParameterByName("monsterDist", normalizedDist);
    }

    public void SetSanity(float sanity01)
    {
        _ambienceInstance.setParameterByName("sanity", sanity01);
    }

    public void PlayJumpScare()
    {
        RuntimeManager.PlayOneShot(jumpScareEvent);
    }

    void OnDestroy()
    {
        _ambienceInstance.stop(FMOD.Studio.STOP_MODE.IMMEDIATE);
        _ambienceInstance.release();
        _heartbeatInstance.stop(FMOD.Studio.STOP_MODE.IMMEDIATE);
        _heartbeatInstance.release();
    }
}
#else

public class FMODManager : MonoBehaviour
{
    public static FMODManager Instance { get; private set; }

    [Header("Define HOLLOW_FMOD after importing FMOD Unity Integration")]
    public bool logStateChanges;

    void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    public void OnMonsterStateChange(MonsterState state)
    {
        if (logStateChanges)
            Debug.Log($"[FMOD stub] Monster state: {state}");
    }

    public void SetMonsterDistance(float normalizedDist)
    {
        if (logStateChanges)
            Debug.Log($"[FMOD stub] monsterDist: {normalizedDist:0.00}");
    }

    public void SetSanity(float sanity01)
    {
        if (logStateChanges)
            Debug.Log($"[FMOD stub] sanity: {sanity01:0.00}");
    }

    public void PlayJumpScare()
    {
        if (logStateChanges)
            Debug.Log("[FMOD stub] jump scare");
    }
}
#endif
