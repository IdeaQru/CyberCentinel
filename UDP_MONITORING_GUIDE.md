# 📡 UDP Monitoring Guide - Cyber-Sentinel

## Deskripsi
UDP Monitoring di Cyber-Sentinel menggunakan **activity-based monitoring** untuk mendeteksi apakah UDP listener Anda masih menerima packet/data.

## Cara Kerja

### Metode Monitoring
Sistem menggunakan **socket statistics** (`/proc/net/udp`, `ss`, atau `netstat`) untuk:
1. Memverifikasi UDP socket sedang listening pada port yang ditentukan
2. Memonitor aktivitas packet yang diterima
3. Tracking perubahan aktivitas dari waktu ke waktu

### Logic Status

#### ✅ Status UP
UDP listener dianggap **UP** jika:
- Socket ditemukan listening pada port yang ditentukan
- Masih dalam threshold 30 menit sejak aktivitas terakhir

#### ❌ Status DOWN  
UDP listener dianggap **DOWN** jika:
- Socket tidak ditemukan pada port yang ditentukan
- Tidak ada perubahan aktivitas packet **lebih dari 30 menit**
- Error saat membaca socket statistics

### Threshold Timeout
- **30 menit** tanpa aktivitas = Status DOWN
- Email notification dikirim ke: **afif@ppns.ac.id**
- Notifikasi hanya dikirim **sekali** saat status berubah dari UP ke DOWN

---

## Cara Penggunaan

### 1. Tambah UDP Monitor

Di halaman **Monitors**, klik tombol **"Add Monitor"**:

```
Nama Monitor: Backend UDP Service
Tipe Monitor: UDP Reader (Listening)
Target: 127.0.0.1:3009
```

Format target: `host:port`
- Localhost: `127.0.0.1:3009` atau `0.0.0.0:3009`
- Remote: `192.168.1.100:8080` (belum fully supported untuk activity tracking)

### 2. Monitoring Otomatis

Setelah ditambahkan:
- ✅ Check pertama dilakukan segera (initial check)
- ⏰ Monitoring otomatis berjalan setiap **30 menit**
- 📊 Log disimpan untuk setiap check
- 📧 Email notification jika status DOWN

### 3. Manual Check

Anda bisa trigger manual check dengan:
- Klik tombol **"Check"** pada monitor card
- Atau via API: `POST /api/monitors/{monitor_id}/check`

---

## Technical Details

### Data yang Di-track

Setiap UDP monitor menyimpan:
```javascript
{
  "id": "uuid",
  "name": "UDP Service",
  "monitor_type": "udp",
  "target": "127.0.0.1:3009",
  "status": "up",  // up, down, pending
  "last_checked": "2026-01-29T17:18:44Z",
  "last_packet_count": 0,  // Connection count from ss
  "last_activity_time": "2026-01-29T17:18:44Z",
  "response_time": 10  // ms
}
```

### Monitoring Flow

```
1. Check jika socket listening (via /proc/net/udp)
2. Get statistics (via ss atau netstat)
3. Compare dengan last_packet_count
4. Jika berubah → Update last_activity_time
5. Jika tidak berubah → Check threshold
   - < 30 menit: Status UP (dengan warning)
   - > 30 menit: Status DOWN (kirim email)
```

---

## Contoh Use Cases

### Use Case 1: Monitor UDP Logger Service
```
Service: UDP log collector menerima logs dari multiple sources
Port: 127.0.0.1:514
Check: Apakah masih terima logs setiap 30 menit?
```

### Use Case 2: Monitor UDP Sensor Data Receiver
```
Service: IoT device mengirim sensor data via UDP
Port: 127.0.0.1:3009
Check: Apakah data sensor masih masuk?
```

### Use Case 3: Monitor UDP Game Server
```
Service: Game server menerima player connections
Port: 0.0.0.0:7777
Check: Apakah server masih terima connections?
```

---

## Troubleshooting

### Monitor Status Selalu PENDING
**Problem**: Monitor tidak pernah berubah dari pending
**Solution**: 
- Check apakah backend service running: `sudo systemctl status cyber-sentinel-backend`
- Check logs: `sudo journalctl -u cyber-sentinel-backend -f`

### Monitor Status DOWN padahal Service Berjalan
**Problem**: UDP listener aktif tapi status DOWN
**Possible Causes**:
1. Tidak ada packet yang masuk >30 menit
2. Socket bind ke interface lain (bukan 127.0.0.1)
3. Permission issue membaca /proc/net/udp

**Solution**:
```bash
# Check if socket exists
netstat -anu | grep YOUR_PORT

# Check UDP statistics
ss -u -n sport = YOUR_PORT

# Test send packet
echo "test" | nc -u -w1 127.0.0.1 YOUR_PORT
```

### False Positive (UP padahal seharusnya DOWN)
**Problem**: Service mati tapi status masih UP
**Explanation**: UDP adalah connectionless, jika socket masih listening tapi tidak process packet, masih dianggap UP sampai threshold tercapai.

---

## Limitations

1. **Localhost Only untuk Activity Tracking**
   - Remote UDP monitoring belum fully support activity detection
   - Remote host hanya basic connectivity check

2. **30 Menit Threshold Fixed**
   - Saat ini threshold hardcoded 30 menit
   - Future: Custom threshold per monitor

3. **Packet Count vs Activity**
   - System track connection count, bukan actual packet count
   - Lebih akurat untuk services yang maintain connections

---

## Best Practices

### ✅ DO
- Set nama monitor yang deskriptif (misal: "Syslog UDP Receiver")
- Test manual check setelah tambah monitor
- Monitor logs untuk verify deteksi aktivitas
- Gunakan port yang spesifik (bukan generic port)

### ❌ DON'T
- Jangan expect instant DOWN detection (perlu 30 menit)
- Jangan monitor ephemeral ports
- Jangan monitor port yang sangat high-traffic (performance impact)

---

## API Reference

### Create UDP Monitor
```bash
POST /api/monitors
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "My UDP Service",
  "monitor_type": "udp",
  "target": "127.0.0.1:3009"
}
```

### Manual Check
```bash
POST /api/monitors/{monitor_id}/check
Authorization: Bearer {token}
```

### Get Monitor Status
```bash
GET /api/monitors/{monitor_id}
Authorization: Bearer {token}
```

---

## Deployment Notes

### VPS Deployment
Untuk deployment di VPS, pastikan:
1. User `www-data` punya permission read `/proc/net/udp`
2. Command `ss` dan `netstat` tersedia
3. No firewall blocking internal localhost traffic

```bash
# Verify permissions
sudo -u www-data cat /proc/net/udp

# Verify commands available
which ss
which netstat
```

---

## Future Enhancements

- [ ] Custom timeout threshold per monitor
- [ ] Remote UDP activity monitoring
- [ ] Advanced packet statistics (actual count, bytes)
- [ ] Alert on sudden traffic drop
- [ ] Integration dengan UDP packet capture (tcpdump)

---

**Questions?** Check logs di:
- Backend: `sudo journalctl -u cyber-sentinel-backend -f`
- Email: `tail -f /var/log/mail.log`
