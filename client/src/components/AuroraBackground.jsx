import { useEffect, useRef } from 'react';

const orbs = [
  { width: 700, height: 400, color: 'rgba(16,185,129,0.5)',  top: '-150px', left: '-100px',  duration: 6000 },
  { width: 600, height: 350, color: 'rgba(99,102,241,0.45)', top: '-100px', right: '-150px', duration: 7500 },
  { width: 500, height: 500, color: 'rgba(5,150,105,0.40)',  bottom: '-150px', left: '-50px', duration: 9000 },
  { width: 450, height: 400, color: 'rgba(139,92,246,0.35)', bottom: '-100px', right: '-100px', duration: 7000 },
  { width: 350, height: 280, color: 'rgba(59,130,246,0.28)', top: '35%', left: '35%', duration: 10000 },
];

const AuroraOrb = ({ orb, index }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const moves = [[0,0],[80,60],[40,120],[120,40],[0,0]];
    const scales = [1, 1.1, 0.93, 1.06, 1];
    const anim = el.animate(
      moves.map((m, i) => ({
        transform: `translate(${index%2===0?m[0]:-m[0]}px,${m[1]}px) scale(${scales[i]})`
      })),
      { duration: orb.duration, iterations: Infinity, easing: 'ease-in-out',
        direction: index % 2 === 0 ? 'alternate' : 'alternate-reverse' }
    );
    return () => anim.cancel();
  }, []);
  return (
    <div ref={ref} style={{
      position:'fixed', width:orb.width, height:orb.height, borderRadius:'50%',
      background:`radial-gradient(ellipse, ${orb.color} 0%, transparent 70%)`,
      filter:'blur(80px)', pointerEvents:'none', zIndex:0, willChange:'transform',
      top:orb.top, left:orb.left, right:orb.right, bottom:orb.bottom,
    }} />
  );
};

const FLAKE_COUNT = 80;
const flakes = Array.from({ length: FLAKE_COUNT }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 8 + 6,
  delay: Math.random() * 10,
  opacity: Math.random() * 0.5 + 0.3,
  drift: (Math.random() - 0.5) * 60,
}));

const Snowflake = ({ flake }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const anim = el.animate(
      [
        { transform: `translateY(-20px) translateX(0px)`, opacity: flake.opacity },
        { transform: `translateY(110vh) translateX(${flake.drift}px)`, opacity: 0 },
      ],
      {
        duration: flake.duration * 1000,
        delay: flake.delay * 1000,
        iterations: Infinity,
        easing: 'linear',
      }
    );
    return () => anim.cancel();
  }, []);

  return (
    <div ref={ref} style={{
      position: 'fixed',
      top: 0,
      left: `${flake.left}%`,
      width: flake.size,
      height: flake.size,
      borderRadius: '50%',
      background: 'white',
      boxShadow: `0 0 ${flake.size * 2}px rgba(255,255,255,0.8)`,
      pointerEvents: 'none',
      zIndex: 0,
      willChange: 'transform',
    }} />
  );
};

const AuroraBackground = () => (
  <>
    {orbs.map((orb, i) => <AuroraOrb key={i} orb={orb} index={i} />)}
    {flakes.map(f => <Snowflake key={f.id} flake={f} />)}
  </>
);

export default AuroraBackground;
