"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Users, Search, Download, Trash2, Tag, Phone, Share2, Check, Pencil, X } from "lucide-react";
import styles from "./contacts.module.css";
import { Modal } from "@/components/ui/Modal";

interface Contact {
  id: string;
  name: string | null;
  phoneNumber: string;
  jid?: string;
  email?: string;
  source?: string;
  note?: string;
  tags: string[];
  productLabel?: string;
  createdAt: string;
}

interface WAContact {
  jid: string;
  name: string | null;
  phoneNumber: string;
}

interface WASession {
  id: string;
  sessionName: string;
  wahaSessionId: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  // State Checklist & Bulk
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [bulkUpdateForm, setBulkUpdateForm] = useState({ tags: "", productLabel: "" });

  // State Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset pagination on search
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // Inline edit state
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [editingTagsValue, setEditingTagsValue] = useState("");
  const tagsInputRef = useRef<HTMLInputElement>(null);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  
  const initialFormState = {
    name: "",
    phoneNumber: "",
    jid: "",
    email: "",
    source: "Manual",
    tags: "",
    note: "",
    productLabel: ""
  };
  const [formData, setFormData] = useState(initialFormState);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sessions, setSessions] = useState<WASession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [waContacts, setWaContacts] = useState<WAContact[]>([]);
  const [selectedWAContacts, setSelectedWAContacts] = useState<Set<string>>(new Set());
  const [importLoading, setImportLoading] = useState(false);
  const [fetchingContacts, setFetchingContacts] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      const data = await res.json();
      if (Array.isArray(data)) setContacts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data.filter((s: WASession) => s.status === "WORKING"));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchSessions();
    fetchProducts();
  }, []);

  // Focus input when editing tags
  useEffect(() => {
    if (editingTagsId && tagsInputRef.current) {
      tagsInputRef.current.focus();
    }
  }, [editingTagsId]);

  // ---- Inline Tag Edit ----
  const startEditTags = (contact: Contact) => {
    setEditingTagsId(contact.id);
    setEditingTagsValue(contact.tags.join(", "));
  };

  const saveInlineTags = async (contactId: string) => {
    const newTags = editingTagsValue
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      // Optimistic update
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, tags: newTags } : c))
      );
    } catch (e) {
      console.error(e);
    }
    setEditingTagsId(null);
  };

  const handleTagsKeyDown = (e: React.KeyboardEvent, contactId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveInlineTags(contactId);
    }
    if (e.key === "Escape") {
      setEditingTagsId(null);
    }
  };

  // ---- Inline Product Label ----
  const saveProductLabel = async (contactId: string, label: string) => {
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productLabel: label || null }),
      });
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, productLabel: label || undefined } : c))
      );
    } catch (e) {
      console.error(e);
    }
  };

  // ---- WA Import ----
  const handleFetchWAContacts = async (sessionId: string) => {
    if (!sessionId) return;
    setFetchingContacts(true);
    setWaContacts([]);
    try {
      const res = await fetch(`/api/contacts/import?sessionId=${sessionId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setWaContacts(data);
      } else {
        alert(data.error || "Failed to fetch contacts");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetchingContacts(false);
    }
  };

  const handleOpenAddContact = () => {
    setEditingContactId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setFormData({
      name: contact.name || "",
      phoneNumber: contact.phoneNumber,
      jid: contact.jid || "",
      email: contact.email || "",
      source: contact.source || "Manual",
      tags: contact.tags ? contact.tags.join(", ") : "",
      note: contact.note || "",
      productLabel: contact.productLabel || ""
    });
    setIsModalOpen(true);
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kontak ini?")) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (res.ok) fetchContacts();
      else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus kontak");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t),
      };

      const url = editingContactId ? `/api/contacts/${editingContactId}` : "/api/contacts";
      const method = editingContactId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setEditingContactId(null);
        fetchContacts();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save contact");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleImportSubmit = async () => {
    if (selectedWAContacts.size === 0) return;
    setImportLoading(true);
    try {
      const contactsToImport = waContacts.filter((c) => selectedWAContacts.has(c.jid));
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: contactsToImport }),
      });
      if (res.ok) {
        setIsImportModalOpen(false);
        setWaContacts([]);
        setSelectedWAContacts(new Set());
        setSelectedSessionId("");
        fetchContacts();
      } else {
        const data = await res.json();
        alert(data.error || "Import failed");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setImportLoading(false);
    }
  };

  const toggleWAContact = (jid: string) => {
    const next = new Set(selectedWAContacts);
    if (next.has(jid)) next.delete(jid);
    else next.add(jid);
    setSelectedWAContacts(next);
  };

  const toggleSelectAll = () => {
    if (selectedWAContacts.size === waContacts.length) {
      setSelectedWAContacts(new Set());
    } else {
      setSelectedWAContacts(new Set(waContacts.map((c) => c.jid)));
    }
  };

  const exportToCSV = (contactList: any[], filename: string) => {
    if (contactList.length === 0) return;
    const headers = ["Name", "Phone", "JID", "Email", "Source", "Labels", "Product Label", "Notes"];
    const rows = contactList.map((c) => [
      c.name || "",
      c.phoneNumber || "",
      c.jid || "",
      c.email || "",
      c.source || "",
      Array.isArray(c.tags) ? c.tags.join("; ") : "",
      c.productLabel || "",
      c.note || "",
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val: string) => `"${val.toString().replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkExport = () => {
    const selected = contacts.filter((c) => selectedContactIds.has(c.id));
    exportToCSV(selected, "contacts_database_selected");
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Yakin ingin menghapus ${selectedContactIds.size} kontak?`)) return;
    try {
      const res = await fetch("/api/contacts/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedContactIds) }),
      });
      if (res.ok) {
        setSelectedContactIds(new Set());
        fetchContacts();
      } else alert("Gagal menghapus secara massal");
    } catch (e) { console.error(e); }
  };

  const handleBulkUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates: any = {};
      const newTags = bulkUpdateForm.tags.split(",").map(t => t.trim()).filter(Boolean);
      if (newTags.length > 0) updates.tags = newTags;
      if (bulkUpdateForm.productLabel) updates.productLabel = bulkUpdateForm.productLabel;

      if (Object.keys(updates).length === 0) return alert("Pilih minimal satu hal yang diubah.");

      const res = await fetch("/api/contacts/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedContactIds), ...updates }),
      });
      if (res.ok) {
        setSelectedContactIds(new Set());
        setIsBulkUpdateModalOpen(false);
        setBulkUpdateForm({ tags: "", productLabel: "" });
        fetchContacts();
      } else alert("Gagal memperbarui massal");
    } catch (e) { console.error(e); }
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phoneNumber.includes(searchTerm) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.productLabel?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredContacts.length / pageSize);
  const paginatedContacts = filteredContacts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllFilteredSelected = filteredContacts.length > 0 && selectedContactIds.size === filteredContacts.length;
  const toggleSelectAllContacts = () => {
      if (isAllFilteredSelected) setSelectedContactIds(new Set());
      else setSelectedContactIds(new Set(filteredContacts.map(c => c.id)));
  };


  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Kontak</h1>
          <p className={styles.subtitle}>Kelola kontak pelanggan. Satu profil</p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(true)}>
            <Download size={18} /> Import dari Session
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddContact}>
            <Plus size={20} /> Tambah Kontak
          </button>
        </div>
      </div>

      <div className={styles.toolbar} style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: '1rem' }}>
        <div className={styles.searchBar} style={{ flex: 1, maxWidth: "300px" }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Cari nama, phone, email, tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary">All</button>
        <button
          className="btn btn-secondary"
          onClick={() => exportToCSV(filteredContacts, "contacts_database_semua")}
          disabled={filteredContacts.length === 0}
          title="Export CSV Semua"
        >
          <Share2 size={18} /> Export Semua
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedContactIds.size > 0 && (
        <div style={{ background: 'var(--primary)', color: '#000', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ fontWeight: 600 }}>{selectedContactIds.size} kontak dipilih</div>
           <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                 className="btn btn-sm" style={{ background: '#fff', color: '#000', border: '1px solid var(--border)' }}
                 onClick={handleBulkExport}
              >
                 <Share2 size={14} /> Export ({selectedContactIds.size})
              </button>
              <button 
                 className="btn btn-sm" style={{ background: '#fff', color: '#000', border: '1px solid var(--border)' }}
                 onClick={() => setIsBulkUpdateModalOpen(true)}
              >
                 <Pencil size={14} /> Bulk Update
              </button>
              <button 
                 className="btn btn-sm" style={{ background: '#ff4444', color: '#fff', border: 'none' }}
                 onClick={handleBulkDelete}
              >
                 <Trash2 size={14} /> Hapus Massal
              </button>
           </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: "1rem" }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: "center" }}>
                <input type="checkbox" checked={isAllFilteredSelected} onChange={toggleSelectAllContacts} style={{ width: 16, height: 16 }} />
              </th>
              <th>Name</th>
              <th>Phone</th>
              <th>JID</th>
              <th>Tags</th>
              <th>Product Label</th>
              <th>Source</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className={styles.emptyRow}>Memuat data...</td></tr>
            ) : (
              paginatedContacts.map((contact) => (
                <tr key={contact.id}>
                  <td style={{ textAlign: "center" }}>
                    <input 
                        type="checkbox" 
                        checked={selectedContactIds.has(contact.id)}
                        style={{ width: 16, height: 16 }}
                        onChange={(e) => {
                           const newSet = new Set(selectedContactIds);
                           if (e.target.checked) newSet.add(contact.id);
                           else newSet.delete(contact.id);
                           setSelectedContactIds(newSet);
                        }}
                    />
                  </td>
                  {/* NAME */}
                  <td>
                    <div className={styles.contactNameInfo}>
                      <div className={styles.avatar}>{contact.name?.charAt(0) || <Users size={14} />}</div>
                      <span>{contact.name || "Unnamed"}</span>
                    </div>
                  </td>

                  {/* PHONE */}
                  <td>
                    <div className={styles.phoneInfo}>
                      <Phone size={14} /> {contact.phoneNumber}
                    </div>
                  </td>

                  {/* JID */}
                  <td>{contact.jid || "-"}</td>

                  {/* TAGS — inline edit */}
                  <td>
                    {editingTagsId === contact.id ? (
                      <div className={styles.inlineTagEdit}>
                        <input
                          ref={tagsInputRef}
                          className={styles.inlineTagInput}
                          type="text"
                          value={editingTagsValue}
                          onChange={(e) => setEditingTagsValue(e.target.value)}
                          onBlur={() => saveInlineTags(contact.id)}
                          onKeyDown={(e) => handleTagsKeyDown(e, contact.id)}
                          placeholder="VIP, Premium, Promo"
                        />
                      </div>
                    ) : (
                      <div
                        className={styles.tagsCell}
                        onClick={() => startEditTags(contact)}
                        title="Klik untuk edit tags"
                      >
                        <div className={styles.tagsContainer}>
                          {contact.tags.length > 0 ? (
                            contact.tags.map((tag) => (
                              <span key={tag} className={styles.tagBadge}>{tag}</span>
                            ))
                          ) : (
                            <span className={styles.noTags}>No tags</span>
                          )}
                        </div>
                        <Pencil size={12} className={styles.inlineEditIcon} />
                      </div>
                    )}
                  </td>

                  {/* PRODUCT LABEL — inline dropdown */}
                  <td>
                    <select
                      className={styles.inlineSelect}
                      value={contact.productLabel || ""}
                      onChange={(e) => saveProductLabel(contact.id, e.target.value)}
                    >
                      <option value="">— Pilih —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </td>

                  {/* SOURCE */}
                  <td>{contact.source || "Manual"}</td>

                  {/* ACTIONS */}
                  <td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                      <button className={styles.actionBtn} onClick={() => handleEditContact(contact)} title="Edit Kontak">
                        <Pencil size={18} />
                      </button>
                      <button className={styles.actionBtn} onClick={() => handleDeleteContact(contact.id)} title="Hapus Kontak">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            {!loading && filteredContacts.length === 0 && (
              <tr><td colSpan={8} className={styles.emptyRow}>Belum ada kontak.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Rows per page:</span>
          <select 
            value={pageSize} 
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--secondary)', color: '#fff', border: '1px solid var(--border)' }}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
            Page {currentPage} of {totalPages || 1}
          </span>
          <button 
            className="btn btn-secondary btn-sm" 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)}
          >
            Previous
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            disabled={currentPage >= totalPages || totalPages === 0} 
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* MODAL: Bulk Update */}
      <Modal isOpen={isBulkUpdateModalOpen} onClose={() => setIsBulkUpdateModalOpen(false)} title="Update Massal">
        <form onSubmit={handleBulkUpdateSubmit} className={styles.form}>
           <div className="input-group">
            <label>Tags Baru (pisahkan dengan koma)</label>
            <input 
               type="text" 
               placeholder="VIP, Followup"
               value={bulkUpdateForm.tags}
               onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, tags: e.target.value })}
            />
            <small style={{ color: 'var(--muted-foreground)' }}>Akan menimpa tags yang ada. Kosongkan jika tidak mau mengubah tag.</small>
           </div>
           <div className="input-group" style={{ marginTop: '1rem' }}>
            <label>Ubah Product Label</label>
            <select
               value={bulkUpdateForm.productLabel}
               onChange={(e) => setBulkUpdateForm({ ...bulkUpdateForm, productLabel: e.target.value })}
               className={styles.select}
            >
               <option value="">— Biarkan / Jangan Ubah —</option>
               {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
           </div>
           <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsBulkUpdateModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">Simpan ({selectedContactIds.size} kontak)</button>
           </div>
        </form>
      </Modal>

      {/* MODAL: Tambah/Edit Kontak */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingContactId ? "Edit Kontak" : "Tambah Kontak"}>
        {!editingContactId && (
          <p style={{ marginBottom: "1rem", color: "#6b7280", fontSize: "0.875rem" }}>
            Buat kontak baru. Nomor akan dinormalisasi (62xxx).
          </p>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="input-group">
            <label>Nomor / Phone</label>
            <input
              type="text"
              placeholder="6281234567890"
              required
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              disabled={!!editingContactId}
              title={editingContactId ? "Nomor telepon tidak dapat diubah" : ""}
            />
          </div>
          <div className="input-group" style={{ marginTop: "1rem" }}>
            <label>JID (opsional)</label>
            <input
              type="text"
              placeholder="628xxx@s.whatsapp.net"
              value={formData.jid}
              onChange={(e) => setFormData({ ...formData, jid: e.target.value })}
            />
          </div>
          <div className="input-group" style={{ marginTop: "1rem" }}>
            <label>Nama (opsional)</label>
            <input
              type="text"
              placeholder="Nama kontak"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="input-group" style={{ marginTop: "1rem" }}>
            <label>Email (opsional)</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="input-group" style={{ marginTop: "1rem" }}>
            <label>Sumber</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className={styles.select}
            >
              <option value="Manual">Manual</option>
              <option value="Import">Import</option>
              <option value="API">API</option>
              <option value="WhatsApp Import">WhatsApp Import</option>
            </select>
          </div>
          <div className="input-group" style={{ marginTop: "1rem" }}>
            <label>Labels (opsional, pisahkan dengan koma)</label>
            <input
              type="text"
              placeholder="VIP, Prospek, Komplain"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>
          <div className="input-group" style={{ marginTop: "1rem" }}>
            <label>Product Label (opsional)</label>
            <select
              value={formData.productLabel}
              onChange={(e) => setFormData({ ...formData, productLabel: e.target.value })}
              className={styles.select}
            >
              <option value="">— Tidak ada —</option>
              {products.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="input-group" style={{ marginTop: "1rem" }}>
            <label>Catatan (opsional)</label>
            <textarea
              placeholder="Catatan..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              className={styles.textarea}
            />
          </div>
          <div className={styles.modalActions} style={{ marginTop: "2rem" }}>
            <button type="submit" className="btn btn-primary" style={{ backgroundColor: "#000", color: "#fff" }}>
              {editingContactId ? "Simpan Perubahan" : "Buat Kontak"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Import dari Session */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import dari Session">
        <p style={{ marginBottom: "1rem", color: "#6b7280", fontSize: "0.875rem" }}>
          Pilih WA session, muat kontak dari GO WA, lalu pilih kontak yang ingin diimpor.
        </p>
        <div className="input-group" style={{ marginBottom: "1rem" }}>
          <select
            value={selectedSessionId}
            onChange={(e) => {
              setSelectedSessionId(e.target.value);
              handleFetchWAContacts(e.target.value);
            }}
            className={styles.select}
          >
            <option value="">Pilih WA Session</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.wahaSessionId}>
                {s.sessionName} ({s.wahaSessionId})
              </option>
            ))}
          </select>
        </div>

        {fetchingContacts && <div style={{ textAlign: "center", padding: "1rem" }}>Mengambil kontak dari WhatsApp...</div>}

        {waContacts.length > 0 && (
          <>
            <div className={styles.waContactsHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  checked={selectedWAContacts.size === waContacts.length}
                  onChange={toggleSelectAll}
                />
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Select All ({waContacts.length})</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => exportToCSV(waContacts.filter((c) => selectedWAContacts.has(c.jid)), "wa_contacts_export")}
                disabled={selectedWAContacts.size === 0}
              >
                <Download size={14} /> CSV
              </button>
            </div>
            <div className={styles.waContactsList}>
              {waContacts.map((c) => (
                <div key={c.jid} className={styles.waContactItem} onClick={() => toggleWAContact(c.jid)}>
                  <input type="checkbox" checked={selectedWAContacts.has(c.jid)} readOnly />
                  <div className={styles.waContactInfo}>
                    <p className={styles.waContactName}>{c.name || "Unnamed"}</p>
                    <p className={styles.waContactPhone}>{c.phoneNumber}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.modalActions} style={{ marginTop: "1.5rem" }}>
              <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(false)}>Batal</button>
              <button
                className="btn btn-primary"
                onClick={handleImportSubmit}
                disabled={selectedWAContacts.size === 0 || importLoading}
                style={{ backgroundColor: selectedWAContacts.size > 0 ? "#000" : "#d1d5db", color: "#fff" }}
              >
                {importLoading ? "Mengimpor..." : `Import ${selectedWAContacts.size} kontak`}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
