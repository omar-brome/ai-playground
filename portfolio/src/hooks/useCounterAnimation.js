import { useEffect, useRef, useState } from "react";

export function useCounterAnimation(target, duration = 1200) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    let frameId;
    let startTime;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        function animate(timestamp) {
          if (!startTime) {
            startTime = timestamp;
          }

          const progress = Math.min((timestamp - startTime) / duration, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(target * easedProgress));

          if (progress < 1) {
            frameId = requestAnimationFrame(animate);
          }
        }

        frameId = requestAnimationFrame(animate);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [duration, target]);

  return { ref, value };
}
