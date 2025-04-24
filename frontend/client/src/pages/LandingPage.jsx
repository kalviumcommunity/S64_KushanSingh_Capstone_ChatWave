import React from "react";
import { Sparkles, Lock, RefreshCw } from "lucide-react";

const StatCard = ({ value, label }) => (
  <div className="bg-gray-100 rounded-xl p-4 text-center shadow-sm w-28">
    <p className="text-blue-600 font-bold text-xl">{value}</p>
    <p className="text-gray-500 text-sm">{label}</p>
  </div>
);

const FeatureCard = ({ icon, text }) => (
  <div className="flex items-center gap-4 bg-gray-100 rounded-xl p-4 shadow-sm w-full max-w-md">
    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
      {icon}
    </div>
    <p className="text-gray-700 font-medium">{text}</p>
  </div>
);

const ChatWaveLanding = () => {
  return (
    <div className="h-screen w-screen bg-gradient-to-r from-blue-100 to-blue-300 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-xl w-full text-center space-y-6">
        {/* Logo & Title */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
            🌊
          </div>
          <h1 className="text-2xl font-bold text-black">ChatWave</h1>
          <p className="text-gray-500 text-sm">Smooth, Real-Time Conversations</p>
        </div>

        {/* CTA Button */}
        <button className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-blue-700 transition">
          Get Started
        </button>

        {/* Stats Section */}
        <div className="flex justify-between items-center gap-4 mt-4">
          <StatCard value="100%" label="Secure" />
          <StatCard value="24/7" label="Support" />
          <StatCard value="1000+" label="Users" />
        </div>

        {/* Features Section */}
        <div className="space-y-4 mt-6 flex flex-col items-center">
          <FeatureCard icon={<Sparkles size={20} />} text="Real-time messaging" />
          <FeatureCard icon={<Lock size={20} />} text="End-to-end encryption" />
          <FeatureCard icon={<RefreshCw size={20} />} text="Cross-platform sync" />
        </div>
      </div>
    </div>
  );
};

export default ChatWaveLanding;
