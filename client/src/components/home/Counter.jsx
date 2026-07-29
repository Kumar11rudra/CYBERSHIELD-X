import React, { useEffect, useRef, useState } from "react";

export default function Counter({ to, suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const duration = 2500;
          const stepTime = Math.max(duration / to, 50);

          const id = setInterval(() => {
            start += 1;

            if (start >= to) {
              setVal(to);
              clearInterval(id);
            } else {
              setVal(start);
            }
          }, stepTime);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}