import React from "react";
import {
  FaServer,
  FaCogs,
  FaDatabase,
  FaFlask,
  FaBalanceScale,
  FaThermometerHalf,
  FaWind,
  FaBolt,
  FaChartBar,
  FaIndustry,
  FaPlay,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const machineData = [
  {
    name: "Spectrometer",
    icon: <FaFlask className="text-slate-600 text-2xl" />,
    status: "Online",
    protocol: "OPC UA / Ethernet",
    freq: "Real-time / batch",
    notes: "Primary source of alloy composition; outputs structured data",
    data: [
      { label: "Al (%)", value: 4.5 },
      { label: "Cu (%)", value: 2.0 },
      { label: "Si (%)", value: 4.0 },
      { label: "Fe (%)", value: 88.0 },
    ],
    energy: 12.5,
    consumption: 8.2,
    efficiency: 94,
  },
  {
    name: "Furnace Thermocouples",
    icon: <FaThermometerHalf className="text-slate-600 text-2xl" />,
    status: "Online",
    protocol: "Modbus / OPC UA",
    freq: "Real-time (1–5 sec)",
    notes: "Provides process context for melting & alloy consistency",
    data: [
      { label: "Zone 1 Temp (°C)", value: 1248 },
      { label: "Zone 2 Temp (°C)", value: 1252 },
    ],
    energy: 32.1,
    consumption: 21.7,
    efficiency: 87,
  },
  {
    name: "Dosing System",
    icon: <FaBalanceScale className="text-slate-600 text-2xl" />,
    status: "Online",
    protocol: "MQTT / OPC UA / Serial",
    freq: "Real-time / per batch",
    notes: "Tracks additions for ML corrections",
    data: [
      { label: "Cu Added (kg)", value: 5 },
      { label: "Al Added (kg)", value: 3 },
      { label: "Si Added (kg)", value: 1 },
    ],
    energy: 7.9,
    consumption: 4.1,
    efficiency: 96,
  },
  {
    name: "Stirrer/Mixer",
    icon: <FaCogs className="text-slate-600 text-2xl" />,
    status: "Online",
    protocol: "Modbus / OPC UA",
    freq: "Real-time",
    notes: "Helps model mixing efficiency and composition uniformity",
    data: [
      { label: "RPM", value: 150 },
      { label: "Torque", value: 50 },
      { label: "Mixing Time (min)", value: 10 },
    ],
    energy: 5.2,
    consumption: 2.8,
    efficiency: 91,
  },
  {
    name: "Load Cell/Scale",
    icon: <FaBalanceScale className="text-slate-600 text-2xl" />,
    status: "Online",
    protocol: "Modbus / Serial / MQTT",
    freq: "Real-time / per batch",
    notes: "Ensures correct batch sizing",
    data: [{ label: "Batch Weight (kg)", value: 2000 }],
    energy: 2.1,
    consumption: 1.2,
    efficiency: 98,
  },
  {
    name: "Gas/Oxygen Flow Sensors",
    icon: <FaWind className="text-slate-600 text-2xl" />,
    status: "Online",
    protocol: "Modbus / OPC UA",
    freq: "Real-time",
    notes: "Important for oxidation/reduction control",
    data: [
      { label: "O₂ (%)", value: 0.1 },
      { label: "Flow (L/min)", value: 5.5 },
    ],
    energy: 3.7,
    consumption: 2.0,
    efficiency: 89,
  },
  {
    name: "Cooling/Quenching System",
    icon: <FaServer className="text-slate-600 text-2xl" />,
    status: "Online",
    protocol: "Modbus / OPC UA",
    freq: "Real-time / per batch",
    notes: "Influences final microstructure",
    data: [{ label: "Cooling Rate (°C/min)", value: 15 }],
    energy: 6.8,
    consumption: 3.9,
    efficiency: 93,
  },
  {
    name: "Historical Database / MES",
    icon: <FaDatabase className="text-slate-600 text-2xl" />,
    status: "Online",
    protocol: "REST API / SQL",
    freq: "Batch / per day",
    notes: "Used for ML training and reference",
    data: [
      { label: "Prev. Batch Purity", value: "99.5%" },
      { label: "Corrections", value: "Auto" },
    ],
    energy: 1.2,
    consumption: 0.7,
    efficiency: 99,
  },
];

// Chart Data
const energyTrendData = [
  { time: "00:00", energy: 45 },
  { time: "04:00", energy: 52 },
  { time: "08:00", energy: 71 },
  { time: "12:00", energy: 78 },
  { time: "16:00", energy: 65 },
  { time: "20:00", energy: 58 },
];

const machineEfficiencyData = machineData.map((m) => ({
  name: m.name.split(" ")[0],
  efficiency: m.efficiency,
}));

const energyDistributionData = machineData.map((m, idx) => ({
  name: m.name.split(" ")[0],
  value: m.energy,
  color: [
    "#64748b",
    "#475569",
    "#334155",
    "#1e293b",
    "#0f172a",
    "#64748b",
    "#475569",
    "#334155",
  ][idx % 8],
}));

// Calculate overall totals
const totalEnergy = machineData.reduce((sum, m) => sum + m.energy, 0);
const totalConsumption = machineData.reduce((sum, m) => sum + m.consumption, 0);
const avgEfficiency =
  machineData.reduce((sum, m) => sum + m.efficiency, 0) / machineData.length;

const HomeDashboard = () => (
  <div className="min-h-screen bg-gray-50 py-8 px-4">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <FaIndustry className="text-slate-700 text-3xl" />
          <h1 className="text-3xl md:text-4xl font-light text-slate-800 tracking-wide">
            Industrial Operations Dashboard
          </h1>
        </div>
        <p className="text-slate-600 text-lg font-light leading-relaxed">
          Real-time monitoring and analytics for industrial alloying systems
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">
                Total Energy
              </p>
              <p className="text-2xl font-light text-slate-800">
                {totalEnergy.toFixed(1)} kWh
              </p>
            </div>
            <FaBolt className="text-slate-400 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">
                Consumption
              </p>
              <p className="text-2xl font-light text-slate-800">
                {totalConsumption.toFixed(1)} t
              </p>
            </div>
            <FaChartBar className="text-slate-400 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">
                Avg Efficiency
              </p>
              <p className="text-2xl font-light text-slate-800">
                {avgEfficiency.toFixed(1)}%
              </p>
            </div>
            <FaCogs className="text-slate-400 text-2xl" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">
                Active Systems
              </p>
              <p className="text-2xl font-light text-slate-800">
                {machineData.length}
              </p>
            </div>
            <FaServer className="text-slate-400 text-2xl" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4">
            Energy Consumption Trend
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={energyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="energy"
                stroke="#64748b"
                strokeWidth={2}
                dot={{ fill: "#64748b", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4">
            Machine Efficiency
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={machineEfficiencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="efficiency" fill="#64748b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-slate-800 mb-4">
            Energy Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={energyDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {energyDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {machineData.map((m, idx) => (
          <div
            key={m.name}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {m.icon}
                <div>
                  <h3 className="font-medium text-slate-800 text-sm">
                    {m.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        m.status === "Online" ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs text-slate-500">{m.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Protocol</span>
                <span className="text-slate-700 font-medium">
                  {m.protocol.split(" / ")[0]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Frequency</span>
                <span className="text-slate-700 font-medium">
                  {m.freq.split(" ")[0]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Energy</span>
                <span className="text-slate-700 font-medium">
                  {m.energy} kWh
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Efficiency</span>
                <span className="text-slate-700 font-medium">
                  {m.efficiency}%
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="grid grid-cols-2 gap-2">
                {m.data.slice(0, 4).map((d) => (
                  <div key={d.label} className="text-xs">
                    <span className="text-slate-500">{d.label}</span>
                    <div className="font-medium text-slate-700">{d.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-slate-600 text-xs font-medium">
                Technical Details
              </summary>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {m.notes}
              </p>
            </details>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default HomeDashboard;
