#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

/// <summary>
/// Pressing Play always enters <c>MainMenu</c> so SampleScene is not used by mistake.
/// To turn off: Project Settings → Editor → Play Mode → Start Scene → None,
/// or delete this file.
/// </summary>
[InitializeOnLoad]
static class HollowPlayModeStartScene
{
    const string MainMenuPath = "Assets/Scenes/MainMenu.unity";

    static HollowPlayModeStartScene()
    {
        Apply();
    }

    [MenuItem("Hollow/Use MainMenu as Play Mode Start Scene")]
    static void ApplyMenu()
    {
        Apply();
    }

    static void Apply()
    {
        var scene = AssetDatabase.LoadAssetAtPath<SceneAsset>(MainMenuPath);
        if (scene != null)
            EditorSceneManager.playModeStartScene = scene;
    }
}
#endif
