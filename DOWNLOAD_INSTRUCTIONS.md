# 📦 CARA DOWNLOAD CYBER-SENTINEL

## File Archive Sudah Siap!

**Lokasi**: `/app/cyber-sentinel-complete.tar.gz`
**Size**: 256 KB
**Total Files**: 96 files
**MD5**: `e74e7e4601a26ce827b253832242ffda`

---

## 🔽 CARA 1: Download via VS Code View (Termudah)

1. **Buka VS Code View** di Emergent:
   - Klik icon VS Code di interface Emergent
   
2. **Navigate ke file**:
   - Cari folder `/app`
   - Klik file `cyber-sentinel-complete.tar.gz`
   
3. **Download**:
   - Klik kanan pada file → **Download**
   - Atau klik icon download di toolbar

---

## 🔽 CARA 2: Download via SCP (Dari Komputer Anda)

Jika Anda punya akses SSH ke Emergent container:

```bash
scp user@emergent-host:/app/cyber-sentinel-complete.tar.gz ~/Downloads/
```

---

## 🔽 CARA 3: Download via Curl/Wget (Jika Ada URL)

Jika file di-serve via HTTP:

```bash
curl -O https://your-emergent-url/cyber-sentinel-complete.tar.gz
# atau
wget https://your-emergent-url/cyber-sentinel-complete.tar.gz
```

---

## 📂 Isi Archive

```
cyber-sentinel-complete.tar.gz
├── backend/
│   ├── server.py              # Main FastAPI app
│   ├── models.py              # Pydantic models
│   ├── auth.py                # JWT authentication
│   ├── monitoring_service.py  # Monitoring logic (HTTPS, Socket, UDP)
│   ├── email_service.py       # SMTP Gmail notifications
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Environment variables (UPDATE INI!)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── MonitorsPage.js
│   │   │   └── HistoryPage.js
│   │   ├── components/
│   │   │   ├── Layout.js
│   │   │   ├── MonitorCard.js
│   │   │   ├── MonitorDialog.js
│   │   │   └── ui/           # Shadcn UI components
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   ├── public/
│   ├── package.json           # Node dependencies
│   ├── tailwind.config.js
│   └── .env                   # Frontend env (UPDATE INI!)
│
├── UDP_MONITORING_GUIDE.md    # Complete UDP monitoring guide
├── DEPLOYMENT_GUIDE.txt       # Step-by-step deployment
└── README.md                  # Project overview
```

---

## ✅ Setelah Download

### 1. Verify Archive
```bash
# Extract untuk verify
tar -tzf cyber-sentinel-complete.tar.gz

# Check MD5
md5sum cyber-sentinel-complete.tar.gz
# Should match: e74e7e4601a26ce827b253832242ffda
```

### 2. Extract
```bash
tar -xzf cyber-sentinel-complete.tar.gz
cd cyber-sentinel-complete/
```

### 3. Read Documentation
```bash
cat DEPLOYMENT_GUIDE.txt
cat UDP_MONITORING_GUIDE.md
```

### 4. Deploy ke VPS
Ikuti instruksi lengkap di **DEPLOYMENT_GUIDE.txt** untuk:
- Setup backend (Python + FastAPI)
- Setup frontend (React + build)
- Configure Nginx
- Setup SSL (certbot)
- Systemd service
- MongoDB

---

## 🚀 Quick Deploy Commands

Jika sudah di VPS:

```bash
# Upload archive
scp cyber-sentinel-complete.tar.gz root@mon.osi.my.id:/tmp/

# SSH ke VPS
ssh root@mon.osi.my.id

# Extract
cd /home
tar -xzf /tmp/cyber-sentinel-complete.tar.gz

# Follow DEPLOYMENT_GUIDE.txt untuk setup lengkap
```

---

## ⚠️ PENTING - File yang Harus Diupdate

Sebelum deploy, WAJIB update file berikut:

### 1. `/backend/.env`
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=cyber_sentinel_prod
CORS_ORIGINS=https://mon.osi.my.id        # ← GANTI domain Anda
JWT_SECRET=YOUR-SUPER-SECRET-KEY-HERE     # ← GANTI dengan random string
GMAIL_USER=banjarmasinais@gmail.com
GMAIL_APP_PASSWORD=xjvpouyymnmpstoc
NOTIFICATION_EMAIL=afif@ppns.ac.id
```

### 2. `/frontend/.env`
```env
REACT_APP_BACKEND_URL=https://mon.osi.my.id  # ← GANTI domain Anda
```

---

## 🔧 Tech Stack

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React 19
- **Database**: MongoDB 7.0
- **Scheduler**: APScheduler (30-minute intervals)
- **Email**: SMTP Gmail via aiosmtplib
- **UI**: Shadcn UI + Tailwind CSS
- **Charts**: Recharts

---

## 📊 Features Included

✅ JWT Authentication
✅ HTTPS Website Monitoring
✅ Socket (TCP) Monitoring
✅ UDP Activity Monitoring (localhost)
✅ Email Notifications
✅ Dashboard with Charts
✅ History/Logs
✅ Auto monitoring every 30 minutes
✅ Dark mode design (Cyber-Sentinel theme)

---

## 📞 Support

Jika ada pertanyaan tentang:
- Deployment → Lihat `DEPLOYMENT_GUIDE.txt`
- UDP Monitoring → Lihat `UDP_MONITORING_GUIDE.md`
- General → Lihat `README.md`

---

## 🎉 Next Steps

1. ✅ Download archive
2. ✅ Verify MD5 checksum
3. ✅ Extract files
4. ✅ Update .env files
5. ✅ Deploy ke VPS (ikuti DEPLOYMENT_GUIDE.txt)
6. ✅ Test aplikasi
7. ✅ Setup monitoring pertama
8. ✅ Verify email notifications

**Happy Monitoring! 🚀**

Domain: https://mon.osi.my.id
Email Alerts: afif@ppns.ac.id
