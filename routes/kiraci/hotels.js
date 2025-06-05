const express = require('express');
const router = express.Router();
const { Hotel, HotelImage, Review, User } = require('../../models');
const { Reservation } = require('../../models');
const sequelize = require('../../config/database');
const AvailableDate = require('../../models/availableDate');





const moment = require('moment');
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

router.post('/yorum-ekle', async (req, res) => {
  const { comment, rating, hotel_id, user_id } = req.body;

  try {

    await sequelize.query(
      'CALL sp_add_review_and_update_score(:userId, :hotelId, :rating, :comment)',
      {
        replacements: {
          userId: user_id,
          hotelId: hotel_id,
          rating,
          comment
        }
      }
    );
    res.redirect('/kiraci/hotels/' + hotel_id);
  } catch (err) {
    console.error("Yorum eklenirken hata:", err);
    res.status(500).send("Yorum eklenemedi.");
  }
});

router.get('/rezervasyon/:hotelId', async (req, res) => {
  const hotel = await Hotel.findByPk(req.params.hotelId);
  const available = await AvailableDate.findOne({ where: { hotel_id: req.params.hotelId } });

  res.render('kiraci/reservation', {
    hotel,
    available,
    user: req.session.user || null
  });
});

// 🏨 Otel Detay Sayfası
router.get('/hotels/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [
        HotelImage,
        {
          model: Review,
          include: [User]
        },
        AvailableDate
      ]
    });

    if (!hotel) return res.status(404).send("Otel bulunamadı.");

    // ✅ Ortalama puanı fonksiyondan al
    const [result] = await sequelize.query('SELECT fn_average_score(:hotelId) AS score', {
      replacements: { hotelId: req.params.id }
    });
    const dynamicScore = result[0].score;

    // ✅ İlk müsaitlik aralığını çek (birden fazla varsa)
    const available = hotel.AvailableDates?.[0] || null;

    res.render('kiraci/hotel-detail', {
      hotel,
      allFeatures,
      reviews: hotel.Reviews || [],
      user: req.session.user || null,
      dynamicScore,
      available
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
const { Op } = require("sequelize");

router.post('/rezervasyon/:id', async (req, res) => {
  try {
    const { start_date, end_date, guest_count } = req.body;
    const hotelId = req.params.id;
    const userId = req.session.user?.id;

    if (!userId) return res.status(401).send("Oturum bulunamadı. Lütfen giriş yapın.");

    // 📆 Tarih doğrulama
    if (!moment(start_date, 'YYYY-MM-DD', true).isValid() ||
      !moment(end_date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).send("Geçersiz tarih formatı.");
    }

    if (moment(start_date).isAfter(end_date)) {
      return res.status(400).send("Çıkış tarihi, girişten önce olamaz.");
    }

    // 🔒 Müsaitlik kontrolü
    const available = await AvailableDate.findOne({ where: { hotel_id: hotelId } });
    if (!available) return res.status(400).send("Müsaitlik bilgisi bulunamadı.");

    if (
      new Date(start_date) < available.start_date ||
      new Date(end_date) > available.end_date
    ) {
      return res.status(400).send("Seçilen tarihler müsaitlik dışında.");
    }

    // 🔁 Tarih çakışma kontrolü (üst üste binmeyi engelle)
    const conflict = await Reservation.findOne({
      where: {
        hotel_id: hotelId,
        status: { [Op.in]: ['pending', 'confirmed'] },
        start_date: { [Op.lt]: end_date },
        end_date: { [Op.gt]: start_date }
      }
    });

    if (conflict) {
      return res.status(400).send("Bu tarih aralığında zaten rezervasyon yapılmış.");
    }

    // 💾 Kaydetme (Stored Procedure ile)
    await sequelize.query(
      'CALL sp_create_reservation(:hotelId, :userId, :startDate, :endDate, :guestCount)',
      {
        replacements: {
          hotelId,
          userId,
          startDate: start_date,
          endDate: end_date,
          guestCount: guest_count
        }
      }
    );

    // Rezervasyon oluşturulduktan sonra id’yi alıp ödeme sayfasına yönlendir
    const [created] = await sequelize.query(`
  SELECT id FROM Reservations 
  WHERE user_id = :userId 
  ORDER BY createdAt DESC LIMIT 1
`, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    res.redirect(`/kiraci/odeme/${created.id}`);

  } catch (err) {
    console.error("❌ Rezervasyon hatası:", err);
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


// Ödeme ekranı (GET)
router.get('/odeme/:reservationId', async (req, res) => {
  const reservationId = req.params.reservationId;

  const reservation = await Reservation.findByPk(reservationId, {
    include: [Hotel]
  });

  if (!reservation) return res.status(404).send("Rezervasyon bulunamadı.");

  const days = Math.ceil(
    (new Date(reservation.end_date) - new Date(reservation.start_date)) / (1000 * 60 * 60 * 24)
  );
  const totalPrice = days * reservation.Hotel.price_per_night;

  res.render('kiraci/odeme', { reservationId, totalPrice });
});


// Ödeme gönderildiğinde (POST)
router.post('/odeme/:reservationId', async (req, res) => {
  const { card_number, card_name, expire_date, cvv } = req.body;
  const reservationId = req.params.reservationId;

  try {
    // (Gerçek senaryoda buraya ödeme API'si entegre edilir)
    console.log("Ödeme alındı:", card_number, card_name);

    // ✅ Ödeme başarılıysa güncelle
    await Reservation.update(
      {
        is_paid: true // ← burası eklendi
      },
      {
        where: { id: reservationId }
      }
    );

    res.send("✅ Ödeme başarılı! Rezervasyon onaylandı.");
  } catch (err) {
    console.error("Ödeme sonrası hata:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});




module.exports = router;
