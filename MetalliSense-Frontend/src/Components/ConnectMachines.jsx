import React, { useState, useEffect, useMemo, useRef } from "react";
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

  // synthetic alloy recommendation caching
  const baseAlloysRef = useRef(null); // holds initial random alloy set
  const clickCountRef = useRef(0);

  const generatePredictions = async () => {
    if (!opcConnected) {
      notification.warning({
        message: "OPC Connection Required",
        description: "Please connect OPC before generating predictions",
        placement: "topRight",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Build payload for local model endpoint
      const timestamp = new Date().toISOString();
      const batchIdNum =
        Number(String(formData.batchId).replace(/\D/g, "").slice(-6)) ||
        Date.now();
      const spectrometer = {};
      const metalKeys = Object.keys(formData).filter((k) => k.endsWith("_raw"));
      metalKeys.forEach((k) => {
        const el = k.replace(/_raw$/, "").toUpperCase();
        const val = Number(formData[k]);
        if (!Number.isNaN(val) && val !== "") spectrometer[el] = val;
      });

      // Apply backend constraints:
      // batch_id <= 10000, stirrer.torque >= 20, stirrer.time_min <= 20,
      // load_cell.batch_weight_kg <= 5000, historical_data.average_energy_consumption_kwh >= 100
      const constrainedBatchId = Math.min(batchIdNum, 10000);
      const rawTorque = 0; // not collected yet; set to minimum required
      const torque = Math.max(rawTorque, 20);
      const timeMin = Math.min(Number(formData.stirrer_time) || 0, 20);
      const batchWeight = Math.min(Number(formData.total_weight) || 0, 5000);
      const avgEnergy = Math.max(100, 0); // baseline placeholder until real data available

      // If we have a selectedMetalGrade, fetch its full data to compute mean composition for target_composition
      let targetComposition = {};
      try {
        if (selectedMetalGrade) {
          const gradeResp = await api.post("/api/v1/metal-grades/by-name", {
            name: selectedMetalGrade,
          });
          const mg = gradeResp.data?.data?.metalGrade;
          const range = mg?.composition_range || {};
          Object.entries(range).forEach(([el, arr]) => {
            if (Array.isArray(arr) && arr.length === 2) {
              const mean = (Number(arr[0]) + Number(arr[1])) / 2;
              if (!Number.isNaN(mean))
                targetComposition[el] = Number(mean.toFixed(4));
            }
          });
        }
      } catch (gradeErr) {
        // eslint-disable-next-line no-console
        console.warn(
          "Failed to fetch grade for target composition means",
          gradeErr
        );
        targetComposition = {};
      }

      const payload = {
        timestamp,
        batch_id: constrainedBatchId,
        alloy_type: "steel", // forced per requirement
        spectrometer,
        furnace_temp: {
          zone1: Number(formData.zone1_temp) || null,
          zone2: Number(formData.zone2_temp) || null,
          zone3: Number(formData.zone3_temp) || null,
        },
        dosing: {
          Al_added: Number(formData.al_raw) || 0,
          Cu_added: Number(formData.cu_raw) || 0,
          Si_added: Number(formData.si_raw) || 0,
        },
        stirrer: {
          rpm: Number(formData.stirrer_rpm) || 0,
          torque,
          time_min: timeMin,
        },
        load_cell: {
          batch_weight_kg: batchWeight,
        },
        gas_flow: {
          O2_percent: 0.1,
          flow_L_per_min: 5.0,
        },
        target_composition: targetComposition,
        historical_data: {
          previous_iterations: 0,
          average_energy_consumption_kwh: avgEnergy,
        },
      };

      console.log(payload);

      let respJson = null;
      try {
        // Axios POST to local optimization service
        const axiosResp = await axios.post(
          "http://localhost:8001/optimize",
          payload,
          {
            headers: { "Content-Type": "application/json" },
            timeout: 15000,
            validateStatus: (s) => s >= 200 && s < 300,
          }
        );
        console.log(axiosResp);
        respJson = axiosResp.data;
        respJson._model_payload = payload;
        respJson.synthetic = false;
        setPredictions(respJson);
        notification.success({ message: "Local model recommendations ready" });
      } catch (err) {
        // fallback to previous synthetic behavior if local model unavailable
        clickCountRef.current += 1;
        if (!baseAlloysRef.current) {
          const fallbackAlloys = ["FeSi", "FeMn", "FeCr", "Cu"].map((a, i) => ({
            alloy: a,
            kg: Number((i + 1.5).toFixed(3)),
            targets: [],
            rationale_code: "FALLBACK",
          }));
          baseAlloysRef.current = fallbackAlloys;
        }
        const synthetic = {
          status: "ok",
          batch_id: batchIdNum,
          additions: baseAlloysRef.current,
          notes: {},
          server_timestamp: new Date().toISOString(),
          synthetic: true,
          error: String(err.message || err),
        };
        setPredictions(synthetic);
        notification.warning({
          message: "Local model unavailable - fallback used",
          description: err.message,
        });
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Synthetic prediction generation failed", e);
      notification.error({ message: "Failed to build synthetic predictions" });
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
      <div>
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
              {Object.entries(predictions.predicted_additions || {}).map(
                ([key, val]) => {
                  const symbol = key.replace(/_add_kg$/i, "");
                  return (
                    <div
                      key={key}
                      className="p-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shadow-inner">
                            <Beaker className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">
                              {symbol.toUpperCase()}
                            </div>
                            <div className="text-xl font-bold text-gray-800">
                              {typeof val === "number" ? val.toFixed(2) : "--"}{" "}
                              kg
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-2">
                        Optimized addition for composition alignment
                      </div>
                    </div>
                  );
                }
              )}
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
