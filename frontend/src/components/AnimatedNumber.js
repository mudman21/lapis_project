import React, { useState, useEffect } from 'react';

const AnimatedNumber = ({ value, duration = 500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const end = parseInt(value);
    if (count === end) return;

    const step = Math.max(Math.floor(end / 100), 1); // 최소 1, 최대 목표값의 1/20
    const intervalTime = duration / (end / step);

    let timer = setInterval(() => {
      setCount(prevCount => {
        const nextCount = prevCount + step;
        if (nextCount >= end) {
          clearInterval(timer);
          return end;
        }
        return nextCount;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className="stat-number">{count.toLocaleString()}</span>;
};

export default AnimatedNumber;