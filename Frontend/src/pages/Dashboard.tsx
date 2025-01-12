import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header.tsx";

const Dashboard: React.FC = () => {
  const { user_id } = useParams<{ user_id: string }>(); // Extract user_id from URL
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to toggle sidebar
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-lg transition-transform duration-300 ${
          isSidebarOpen ? "w-64" : "w-16"
        } flex flex-col`}
      >
        {/* Toggle Button */}
        <button
          className="bg-indigo-600 text-white p-2 m-2 rounded-full self-center hover:bg-indigo-700 focus:outline-none"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          {isSidebarOpen ? (
            <span className="material-icons">Menu</span> // Icon for close
          ) : (
            <span className="material-icons">Menu</span> // Icon for open (hamburger)
          )}
        </button>

        {/* Sidebar Content */}
        {isSidebarOpen && (
          <>
            <nav className="mt-6">
              <ul>
                <li className="px-4 py-2 hover:bg-gray-200">
                  <a
                    href="#"
                    className="flex items-center"
                    onClick={() => navigate(`/dataprofile/${user_id}`)}
                  >
                    <span className="text-gray-700">Data Profile</span>
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
          </>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Main Section */}
        <main className="flex-1 p-6">
          <div className="bg-white shadow p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h2>
            <p className="text-gray-600">This is where you can manage your data and insights.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
