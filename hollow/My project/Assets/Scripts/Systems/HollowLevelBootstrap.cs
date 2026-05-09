using System.Collections.Generic;
using Unity.AI.Navigation;
using Unity.MLAgents;
using Unity.MLAgents.Actuators;
using Unity.MLAgents.Policies;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// Procedural blockout + gameplay wiring for <c>Level_Asylum</c>. Layout is seeded per run (see <see cref="HollowLevelSession"/>).
/// </summary>
public class HollowLevelBootstrap : MonoBehaviour
{
    [Tooltip("If off, this component does nothing — use a hand-authored scene (prefabs + baked NavMesh) instead of runtime blockout.")]
    [SerializeField] bool generateOnAwake = true;

    [Tooltip("When generating: remove the scene MainCamera so the runtime FPS rig can take over. Turn off if your scene already is the authored player setup.")]
    [SerializeField] bool removeSceneMainCameraWhenGenerating = true;

    [Tooltip("When HOLLOW_FMOD is on: prefab whose root has FMODManager with EventReferences + banks exported. If empty, runtime creates a blank FMODManager (no events).")]
    [SerializeField] GameObject fmodManagerPrefab;

    void Awake()
    {
        if (!generateOnAwake)
            return;

        HollowLevelSession.EnsureSeed();
        Random.InitState(HollowLevelSession.GenerationSeed);
        HollowRuntimeVisuals.ApplyNightAtmosphere(HollowLevelSession.GenerationSeed);

        if (removeSceneMainCameraWhenGenerating)
        {
            var oldCam = GameObject.FindGameObjectWithTag("MainCamera");
            if (oldCam != null)
                Destroy(oldCam);
        }

        var obstacleMask = LayerMask.GetMask("Obstacle");
        var root = new GameObject("Level_Asylum_Root");
        var navRoot = new GameObject("NavMeshGeometry");
        navRoot.transform.SetParent(root.transform);

        void Wall(string name, Vector3 pos, Vector3 scale)
        {
            var w = GameObject.CreatePrimitive(PrimitiveType.Cube);
            w.name = name;
            w.layer = LayerMask.NameToLayer("Obstacle");
            w.transform.SetParent(navRoot.transform);
            w.transform.SetPositionAndRotation(pos, Quaternion.identity);
            w.transform.localScale = scale;
            HollowRuntimeVisuals.ApplyWall(w.GetComponent<Renderer>());
        }

        var floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
        floor.name = "Floor";
        floor.layer = LayerMask.NameToLayer("Obstacle");
        floor.transform.SetParent(navRoot.transform);
        floor.transform.SetLocalPositionAndRotation(new Vector3(0f, -0.15f, 0f), Quaternion.identity);
        floor.transform.localScale = new Vector3(36f, 0.3f, 36f);
        HollowRuntimeVisuals.ApplyFloor(floor.GetComponent<Renderer>());

        Wall("Wall_N", new Vector3(0f, 1.5f, 18f), new Vector3(36f, 3f, 0.6f));
        Wall("Wall_S", new Vector3(0f, 1.5f, -18f), new Vector3(36f, 3f, 0.6f));
        Wall("Wall_E", new Vector3(18f, 1.5f, 0f), new Vector3(0.6f, 3f, 36f));
        Wall("Wall_W", new Vector3(-18f, 1.5f, 0f), new Vector3(0.6f, 3f, 36f));

        void Merge1DOpenings(List<Vector2> open)
        {
            if (open.Count <= 1)
                return;
            open.Sort((a, b) => a.x.CompareTo(b.x));
            var i = 0;
            while (i < open.Count - 1)
            {
                if (open[i + 1].x <= open[i].y + 0.45f)
                {
                    open[i] = new Vector2(open[i].x, Mathf.Max(open[i].y, open[i + 1].y));
                    open.RemoveAt(i + 1);
                }
                else
                    i++;
            }
        }

        List<Vector2> BuildOpeningsForRow()
        {
            var opens = new List<Vector2>();
            var cHalf = Random.Range(2.8f, 4.6f);
            opens.Add(new Vector2(-cHalf, cHalf));
            if (Random.value > 0.03f)
            {
                var wx = Random.Range(-12.5f, -7.5f);
                var wh = Random.Range(2.5f, 4f);
                opens.Add(new Vector2(wx - wh * 0.5f, wx + wh * 0.5f));
            }

            if (Random.value > 0.03f)
            {
                var ex = Random.Range(7.5f, 12.5f);
                var eh = Random.Range(2.5f, 4f);
                opens.Add(new Vector2(ex - eh * 0.5f, ex + eh * 0.5f));
            }

            return opens;
        }

        void FillEastWestFromOpenings(float zWorld, string tagPrefix, List<Vector2> openings)
        {
            const float bound = 17.4f;
            Merge1DOpenings(openings);
            openings.Sort((a, b) => a.x.CompareTo(b.x));
            var pos = -bound;
            var wi = 0;
            foreach (var hole in openings)
            {
                if (hole.x > pos + 0.35f)
                {
                    var mid = (pos + hole.x) * 0.5f;
                    var len = hole.x - pos;
                    Wall($"{tagPrefix}_{wi++}", new Vector3(mid, 1.5f, zWorld), new Vector3(len, 3f, 0.6f));
                }

                pos = Mathf.Max(pos, hole.y);
            }

            if (bound > pos + 0.35f)
            {
                var mid = (pos + bound) * 0.5f;
                var len = bound - pos;
                Wall($"{tagPrefix}_{wi}", new Vector3(mid, 1.5f, zWorld), new Vector3(len, 3f, 0.6f));
            }
        }

        var rowZs = new List<float>();
        var candidates = new[] { -8f, -4f, 0f, 4f, 8f };
        var pickCount = Random.Range(2, candidates.Length);
        var idx = new[] { 0, 1, 2, 3, 4 };
        for (var i = idx.Length - 1; i > 0; i--)
        {
            var j = Random.Range(0, i + 1);
            (idx[i], idx[j]) = (idx[j], idx[i]);
        }

        for (var i = 0; i < pickCount; i++)
            rowZs.Add(candidates[idx[i]] + Random.Range(-1.1f, 1.1f));

        for (var i = 0; i < rowZs.Count; i++)
            FillEastWestFromOpenings(rowZs[i], $"Corridor_{i}", BuildOpeningsForRow());

        for (var k = 0; k < Random.Range(0, 3); k++)
        {
            var xSide = Random.value < 0.5f ? -1f : 1f;
            var x = xSide * Random.Range(10.5f, 15.5f);
            var zc = Random.Range(-4f, 6f);
            var zLen = Random.Range(5f, 9f);
            Wall($"Divider_NS_{k}", new Vector3(x, 1.5f, zc), new Vector3(0.6f, 3f, zLen));
        }

        var exitZ = Random.Range(9.5f, 12.2f);
        var exitRowOpens = BuildOpeningsForRow();
        var exitCenterHalf = Random.Range(3.4f, 5f);
        exitRowOpens[0] = new Vector2(-exitCenterHalf, exitCenterHalf);
        if (Random.value > 0.2f && exitRowOpens.Count < 3)
        {
            var sx = Random.value < 0.5f ? -10f : 10f;
            var sw = Random.Range(2.2f, 3.4f);
            exitRowOpens.Add(new Vector2(sx - sw * 0.5f, sx + sw * 0.5f));
        }

        FillEastWestFromOpenings(exitZ, "NearExit", exitRowOpens);

        void CoverPillar(Vector3 xzCenter)
        {
            var p = GameObject.CreatePrimitive(PrimitiveType.Cube);
            p.name = "CoverPillar";
            p.layer = LayerMask.NameToLayer("Obstacle");
            p.transform.SetParent(navRoot.transform);
            p.transform.position = xzCenter + Vector3.up * 1.5f;
            var sc = Random.Range(1.85f, 2.45f);
            p.transform.localScale = new Vector3(sc, 3f, sc);
            HollowRuntimeVisuals.ApplyPillar(p.GetComponent<Renderer>());
        }

        var playerStart = new Vector3(Random.Range(-4.5f, 4.5f), 0f, Random.Range(-12.8f, -9.5f));
        var pillarTries = Random.Range(5, 9);
        for (var p = 0; p < pillarTries; p++)
        {
            var px = Random.Range(-15f, 15f);
            var pz = Random.Range(-15f, 13f);
            if (Mathf.Abs(px) < 3.5f && Mathf.Abs(pz - playerStart.z) < 5f)
                continue;
            if (Mathf.Abs(px) < 2.8f && Mathf.Abs(pz) < 3f)
                continue;
            CoverPillar(new Vector3(px, 0f, pz));
        }

        var surf = navRoot.AddComponent<NavMeshSurface>();
        surf.collectObjects = CollectObjects.Children;
        surf.BuildNavMesh();

        var patrolRoot = new GameObject("PatrolPoints");
        patrolRoot.transform.SetParent(root.transform);
        var patrols = new Transform[4];
        var corners = new[]
        {
            new Vector2(-13f, 13f),
            new Vector2(13f, 13f),
            new Vector2(13f, -11f),
            new Vector2(-13f, -11f)
        };
        for (var i = 0; i < 4; i++)
        {
            var p = new GameObject($"Patrol_{i}");
            p.transform.SetParent(patrolRoot.transform);
            p.transform.position = new Vector3(
                corners[i].x + Random.Range(-3.5f, 3.5f),
                0.1f,
                corners[i].y + Random.Range(-3.5f, 3.5f));
            patrols[i] = p.transform;
        }

        void CreateHidingLocker(string objectName, string spotId, Vector3 worldCenter)
        {
            var go = new GameObject(objectName);
            go.transform.SetParent(root.transform);
            go.transform.position = worldCenter;

            var col = go.AddComponent<BoxCollider>();
            col.isTrigger = true;
            col.center = new Vector3(0f, 1.15f, 0f);
            col.size = new Vector3(3.2f, 2.8f, 3.2f);

            var hs = go.AddComponent<HidingSpot>();
            hs.spotName = spotId;

            var anchor = new GameObject("HideAnchor").transform;
            anchor.SetParent(go.transform);
            anchor.position = worldCenter + new Vector3(0f, 0.95f, 0.35f);
            hs.hidePosition = anchor;

            var shell = GameObject.CreatePrimitive(PrimitiveType.Cube);
            shell.name = "LockerBody";
            shell.transform.SetParent(go.transform);
            shell.transform.position = worldCenter + new Vector3(0f, 1.25f, 0f);
            shell.transform.localScale = new Vector3(1.35f, 2.5f, 0.85f);
            Destroy(shell.GetComponent<BoxCollider>());
            HollowRuntimeVisuals.ApplyLockerBody(shell.GetComponent<Renderer>());

            var strip = GameObject.CreatePrimitive(PrimitiveType.Cube);
            strip.name = "LockerMarkerLight";
            strip.transform.SetParent(go.transform);
            strip.transform.position = worldCenter + new Vector3(0f, 2.35f, 0.42f);
            strip.transform.localScale = new Vector3(0.9f, 0.12f, 0.08f);
            Destroy(strip.GetComponent<BoxCollider>());
            HollowRuntimeVisuals.ApplyLockerStrip(strip.GetComponent<Renderer>());
        }

        var southZ = Random.Range(-15.2f, -13.8f);
        var lx = -9f + Random.Range(-1.2f, 1.2f);
        var cx = Random.Range(-1f, 1f);
        var rx = 9f + Random.Range(-1.2f, 1.2f);
        CreateHidingLocker("HidingSpot_Locker_W", "Locker_West", new Vector3(lx, 0f, southZ));
        CreateHidingLocker("HidingSpot_Locker_C", "Locker_Center", new Vector3(cx, 0f, southZ));
        CreateHidingLocker("HidingSpot_Locker_E", "Locker_East", new Vector3(rx, 0f, southZ));

        var exitX = Random.Range(-2f, 2f);
        var exitNorthZ = Random.Range(15.1f, 15.85f);
        CreateExitGate(root.transform, new Vector3(exitX, 0f, exitNorthZ));

        var systems = new GameObject("Systems");
        systems.AddComponent<NoiseSystem>();
        systems.AddComponent<GameStateManager>();
        var levelObj = systems.AddComponent<HollowLevelObjective>();
        levelObj.surviveWinSeconds = 150f;
        systems.AddComponent<PatternTracker>();
#if HOLLOW_FMOD
        if (HollowAudioPreferences.UseFmodEngine)
        {
            if (fmodManagerPrefab != null)
            {
                var finst = Instantiate(fmodManagerPrefab, systems.transform);
                finst.name = "FMODManager";
            }
            else
            {
                var fmodGo = new GameObject("FMODManager");
                fmodGo.transform.SetParent(systems.transform);
                fmodGo.AddComponent<FMODManager>();
            }
        }
        else
        {
            var fmodGo = new GameObject("FMODManager");
            fmodGo.transform.SetParent(systems.transform);
            fmodGo.AddComponent<FMODManager>();
        }
#else
        {
            var fmodGo = new GameObject("FMODManager");
            fmodGo.transform.SetParent(systems.transform);
            fmodGo.AddComponent<FMODManager>();
        }
#endif

        var player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        player.name = "Player";
        player.tag = "Player";
        HollowRuntimeVisuals.ApplyPlayerSilhouette(player.GetComponent<Renderer>());
        Destroy(player.GetComponent<CapsuleCollider>());
        var pcc = player.AddComponent<CharacterController>();
        pcc.height = 1.8f;
        pcc.radius = 0.35f;
        pcc.center = new Vector3(0f, 0.9f, 0f);
        player.transform.SetPositionAndRotation(playerStart, Quaternion.identity);

        var camArm = new GameObject("CameraArm");
        camArm.transform.SetParent(player.transform, false);
        camArm.transform.localPosition = new Vector3(0f, 1.6f, 0f);
        var camGo = new GameObject("PlayerCamera");
        camGo.transform.SetParent(camArm.transform, false);
        camGo.tag = "MainCamera";
        camGo.AddComponent<Camera>();
        camGo.AddComponent<AudioListener>();
#if HOLLOW_FMOD
        if (HollowAudioPreferences.UseFmodEngine)
            camGo.AddComponent<FMODUnity.StudioListener>();
#endif
        camGo.AddComponent<AudioLowPassFilter>();
        camGo.AddComponent<HidingScreenFeedback>();
        camGo.AddComponent<HollowGameplayAudio>();
        var flash = camGo.AddComponent<Light>();
        flash.type = LightType.Spot;
        flash.enabled = false;
        flash.range = 26f;
        flash.spotAngle = 54f;
        flash.innerSpotAngle = 28f;
        flash.intensity = 1.4f;
        flash.color = new Color(1f, 0.95f, 0.82f);
        flash.shadows = LightShadows.Soft;

        var pc = player.AddComponent<PlayerController>();
        pc.cameraPivot = camArm.transform;
        player.AddComponent<PlayerNoise>();
        player.AddComponent<PlayerHiding>();
        player.AddComponent<PlayerInventory>();
        player.AddComponent<MicrophoneNoiseListener>();
        var patternEmitter = player.AddComponent<PlayerPatternEmitter>();
        patternEmitter.tracker = systems.GetComponent<PatternTracker>();
        player.AddComponent<WhisperClient>();

        var monster = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        monster.name = "Monster";
        Destroy(monster.GetComponent<CapsuleCollider>());
        HollowRuntimeVisuals.BuildMonsterVisuals(monster);
        var mCol = monster.AddComponent<CapsuleCollider>();
        mCol.height = 2f;
        mCol.radius = 0.4f;
        mCol.center = new Vector3(0f, 1f, 0f);
        monster.transform.position = new Vector3(
            Random.Range(12f, 16.5f),
            1f,
            Random.Range(12f, 16.5f));

        var agent = monster.AddComponent<NavMeshAgent>();
        agent.height = 2f;
        agent.radius = 0.4f;
        agent.acceleration = 24f;
        agent.angularSpeed = 360f;

        var nav = monster.AddComponent<MonsterNavigation>();
        nav.agent = agent;
        nav.patrolPoints = patrols;

        var senses = monster.AddComponent<MonsterSenses>();
        senses.obstacleMask = obstacleMask;
        senses.sightAngle = 78f;
        senses.minHearStrength = 0.17f;

        var memory = monster.AddComponent<MonsterMemory>();
        patternEmitter.monsterMemory = memory;
        var mAnim = monster.AddComponent<MonsterAnimator>();
        var brain = monster.AddComponent<MonsterBrain>();
        brain.navigation = nav;
        brain.senses = senses;
        brain.memory = memory;
        brain.animator = mAnim;
        brain.mic = player.GetComponent<MicrophoneNoiseListener>();

        var diff = systems.AddComponent<AdaptiveDifficulty>();
        diff.monster = brain;
        diff.mic = brain.mic;
        brain.difficulty = diff;

        var hsMem = systems.AddComponent<HidingSpotMemory>();
        hsMem.monsterMemory = memory;

        var bp = monster.AddComponent<BehaviorParameters>();
        bp.BehaviorName = "MonsterPPO";
        bp.BehaviorType = BehaviorType.HeuristicOnly;
        var brainParams = bp.BrainParameters;
        brainParams.VectorObservationSize = MonsterMLAgent.RequiredVectorObservationSize;
        brainParams.NumStackedVectorObservations = 1;
        brainParams.ActionSpec = new ActionSpec(0, new[] { MonsterMLAgent.RequiredDiscreteBranch0Size });

        var ml = monster.AddComponent<MonsterMLAgent>();
        ml.brain = brain;
        ml.ConfigureAndEnableIfValid();
        if (ml.enabled)
        {
            var dr = monster.AddComponent<DecisionRequester>();
            dr.DecisionPeriod = 10;
        }

        var telegraph = monster.AddComponent<MonsterTelegraph>();
        telegraph.brain = brain;

        monster.AddComponent<MonsterPresenceAudio>();

        RenderSettings.fog = true;
        RenderSettings.fogMode = FogMode.ExponentialSquared;
        RenderSettings.fogColor = new Color(0.08f, 0.09f, 0.14f);
        RenderSettings.fogDensity = Random.Range(0.014f, 0.022f);

        var uiRoot = new GameObject("UI_Runtime");
        uiRoot.AddComponent<HUDController>();
        uiRoot.AddComponent<SanityEffect>();
    }

