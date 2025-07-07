# 🏨 SeekTinys

**SeekTinys**, kullanıcıların otel arayıp rezervasyon yapabildiği ve otellere yorum bırakabildiği modern bir otel rezervasyon platformudur.

## ✨ Özellikler

- 🏠 Otel listeleme ve filtreleme  
- 📆 Müsaitlik takvimi ile rezervasyon yapma  
- 📸 Otel fotoğraflarını görüntüleme ve yükleme  
- ⭐ Kullanıcıların otellere puan ve yorum bırakması  
- 👤 Kullanıcı kayıt/giriş sistemi (JWT ile kimlik doğrulama)  
- 🧾 Admin paneli ile otel ve rezervasyon yönetimi  
- 💳 Ödeme geçmişi ve rezervasyon durumu takibi  

## 🛠️ Teknolojiler

- **Backend**: Node.js, Express.js, Sequelize ORM  
- **Frontend**: HTML, CSS, JavaScript, EJS  
- **Veritabanı**: MySQL  
- **Dosya Yükleme**: Multer  
- **Kimlik Doğrulama**: JSON Web Token (JWT)  
- **Veri kontrolü için**: SQL Trigger ve Constraint’ler

## 🚀 Kurulum

1. Bu repoyu klonlayın:
```
git clone https://github.com/SevimAkdeniz/SeekTinys.git
cd SeekTinys
```

2. Gerekli bağımlılıkları yükleyin:
```
npm install
```

3. `.env` dosyasını oluşturun ve aşağıdakileri girin:
```
DB_NAME=seek_tinys
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

4. MySQL üzerinde veritabanını oluşturun. Sequelize kullanılsa da migration kullanılmaz, tablolar manuel oluşturulmalıdır.

5. Uygulamayı başlatın:
```
npm start
```

## 👥 Proje Ekibi ve Görev Dağılımı

- **Sevim Akdeniz** — *Full Stack Developer & Proje Lideri*  
  Görev: Backend geliştirme, algoritma tasarımı, kullanıcı yönetimi

- **Nehir Karabulut** — *Frontend Developer*  
  Görev: Arayüz tasarımı, responsive yapı

- **Zeynep Arda Yıldız** — *Veritabanı Uzmanı*  
  Görev: MySQL şema tasarımı ve veri ilişkileri yönetimi

## 👤 Geliştirici

**Sevim Akdeniz**  
Full Stack Developer  
[GitHub Profilim](https://github.com/SevimAkdeniz)

---

Bu proje, otel rezervasyon sistemi üzerine ekip çalışması olarak geliştirilmiştir.
