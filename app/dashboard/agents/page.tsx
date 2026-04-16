"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Bot, ToggleLeft, ToggleRight, Trash2, Edit } from "lucide-react";
import styles from "./agents.module.css";
import { Modal } from "@/components/ui/Modal";

interface Agent {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string | null;
  welcomeMessage: string | null;
  isActive: boolean;
  session: {
    sessionName: string;
  } | null;
}

interface Session {
  id: string;
  sessionName: string;
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sessionId: "",
    description: "",
    systemPrompt: "",
    welcomeMessage: ""
  });

  const fetchData = async () => {
    try {
      const [agentsRes, sessionsRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/sessions")
      ]);
      const agentsData = await agentsRes.json();
      const sessionsData = await sessionsRes.json();
      
      if (Array.isArray(agentsData)) setAgents(agentsData);
      if (Array.isArray(sessionsData)) setSessions(sessionsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const newAgent = await res.json();
        setIsModalOpen(false);
        setFormData({ name: "", sessionId: "", description: "", systemPrompt: "", welcomeMessage: "" });
        // Navigate to the new agent's detail page
        router.push(`/dashboard/agents/${newAgent.id}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!window.confirm("Yakin ingin menghapus agent ini?")) return;
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else alert("Gagal menghapus agent.");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>AI Agents</h1>
          <p className={styles.subtitle}>Configure automated responses for your WhatsApp sessions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Create Agent
        </button>
      </div>

      <div className={styles.agentsGrid}>
        {agents.map((agent) => (
          <div key={agent.id} className="card">
            <div className={styles.agentHeader}>
              <div className={styles.agentAvatar}>
                <Bot size={24} />
              </div>
              <div className={styles.agentStatus}>
                {agent.isActive ? <ToggleRight className={styles.active} size={28} /> : <ToggleLeft size={28} />}
              </div>
            </div>

            <div className={styles.agentInfo}>
              <h3>{agent.name}</h3>
              <p className={styles.linkedSession}>
                Linked to: <strong>{agent.session?.sessionName || "No session"}</strong>
              </p>
              <p className={styles.desc}>{agent.description || "No description provided."}</p>
            </div>

            <div className={styles.agentMeta}>
              <div className={styles.metaItem}>
                <label>System Prompt</label>
                <div className={styles.promptPreview}>
                  {agent.systemPrompt ? agent.systemPrompt.substring(0, 80) + "..." : "Not configured yet"}
                </div>
              </div>
            </div>

            <div className={styles.agentActions}>
              <button
                className="btn btn-secondary"
                onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
              >
                <Edit size={16} /> Edit
              </button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(agent.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        <div className={styles.addAgentCard} onClick={() => setIsModalOpen(true)}>
          <Plus size={40} />
          <p>Add New Agent</p>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Agent"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="input-group">
            <label>Agent Name</label>
            <input 
              type="text" 
              required 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. CS Toko Herbal"
            />
          </div>
          <div className="input-group">
            <label>Description (opsional)</label>
            <textarea 
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Deskripsi singkat agent ini..."
            ></textarea>
          </div>
          <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create & Configure</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
