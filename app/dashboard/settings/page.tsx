"use client";

import { useState, useEffect } from "react";
import { User, Lock, Zap, Shield, Save, CheckCircle, Bot, Eye, EyeOff } from "lucide-react";
import styles from "./settings.module.css";

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  role: string;
  credits: number;
  aiApiKey: string | null;
  aiProvider: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  // AI API Key form (ADMIN only)
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiProvider, setAiProvider] = useState("openai");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingAiKey, setSavingAiKey] = useState(false);
  const [aiKeySaved, setAiKeySaved] = useState(false);

  useEffect(() => {
    fetch("/api/user/settings")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setAiApiKey(data.aiApiKey || "");
        setAiProvider(data.aiProvider || "openai");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSaved(false);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSaved(false);

    if (newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi password tidak cocok");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSaved(true);
        setTimeout(() => setPasswordSaved(false), 3000);
      } else {
        const data = await res.json();
        setPasswordError(data.error || "Gagal mengubah password");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSaveAiKey = async () => {
    setSavingAiKey(true);
    setAiKeySaved(false);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiApiKey, aiProvider }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiApiKey(data.aiApiKey || "");
        setAiKeySaved(true);
        setTimeout(() => setAiKeySaved(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menyimpan API Key");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAiKey(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "60px", textAlign: "center" }}>Loading settings...</div>;
  }

  return (
    <div className={styles.settingsPage}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>Kelola profil dan keamanan akun Anda.</p>

      <div className={styles.sectionsGrid}>
        {/* Profile Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <User size={20} />
            <h2>Profil</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" value={profile?.email || ""} disabled />
              <span className={styles.hint}>Email tidak dapat diubah.</span>
            </div>
            <div className={styles.field}>
              <label>Nama</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda"
              />
            </div>
            <div className={styles.field}>
              <label>Role</label>
              <input type="text" value={profile?.role || ""} disabled />
            </div>
            <div className={styles.field}>
              <label>Bergabung Sejak</label>
              <input
                type="text"
                value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : ""}
                disabled
              />
            </div>
            <button
              className={styles.saveBtn}
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {profileSaved ? (
                <><CheckCircle size={16} /> Tersimpan!</>
              ) : (
                <><Save size={16} /> {savingProfile ? "Menyimpan..." : "Simpan Profil"}</>
              )}
            </button>
          </div>
        </div>

        {/* Password Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Lock size={20} />
            <h2>Ubah Password</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.field}>
              <label>Password Saat Ini</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className={styles.field}>
              <label>Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className={styles.field}>
              <label>Konfirmasi Password Baru</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru"
              />
            </div>
            {passwordError && (
              <div className={styles.errorMsg}>{passwordError}</div>
            )}
            <button
              className={styles.saveBtn}
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword}
            >
              {passwordSaved ? (
                <><CheckCircle size={16} /> Password Diubah!</>
              ) : (
                <><Lock size={16} /> {savingPassword ? "Mengubah..." : "Ubah Password"}</>
              )}
            </button>
          </div>
        </div>

        {/* Credits/Billing Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Zap size={20} />
            <h2>Credits & Billing</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.creditsDisplay}>
              <div className={styles.creditsNumber}>
                {profile?.credits?.toLocaleString("id-ID") ?? "0"}
              </div>
              <div className={styles.creditsLabel}>Credits Tersisa</div>
            </div>
            <button className={styles.upgradeBtn}>
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* AI API Key Section — ADMIN ONLY */}
        {profile?.role === "ADMIN" && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <Bot size={20} />
              <h2>AI API Key</h2>
            </div>
            <div className={styles.sectionBody}>
              <div className={styles.field}>
                <label>AI Provider</label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                >
                  <option value="openai">OpenAI (GPT)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>API Key</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer',
                    }}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className={styles.hint}>
                  API key disimpan terenkripsi. Hanya Admin yang bisa mengubah key ini.
                </span>
              </div>
              <button
                className={styles.saveBtn}
                onClick={handleSaveAiKey}
                disabled={savingAiKey}
              >
                {aiKeySaved ? (
                  <><CheckCircle size={16} /> API Key Tersimpan!</>
                ) : (
                  <><Save size={16} /> {savingAiKey ? "Menyimpan..." : "Simpan AI Config"}</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Shield size={20} />
            <h2>Keamanan</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.securityItem}>
              <div>
                <strong>Two-Factor Authentication</strong>
                <p className={styles.hint}>Tambahkan lapisan keamanan ekstra untuk akun Anda.</p>
              </div>
              <span className={styles.comingSoon}>Coming Soon</span>
            </div>
            <div className={styles.securityItem}>
              <div>
                <strong>API Keys</strong>
                <p className={styles.hint}>Kelola kunci API untuk integrasi pihak ketiga.</p>
              </div>
              <span className={styles.comingSoon}>Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
