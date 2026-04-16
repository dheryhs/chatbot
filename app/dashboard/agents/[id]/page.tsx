"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Brain,
  BookOpen,
  Clock,
  MessageCircle,
  Settings,
  Save,
  Upload,
  PlusCircle,
  Trash2,
  FileText,
} from "lucide-react";
import styles from "./agentDetail.module.css";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

interface SessionItem {
  id: string;
  sessionName: string;
  phoneNumber: string | null;
  status: string;
}

interface QAPair {
  q: string;
  a: string;
}

interface SessionBinding {
  sessionId: string;
  enabled: boolean;
}

interface AgentData {
  name: string;
  description: string;
  systemPrompt: string;
  welcomeMessage: string;
  knowledgeText: string;
  knowledgeQA: QAPair[];
  followUpEnabled: boolean;
  followUpDelay: number;
  followUpMessage: string;
  sessionBindings: SessionBinding[];
  isActive: boolean;
  humanlikeBehaviour: boolean;
  replyDelay: number;
  stopOnManualReply: boolean;
  autoSwitchLegacy: boolean;
}

const TABS = [
  { key: "behaviour", label: "Behaviour", icon: Brain },
  { key: "knowledge", label: "Knowledge", icon: BookOpen },
  { key: "followup", label: "Follow-Up", icon: Clock },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "settings", label: "Settings", icon: Settings },
];

const DEFAULT_AGENT: AgentData = {
  name: "",
  description: "",
  systemPrompt: "",
  welcomeMessage: "",
  knowledgeText: "",
  knowledgeQA: [],
  followUpEnabled: false,
  followUpDelay: 30,
  followUpMessage: "",
  sessionBindings: [],
  isActive: true,
  humanlikeBehaviour: true,
  replyDelay: 2,
  stopOnManualReply: true,
  autoSwitchLegacy: false,
};

