"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  RefreshCw, 
  Trash2, 
  Play, 
  Square,
  Link as LinkIcon,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  Loader2
} from "lucide-react";
import styles from "./sessions.module.css";
import { LinkWhatsAppModal } from "./LinkWhatsAppModal";

interface Session {
  id: string;
  sessionName: string;
  wahaSessionId: string;
  status: string;
  createdAt: string;
  me?: {
    id: string;
    pushName: string;
  } | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{name: string, id: string} | null>(null);
  
  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName) return;
    setAdding(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ sessionName: newSessionName }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewSessionName("");
        setIsAddModalOpen(false);
        fetchSessions();
        // Automatically open link modal for new session
        setActiveSession({ name: data.sessionName, id: data.wahaSessionId });
        setIsLinkModalOpen(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === "delete") {
         if (!confirm("Are you sure?")) return;
         await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      } else {
         await fetch(`/api/sessions/${id}/${action}`, { method: "POST" });
      }
      fetchSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const openLinkModal = (session: Session) => {
    setActiveSession({ name: session.sessionName, id: session.wahaSessionId });
    setIsLinkModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let className = styles.statusStopped;
    if (s === "working") className = styles.statusWorking;
    if (s === "scan_qr_code" || s === "starting") className = styles.statusPending;
    if (s === "failed") className = styles.statusFailed;
    
    return <span className={`${styles.statusBadge} ${className}`}>{status}</span>;
  };

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Session List</h1>
          <p className={styles.subtitle}>Manage your WhatsApp accounts and connections</p>
        </div>
        <button className={styles.addBtn} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          Add Session
        </button>
      </div>

      {/* Toolbar Section */}
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <div className={styles.filterDropdown}>
            <Filter size={14} />
            <span>All agents</span>
          </div>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input type="text" placeholder="Filter sessions" />
          </div>
        </div>
        <div className={styles.viewToggle}>
          <button 
            className={viewMode === "list" ? styles.activeView : ""} 
            onClick={() => setViewMode("list")}
          >
            <ListIcon size={18} />
          </button>
          <button 
            className={viewMode === "grid" ? styles.activeView : ""} 
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 className="animate-spin" />
          <p>Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Plus size={40} /></div>
          <h3>No sessions found</h3>
          <p>Create a session to start sending messages</p>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>Add your first session</button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Device ID</th>
                <th>Status / JID</th>
                <th>Created</th>
                <th className={styles.textRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.iconBox}>
                        <img src={`https://ui-avatars.com/api/?name=${session.sessionName}&background=random`} alt="" />
                      </div>
                      <span className={styles.sessionNameLabel}>{session.sessionName}</span>
                    </div>
                  </td>
                  <td>
                    <code className={styles.deviceId}>{session.wahaSessionId.substring(0, 12)}...</code>
                  </td>
                  <td>
                    <div className={styles.statusCell}>
                      {getStatusBadge(session.status)}
                      {session.me && <span className={styles.jid}>{session.me.id}</span>}
                    </div>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(session.createdAt).toLocaleDateString()}
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.rowActions}>
                      {session.status === "STOPPED" || session.status === "FAILED" ? (
                        <button onClick={() => handleAction(session.wahaSessionId, "start")} title="Start"><Play size={16} /></button>
                      ) : (
                        <button onClick={() => handleAction(session.wahaSessionId, "stop")} title="Stop"><Square size={16} /></button>
                      )}
                      
                      <button onClick={() => openLinkModal(session)} title="Link Account" className={styles.linkBtn}>
                        <LinkIcon size={16} />
                      </button>
                      
                      <button onClick={() => handleAction(session.wahaSessionId, "restart")} title="Restart"><RefreshCw size={16} /></button>
                      <button onClick={() => handleAction(session.wahaSessionId, "delete")} title="Delete" className={styles.deleteBtn}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Session Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
           <div className={styles.smallModal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Create New Session</h3>
                <button onClick={() => setIsAddModalOpen(false)}><XIcon/></button>
              </div>
              <form onSubmit={handleCreateSession} className={styles.modalBody}>
                <div className={styles.inputGroup}>
                  <label>Session Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="e.g. Sales Bot" 
                    value={newSessionName}
                    onChange={e => setNewSessionName(e.target.value)}
                  />
                  <p className={styles.inputHint}>Unique identifier for your WhatsApp connection.</p>
                </div>
                <div className={styles.modalActions}>
                   <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                   <button type="submit" className="btn btn-primary" disabled={adding || !newSessionName}>
                     {adding ? "Creating..." : "Create & Next"}
                   </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* WhatsApp Link Modal */}
      <LinkWhatsAppModal 
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        sessionName={activeSession?.name || ""}
        wahaSessionId={activeSession?.id || ""}
        onConnected={fetchSessions}
      />
    </div>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
