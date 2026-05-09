using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 4f;
    public float sprintSpeedMultiplier = 1.65f;
    public float crouchSpeedMultiplier = 0.45f;
    public float lookSensitivity = 0.12f;
    [Tooltip("Child transform for vertical look (e.g. camera arm).")]
    public Transform cameraPivot;

    const float StandHeight = 1.8f;
    const float StandCenterY = 0.9f;
    const float CrouchHeight = 1.15f;
    const float CrouchCenterY = 0.575f;

    float _pitch;
    CharacterController _cc;

    public bool IsCrouching { get; private set; }
    public bool IsSprinting { get; private set; }

    public float FootstepInterval { get; private set; } = 0.45f;
    public float FootstepNoiseIntensity { get; private set; } = 1f;
    public float FootstepVolumeMultiplier { get; private set; } = 1f;

    void Awake()
    {
        _cc = GetComponent<CharacterController>();
        _cc.height = StandHeight;
        _cc.center = new Vector3(0f, StandCenterY, 0f);
    }

    void Update()
    {
        if (GameStateManager.Instance != null && GameStateManager.Instance.IsLevelComplete)
            return;
        if (GameStateManager.Instance != null && GameStateManager.Instance.IsPaused)
            return;

        var ph = GetComponent<PlayerHiding>();
        if (ph != null && ph.IsHiding)
            return;

        var kb = Keyboard.current;
        var mouse = Mouse.current;
        if (kb == null)
            return;

        var move = Vector2.zero;
        if (kb.wKey.isPressed || kb.upArrowKey.isPressed)
            move.y += 1f;
        if (kb.sKey.isPressed || kb.downArrowKey.isPressed)
            move.y -= 1f;
        if (kb.dKey.isPressed || kb.rightArrowKey.isPressed)
            move.x += 1f;
        if (kb.aKey.isPressed || kb.leftArrowKey.isPressed)
            move.x -= 1f;

        var forward = transform.forward;
        forward.y = 0f;
        forward.Normalize();
        var right = transform.right;
        right.y = 0f;
        right.Normalize();
        var wish = forward * move.y + right * move.x;
        if (wish.sqrMagnitude > 1e-4f)
            wish.Normalize();

        var moving = wish.sqrMagnitude > 0.1f;
        IsCrouching = kb.leftCtrlKey.isPressed;
        IsSprinting = !IsCrouching && moving && kb.leftShiftKey.isPressed;

        _cc.height = Mathf.MoveTowards(_cc.height, IsCrouching ? CrouchHeight : StandHeight, Time.deltaTime * 5f);
        var targetCy = IsCrouching ? CrouchCenterY : StandCenterY;
        _cc.center = new Vector3(0f, Mathf.MoveTowards(_cc.center.y, targetCy, Time.deltaTime * 5f), 0f);

        var spd = moveSpeed;
        if (IsCrouching)
            spd *= crouchSpeedMultiplier;
        else if (IsSprinting)
            spd *= sprintSpeedMultiplier;

        _cc.SimpleMove(wish * spd);

        if (IsCrouching)
        {
            FootstepInterval = 0.62f;
            FootstepNoiseIntensity = 0.36f;
            FootstepVolumeMultiplier = 0.5f;
        }
        else if (IsSprinting)
        {
            FootstepInterval = 0.28f;
            FootstepNoiseIntensity = 1.72f;
            FootstepVolumeMultiplier = 1.38f;
        }
        else
        {
            FootstepInterval = 0.45f;
            FootstepNoiseIntensity = 1f;
            FootstepVolumeMultiplier = 1f;
        }

        if (mouse != null)
        {
            if (mouse.leftButton.wasPressedThisFrame)
                Cursor.lockState = CursorLockMode.Locked;

            if (Cursor.lockState == CursorLockMode.Locked)
            {
                var delta = mouse.delta.ReadValue();
                transform.Rotate(0f, delta.x * lookSensitivity, 0f);
                if (cameraPivot != null)
                {
                    _pitch -= delta.y * lookSensitivity;
                    _pitch = Mathf.Clamp(_pitch, -88f, 88f);
                    cameraPivot.localEulerAngles = new Vector3(_pitch, 0f, 0f);
                }
            }
        }

        if (kb.escapeKey.wasPressedThisFrame)
        {
            var gsm = GameStateManager.Instance;
            if (gsm == null)
                return;
            var next = !gsm.IsPaused;
            gsm.SetPaused(next);
            Cursor.lockState = next ? CursorLockMode.None : CursorLockMode.Locked;
        }
    }
}
