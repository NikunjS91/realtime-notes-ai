import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams,useLocation} from 'react-router-dom';
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

  useEffect(() => {
    fetchNotes();
  }, [location.pathname]);

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
    } catch (err) {
      console.error('Error creating note:', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredNotes = notes
    .filter(note => note.title?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPreview = (content) => {
    if (!content) return 'No content';
    return content.slice(0, 60) + (content.length > 60 ? '...' : '');
  };

  return (
    <div className="min-h-screen bg-[#0a192f] flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#112240] h-screen fixed flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#1a3152]">
          <h1 className="text-xl font-bold text-white mb-4">CollabNotes</h1>
          <button
            onClick={handleCreateNote}
            disabled={creating}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {creating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              '+ New Note'
            )}
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#1a3152]">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0a192f] text-white px-3 py-2 rounded-lg outline-none border border-[#1a3152] focus:border-green-500"
          />
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-[#1a3152] rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-[#1a3152] rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-4 text-gray-400 text-center">
              {searchQuery ? 'No notes found' : 'No notes yet — click New Note to start'}
            </div>
          ) : (
            filteredNotes.map(note => (
              <div
                key={note._id}
                onClick={() => navigate(`/note/${note._id}`)}
                className={`p-3 cursor-pointer border-l-2 transition-colors ${
                  noteId === note._id
                    ? 'border-l-green-500 bg-[#1a3152]'
                    : 'border-l-transparent hover:bg-[#1a3152]'
                }`}
              >
                <h3 className="text-white font-medium text-sm mb-1">
                  {note.title || 'Untitled'}
                </h3>
                <p className="text-gray-400 text-xs mb-1">
                  {getPreview(note.content)}
                </p>
                <p className="text-gray-500 text-xs">
                  {formatDate(note.updatedAt)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-[#1a3152] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user?.photo ? (
              <img
                src={user.photo}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="text-white text-sm">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;