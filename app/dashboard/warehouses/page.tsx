"use client";

import { useState, useEffect } from "react";
import { Plus, Warehouse, Pencil, Trash2, MapPin, Mail } from "lucide-react";
import styles from "./warehouses.module.css";
import { Modal } from "@/components/ui/Modal";

interface WarehouseData {
  id: string;
  name: string;
  location: string | null;
  postalCode: string | null;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState = {
    name: "",
    location: "",
    postalCode: "",
  };
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("/api/warehouses");
      const data = await res.json();
      if (Array.isArray(data)) setWarehouses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleEdit = (w: WarehouseData) => {
    setEditingId(w.id);
    setFormData({
      name: w.name,
      location: w.location || "",
      postalCode: w.postalCode || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus gudang ini? Semua stok di gudang ini akan ikut terhapus.")) return;
    
    try {
      const res = await fetch(`/api/warehouses/${id}`, { method: "DELETE" });
      if (res.ok) fetchWarehouses();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? `/api/warehouses/${editingId}` : "/api/warehouses";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchWarehouses();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gudang</h1>
          <p className={styles.subtitle}>Kelola daftar gudang untuk stok produk. Nama, lokasi, dan kode pos bisa diedit.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={20} /> Tambah Gudang
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px" }}>Memuat gudang...</div>
      ) : warehouses.length === 0 ? (
        <div className={styles.emptyState}>
          <Warehouse size={48} strokeWidth={1} style={{ marginBottom: "16px" }} />
          <p>Belum ada gudang. Klik tombol "+ Tambah Gudang" untuk membuat.</p>
        </div>
      ) : (
        <div className={styles.warehouseGrid}>
          {warehouses.map((w) => (
            <div key={w.id} className={styles.warehouseCard}>
              <div className={styles.warehouseInfo}>
                <h3>{w.name}</h3>
                <div className={styles.warehouseMeta}>
                  {w.location || "Lokasi tdk diatur"} {w.postalCode && `· ${w.postalCode}`}
                </div>
              </div>
              <div className={styles.cardActions}>
                <button className={styles.editBtn} onClick={() => handleEdit(w)}>
                  <Pencil size={16} /> Edit
                </button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(w.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Gudang" : "Tambah Gudang"}
      >
        <p className={styles.modalSubtitle}>
          {editingId ? "Update informasi gudang." : "Buat gudang baru untuk manajemen stok."}
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className="input-group">
            <label>Nama Gudang</label>
            <input
              type="text"
              required
              placeholder="e.g. Gudang Utama"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Lokasi (Kota/Alamat)</label>
            <input
              type="text"
              placeholder="e.g. Jakarta Selatan"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Kode Pos</label>
            <input
              type="text"
              placeholder="e.g. 12345"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Gudang"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
