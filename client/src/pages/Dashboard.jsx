import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

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
        <h2 className="text-xl text-white mb-4">Your Notes</h2>
        <p className="text-gray-400">No notes yet. Create your first note!</p>
      </main>
    </div>
  );
};

export default Dashboard;