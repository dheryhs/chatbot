"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  History,
  Minus,
  Plus,
  Tag,
  Upload,
  X,
  Play,
  Pause,
  Rocket,
  Bold,
  Italic,
  Strikethrough,
  Quote,
  Smile,
  Shuffle,
  Clock,
  Type,
  Image as ImageIcon,
  PlusCircle,
  Trash2,
  FileText
} from "lucide-react";
import styles from "./broadcast.module.css";
import { Modal } from "@/components/ui/Modal";

interface Session {
  id: string;
  sessionName: string;
  wahaSessionId: string;
}

interface Contact {
  id: string;
  name: string | null;
  phoneNumber: string;
  tags: string[];
}

interface BroadcastItem {
  id: string;
  name: string;
  status: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  delayMin: number;
  delayMax: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  session: { sessionName: string };
}

interface MessageContent {
  id: string;
  type: "text" | "image";
  text?: string;
  url?: string;
  caption?: string;
}

export default function BroadcastPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("new");

  // Data
  const [sessions, setSessions] = useState<Session[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);

  // Form state
  const [broadcastName, setBroadcastName] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [delayMin, setDelayMin] = useState(5);
  const [delayMax, setDelayMax] = useState(10);
  const [recipients, setRecipients] = useState<Contact[]>([]);
  const [contents, setContents] = useState<MessageContent[]>([
    { id: Date.now().toString(), type: "text", text: "" }
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Modal states
  const [showTagModal, setShowTagModal] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Spintext states
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [spinWords, setSpinWords] = useState<string[]>([]);
  const [spinInput, setSpinInput] = useState("");
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);

  // CSV Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importingCsv, setImportingCsv] = useState(false);

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const result = [];
    if (lines.length === 0) return result;
    
    // Asumsi koma delimiter.
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name') > -1 ? headers.indexOf('name') : 1; 
    const phoneIdx = headers.indexOf('phone') > -1 ? headers.indexOf('phone') : 0;

    for (let i = 1; i < lines.length; i++) {
       if (!lines[i].trim()) continue;
       const currentline = lines[i].split(','); 
       // Minimal punya nomor HP
       if (currentline.length > phoneIdx && currentline[phoneIdx]) {
          result.push({
            name: currentline[nameIdx]?.trim() || "Unnamed",
            phoneNumber: currentline[phoneIdx]?.trim() // belum dinormalisasi, akan dinormalisasi di backend
          });
       }
    }
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingCsv(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      const parsedContacts = parseCSV(csvData);

      if (parsedContacts.length === 0) {
        alert("File CSV kosong atau format tidak sesuai (Sisipkan koma antar kolom Phone dan Name)");
        setImportingCsv(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      try {
        const res = await fetch("/api/contacts/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contacts: parsedContacts })
        });
        
        const data = await res.json();
        if (res.ok && data.contacts) {
           setRecipients((prev) => {
              const existingPhones = new Set(prev.map(r => r.phoneNumber));
              const newOnes = data.contacts.filter((c: any) => !existingPhones.has(c.phoneNumber));
              return [...prev, ...newOnes];
           });
           alert(`Berhasil mengimpor ${data.count} kontak dari CSV!`);
        } else {
           alert(data.error || "Gagal import CSV");
        }
      } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan saat upload.");
      } finally {
        setImportingCsv(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };


  const fetchData = async () => {
    try {
      const [sRes, cRes, bRes] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/contacts"),
        fetch("/api/broadcast"),
      ]);
      const sessionsData = await sRes.json();
      const contactsData = await cRes.json();
      const broadcastsData = await bRes.json();

      if (Array.isArray(sessionsData)) setSessions(sessionsData);
      if (Array.isArray(contactsData)) {
        setAllContacts(contactsData);
        // Extract unique tags
        const tags = new Set<string>();
        contactsData.forEach((c: Contact) => c.tags?.forEach((t: string) => tags.add(t)));
        setAllTags(Array.from(tags).sort());
      }
      if (Array.isArray(broadcastsData)) setBroadcasts(broadcastsData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Content Management
  const addContent = (type: "text" | "image") => {
    setContents([...contents, { id: Date.now().toString(), type, text: "", caption: "", url: "" }]);
  };

  const removeContent = (id: string) => {
    if (contents.length === 1) return;
    setContents(contents.filter(c => c.id !== id));
  };

  const updateContent = (id: string, updates: Partial<MessageContent>) => {
    setContents(contents.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleFormat = (id: string, symbol: string) => {
    const content = contents.find(c => c.id === id);
    if (!content) return;
    
    const textToInsert = symbol === "> " ? "\n> " : `${symbol}teks${symbol}`;

    if (content.type === "text") {
      updateContent(id, { text: (content.text || "") + " " + textToInsert });
    } else {
      updateContent(id, { caption: (content.caption || "") + " " + textToInsert });
    }
  };

  const insertVariable = (id: string, variable: string) => {
     const content = contents.find(c => c.id === id);
     if (!content) return;
     if (content.type === 'text') {
        updateContent(id, { text: (content.text || "") + " " + variable });
     } else {
        updateContent(id, { caption: (content.caption || "") + " " + variable });
     }
  };

  // Spintext Modal Logic
  const openSpinModal = (id: string) => {
    setActiveEditorId(id);
    setSpinWords(["Halo", "Selamat Pagi", "Hai", "Apa kabar"]);
    setSpinInput("");
    setShowSpinModal(true);
  };

  const addSpinWord = () => {
    if (!spinInput.trim()) return;
    setSpinWords([...spinWords, spinInput.trim()]);
    setSpinInput("");
  };

  const applySpintext = () => {
    if (spinWords.length === 0 || !activeEditorId) {
      setShowSpinModal(false);
      return;
    }
    const spintext = `{${spinWords.join("|")}}`;
    const content = contents.find(c => c.id === activeEditorId);
    if (content) {
      if (content.type === "text") {
        updateContent(activeEditorId, { text: (content.text || "") + " " + spintext });
      } else {
        updateContent(activeEditorId, { caption: (content.caption || "") + " " + spintext });
      }
    }
    setShowSpinModal(false);
  };

  // ---- Tag picker ----
  const handleApplyTags = async () => {
    if (selectedTags.length === 0) return;
    setLoadingTags(true);
    try {
      const res = await fetch(`/api/contacts/filter?tags=${selectedTags.join(",")}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecipients((prev) => {
          const existingPhones = new Set(prev.map((r) => r.phoneNumber));
          const newOnes = data.filter((c: Contact) => !existingPhones.has(c.phoneNumber));
          return [...prev, ...newOnes];
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTags(false);
      setShowTagModal(false);
    }
  };

  // ---- Start broadcast ----
  const handleStartBroadcast = async () => {
    if (!broadcastName || !selectedSession || recipients.length === 0) return;
    setSubmitting(true);
    try {
      const contactIds = recipients.map((r) => r.id);
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: broadcastName,
          sessionId: selectedSession,
          contactIds,
          contents: contents.map(({ id, ...rest }) => rest),
          delayMin,
          delayMax,
        }),
      });
      if (res.ok) {
        setBroadcastName("");
        setContents([{ id: Date.now().toString(), type: "text", text: "" }]);
        setRecipients([]);
        setActiveTab("status");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal memulai broadcast");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getProgress = (b: BroadcastItem) => {
    if (b.totalCount === 0) return 0;
    return Math.round(((b.sentCount + b.failedCount) / b.totalCount) * 100);
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Broadcast</h1>
        <p className={styles.subtitle}>Welcome to Editorial Precision Dashboard</p>
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === "new" ? styles.active : ""}`}
            onClick={() => setActiveTab("new")}
          >
            <Send size={16} /> New Broadcast
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "status" ? styles.active : ""}`}
            onClick={() => { setActiveTab("status"); fetchData(); }}
          >
            <History size={16} /> Broadcast Status
          </button>
        </div>
      </div>

      {activeTab === "new" ? (
        <div className={styles.formSection}>
          <div className={styles.topRow}>
            <div className="input-group">
              <label>Nama Broadcast</label>
              <input
                type="text"
                placeholder="e.g. Promo Ramadhan"
                value={broadcastName}
                onChange={(e) => setBroadcastName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Session WA</label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
              >
                <option value="">Pilih session...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sessionName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Delay Settings */}
          <div className={styles.delayCard}>
             <div className={styles.delayRow}>
              <span className={styles.delayLabel}>Jeda minimal</span>
              <div className={styles.delayControl}>
                <button className={styles.delayBtn} onClick={() => setDelayMin(Math.max(1, delayMin - 1))}>
                  <Minus size={14} />
                </button>
                <input
                  className={styles.delayInput}
                  type="number"
                  value={delayMin}
                  onChange={(e) => setDelayMin(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <button className={styles.delayBtn} onClick={() => setDelayMin(delayMin + 1)}>
                  <Plus size={14} />
                </button>
              </div>
              <span className={styles.delayUnit}>Detik</span>
            </div>
            <div className={styles.delayRow}>
              <span className={styles.delayLabel}>Jeda maksimal</span>
              <div className={styles.delayControl}>
                <button className={styles.delayBtn} onClick={() => setDelayMax(Math.max(delayMin, delayMax - 1))}>
                  <Minus size={14} />
                </button>
                <input
                  className={styles.delayInput}
                  type="number"
                  value={delayMax}
                  onChange={(e) => setDelayMax(Math.max(delayMin, parseInt(e.target.value) || delayMin))}
                />
                <button className={styles.delayBtn} onClick={() => setDelayMax(delayMax + 1)}>
                  <Plus size={14} />
                </button>
              </div>
              <span className={styles.delayUnit}>Detik</span>
            </div>
          </div>

          {/* Recipients */}
          <div className={styles.recipientsSection}>
            <label style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "8px", display: "block" }}>
              Penerima
            </label>
            <div className={styles.recipientActions}>
              <button className={styles.recipientBtn} onClick={() => setShowTagModal(true)}>
                <Tag size={14} /> Ambil Kontak (label / tag)
              </button>
              <button
                className={styles.recipientBtn}
                onClick={() => {
                  setRecipients((prev) => {
                    const existingPhones = new Set(prev.map((r) => r.phoneNumber));
                    const newOnes = allContacts.filter((c) => !existingPhones.has(c.phoneNumber));
                    return [...prev, ...newOnes];
                  });
                }}
              >
                <Upload size={14} /> Semua Kontak
              </button>

              {/* TOMBOL IMPORT CSV */}
              <input 
                type="file" 
                accept=".csv" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={handleFileUpload} 
              />
              <button 
                className={styles.recipientBtn} 
                onClick={() => fileInputRef.current?.click()}
                disabled={importingCsv}
              >
                <FileText size={14} /> {importingCsv ? "Mengimpor..." : "Import CSV"}
              </button>
            </div>
            <div className={styles.recipientList}>
               {recipients.length === 0 ? (
                <div className={styles.recipientEmpty}>Belum ada penerima terpilih.</div>
              ) : (
                recipients.map((r, idx) => (
                  <div key={r.phoneNumber} className={styles.recipientItem}>
                    <span className={styles.recipientNum}>{idx + 1}</span>
                    <span className={styles.recipientInfo}>{r.phoneNumber}, {r.name || r.phoneNumber}</span>
                    <button className={styles.removeBtn} onClick={() => setRecipients(recipients.filter(x => x.id !== r.id))}>
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CONTENT SECTION */}
          <div className={styles.contentSection}>
            <label>Konten</label>
            <p className={styles.contentSubtitle}>Isi konten yang akan disebarkan</p>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>Pratinjau</button>
              <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>Template</button>
            </div>

            {contents.map((item) => (
              <div key={item.id} className={styles.editorBox}>
                <div className={styles.editorToolbar}>
                   <button className={styles.toolbarBtn} onClick={() => handleFormat(item.id, "*")}>
                    <Bold size={16} />
                  </button>
                  <button className={styles.toolbarBtn} onClick={() => handleFormat(item.id, "_")}>
                    <Italic size={16} />
                  </button>
                  <button className={styles.toolbarBtn} onClick={() => handleFormat(item.id, "~")}>
                    <Strikethrough size={16} />
                  </button>
                  <button className={styles.toolbarBtn} onClick={() => handleFormat(item.id, "> ")}>
                    <Quote size={16} />
                  </button>
                  <div className={styles.toolbarDivider} />
                  <button className={styles.toolbarBtn} onClick={() => insertVariable(item.id, "{name}")}>
                    <Smile size={16} />
                  </button>
                  <button className={styles.spinBtn} onClick={() => openSpinModal(item.id)}>
                    <Shuffle size={14} /> Spintext
                  </button>
                  <button className={styles.toolbarBtn} onClick={() => insertVariable(item.id, "{time}")}>
                    <Clock size={16} />
                  </button>
                </div>

                <div className={styles.mediaEditor}>
                  {item.type === "text" ? (
                    <textarea
                      placeholder="Isi konten sebaran Anda di sini"
                      className={styles.contentArea}
                      value={item.text}
                      onChange={(e) => updateContent(item.id, { text: e.target.value })}
                      style={{ border: 'none', background: 'transparent' }}
                    />
                  ) : (
                    <div>
                      {item.url ? (
                        <div className={styles.imagePreviewArea}>
                           <img src={item.url} alt="Broadcast preview" />
                           <button className={styles.removeBtn} style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', color: 'white' }} onClick={() => updateContent(item.id, { url: "" })}>
                             <X size={14} />
                           </button>
                        </div>
                      ) : (
                        <div className={styles.imageUploadPlaceholder} onClick={() => {
                           // Example: prompt for URL
                           const url = prompt("Masukkan URL Gambar:");
                           if (url) updateContent(item.id, { url });
                        }}>
                          <ImageIcon size={24} />
                          <span>Klik untuk tambah gambar (URL)</span>
                        </div>
                      )}
                      <textarea
                        placeholder="Tulis caption gambar di sini..."
                        className={styles.contentArea}
                        value={item.caption}
                        onChange={(e) => updateContent(item.id, { caption: e.target.value })}
                        style={{ border: 'none', background: 'transparent', minHeight: '60px' }}
                      />
                    </div>
                  )}
                </div>
                
                {contents.length > 1 && (
                  <div className={styles.contentRowActions}>
                     <button className={styles.removeContentBtn} onClick={() => removeContent(item.id)}>
                       <Trash2 size={14} /> Hapus Konten Ini
                     </button>
                  </div>
                )}
              </div>
            ))}

            <div className={styles.addContentGroup}>
              <button className={styles.addContentBtn} onClick={() => addContent("text")}>
                <PlusCircle size={18} /> Tambah Teks
              </button>
              <button className={styles.addContentBtn} onClick={() => addContent("image")}>
                <ImageIcon size={18} /> Tambah Gambar
              </button>
            </div>
          </div>

          <button
            className={styles.startBtn}
            disabled={submitting || !broadcastName || !selectedSession || recipients.length === 0}
            onClick={handleStartBroadcast}
          >
            <Rocket size={18} />
            {submitting ? "Memulai..." : `Mulai Broadcast ke ${recipients.length} Penerima`}
          </button>
        </div>
      ) : (
        /* ===== STATUS TAB ===== */
        <div className={styles.statusGrid}>
           {broadcasts.length === 0 ? (
            <div className={styles.emptyState}>Belum ada riwayat broadcast.</div>
          ) : (
            broadcasts.map((b) => (
              <div
                key={b.id}
                className={styles.statusCard}
                onClick={() => router.push(`/dashboard/broadcast/${b.id}`)}
              >
                <div className={styles.statusCardHeader}>
                  <div>
                    <h3 className={styles.statusCardName}>{b.name}</h3>
                    <p className={styles.statusCardMeta}>
                      via {b.session?.sessionName} · {new Date(b.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[b.status.toLowerCase()]}`}>
                    {b.status}
                  </span>
                </div>

                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${getProgress(b)}%` }}
                  />
                </div>

                <div className={styles.statusCardStats}>
                  <div>Terkirim: <span>{b.sentCount}</span></div>
                  <div>Gagal: <span>{b.failedCount}</span></div>
                  <div>Total: <span>{b.totalCount}</span></div>
                  <div>Progress: <span>{getProgress(b)}%</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tag Picker Modal */}
      <Modal isOpen={showTagModal} onClose={() => setShowTagModal(false)} title="Ambil Kontak berdasarkan Label">
        <div className={styles.tagGrid}>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.tagChip} ${selectedTags.includes(tag) ? styles.selected : ""}`}
              onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className={styles.tagModalActions}>
          <button className="btn btn-secondary" onClick={() => setShowTagModal(false)}>Batal</button>
          <button className="btn btn-primary" onClick={handleApplyTags} disabled={loadingTags}>
            {loadingTags ? "Memuat..." : "Terapkan"}
          </button>
        </div>
      </Modal>

      {/* Spintext Modal */}
      <Modal isOpen={showSpinModal} onClose={() => setShowSpinModal(false)} title="Spintext">
         <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Ketikkkan kata dan tekan enter untuk menambahkan kata</p>
         
         <div className={styles.spinInputArea}>
            <div className={styles.spinChips}>
               {spinWords.map((word, i) => (
                 <div key={i} className={styles.spinChip}>
                    {word} <X size={12} className={styles.spinChipX} onClick={() => setSpinWords(spinWords.filter((_, idx) => idx !== i))} />
                 </div>
               ))}
            </div>
            <input 
              className={styles.spinAddInput}
              placeholder="Pilihan kata..." 
              value={spinInput}
              onChange={(e) => setSpinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSpinWord()}
            />
         </div>

         <div className={styles.tagModalActions}>
            <button className="btn btn-primary" style={{ background: '#0a9a7a', border: 'none', width: '100%' }} onClick={applySpintext}>
               Tambah Spintext
            </button>
         </div>
      </Modal>
    </div>
  );
}
