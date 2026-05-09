using UnityEngine;

/// <summary>
/// Per-run seed so <see cref="HollowLevelBootstrap"/> layout changes each time you start from the main menu.
/// Editor play directly on Level_Asylum uses a one-time default if no run was started.
/// </summary>
public static class HollowLevelSession
{
    public static int GenerationSeed { get; private set; }

    /// <summary>New layout seed (main menu Play, level restart, or first asylum load in editor).</summary>
    public static void BeginNewRun()
    {
        var h = System.Guid.NewGuid().GetHashCode();
        GenerationSeed = h == 0 ? Random.Range(1, int.MaxValue) : h;
    }

    /// <summary>Ensures a non-zero seed (direct scene play / first Awake).</summary>
    public static void EnsureSeed()
    {
        if (GenerationSeed == 0)
            BeginNewRun();
    }
}
