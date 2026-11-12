import { useState, useEffect } from 'react';

const CountUp = ({ value }) => {
    const [n, setN] = useState(0);
    useEffect(() => {
        let raf, t0; const from = n;
        const step = t => { t0 = t0 ?? t; const k = Math.min((t - t0) / 600, 1); setN(Math.round(from + (value - from) * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(step); };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return n;
};

export default CountUp;
