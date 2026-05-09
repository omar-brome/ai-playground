using UnityEngine;

public class MonsterAnimator : MonoBehaviour
{
    static readonly int SpeedHash = Animator.StringToHash("Speed");
    static readonly int StateHash = Animator.StringToHash("State");

    public Animator animator;

    public void OnStateChange(MonsterState newState)
    {
        if (animator == null)
            return;
        animator.SetInteger(StateHash, (int)newState);
    }

    public void SetSpeed(MonsterSpeed speed)
    {
        if (animator == null)
            return;
        var v = speed switch
        {
            MonsterSpeed.Creeping => 0.35f,
            MonsterSpeed.Walking => 0.7f,
            MonsterSpeed.Running => 1f,
            _ => 0.7f
        };
        animator.SetFloat(SpeedHash, v);
    }
}
