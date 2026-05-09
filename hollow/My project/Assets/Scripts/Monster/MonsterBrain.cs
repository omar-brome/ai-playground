using UnityEngine;

public class MonsterBrain : MonoBehaviour
{
    [Header("References")]
    public MonsterNavigation navigation;
    public MonsterSenses senses;
    public MonsterMemory memory;
    public MonsterAnimator animator;
    [Tooltip("Player's microphone component (assign from Player).")]
    public MicrophoneNoiseListener mic;
    public AdaptiveDifficulty difficulty;

    [Header("ML-Agents modulation")]
    [Range(-0.25f, 0.25f)] public float mlAggressionDelta;
    [Range(-0.25f, 0.25f)] public float mlIntelligenceDelta;
    [Range(0f, 2f)] public float mlSpotCheckPriority = 1f;

    [Header("State")]
    public MonsterState currentState = MonsterState.Patrolling;

    [Header("Behavior Weights")]
    [Range(0f, 1f)] public float aggressionLevel = 0.5f;
    [Range(0f, 1f)] public float intelligenceLevel;

    [Header("Combat feel")]
    [Tooltip("Seconds after entering Hunting where the creature uses walk speed before full sprint.")]
    public float huntWindupSeconds = 0.55f;
    [Tooltip("Planar distance to player to register a catch (lose condition).")]
    public float catchDistance = 1.5f;

    float _stateTimer;
    float _huntWindupEnd = -1f;
    Transform _player;

    void Start()
    {
        var p = GameObject.FindGameObjectWithTag("Player");
        if (p != null)
            _player = p.transform;
        TransitionTo(MonsterState.Patrolling);
    }

    void Update()
    {
        if (GameStateManager.Instance != null && GameStateManager.Instance.IsLevelComplete)
            return;

        if (_player == null)
        {
            var p = GameObject.FindGameObjectWithTag("Player");
            if (p != null)
                _player = p.transform;
            return;
        }

        _stateTimer += Time.deltaTime;

        switch (currentState)
        {
            case MonsterState.Patrolling:
                UpdatePatrolling();
                break;
            case MonsterState.Investigating:
                UpdateInvestigating();
                break;
            case MonsterState.Hunting:
                UpdateHunting();
                break;
            case MonsterState.Searching:
                UpdateSearching();
                break;
            case MonsterState.Stalking:
                UpdateStalking();
                break;
            case MonsterState.CheckingSpots:
                UpdateCheckingSpots();
                break;
        }

        AdaptBehavior();
        UpdateAudioDistance();
    }

    void UpdatePatrolling()
    {
        navigation?.FollowPatrolRoute();

        if (NoiseSystem.Instance != null &&
            NoiseSystem.Instance.TryGetLoudestNoiseNear(transform.position, 30f, out var noise, out var nStr) &&
            nStr > 0.055f)
        {
            navigation?.SetInvestigateTarget(noise.position);
            TransitionTo(MonsterState.Investigating);
            return;
        }

        TryEngagePlayerFromSight();
    }

    void UpdateInvestigating()
    {
        navigation?.MoveToInvestigateTarget();

        if (senses != null && senses.CanSeePlayer())
        {
            TryEngagePlayerFromSight();
            return;
        }

        if (senses != null && senses.CanHearPlayer())
            navigation?.SetInvestigateTarget(senses.LastHeardPosition);

        var intel = Mathf.Clamp01(intelligenceLevel + mlIntelligenceDelta);
        if (navigation != null && (navigation.ReachedDestination() || _stateTimer > 8f))
        {
            if (intel > 0.4f * mlSpotCheckPriority)
                TransitionTo(MonsterState.CheckingSpots);
            else
                TransitionTo(MonsterState.Patrolling);
        }
    }

