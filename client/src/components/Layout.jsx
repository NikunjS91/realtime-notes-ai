import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

const Layout = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: noteId } = useParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeTags, setActiveTags] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [swipedNote, setSwipedNote] = useState(null);
  const touchStart = useRef(null);

  useEffect(() => { fetchNotes(); }, [location.pathname]);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(res.data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    setCreating(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/notes`,
        { title: 'Untitled', content: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchNotes();
      navigate(`/note/${res.data._id}`);
      setSidebarOpen(false);
    } catch (err) {
      console.error('Error creating note:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API_URL}/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(prev => prev.filter(n => n._id !== noteId));
      setSwipedNote(null);
      navigate('/dashboard');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))];

  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags = activeTags.length === 0 ||
        activeTags.every(tag => note.tags?.includes(tag));
      return matchesSearch && matchesTags;
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPreview = (content) => {
    if (!content) return '';
    return content.replace(/\n/g, ' ').slice(0, 80) + (content.length > 80 ? '…' : '');
  };

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const toggleTag = (tag) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{
      fontFamily: "'DM Sans', sans-serif"
    }}>

      {/* Aurora background is now handled by CSS in index.css */}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile hamburger */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-30 md:hidden flex items-center justify-center w-9 h-9 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <span className="text-white text-lg">{sidebarOpen ? '✕' : '☰'}</span>
      </button>

      {/* SIDEBAR */}
      <div className={`
        fixed md:relative z-30 md:z-auto h-full flex flex-col
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} style={{
        width: '280px',
        flexShrink: 0,
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(32px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '4px 0 32px rgba(0,0,0,0.3)'
      }}>

        {/* Header */}
        <div className="p-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span className="font-bold text-white" style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>CollabNotes</span>
          </div>

          <button onClick={handleCreateNote} disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all duration-200"
            style={{
              background: creating ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              boxShadow: creating ? 'none' : '0 4px 16px rgba(16,185,129,0.25)',
              transform: creating ? 'scale(0.98)' : 'scale(1)'
            }}
            onMouseEnter={e => { if (!creating) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
            {creating ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
                <span>New Note</span>
              </>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '13px'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="px-4 py-3 flex flex-wrap gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => setActiveTags([])}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
              style={{
                background: activeTags.length === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeTags.length === 0 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTags.length === 0 ? '#10b981' : 'rgba(255,255,255,0.5)'
              }}>All</button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150"
                style={{
                  background: activeTags.includes(tag) ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeTags.includes(tag) ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: activeTags.includes(tag) ? '#10b981' : 'rgba(255,255,255,0.4)'
                }}>#{tag}</button>
            ))}
          </div>
        )}

        {/* Note list */}
        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {loading ? (
            <div className="px-4 space-y-3 mt-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl p-3 animate-pulse"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', animationDelay: `${i * 0.1}s` }}>
                  <div className="h-3 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.08)', width: '70%' }} />
                  <div className="h-2 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.05)', width: '100%' }} />
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', width: '60%' }} />
                </div>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {searchQuery ? 'No notes match your search' : 'No notes yet'}
              </p>
              {!searchQuery && (
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Click + New Note to get started
                </p>
              )}
            </div>
          ) : (
            <div className="px-3 space-y-1.5">
              {filteredNotes.map((note, i) => {
                const isActive = noteId === note._id;
                const isSwiped = swipedNote === note._id;

                return (
                  <div key={note._id} className="relative overflow-hidden rounded-xl"
                    style={{ animation: `slideIn 0.3s ease-out ${i * 0.04}s both` }}>

                    {/* Delete action (revealed on swipe) */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-3"
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        transition: 'opacity 0.2s',
                        opacity: isSwiped ? 1 : 0,
                        pointerEvents: isSwiped ? 'auto' : 'none'
                      }}>
                      <button onClick={(e) => handleDeleteNote(note._id, e)}
                        className="flex flex-col items-center gap-0.5">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                        <span className="text-white text-xs">Delete</span>
                      </button>
                    </div>

                    {/* Note card */}
                    <div onClick={() => { navigate(`/note/${note._id}`); setSidebarOpen(false); setSwipedNote(null); }}
                      onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
                      onTouchEnd={e => {
                        if (touchStart.current - e.changedTouches[0].clientX > 50) setSwipedNote(note._id);
                        else if (e.changedTouches[0].clientX - touchStart.current > 30) setSwipedNote(null);
                      }}
                      className="cursor-pointer p-3 rounded-xl transition-all duration-200 relative"
                      style={{
                        background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)',
                        transition: 'transform 0.25s ease, background 0.15s, border-color 0.15s'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                        }
                      }}>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full"
                          style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                      )}

                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight truncate"
                          style={{ color: isActive ? '#10b981' : 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                          {note.title || 'Untitled'}
                        </h3>
                        <span className="text-xs shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
                          {formatDate(note.updatedAt)}
                        </span>
                      </div>

                      {getPreview(note.content) && (
                        <p className="text-xs mb-2 line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', lineHeight: '1.4' }}>
                          {getPreview(note.content)}
                        </p>
                      )}

                      {note.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 rounded-md text-xs"
                              style={{ background: 'rgba(16,185,129,0.1)', color: 'rgba(16,185,129,0.7)', fontSize: '10px' }}>
                              #{tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>
                              +{note.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                  style={{ border: '2px solid rgba(16,185,129,0.3)' }} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '11px' }}>
                  {getInitials(user?.name)}
                </div>
              )}
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                  {user?.name?.split(' ')[0]}
                </p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                  {notes.length} notes
                </p>
              </div>
            </div>
            <button onClick={logout}
              className="px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,20px)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>
    </div>
  );
};

export default Layout;