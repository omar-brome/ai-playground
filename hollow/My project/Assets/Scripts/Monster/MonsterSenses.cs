using UnityEngine;

public class MonsterSenses : MonoBehaviour
{
    [Header("Sight")]
    public float sightRange = 15f;
    public float sightAngle = 90f;
    public LayerMask obstacleMask;

    [Header("Hearing")]
    public float hearingRange = 25f;
    [Tooltip("0–1; footsteps below this strength are ignored so the monster does not re-hunt on every step.")]
    [Range(0.02f, 0.5f)] public float minHearStrength = 0.14f;

    public Vector3 LastHeardPosition { get; private set; }
    public Vector3 LastSeenPosition { get; private set; }

    Transform _player;

    void Start()
    {
        var p = GameObject.FindGameObjectWithTag("Player");
        if (p != null)
            _player = p.transform;
    }

    public bool CanSeePlayer()
    {
        if (_player == null)
            return false;

        var dirToPlayer = _player.position - transform.position;
        var dist = dirToPlayer.magnitude;

        var ph = _player.GetComponent<PlayerHiding>();
        if (ph != null && ph.IsHiding)
        {
            if (dist > ph.discoveryDistance)
                return false;
            LastSeenPosition = _player.position;
            return true;
        }

        if (dist > sightRange)
            return false;

        var angle = Vector3.Angle(transform.forward, dirToPlayer);
        if (angle > sightAngle / 2f)
            return false;

        var origin = transform.position + Vector3.up;
        if (Physics.Raycast(origin, dirToPlayer.normalized, out var hit, dist, obstacleMask,
                QueryTriggerInteraction.Ignore))
        {
            if (hit.transform != _player && !hit.transform.IsChildOf(_player))
                return false;
        }

        LastSeenPosition = _player.position;
        return true;
    }

    public bool CanHearPlayer()
    {
        if (NoiseSystem.Instance == null)
            return false;

        if (!NoiseSystem.Instance.TryGetLoudestNoiseNear(transform.position, hearingRange, out var noise,
                out var strength))
            return false;

        if (strength < minHearStrength)
            return false;

        LastHeardPosition = noise.position;
        return true;
    }

    void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(transform.position, sightRange);
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(transform.position, hearingRange);
    }
}
