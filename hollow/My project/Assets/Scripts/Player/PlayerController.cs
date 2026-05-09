using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(CharacterController))]
public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 4f;
    public float lookSensitivity = 0.12f;
    [Tooltip("Child transform for vertical look (e.g. camera arm).")]
    public Transform cameraPivot;

    float _pitch;
    CharacterController _cc;

    void Awake()
    {
        _cc = GetComponent<CharacterController>();
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

        _cc.SimpleMove(wish * moveSpeed);

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
