using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerNoise : MonoBehaviour
{
    public float footstepInterval = 0.45f;
    public float footstepRadius = 8f;

    CharacterController _cc;
    float _t;

    void Awake()
    {
        _cc = GetComponent<CharacterController>();
    }

    void Update()
    {
        var ph = GetComponent<PlayerHiding>();
        if (ph != null && ph.IsHiding)
            return;

        if (_cc == null || NoiseSystem.Instance == null)
            return;

        var moving = new Vector3(_cc.velocity.x, 0f, _cc.velocity.z).sqrMagnitude > 0.05f;
        if (!moving)
            return;

        _t += Time.deltaTime;
        if (_t < footstepInterval)
            return;
        _t = 0f;

        NoiseSystem.Instance.EmitNoise(transform.position, footstepRadius, NoiseType.Footstep);
        FindFirstObjectByType<HollowGameplayAudio>()?.PlayFootstep();
    }
}
