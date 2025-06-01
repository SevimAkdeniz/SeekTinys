const express = require('express');
const router = express.Router();
const Hotel = require('../../models/hotels');
const HotelImage = require('../../models/hotelImage');
const Reservation = require('../../models/reservation');
const moment = require('moment');
const { Op } = require("sequelize");


// Tüm özellik isimleri
const allFeatures = {
  has_pool: "Havuz",
  has_wifi: "Wi-Fi",
  has_parking: "Otopark",
  pet_friendly: "Evcil Hayvan Dostu",
  has_spa: "Spa",
  has_gym: "Spor Salonu",
  has_sea_view: "Deniz Manzarası",
  has_balcony: "Balkon",
  has_air_conditioning: "Klima",
  is_all_inclusive: "Her Şey Dahil"
};

// 📄 Otel Listeleme Sayfası

router.get('/hotels', async (req, res) => {
  try {
    const {
      location, minPrice, maxPrice,
      has_pool, has_wifi, has_parking, pet_friendly,
      has_spa, has_gym, has_sea_view,
      has_balcony, has_air_conditioning, is_all_inclusive,
      start_date, end_date
    } = req.query;

    // 1️⃣ Normal filtreler (konum, fiyat, özellikler)
    const whereClause = {};

    if (location) whereClause.location = { [Op.like]: `%${location}%` };
    if (minPrice) whereClause.price_per_night = { ...(whereClause.price_per_night || {}), [Op.gte]: parseInt(minPrice) };
    if (maxPrice) whereClause.price_per_night = { ...(whereClause.price_per_night || {}), [Op.lte]: parseInt(maxPrice) };

    if (has_pool === 'on') whereClause.has_pool = true;
    if (has_wifi === 'on') whereClause.has_wifi = true;
    if (has_parking === 'on') whereClause.has_parking = true;
    if (pet_friendly === 'on') whereClause.pet_friendly = true;
    if (has_spa === 'on') whereClause.has_spa = true;
    if (has_gym === 'on') whereClause.has_gym = true;
    if (has_sea_view === 'on') whereClause.has_sea_view = true;
    if (has_balcony === 'on') whereClause.has_balcony = true;
    if (has_air_conditioning === 'on') whereClause.has_air_conditioning = true;
    if (is_all_inclusive === 'on') whereClause.is_all_inclusive = true;

    // 2️⃣ İlk olarak tüm eşleşen otelleri çek
    let hotels = await Hotel.findAll({
      where: whereClause,
      include: [HotelImage]
    });
    if ((start_date && !end_date) || (!start_date && end_date)) {
      return res.status(400).send("Lütfen giriş ve çıkış tarihlerini birlikte girin.");
    }


    // 3️⃣ Eğer tarih girildiyse uygunluk kontrolü yap
    if (start_date && end_date) {
      const availableHotels = [];

      for (const hotel of hotels) {
        const existing = await Reservation.findAll({
          where: {
            hotel_id: hotel.id,
            [Op.or]: [
              { start_date: { [Op.between]: [start_date, end_date] } },
              { end_date: { [Op.between]: [start_date, end_date] } },
              {
                start_date: { [Op.lte]: start_date },
                end_date: { [Op.gte]: end_date }
              }
            ]
          }
        });

        if (existing.length === 0) {
          availableHotels.push(hotel); // bu otel uygun
        }
      }

      hotels = availableHotels;
    }

    // 4️⃣ Sonuçları sayfaya gönder
    res.render('kiraci/hotels', {
  hotels,
  location: req.query.location || '',
  minPrice: req.query.minPrice || '',
  maxPrice: req.query.maxPrice || ''
});

  } catch (err) {
    console.error("❌ Filtreleme hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

// 🏨 Otel Detay Sayfası
router.get('/hotels/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [HotelImage]
    });

    if (!hotel) return res.status(404).send("Otel bulunamadı.");

    res.render('kiraci/hotel-detail', {
      hotel,
      allFeatures
    });
  } catch (err) {
    console.error("Detay sayfası hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

// 📝 Rezervasyon Formu Göster
router.get('/rezervasyon/:id', async (req, res) => {
  console.log("Aktif kullanıcı:", req.session.user);

  try {
    const hotel = await Hotel.findByPk(req.params.id);
    if (!hotel) return res.status(404).send("Otel bulunamadı.");

    res.render('kiraci/reservation', { hotel });
  } catch (err) {
    console.error("Rezervasyon sayfası hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

// 📨 Rezervasyon Verisini Kaydet
router.post('/rezervasyon/:id', async (req, res) => {
  try {
    const { start_date, end_date, guest_count } = req.body;
    const hotelId = req.params.id;

    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).send("Oturum bulunamadı. Lütfen giriş yapın.");
    }

    // 📆 Tarih doğrulama
    if (!moment(start_date, 'YYYY-MM-DD', true).isValid() ||
      !moment(end_date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).send("Geçersiz tarih formatı.");
    }

    if (moment(start_date).isAfter(end_date)) {
      return res.status(400).send("Çıkış tarihi, girişten önce olamaz.");
    }

    // 💾 Kayıt işlemi
    await Reservation.create({
      hotel_id: hotelId,
      user_id: userId,
      start_date,
      end_date,
      guest_count,
      status: 'pending'
    });

    res.send("✅ Rezervasyon başarıyla oluşturuldu!");
  } catch (err) {
    console.error("❌ Rezervasyon ekleme hatası:", err);
    res.status(500).send("Sunucu hatası.");
  }
});


// 👤 Giriş yapan kullanıcının rezervasyonları
router.get('/rezervasyonlarim', async (req, res) => {
  try {
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).send("Lütfen önce giriş yapın.");
    }

    const reservations = await Reservation.findAll({
      where: { user_id: userId },
      include: [Hotel],
      order: [['start_date', 'DESC']]
    });

    res.render('kiraci/reservations', { reservations });
  } catch (err) {
    console.error("❌ Rezervasyonlarım hata:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

router.post('/rezervasyon/iptal/:id', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    const reservationId = req.params.id;

    if (!userId) return res.status(401).send("Giriş yapmalısınız.");

    // Sadece kendi rezervasyonunu iptal edebilsin
    const reservation = await Reservation.findOne({
      where: {
        id: reservationId,
        user_id: userId
      }
    });

    if (!reservation) return res.status(404).send("Rezervasyon bulunamadı.");

    // İptal durumuna geçir
    reservation.status = 'cancelled';
    await reservation.save();

    res.redirect('/kiraci/rezervasyonlarim');
  } catch (err) {
    console.error("❌ İptal hatası:", err);
    res.status(500).send("İptal sırasında hata oluştu.");
  }
});



module.exports = router;
