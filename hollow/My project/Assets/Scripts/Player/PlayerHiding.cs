using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(CharacterController))]
public class PlayerHiding : MonoBehaviour
{
    public float discoveryDistance = 2.5f;
    public float interactRadius = 1.6f;

    public bool IsHiding { get; private set; }

    CharacterController _cc;
    HidingSpot _nearbySpot;
    HidingSpot _activeSpot;
    Vector3 _savedPos;
    Quaternion _savedRot;

    readonly Collider[] _overlap = new Collider[12];

    void Awake()
    {
        _cc = GetComponent<CharacterController>();
    }

    void Update()
    {
        if (GameStateManager.Instance != null && GameStateManager.Instance.IsLevelComplete)
            return;

        RefreshNearbySpot();

        var kb = Keyboard.current;
        if (kb == null)
            return;

        if (IsHiding)
        {
            if (kb.eKey.wasPressedThisFrame)
                ExitHide();
            return;
        }

        if (_nearbySpot != null && kb.eKey.wasPressedThisFrame)
            EnterHide(_nearbySpot);
    }

    void RefreshNearbySpot()
    {
        _nearbySpot = null;
        var center = transform.position + Vector3.up * 0.5f;
        var n = Physics.OverlapSphereNonAlloc(center, interactRadius, _overlap, ~0, QueryTriggerInteraction.Collide);
        for (var i = 0; i < n; i++)
        {
            var c = _overlap[i];
            if (c == null)
                continue;
            var hs = c.GetComponentInParent<HidingSpot>();
            if (hs != null)
            {
                _nearbySpot = hs;
                return;
            }
        }
    }

    void EnterHide(HidingSpot spot)
    {
        IsHiding = true;
        _activeSpot = spot;
        _savedPos = transform.position;
        _savedRot = transform.rotation;
        _cc.enabled = false;

        var hp = spot.hidePosition != null ? spot.hidePosition : spot.transform;
        transform.SetPositionAndRotation(hp.position, hp.rotation);
        spot.PlayerEntered();
        FindFirstObjectByType<AdaptiveDifficulty>()?.OnPlayerHid();
    }

    public void ExitHide()
    {
        if (!IsHiding)
            return;
        IsHiding = false;
        _activeSpot?.PlayerLeft();
        _activeSpot = null;
        transform.SetPositionAndRotation(_savedPos, _savedRot);
        _cc.enabled = true;
    }

    public void NotifyDiscoveredByMonster(MonsterBrain monster)
    {
        if (!IsHiding || _activeSpot == null)
            return;
        _activeSpot.PlayerDiscovered(monster);
        ExitHide();
    }
}
