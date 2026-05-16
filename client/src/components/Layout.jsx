import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

const TrashAnimation = ({ onComplete }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 1200);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ animation: 'trashDrop 1.2s cubic-bezier(0.25,0.46,0.45,0.94) forwards', fontSize: '48px' }}>🗑️</div>
      <style>{`
        @keyframes trashDrop {
          0%   { transform: translateY(-60px) scale(0.5); opacity: 0; }
          30%  { transform: translateY(0px) scale(1.2); opacity: 1; }
          50%  { transform: translateY(-10px) scale(1); opacity: 1; }
          70%  { transform: translateY(0px) scale(1); opacity: 1; }
          85%  { transform: translateY(0px) scale(1); opacity: 1; }
          100% { transform: translateY(60px) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const ArchiveAnimation = ({ onComplete }) => {
  useEffect(() => {
    const t = setTimeout(onComplete, 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      <div style={{ animation: 'archiveFloat 1.5s cubic-bezier(0.16,1,0.3,1) forwards', fontSize: '40px' }}>📦</div>
      <div style={{ animation: 'archiveText 1.5s ease forwards', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif" }}>Archived</div>
      <style>{`
        @keyframes archiveFloat {
          0%   { transform: translateY(20px) scale(0.8) rotate(-5deg); opacity: 0; }
          20%  { transform: translateY(0px) scale(1.1) rotate(5deg); opacity: 1; }
          40%  { transform: translateY(-5px) scale(1) rotate(-2deg); opacity: 1; }
          60%  { transform: translateY(0px) scale(1) rotate(0deg); opacity: 1; }
          80%  { transform: translateY(-30px) scale(0.9) rotate(3deg); opacity: 0.7; }
          100% { transform: translateY(-80px) scale(0.5) rotate(-5deg); opacity: 0; }
        }
        @keyframes archiveText {
          0%,30%  { opacity: 0; transform: translateY(10px); }
          50%     { opacity: 1; transform: translateY(0); }
          80%,100%{ opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

const Layout = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id: activeNoteId } = useParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeTags, setActiveTags] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [showArchiveAnim, setShowArchiveAnim] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [archivingId, setArchivingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  useEffect(() => { fetchNotes(); }, [location.pathname, showArchived]);

  // Close menu when clicking outside both the note card AND the portal menu
  useEffect(() => {
    const handler = (e) => {
      if (
        !e.target.closest('.note-menu-trigger') &&
        !e.target.closest('.note-portal-menu')
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notes?showArchived=${showArchived}`, {
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
    e?.stopPropagation();
    setOpenMenuId(null);
    setDeletingId(noteId);
    setShowTrash(true);
    setTimeout(async () => {
      try {
        await axios.delete(`${API_URL}/api/notes/${noteId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotes(prev => prev.filter(n => n._id !== noteId));
        if (activeNoteId === noteId) navigate('/dashboard');
      } catch (err) {
        console.error('Delete error:', err);
      } finally {
        setDeletingId(null);
      }
    }, 800);
  };

  const handleArchiveNote = async (noteId, e) => {
    e?.stopPropagation();
    setOpenMenuId(null);
    setArchivingId(noteId);
    setShowArchiveAnim(true);
    setTimeout(async () => {
      try {
        await axios.patch(`${API_URL}/api/notes/${noteId}/archive`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotes(prev => prev.filter(n => n._id !== noteId));
        if (activeNoteId === noteId) navigate('/dashboard');
      } catch (err) {
        console.error('Archive error:', err);
      } finally {
        setArchivingId(null);
      }
    }, 900);
  };

  const allTags = [...new Set(notes.flatMap(n => n.tags || []))];

  const filteredNotes = notes
    .filter(note => {
      const matchesSearch =
        note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags =
        activeTags.length === 0 ||
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

  const getInitials = (name) =>
    name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const toggleTag = (tag) =>
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );

  const activeNote = notes.find(n => n._id === openMenuId);

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {showTrash && <TrashAnimation onComplete={() => setShowTrash(false)} />}
      {showArchiveAnim && <ArchiveAnimation onComplete={() => setShowArchiveAnim(false)} />}

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-30 md:hidden flex items-center justify-center w-9 h-9 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <span className="text-white text-lg">{sidebarOpen ? '✕' : '☰'}</span>
      </button>

      {/* SIDEBAR */}
      <div
        className={`fixed md:relative z-30 md:z-auto h-full flex flex-col transition-transform duration-300 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ width: '280px', flexShrink: 0, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(32px)', borderRight: '1px solid rgba(255,255,255,0.06)', boxShadow: '4px 0 32px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div className="p-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="font-bold text-white" style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>CollabNotes</span>
          </div>
          <button onClick={handleCreateNote} disabled={creating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm"
            style={{ background: creating ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', boxShadow: creating ? 'none' : '0 4px 16px rgba(16,185,129,0.25)', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!creating) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
            {creating
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" style={{ animation: 'spin 1s linear infinite' }} />
              : <><span style={{ fontSize: '18px', lineHeight: 1 }}>+</span><span>New Note</span></>}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Search notes..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-lg outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', fontSize: '13px', transition: 'border-color 0.2s' }}
              onFocus={e => e.target.style.borderColor = 'rgba(16,185,129,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
          </div>
        </div>

        {/* Archive toggle */}
        <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 text-xs"
            style={{ color: showArchived ? '#f59e0b' : 'rgba(255,255,255,0.35)', transition: 'color 0.15s' }}>
            <span>{showArchived ? '📦' : '📁'}</span>
            <span>{showArchived ? 'Archived notes' : 'Active notes'}</span>
          </button>
          {showArchived && (
            <button onClick={() => setShowArchived(false)}
              className="text-xs px-2 py-0.5 rounded-lg"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
              ← Back
            </button>
          )}
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="px-4 py-3 flex flex-wrap gap-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button onClick={() => setActiveTags([])}
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: activeTags.length === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${activeTags.length === 0 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, color: activeTags.length === 0 ? '#10b981' : 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}>All</button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => toggleTag(tag)}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: activeTags.includes(tag) ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${activeTags.includes(tag) ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, color: activeTags.includes(tag) ? '#10b981' : 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}>#{tag}</button>
            ))}
          </div>
        )}

        {/* Note list */}
        <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {loading ? (
            <div className="px-4 space-y-3 mt-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', animation: 'pulse 2s ease-in-out infinite' }}>
                  <div className="h-3 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.08)', width: '70%' }} />
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', width: '100%' }} />
                </div>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
              <div className="text-4xl mb-3">{showArchived ? '📦' : '📭'}</div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {showArchived ? 'No archived notes' : searchQuery ? 'No notes found' : 'No notes yet'}
              </p>
            </div>
          ) : (
            <div className="px-3 space-y-1.5">
              {filteredNotes.map((note, i) => {
                const isActive = activeNoteId === note._id;
                const isDeleting = deletingId === note._id;
                const isArchiving = archivingId === note._id;

                return (
                  <div key={note._id}
                    className="relative rounded-xl"
                    style={{
                      animation: `slideIn 0.3s ease-out ${i * 0.04}s both`,
                      opacity: (isDeleting || isArchiving) ? 0 : 1,
                      transform: isDeleting ? 'scale(0.8) translateY(20px)' : isArchiving ? 'scale(0.9) translateY(-20px)' : 'scale(1)',
                      transition: 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)'
                    }}>

                    <div
                      onClick={() => { navigate(`/note/${note._id}`); setSidebarOpen(false); setOpenMenuId(null); }}
                      className="cursor-pointer p-3 rounded-xl relative"
                      style={{ background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`, transition: 'background 0.15s, border-color 0.15s' }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; } }}>

                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-full"
                          style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                      )}

                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold leading-tight truncate"
                          style={{ color: isActive ? '#10b981' : 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                          {note.title || 'Untitled'}
                        </h3>

                        <div className="flex items-center gap-1 shrink-0">
                          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px' }}>
                            {formatDate(note.updatedAt)}
                          </span>

                          {/* Three-dot button */}
                          <button
                            className="note-menu-trigger"
                            onClick={e => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPosition({ top: rect.top, left: rect.right + 8 });
                              setOpenMenuId(openMenuId === note._id ? null : note._id);
                            }}
                            style={{
                              width: '20px', height: '20px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '4px', border: 'none', cursor: 'pointer',
                              color: 'rgba(255,255,255,0.5)', fontSize: '16px',
                              background: openMenuId === note._id ? 'rgba(255,255,255,0.1)' : 'transparent',
                              transition: 'background 0.15s',
                              flexShrink: 0
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => {
                              if (openMenuId !== note._id) e.currentTarget.style.background = 'transparent';
                            }}>
                            ⋮
                          </button>
                        </div>
                      </div>

                      {getPreview(note.content) && (
                        <p className="text-xs mb-2"
                          style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '10px' }}>
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
                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover"
                  style={{ border: '2px solid rgba(16,185,129,0.3)' }} />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '11px' }}>
                  {getInitials(user?.name)}
                </div>
              )}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 500 }}>
                  {user?.name?.split(' ')[0]}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                  {notes.length} notes
                </p>
              </div>
            </div>
            <button onClick={logout}
              className="px-2.5 py-1.5 rounded-lg text-xs"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)', transition: 'all 0.15s' }}
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

      {/* Portal dropdown — renders on document.body above everything */}
      {openMenuId && createPortal(
        <div
          className="note-portal-menu"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: menuPosition.top,
            left: menuPosition.left,
            zIndex: 9999,
            background: 'rgba(8,16,36,0.97)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            minWidth: '160px',
            borderRadius: '12px',
            overflow: 'hidden',
            animation: 'menuPop 0.15s cubic-bezier(0.16,1,0.3,1)'
          }}>
          <button
            onClick={e => handleArchiveNote(openMenuId, e)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: '16px' }}>📦</span>
            <span>{activeNote?.isArchived ? 'Unarchive' : 'Archive'}</span>
          </button>
          <button
            onClick={e => handleDeleteNote(openMenuId, e)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.85)', fontSize: '13px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: '16px' }}>🗑️</span>
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes slideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes menuPop  { from{opacity:0;transform:scale(0.92) translateY(-4px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
};

export default Layout;
