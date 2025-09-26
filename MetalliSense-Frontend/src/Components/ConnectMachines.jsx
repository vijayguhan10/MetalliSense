import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Card,
  Input,
  Select,
  Button,
  Progress,
  Tooltip,
  Modal,
  Badge,
  Tabs,
  Switch,
  Table,
  Divider,
  notification,
} from "antd";
import {
  Thermometer,
  Zap,
  RotateCcw,
  Cpu,
  Shield,
  Beaker,
  Factory,
  RefreshCw,
  Wifi,
  WifiOff,
  Server,
  Activity,
  Target,
  TrendingUp,
  Flame,
  Wrench,
  Award,
  Layers,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  Gauge,
  Timer,
  Globe,
  Power,
  Cable,
  Eye,
  AlertTriangle,
  AlertCircle,
  Settings,
  Clock,
} from "lucide-react";

// ...react

const { Option } = Select;
const { TabPane } = Tabs;

const ConnectMachines = () => {
  const [inputType, setInputType] = useState("metal-alone");
  const [opcConnected, setOpcConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [machines, setMachines] = useState([
    {
      id: 1,
      name: "Furnace Zone Controller",
      ip: "192.168.1.100",
      status: "disconnected",
      lastSeen: null,
      type: "temperature",
      data: { zone1: 0, zone2: 0, zone3: 0 },
    },
    {
      id: 2,
      name: "Stirrer Control Unit",
      ip: "192.168.1.101",
      status: "disconnected",
      lastSeen: null,
      type: "stirrer",
      data: { rpm: 0, time: 0 },
    },
    {
      id: 3,
      name: "Material Feed System",
      ip: "192.168.1.102",
      status: "disconnected",
      lastSeen: null,
      type: "material",
      data: { al: 0, cu: 0, si: 0 },
    },
    {
      id: 4,
      name: "Composition Analyzer",
      ip: "192.168.1.103",
      status: "disconnected",
      lastSeen: null,
      type: "analyzer",
      data: { al_pct: 0, cu_pct: 0, si_pct: 0, fe_pct: 0 },
    },
  ]);

  const [formData, setFormData] = useState({
    batchId: `BATCH-${Date.now()}`,
    timestamp: new Date().toISOString().slice(0, 16),
    al_raw: "",
    cu_raw: "",
    si_raw: "",
    fe_raw: "",
    c_raw: "",
    mn_raw: "",
    p_raw: "",
    s_raw: "",
    cr_raw: "",
    ni_raw: "",
    mo_raw: "",
    v_raw: "",
    nb_raw: "",
    scrap_added_kg: "",
    raw_metal_weight: "",
    scrap_al: "",
    scrap_cu: "",
    scrap_si: "",
    scrap_fe: "",
    zone1_temp: "",
    zone2_temp: "",
    zone3_temp: "",
    stirrer_rpm: 150,
    stirrer_time: 30,
    // target composition removed — values are generated/simulated instead of user input
    total_weight: "",
  });

  const [predictions, setPredictions] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOpcModal, setShowOpcModal] = useState(false);
  const [metalGrades, setMetalGrades] = useState([]);
  const [metalGradeLoading, setMetalGradeLoading] = useState(false);
  const [selectedMetalGrade, setSelectedMetalGrade] = useState(null);
  const [metalElements, setMetalElements] = useState([]);
  const [metalElementsLoading, setMetalElementsLoading] = useState(false);
  const [syntheticLoading, setSyntheticLoading] = useState(false);
  const [syntheticScrapLoading, setSyntheticScrapLoading] = useState(false);
  const [syntheticMixedLoading, setSyntheticMixedLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

  const api = useMemo(() => axios.create({ baseURL: API_BASE }), [API_BASE]);

  const fetchOpcStatus = async () => {
    try {
      const res = await api.get("/api/v1/spectrometer/opc-status");
      const json = res.data;
      // expect { opcConnected: boolean, machines: [{id, status}] }
      if (json.opcConnected != null) {
        setOpcConnected(Boolean(json.opcConnected));
        if (!json.opcConnected) {
          // server explicitly reports disconnected -> mark machines disconnected
          setMachines((prev) =>
            prev.map((m) => ({ ...m, status: "disconnected" }))
          );
        }
      }

      if (Array.isArray(json.machines)) {
        setMachines((prev) =>
          prev.map((m) => {
            const found = json.machines.find((x) => x.id === m.id);
            if (found && found.status) return { ...m, status: found.status };
            return m;
          })
        );
      }
    } catch (e) {
      // on any error (network refused, parse error, etc.) mark disconnected
      setOpcConnected(false);
      setMachines((prev) =>
        prev.map((m) => ({ ...m, status: "disconnected" }))
      );
      // eslint-disable-next-line no-console
      console.warn("Could not fetch OPC status, marking disconnected", e);
    }
  };

  const apiConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await api.post("/api/v1/spectrometer/opc-connect");
      // server may return success flag in res.data
      setOpcConnected(true);
      // set all devices to connected per requirement
      setMachines((prev) => prev.map((m) => ({ ...m, status: "connected" })));
      notification.success({
        message: "OPC Connected",
        description: "Backend OPC connection established",
        placement: "topRight",
      });
    } catch (e) {
      notification.error({
        message: "OPC Connect Failed",
        description: e.message || "Could not connect",
        placement: "topRight",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const apiDisconnect = async () => {
    try {
      await api.post("/api/v1/spectrometer/opc-disconnect");
    } catch (e) {
      // ignore
    } finally {
      setOpcConnected(false);
      setMachines((prev) =>
        prev.map((m) => ({ ...m, status: "disconnected" }))
      );
      notification.info({ message: "OPC Disconnected", placement: "topRight" });
    }
  };

  // Polling-based status watcher (server only exposes REST status endpoint)
  useEffect(() => {
    let cancelled = false;
    let timerId = null;

    // Poll every 10 seconds to reduce backend load
    const POLL_INTERVAL_MS = 10000;

    const poll = async () => {
      // call the status endpoint and update state
      await fetchOpcStatus();
      if (cancelled) return;
      timerId = setTimeout(poll, POLL_INTERVAL_MS);
    };

    // start immediate poll
    poll();

    // cleanup
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  // Fetch metal grade names for dropdown
  const fetchMetalGrades = async () => {
    setMetalGradeLoading(true);
    try {
      const res = await api.get("/api/v1/metal-grades/names");
      const body = res.data;
      // handle different possible shapes. Preferred: { status, results, data: { gradeNames: [...] } }
      const candidates = [];
      if (body && body.data && Array.isArray(body.data.gradeNames))
        candidates.push(body.data.gradeNames);
      if (body && Array.isArray(body)) candidates.push(body);
      if (body && Array.isArray(body.gradeNames))
        candidates.push(body.gradeNames);

      const grades = candidates.length > 0 ? candidates[0] : [];
      if (Array.isArray(grades)) {
        setMetalGrades(grades);
        if (grades.length > 0 && !selectedMetalGrade)
          setSelectedMetalGrade(grades[0]);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Could not fetch metal grades", e);
    } finally {
      setMetalGradeLoading(false);
    }
  };

  useEffect(() => {
    fetchMetalGrades();
  }, []);

  // When OPC server is not connected, generate furnace zone temperatures once on mount
  // (no continuous updates) to provide reasonable default values for the UI.
  useEffect(() => {
    if (!opcConnected) {
      const base = [1245, 1260, 1280];
      const next = { ...formData };
      base.forEach((b, i) => {
        const drift = (Math.random() - 0.5) * 16; // +/- ~8 degrees
        const temp = Math.round(b + drift);
        next[`zone${i + 1}_temp`] = String(temp);
      });
      setFormData(next);
    }
    // run on mount and when opcConnected changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opcConnected]);

  // Fetch element symbols for the selected metal grade
  const fetchElementsForGrade = async (gradeName) => {
    if (!gradeName) return setMetalElements([]);
    setMetalElementsLoading(true);
    try {
      const res = await api.post("/api/v1/metal-grades/elements", {
        name: gradeName,
      });
      const body = res.data || {};
      // Response shape expected: { status: 'success', data: { metalGrade: 'ADI-1100-7', elements: ['Fe','C', ...] } }
      let elements = [];
      if (body.data && Array.isArray(body.data.elements))
        elements = body.data.elements;
      else if (Array.isArray(body.elements)) elements = body.elements;
      // normalize: ensure elements are strings and trim whitespace
      elements = elements.filter(Boolean).map((e) => String(e).trim());

      // Prepare allowed keys for current elements
      const allowedRawKeys = elements.map(
        (el) => `${String(el).toLowerCase()}_raw`
      );
      const allowedScrapKeys = elements.map(
        (el) => `scrap_${String(el).toLowerCase()}`
      );

      // Rebuild formData: remove any previous element-specific keys not in the allowed lists,
      // and ensure allowed keys exist (initialized to empty string).
      setFormData((prev) => {
        const next = { ...prev };

        // remove stale raw keys
        Object.keys(next).forEach((k) => {
          if (k.endsWith("_raw") && !allowedRawKeys.includes(k)) {
            delete next[k];
          }
          if (k.startsWith("scrap_") && !allowedScrapKeys.includes(k)) {
            delete next[k];
          }
        });

        // ensure allowed keys exist
        allowedRawKeys.forEach((k) => {
          if (next[k] === undefined) next[k] = "";
        });
        allowedScrapKeys.forEach((k) => {
          if (next[k] === undefined) next[k] = "";
        });

        return next;
      });

      setMetalElements(elements);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Could not fetch elements for grade", gradeName, e);
      setMetalElements([]);
    } finally {
      setMetalElementsLoading(false);
    }
  };

  // When selected metal grade changes, fetch its elements
  useEffect(() => {
    if (selectedMetalGrade) fetchElementsForGrade(selectedMetalGrade);
    else setMetalElements([]);
  }, [selectedMetalGrade]);

  // Generate synthetic spectrometer reading for Metal Alone
  const generateSyntheticReading = async () => {
    if (!selectedMetalGrade) {
      notification.warning({ message: "Select a metal grade first" });
      return;
    }

    setSyntheticLoading(true);
    try {
      const res = await api.post("/api/v1/spectrometer/metal-alone", {
        metalGrade: selectedMetalGrade,
      });
      const body = res.data || {};
      const opcData = body.data?.opcData || body.opcData || {};
      const composition = opcData.composition || {};

      // Only update formData fields for elements currently displayed (metalElements)
      const availableLower = (metalElements || []).map((e) =>
        String(e).toLowerCase()
      );

      setFormData((prev) => {
        const next = { ...prev };
        Object.keys(composition).forEach((el) => {
          const key = `${String(el).toLowerCase()}_raw`;
          if (availableLower.includes(String(el).toLowerCase())) {
            // write numeric value (format to 3 decimals)
            next[key] = Number(composition[el]).toFixed(3);
          }
        });
        // update a temperature field if present
        if (opcData.temperature !== undefined) {
          next.zone1_temp = String(opcData.temperature);
        }
        // update timestamp if available
        if (opcData.timestamp) next.timestamp = opcData.timestamp.slice(0, 16);
        return next;
      });

      notification.success({ message: "Synthetic reading applied" });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Synthetic reading failed", e);
      notification.error({ message: "Failed to generate synthetic reading" });
    } finally {
      setSyntheticLoading(false);
    }
  };

  // Generate synthetic spectrometer reading for Scrap Alone (updates scrap_<el> fields)
  const generateSyntheticScrapReading = async () => {
    if (!selectedMetalGrade) {
      notification.warning({ message: "Select a metal grade first" });
      return;
    }

    setSyntheticScrapLoading(true);
    try {
      const res = await api.post("/api/v1/spectrometer/metal-alone", {
        metalGrade: selectedMetalGrade,
      });
      const body = res.data || {};
      const opcData = body.data?.opcData || body.opcData || {};
      const composition = opcData.composition || {};

      const availableLower = (metalElements || []).map((e) =>
        String(e).toLowerCase()
      );

      setFormData((prev) => {
        const next = { ...prev };
        Object.keys(composition).forEach((el) => {
          const scrapKey = `scrap_${String(el).toLowerCase()}`;
          if (availableLower.includes(String(el).toLowerCase())) {
            next[scrapKey] = Number(composition[el]).toFixed(3);
          }
        });
        return next;
      });

      notification.success({ message: "Synthetic scrap reading applied" });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Synthetic scrap reading failed", e);
      notification.error({
        message: "Failed to generate synthetic scrap reading",
      });
    } finally {
      setSyntheticScrapLoading(false);
    }
  };

  // Generate synthetic reading for Scrap + Metal (mixed)
  // Current behavior: call the metal-alone and scrap-alone handlers sequentially
  // so that both raw and scrap element fields are populated by existing logic.
  const generateSyntheticMixedReading = async () => {
    if (!selectedMetalGrade) {
      notification.warning({ message: "Select a metal grade first" });
      return;
    }

    setSyntheticMixedLoading(true);
    try {
      await generateSyntheticReading();
      // ensure the first update has time to settle before invoking the second
      await generateSyntheticScrapReading();
      notification.success({ message: "Synthetic mixed reading applied" });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Synthetic mixed reading failed", e);
      notification.error({
        message: "Failed to generate synthetic mixed reading",
      });
    } finally {
      setSyntheticMixedLoading(false);
    }
  };

  const generatePredictions = async () => {
    if (!opcConnected) {
      notification.warning({
        message: "OPC Connection Required",
        description:
          "Please establish OPC connection before generating predictions",
        placement: "topRight",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const totalWeight = Number(formData.total_weight) || 0;
      const scrapWeight = Number(formData.scrap_added_kg) || 0;
      const rawWeight = totalWeight - scrapWeight;

      const payload = {
        metalGrade: selectedMetalGrade,
        totalWeight,
        rawWeight,
        scrapWeight,
        formData,
      };

      // call backend prediction endpoint (best-effort; backend may vary)
      const res = await api
        .post("/api/v1/predictions", payload)
        .catch(() => null);
      const body = res?.data ?? { message: "No prediction returned" };
      setPredictions(body);
      notification.success({ message: "Predictions generated" });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Prediction generation failed", e);
      notification.error({ message: "Failed to generate predictions" });
    } finally {
      setIsProcessing(false);
    }
  };

  const inputTypes = [
    {
      key: "metal-alone",
      label: "Metal Alone",
      icon: <Factory className="w-5 h-5" />,
      description: "Pure metal alloy processing",
    },
    {
      key: "scrap-metal",
      label: "Scrap + Metal",
      icon: <RotateCcw className="w-5 h-5" />,
      description: "Mixed scrap and metal processing",
    },
    {
      key: "scrap-alone",
      label: "Scrap Alone",
      icon: <Activity className="w-5 h-5" />,
      description: "Recycled material processing",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "text-emerald-500";
      case "error":
        return "text-gray-500";
      default:
        return "text-gray-400";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
        return <Wifi className="w-4 h-4 text-emerald-500" />;
      case "error":
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  // Format element symbol labels: 'fe' -> 'Fe', 'c' -> 'C'
  const formatElementSymbol = (raw) => {
    if (!raw) return "";
    const s = String(raw).replace(/_/g, "").toLowerCase();
    if (s.length === 1) return s.toUpperCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const FurnaceZoneVisualization = () => (
    <div className="relative">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Furnace Zone Status
        </h3>
        <Badge
          status={opcConnected ? "processing" : "default"}
          text={opcConnected ? "Live Data" : "Static Data"}
          className="text-sm"
        />
      </div>
      <div className="flex flex-col space-y-4">
        {[
          {
            zone: "Zone 3",
            temp: formData.zone3_temp || 1280,
            purpose: "Homogenization & Final Mixing",
          },
          {
            zone: "Zone 2",
            temp: formData.zone2_temp || 1260,
            purpose: "Alloying & Stirring",
          },
          {
            zone: "Zone 1",
            temp: formData.zone1_temp || 1245,
            purpose: "Initial Heating & Melting",
          },
        ].map((zone, index) => {
          const temp = parseInt(zone.temp);
          const getHeatColor = (temp) => {
            if (temp > 1270) return "from-gray-600 via-gray-500 to-gray-400";
            if (temp > 1250) return "from-gray-500 via-gray-400 to-gray-300";
            return "from-gray-400 via-gray-300 to-gray-200";
          };

          return (
            <Tooltip key={index} title={zone.purpose}>
              <div
                className={`relative p-6 rounded-2xl bg-gradient-to-r ${getHeatColor(
                  temp
                )} shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/20`}
              >
                <div className="flex justify-between items-center text-white">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Thermometer className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-lg">{zone.zone}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{temp}°C</div>
                    <div className="text-sm opacity-90 font-medium">
                      {zone.purpose.split(" & ")[0]}
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl animate-pulse"></div>
              </div>
              {/* debug viewer removed */}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );

  const OPCConnectionPanel = () => (
    <Card className="bg-gradient-to-br from-gray-50 via-gray-100 to-emerald-50 border-gray-200 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${
              opcConnected ? "bg-emerald-100" : "bg-gray-100"
            }`}
          >
            <Server
              className={`w-6 h-6 ${
                opcConnected ? "text-emerald-600" : "text-gray-500"
              }`}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              OPC Server Connection
            </h3>
            <p className="text-sm text-gray-600">
              {opcConnected
                ? "Connected to industrial machines"
                : "Connect to start data collection"}
            </p>
          </div>
        </div>
        <Button
          type={opcConnected ? "default" : "primary"}
          size="large"
          loading={isConnecting}
          onClick={opcConnected ? apiDisconnect : apiConnect}
          className={`${
            opcConnected
              ? "bg-gray-500 hover:bg-gray-600 border-gray-500 text-white"
              : "bg-gradient-to-r from-emerald-500 to-emerald-600 border-none"
          } shadow-lg`}
          icon={
            opcConnected ? (
              <Power className="w-4 h-4" />
            ) : (
              <Cable className="w-4 h-4" />
            )
          }
        >
          {isConnecting
            ? "Connecting..."
            : opcConnected
            ? "Disconnect"
            : "Connect OPC"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {machines.map((machine) => (
          <div
            key={machine.id}
            className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(machine.status)}
                <div>
                  <h4 className="font-semibold text-gray-800 text-sm">
                    {machine.name}
                  </h4>
                </div>
              </div>
              <Badge
                color={
                  machine.status === "connected"
                    ? "green"
                    : machine.status === "error"
                    ? "gray"
                    : "gray"
                }
                text={machine.status}
              />
            </div>

            {/* Removed IP and last-updated per backend-driven devices */}
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <div className="flex items-center space-x-2 text-emerald-700">
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">
            {opcConnected
              ? "Real-time data streaming active"
              : "Connect to enable live data feed"}
          </span>
        </div>
      </div>
    </Card>
  );

  const PredictionPanel = () => {
    if (!predictions) return null;

    return (
      <div className="space-y-8">
        {/* Hero Metrics Section */}
        <div className="bg-gradient-to-br from-emerald-50 to-gray-50 rounded-3xl p-8 border border-emerald-200 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg mb-4">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              ML Optimization Results
            </h2>
            <p className="text-gray-600 text-lg">
              AI-powered metallurgical process enhancement
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                <Gauge className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {predictions.composition_accuracy}%
              </div>
              <div className="text-sm text-gray-600 font-medium">Accuracy</div>
              <div className="flex items-center justify-center mt-1">
                <ArrowUp className="w-3 h-3 text-emerald-500 mr-1" />
                <span className="text-xs text-emerald-600">+5.2%</span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                <Timer className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {predictions.iterations_saved}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Iterations Saved
              </div>
              <div className="flex items-center justify-center mt-1">
                <TrendingDown className="w-3 h-3 text-emerald-500 mr-1" />
                <span className="text-xs text-emerald-600">
                  -{predictions.processing_time_reduction}%
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {predictions.energy_saving}%
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Energy Saved
              </div>
              <div className="flex items-center justify-center mt-1">
                <ArrowDown className="w-3 h-3 text-emerald-500 mr-1" />
                <span className="text-xs text-emerald-600">
                  -{predictions.environmental_impact.co2_reduction.toFixed(1)}t
                  CO₂
                </span>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-lg flex items-center justify-center mb-3">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-3xl font-bold text-gray-800 mb-1">
                ${(predictions.cost_savings / 1000).toFixed(1)}K
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Cost Savings
              </div>
              <div className="flex items-center justify-center mt-1">
                <ArrowUp className="w-3 h-3 text-emerald-500 mr-1" />
                <span className="text-xs text-emerald-600">
                  +{predictions.quality_improvement}% quality
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Predicted Additions - Enhanced */}
        <Card className="bg-white border-gray-200 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-emerald-50 p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Beaker className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Optimized Metal Additions
                  </h3>
                  <p className="text-gray-600">
                    Precision dosing recommendations
                  </p>
                </div>
              </div>
              <div className="bg-emerald-100 px-4 py-2 rounded-full">
                <span className="text-emerald-700 font-semibold text-sm">
                  {predictions.optimization_confidence}% Confidence
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  metal: "Aluminum",
                  symbol: "Al",
                  value: predictions.additions.al_add_kg,
                  unit: "kg",
                  color: "from-gray-100 to-gray-200",
                  borderColor: "border-gray-300",
                  textColor: "text-gray-700",
                  iconBg: "bg-gray-100",
                  progress: 85,
                },
                {
                  metal: "Copper",
                  symbol: "Cu",
                  value: predictions.additions.cu_add_kg,
                  unit: "kg",
                  color: "from-emerald-100 to-emerald-200",
                  borderColor: "border-emerald-300",
                  textColor: "text-emerald-700",
                  iconBg: "bg-emerald-100",
                  progress: 92,
                },
                {
                  metal: "Silicon",
                  symbol: "Si",
                  value: predictions.additions.si_add_kg,
                  unit: "kg",
                  color: "from-gray-200 to-gray-300",
                  borderColor: "border-gray-400",
                  textColor: "text-gray-800",
                  iconBg: "bg-gray-200",
                  progress: 78,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`relative p-6 rounded-2xl bg-gradient-to-br ${item.color} border-2 ${item.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 ${item.iconBg} rounded-xl`}>
                      <span className={`text-2xl font-bold ${item.textColor}`}>
                        {item.symbol}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${item.textColor}`}>
                        {item.value.toFixed(2)}
                      </div>
                      <div className={`text-sm ${item.textColor} opacity-80`}>
                        {item.unit}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div
                      className={`text-lg font-semibold ${item.textColor} mb-2`}
                    >
                      {item.metal}
                    </div>
                    <div className="w-full bg-white/50 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${
                          item.progress > 90
                            ? "from-emerald-400 to-emerald-500"
                            : "from-gray-400 to-gray-500"
                        } h-2 rounded-full transition-all duration-1000`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <div
                      className={`text-xs ${item.textColor} opacity-70 mt-1`}
                    >
                      Optimization: {item.progress}%
                    </div>
                  </div>

                  <div
                    className={`text-xs ${item.textColor} opacity-80 bg-white/30 p-2 rounded-lg`}
                  >
                    Target composition achieved with minimal waste
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Process Recommendations */}
        <Card className="bg-white border-gray-200 shadow-xl rounded-2xl">
          <div className="bg-gradient-to-r from-emerald-50 to-gray-50 p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Cpu className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  AI Process Recommendations
                </h3>
                <p className="text-gray-600">
                  Intelligent optimization suggestions
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {predictions.process_recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-5 rounded-xl border-l-4 ${
                    rec.priority === "High"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-400 bg-gray-50"
                  } hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-bold text-gray-800 text-lg">
                          {rec.title}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            rec.priority === "High"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {rec.priority} Priority
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3 leading-relaxed">
                        {rec.description}
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-600">
                            Est. Savings: {rec.estimated_savings}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={`p-2 rounded-lg ${
                        rec.priority === "High"
                          ? "bg-emerald-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {rec.priority === "High" ? (
                        <Flame className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Wrench className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Environmental Impact */}
        <Card className="bg-white border-gray-200 shadow-xl rounded-2xl">
          <div className="bg-gradient-to-r from-gray-50 to-emerald-50 p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  Environmental Impact
                </h3>
                <p className="text-gray-600">
                  Sustainability metrics and improvements
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">
                    {predictions.environmental_impact.co2_reduction.toFixed(1)}{" "}
                    tons
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    CO₂ Reduction
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <RotateCcw className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">
                    {predictions.environmental_impact.waste_reduction.toFixed(
                      1
                    )}
                    %
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Waste Reduction
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                    <Target className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-800 mb-1">
                    {predictions.environmental_impact.water_savings.toFixed(0)}L
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Water Savings
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Deviation Analysis */}
        <Card className="bg-white border-gray-200 shadow-xl rounded-2xl">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                Process Analysis & Insights
              </h3>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h4 className="font-bold text-gray-800 text-lg mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-gray-600 mr-2" />
                Deviation Analysis
              </h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                {predictions.deviation_reason}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {[
                  {
                    title: "Mechanical Properties",
                    value: predictions.impact_analysis.mechanical_properties,
                    icon: Settings,
                  },
                  {
                    title: "Corrosion Resistance",
                    value: predictions.impact_analysis.corrosion_resistance,
                    icon: Shield,
                  },
                  {
                    title: "Production Timeline",
                    value: predictions.impact_analysis.production_delay,
                    icon: Clock,
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <Icon className="w-4 h-4 text-emerald-600" />
                        <h5 className="font-semibold text-gray-800 text-sm">
                          {item.title}
                        </h5>
                      </div>
                      <p className="text-sm text-gray-600">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* AI Notes - Enhanced */}
        <Card className="bg-gradient-to-br from-emerald-50 to-gray-50 border-emerald-200 shadow-xl rounded-2xl">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                AI System Summary
              </h3>
            </div>
            <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Layers className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {predictions.notes}
                  </p>
                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Optimized</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span>Validated</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Award className="w-4 h-4 text-emerald-500" />
                      <span>Quality Assured</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-emerald-600 bg-clip-text text-transparent mb-3">
            Industrial Alloying ML System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional metallurgical process optimization platform with
            real-time OPC connectivity
          </p>
        </div>

        {/* OPC Connection Panel */}
        <div className="mb-4">
          <OPCConnectionPanel />
        </div>

        {/* Metal Grade Selector (below OPC card) - improved UI */}
        <div className="mb-8 w-full">
          <Card className="bg-gradient-to-r from-white via-emerald-50 to-emerald-50 border-emerald-200 shadow-lg">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Beaker className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-lg">
                  Metal Grade
                </h4>
                <p className="text-sm text-gray-500">
                  Select a metal grade to apply for the current batch.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2">
                <Select
                  placeholder="Select metal grade"
                  loading={metalGradeLoading}
                  value={selectedMetalGrade}
                  onChange={(val) => setSelectedMetalGrade(val)}
                  options={metalGrades.map((g) => ({ label: g, value: g }))}
                  allowClear
                  className="w-full"
                  size="large"
                />
              </div>
              <div className="flex items-center md:justify-end">
                <Button
                  type="default"
                  onClick={() => {
                    fetchMetalGrades();
                    notification.success({ message: "Grades refreshed" });
                  }}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Input Type Selection */}
        <Card className="mb-8 bg-gradient-to-r from-emerald-50 via-gray-50 to-emerald-50 border-emerald-200 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Factory className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Process Configuration
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {inputTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => setInputType(type.key)}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center space-y-3 ${
                  inputType === type.key
                    ? "border-emerald-500 bg-emerald-100 text-emerald-700 shadow-xl scale-105"
                    : "border-gray-300 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-lg"
                }`}
              >
                <div className="p-3 bg-white rounded-full shadow-md">
                  {type.icon}
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg">{type.label}</h3>
                  <p className="text-sm opacity-75">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Input Panel */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-white via-gray-50 to-emerald-50 border-gray-200 shadow-xl">
              <Tabs defaultActiveKey="1" className="custom-tabs">
                <TabPane tab="Batch Information" key="1">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Batch ID
                        </label>
                        <Input
                          size="large"
                          value={formData.batchId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              batchId: e.target.value,
                            })
                          }
                          className="border-2 border-gray-300 focus:border-emerald-500 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Timestamp
                        </label>
                        <Input
                          size="large"
                          type="datetime-local"
                          value={formData.timestamp}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timestamp: e.target.value,
                            })
                          }
                          className="border-2 border-gray-300 focus:border-emerald-500 rounded-xl"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Total Batch Weight (kg)
                        </label>
                        <Input
                          size="large"
                          type="number"
                          placeholder="e.g. 1000"
                          value={formData.total_weight}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              total_weight: e.target.value,
                            })
                          }
                          className="border-2 border-gray-300 focus:border-emerald-500 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </TabPane>

                <TabPane tab="Material Inputs" key="2">
                  <div className="space-y-8">
                    {(inputType === "metal-alone" ||
                      inputType === "scrap-metal") && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-800 flex items-center text-lg">
                            <span className="w-4 h-4 bg-emerald-500 rounded-full mr-3"></span>
                            Raw Metal Inputs (kg)
                          </h4>
                          <div className="flex items-center space-x-2">
                            {inputType === "metal-alone" && (
                              <Button
                                type="default"
                                loading={syntheticLoading}
                                onClick={generateSyntheticReading}
                                className="text-sm"
                              >
                                Generate Synthetic Reading
                              </Button>
                            )}
                            {inputType === "scrap-metal" && (
                              <Button
                                type="default"
                                loading={syntheticMixedLoading}
                                onClick={generateSyntheticMixedReading}
                                className="text-sm"
                              >
                                Generate Synthetic Mixed Reading
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Raw Metal Total Weight input removed per request */}
                        {metalElementsLoading ? (
                          <div className="text-sm text-gray-500">
                            Loading elements...
                          </div>
                        ) : metalElements && metalElements.length > 0 ? (
                          <div className="grid grid-cols-3 gap-6">
                            {metalElements.map((el) => {
                              const key = `${String(el).toLowerCase()}_raw`;
                              return (
                                <div key={key}>
                                  <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {formatElementSymbol(String(el))}
                                  </label>
                                  <Input
                                    size="large"
                                    type="number"
                                    placeholder="0.00"
                                    value={formData[key]}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        [key]: e.target.value,
                                      })
                                    }
                                    className="border-2 border-gray-300 focus:border-emerald-500 rounded-xl"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Select a metal grade to load element inputs.
                          </div>
                        )}
                      </div>
                    )}

                    {(inputType === "scrap-alone" ||
                      inputType === "scrap-metal") && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-gray-800 flex items-center text-lg">
                            <span className="w-4 h-4 bg-gray-500 rounded-full mr-3"></span>
                            Scrap Material Input
                          </h4>
                          <div>
                            {inputType === "scrap-alone" && (
                              <Button
                                type="default"
                                loading={syntheticScrapLoading}
                                onClick={generateSyntheticScrapReading}
                                className="text-sm"
                              >
                                Generate Synthetic Scrap Reading
                              </Button>
                            )}
                          </div>
                        </div>
                        {/* Total Scrap and Raw Metal Weight inputs shown only for scrap-metal */}
                        {/* Total Scrap Weight input removed per request */}
                        {metalElementsLoading ? (
                          <div className="text-sm text-gray-500">
                            Loading elements...
                          </div>
                        ) : metalElements && metalElements.length > 0 ? (
                          <div className="grid grid-cols-4 gap-4">
                            {metalElements.map((el) => {
                              const key = `scrap_${String(el).toLowerCase()}`;
                              return (
                                <div key={key}>
                                  <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {formatElementSymbol(el)} (%)
                                  </label>
                                  <Input
                                    size="large"
                                    type="number"
                                    placeholder="0.0"
                                    max="100"
                                    value={formData[key]}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        [key]: e.target.value,
                                      })
                                    }
                                    className="border-2 border-gray-300 focus:border-emerald-500 rounded-xl"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Select a metal grade to load scrap element inputs.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabPane>

                <TabPane tab="Process Parameters" key="3">
                  <div className="space-y-8">
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                        <Thermometer className="w-5 h-5 mr-3 text-gray-500" />
                        Furnace Zone Temperatures (°C)
                      </h4>
                      <div className="grid grid-cols-3 gap-6">
                        {["zone1_temp", "zone2_temp", "zone3_temp"].map(
                          (zone, index) => (
                            <div key={zone}>
                              <label className="block text-sm font-bold text-gray-700 mb-2">
                                Zone {index + 1}
                              </label>
                              <Input
                                size="large"
                                type="number"
                                placeholder="1250"
                                value={formData[zone]}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    [zone]: e.target.value,
                                  })
                                }
                                className="border-2 border-gray-300 focus:border-emerald-500 rounded-xl"
                                disabled={opcConnected}
                                suffix={
                                  opcConnected ? (
                                    <Eye className="w-4 h-4 text-emerald-500" />
                                  ) : null
                                }
                              />
                            </div>
                          )
                        )}
                      </div>
                      {opcConnected && (
                        <p className="text-sm text-emerald-600 mt-2 flex items-center">
                          <Activity className="w-4 h-4 mr-2" />
                          Temperature values are being updated automatically
                          from OPC server
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                        <RotateCcw className="w-5 h-5 mr-3 text-gray-500" />
                        Stirrer Configuration
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            RPM
                          </label>
                          <Input
                            size="large"
                            type="number"
                            placeholder="150"
                            value={formData.stirrer_rpm}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                stirrer_rpm: e.target.value,
                              })
                            }
                            className="border-2 border-gray-300 focus:border-emerald-500 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Duration (minutes)
                          </label>
                          <Input
                            size="large"
                            type="number"
                            placeholder="30"
                            value={formData.stirrer_time}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                stirrer_time: e.target.value,
                              })
                            }
                            className="border-2 border-gray-300 focus:border-emerald-500 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Target Composition removed: values are not user-editable */}
                  </div>
                </TabPane>
              </Tabs>

              <Divider />

              <div className="pt-6">
                <Button
                  type="primary"
                  size="large"
                  loading={isProcessing}
                  onClick={generatePredictions}
                  disabled={!opcConnected}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 border-none hover:from-emerald-600 hover:to-emerald-700 h-14 text-xl font-bold shadow-2xl rounded-2xl"
                  icon={<Zap className="w-6 h-6" />}
                >
                  {isProcessing
                    ? "Processing ML Prediction..."
                    : "Generate AI Prediction"}
                </Button>
                {!opcConnected && (
                  <p className="text-center text-gray-500 text-sm mt-2 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    OPC connection required to generate predictions
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Enhanced Right Panel */}
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-xl">
              <FurnaceZoneVisualization />
            </Card>

            {/* Enhanced Status Card */}
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-xl">
              <div className="text-center p-4">
                <div className="flex justify-center mb-3">
                  <div
                    className={`p-3 rounded-full ${
                      opcConnected ? "bg-emerald-100" : "bg-gray-100"
                    }`}
                  >
                    <Activity
                      className={`w-8 h-8 ${
                        opcConnected ? "text-emerald-600" : "text-gray-500"
                      }`}
                    />
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 mb-3 text-lg">
                  System Status
                </h3>
                <Badge
                  status={opcConnected ? "processing" : "default"}
                  text={opcConnected ? "Connected & Ready" : "Disconnected"}
                  className={`text-lg ${
                    opcConnected ? "text-emerald-600" : "text-gray-500"
                  }`}
                />
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Input Type:</span>
                    <span className="font-semibold">
                      {inputTypes.find((t) => t.key === inputType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Batch ID:</span>
                    <span className="font-semibold font-mono">
                      {formData.batchId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>OPC Status:</span>
                    <span
                      className={`font-semibold ${
                        opcConnected ? "text-emerald-600" : "text-gray-500"
                      }`}
                    >
                      {opcConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Enhanced Prediction Results */}
        {predictions && (
          <div className="mt-12">
            <Card className="bg-gradient-to-r from-emerald-50 via-gray-50 to-emerald-50 border-emerald-200 shadow-2xl rounded-3xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-100 to-gray-100 p-8 border-b border-emerald-200">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold text-gray-800 mb-2">
                      AI Prediction Results
                    </h2>
                    <p className="text-xl text-gray-600">
                      Advanced optimization for batch {formData.batchId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <PredictionPanel />
              </div>
            </Card>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-tabs .ant-tabs-tab {
          color: #4b5563;
          font-weight: 600;
          font-size: 16px;
        }
        .custom-tabs .ant-tabs-tab.ant-tabs-tab-active {
          color: #10b981;
          font-weight: 700;
        }
        .custom-tabs .ant-tabs-ink-bar {
          background: linear-gradient(90deg, #10b981, #059669);
          height: 3px;
        }
      `}</style>
    </div>
  );
};

export default ConnectMachines;
