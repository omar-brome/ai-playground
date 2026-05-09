using UnityEngine;
using UnityEngine.InputSystem;

/// <summary>
/// Flashlight on the player camera: F toggles while battery remains; drains only when on.
/// </summary>
public class PlayerInventory : MonoBehaviour
{
    public bool hasFlashlight = true;
    [Range(0f, 1f)] public float batteryLevel = 1f;
    public float batteryDrainPerSecondWhileOn = 0.042f;

    Light _flashlight;

    void Awake()
    {
        _flashlight = GetComponentInChildren<Light>(true);
        if (_flashlight != null)
            _flashlight.enabled = false;
    }

    void Update()
    {
        if (GameStateManager.Instance != null &&
            (GameStateManager.Instance.IsLevelComplete || GameStateManager.Instance.IsPaused))
            return;

        if (!hasFlashlight || _flashlight == null)
            return;

        var kb = Keyboard.current;
        if (kb != null && kb.fKey.wasPressedThisFrame && batteryLevel > 0f)
            _flashlight.enabled = !_flashlight.enabled;

        if (_flashlight.enabled && batteryLevel > 0f)
            batteryLevel = Mathf.Max(0f, batteryLevel - batteryDrainPerSecondWhileOn * Time.deltaTime);

        if (batteryLevel <= 0f)
            _flashlight.enabled = false;
    }

    public bool FlashlightOn => _flashlight != null && _flashlight.enabled;
    public float Battery01 => batteryLevel;
}
