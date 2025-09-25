import React from "react";
import { FaFileExport, FaFilter } from "react-icons/fa";

const Header = () => {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const role = localStorage.getItem("role");
  let userName = "User";
  try {
    const userObj = JSON.parse(localStorage.getItem("user"));
    userName = userObj?.name || userObj?.fullName || userObj?.firstName || userObj?.email || "User";
  } catch {}

  return (
    <div className={`p-3 mb-3 transition-all duration-300 `}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-lg font-bold text-gray-800 mb-0">
              Welcome back, {userName}!
            </h1>
            <p className="text-gray-500 text-xs">
              Dashboard Overview &mdash; {today}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
              {role === "admin" ? "Admin Panel" : role === "telecaller" ? "Telecaller Panel" : "Panel"}
            </span>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold">
              All Systems Operational
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600 text-xs font-medium flex items-center gap-1 shadow-sm">
            <FaFileExport className="w-4 h-4" />
            Export
          </button>
          <button className="bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-600 text-xs font-medium flex items-center gap-1 shadow-sm">
            <FaFilter className="w-4 h-4" />
            Filter
          </button>
          <img
            src="https://randomuser.me/api/portraits/men/1.jpg"
            alt="User"
            className="w-8 h-8 rounded-full border-2 border-blue-200 ml-2 shadow"
          />
        </div>
      </div>
    </div>
  );
};

export default Header;