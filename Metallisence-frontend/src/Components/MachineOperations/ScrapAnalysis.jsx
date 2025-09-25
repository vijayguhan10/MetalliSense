import React, { useState, useMemo } from "react";
import {
  FaTruck,
  FaWarehouse,
  FaRecycle,
  FaClipboardList,
  FaRoute,
  FaWeightHanging,
  FaIndustry,
  FaChartLine,
  FaBoxes,
  FaShippingFast,
  FaCogs,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaPlus,
  FaEdit,
  FaEye,
  FaDownload,
  FaFilter,
  FaSearch,
  FaSort,
  FaLeaf,
  FaDollarSign,
  FaFlask,
  FaFireAlt,
  FaBolt,
  FaShieldAlt,
  FaAtom,
  FaGem,
  FaRocket,
  FaMicrochip,
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
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";

// Mock Data
const metalUsageData = [
  {
    id: "METAL-001",
    metalType: "High-Grade Steel",
    category: "Ferrous",
    grade: "Premium",
    virginQuantity: 5000,
    scrapQuantity: 2800,
    recycledQuantity: 2650,
    totalUsage: 7800,
    unit: "kg",
    virginCost: 1.2,
    scrapCost: 0.85,
    savings: 980,
    recyclingEfficiency: 94.6,
    carbonSaved: 3.2,
    energySaved: 1250,
    applications: ["Automotive", "Construction", "Machinery"],
    qualityRetention: 96.8,
    marketValue: 9360,
    lastProcessed: "2024-09-23",
    processingStage: "Melting",
    supplier: "Premium Steel Works",
    location: "Furnace Bay 1",
    status: "Active Processing",
    icon: FaIndustry,
  },
  {
    id: "METAL-002",
    metalType: "Aerospace Aluminum",
    category: "Non-Ferrous",
    grade: "Premium",
    virginQuantity: 3200,
    scrapQuantity: 1800,
    recycledQuantity: 1710,
    totalUsage: 4910,
    unit: "kg",
    virginCost: 2.45,
    scrapCost: 1.85,
    savings: 1080,
    recyclingEfficiency: 95.0,
    carbonSaved: 5.8,
    energySaved: 2100,
    applications: ["Aerospace", "Electronics", "Automotive"],
    qualityRetention: 98.2,
    marketValue: 12027,
    lastProcessed: "2024-09-23",
    processingStage: "Alloying",
    supplier: "AeroMetal Industries",
    location: "Processing Center A",
    status: "Quality Check",
    icon: FaRocket,
  },
  {
    id: "METAL-003",
    metalType: "Electronic Copper",
    category: "Non-Ferrous",
    grade: "Industrial",
    virginQuantity: 1500,
    scrapQuantity: 890,
    recycledQuantity: 845,
    totalUsage: 2345,
    unit: "kg",
    virginCost: 8.75,
    scrapCost: 6.2,
    savings: 2269,
    recyclingEfficiency: 94.9,
    carbonSaved: 2.1,
    energySaved: 890,
    applications: ["Electronics", "Electrical", "Telecommunications"],
    qualityRetention: 97.5,
    marketValue: 20518,
    lastProcessed: "2024-09-22",
    processingStage: "Refining",
    supplier: "TechMetal Solutions",
    location: "Refinery Unit 2",
    status: "Ready for Use",
    icon: FaMicrochip,
  },
  {
    id: "METAL-004",
    metalType: "Titanium Alloy",
    category: "Specialty",
    grade: "Premium",
    virginQuantity: 800,
    scrapQuantity: 450,
    recycledQuantity: 427,
    totalUsage: 1227,
    unit: "kg",
    virginCost: 35.5,
    scrapCost: 28.4,
    savings: 3195,
    recyclingEfficiency: 94.9,
    carbonSaved: 1.8,
    energySaved: 1850,
    applications: ["Aerospace", "Medical", "Military"],
    qualityRetention: 99.1,
    marketValue: 43558,
    lastProcessed: "2024-09-21",
    processingStage: "Final Processing",
    supplier: "Titanium Specialists",
    location: "Specialty Furnace",
    status: "Quality Approved",
    icon: FaGem,
  },
];

const processAnalytics = [
  {
    process: "Melting",
    efficiency: 94.5,
    energyConsumption: 3200,
    throughput: 2800,
    icon: FaFireAlt,
  },
  {
    process: "Alloying",
    efficiency: 96.2,
    energyConsumption: 2100,
    throughput: 2200,
    icon: FaAtom,
  },
  {
    process: "Refining",
    efficiency: 97.8,
    energyConsumption: 1850,
    throughput: 1800,
    icon: FaFlask,
  },
  {
    process: "Casting",
    efficiency: 93.1,
    energyConsumption: 1200,
    throughput: 3200,
    icon: FaCogs,
  },
];

const environmentalImpact = [
  { month: "Jul", carbonSaved: 15.2, energySaved: 8500, wasteReduced: 2.8 },
  { month: "Aug", carbonSaved: 18.6, energySaved: 9200, wasteReduced: 3.2 },
  { month: "Sep", carbonSaved: 21.4, energySaved: 11800, wasteReduced: 4.1 },
];

const costAnalysis = [
  {
    category: "Virgin Materials",
    cost: 185420,
    percentage: 62,
    color: "#ef4444",
  },
  {
    category: "Scrap Processing",
    cost: 45280,
    percentage: 15,
    color: "#10b981",
  },
  { category: "Energy", cost: 38950, percentage: 13, color: "#f59e0b" },
  { category: "Labor", cost: 22100, percentage: 7, color: "#3b82f6" },
  { category: "Equipment", cost: 9250, percentage: 3, color: "#8b5cf6" },
];

const qualityMetrics = [
  { name: "Premium", value: 45, fill: "#10b981" },
  { name: "Industrial", value: 35, fill: "#6b7280" },
  { name: "Commercial", value: 15, fill: "#d1d5db" },
  { name: "Recycled", value: 5, fill: "#34d399" },
];

// Status configuration
const statusConfig = {
  "Active Processing": {
    color: "bg-emerald-100 text-emerald-800",
    pulse: "animate-pulse",
  },
  "Quality Check": { color: "bg-blue-100 text-blue-800", pulse: "" },
  "Ready for Use": { color: "bg-green-100 text-green-800", pulse: "" },
  "Quality Approved": { color: "bg-purple-100 text-purple-800", pulse: "" },
};

// Compact MetricCard Component
const MetricCard = ({ icon: Icon, title, value, subtitle, gradient }) => (
  <div
    className={`bg-gradient-to-br ${gradient} rounded-xl shadow-lg p-4 text-gray-800 hover:scale-105 transition-transform duration-300`}
  >
    <div className="flex items-center justify-between mb-3">
      <Icon className="text-2xl opacity-80" />
      <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
    </div>
    <div>
      <p className="text-shadow-gray-900 text-xs font-medium uppercase tracking-wide mb-1">
        {title}
      </p>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-gray-600">{subtitle}</p>
    </div>
  </div>
);

// Compact MetalCard Component
const MetalCard = ({ metal }) => {
  const Icon = metal.icon;
  const statusInfo = statusConfig[metal.status];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
            <Icon className="text-white text-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">
              {metal.metalType}
            </h3>
            <p className="text-xs text-gray-800 font-mono">{metal.id}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-800">
            {metal.recyclingEfficiency}%
          </div>
          <div className="text-xs text-gray-800">Efficiency</div>
        </div>
      </div>

      {/* Status Badge */}
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-3 ${statusInfo.color} ${statusInfo.pulse}`}
      >
        {metal.status}
      </span>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${metal.recyclingEfficiency}%` }}
          ></div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-800 mb-1">Total Usage</div>
          <div className="text-sm font-semibold text-gray-800">
            {metal.totalUsage.toLocaleString()} {metal.unit}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-800 mb-1">Savings</div>
          <div className="text-sm font-semibold text-gray-800">
            ${metal.savings.toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-800 mb-1">Carbon Saved</div>
          <div className="text-sm font-semibold text-gray-800">
            {metal.carbonSaved} tons
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-800 mb-1">Quality</div>
          <div className="text-sm font-semibold text-gray-800">
            {metal.qualityRetention}%
          </div>
        </div>
      </div>

      {/* Applications */}
      <div className="mb-4">
        <div className="text-xs text-gray-800 mb-2">Applications</div>
        <div className="flex flex-wrap gap-1">
          {metal.applications.slice(0, 2).map((app, index) => (
            <span
              key={app}
              className="px-2 py-1 rounded-md text-xs bg-emerald-100 text-emerald-700"
            >
              {app}
            </span>
          ))}
          {metal.applications.length > 2 && (
            <span className="px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-800">
              +{metal.applications.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-xs font-medium">
          View Details
        </button>
        <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium">
          Update
        </button>
      </div>
    </div>
  );
};

const ScrapAnalysis = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMetal, setSelectedMetal] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Memoized calculations
  const calculatedMetrics = useMemo(() => {
    const totalSavings = metalUsageData.reduce(
      (sum, item) => sum + item.savings,
      0
    );
    const totalCarbonSaved = metalUsageData.reduce(
      (sum, item) => sum + item.carbonSaved,
      0
    );
    const totalEnergySaved = metalUsageData.reduce(
      (sum, item) => sum + item.energySaved,
      0
    );
    const avgRecyclingEfficiency =
      metalUsageData.reduce((sum, item) => sum + item.recyclingEfficiency, 0) /
      metalUsageData.length;
    const totalMarketValue = metalUsageData.reduce(
      (sum, item) => sum + item.marketValue,
      0
    );

    return {
      totalSavings,
      totalCarbonSaved,
      totalEnergySaved,
      avgRecyclingEfficiency,
      totalMarketValue,
    };
  }, []);

  const filteredMetals = useMemo(() => {
    let filtered = metalUsageData;

    if (selectedMetal !== "all") {
      filtered = filtered.filter((item) =>
        item.metalType.toLowerCase().includes(selectedMetal.toLowerCase())
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.metalType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [selectedMetal, searchTerm]);

  const tabs = [
    { id: "overview", label: "Overview", icon: FaIndustry },
    { id: "metals", label: "Metal Analytics", icon: FaFlask },
    { id: "sustainability", label: "Sustainability", icon: FaLeaf },
    { id: "quality", label: "Quality", icon: FaShieldAlt },
    { id: "financials", label: "Financials", icon: FaDollarSign },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Compact Header */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                <FaRecycle className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Metal Recycling Analytics
                </h1>
                <p className="text-gray-800 text-sm">
                  Advanced metallurgical analysis & sustainability metrics
                </p>
              </div>
            </div>

            {/* Compact Controls */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search metals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48"
                />
              </div>

              <select
                value={selectedMetal}
                onChange={(e) => setSelectedMetal(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Metals</option>
                <option value="steel">Steel</option>
                <option value="aluminum">Aluminum</option>
                <option value="copper">Copper</option>
                <option value="titanium">Titanium</option>
              </select>

              <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2">
                <FaDownload className="text-sm" />
                Export
              </button>
            </div>
          </div>

          {/* Compact Navigation */}
          <div className="flex flex-wrap gap-2 mt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                    activeTab === tab.id
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-white/70 text-gray-800 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  <Icon className="text-sm" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <MetricCard
            icon={FaRecycle}
            title="Efficiency"
            value={`${calculatedMetrics.avgRecyclingEfficiency.toFixed(1)}%`}
            subtitle="↑ 2.3% vs last month"
            gradient="from-emerald-200 to-slate-300"
          />
          <MetricCard
            icon={FaDollarSign}
            title="Savings"
            value={`$${(calculatedMetrics.totalSavings / 1000).toFixed(0)}K`}
            subtitle="Cost reduction"
            gradient="from-green-200 to-gray-300"
          />
          <MetricCard
            icon={FaLeaf}
            title="Carbon"
            value={`${calculatedMetrics.totalCarbonSaved.toFixed(1)}t`}
            subtitle="CO₂ saved"
            gradient="from-teal-200 to-slate-300"
          />
          <MetricCard
            icon={FaBolt}
            title="Energy"
            value={`${(calculatedMetrics.totalEnergySaved / 1000).toFixed(
              0
            )}k kWh`}
            subtitle="Energy saved"
            gradient="from-emerald-300 to-gray-300"
          />
          <MetricCard
            icon={FaChartLine}
            title="Value"
            value={`$${(calculatedMetrics.totalMarketValue / 1000).toFixed(
              0
            )}K`}
            subtitle="Market value"
            gradient="from-green-300 to-slate-300"
          />
        </div>

        {/* Compact Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Environmental Trends */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Environmental Impact
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                Monthly
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={environmentalImpact}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="carbonSaved"
                  fill="#10b981"
                  fillOpacity={0.3}
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Bar
                  dataKey="energySaved"
                  fill="#6b7280"
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Quality Distribution */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Quality Distribution
              </h3>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                Current
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={qualityMetrics}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  fontSize={9}
                >
                  {qualityMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Process Efficiency */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Process Efficiency
              </h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                Real-time
              </span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={processAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="process" stroke="#6b7280" fontSize={9} />
                <YAxis stroke="#6b7280" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="efficiency"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === "metals" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMetals.map((metal) => (
              <MetalCard key={metal.id} metal={metal} />
            ))}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Process Analytics Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {processAnalytics.map((process, index) => {
                const Icon = process.icon;
                return (
                  <div
                    key={process.process}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="text-emerald-500 text-lg" />
                        <h4 className="font-medium text-gray-800 text-sm">
                          {process.process}
                        </h4>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          process.efficiency > 95
                            ? "bg-green-500"
                            : process.efficiency > 90
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-800">Efficiency</span>
                        <span className="font-medium text-gray-800">
                          {process.efficiency}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-800">Throughput</span>
                        <span className="font-medium text-gray-800">
                          {process.throughput} kg/h
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${process.efficiency}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "financials" && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Cost Breakdown Analysis
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={costAnalysis}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="cost"
                      label={({ category, percentage }) =>
                        `${category}: ${percentage}%`
                      }
                      labelLine={false}
                      fontSize={10}
                    >
                      {costAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {costAnalysis.map((item, index) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium text-gray-800 text-sm">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800 text-sm">
                        ${item.cost.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-800">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "sustainability" && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Sustainability Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <FaLeaf className="text-green-500 text-2xl mb-2" />
                <h4 className="font-semibold text-gray-800 mb-1">
                  Carbon Footprint
                </h4>
                <p className="text-2xl font-bold text-green-600">
                  {calculatedMetrics.totalCarbonSaved.toFixed(1)} tons
                </p>
                <p className="text-sm text-gray-800">CO₂ emissions reduced</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <FaBolt className="text-blue-500 text-2xl mb-2" />
                <h4 className="font-semibold text-gray-800 mb-1">
                  Energy Efficiency
                </h4>
                <p className="text-2xl font-bold text-blue-600">
                  {(calculatedMetrics.totalEnergySaved / 1000).toFixed(1)}k kWh
                </p>
                <p className="text-sm text-gray-800">
                  Energy consumption saved
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <FaRecycle className="text-purple-500 text-2xl mb-2" />
                <h4 className="font-semibold text-gray-800 mb-1">
                  Recycling Rate
                </h4>
                <p className="text-2xl font-bold text-purple-600">
                  {calculatedMetrics.avgRecyclingEfficiency.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-800">Average efficiency</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "quality" && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Quality Control Metrics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">
                  Quality Retention by Metal
                </h4>
                <div className="space-y-3">
                  {metalUsageData.map((metal) => (
                    <div
                      key={metal.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {metal.metalType}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full"
                            style={{ width: `${metal.qualityRetention}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {metal.qualityRetention}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={qualityMetrics}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                      fontSize={10}
                    >
                      {qualityMetrics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapAnalysis;
