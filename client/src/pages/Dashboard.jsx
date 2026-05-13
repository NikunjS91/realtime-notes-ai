import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Welcome to CollabNotes
        </h1>
        <p className="text-gray-400 mb-2">
          Select a note from the sidebar or create a new one.
        </p>
        <p className="text-gray-500 text-sm">
          Hi {user?.name || 'there'}! Your notes are syncing in real-time.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;