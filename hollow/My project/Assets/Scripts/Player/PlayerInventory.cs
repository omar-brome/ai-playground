using UnityEngine;

public class PlayerInventory : MonoBehaviour
{
    public bool hasLighter = true;
    [Range(0f, 1f)] public float batteryLevel = 1f;
    public float batteryDrainPerSecond = 0.02f;

    void Update()
    {
        if (hasLighter && batteryLevel > 0f)
            batteryLevel = Mathf.Max(0f, batteryLevel - batteryDrainPerSecond * Time.deltaTime);
    }
}
