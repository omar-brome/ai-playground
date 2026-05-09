using UnityEngine;

[RequireComponent(typeof(CharacterController))]
public class PlayerNoise : MonoBehaviour
{
    public float footstepInterval = 0.45f;
    public float footstepRadius = 8f;

    CharacterController _cc;
    PlayerController _pc;
    float _t;

    void Awake()
    {
        _cc = GetComponent<CharacterController>();
        _pc = GetComponent<PlayerController>();
    }

    void Update()
    {
        if (GameStateManager.Instance != null && GameStateManager.Instance.IsLevelComplete)
            return;
        var ph = GetComponent<PlayerHiding>();
        if (ph != null && ph.IsHiding)
            return;

        if (_cc == null || NoiseSystem.Instance == null)
            return;

        var moving = new Vector3(_cc.velocity.x, 0f, _cc.velocity.z).sqrMagnitude > 0.05f;
        if (!moving)
            return;

        var interval = _pc != null ? _pc.FootstepInterval : footstepInterval;
        var intensity = _pc != null ? _pc.FootstepNoiseIntensity : 1f;
        var volMul = _pc != null ? _pc.FootstepVolumeMultiplier : 1f;
        var radius = footstepRadius * Mathf.Lerp(0.48f, 1.55f, Mathf.InverseLerp(0.36f, 1.72f, intensity));

        _t += Time.deltaTime;
        if (_t < interval)
            return;
        _t = 0f;

        NoiseSystem.Instance.EmitNoise(transform.position, radius, NoiseType.Footstep, intensity);
        Object.FindAnyObjectByType<HollowGameplayAudio>()?.PlayFootstep(volMul);
    }
}
