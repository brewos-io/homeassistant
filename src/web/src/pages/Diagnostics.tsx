import { useStore } from "@/lib/store";
import { useCommand } from "@/lib/useCommand";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Thermometer,
  Gauge,
  Droplets,
  Zap,
  Wifi,
  Speaker,
  Lightbulb,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  Loader2,
  RefreshCw,
  Cable,
  ArrowLeft,
} from "lucide-react";
import type { DiagnosticResult, DiagnosticStatus } from "@/lib/types";

// Map test IDs to icons
function getTestIcon(testId: number) {
  const icons: Record<number, React.ReactNode> = {
    0x01: <Thermometer className="w-5 h-5" />,
    0x02: <Thermometer className="w-5 h-5" />,
    0x03: <Thermometer className="w-5 h-5" />,
    0x04: <Gauge className="w-5 h-5" />,
    0x05: <Droplets className="w-5 h-5" />,
    0x06: <Zap className="w-5 h-5" />,
    0x07: <Zap className="w-5 h-5" />,
    0x08: <Activity className="w-5 h-5" />,
    0x09: <Activity className="w-5 h-5" />,
    0x0a: <Cable className="w-5 h-5" />,
    0x0b: <Wifi className="w-5 h-5" />,
    0x0c: <Speaker className="w-5 h-5" />,
    0x0d: <Lightbulb className="w-5 h-5" />,
  };
  return icons[testId] || <Activity className="w-5 h-5" />;
}

function getStatusInfo(status: DiagnosticStatus) {
  switch (status) {
    case "pass":
      return {
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        label: "Pass",
      };
    case "fail":
      return {
        icon: <XCircle className="w-5 h-5" />,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/30",
        label: "Fail",
      };
    case "warn":
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        label: "Warning",
      };
    case "skip":
      return {
        icon: <MinusCircle className="w-5 h-5" />,
        color: "text-slate-400",
        bgColor: "bg-slate-500/10",
        borderColor: "border-slate-500/30",
        label: "Skipped",
      };
    case "running":
      return {
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        label: "Running",
      };
  }
}

