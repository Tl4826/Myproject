import { FRUITS } from '../lib/data.js';

const FruitScene = () => (
    <div className="scene absolute inset-0 overflow-hidden pointer-events-none">
        <div className="layer">
            {FRUITS.map(([e, x, y, sz, z], i) => (
                <div key={i} className="fruit" style={{ left: x + '%', top: y + '%', fontSize: `calc(${sz}px * var(--k, 1))`, transform: `translateZ(${z}px)`, animationDelay: `${-i * 0.9}s` }}>
                    <span style={{ animationDelay: `${-i * 1.3}s` }}>{e}</span>
                </div>
            ))}
        </div>
    </div>
);

export default FruitScene;
