import React, { useEffect, useState } from "react";

const Header: React.FC = () => {
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data when the component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
        try {
          const response = await fetch("http://localhost:8000/api/tableau/get_user_info", {
            method: "GET",
            credentials: "include", // Include JWT cookie
          });
      
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.error || "Failed to fetch user data");
            return;
          }
      
          const data = await response.json();
          setUserData({ name: data.name, email: data.email });
        } catch (err) {
          setError("An error occurred while fetching user data");
        }
      };
      
    fetchUserInfo();
  }, []);

  return (
    <header className="bg-indigo-600 text-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="font-bold text-xl">Kutty Tableau</div>

        {/* User Info */}
        <div className="flex items-center space-x-4">
          {error ? (
            <span className="text-red-500">{error}</span>
          ) : userData ? (
            <>
              <span>Hello, {userData.name}</span>
              <button
                className="bg-white text-indigo-600 px-4 py-1 rounded hover:bg-gray-100"
                onClick={() => {
                  document.cookie = "jwt=; Max-Age=0"; // Clear JWT cookie
                  window.location.href = "/login"; // Redirect to login
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <span>Loading...</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
