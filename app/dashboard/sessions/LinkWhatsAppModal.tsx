"use client";

import { useState, useEffect } from "react";
import { X, QrCode, Hash, RefreshCcw, Loader2 } from "lucide-react";
import styles from "./link-modal.module.css";

interface LinkWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionName: string;
  wahaSessionId: string;
  onConnected: () => void;
}

export function LinkWhatsAppModal({ isOpen, onClose, sessionName, wahaSessionId, onConnected }: LinkWhatsAppModalProps) {
  const [tab, setTab] = useState<"qr" | "pairing">("qr");
  const [qrData, setQrData] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [status, setStatus] = useState<string>("STARTING");

  const fetchQR = async () => {
    if (!isOpen || tab !== "qr" || !wahaSessionId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/sessions/${wahaSessionId}/qr`);
      const data = await res.json();
      if (data && data.data) {
        setQrData(data.data);
        setCountdown(60);
      } else {
        console.warn("QR Data missing in response", data);
      }
    } catch (e) {
      console.error("Failed to fetch QR:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPairingCode = async () => {
    if (!phoneNumber || !wahaSessionId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/sessions/${wahaSessionId}/pairing-code`, {
        method: "POST",
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await res.json();
      if (data.code) {
        setPairingCode(data.code);
      }
    } catch (e) {
      console.error("Failed to fetch Pairing Code:", e);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!isOpen || !wahaSessionId) return;
    try {
      const res = await fetch(`/api/sessions/${wahaSessionId}`);
      if (!res.ok) throw new Error("Status check failed");
      const data = await res.json();
      if (data.status) {
        setStatus(data.status);
        if (data.status === "WORKING") {
          onConnected();
          onClose();
        }
      }
    } catch (e) {
      console.error("Status check error:", e);
    }
  };

  useEffect(() => {
    if (isOpen && wahaSessionId) {
      checkStatus(); // Initial check
      const statusInterval = setInterval(checkStatus, 2500);
      return () => clearInterval(statusInterval);
    }
  }, [isOpen, wahaSessionId]);

  useEffect(() => {
    if (isOpen && tab === "qr" && countdown > 0 && qrData) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && tab === "qr" && isOpen && status === "SCAN_QR_CODE") {
      fetchQR();
    }
  }, [countdown, isOpen, tab, qrData, status]);

  useEffect(() => {
    if (isOpen && status === "SCAN_QR_CODE" && !qrData && !loading) {
      fetchQR();
    }
  }, [isOpen, status, qrData, loading]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Link WhatsApp</h3>
          <p>Connecting to {sessionName || 'session'}...</p>
          <button className={styles.closeIcon} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${tab === "qr" ? styles.active : ""}`}
            onClick={() => setTab("qr")}
          >
            QR Code
          </button>
          <button 
            className={`${styles.tab} ${tab === "pairing" ? styles.active : ""}`}
            onClick={() => setTab("pairing")}
          >
            Pairing Code
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.instruction}>Settings → Linked devices → Link a device</p>
          
          {tab === "qr" ? (
            <div className={styles.qrContainer}>
              {loading && !qrData ? (
                <div className={styles.loader}><Loader2 className="animate-spin" size={40} /></div>
              ) : status !== "SCAN_QR_CODE" && !qrData ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px' }}>
                  <Loader2 className="animate-spin" style={{ color: "var(--muted-foreground)" }} size={32} />
                  <p style={{ fontSize: '0.85rem', textAlign: 'center', color: "var(--muted-foreground)" }}>
                    Initializing session... Please wait<br/>(Current Status: {status})
                  </p>
                </div>
              ) : qrData ? (
                <div className={styles.qrImageWrapper}>
                  <img src={`data:image/png;base64,${qrData}`} alt="WhatsApp QR Code" />
                  <div className={styles.timer}>Refresh in {countdown}s</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <p style={{ fontSize: '0.85rem', textAlign: 'center', color: "var(--muted-foreground)" }}>Click button below to load QR Code</p>
                  <button onClick={fetchQR} className="btn btn-secondary">Fetch QR Code</button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.pairingContainer}>
              {!pairingCode ? (
                <div className={styles.pairingForm}>
                  <label>Enter Phone Number (e.g. 6281234567890)</label>
                  <input 
                    type="text" 
                    placeholder="Phone with country code" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={fetchPairingCode}
                    disabled={loading || !phoneNumber}
                  >
                    {loading ? "Requesting..." : "Get Pairing Code"}
                  </button>
                </div>
              ) : (
                <div className={styles.codeDisplay}>
                  <div className={styles.code}>{pairingCode}</div>
                  <p>Enter this code on your phone</p>
                  <button className={styles.resetBtn} onClick={() => setPairingCode(null)}>
                    <RefreshCcw size={14} /> Use different number
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.statusInfo}>
             <div className={`${styles.statusDot} ${status === "WORKING" ? styles.green : styles.orange}`} />
             <span>Status: <strong>{status || "POLLING..."}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
