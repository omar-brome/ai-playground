using System;
using UnityEngine;
using UnityEngine.Rendering;
using Object = UnityEngine.Object;

/// <summary>
/// Runtime materials + sky for the procedural asylum: night atmosphere, environment reads, creature silhouette.
/// Uses URP Lit when available; falls back to Built-in Standard.
/// </summary>
public static class HollowRuntimeVisuals
{
    static Material _litFloor;
    static Material _litWall;
    static Material _litPillar;
    static Material _litLockerBody;
    static Material _litLockerStrip;
    static Material _monsterSkin;
    static Material _monsterHead;
    static Material _monsterEye;
    static Material _monsterSpine;
    static Material _skyboxPanoramic;

    static Shader LitShader =>
        Shader.Find("Universal Render Pipeline/Lit")
        ?? Shader.Find("Standard");

    public static void ApplyNightAtmosphere(int layoutSeed)
    {
        SetupNightSkybox(layoutSeed);
        // Trilight gives readable fill in shadow; a dark skybox alone makes the whole level near-black.
        RenderSettings.ambientMode = AmbientMode.Trilight;
        RenderSettings.ambientSkyColor = new Color(0.14f, 0.16f, 0.24f);
        RenderSettings.ambientEquatorColor = new Color(0.22f, 0.23f, 0.28f);
        RenderSettings.ambientGroundColor = new Color(0.1f, 0.1f, 0.12f);
        RenderSettings.ambientIntensity = 0.95f;
        RenderSettings.reflectionIntensity = 0.28f;
        TuneDirectionalLightsForMoon();
    }

    static void TuneDirectionalLightsForMoon()
    {
        var lights = Object.FindObjectsByType<Light>(FindObjectsInactive.Exclude);
        foreach (var l in lights)
        {
            if (l == null || l.type != LightType.Directional)
                continue;
            l.color = new Color(0.72f, 0.78f, 0.98f);
            l.intensity = 0.95f;
            l.shadows = LightShadows.Soft;
            l.transform.rotation = Quaternion.Euler(42f, -118f, 5f);
            return;
        }

        var go = new GameObject("MoonDirectional");
        var nl = go.AddComponent<Light>();
        nl.type = LightType.Directional;
        nl.color = new Color(0.72f, 0.78f, 0.98f);
        nl.intensity = 0.9f;
        nl.shadows = LightShadows.Soft;
        go.transform.rotation = Quaternion.Euler(42f, -118f, 5f);
    }

    static void SetupNightSkybox(int seed)
    {
        var sh = Shader.Find("Skybox/Panoramic");
        if (sh == null)
            sh = Shader.Find("Skybox/6 Sided");
        if (sh == null)
            return;

        if (_skyboxPanoramic != null)
            Object.Destroy(_skyboxPanoramic);

        _skyboxPanoramic = new Material(sh);
        var tex = BuildNightPanorama(seed);
        if (_skyboxPanoramic.HasProperty("_MainTex"))
            _skyboxPanoramic.SetTexture("_MainTex", tex);
        if (_skyboxPanoramic.HasProperty("_Tint"))
            _skyboxPanoramic.SetColor("_Tint", Color.white);
        if (_skyboxPanoramic.HasProperty("_Exposure"))
            _skyboxPanoramic.SetFloat("_Exposure", 1.25f);
        if (_skyboxPanoramic.HasProperty("_Rotation"))
            _skyboxPanoramic.SetFloat("_Rotation", seed % 360);

        RenderSettings.skybox = _skyboxPanoramic;
    }

