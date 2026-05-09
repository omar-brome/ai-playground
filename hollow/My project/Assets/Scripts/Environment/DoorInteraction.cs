using UnityEngine;

public class DoorInteraction : MonoBehaviour
{
    public bool isOpen;
    public Transform doorPivot;

    public void Toggle()
    {
        isOpen = !isOpen;
        if (doorPivot != null)
            doorPivot.localRotation = Quaternion.Euler(0f, isOpen ? 90f : 0f, 0f);
    }
}
