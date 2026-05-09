using UnityEngine;

public class HidingSpot : MonoBehaviour
{
    public string spotName = "Closet_01";
    public Transform hidePosition;
    public Transform peekPosition;
    public bool isOccupied;

    [HideInInspector] public float monsterSuspicion;

    public void PlayerEntered()
    {
        isOccupied = true;
    }

    public void PlayerLeft()
    {
        isOccupied = false;
    }

    public void PlayerDiscovered(MonsterBrain monster)
    {
        isOccupied = false;
        monster?.OnPlayerDiscoveredInHiding(this);
    }
}
