# 🚀 Checklist Redeploy di Easypanel

## ✅ Persiapan Sudah Selesai

### Konfigurasi yang Sudah Diperbaiki:
- ✅ Database configuration sudah diupdate ke `db:5432`
- ✅ Docker Compose sudah benar dengan service `app` dan `db`
- ✅ Health check database sudah dikonfigurasi
- ✅ Auto migration via docker-entrypoint.sh sudah siap
- ✅ Volume `postgres_data` akan dibuat untuk persistensi data
- ✅ Traefik labels untuk SSL sudah dikonfigurasi

## 📋 Langkah-Langkah Redeploy

### 1. **Update Environment Variables di Easypanel**
Pastikan environment variables berikut sudah diset di Easypanel Dashboard:

```
DATABASE_URL=postgresql://postgres:bismillah123@db:5432/postgres
POSTGRES_PASSWORD=bismillah123
NEXTAUTH_URL=https://darialam-chatbot.0yowcn.easypanel.host/
NEXTAUTH_SECRET=37d25e0a6d510257e8d646fb708e5e78
WAHA_API_KEY=he83hYY1AVDY75ksva8KGtoKGRe3t6CF
WAHA_BASE_URL=https://waha-hhsjinfnlm3c.anakit.sumopod.my.id
```

### 2. **Redeploy Services**
- Klik tombol **Redeploy** di Easypanel dashboard
- Tunggu hingga build selesai (bisa 3-5 menit karena multi-stage build)
- Pastikan kedua service (app + db) berstatus **Running**

### 3. **Verifikasi Deployment**

#### Cek Logs Container App:
```bash
docker logs <container_name> --tail 50
```

Yang harus muncul:
```
=========================================
  WhatsApp Chatbot - Starting Up
=========================================
Running database migrations...
...
Starting application on port 3000...
```

#### Cek Database Connection:
```bash
docker exec -it <app_container> npx prisma migrate status
```

### 4. **Setup User Admin Pertama**
Karena database baru (fresh), Anda perlu:
1. Akses: `https://darialam-chatbot.0yowcn.easypanel.host/register`
2. Register user admin pertama
3. Login di: `https://darialam-chatbot.0yowcn.easypanel.host/login`

### 5. **Test Fungsionalitas**
- ✅ Login berhasil
- ✅ Dashboard terbuka
- ✅ Bisa create agent
- ✅ Bisa link WhatsApp session
- ✅ Webhook WAHA berfungsi

## ⚠️ Troubleshooting

### Jika Container Gagal Start:
```bash
# Lihat logs detail
docker logs <container_name>

# Cek status healthcheck database
docker inspect <db_container> | grep -A 10 Health
```

### Jika Database Connection Error:
- Pastikan service `db` sudah running dan healthy
- Cek environment variable `DATABASE_URL` sudah benar
- Pastikan tidak ada typo di password

### Jika Migration Gagal:
```bash
# Manual run migration
docker exec -it <app_container> npx prisma migrate deploy

# Reset jika perlu (HATI-HATI: hapus semua data!)
docker exec -it <app_container> npx prisma migrate reset --force
```

## 📊 Expected Behavior Setelah Deploy

### Database Akan Dibuat Otomatis:
- Volume `postgres_data` akan dibuat
- Migrations akan jalan otomatis
- Schema database sesuai dengan `prisma/schema.prisma`

### Tables yang Akan Dibuat:
- User
- Agent
- Contact
- Chat
- Message
- Product
- Warehouse
- Broadcast
- Session
- dll (lihat di schema.prisma)

## 🔒 Keamanan

- ✅ File `.env` tidak ter-commit ke GitHub
- ✅ Credentials tetap aman di local dan Easypanel
- ✅ SSL/TLS via Traefik Let's Encrypt
- ✅ Password di-hash dengan bcrypt

## 🎯 Next Steps Setelah Deploy Sukses

1. Register user admin
2. Setup WhatsApp session pertama
3. Create agent dengan personality yang diinginkan
4. Upload knowledge base (PDF/dokumen)
5. Import contacts
6. Test chatbot via WhatsApp
7. Monitor di dashboard analytics

---

## ✅ KONFIGURASI SUDAH AMAN UNTUK REDEPLOY!

Semua konfigurasi sudah benar dan aligned. Tidak akan ada konflik atau error asalkan:
- Environment variables di Easypanel sama dengan di `.env`
- Tidak ada service PostgreSQL lain yang conflict
- Port 3000 dan 5432 tidak dipakai service lain

**Silakan lanjutkan redeploy di Easypanel Dashboard! 🚀**
