import React from "react";
import { Routes, Route } from "react-router-dom";
import HomeDashboard from "../Components/HomeDashboard";
import ScrapAnalysis from "../Components/MachineOperations/ScrapAnalysis";

// Machine Operations Components
import OperationsDashboard from "../Components/MachineOperations/OperationsDashboard";
import MetalCompositionReadings from "../Components/MachineOperations/MetalCompositionReadings";
import SpectrometerAnalysis from "../Components/MachineOperations/SpectrometerAnalysis";
import FurnaceTemperatureControl from "../Components/MachineOperations/FurnaceTemperatureControl";
import DosingWeighingSystems from "../Components/MachineOperations/DosingWeighingSystems";
import StirrerMixingControl from "../Components/MachineOperations/StirrerMixingControl";
import GasFlowOxygenSensors from "../Components/MachineOperations/GasFlowOxygenSensors";
import CoolingSystemControl from "../Components/MachineOperations/CoolingSystemControl";
import ConnectMachines from "../Components/ConnectMachines";
// Process Analytics Components
import MLProcessOptimization from "../Components/ProcessAnalytics/MLProcessOptimization";
import AlloyQualityReports from "../Components/ProcessAnalytics/AlloyQualityReports";
import ProductionAnalytics from "../Components/ProcessAnalytics/ProductionAnalytics";
import EquipmentHealthMonitor from "../Components/ProcessAnalytics/EquipmentHealthMonitor";

// System Management Components
import ProcessSettings from "../Components/SystemManagement/ProcessSettings";
import TechnicalDocumentation from "../Components/SystemManagement/TechnicalDocumentation";

const InitialRouter = () => {
  return (
    <Routes>
      {/* Home Dashboard */}
      <Route path="/" element={<HomeDashboard />} />

      {/* Machine Operations Routes */}
      <Route path="/admin-dashboard" element={<OperationsDashboard />} />
      <Route path="/metal-readings" element={<MetalCompositionReadings />} />
      <Route path="/spectrometer" element={<SpectrometerAnalysis />} />
      <Route path="/furnace-control" element={<FurnaceTemperatureControl />} />
      <Route path="/dosing-systems" element={<DosingWeighingSystems />} />
      <Route path="/mixing-operations" element={<StirrerMixingControl />} />
      <Route path="/gas-sensors" element={<GasFlowOxygenSensors />} />
      <Route path="/cooling-systems" element={<CoolingSystemControl />} />
      <Route path="/scrap-analysis" element={<ScrapAnalysis />} />

      {/* Process Analytics & AI Routes */}
      <Route path="/ml-predictions" element={<MLProcessOptimization />} />
      <Route path="/quality-reports" element={<AlloyQualityReports />} />
      <Route path="/data-analytics" element={<ProductionAnalytics />} />
      <Route path="/system-health" element={<EquipmentHealthMonitor />} />

      {/* System Management Routes */}
      <Route path="/settings" element={<ProcessSettings />} />
      <Route path="/documentation" element={<TechnicalDocumentation />} />
<Route path="/connect-machines" element={<ConnectMachines />} />
      {/* 404 Route */}
      <Route
        path="*"
        element={
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
              <p className="text-gray-600">Page Not Found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default InitialRouter;
