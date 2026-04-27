import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import Hero from "@/components/Hero";
import Scanning from "@/components/Scanning";
import Results from "@/components/Results";
import RequestAccess from "@/components/RequestAccess";
import TopBar from "@/components/TopBar";
import SharePage from "@/components/SharePage";
import FramingSwitch from "@/components/FramingSwitch";
import DreadTest from "@/components/DreadTest";
import QuietClose from "@/components/QuietClose";
import ColdAuditIntro from "@/components/ColdAuditIntro";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function MainFlow() {
  // stages: 'hero' | 'scanning' | 'results'
  const [stage, setStage] = useState("hero");
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const navigate = useNavigate();

  const startScan = async () => {
    setStage("scanning");
    setScanError(null);
    // scroll to top so user sees the scanning animation cleanly
    window.scrollTo({ top: 0, behavior: "instant" });
    try {
      const reqPromise = axios.post(`${API}/scan`);
      const minDelay = new Promise((r) => setTimeout(r, 5400));
      const [resp] = await Promise.all([reqPromise, minDelay]);
      setScanResult(resp.data);
      setStage("results");
    } catch (e) {
      console.error("scan failed", e);
      setScanError(e?.message || "Scan failed");
      setStage("hero");
    }
  };

  const reset = () => {
    setStage("hero");
    setScanResult(null);
    setScanError(null);
    navigate("/", { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <TopBar onReset={reset} stage={stage} />
      {stage === "hero" && (
        <>
          <Hero onConnect={startScan} error={scanError} />
          <FramingSwitch apiBase={API} />
          <DreadTest apiBase={API} />
          <ColdAuditIntro onConnect={startScan} />
        </>
      )}
      {stage === "scanning" && <Scanning />}
      {stage === "results" && scanResult && (
        <>
          <Results data={scanResult} onReset={reset} apiBase={API} />
          <QuietClose apiBase={API} sessionId={scanResult.session_id} />
          <RequestAccess
            sessionId={scanResult.session_id}
            coldCount={scanResult.cold_count}
            apiBase={API}
          />
        </>
      )}
    </>
  );
}

function SharePageWrapper() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    axios
      .get(`${API}/scan/${sessionId}`)
      .then((r) => {
        if (alive) {
          setData(r.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setNotFound(true);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [sessionId]);

  return (
    <>
      <TopBar onReset={() => navigate("/")} stage="results" />
      <SharePage
        data={data}
        loading={loading}
        notFound={notFound}
        apiBase={API}
        onStartOwn={() => navigate("/")}
      />
      {data && (
        <RequestAccess
          sessionId={data.session_id}
          coldCount={data.cold_count}
          apiBase={API}
        />
      )}
    </>
  );
}

function App() {
  return (
    <div className="App" data-testid="app-root">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainFlow />} />
          <Route path="/r/:sessionId" element={<SharePageWrapper />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
