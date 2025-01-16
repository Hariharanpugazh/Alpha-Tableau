import React, { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";

const Header: React.FC = () => {
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

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
        <div className="relative flex items-center space-x-4">
          {error ? (
            <span className="text-red-500">{error}</span>
          ) : userData ? (
            <>
              <span>Hello, {userData.name}</span>
              <div className="relative">
                {/* Profile Icon */}
                <FaUserCircle
                  className="text-2xl cursor-pointer hover:text-gray-300"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-32 bg-white rounded shadow-lg">
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        document.cookie = "jwt=; Max-Age=0"; // Clear JWT cookie
                        window.location.href = "/login"; // Redirect to login
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
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
