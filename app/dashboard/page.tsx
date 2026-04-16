"use client";

import { useEffect, useState } from "react";
import {
  Smartphone,
  Users,
  Package,
  Megaphone,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Zap,
} from "lucide-react";
import styles from "./dashboard.module.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  credits: number;
  activeSessions: number;
  totalContacts: number;
  totalProducts: number;
  totalBroadcasts: number;
  totalSentMessages: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(console.error);
  }, []);

  const cards = [
    {
      title: "Active Sessions",
      value: stats?.activeSessions ?? "–",
      sub: "WhatsApp sessions connected",
      icon: <Smartphone size={20} />,
      trend: stats?.activeSessions ? `${stats.activeSessions} online` : "Inactive",
      trendUp: (stats?.activeSessions ?? 0) > 0,
    },
    {
      title: "Total Contacts",
      value: stats?.totalContacts ?? "–",
      sub: "Kontak tersimpan di database",
      icon: <Users size={20} />,
      trend: `${stats?.totalContacts ?? 0} entries`,
      trendUp: true,
    },
    {
      title: "Products",
      value: stats?.totalProducts ?? "–",
      sub: "Katalog produk",
      icon: <Package size={20} />,
      trend: `${stats?.totalProducts ?? 0} items`,
      trendUp: true,
    },
    {
      title: "Messages Sent",
      value: stats?.totalSentMessages ?? "–",
      sub: "Total broadcast terkirim",
      icon: <MessageSquare size={20} />,
      trend: `${stats?.totalBroadcasts ?? 0} campaigns`,
      trendUp: (stats?.totalSentMessages ?? 0) > 0,
    },
  ];

  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        fill: true,
        label: "Messages",
        data: [0, 0, 0, 0, 0, 0, stats?.totalSentMessages ?? 0],
        borderColor: "#25D366",
        backgroundColor: "rgba(37, 211, 102, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a1a",
        borderColor: "#333",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#888" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#888" },
      },
    },
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${styles.active}`}>Overview</button>
          <button className={styles.tab}>Analytics</button>
          <button className={styles.tab}>Reports</button>
          <button className={styles.tab}>Notifications</button>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map((stat, i) => (
          <div key={i} className="card">
            <div className={styles.statHeader}>
              <span className={styles.statTitle}>{stat.title}</span>
              <div className={styles.statIcon}>{stat.icon}</div>
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statSub}>{stat.sub}</div>
            <div
              className={`${styles.statTrend} ${stat.trendUp ? styles.up : styles.down}`}
            >
              {stat.trendUp ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.chartsGrid}>
        <div className="card" style={{ gridColumn: "span 2", minHeight: "400px" }}>
          <div className="card-title">Overview</div>
          <div className={styles.chartContainer}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Credits Remaining</div>
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Zap size={32} style={{ color: "#8b5cf6", marginBottom: "12px" }} />
            <div style={{ fontSize: "2.5rem", fontWeight: 700 }}>
              {stats?.credits?.toLocaleString("id-ID") ?? "–"}
            </div>
            <p style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
              credits tersisa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
