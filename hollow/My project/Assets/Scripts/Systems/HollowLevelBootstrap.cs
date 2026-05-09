using Unity.AI.Navigation;
using UnityEngine;
using UnityEngine.AI;

/// <summary>
/// Procedural blockout + gameplay wiring for <c>Level_Asylum</c> so the project is playable without hand-placed prefabs.
/// </summary>
public class HollowLevelBootstrap : MonoBehaviour
{
    [SerializeField] bool generateOnAwake = true;

    void Awake()
    {
        if (!generateOnAwake)
            return;

        var oldCam = GameObject.FindGameObjectWithTag("MainCamera");
        if (oldCam != null)
            Destroy(oldCam);

        var obstacleMask = LayerMask.GetMask("Obstacle");

        var root = new GameObject("Level_Asylum_Root");

        var navRoot = new GameObject("NavMeshGeometry");
        navRoot.transform.SetParent(root.transform);

        var floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
        floor.name = "Floor";
        floor.layer = LayerMask.NameToLayer("Obstacle");
        floor.transform.SetParent(navRoot.transform);
        floor.transform.SetLocalPositionAndRotation(new Vector3(0f, -0.15f, 0f), Quaternion.identity);
        floor.transform.localScale = new Vector3(36f, 0.3f, 36f);

        void Wall(string name, Vector3 pos, Vector3 scale)
        {
            var w = GameObject.CreatePrimitive(PrimitiveType.Cube);
            w.name = name;
            w.layer = LayerMask.NameToLayer("Obstacle");
            w.transform.SetParent(navRoot.transform);
            w.transform.SetPositionAndRotation(pos, Quaternion.identity);
            w.transform.localScale = scale;
        }

        Wall("Wall_N", new Vector3(0f, 1.5f, 18f), new Vector3(36f, 3f, 0.6f));
        Wall("Wall_S", new Vector3(0f, 1.5f, -18f), new Vector3(36f, 3f, 0.6f));
        Wall("Wall_E", new Vector3(18f, 1.5f, 0f), new Vector3(0.6f, 3f, 36f));
        Wall("Wall_W", new Vector3(-18f, 1.5f, 0f), new Vector3(0.6f, 3f, 36f));

        void CoverPillar(Vector3 xzCenter)
        {
            var p = GameObject.CreatePrimitive(PrimitiveType.Cube);
            p.name = "CoverPillar";
            p.layer = LayerMask.NameToLayer("Obstacle");
            p.transform.SetParent(navRoot.transform);
            p.transform.position = xzCenter + Vector3.up * 1.5f;
            p.transform.localScale = new Vector3(2.2f, 3f, 2.2f);
            ApplyConcreteLook(p.GetComponent<Renderer>());
        }

        CoverPillar(new Vector3(0f, 0f, 2f));
        CoverPillar(new Vector3(8f, 0f, -2f));
        CoverPillar(new Vector3(-8f, 0f, -2f));
        CoverPillar(new Vector3(5f, 0f, 8f));
        CoverPillar(new Vector3(-5f, 0f, 8f));

        var surf = navRoot.AddComponent<NavMeshSurface>();
        surf.collectObjects = CollectObjects.Children;
        surf.BuildNavMesh();

        var patrolRoot = new GameObject("PatrolPoints");
        patrolRoot.transform.SetParent(root.transform);
        var patrols = new Transform[4];
        var patrolPositions = new[]
        {
            new Vector3(-13f, 0f, 13f),
            new Vector3(13f, 0f, 13f),
            new Vector3(13f, 0f, -11f),
            new Vector3(-13f, 0f, -11f)
        };
        for (var i = 0; i < 4; i++)
        {
            var p = new GameObject($"Patrol_{i}");
            p.transform.SetParent(patrolRoot.transform);
            p.transform.position = patrolPositions[i] + Vector3.up * 0.1f;
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
            ApplyLockerBodyLook(shell.GetComponent<Renderer>());

            var strip = GameObject.CreatePrimitive(PrimitiveType.Cube);
            strip.name = "LockerMarkerLight";
            strip.transform.SetParent(go.transform);
            strip.transform.position = worldCenter + new Vector3(0f, 2.35f, 0.42f);
            strip.transform.localScale = new Vector3(0.9f, 0.12f, 0.08f);
            Destroy(strip.GetComponent<BoxCollider>());
            ApplyLockerStripLook(strip.GetComponent<Renderer>());
        }

        const float southZ = -14.5f;
        CreateHidingLocker("HidingSpot_Locker_W", "Locker_West", new Vector3(-9f, 0f, southZ));
        CreateHidingLocker("HidingSpot_Locker_C", "Locker_Center", new Vector3(0f, 0f, southZ));
        CreateHidingLocker("HidingSpot_Locker_E", "Locker_East", new Vector3(9f, 0f, southZ));

        CreateExitGate(root.transform);

        var systems = new GameObject("Systems");
        systems.AddComponent<NoiseSystem>();
        systems.AddComponent<GameStateManager>();
        var levelObj = systems.AddComponent<HollowLevelObjective>();
        levelObj.surviveWinSeconds = 150f;
        systems.AddComponent<PatternTracker>();
        var fmodGo = new GameObject("FMODManager");
        fmodGo.transform.SetParent(systems.transform);
        fmodGo.AddComponent<FMODManager>();

        var player = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        player.name = "Player";
        player.tag = "Player";
        Destroy(player.GetComponent<CapsuleCollider>());
        var pcc = player.AddComponent<CharacterController>();
        pcc.height = 1.8f;
        pcc.radius = 0.35f;
        pcc.center = new Vector3(0f, 0.9f, 0f);
        player.transform.SetPositionAndRotation(new Vector3(0f, 0f, -11.5f), Quaternion.identity);

        var camArm = new GameObject("CameraArm");
        camArm.transform.SetParent(player.transform, false);
        camArm.transform.localPosition = new Vector3(0f, 1.6f, 0f);
        var camGo = new GameObject("PlayerCamera");
        camGo.transform.SetParent(camArm.transform, false);
        camGo.tag = "MainCamera";
        camGo.AddComponent<Camera>();
        camGo.AddComponent<AudioListener>();
        camGo.AddComponent<AudioLowPassFilter>();
        camGo.AddComponent<HidingScreenFeedback>();
        camGo.AddComponent<HollowGameplayAudio>();

        var pc = player.AddComponent<PlayerController>();
        pc.cameraPivot = camArm.transform;
        player.AddComponent<PlayerNoise>();
        player.AddComponent<PlayerHiding>();
        player.AddComponent<PlayerInventory>();
        player.AddComponent<MicrophoneNoiseListener>();
        player.AddComponent<WhisperClient>();

        var monster = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        monster.name = "Monster";
        Destroy(monster.GetComponent<CapsuleCollider>());
        var mCol = monster.AddComponent<CapsuleCollider>();
        mCol.height = 2f;
        mCol.radius = 0.4f;
        mCol.center = new Vector3(0f, 1f, 0f);
        monster.transform.position = new Vector3(15f, 1f, 15f);

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

        var ml = monster.AddComponent<MonsterMLAgent>();
        ml.brain = brain;
        ml.enabled = false;

        var telegraph = monster.AddComponent<MonsterTelegraph>();
        telegraph.brain = brain;

        RenderSettings.fog = true;
        RenderSettings.fogMode = FogMode.ExponentialSquared;
        RenderSettings.fogColor = new Color(0.02f, 0.02f, 0.04f);
        RenderSettings.fogDensity = 0.04f;

        var uiRoot = new GameObject("UI_Runtime");
        uiRoot.AddComponent<HUDController>();
        uiRoot.AddComponent<SanityEffect>();
    }

