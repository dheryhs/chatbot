"use client";

import { Bell, Search, Moon, Sun } from "lucide-react";
import styles from "./layout.module.css";

export default function Navbar() {
  return (
    <div className="navbar">
      <div className={styles.navLeft}>
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input type="text" placeholder="Search anything..." />
        </div>
      </div>
      
      <div className={styles.navRight}>
        <button className={styles.navIconBtn}>
          <Moon size={20} />
        </button>
        <button className={styles.navIconBtn}>
          <Bell size={20} />
          <span className={styles.notificationBadge}></span>
        </button>
      </div>
    </div>
  );
}
