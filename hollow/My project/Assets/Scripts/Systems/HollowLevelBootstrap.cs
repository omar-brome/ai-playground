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

        var surf = navRoot.AddComponent<NavMeshSurface>();
        surf.collectObjects = CollectObjects.Children;
        surf.BuildNavMesh();

        var patrolRoot = new GameObject("PatrolPoints");
        patrolRoot.transform.SetParent(root.transform);
        var patrols = new Transform[4];
        var patrolPositions = new[]
        {
            new Vector3(-8f, 0f, 8f),
            new Vector3(8f, 0f, 8f),
            new Vector3(8f, 0f, -8f),
            new Vector3(-8f, 0f, -8f)
        };
        for (var i = 0; i < 4; i++)
        {
            var p = new GameObject($"Patrol_{i}");
            p.transform.SetParent(patrolRoot.transform);
            p.transform.position = patrolPositions[i] + Vector3.up * 0.1f;
            patrols[i] = p.transform;
        }

        var hideGo = new GameObject("HidingSpot_Locker");
        hideGo.transform.SetParent(root.transform);
        hideGo.transform.position = new Vector3(-12f, 0f, 0f);
        var hideCol = hideGo.AddComponent<BoxCollider>();
        hideCol.isTrigger = true;
        hideCol.size = new Vector3(1.8f, 2.2f, 1.8f);
        hideCol.center = Vector3.up;
        var hideSpot = hideGo.AddComponent<HidingSpot>();
        hideSpot.spotName = "Locker_A";
        var hideAnchor = new GameObject("HideAnchor").transform;
        hideAnchor.SetParent(hideGo.transform);
        hideAnchor.SetLocalPositionAndRotation(new Vector3(0f, 1f, 0f), Quaternion.identity);
        hideSpot.hidePosition = hideAnchor;

        var systems = new GameObject("Systems");
        systems.AddComponent<NoiseSystem>();
        systems.AddComponent<GameStateManager>();
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
        player.transform.position = new Vector3(0f, 0f, 6f);

        var camArm = new GameObject("CameraArm");
        camArm.transform.SetParent(player.transform, false);
        camArm.transform.localPosition = new Vector3(0f, 1.6f, 0f);
        var camGo = new GameObject("PlayerCamera");
        camGo.transform.SetParent(camArm.transform, false);
        camGo.tag = "MainCamera";
        camGo.AddComponent<Camera>();
        camGo.AddComponent<AudioListener>();
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
        monster.transform.position = new Vector3(6f, 1f, -6f);

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

        RenderSettings.fog = true;
        RenderSettings.fogMode = FogMode.ExponentialSquared;
        RenderSettings.fogColor = new Color(0.02f, 0.02f, 0.04f);
        RenderSettings.fogDensity = 0.04f;

        var uiRoot = new GameObject("UI_Runtime");
        uiRoot.AddComponent<HUDController>();
        uiRoot.AddComponent<SanityEffect>();
    }
}