    static void CreateExitGate(Transform parent, Vector3 worldPos)
    {
        var exit = new GameObject("Exit_Gate");
        exit.transform.SetParent(parent);
        exit.transform.position = worldPos;

        var trig = exit.AddComponent<BoxCollider>();
        trig.isTrigger = true;
        trig.center = new Vector3(0f, 2f, 0f);
        trig.size = new Vector3(7f, 4f, 2.5f);
        exit.AddComponent<ExitTrigger>();

        foreach (var sx in new[] { -2.35f, 2.35f })
        {
            var post = GameObject.CreatePrimitive(PrimitiveType.Cube);
            post.name = "ExitPost";
            post.transform.SetParent(exit.transform);
            post.transform.localPosition = new Vector3(sx, 1.5f, 0f);
            post.transform.localScale = new Vector3(0.55f, 3f, 0.55f);
            Destroy(post.GetComponent<Collider>());
            HollowRuntimeVisuals.ApplyExitAccent(post.GetComponent<Renderer>(), new Color(0.1f, 0.32f, 0.4f));
        }

        var beam = GameObject.CreatePrimitive(PrimitiveType.Cube);
        beam.name = "ExitBeam";
        beam.transform.SetParent(exit.transform);
        beam.transform.localPosition = new Vector3(0f, 3f, 0f);
        beam.transform.localScale = new Vector3(5.2f, 0.4f, 0.4f);
        Destroy(beam.GetComponent<Collider>());
        HollowRuntimeVisuals.ApplyExitAccent(beam.GetComponent<Renderer>(), new Color(0.2f, 0.85f, 0.98f));
    }
}
