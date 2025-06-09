
const express = require('express');
const router = express.Router();

const AvailableDate = require('../models/availableDate');

const Reservation = require('../models/reservation');

const isAuthenticated = require('../middlewares/auth'); // yol dosya yapına göre değişebilir

const { Hotel, Review, HotelImage, User } = require('../models');



const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Klasör yoksa oluştur
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

const upload = multer({ storage });


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





router.get("/add", (req, res) => {
  res.render("host/add-hotel");
});


router.post('/add', upload.single('image'), async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).send("Giriş yapılmamış.");

    const {
      name, location, description,
      price, distance_to_center,
      max_guests, room_count,
      check_in_time, check_out_time,
      has_pool, has_wifi, has_parking,
      pet_friendly, has_spa, has_gym,
      has_sea_view, has_balcony,
      has_air_conditioning, is_all_inclusive
    } = req.body;

    const imagePath = req.file ? req.file.path.replace(/\\/g, "/").replace("public/", "") : null;

    const hotel = await Hotel.create({
      user_id: userId, // ← Burada aktif kullanıcıyı kullanıyoruz
      name,
      location,
      description,
      price_per_night: price,
      distance_to_center,
      max_guests,
      room_count,
      check_in_time,
      check_out_time,
      has_pool: !!has_pool,
      has_wifi: !!has_wifi,
      has_parking: !!has_parking,
      pet_friendly: !!pet_friendly,
      has_spa: !!has_spa,
      has_gym: !!has_gym,
      has_sea_view: !!has_sea_view,
      has_balcony: !!has_balcony,
      has_air_conditioning: !!has_air_conditioning,
      is_all_inclusive: !!is_all_inclusive,
      highlight_1: has_spa ? 'Spa' : null,
      highlight_2: has_parking ? 'Otopark' : null
    });

    if (imagePath) {
      await HotelImage.create({
        hotel_id: hotel.id,
        image_url: imagePath
      });
    }

    const { available_start_date, available_end_date } = req.body;

    await AvailableDate.create({
      hotel_id: hotel.id, // oteli kaydettikten sonra dönen id
      start_date: available_start_date,
      end_date: available_end_date
    });


    res.redirect('/host/ilanlarim');
  } catch (err) {
    console.error("Otel eklerken hata:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

router.get("/ilanlarim", async (req, res) => {
  try {
    const userId = req.session.user?.id;

    if (!userId) return res.redirect('/login');

    const ilanlar = await Hotel.findAll({
      where: { user_id: userId },
      include: [HotelImage] // Geçici olarak sabit, sonra req.session.user.id yapılır
    });

    res.render("host/ilanlarim", { ilanlar });
  } catch (err) {
    console.error("İlanları alırken hata:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});


router.post("/sil/:id", async (req, res) => {
  try {
    const ilanId = req.params.id;

    // Gerçek kullanıcı kontrolü eklenecekse buraya user_id kontrolü eklenebilir
    await Hotel.destroy({
      where: { id: ilanId }
    });

    res.redirect("/host/ilanlarim");
  } catch (err) {
    console.error("Silme hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

router.get("/duzenle/:id", async (req, res) => {
  try {
    const ilan = await Hotel.findByPk(req.params.id);
    const tarih = await AvailableDate.findOne({ where: { hotel_id: req.params.id } });

    if (!ilan) return res.status(404).send("İlan bulunamadı.");

    res.render("host/duzenle-hotel", { ilan, tarih });
  } catch (err) {
    console.error("Düzenleme sayfası hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

router.post("/duzenle/:id", async (req, res) => {
  const toBool = (val) => val === 'on';

  try {
    const {
      name, location, price, description, distance_to_center,
      check_in_time, check_out_time, max_guests, room_count,
      available_start_date, available_end_date
    } = req.body;

    // 🔁 1. Tarih güncelleme (AvailableDate tablosunda)
    await AvailableDate.update({
      start_date: available_start_date,
      end_date: available_end_date
    }, {
      where: { hotel_id: req.params.id }
    });

    // 🏠 2. Otel bilgilerini güncelle
    await Hotel.update({
      has_wifi: toBool(req.body.has_wifi),
      has_parking: toBool(req.body.has_parking),
      pet_friendly: toBool(req.body.pet_friendly),
      has_pool: toBool(req.body.has_pool),
      has_spa: toBool(req.body.has_spa),
      has_gym: toBool(req.body.has_gym),
      has_sea_view: toBool(req.body.has_sea_view),
      has_balcony: toBool(req.body.has_balcony),
      has_air_conditioning: toBool(req.body.has_air_conditioning),
      is_all_inclusive: toBool(req.body.is_all_inclusive),
      name,
      location,
      price_per_night: price,
      description,
      distance_to_center,
      check_in_time,
      check_out_time,
      max_guests,
      room_count
    }, {
      where: { id: req.params.id }
    });

    // 👥 Rol kontrolü
    const isAdmin = req.session?.user?.role === 'admin';
    if (isAdmin) {
      return res.redirect('/admin');
    }

    res.redirect("/host/ilanlarim");

  } catch (err) {
    console.error("Güncelleme hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

router.get("/rezervasyonlar", async (req, res) => {
  try {
    const userId = req.session.user?.id;

    if (!userId) return res.redirect('/login'); // 👈 Giriş yapan otel sahibinin ID'si (ileride: req.session.user.id)

    const hotels = await Hotel.findAll({ where: { user_id: userId } });
    const hotelIds = hotels.map(h => h.id);

    const rezervasyonlar = await Reservation.findAll({
      where: { hotel_id: hotelIds },
      include: [
        { model: Hotel },
        { model: User }
      ],
      order: [['start_date', 'ASC']]
    });

    res.render("host/rezervasyonlar", { rezervasyonlar });
  } catch (err) {
    console.error("Rezervasyonları alırken hata:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});


router.get('/hotel-detay/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [
        HotelImage,
        {
          model: Review,
          include: [User] // 👈 YORUM sahibini getiriyoruz
        }
      ]
    });

    if (!hotel) return res.status(404).send("Otel bulunamadı");

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

    res.render("host/hotel-detail", {
      hotel,
      allFeatures
    });
  } catch (err) {
    console.error("Hotel detay hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});

// Sadece "/rezervasyonlar/sil/:id" → çünkü zaten /host prefix'i var
router.get("/rezervasyonlar/sil/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Reservation.destroy({ where: { id } });
    res.redirect("/host/rezervasyonlar");
  } catch (err) {
    console.error("Silme hatası:", err);
    res.status(500).send("Silme işlemi başarısız.");
  }
});

router.get('/edit/:id', async (req, res) => {
  const hotel = await Hotel.findByPk(req.params.id);
  if (!hotel) return res.status(404).send("Otel bulunamadı.");
  res.render('editHotel', { hotel });
});

// Form gönderilince oteli güncelle
router.post('/edit/:id', async (req, res) => {
  const { name, location, price_per_night } = req.body;
  await Hotel.update(
    { name, location, price_per_night },
    { where: { id: req.params.id } }
  );
  res.redirect('/admin');
});



router.post("/rezervasyonlar/onayla/:id", async (req, res) => {
  try {
    const id = req.params.id;

    await Reservation.update(
      { status: "confirmed" },
      { where: { id } }
    );

    res.redirect("/host/rezervasyonlar");
  } catch (err) {
    console.error("Rezervasyon onaylanırken hata:", err);
    res.status(500).send("Onay işlemi başarısız.");
  }
});




router.get('/owner/profile', isAuthenticated, async (req, res) => {
  const ownerID = req.session.userID;

  const user = await User.findByPk(ownerID);
  if (!user || user.role !== 'owner') return res.redirect('/');

  const hotels = await Hotel.findAll({ where: { user_id: ownerID } });
  const hotelIDs = hotels.map(h => h.id);

  const activeHotels = hotels.length;

  const totalReservations = await Reservation.count({
    where: { HotelID: { [Op.in]: hotelIDs } }
  });

  const totalReviews = await Review.count({
    where: { HotelID: { [Op.in]: hotelIDs } }
  });

  // Hotel modelindeki review_score değerlerinin ortalaması alınır
  const totalRating = hotels.reduce((sum, hotel) => {
    return sum + (parseFloat(hotel.review_score) || 0);
  }, 0);

  const averageRating = hotels.length > 0
    ? (totalRating / hotels.length).toFixed(2)
    : "0.00";

  res.render('profil', {
    user,
    stats: {
      activeHotels,
      totalReservations,
      totalReviews,
      averageRating
    }
  });
});



router.post('/aktif-yap/:id', async (req, res) => {
  const hotelId = req.params.id;

  try {
    await Hotel.update({ is_active: true }, { where: { id: hotelId } });
    res.redirect('/host/ilanlarim'); // ya da kendi yönlendirme yolun
  } catch (err) {
    console.error("Aktif yaparken hata:", err);
    res.status(500).send("Aktif yapılırken hata oluştu.");
  }
});

// Oteli pasif yap
router.post('/pasif-yap/:id', async (req, res) => {
  const hotelId = req.params.id;

  try {
    await Hotel.update({ is_active: false }, { where: { id: hotelId } });
    res.redirect('/host/ilanlarim');
  } catch (err) {
    console.error("Pasif yaparken hata:", err);
    res.status(500).send("Pasif yapılırken hata oluştu.");
  }
});

module.exports = router;
