import { useState } from "react";
import "@/App.css";
import Hero from "@/components/Hero";
import Scanning from "@/components/Scanning";
import Results from "@/components/Results";
import RequestAccess from "@/components/RequestAccess";
import TopBar from "@/components/TopBar";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  // stages: 'hero' | 'scanning' | 'results'
  const [stage, setStage] = useState("hero");
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);

  const startScan = async () => {
    setStage("scanning");
    setScanError(null);
    try {
      // kick off the scan; the scanning animation runs in parallel
      const reqPromise = axios.post(`${API}/scan`);
      // ensure the dramatic scan animation runs at least 5s for UX impact
      const minDelay = new Promise((r) => setTimeout(r, 5200));
      const [resp] = await Promise.all([reqPromise, minDelay]);
      setScanResult(resp.data);
      setStage("results");
    } catch (e) {
      console.error("scan failed", e);
      setScanError(e?.message || "Scan failed");
      // still move to results in degraded mode
      setStage("hero");
    }
  };

  const reset = () => {
    setStage("hero");
    setScanResult(null);
    setScanError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="App" data-testid="app-root">
      <TopBar onReset={reset} stage={stage} />
      {stage === "hero" && (
        <Hero onConnect={startScan} error={scanError} />
      )}
      {stage === "scanning" && <Scanning />}
      {stage === "results" && scanResult && (
        <>
          <Results data={scanResult} onReset={reset} />
          <RequestAccess
            sessionId={scanResult.session_id}
            coldCount={scanResult.cold_count}
            apiBase={API}
          />
        </>
      )}
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
