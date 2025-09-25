import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Users,
  User,
  Mic,
  Settings,
  FolderOpen,
  FileText,
  BarChart2,
  LogOut,
  Torus,
  Activity,
  Database,
  Zap,
  TrendingUp,
  FileBarChart,
  Wrench,
} from "lucide-react";
import {
  FaRobot,
  FaIndustry,
  FaFlask,
  FaThermometerHalf,
  FaCogs,
  FaBalanceScale,
  FaRecycle,
  FaChartLine,
  FaDatabase,
  FaServer,
  FaWind,
  FaFire,
  FaMicrochip,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { name: "Onboard-Tour", icon: Torus, path: "" },
  {
    name: "Operations Dashboard",
    icon: LayoutDashboard,
    path: "/admin-dashboard",
  },
  {
    name: "Metal Composition Readings",
    icon: FaFlask,
    path: "/metal-readings",
  },
  { name: "Spectrometer Analysis", icon: FaFlask, path: "/spectrometer" },
  {
    name: "Furnace Temperature Control",
    icon: FaThermometerHalf,
    path: "/furnace-control",
  },
  {
    name: "Dosing & Weighing Systems",
    icon: FaBalanceScale,
    path: "/dosing-systems",
  },
  {
    name: "Stirrer & Mixing Control",
    icon: FaCogs,
    path: "/mixing-operations",
  },
  { name: "Gas Flow & O₂ Sensors", icon: FaWind, path: "/gas-sensors" },
  { name: "Cooling System Control", icon: FaServer, path: "/cooling-systems" },
  { name: "Scrap Metal Logistics", icon: FaRecycle, path: "/scrap-analysis" },
  { name: "ML Process Optimization", icon: FaRobot, path: "/ml-predictions" },
  {
    name: "Alloy Quality Reports",
    icon: FileBarChart,
    path: "/quality-reports",
  },
  { name: "Production Analytics", icon: TrendingUp, path: "/data-analytics" },
  { name: "Equipment Health Monitor", icon: Activity, path: "/system-health" },
  { name: "Process Settings", icon: Settings, path: "/settings" },
  { name: "Technical Documentation", icon: FolderOpen, path: "/documentation" },
];

const SideBar = ({ setRunTour }) => {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "";

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeSidebar();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 sm:hidden text-gray-500"
      >
        <svg className="h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            clipRule="evenodd"
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
          />
        </svg>
      </button>

      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-40 w-[17%] h-screen transition-transform bg-white shadow-xl border-r border-black transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Company Header with mild green gradient */}
          <div className="bg-gradient-to-b from-emerald-50 to-green-50 px-4 py-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                <FaIndustry className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-800">
                  Metallisence
                </h1>
                <p className="text-xs text-gray-600">Alloying Operations</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg px-3 py-3">
              <div className="text-sm font-medium text-emerald-700 mb-1">
                Production Manager
              </div>
              <div className="text-xs text-gray-600 leading-relaxed">
                METALLURGY FACILITY
                <br />
                Alloying Plant, Guindy
                <br />
                Chennai, TN 600032
              </div>
            </div>
          </div>

          {/* Menu Items with custom scrollbar */}
          <div className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2">
                Machine Operations
              </div>

              {menuItems.slice(0, 10).map(({ name, icon: Icon, path }, idx) => (
                <li key={idx} className="list-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (name === "Onboard-Tour" && setRunTour) {
                        setRunTour(true);
                      } else if (name === "Operations Dashboard") {
                        navigate("/admin-dashboard");
                        closeSidebar();
                      } else {
                        navigate(path);
                        closeSidebar();
                      }
                    }}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      (name === "Operations Dashboard" &&
                        window.location.pathname === "/admin-dashboard") ||
                      window.location.pathname === path
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                    } sidebar-tour-step sidebar-tour-step-${idx}`}
                  >
                    <Icon
                      size={18}
                      className={`${
                        (name === "Operations Dashboard" &&
                          window.location.pathname === "/admin-dashboard") ||
                        window.location.pathname === path
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    />
                    <span className="text-xs">{name}</span>
                  </button>
                </li>
              ))}

              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2 mt-6">
                Process Analytics & AI
              </div>

              {menuItems.slice(10, 15).map(({ name, icon: Icon, path }, idx) => (
                <li key={idx + 10} className="list-none">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(path);
                      closeSidebar();
                    }}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      window.location.pathname === path
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`${
                        window.location.pathname === path
                          ? "text-white"
                          : "text-gray-500"
                      }`}
                    />
                    <span className="text-xs">{name}</span>
                  </button>
                </li>
              ))}

              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 px-2 mt-6">
                System Management
              </div>

              {menuItems.slice(15).map(({ name, icon: Icon, path }, idx) => {
                // don't render Settings for telecaller users
                if (name === "Process Settings" && role === "telecaller")
                  return null;

                return (
                  <li key={idx + 15} className="list-none">
                    <button
                      type="button"
                      onClick={() => {
                        navigate(path);
                        closeSidebar();
                      }}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        window.location.pathname === path
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={`${
                          window.location.pathname === path
                            ? "text-white"
                            : "text-gray-500"
                        }`}
                      />
                      <span className="text-xs">{name}</span>
                    </button>
                  </li>
                );
              })}
            </div>
          </div>

          {/* System Status */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-emerald-700 font-medium">
                  All Systems Online
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                4 Units • 8 Machines • 3 Furnaces
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 p-3 rounded-lg font-medium text-sm w-full text-left transition-all duration-200"
            >
              <LogOut size={18} />
              <span className="text-xs">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Custom Scrollbar Styles - Fixed: removed jsx attribute */}
      <style>
        {`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }
        `}
      </style>
    </>
  );
};

export default SideBar;
