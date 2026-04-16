"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Trash2,
  Pause,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import styles from "./detail.module.css";

interface Recipient {
  id: string;
  phoneNumber: string;
  status: string;
  sentAt: string | null;
  contact: { name: string | null };
}

interface BroadcastDetail {
  id: string;
  name: string;
  messageBody: string;
  status: string;
  delayMin: number;
  delayMax: number;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  session: { sessionName: string };
  recipients: Recipient[];
}

export default function BroadcastDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [broadcast, setBroadcast] = useState<BroadcastDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/broadcast/${id}`);
      if (res.ok) {
        setBroadcast(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Polling for live progress while RUNNING or PAUSED
  useEffect(() => {
    if (!broadcast) return;
    if (broadcast.status !== "RUNNING" && broadcast.status !== "PAUSED") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/broadcast/${id}/status`);
        if (res.ok) {
          const status = await res.json();
          setBroadcast((prev) =>
            prev
              ? {
                  ...prev,
                  status: status.status,
                  sentCount: status.sentCount,
                  failedCount: status.failedCount,
                  totalCount: status.totalCount,
                  completedAt: status.completedAt,
                }
              : prev
          );
        }
      } catch (e) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [broadcast?.status, id]);

  const handleDelete = async () => {
    if (!window.confirm("Yakin ingin menghapus broadcast ini?")) return;
    const res = await fetch(`/api/broadcast/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard/broadcast");
  };

  const handlePause = async () => {
    await fetch(`/api/broadcast/${id}/pause`, { method: "POST" });
    fetchDetail();
  };

  const handleResume = async () => {
    await fetch(`/api/broadcast/${id}/resume`, { method: "POST" });
    fetchDetail();
  };

  if (loading) {
    return <div className={styles.loadingCenter}>Memuat detail broadcast...</div>;
  }

  if (!broadcast) {
    return <div className={styles.loadingCenter}>Broadcast tidak ditemukan.</div>;
  }

  const pending = broadcast.totalCount - broadcast.sentCount - broadcast.failedCount;
  const sentPct = broadcast.totalCount > 0 ? (broadcast.sentCount / broadcast.totalCount) * 100 : 0;
  const failedPct = broadcast.totalCount > 0 ? (broadcast.failedCount / broadcast.totalCount) * 100 : 0;
  const pendingPct = broadcast.totalCount > 0 ? (pending / broadcast.totalCount) * 100 : 0;

  // Estimate completion
  let estimateStr = "–";
  if (broadcast.status === "RUNNING" && broadcast.startedAt && broadcast.sentCount > 0) {
    const elapsed = Date.now() - new Date(broadcast.startedAt).getTime();
    const avgPerMsg = elapsed / (broadcast.sentCount + broadcast.failedCount);
    const remaining = pending * avgPerMsg;
    const estDate = new Date(Date.now() + remaining);
    estimateStr = estDate.toLocaleString("id-ID");
  }

  // Duration
  let durationStr = "–";
  if (broadcast.startedAt && broadcast.completedAt) {
    const ms = new Date(broadcast.completedAt).getTime() - new Date(broadcast.startedAt).getTime();
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    durationStr = `${hours} jam ${mins} menit ${secs} detik`;
  }

  const formatDate = (d: string | null) => {
    if (!d) return "–";
    return new Date(d).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const statusIcon = () => {
    switch (broadcast.status) {
      case "COMPLETED": return <CheckCircle size={16} style={{ color: "#25D366" }} />;
      case "RUNNING": return <RefreshCw size={16} style={{ color: "#ffa500" }} />;
      case "PAUSED": return <Pause size={16} style={{ color: "#3b82f6" }} />;
      case "FAILED": return <XCircle size={16} style={{ color: "#ff4444" }} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className={styles.detailPage}>
      {/* Header */}
      <div className={styles.backRow}>
        <button className={styles.backBtn} onClick={() => router.push("/dashboard/broadcast")}>
          <ArrowLeft size={18} /> Laporan Sebaran
        </button>
        <button className={styles.deleteBtn} onClick={handleDelete}>
          <Trash2 size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === "summary" ? styles.active : ""}`} onClick={() => setActiveTab("summary")}>
          Ringkasan
        </button>
        <button className={`${styles.tab} ${activeTab === "recipients" ? styles.active : ""}`} onClick={() => { setActiveTab("recipients"); fetchDetail(); }}>
          Penerima
        </button>
      </div>

      {activeTab === "summary" ? (
        <>
          {/* Summary */}
          <h2 className={styles.summaryTitle}>{broadcast.name}</h2>

          <div className={styles.summaryTable}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Jumlah penerima</span>
              <span className={styles.summaryValue}>{broadcast.totalCount.toLocaleString()}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Status</span>
              <span className={styles.summaryValue}>
                <span className={styles.statusInline}>
                  {statusIcon()} {broadcast.status}
                </span>
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Pengaturan Jeda</span>
              <span className={styles.summaryValue}>{broadcast.delayMin}-{broadcast.delayMax} detik</span>
            </div>
            {broadcast.status === "RUNNING" && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Estimasi selesai</span>
                <span className={styles.summaryValue}>{estimateStr}</span>
              </div>
            )}
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Dimulai pada</span>
              <span className={styles.summaryValue}>{formatDate(broadcast.startedAt)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Selesai pada</span>
              <span className={styles.summaryValue}>{formatDate(broadcast.completedAt)}</span>
            </div>
            {broadcast.completedAt && (
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Diselesaikan dalam</span>
                <span className={styles.summaryValue}>{durationStr}</span>
              </div>
            )}
          </div>

          {/* Delivery Summary */}
          <div className={styles.deliverySectionHeader}>
            <h3 className={styles.deliveryTitle}>Ringkasan Pengiriman</h3>
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)" }} onClick={fetchDetail}>
              <RefreshCw size={16} />
            </button>
          </div>

          <div className={styles.progressBarLarge}>
            <div className={styles.progressSent} style={{ width: `${sentPct}%` }} />
            <div className={styles.progressFailed} style={{ width: `${failedPct}%` }} />
            <div className={styles.progressPending} style={{ width: `${pendingPct}%` }} />
          </div>

          <div className={styles.deliveryStats}>
            <div className={styles.deliveryStat}>
              <div className={styles.deliveryStatLeft}>
                <CheckCircle size={16} className={styles.dotGreen} />
                <span>Terkirim ({Math.round(sentPct)}%)</span>
              </div>
              <span className={styles.deliveryStatRight}>{broadcast.sentCount.toLocaleString()}</span>
            </div>
            <div className={styles.deliveryStat}>
              <div className={styles.deliveryStatLeft}>
                <XCircle size={16} className={styles.dotRed} />
                <span>Gagal ({Math.round(failedPct)}%)</span>
              </div>
              <span className={styles.deliveryStatRight}>{broadcast.failedCount.toLocaleString()}</span>
            </div>
            <div className={styles.deliveryStat}>
              <div className={styles.deliveryStatLeft}>
                <Clock size={16} className={styles.dotBlue} />
                <span>Menunggu ({Math.round(pendingPct)}%)</span>
              </div>
              <span className={styles.deliveryStatRight}>{pending.toLocaleString()}</span>
            </div>
          </div>

          {/* Pause / Resume */}
          {(broadcast.status === "RUNNING" || broadcast.status === "PAUSED") && (
            <div className={styles.actionRow}>
              {broadcast.status === "RUNNING" && (
                <button className={styles.pauseBtn} onClick={handlePause}>
                  <Pause size={16} /> Pause Broadcast
                </button>
              )}
              {broadcast.status === "PAUSED" && (
                <button className={styles.resumeBtn} onClick={handleResume}>
                  <Play size={16} /> Resume Broadcast
                </button>
              )}
            </div>
          )}

          {/* Message Content */}
          <div className={styles.messagePreview}>
            <h3 className={styles.messagePreviewTitle}>Konten Sebaran</h3>
            <div className={styles.messagePreviewBox}>{broadcast.messageBody}</div>
          </div>
        </>
      ) : (
        /* ===== RECIPIENTS TAB ===== */
        <>
          <table className={styles.recipientsTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nama</th>
                <th>Nomor</th>
                <th>Status</th>
                <th>Waktu Kirim</th>
              </tr>
            </thead>
            <tbody>
              {broadcast.recipients.map((r, idx) => (
                <tr key={r.id}>
                  <td>{idx + 1}</td>
                  <td>{r.contact?.name || "–"}</td>
                  <td>{r.phoneNumber}</td>
                  <td>
                    <span
                      className={
                        r.status === "SENT"
                          ? styles.rStatusSent
                          : r.status === "FAILED"
                          ? styles.rStatusFailed
                          : styles.rStatusPending
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>{r.sentAt ? new Date(r.sentAt).toLocaleString("id-ID") : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
