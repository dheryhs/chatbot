"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  BarChart3,
  MessageSquare,
  Users,
  Settings,
  Megaphone,
  LogOut,
  Package,
  Warehouse,
  Bot,
  HelpCircle,
  Zap,
  ArrowUpCircle,
} from "lucide-react";
import styles from "./layout.module.css";
import { signOut, useSession } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number | null>(null);

  const isActive = (path: string) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.credits !== undefined) setCredits(d.credits);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="sidebar">
      {/* Brand / Logo */}
      <div className={styles.sidebarHeader}>
        <div className={styles.logoIcon}>
          <LayoutGrid size={22} />
        </div>
        <div className={styles.logoText}>
          <div className={styles.logoTitle}>CRMku</div>
          <div className={styles.logoSub}>{session?.user?.name?.toUpperCase() || "USER"}</div>
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.sidebarContent}>
        <nav className={styles.nav}>
          {/* Group 1: Overview */}
          <Link href="/dashboard" className={`${styles.navItem} ${isActive("/dashboard") && pathname === "/dashboard" ? styles.active : ""}`}>
            <LayoutGrid size={18} /> <span>Dashboard</span>
          </Link>
          <Link href="/dashboard/sessions" className={`${styles.navItem} ${isActive("/dashboard/sessions") ? styles.active : ""}`}>
            <BarChart3 size={18} /> <span>Session</span>
          </Link>

          <div className={styles.divider} />

          {/* Group 2: CRM & Stock */}
          <Link href="/dashboard/chats" className={`${styles.navItem} ${isActive("/dashboard/chats") ? styles.active : ""}`}>
            <MessageSquare size={18} /> <span>Chat</span>
          </Link>
          <Link href="/dashboard/contacts" className={`${styles.navItem} ${isActive("/dashboard/contacts") ? styles.active : ""}`}>
            <Users size={18} /> <span>Contact</span>
          </Link>
          <Link href="/dashboard/warehouses" className={`${styles.navItem} ${isActive("/dashboard/warehouses") ? styles.active : ""}`}>
            <Warehouse size={18} /> <span>Warehouses</span>
          </Link>
          <Link href="/dashboard/products" className={`${styles.navItem} ${isActive("/dashboard/products") ? styles.active : ""}`}>
            <Package size={18} /> <span>Product</span>
          </Link>

          <div className={styles.divider} />

          {/* Group 3: Marketing */}
          <Link href="/dashboard/broadcast" className={`${styles.navItem} ${isActive("/dashboard/broadcast") ? styles.active : ""}`}>
            <Megaphone size={18} /> <span>Broadcast</span>
          </Link>

          <div className={styles.divider} />

          {/* Group 4: AI */}
          <Link href="/dashboard/agents" className={`${styles.navItem} ${isActive("/dashboard/agents") ? styles.active : ""}`}>
            <Bot size={18} /> <span>Agent AI</span>
          </Link>

          <div className={styles.divider} />

          {/* Group 5: System */}
          <Link href="/dashboard/settings" className={`${styles.navItem} ${isActive("/dashboard/settings") ? styles.active : ""}`}>
            <Settings size={18} /> <span>Setting</span>
          </Link>
          <Link href="/dashboard/helpcenter" className={`${styles.navItem} ${isActive("/dashboard/helpcenter") ? styles.active : ""}`}>
            <HelpCircle size={18} /> <span>Helpcenter</span>
          </Link>
        </nav>
      </div>

      {/* Footer: Credits + Upgrade + Sign Out */}
      <div className={styles.sidebarFooter}>
        {/* Credits */}
        <div className={styles.creditsBox}>
          <div className={styles.creditsLabel}>
            <span>CREDITS</span>
            <Zap size={14} />
          </div>
          <div className={styles.creditsValue}>
            {credits !== null ? credits.toLocaleString("id-ID") : "–"}
          </div>
        </div>

        {/* Upgrade */}
        <button className={styles.upgradeBtn}>
          <ArrowUpCircle size={16} />
          Upgrade Plan
        </button>

        {/* Sign Out */}
        <button className={styles.logoutBtn} onClick={() => signOut()}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
