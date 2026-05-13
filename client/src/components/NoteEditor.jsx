import { useNoteSync } from '../hooks/useNoteSync';
import { useAuth } from '../context/AuthContext';

const NoteEditor = ({ noteId }) => {
  const { token } = useAuth();
  const { content, title, cursors, updateNote } = useNoteSync(noteId, token);

  const handleTitleChange = (e) => {
    updateNote(e.target.value, content);
  };

  const handleContentChange = (e) => {
    updateNote(title, e.target.value);
  };

  return (
    <div className="min-h-screen bg-[#0a192f] p-6">
      <div className="max-w-4xl mx-auto">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="w-full bg-transparent text-3xl font-bold text-white mb-6 outline-none placeholder-gray-500"
          placeholder="Note title..."
        />

        <textarea
          value={content}
          onChange={handleContentChange}
          className="w-full h-[calc(100vh-200px)] bg-transparent text-white text-lg outline-none resize-none placeholder-gray-500"
          placeholder="Start writing..."
        />

        {Object.keys(cursors).length > 0 && (
          <div className="fixed bottom-4 right-4 flex gap-2">
            {Object.entries(cursors).map(([userId, data]) => (
              <div
                key={userId}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-full"
              >
                {data.userName}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;