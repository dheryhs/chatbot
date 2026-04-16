"use client";

import { HelpCircle, Mail, MessageCircle, ExternalLink, BookOpen } from "lucide-react";
import styles from "./helpcenter.module.css";

export default function HelpCenterPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Help Center</h1>
        <p className={styles.subtitle}>Temukan jawaban atau hubungi tim dukungan kami.</p>
      </div>

      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(37, 211, 102, 0.1)" }}>
            <Mail size={24} style={{ color: "#25D366" }} />
          </div>
          <h3>Email Support</h3>
          <p>Butuh bantuan teknis? Kirimkan email kepada kami.</p>
          <a href="mailto:support@editorialprecision.com" className={styles.link}>
            support@editorialprecision.com <ExternalLink size={14} />
          </a>
        </div>

        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: "rgba(37, 211, 102, 0.1)" }}>
            <MessageCircle size={24} style={{ color: "#25D366" }} />
          </div>
          <h3>WhatsApp Support</h3>
          <p>Hubungi kami langsung melalui WhatsApp untuk respon cepat.</p>
          <a href="https://wa.me/628123456789" target="_blank" className={styles.link} style={{ color: "#25D366" }}>
            Chat on WhatsApp <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div className={styles.docsSection}>
        <BookOpen size={48} strokeWidth={1} style={{ opacity: 0.4, marginBottom: "16px" }} />
        <h2>Dokumentasi API</h2>
        <p>Pelajari cara mengintegrasikan platform ini ke dalam aplikasi Anda dengan dokumentasi lengkap kami.</p>
        <button className={styles.docsBtn}>Buka Dokumentasi</button>
      </div>
    </div>
  );
}