    void UpdateHunting()
    {
        navigation?.ChasePlayer(_player.position);
        if (Time.time < _huntWindupEnd)
        {
            navigation?.SetSpeed(MonsterSpeed.Walking);
            animator?.SetSpeed(MonsterSpeed.Walking);
        }
        else
        {
            animator?.SetSpeed(MonsterSpeed.Running);
        }

        var ph = _player.GetComponent<PlayerHiding>();
        var hiding = ph != null && ph.IsHiding;
        if (!hiding)
        {
            var a = transform.position;
            var b = _player.position;
            var planar = new Vector2(a.x - b.x, a.z - b.z).magnitude;
            if (planar < catchDistance)
                GameStateManager.Instance?.RegisterPlayerCaught();
        }

        if (senses != null && !senses.CanSeePlayer())
        {
            memory?.RecordPlayerPosition(_player.position);
            TransitionTo(MonsterState.Searching);
        }
    }

    void UpdateSearching()
    {
        var intel = Mathf.Clamp01(intelligenceLevel + mlIntelligenceDelta);
        var predicted = memory?.PredictPlayerPosition();
        if (predicted.HasValue && intel > 0.3f)
            navigation?.SetInvestigateTarget(predicted.Value);

        if (senses != null && senses.CanSeePlayer())
        {
            TryEngagePlayerFromSight();
            return;
        }

        if (senses != null && senses.CanHearPlayer())
        {
            TransitionTo(MonsterState.Hunting);
            return;
        }

        if (_stateTimer > 15f)
        {
            if (intel > 0.5f * mlSpotCheckPriority)
                TransitionTo(MonsterState.CheckingSpots);
            else
                TransitionTo(MonsterState.Patrolling);
        }
    }

    void UpdateStalking()
    {
        navigation?.StalkPlayer(_player.position);
        animator?.SetSpeed(MonsterSpeed.Creeping);

        if (senses != null && senses.CanSeePlayer())
            TryEngagePlayerFromSight();

        if (senses != null && !senses.CanHearPlayer() && _stateTimer > 5f)
            TransitionTo(MonsterState.Investigating);
    }

    void UpdateCheckingSpots()
    {
        var topSpot = memory?.GetMostSuspiciousSpot();
        if (topSpot == null)
        {
            TransitionTo(MonsterState.Patrolling);
            return;
        }

        navigation?.SetInvestigateTarget(topSpot.position);

        if (navigation != null && navigation.ReachedDestination())
        {
            if (senses != null && senses.CanSeePlayer())
                TryEngagePlayerFromSight();
            else
                topSpot.suspicionWeight *= 0.5f;
        }

        if (_stateTimer > 30f)
            TransitionTo(MonsterState.Patrolling);
    }

    void AdaptBehavior()
    {
        var agg = Mathf.Clamp01(aggressionLevel + mlAggressionDelta);
        intelligenceLevel = Mathf.Clamp01(intelligenceLevel + Time.deltaTime * 0.001f * agg);

        if (mic != null && mic.IsLoud)
            aggressionLevel = Mathf.Clamp01(aggressionLevel + 0.01f * Time.deltaTime * 60f);
    }

    void UpdateAudioDistance()
    {
        if (FMODManager.Instance == null || _player == null)
            return;
        var d = Vector3.Distance(transform.position, _player.position);
        var normalized = Mathf.Clamp01(d / 40f);
        FMODManager.Instance.SetMonsterDistance(normalized);
    }

    public void TransitionTo(MonsterState newState)
    {
        currentState = newState;
        _stateTimer = 0f;
        if (newState == MonsterState.Hunting)
            _huntWindupEnd = Time.time + huntWindupSeconds;
        else
            _huntWindupEnd = -1f;

        animator?.OnStateChange(newState);
        if (newState != MonsterState.Hunting && newState != MonsterState.Stalking)
            navigation?.SetSpeed(MonsterSpeed.Walking);
        FMODManager.Instance?.OnMonsterStateChange(newState);
    }

    public void OnPlayerDiscoveredInHiding(HidingSpot spot)
    {
        memory?.RecordPlayerHiding(spot);
        TransitionTo(MonsterState.Hunting);
    }

    void TryEngagePlayerFromSight()
    {
        if (senses == null || !senses.CanSeePlayer() || _player == null)
            return;
        var ph = _player.GetComponent<PlayerHiding>();
        if (ph != null && ph.IsHiding)
            ph.NotifyDiscoveredByMonster(this);
        else
            TransitionTo(MonsterState.Hunting);
    }
}
