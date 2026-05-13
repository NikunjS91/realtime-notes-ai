import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5001/api';

const Dashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(res.data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/notes`,
        { title: 'Untitled Note', content: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotes([res.data, ...notes]);
      navigate(`/note/${res.data._id}`);
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f]">
      <header className="bg-[#112240] p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">CollabNotes</h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-gray-300">Welcome, {user.name}</span>
          )}
          <button
            onClick={logout}
            className="text-gray-300 hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-white">Your Notes</h2>
          <button
            onClick={createNote}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            + New Note
          </button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-400">No notes yet. Create your first note!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <div
                key={note._id}
                onClick={() => navigate(`/note/${note._id}`)}
                className="bg-[#112240] p-4 rounded-lg cursor-pointer hover:bg-[#1a3152] transition-colors"
              >
                <h3 className="text-white font-semibold text-lg mb-2">
                  {note.title || 'Untitled Note'}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-3">
                  {note.content || 'No content'}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;