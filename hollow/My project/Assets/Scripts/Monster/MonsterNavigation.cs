using UnityEngine;
using UnityEngine.AI;

public enum MonsterSpeed
{
    Creeping,
    Walking,
    Running
}

public class MonsterNavigation : MonoBehaviour
{
    public NavMeshAgent agent;
    public Transform[] patrolPoints;

    [Header("Speeds")]
    public float creepSpeed = 1.05f;
    public float walkSpeed = 2.15f;
    public float runSpeed = 4.45f;
    [Tooltip("Max yaw deg/s when updateRotation is off — lets the player break line-of-sight by circling.")]
    public float maxTurnDegreesPerSecond = 95f;

    int _currentPatrolIndex;
    Vector3 _investigateTarget;
    bool _hasInvestigateTarget;

    void Awake()
    {
        if (agent == null)
            agent = GetComponent<NavMeshAgent>();
        if (agent != null)
        {
            agent.speed = walkSpeed;
            agent.updateRotation = false;
            agent.obstacleAvoidanceType = ObstacleAvoidanceType.HighQualityObstacleAvoidance;
        }
    }

    void Update()
    {
        if (agent == null || agent.updateRotation)
            return;

        var planar = agent.velocity;
        planar.y = 0f;
        if (planar.sqrMagnitude < 0.02f)
        {
            planar = agent.destination - transform.position;
            planar.y = 0f;
        }

        if (planar.sqrMagnitude < 0.01f)
            return;

        var target = Quaternion.LookRotation(planar.normalized);
        transform.rotation = Quaternion.RotateTowards(transform.rotation, target,
            maxTurnDegreesPerSecond * Time.deltaTime);
    }

    void Start()
    {
        if (patrolPoints != null && patrolPoints.Length > 0 && agent != null && agent.isOnNavMesh)
            agent.SetDestination(patrolPoints[0].position);
    }

    public void FollowPatrolRoute()
    {
        if (agent == null || patrolPoints == null || patrolPoints.Length == 0)
            return;

        agent.stoppingDistance = 0.35f;

        if (!agent.pathPending && agent.remainingDistance < 1f)
        {
            var prevIdx = _currentPatrolIndex;
            _currentPatrolIndex = (_currentPatrolIndex + 1) % patrolPoints.Length;
            var prev = patrolPoints[prevIdx];
            var next = patrolPoints[_currentPatrolIndex];
            if (prev != null && next != null)
                PatternTracker.Instance?.RegisterPatrolLeg(prev.position, next.position);
            if (next != null)
                agent.SetDestination(next.position);
        }
    }

    public void ChasePlayer(Vector3 playerPos)
    {
        SetSpeed(MonsterSpeed.Running);
        if (agent != null && agent.isOnNavMesh)
        {
            agent.stoppingDistance = 1.05f;
            agent.SetDestination(playerPos);
        }
    }

    public void StalkPlayer(Vector3 playerPos)
    {
        SetSpeed(MonsterSpeed.Creeping);
        var dir = (playerPos - transform.position).normalized;
        var targetPos = playerPos - dir * 3f;
        if (agent != null && agent.isOnNavMesh)
        {
            agent.stoppingDistance = 0.75f;
            agent.SetDestination(targetPos);
        }
    }

    public void SetInvestigateTarget(Vector3 pos)
    {
        _investigateTarget = pos;
        _hasInvestigateTarget = true;
        if (agent != null && agent.isOnNavMesh)
        {
            agent.stoppingDistance = 0.5f;
            agent.SetDestination(pos);
        }
    }

    public void MoveToInvestigateTarget()
    {
        if (agent == null || !_hasInvestigateTarget)
            return;
        if (agent.isOnNavMesh)
        {
            agent.stoppingDistance = 0.5f;
            agent.SetDestination(_investigateTarget);
        }
    }

    public bool ReachedDestination()
    {
        if (agent == null)
            return true;
        return !agent.pathPending && agent.remainingDistance <= agent.stoppingDistance + 0.25f;
    }

    public void SetSpeed(MonsterSpeed speed)
    {
        if (agent == null)
            return;
        agent.speed = speed switch
        {
            MonsterSpeed.Creeping => creepSpeed,
            MonsterSpeed.Walking => walkSpeed,
            MonsterSpeed.Running => runSpeed,
            _ => walkSpeed
        };
    }
}
