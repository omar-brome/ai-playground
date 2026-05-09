using UnityEngine;

/// <summary>Surface-aware footsteps; pair with FMOD events once banks are linked.</summary>
public class FootstepSystem : MonoBehaviour
{
    public void PlayFootstepAt(Vector3 worldPos, string surfaceTag = "default")
    {
        if (FMODManager.Instance != null)
            FMODManager.Instance.SetMonsterDistance(0.5f);
    }
}
