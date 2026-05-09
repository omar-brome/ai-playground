using UnityEngine;

public class PropInteraction : MonoBehaviour
{
    public float noiseRadius = 12f;

    public void Push()
    {
        NoiseSystem.Instance?.EmitNoise(transform.position, noiseRadius, NoiseType.Object);
    }
}