    static void CreateExitGate(Transform parent)
    {
        var exit = new GameObject("Exit_Gate");
        exit.transform.SetParent(parent);
        exit.transform.position = new Vector3(0f, 0f, 15.5f);

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
            ApplyExitCyan(post.GetComponent<Renderer>(), new Color(0.12f, 0.35f, 0.42f));
        }

        var beam = GameObject.CreatePrimitive(PrimitiveType.Cube);
        beam.name = "ExitBeam";
        beam.transform.SetParent(exit.transform);
        beam.transform.localPosition = new Vector3(0f, 3f, 0f);
        beam.transform.localScale = new Vector3(5.2f, 0.4f, 0.4f);
        Destroy(beam.GetComponent<Collider>());
        ApplyExitCyan(beam.GetComponent<Renderer>(), new Color(0.25f, 0.9f, 1f));
    }

    static void ApplyExitCyan(Renderer r, Color c)
    {
        if (r == null)
            return;
        var m = r.material;
        if (m.HasProperty("_BaseColor"))
            m.SetColor("_BaseColor", c);
    }

    static void ApplyConcreteLook(Renderer r)
    {
        if (r == null)
            return;
        var m = r.material;
        if (m.HasProperty("_BaseColor"))
            m.SetColor("_BaseColor", new Color(0.18f, 0.17f, 0.16f));
    }

    static void ApplyLockerBodyLook(Renderer r)
    {
        if (r == null)
            return;
        var m = r.material;
        if (m.HasProperty("_BaseColor"))
            m.SetColor("_BaseColor", new Color(0.06f, 0.07f, 0.09f));
    }

    static void ApplyLockerStripLook(Renderer r)
    {
        if (r == null)
            return;
        var m = r.material;
        if (m.HasProperty("_BaseColor"))
            m.SetColor("_BaseColor", new Color(0.25f, 0.45f, 0.28f));
    }
}