function DiagnosticResultRow({ result }: { result: DiagnosticResult }) {
  const statusInfo = getStatusInfo(result.status);

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border ${statusInfo.bgColor} ${statusInfo.borderColor}`}
    >
      <div className={`flex-shrink-0 ${statusInfo.color}`}>
        {getTestIcon(result.testId)}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-theme truncate">{result.name}</h4>
        <p className="text-sm text-theme-muted truncate">{result.message}</p>
      </div>

      {result.rawValue !== 0 && (
        <div className="hidden sm:block text-right">
          <p className="text-xs text-theme-muted">Raw Value</p>
          <p className="font-mono text-sm text-theme">{result.rawValue}</p>
        </div>
      )}

      <div className={`flex items-center gap-1.5 ${statusInfo.color}`}>
        {statusInfo.icon}
        <span className="text-sm font-medium hidden sm:inline">
          {statusInfo.label}
        </span>
      </div>
    </div>
  );
}

export function Diagnostics() {
  const navigate = useNavigate();
  const diagnostics = useStore((s) => s.diagnostics);
  const setDiagnosticsRunning = useStore((s) => s.setDiagnosticsRunning);
  const resetDiagnostics = useStore((s) => s.resetDiagnostics);
  const pico = useStore((s) => s.pico);
  const { sendCommand } = useCommand();

  const runDiagnostics = () => {
    setDiagnosticsRunning(true);
    sendCommand("run_diagnostics");
  };

  const { header, results, isRunning, timestamp } = diagnostics;
  const hasResults = results.length > 0 || header.testCount > 0;

  const overallStatus: DiagnosticStatus = isRunning
    ? "running"
    : header.failCount > 0
      ? "fail"
      : header.warnCount > 0
        ? "warn"
        : header.passCount > 0
          ? "pass"
          : "skip";

  const overallInfo = getStatusInfo(overallStatus);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hardware Diagnostics"
        subtitle="Test hardware wiring and component functionality"
        backPath="/settings#machine"
        backLabel="Back to Settings"
      />

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Activity className="w-5 h-5" />}>
            Run Self-Tests
          </CardTitle>
        </CardHeader>

        <p className="text-theme-muted mb-6">
          Run self-tests to verify hardware wiring and component functionality.
          The tests will briefly activate outputs (SSRs, relays, buzzer, LED) to
          verify they're working correctly.
        </p>

        {/* Warning */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-500 mb-1">
                Before Running
              </h4>
              <ul className="text-sm text-theme-muted space-y-1">
                <li>• Ensure water reservoir is filled</li>
                <li>• Machine should be cold (ambient temperature)</li>
                <li>• Relays/SSRs will activate briefly during tests</li>
                <li>• Buzzer will chirp and LED will flash</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            onClick={runDiagnostics}
            disabled={isRunning || !pico.connected}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run All Tests
              </>
            )}
          </Button>

          {hasResults && !isRunning && (
            <Button
              variant="ghost"
              onClick={resetDiagnostics}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Results
            </Button>
          )}

          {!pico.connected && (
            <p className="text-sm text-red-500">
              Pico not connected. Connect to run diagnostics.
            </p>
          )}
        </div>
      </Card>

      {/* Results Summary */}
      {hasResults && (
        <Card>
          <CardHeader>
            <CardTitle icon={overallInfo.icon}>
              <span className={overallInfo.color}>
                {isRunning
                  ? "Running Tests..."
                  : header.failCount > 0
                    ? "Issues Detected"
                    : header.warnCount > 0
                      ? "Completed with Warnings"
                      : "All Tests Passed"}
              </span>
            </CardTitle>
            {!isRunning && header.durationMs > 0 && (
              <Badge variant="default">
                {(header.durationMs / 1000).toFixed(1)}s
              </Badge>
            )}
          </CardHeader>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="p-3 bg-theme rounded-xl text-center">
              <p className="text-2xl font-bold text-theme">{header.testCount}</p>
              <p className="text-xs text-theme-muted">Total</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-emerald-500">
                {header.passCount}
              </p>
              <p className="text-xs text-emerald-500/70">Passed</p>
            </div>
            <div className="p-3 bg-red-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-red-500">
                {header.failCount}
              </p>
              <p className="text-xs text-red-500/70">Failed</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-amber-500">
                {header.warnCount}
              </p>
              <p className="text-xs text-amber-500/70">Warnings</p>
            </div>
            <div className="p-3 bg-slate-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-slate-400">
                {header.skipCount}
              </p>
              <p className="text-xs text-slate-400/70">Skipped</p>
            </div>
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-theme-muted uppercase tracking-wider">
                Test Results
              </h3>
              {results.map((result, index) => (
                <DiagnosticResultRow
                  key={`${result.testId}-${index}`}
                  result={result}
                />
              ))}
            </div>
          )}

          {/* Timestamp */}
          {timestamp > 0 && (
            <p className="text-xs text-theme-muted mt-4 text-center">
              Last run: {new Date(timestamp).toLocaleString()}
            </p>
          )}
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle icon={<AlertTriangle className="w-5 h-5" />}>
            Troubleshooting
          </CardTitle>
        </CardHeader>

        <div className="space-y-4 text-sm text-theme-muted">
          <div>
            <h4 className="font-medium text-theme mb-1">NTC Sensor Failures</h4>
            <p>
              Check wiring connections to the ADC pins. Ensure thermistors are
              properly connected with correct polarity and pull-up resistors.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-theme mb-1">
              Thermocouple Failures
            </h4>
            <p>
              Verify SPI connections (MISO, SCK, CS) to the MAX31855. Check for
              open circuit errors which indicate disconnected thermocouple
              wires.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-theme mb-1">SSR/Relay Failures</h4>
            <p>
              Test signals are sent to verify GPIO functionality. If machine
              components don't activate, check relay/SSR wiring and power
              supply.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-theme mb-1">
              Water Level Warnings
            </h4>
            <p>
              Fill the water reservoir before testing. Low water warnings during
              diagnostics indicate the level sensors are working correctly.
            </p>
          </div>
        </div>
      </Card>

      {/* Back button */}
      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => navigate("/settings#machine")}>
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </Button>
      </div>
    </div>
  );
}

