using UnityEngine;

#if HOLLOW_FMOD
using System;
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
    bool _loopingEventsReady;

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
        if (!HollowAudioPreferences.UseFmodEngine)
            return;

        if (ambienceEvent.IsNull || heartbeatEvent.IsNull)
        {
            Debug.LogWarning(
                "[Hollow] FMOD: EventReferences are empty on this FMODManager. " +
                "The level bootstrap spawns a blank manager unless you assign **Fmod Manager Prefab** on `_HollowLevel` → HollowLevelBootstrap (prefab root must have FMODManager + filled events). " +
                "Also export banks into the project (see FMOD Settings → Bank path) so .bank files exist. " +
                "Until then, turn **FMOD Studio audio** off on the main menu and use Unity procedural audio.");
            return;
        }

        try
        {
            _ambienceInstance = RuntimeManager.CreateInstance(ambienceEvent);
        }
        catch (Exception ex)
        {
            Debug.LogWarning($"[Hollow] FMOD ambience CreateInstance failed: {ex.Message}");
            return;
        }

        try
        {
            _heartbeatInstance = RuntimeManager.CreateInstance(heartbeatEvent);
        }
        catch (Exception ex)
        {
            Debug.LogWarning($"[Hollow] FMOD heartbeat CreateInstance failed: {ex.Message}");
            ReleaseIfValid(ref _ambienceInstance);
            return;
        }

        if (!_ambienceInstance.isValid() || !_heartbeatInstance.isValid())
        {
            Debug.LogWarning("[Hollow] FMODManager: event instances are invalid (missing bank or renamed event?).");
            ReleaseIfValid(ref _ambienceInstance);
            ReleaseIfValid(ref _heartbeatInstance);
            return;
        }

        _ambienceInstance.start();
        _heartbeatInstance.start();
        _loopingEventsReady = true;
    }

    static void ReleaseIfValid(ref EventInstance instance)
    {
        if (!instance.isValid())
            return;
        instance.stop(STOP_MODE.IMMEDIATE);
        instance.release();
    }

    public void OnMonsterStateChange(MonsterState state)
    {
        if (!_loopingEventsReady)
            return;

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

        if (state == MonsterState.Hunting && !monsterStingerEvent.IsNull)
            RuntimeManager.PlayOneShot(monsterStingerEvent);
    }

    public void SetMonsterDistance(float normalizedDist)
    {
        if (!_loopingEventsReady)
            return;
        _ambienceInstance.setParameterByName("monsterDist", normalizedDist);
        _heartbeatInstance.setParameterByName("monsterDist", normalizedDist);
    }

    public void SetSanity(float sanity01)
    {
        if (!_loopingEventsReady)
            return;
        _ambienceInstance.setParameterByName("sanity", sanity01);
    }

    public void PlayJumpScare()
    {
        if (!jumpScareEvent.IsNull)
            RuntimeManager.PlayOneShot(jumpScareEvent);
    }

    void OnDestroy()
    {
        ReleaseIfValid(ref _ambienceInstance);
        ReleaseIfValid(ref _heartbeatInstance);
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
