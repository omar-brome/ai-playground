using UnityEngine;

public class FlickeringLight : MonoBehaviour
{
    public Light target;
    public float minIntensity = 0.2f;
    public float maxIntensity = 1.4f;
    public float flickerSpeed = 8f;

    void Update()
    {
        if (target == null)
            return;
        var n = Mathf.PerlinNoise(Time.time * flickerSpeed * 0.5f, 0.7f);
        target.intensity = Mathf.Lerp(minIntensity, maxIntensity, n);
    }
}