    static Texture2D BuildNightPanorama(int seed)
    {
        const int w = 512;
        const int h = 256;
        var tex = new Texture2D(w, h, TextureFormat.RGB24, false)
        {
            wrapMode = TextureWrapMode.Clamp,
            filterMode = FilterMode.Bilinear
        };
        var rnd = new System.Random(seed ^ 0x5f3759df);

        for (var y = 0; y < h; y++)
        {
            var v = y / (float)(h - 1);
            var zenith = new Color(0.02f, 0.03f, 0.08f);
            var horizon = new Color(0.07f, 0.09f, 0.16f);
            var groundGlow = new Color(0.04f, 0.045f, 0.07f);
            Color band;
            if (v < 0.22f)
                band = Color.Lerp(groundGlow, horizon, Mathf.SmoothStep(0f, 1f, v / 0.22f));
            else
                band = Color.Lerp(horizon, zenith, Mathf.SmoothStep(0f, 1f, (v - 0.22f) / 0.78f));

            if (v is > 0.38f and < 0.62f)
                band += new Color(0.018f, 0.02f, 0.038f) *
                        Mathf.Sin((v - 0.38f) / 0.24f * Mathf.PI);

            for (var x = 0; x < w; x++)
            {
                var star = 0f;
                if (v > 0.25f && rnd.NextDouble() < 0.0018)
                    star = (float)(0.45 + rnd.NextDouble() * 0.55);
                var twinkle = (float)(0.97 + 0.03 * Math.Sin(x * 0.11 + seed));
                tex.SetPixel(x, y, band + new Color(star, star, star * 1.05f) * (float)twinkle);
            }
        }

        tex.Apply();
        return tex;
    }

    static Material EnsureLit(ref Material slot, Action<Material> setup)
    {
        if (slot != null)
            return slot;
        var sh = LitShader;
        if (sh == null)
            return null;
        slot = new Material(sh);
        setup(slot);
        return slot;
    }

    static void SetLitBase(Material m, Color baseColor, float smoothness, float metallic)
    {
        if (m == null)
            return;
        if (m.HasProperty("_BaseColor"))
            m.SetColor("_BaseColor", baseColor);
        else if (m.HasProperty("_Color"))
            m.SetColor("_Color", baseColor);
        if (m.HasProperty("_Smoothness"))
            m.SetFloat("_Smoothness", smoothness);
        if (m.HasProperty("_Metallic"))
            m.SetFloat("_Metallic", metallic);
    }

    public static void ApplyFloor(Renderer r)
    {
        var m = EnsureLit(ref _litFloor, x =>
            SetLitBase(x, new Color(0.16f, 0.17f, 0.2f), 0.18f, 0.05f));
        if (m != null && r != null)
            r.sharedMaterial = m;
    }

    public static void ApplyWall(Renderer r)
    {
        var m = EnsureLit(ref _litWall, x =>
            SetLitBase(x, new Color(0.2f, 0.19f, 0.23f), 0.22f, 0f));
        if (m != null && r != null)
            r.sharedMaterial = m;
    }

    public static void ApplyPillar(Renderer r)
    {
        var m = EnsureLit(ref _litPillar, x =>
            SetLitBase(x, new Color(0.17f, 0.16f, 0.18f), 0.26f, 0.02f));
        if (m != null && r != null)
            r.sharedMaterial = m;
    }

    public static void ApplyLockerBody(Renderer r)
    {
        var m = EnsureLit(ref _litLockerBody, x =>
            SetLitBase(x, new Color(0.1f, 0.11f, 0.14f), 0.5f, 0.55f));
        if (m != null && r != null)
            r.sharedMaterial = m;
    }

    public static void ApplyLockerStrip(Renderer r)
    {
        var m = EnsureLit(ref _litLockerStrip, x =>
        {
            SetLitBase(x, new Color(0.08f, 0.22f, 0.1f), 0.35f, 0.15f);
            if (x.HasProperty("_EmissionColor"))
            {
                x.EnableKeyword("_EMISSION");
                x.SetColor("_EmissionColor", new Color(0.05f, 0.2f, 0.08f) * 1.5f);
                x.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
            }
        });
        if (m != null && r != null)
            r.sharedMaterial = m;
    }

    public static void ApplyExitAccent(Renderer r, Color accent)
    {
        var sh = LitShader;
        if (sh == null || r == null)
            return;
        var inst = new Material(sh);
        SetLitBase(inst, accent, 0.45f, 0.2f);
        if (inst.HasProperty("_EmissionColor"))
        {
            inst.EnableKeyword("_EMISSION");
            inst.SetColor("_EmissionColor", accent * 0.85f);
            inst.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
        }

        r.sharedMaterial = inst;
    }

    static Material _playerSilhouette;

