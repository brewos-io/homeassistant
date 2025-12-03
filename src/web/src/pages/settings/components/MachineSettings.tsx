import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { getActiveConnection } from "@/lib/connection";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import {
  Coffee,
  ChevronDown,
  AlertCircle,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Settings,
} from "lucide-react";
import {
  SUPPORTED_MACHINES,
  getMachinesGroupedByBrand,
  getMachineById,
  getMachineTypeLabel,
} from "@/lib/machines";
import { cn } from "@/lib/utils";
import { formatTemperatureWithUnit } from "@/lib/temperature";

export function MachineSettings() {
  const navigate = useNavigate();
  const device = useStore((s) => s.device);
  const temperatureUnit = useStore((s) => s.preferences.temperatureUnit);
  const connectionState = useStore((s) => s.connectionState);
  const diagnostics = useStore((s) => s.diagnostics);
  const { success, error } = useToast();

  // Device identity
  const [deviceName, setDeviceName] = useState(device.deviceName);
  const [selectedMachineId, setSelectedMachineId] = useState<string>("");
  const [savingMachine, setSavingMachine] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // Get grouped machines for the dropdown
  const machineGroups = useMemo(() => getMachinesGroupedByBrand(), []);

  // Find currently selected machine
  const selectedMachine = useMemo(
    () => (selectedMachineId ? getMachineById(selectedMachineId) : undefined),
    [selectedMachineId]
  );

  // Find current machine from device info (for view mode)
  const currentMachine = useMemo(() => {
    if (device.machineBrand && device.machineModel) {
      return SUPPORTED_MACHINES.find(
        (m) =>
          m.brand.toLowerCase() === device.machineBrand.toLowerCase() &&
          m.model.toLowerCase() === device.machineModel.toLowerCase()
      );
    }
    return undefined;
  }, [device.machineBrand, device.machineModel]);

  // Try to match existing brand/model to a supported machine
  useEffect(() => {
    setDeviceName(device.deviceName);

    // Try to find matching machine from current brand/model
    if (device.machineBrand && device.machineModel) {
      const match = SUPPORTED_MACHINES.find(
        (m) =>
          m.brand.toLowerCase() === device.machineBrand.toLowerCase() &&
          m.model.toLowerCase() === device.machineModel.toLowerCase()
      );
      if (match) {
        setSelectedMachineId(match.id);
      }
    }
  }, [device.deviceName, device.machineBrand, device.machineModel]);

  const saveMachineInfo = async () => {
    if (!deviceName.trim() || !selectedMachine) return;

    // Check if connected
    if (connectionState !== "connected") {
      error("Not connected to machine. Please wait for connection.");
      return;
    }

    setSavingMachine(true);

    try {
      const connection = getActiveConnection();
      if (!connection) {
        throw new Error("No connection available");
      }

      // Send machine info including the type
      connection.sendCommand("set_machine_info", {
        name: deviceName.trim(),
        brand: selectedMachine.brand,
        model: selectedMachine.model,
        machineType: selectedMachine.type,
        machineId: selectedMachine.id,
        // Also send default temperatures
        defaultBrewTemp: selectedMachine.defaults.brewTemp,
        defaultSteamTemp: selectedMachine.defaults.steamTemp,
      });

      // Wait a bit for command to be sent, then show success
      await new Promise((resolve) => setTimeout(resolve, 300));
      success("Machine info saved successfully");
    } catch (err) {
      console.error("Failed to save machine info:", err);
      error("Failed to save machine info. Please try again.");
    } finally {
      setSavingMachine(false);
    }
  };

  const isMachineInfoValid = deviceName.trim() && selectedMachine;

  // Check if machine model has changed
  const hasMachineModelChanged =
    selectedMachine &&
    (selectedMachine.brand !== device.machineBrand ||
      selectedMachine.model !== device.machineModel);

  // Handle save - show warning if machine model changed
  const handleSave = async () => {
    if (hasMachineModelChanged) {
      setShowWarning(true);
    } else {
      await saveMachineInfo();
      setEditing(false);
    }
  };

  // Handle cancel - reset to current saved values
  const handleCancel = () => {
    setDeviceName(device.deviceName);
    // Reset selected machine to current one
    if (device.machineBrand && device.machineModel) {
      const match = SUPPORTED_MACHINES.find(
        (m) =>
          m.brand.toLowerCase() === device.machineBrand.toLowerCase() &&
          m.model.toLowerCase() === device.machineModel.toLowerCase()
      );
      setSelectedMachineId(match?.id || "");
    } else {
      setSelectedMachineId("");
    }
    setEditing(false);
  };

  const confirmSave = async () => {
    setShowWarning(false);
    await saveMachineInfo();
    setEditing(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle icon={<Coffee className="w-5 h-5" />}>Machine</CardTitle>
        </CardHeader>

        {!editing ? (
          /* View mode */
          <div className="space-y-4">
            {/* Machine Info Card */}
            {currentMachine && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 space-y-4">
                {/* Machine name and model */}
                <div>
                  <h4 className="text-lg font-semibold text-theme">
                    {device.deviceName ||
                      `${currentMachine.brand} ${currentMachine.model}`}
                  </h4>
                  {device.deviceName && (
                    <p className="text-sm text-theme-muted">
                      {currentMachine.brand} {currentMachine.model}
                    </p>
                  )}
                </div>

                {/* Specs in a clean grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs text-theme-muted uppercase tracking-wide">
                      Type
                    </p>
                    <p className="text-sm font-medium text-theme">
                      {getMachineTypeLabel(currentMachine.type)}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-theme-muted uppercase tracking-wide">
                      Brew Temp
                    </p>
                    <p className="text-sm font-medium text-theme">
                      {formatTemperatureWithUnit(
                        currentMachine.defaults.brewTemp,
                        temperatureUnit,
                        0
                      )}
                    </p>
                  </div>
                  {currentMachine.specs.brewPowerWatts && (
                    <div className="space-y-0.5">
                      <p className="text-xs text-theme-muted uppercase tracking-wide">
                        Brew Power
                      </p>
                      <p className="text-sm font-medium text-theme">
                        {currentMachine.specs.brewPowerWatts}W
                      </p>
                    </div>
                  )}
                  {currentMachine.specs.steamPowerWatts && (
                    <div className="space-y-0.5">
                      <p className="text-xs text-theme-muted uppercase tracking-wide">
                        Steam Power
                      </p>
                      <p className="text-sm font-medium text-theme">
                        {currentMachine.specs.steamPowerWatts}W
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No machine configured */}
            {!currentMachine && !device.machineBrand && (
              <div className="p-4 rounded-xl bg-theme-secondary border border-dashed border-theme">
                <p className="text-sm text-theme-muted text-center">
                  No machine configured yet
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-0">
              {/* Configure button */}
              <button
                onClick={() => setEditing(true)}
                className="w-full flex items-center justify-between py-2.5 border-b border-theme text-left group transition-colors hover:opacity-80"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-theme-muted" />
                  <span className="text-sm font-medium text-theme">
                    Configure Machine
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-theme transition-colors" />
              </button>

              {/* Diagnostics Link */}
              <DiagnosticsRow
                diagnostics={diagnostics}
                onClick={() => navigate("/diagnostics")}
              />
            </div>
          </div>
        ) : (
          /* Edit mode */
          <div className="space-y-4">
            <Input
              label="Machine Name"
              placeholder="Kitchen Espresso"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              hint="Give your machine a friendly name"
              required
            />

            {/* Machine Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-theme">
                Machine Model <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 pr-10 rounded-xl appearance-none",
                    "bg-theme-secondary border border-theme",
                    "text-theme text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
                    "transition-all duration-200",
                    !selectedMachineId && "text-theme-muted"
                  )}
                >
                  <option value="">Select your machine...</option>
                  {machineGroups.map((group) => (
                    <optgroup key={group.brand} label={group.brand}>
                      {group.machines.map((machine) => (
                        <option key={machine.id} value={machine.id}>
                          {machine.model} ({getMachineTypeLabel(machine.type)})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted pointer-events-none" />
              </div>
              <p className="text-xs text-theme-muted">
                Select your espresso machine from the supported list
              </p>
            </div>

            {/* Selected Machine Info */}
            {selectedMachine && (
              <div className="p-4 rounded-xl bg-theme-tertiary space-y-3">
                <div className="flex items-start gap-3">
                  <Coffee className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-theme">
                      {selectedMachine.brand} {selectedMachine.model}
                    </h4>
                    <p className="text-sm text-theme-muted">
                      {selectedMachine.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-theme-muted">Type:</span>{" "}
                    <span className="font-medium text-theme">
                      {getMachineTypeLabel(selectedMachine.type)}
                    </span>
                  </div>
                  <div>
                    <span className="text-theme-muted">Default Brew:</span>{" "}
                    <span className="font-medium text-theme">
                      {formatTemperatureWithUnit(
                        selectedMachine.defaults.brewTemp,
                        temperatureUnit,
                        0
                      )}
                    </span>
                  </div>
                  {selectedMachine.specs.brewPowerWatts && (
                    <div>
                      <span className="text-theme-muted">Brew Power:</span>{" "}
                      <span className="font-medium text-theme">
                        {selectedMachine.specs.brewPowerWatts}W
                      </span>
                    </div>
                  )}
                  {selectedMachine.specs.steamPowerWatts && (
                    <div>
                      <span className="text-theme-muted">Steam Power:</span>{" "}
                      <span className="font-medium text-theme">
                        {selectedMachine.specs.steamPowerWatts}W
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Machine not found notice */}
            {!selectedMachine && device.machineBrand && device.machineModel && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-tint border border-warning-strong/20">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-500">
                    Current machine not in supported list
                  </p>
                  <p className="text-theme-muted mt-1">
                    Currently configured: {device.machineBrand}{" "}
                    {device.machineModel}
                  </p>
                  <p className="text-theme-muted">
                    Please select from the dropdown to ensure proper
                    configuration.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                loading={savingMachine}
                disabled={!isMachineInfoValid}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Warning Dialog - shown when machine model is changed */}
      <ConfirmDialog
        isOpen={showWarning}
        onClose={() => setShowWarning(false)}
        onConfirm={confirmSave}
        title="Change Machine Model"
        description="You are changing your machine configuration."
        variant="warning"
        confirmText="Save Changes"
        cancelText="Cancel"
        confirmLoading={savingMachine}
      >
        <div className="space-y-3 text-sm">
          <div className="flex gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-500">
                Machine Model Change
              </p>
              <p className="text-theme-muted mt-1">
                Changing from{" "}
                <span className="font-medium text-theme">
                  {device.machineBrand} {device.machineModel}
                </span>{" "}
                to{" "}
                <span className="font-medium text-theme">
                  {selectedMachine?.brand} {selectedMachine?.model}
                </span>
              </p>
              <p className="text-theme-muted mt-2">
                This will affect{" "}
                <span className="text-amber-500 font-medium">
                  temperature control, heating behavior, and default settings
                </span>
                . Selecting the wrong model can cause equipment damage.
              </p>
            </div>
          </div>
          <p className="text-theme-muted text-xs">
            Ensure the selected model matches your physical espresso machine.
          </p>
        </div>
      </ConfirmDialog>
    </>
  );
}

// Compact diagnostic status row
function DiagnosticsRow({
  diagnostics,
  onClick,
}: {
  diagnostics: {
    header: {
      testCount: number;
      passCount: number;
      failCount: number;
      warnCount: number;
    };
    isRunning: boolean;
    timestamp: number;
  };
  onClick: () => void;
}) {
  const { header, isRunning, timestamp } = diagnostics;
  const hasResults = header.testCount > 0;

  const getStatus = () => {
    if (isRunning) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        color: "text-blue-500",
        text: "Running...",
      };
    }
    if (!hasResults) {
      return {
        icon: <Activity className="w-4 h-4" />,
        color: "text-theme-muted",
        text: "Not tested",
      };
    }
    if (header.failCount > 0) {
      return {
        icon: <XCircle className="w-4 h-4" />,
        color: "text-red-500",
        text: `${header.failCount} issue${
          header.failCount > 1 ? "s" : ""
        } found`,
      };
    }
    if (header.warnCount > 0) {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        color: "text-amber-500",
        text: `${header.warnCount} warning${header.warnCount > 1 ? "s" : ""}`,
      };
    }
    return {
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "text-emerald-500",
      text: "All passed",
    };
  };

  const getTimeAgo = () => {
    if (!timestamp) return "";
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const status = getStatus();
  const timeAgo = getTimeAgo();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between py-2.5 border-t border-theme",
        "text-left group transition-colors",
        "hover:opacity-80"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={status.color}>{status.icon}</div>
        <span className="text-sm font-medium text-theme">
          Hardware Diagnostics
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-theme-muted">
          {status.text}
          {timeAgo && hasResults && ` · ${timeAgo}`}
        </span>
        <ChevronRight className="w-4 h-4 text-theme-muted group-hover:text-theme transition-colors" />
      </div>
    </button>
  );
}
