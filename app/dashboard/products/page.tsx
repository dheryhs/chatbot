"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Pencil, Trash2, Search, Info } from "lucide-react";
import styles from "./products.module.css";
import { Modal } from "@/components/ui/Modal";

interface ProductStock {
  warehouseId: string;
  stock: number;
  warehouse: {
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  isDigital: boolean;
  description: string | null;
  stocks: ProductStock[];
}

interface Warehouse {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const initialFormState = {
    name: "",
    sku: "",
    price: 0,
    isDigital: false,
    description: "",
    stocks: {} as Record<string, number>,
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    try {
      const [pRes, wRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/warehouses")
      ]);
      const pData = await pRes.json();
      const wData = await wRes.json();
      
      if (Array.isArray(pData)) setProducts(pData);
      if (Array.isArray(wData)) setWarehouses(wData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleEdit = (p: Product) => {
    setEditingId(p.id);
    const stockMap: Record<string, number> = {};
    p.stocks.forEach(s => {
      stockMap[s.warehouseId] = s.stock;
    });

    setFormData({
      name: p.name,
      sku: p.sku || "",
      price: p.price,
      isDigital: p.isDigital,
      description: p.description || "",
      stocks: stockMap,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Yakin ingin menghapus produk ini?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan produk");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalStock = (p: Product) => {
    return p.stocks.reduce((acc, curr) => acc + curr.stock, 0);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Produk</h1>
          <p className={styles.subtitle}>Kelola katalog produk. Nama, SKU, harga, dan stok tiap gudang.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={20} /> Tambah Produk
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
         <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
           <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
           <input 
              type="text" 
              placeholder="Cari produk atau SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: "40px" }}
           />
         </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px" }}>Memuat katalog produk...</div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} strokeWidth={1} style={{ marginBottom: "16px", opacity: 0.5 }} />
          <p>Katalog masih kosong. Klik "+ Tambah Produk" untuk mulai.</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Tipe</th>
                <th style={{ textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.productInfo}>
                      <span className={styles.productName}>{p.name}</span>
                      <span className={styles.productSku}>{p.sku || "Tanpa SKU"}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.price}>
                      Rp {p.price.toLocaleString("id-ID")}
                    </span>
                  </td>
                  <td>
                    <div className={styles.stockBadge}>
                      {getTotalStock(p)}
                    </div>
                    {p.stocks.length > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                            {p.stocks.map(s => `${s.warehouse.name}: ${s.stock}`).join(' | ')}
                        </div>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.typeBadge} ${p.isDigital ? styles.digitalBadge : ""}`}>
                      {p.isDigital ? "Digital" : "Fisik"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button className={styles.actionBtn} onClick={() => handleEdit(p)}>
                        <Pencil size={18} />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(p.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Produk" : "Tambah Produk"}
      >
        <p className={styles.modalSubtitle}>
          Buat produk baru untuk katalog dan stok.
        </p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.toggleGroup}>
            <div className={styles.toggleLabel}>
              <h4>Produk Digital</h4>
              <p>Produk fisik dengan stok gudang.</p>
            </div>
            <label className={styles.switch}>
              <input 
                type="checkbox" 
                checked={formData.isDigital}
                onChange={(e) => setFormData({ ...formData, isDigital: e.target.checked })}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className="input-group">
            <label>Nama Produk</label>
            <input
              type="text"
              required
              placeholder="e.g. Laptop X"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>SKU (opsional, unik)</label>
            <input
              type="text"
              placeholder="e.g. LP-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label>Harga (Rp)</label>
            <input
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
            />
          </div>

          {!formData.isDigital && warehouses.length > 0 && (
            <div className="input-group">
              <label>Stok per Gudang</label>
              <div className={styles.stockGrid}>
                {warehouses.map(w => (
                  <div key={w.id} className={styles.stockInput}>
                    <label>{w.name}</label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.stocks[w.id] || 0}
                      onChange={(e) => {
                        const newStocks = { ...formData.stocks };
                        newStocks[w.id] = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, stocks: newStocks });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!formData.isDigital && warehouses.length === 0 && (
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Info size={16} color="orange" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Belum ada gudang. Buat gudang di menu Warehouses untuk mengatur stok.</span>
              </div>
          )}

          <div className="input-group">
            <label>Deskripsi (opsional)</label>
            <textarea
              style={{ minHeight: "80px", width: "100%" }}
              placeholder="Deskripsi produk..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Buat Produk"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
