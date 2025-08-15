# 🚰 LST Faucet - Nostaljik Kripto Musluğu

Base ağı üzerinde çalışan LST token musluk sitesi. Nostaljik tasarım ile kullanıcıların her saat başı LST token kazanmasını sağlar.

## ✨ Özellikler

- 🎨 **Nostaljik Tasarım** - Eski musluk sitelerinin görünümü
- 🔒 **Güvenlik** - reCAPTCHA doğrulama ve rate limiting
- ⏰ **Cooldown Sistemi** - 1 saatlik bekleme süresi
- 📊 **İstatistikler** - Detaylı faucet istatistikleri
- 🔗 **Base Ağı** - Base mainnet üzerinde çalışır
- 📱 **Responsive** - Mobil uyumlu tasarım

## 🚀 Kurulum

### Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn
- Base ağı cüzdanı ve LST token bakiyesi

### 1. Projeyi İndirin

```bash
git clone <repository-url>
cd lst-faucet
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Konfigürasyon

`.env` dosyasını oluşturun:

```bash
cp env.example .env
```

`.env` dosyasını düzenleyin:

```env
# Blockchain Configuration
FAUCET_ADDRESS=YOUR_FAUCET_ADDRESS_HERE
FAUCET_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
TOKEN_CONTRACT_ADDRESS=YOUR_LST_TOKEN_CONTRACT_ADDRESS_HERE

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY_HERE
RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_SECRET_KEY_HERE
```

### 4. reCAPTCHA Kurulumu

1. [Google reCAPTCHA](https://www.google.com/recaptcha/admin) sitesine gidin
2. Yeni site kaydı oluşturun
3. Site key ve secret key'i `.env` dosyasına ekleyin

### 5. Çalıştırma

Development modunda:
```bash
npm run dev
```

Production modunda:
```bash
npm start
```

Site `http://localhost:3000` adresinde çalışacaktır.

## 📁 Proje Yapısı

```
lst-faucet/
├── frontend/           # Frontend dosyaları
│   ├── index.html     # Ana sayfa
│   ├── style.css      # Stil dosyası
│   └── script.js      # JavaScript
├── backend/           # Backend dosyaları
│   ├── server.js      # Ana server
│   ├── routes/        # API route'ları
│   └── services/      # İş mantığı
├── config/           # Konfigürasyon
├── data/             # Veritabanı dosyaları
└── package.json      # Proje bağımlılıkları
```

## 🔧 Konfigürasyon

### Faucet Ayarları

- `CLAIM_AMOUNT`: Her claim'de verilecek LST miktarı (wei cinsinden)
- `COOLDOWN_HOURS`: Claim'ler arası bekleme süresi
- `MAX_CLAIMS_PER_IP`: IP başına maksimum claim sayısı

### Blockchain Ayarları

- `NETWORK_ID`: Base mainnet = 8453
- `RPC_URL`: Base ağı RPC endpoint'i
- `FAUCET_ADDRESS`: Musluk cüzdan adresi
- `TOKEN_CONTRACT_ADDRESS`: LST token contract adresi

## 🛡️ Güvenlik

- **reCAPTCHA**: Bot koruması
- **Rate Limiting**: IP bazlı istek sınırlaması
- **Address Validation**: ETH adres doğrulama
- **Cooldown**: Spam koruması

## 📊 API Endpoints

### Faucet Endpoints

- `POST /api/faucet/check-eligibility` - Claim uygunluğunu kontrol et
- `POST /api/faucet/claim` - LST token claim et
- `GET /api/faucet/stats` - Faucet istatistikleri
- `GET /api/faucet/recent-claims` - Son claim'ler

### Blockchain Endpoints

- `GET /api/blockchain/info` - Blockchain bilgileri
- `GET /api/blockchain/balance` - Faucet bakiyesi
- `GET /api/blockchain/tx/:txHash` - İşlem durumu
- `GET /api/blockchain/gas-price` - Gas fiyatı

## 🎨 Özelleştirme

### Tasarım Değişiklikleri

`frontend/style.css` dosyasını düzenleyerek:
- Renk şeması
- Font stilleri
- Animasyonlar
- Responsive tasarım

### Arkaplan Resmi

`frontend/index.html` dosyasında:
```html
<body style="background-image: url('your-image.jpg');">
```

### Token Miktarı

`config/config.js` dosyasında:
```javascript
claimAmount: '10000000000000000000' // 10 LST
```

## 🚀 Deployment

### Vercel (Frontend)

1. Vercel hesabı oluşturun
2. Projeyi GitHub'a yükleyin
3. Vercel'de yeni proje oluşturun
4. Environment variables'ları ayarlayın

### Railway/Heroku (Backend)

1. Railway/Heroku hesabı oluşturun
2. Projeyi bağlayın
3. Environment variables'ları ayarlayın
4. Deploy edin

### VPS

1. Ubuntu server kurun
2. Node.js ve PM2 yükleyin
3. Projeyi klonlayın
4. PM2 ile çalıştırın

```bash
npm install -g pm2
pm2 start backend/server.js --name "lst-faucet"
pm2 startup
pm2 save
```

## 📝 Lisans

MIT License

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Pull request gönderin

## 📞 Destek

Sorularınız için:
- GitHub Issues
- Email: support@example.com

## ⚠️ Uyarılar

- Private key'leri güvenli saklayın
- Production'da HTTPS kullanın
- Düzenli backup alın
- Rate limiting ayarlarını kontrol edin

---

**LST Faucet** - Nostaljik kripto deneyimi! 🚰✨



