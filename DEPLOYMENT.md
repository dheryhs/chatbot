# Panduan Deployment ke VPS (Docker)

Dokumen ini menjelaskan langkah-langkah untuk memindahkan aplikasi WhatsApp Chatbot Anda ke VPS menggunakan Docker.

## Prasyarat
1. VPS dengan OS Linux (direkomendasikan Ubuntu 22.04 LTS atau lebih baru).
2. Domain yang sudah diarahkan ke IP VPS (untuk HTTPS/SSL).
3. Docker & Docker Compose sudah terinstal di VPS.

---

## Langkah 1: Persiapan di VPS
Hubungkan ke VPS Anda melalui SSH:
```bash
ssh root@ip-vps-anda
```

Instal Docker (jika belum ada):
```bash
# Update package list
sudo apt update
# Instal Docker
sudo apt install -y docker.io docker-compose
# Jalankan Docker
sudo systemctl start docker
sudo systemctl enable docker
```

---

## Langkah 2: Setup File Proyek
Buat direktori proyek di VPS:
```bash
mkdir ~/whatsapp-chatbot
cd ~/whatsapp-chatbot
```

Salin file berikut dari komputer lokal Anda ke VPS (bisa menggunakan `scp` atau copy-paste):
- `Dockerfile`
- `docker-compose.yml`
- `docker-entrypoint.sh`
- `next.config.ts`
- `package.json`
- `package-lock.json`
- Seluruh folder `app/`, `components/`, `lib/`, `prisma/`, `public/`

Atau lebih mudah jika Anda menggunakan Git:
```bash
git clone <url-repository-anda> .
```

---

## Langkah 3: Konfigurasi Environment Variables
Buat file `.env` di direktori proyek VPS:
```bash
nano .env
```

Isi dengan nilai berikut (sesuaikan dengan data Anda):
```env
# Database
POSTGRES_PASSWORD=bismillah123

# NextAuth
NEXTAUTH_URL=https://domain-anda.com
NEXTAUTH_SECRET=37d25e0a6d510257e8d646fb708e5e78

# WAHA (External)
WAHA_BASE_URL=https://waha-hhsjinfnlm3c.anakit.sumopod.my.id
WAHA_API_KEY=he83hYY1AVDY75ksva8KGtoKGRe3t6CF
```

---

## Langkah 4: Jalankan Aplikasi
Jalankan perintah berikut untuk membangun image dan menjalankan container:
```bash
docker-compose up -d --build
```

Periksa status container:
```bash
docker-compose ps
```

---

## Langkah 5: Reverse Proxy & SSL (Penting!)
Agar WhatsApp Webhook bisa mengirim pesan ke aplikasi Anda, Anda membutuhkan HTTPS. Cara termudah adalah menggunakan **Caddy**.

Instal Caddy:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Konfigurasi Caddy:
```bash
sudo nano /etc/caddy/Caddyfile
```

Isi dengan:
```caddy
domain-anda.com {
    reverse_proxy localhost:3000
}
```

Restart Caddy:
```bash
sudo systemctl restart caddy
```

Sekarang aplikasi Anda sudah bisa diakses di `https://domain-anda.com`.

---

## Tips Perawatan
- **Melihat Log**: `docker-compose logs -f app`
- **Update Aplikasi**: 
  ```bash
  git pull
  docker-compose up -d --build
  ```
- **Backup Database**:
  ```bash
  docker exec -t whatsapp_chatbot_db pg_dumpall -c -U postgres > dump_`date +%d-%m-%Y"_"%H_%M_%S`.sql
  ```
