
const express = require('express');
const router = express.Router();
const Hotel = require('../models/hotels');
const HotelImage = require('../models/hotelImage')

const Reservation = require('../models/reservation');
const User = require('../models/users');



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


router.post("/add", upload.single("image"), async (req, res) => {
  console.log("Gelen BODY:", req.body);
  console.log("Gelen DOSYA:", req.file);

  const toBool = (val) => val === 'on';
  const allFeatures = {
    has_pool: "Havuz",
    has_wifi: "Wi-Fi",
    has_parking: "Otopark",
    pet_friendly: "Evcil Hayvan",
    has_spa: "Spa",
    has_gym: "Spor Salonu",
    has_sea_view: "Deniz Manzarası",
    has_balcony: "Balkon",
    has_air_conditioning: "Klima",
    is_all_inclusive: "Her Şey Dahil"
  };

  const activeKeys = Object.keys(allFeatures).filter(
    (key) => req.body[key] === "on"
  );
  const shuffled = activeKeys.sort(() => 0.5 - Math.random());
  const highlight_1 = allFeatures[shuffled[0]] || null;
  const highlight_2 = allFeatures[shuffled[1]] || null;

  await Hotel.create({
    name: req.body.name,
    location: req.body.location,
    price_per_night: req.body.price,
    user_id: 1, // geçici
    distance_to_center: req.body.distance_to_center,
    description: req.body.description,
    check_in_time: req.body.check_in_time,
    check_out_time: req.body.check_out_time,
    max_guests: req.body.max_guests,
    room_count: req.body.room_count,
    image_path: req.file?.filename || null, // 🌟 görsel path'i kaydediliyor

    has_pool: toBool(req.body.has_pool),
    has_wifi: toBool(req.body.has_wifi),
    has_parking: toBool(req.body.has_parking),
    pet_friendly: toBool(req.body.pet_friendly),
    has_spa: toBool(req.body.has_spa),
    has_gym: toBool(req.body.has_gym),
    has_sea_view: toBool(req.body.has_sea_view),
    has_balcony: toBool(req.body.has_balcony),
    has_air_conditioning: toBool(req.body.has_air_conditioning),
    is_all_inclusive: toBool(req.body.is_all_inclusive),

    highlight_1,
    highlight_2
  });

  res.redirect("/host/ilanlarim");
});

router.get("/ilanlarim", async (req, res) => {
  try {
    const ilanlar = await Hotel.findAll({
      where: { user_id: 1 }, // Geçici olarak sabit, sonra req.session.user.id yapılır
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

    if (!ilan) return res.status(404).send("İlan bulunamadı.");

    res.render("host/duzenle-hotel", { ilan });
  } catch (err) {
    console.error("Düzenleme sayfası hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});



router.post("/duzenle/:id", async (req, res) => {
  const toBool = (val) => val === 'on';

  try {
    const { name, location, price, description, distance_to_center, check_in_time, check_out_time, max_guests, room_count } = req.body;

    await Hotel.update(
      {
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
      },
      {
        where: { id: req.params.id }
      }
    );

    res.redirect("/host/ilanlarim");
  } catch (err) {
    console.error("Güncelleme hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }
});





router.get("/rezervasyonlar", async (req, res) => {
  try {
    const userId = 1; // 👈 Giriş yapan otel sahibinin ID'si (ileride: req.session.user.id)

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





router.post("/rezervasyonlar/onayla/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await Reservation.update({ status: "confirmed" }, { where: { id } });
    res.redirect("/host/rezervasyonlar");
  } catch (err) {
    console.error("Rezervasyon onaylanırken hata:", err);
    res.status(500).send("Onay işlemi başarısız.");
  }
});







module.exports = router;
