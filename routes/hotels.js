
  const express = require('express');
  const router = express.Router();
  const Hotel = require('../models/hotels');
  const HotelImage = require('../models/hotelImage')

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


/*
  router.post('/hotels', async (req, res) => {
    try {


      res.redirect('/hotels'); // veya başka bir sayfaya yönlendirme
    } catch (err) {
      console.error("Otel eklenirken hata oluştu:", err);
      res.status(500).send("Bir hata oluştu.");
    }
  });


  router.get('/hotels', async (req, res) => {
    try {
      const hotels = await Hotel.findAll({
        include: [HotelImage] // 👈 BU SATIR CRITICAL
      });
  
      res.render('/hotels', { hotels });
  
    } catch (err) {
      console.error("Hata:", err);
      res.sendStatus(500);
    }
  });
*/

  

  router.get("/add", (req, res) => {
    res.render("add-hotel");
  });


  router.post("/add", async (req,res)=>{

    console.log("post islemi basarılıl")



    const { name } = req.body;



    
  try {
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
  
    // ✅ checkbox değerlerini kontrol et
  
    // ✅ seçili olan özellikleri topla
    const activeKeys = Object.keys(allFeatures).filter(
      (key) => req.body[key] === "on"
    );
  
    // ✅ rastgele karıştır ve ilk 2'yi seç
    const shuffled = activeKeys.sort(() => 0.5 - Math.random());
    const highlight_1 = allFeatures[shuffled[0]] || null;
    const highlight_2 = allFeatures[shuffled[1]] || null;



    await Hotel.create({


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




      
      name: req.body.name || "Adsız Otel",
      location: req.body.location || "Bilinmiyor",
      price_per_night: req.body.price || 0,
      user_id: 1,   
      distance_to_center : req.body.distance_to_center,
      description : req.body.description,
      check_in_time : req.body.check_in_time,
      check_out_time : req.body.check_out_time ,
      max_guests : req.body.max_guests,
      room_count : req.body.room_count,

      highlight_1,
      highlight_2
    });
    

    res.send("veritabanına kaydedildi 🎉");
  } catch (err) {
    console.error("Kayıt hatası:", err);
    res.status(500).send("Bir hata oluştu.");
  }

  })
  








  module.exports = router;