    public static void ApplyPlayerSilhouette(Renderer r)
    {
        var m = EnsureLit(ref _playerSilhouette, x =>
            SetLitBase(x, new Color(0.12f, 0.13f, 0.15f), 0.32f, 0f));
        if (m != null && r != null)
            r.sharedMaterial = m;
    }

    /// <summary>Removes default capsule mesh on root; adds layered primitives (no extra colliders). Root keeps gameplay collider.</summary>
    public static void BuildMonsterVisuals(GameObject monsterRoot)
    {
        if (monsterRoot == null)
            return;

        var mf = monsterRoot.GetComponent<MeshFilter>();
        var mr = monsterRoot.GetComponent<MeshRenderer>();
        if (mf != null)
            Object.Destroy(mf);
        if (mr != null)
            Object.Destroy(mr);

        var vis = new GameObject("MonsterVisual");
        vis.transform.SetParent(monsterRoot.transform, false);
        vis.transform.localPosition = Vector3.zero;

        void AddPart(PrimitiveType prim, Vector3 localPos, Vector3 scale, Quaternion rot, Material mat)
        {
            var p = GameObject.CreatePrimitive(prim);
            p.transform.SetParent(vis.transform, false);
            p.transform.localPosition = localPos;
            p.transform.localScale = scale;
            p.transform.localRotation = rot;
            Object.Destroy(p.GetComponent<Collider>());
            if (mat != null)
                p.GetComponent<Renderer>().sharedMaterial = mat;
        }

        var skin = EnsureLit(ref _monsterSkin, x =>
            SetLitBase(x, new Color(0.06f, 0.055f, 0.07f), 0.38f, 0f));
        var headMat = EnsureLit(ref _monsterHead, x =>
            SetLitBase(x, new Color(0.05f, 0.048f, 0.06f), 0.34f, 0f));
        var spineMat = EnsureLit(ref _monsterSpine, x =>
            SetLitBase(x, new Color(0.08f, 0.04f, 0.055f), 0.28f, 0f));
        var eyeMat = EnsureLit(ref _monsterEye, x =>
        {
            SetLitBase(x, new Color(0.05f, 0.02f, 0.02f), 0.65f, 0f);
            if (x.HasProperty("_EmissionColor"))
            {
                x.EnableKeyword("_EMISSION");
                x.SetColor("_EmissionColor", new Color(1f, 0.12f, 0.05f) * 6f);
                x.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;
            }
        });

        AddPart(PrimitiveType.Capsule, new Vector3(0f, 1f, 0f), new Vector3(0.86f, 0.94f, 0.72f),
            Quaternion.identity, skin);
        AddPart(PrimitiveType.Sphere, new Vector3(0f, 1.82f, 0.1f), Vector3.one * 0.42f, Quaternion.identity,
            headMat);

        AddPart(PrimitiveType.Sphere, new Vector3(-0.13f, 1.88f, 0.34f), Vector3.one * 0.09f, Quaternion.identity,
            eyeMat);
        AddPart(PrimitiveType.Sphere, new Vector3(0.13f, 1.88f, 0.34f), Vector3.one * 0.09f, Quaternion.identity,
            eyeMat);

        AddPart(PrimitiveType.Cube, new Vector3(0f, 1.52f, 0.28f), new Vector3(0.38f, 0.12f, 0.22f),
            Quaternion.Euler(8f, 0f, 0f), headMat);

        for (var i = 0; i < 6; i++)
        {
            var t = i / 5f;
            AddPart(PrimitiveType.Cube, new Vector3(0f, 0.85f + t * 0.95f, -0.38f), new Vector3(0.1f, 0.42f, 0.1f),
                Quaternion.Euler(8f + i * 4f, 0f, 0f), spineMat);
        }

        AddPart(PrimitiveType.Cube, new Vector3(-0.45f, 0.35f, 0.08f), new Vector3(0.14f, 0.12f, 0.35f),
            Quaternion.Euler(0f, 0f, -18f), skin);
        AddPart(PrimitiveType.Cube, new Vector3(0.45f, 0.35f, 0.08f), new Vector3(0.14f, 0.12f, 0.35f),
            Quaternion.Euler(0f, 0f, 18f), skin);
    }
}