export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("behaviour");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [agent, setAgent] = useState<AgentData>(DEFAULT_AGENT);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [agentRes, sessionsRes] = await Promise.all([
          fetch(`/api/agents/${id}`),
          fetch("/api/sessions"),
        ]);
        const agentData = await agentRes.json();
        const sessionsData = await sessionsRes.json();

        if (agentData && !agentData.error) {
          setAgent({
            name: agentData.name || "",
            description: agentData.description || "",
            systemPrompt: agentData.systemPrompt || "",
            welcomeMessage: agentData.welcomeMessage || "",
            knowledgeText: agentData.knowledgeText || "",
            knowledgeQA: Array.isArray(agentData.knowledgeQA) ? agentData.knowledgeQA : [],
            followUpEnabled: agentData.followUpEnabled || false,
            followUpDelay: agentData.followUpDelay || 30,
            followUpMessage: agentData.followUpMessage || "",
            sessionBindings: Array.isArray(agentData.sessionBindings) ? agentData.sessionBindings : [],
            isActive: agentData.isActive ?? true,
            humanlikeBehaviour: agentData.humanlikeBehaviour ?? true,
            replyDelay: agentData.replyDelay ?? 2,
            stopOnManualReply: agentData.stopOnManualReply ?? true,
            autoSwitchLegacy: agentData.autoSwitchLegacy ?? false,
          });
        }
        if (Array.isArray(sessionsData)) setSessions(sessionsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent),
      });
      if (res.ok) {
        alert("Perubahan berhasil disimpan!");
      } else {
        alert("Gagal menyimpan perubahan.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--muted-foreground)" }}>
        Memuat konfigurasi agent...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => router.push("/dashboard/agents")} className={styles.backBtn}>
          <ChevronLeft size={20} />
        </button>
        <h1>{agent.name || "Agent Detail"}</h1>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tabBtn} ${activeTab === tab.key ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === "behaviour" && <BehaviourTab agent={agent} setAgent={setAgent} />}
        {activeTab === "knowledge" && <KnowledgeTab agent={agent} setAgent={setAgent} agentId={id} />}
        {activeTab === "followup" && <FollowUpTab agent={agent} setAgent={setAgent} />}
        {activeTab === "whatsapp" && <WhatsAppTab agent={agent} setAgent={setAgent} sessions={sessions} />}
        {activeTab === "settings" && <SettingsTab agent={agent} setAgent={setAgent} />}
      </div>

      {/* Save Bar */}
      <div className={styles.saveBar}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} /> {saving ? "Menyimpan..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ========== TAB COMPONENTS ========== */

function BehaviourTab({
  agent,
  setAgent,
}: {
  agent: AgentData;
  setAgent: (a: AgentData) => void;
}) {
  return (
    <div>
      <h3>Chatbot Behavior</h3>
      <p className={styles.hint}>
        Ini adalah AI prompt yang mengatur cara AI berbicara dan identitasnya.
        Anda bisa memasukkan instruksi gaya bicara, penanganan keberatan, dan lainnya.
      </p>
      <textarea
        className={styles.promptArea}
        rows={12}
        value={agent.systemPrompt}
        onChange={(e) => setAgent({ ...agent, systemPrompt: e.target.value })}
        placeholder={`Kamu adalah Customer Service bernama Dina di TokoBaik.\nTugasmu adalah memberikan informasi yang jelas, singkat, dan membantu.\n\nGaya bicara:\n- Gunakan bahasa yang ramah dan santai\n- Pakai emoji untuk berekspresi sesuai kebutuhan`}
      />

      <h3 style={{ marginTop: 28 }}>Welcome Message</h3>
      <p className={styles.hint}>Pesan yang dikirim saat customer pertama kali chat.</p>
      <input
        type="text"
        value={agent.welcomeMessage}
        onChange={(e) => setAgent({ ...agent, welcomeMessage: e.target.value })}
        placeholder="Halo! Ada yang bisa saya bantu hari ini? 😊"
        style={{ width: "100%" }}
      />
    </div>
  );
}

function KnowledgeTab({
  agent,
  setAgent,
  agentId,
}: {
  agent: AgentData;
  setAgent: (a: AgentData) => void;
  agentId: string;
}) {
  const [subTab, setSubTab] = useState<"text" | "qa">("text");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/agents/${agentId}/knowledge-upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh agent data to get updated knowledgeText
        const agentRes = await fetch(`/api/agents/${agentId}`);
        const updated = await agentRes.json();
        if (updated && !updated.error) {
          setAgent({ ...agent, knowledgeText: updated.knowledgeText || "" });
        }
        alert(`Berhasil mengekstrak ${data.extractedLength} karakter dari ${data.filename}`);
      } else {
        alert(data.error || "Gagal upload file.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saat mengupload file.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Q&A Handlers
  const addQA = () => {
    setAgent({ ...agent, knowledgeQA: [...agent.knowledgeQA, { q: "", a: "" }] });
  };

  const updateQA = (index: number, field: "q" | "a", value: string) => {
    const updated = [...agent.knowledgeQA];
    updated[index] = { ...updated[index], [field]: value };
    setAgent({ ...agent, knowledgeQA: updated });
  };

  const removeQA = (index: number) => {
    setAgent({ ...agent, knowledgeQA: agent.knowledgeQA.filter((_, i) => i !== index) });
  };

  return (
    <div>
      {/* Sub-tab selector */}
      <div className={styles.subTabs}>
        <button
          className={`${styles.subTabBtn} ${subTab === "text" ? styles.activeSubTab : ""}`}
          onClick={() => setSubTab("text")}
        >
          <FileText size={14} /> From Text
        </button>
        <button
          className={`${styles.subTabBtn} ${subTab === "qa" ? styles.activeSubTab : ""}`}
          onClick={() => setSubTab("qa")}
        >
          <BookOpen size={14} /> From Q&A
        </button>
      </div>

      {subTab === "text" ? (
        <>
          <h3>Learning From Text Database</h3>
          <p className={styles.hint}>
            Taruh info bisnis Anda di sini: SOPs, FAQs, deskripsi produk, harga, dan lainnya.
            AI chatbot akan belajar dari teks ini untuk menjawab pertanyaan customer.
          </p>
          <textarea
            className={styles.promptArea}
            rows={14}
            value={agent.knowledgeText}
            onChange={(e) => setAgent({ ...agent, knowledgeText: e.target.value })}
            placeholder={`Apa itu TokoBaik?\nTokoBaik adalah toko online yang menjual produk herbal berkualitas.\n\nProduk unggulan:\n- Madu Hutan 250ml — Rp75.000\n- Habatussauda 120 kapsul — Rp55.000`}
          />

          {/* Upload Section */}
          <div className={styles.uploadSection}>
            <input
              type="file"
              accept=".pdf,.txt"
              hidden
              ref={fileRef}
              onChange={handleFileUpload}
            />
            <button
              className={styles.uploadBtn}
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <Upload size={16} /> {uploading ? "Mengekstrak teks..." : "Upload PDF / TXT"}
            </button>
            <p className={styles.hint} style={{ marginTop: 8, marginBottom: 0 }}>
              File yang diupload akan diekstrak teksnya dan ditambahkan ke knowledge base di atas.
            </p>
          </div>
        </>
      ) : (
        <>
          <h3>Q&A Knowledge Base</h3>
          <p className={styles.hint}>
            Buat pasangan Pertanyaan & Jawaban yang sering ditanyakan customer.
          </p>
          {agent.knowledgeQA.map((pair, idx) => (
            <div key={idx} className={styles.qaRow}>
              <textarea
                placeholder="Pertanyaan customer..."
                value={pair.q}
                onChange={(e) => updateQA(idx, "q", e.target.value)}
              />
              <textarea
                placeholder="Jawaban AI..."
                value={pair.a}
                onChange={(e) => updateQA(idx, "a", e.target.value)}
              />
              <button className={styles.qaRemoveBtn} onClick={() => removeQA(idx)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            className="btn btn-secondary"
            onClick={addQA}
            style={{ marginTop: 8 }}
          >
            <PlusCircle size={16} /> Tambah Q&A
          </button>
        </>
      )}
    </div>
  );
}

function FollowUpTab({
  agent,
  setAgent,
}: {
  agent: AgentData;
  setAgent: (a: AgentData) => void;
}) {
  return (
    <div>
      <h3>Follow-Up Otomatis</h3>
      <p className={styles.hint}>
        Kirim pesan follow-up otomatis jika customer tidak membalas dalam waktu tertentu.
      </p>

      <div className={styles.settingRow}>
        <span>Aktifkan Follow-Up</span>
        <ToggleSwitch
          checked={agent.followUpEnabled}
          onChange={(v) => setAgent({ ...agent, followUpEnabled: v })}
        />
      </div>

      {agent.followUpEnabled && (
        <div className={styles.followUpFields}>
          <div className="input-group">
            <label>Delay sebelum follow-up (menit)</label>
            <input
              type="number"
              min={1}
              value={agent.followUpDelay}
              onChange={(e) =>
                setAgent({ ...agent, followUpDelay: parseInt(e.target.value) || 30 })
              }
              style={{ maxWidth: 120 }}
            />
          </div>
          <div className="input-group">
            <label>Pesan Follow-Up</label>
            <textarea
              rows={4}
              value={agent.followUpMessage}
              onChange={(e) => setAgent({ ...agent, followUpMessage: e.target.value })}
              placeholder="Halo kak, masih ada yang bisa dibantu? 😊"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppTab({
  agent,
  setAgent,
  sessions,
}: {
  agent: AgentData;
  setAgent: (a: AgentData) => void;
  sessions: SessionItem[];
}) {
  const bindings = agent.sessionBindings || [];

  const isEnabled = (sessionId: string) => {
    const binding = bindings.find((b) => b.sessionId === sessionId);
    return binding?.enabled || false;
  };

  const toggleSession = (sessionId: string) => {
    const existing = bindings.find((b) => b.sessionId === sessionId);
    let newBindings: SessionBinding[];
    if (existing) {
      newBindings = bindings.map((b) =>
        b.sessionId === sessionId ? { ...b, enabled: !b.enabled } : b
      );
    } else {
      newBindings = [...bindings, { sessionId, enabled: true }];
    }
    setAgent({ ...agent, sessionBindings: newBindings });
  };

  return (
    <div>
      <h3>Numbers Affected</h3>
      <p className={styles.hint}>
        Aktifkan agent ini pada session WhatsApp berikut. Satu agent bisa terhubung ke beberapa nomor sekaligus.
      </p>
      <div className={styles.sessionList}>
        {sessions.length === 0 ? (
          <p className={styles.hint}>Belum ada session WhatsApp. Buat session terlebih dahulu.</p>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className={styles.sessionRow}>
              <div>
                <strong>{s.sessionName}</strong>
                {s.phoneNumber && (
                  <span style={{ marginLeft: 8, color: "var(--muted-foreground)", fontSize: "0.85rem" }}>
                    ({s.phoneNumber})
                  </span>
                )}
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: s.status === "WORKING" ? "rgba(37,211,102,0.15)" : "rgba(255,68,68,0.1)",
                    color: s.status === "WORKING" ? "#25D366" : "#ff6666",
                  }}
                >
                  {s.status}
                </span>
              </div>
              <ToggleSwitch checked={isEnabled(s.id)} onChange={() => toggleSession(s.id)} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SettingsTab({
  agent,
  setAgent,
}: {
  agent: AgentData;
  setAgent: (a: AgentData) => void;
}) {
  return (
    <div>
      <h3>Primary Settings</h3>
      <div className={styles.settingRow}>
        <span>Using AI and Turn Off currently Auto-Reply</span>
        <ToggleSwitch
          checked={agent.isActive}
          onChange={(v) => setAgent({ ...agent, isActive: v })}
        />
      </div>
      <div className={styles.settingRow}>
        <span>Auto Switch Back to Legacy if insufficient token</span>
        <ToggleSwitch
          checked={agent.autoSwitchLegacy}
          onChange={(v) => setAgent({ ...agent, autoSwitchLegacy: v })}
        />
      </div>

      <h3 style={{ marginTop: 28 }}>Advanced AI Settings</h3>
      <div className={styles.settingRow}>
        <span>Simulasi Waktu Mengetik (Delay)</span>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="range"
            min="1"
            max="10"
            value={agent.replyDelay}
            onChange={(e) => setAgent({ ...agent, replyDelay: parseInt(e.target.value) })}
            style={{ width: "100px" }}
          />
          <span style={{ minWidth: "50px", fontSize: "0.85rem", color: "var(--muted-foreground)" }}>
            {agent.replyDelay} detik
          </span>
        </div>
      </div>
      <div className={styles.settingRow}>
        <span>Tampilkan Status "Typing..." (Efek Mengetik)</span>
        <ToggleSwitch
          checked={agent.humanlikeBehaviour}
          onChange={(v) => setAgent({ ...agent, humanlikeBehaviour: v })}
        />
      </div>
      <div className={styles.settingRow}>
        <span>Stop AI Reply if CS manual replied</span>
        <ToggleSwitch
          checked={agent.stopOnManualReply}
          onChange={(v) => setAgent({ ...agent, stopOnManualReply: v })}
        />
      </div>
    </div>
  );
}
