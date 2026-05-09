using UnityEngine;

/// <summary>Placeholder for sanity-driven post FX; drive URP Volume weight from here later.</summary>
public class SanityEffect : MonoBehaviour
{
    [Range(0f, 1f)] public float sanity = 0.85f;
    public float drainNearMonsterPerSecond = 0.03f;

    void Update()
    {
        if (GameStateManager.Instance != null && GameStateManager.Instance.IsLevelComplete)
            return;
        var monster = FindFirstObjectByType<MonsterBrain>();
        var player = GameObject.FindGameObjectWithTag("Player");
        if (monster == null || player == null)
            return;
        var d = Vector3.Distance(monster.transform.position, player.transform.position);
        if (d < 12f)
            sanity = Mathf.Max(0f, sanity - drainNearMonsterPerSecond * Time.deltaTime);
        else
            sanity = Mathf.Min(1f, sanity + 0.2f * Time.deltaTime);

        if (FMODManager.Instance != null)
            FMODManager.Instance.SetSanity(sanity);
    }
}
