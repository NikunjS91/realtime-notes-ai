import { useParams, useNavigate } from 'react-router-dom';
import NoteEditor from '../components/NoteEditor';

const NotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex items-center justify-center">
        <div className="text-gray-400">Note not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      {/* Header with back button */}
      <div className="bg-[#112240] px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <span className="text-gray-500">|</span>
        <button
          className="text-gray-400 hover:text-white text-sm cursor-not-allowed"
          title="Coming soon"
        >
          Share
        </button>
      </div>
      <NoteEditor noteId={id} />
    </div>
  );
};

export default NotePage;