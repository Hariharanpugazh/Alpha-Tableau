import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { user_id } = useParams<{ user_id: string }>(); // Extract user_id from URL
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user_id) {
      setError("Invalid user ID.");
      return;
    }

    // Fetch user-specific data
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/tableau/user_dashboard/${user_id}/`, {
          method: "GET",
          credentials: "include", // Include cookies
        });

        const data = await response.json();
        if (response.ok) {
          setUserData(data.data); // Set user data
        } else {
          setError(data.error || "Failed to fetch user data.");
          if (response.status === 404) {
            navigate("/login"); // Redirect to login if user not found
          }
        }
      } catch (err) {
        setError("An error occurred. Please try again later.");
      }
    };

    fetchUserData();
  }, [user_id, navigate]);

  const handleLogout = () => {
    navigate('/')
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Sidebar */}
      <div className="flex">
        <aside className="w-64 bg-white shadow-lg">
          <div className="p-4 text-xl font-bold text-gray-700">Your Brand</div>
          <nav className="mt-6">
            <ul>
              <li className="px-4 py-2 hover:bg-gray-200">
                <a
                  href="#"
                  className="flex items-center"
                  onClick={() => navigate(`/dataprofile/${user_id}`)}
                >
                  <span className="text-gray-700">Data Profile </span>
                </a>
              </li>
              <li className="px-4 py-2 hover:bg-gray-200">
                <a href="#" className="flex items-center">
                  <span className="text-gray-700">Datasets</span>
                </a>
              </li>
              <li className="px-4 py-2 hover:bg-gray-200">
                <a href="#" className="flex items-center">
                  <span className="text-gray-700">BI Dashboards</span>
                </a>
              </li>
              <li className="px-4 py-2 hover:bg-gray-200">
                <a href="#" className="flex items-center">
                  <span className="text-gray-700">Apps</span>
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between bg-white shadow p-4">
            <h1 className="text-xl font-semibold text-gray-700">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="text-gray-700">
                {userData ? `Hello, ${userData.name}` : "Loading..."}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </header>

          <main className="flex-1 p-6">
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="bg-white shadow p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h2>
                <p className="text-gray-600">This is where you can manage your data and insights.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
