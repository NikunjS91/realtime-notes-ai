import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: '⚡', label: 'Real-time sync', desc: 'Changes appear instantly across all devices' },
  { icon: '✨', label: 'AI summaries', desc: 'Powered by NVIDIA Llama 4 Maverick' },
  { icon: '🕐', label: 'Version history', desc: 'Never lose a previous version' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="h-full flex items-center justify-center relative overflow-hidden"
      style={{ background: 'transparent' }}>

      {/* Grid pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      <div className="relative z-10 text-center px-8 max-w-lg">
        {/* Animated icon */}
        <div className="relative inline-block mb-8"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
            transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)'
          }}>
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
              border: '1px solid rgba(16,185,129,0.2)',
              boxShadow: '0 0 40px rgba(16,185,129,0.1)',
              animation: 'float 3s ease-in-out infinite'
            }}>
            <span style={{ fontSize: '36px' }}>📝</span>
          </div>
          {/* Ping */}
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{ background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'ping 2s infinite' }} />
        </div>

        {/* Greeting */}
        <div style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s'
        }}>
          <h1 className="font-bold mb-2"
            style={{
              fontSize: '28px',
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: '-0.02em',
              fontFamily: "'DM Sans', sans-serif"
            }}>
            Good {getTimeOfDay()},{' '}
            <span style={{ color: '#10b981' }}>{user?.name?.split(' ')[0] || 'there'}</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
            Select a note or create a new one to get started
          </p>
        </div>

        {/* Keyboard hint */}
        <div className="mt-6 flex items-center justify-center gap-2"
          style={{
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.6s ease 0.3s'
          }}>
          <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
            Click + New Note
          </kbd>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>to start writing</span>
        </div>

        {/* Feature cards */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {features.map((f, i) => (
            <div key={f.label}
              className="rounded-xl p-3 text-left"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${0.2 + i * 0.08}s`
              }}>
              <div className="text-xl mb-1.5">{f.icon}</div>
              <p className="font-semibold text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>{f.label}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', lineHeight: '1.4' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.5);opacity:0} }
      `}</style>
    </div>
  );
};

const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export default Dashboard;