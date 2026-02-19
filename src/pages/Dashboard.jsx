import { useAuth } from "../context/AuthContext";

const Dashboard = () => {

  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-96 text-center">
        <h1 className="text-2xl font-semibold mb-4">
          Welcome {user?.name}
        </h1>
        <p className="text-gray-600">Email: {user?.email}</p>
        <p className="text-blue-600 font-medium mt-2">
          Tokens: {user?.tokens}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
