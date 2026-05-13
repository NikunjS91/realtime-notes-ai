import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-6">📝</div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-400 mb-2">
          Select a note from the sidebar to start editing
        </p>
        <p className="text-gray-500 text-sm">
          or click <span className="text-green-400 font-medium">+ New Note</span> to create one
        </p>
      </div>
    </div>
  );
};

export default Dashboard;