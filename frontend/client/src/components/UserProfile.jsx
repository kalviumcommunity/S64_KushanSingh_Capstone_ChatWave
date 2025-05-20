import React from "react";
import { LogOut, LayoutGrid } from "lucide-react";

const UserProfile = () => {
  return (
    <div className="h-screen w-screen bg-gradient-to-r from-blue-100 to-blue-300 flex flex-col">

     {/* Top Navbar */}
<div className="w-full bg-white p-4 flex justify-between items-center shadow z-10">
  {/* Left: Logo */}
  <div className="flex items-center gap-2 font text-lg">
    <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-2xl text-blue-600">
      🌊
    </div>
    <span className="text-black">ChatWave</span>
  </div>

  {/* Right: Logout */}
  <button className="flex items-center gap-2 text-gray-700 hover:text-red-500 transition font-medium">
    <LogOut size={18} />
    Logout
  </button>
</div>



      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-xl w-full text-center space-y-6">

          {/* 👤 Logo & Title */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
              👤
            </div>
            <h1 className="text-2xl font-bold text-black">Profile</h1>
            <p className="text-gray-500 text-sm">Manage your account settings and info</p>
          </div>

          {/* Email */}
          <p className="text-gray-700 text-sm">sarah.anderson@example.com</p>

          {/* Buttons */}
          <div className="flex justify-center gap-4">
            <button className="flex items-center gap-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-50 transition">
              <LayoutGrid size={18} />
              Dashboard
            </button>
            <button className="flex items-center gap-2 border border-red-500 text-red-500 px-4 py-2 rounded-full hover:bg-red-50 transition">
              <LogOut size={18} />
              Logout
            </button>
          </div>

          {/* Account Details */}
          <div className="bg-gray-100 rounded-xl p-4 text-left space-y-2">
            <h3 className="text-gray-700 font-semibold mb-2">Account Details</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Member Since:</span>
              <span className="font-medium text-black">January 2024</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Account Type:</span>
              <span className="font-medium text-black">Premium</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Last Login:</span>
              <span className="font-medium text-black">Today at 2:30 PM</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
