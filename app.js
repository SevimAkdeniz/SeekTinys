const express = require("express")
const app = express()
const path = require("path");
require("dotenv").config();

const sequelize = require("./config/database"); //  MySQL Bağlantısı
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRouter");
const hotelsRoute = require('./routes/hotels');
const kiraciHotelRoutes = require('./routes/kiraci/hotels');
const session = require("express-session");



app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));





sequelize.sync() 
    .then(() => {
        console.log("✅ MySQL veritabanı senkronize edildi");

        // ✅ Sunucuyu Başlat
        app.listen(3000, () => {
            console.log("🚀 Sunucu 3000 portunda çalışıyor...");
        });
    })
    .catch(err => console.error("❌ Veritabanı senkronizasyon hatası:", err));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "gizli_kelime", // .env'e koyabilirsin
  resave: false,
  saveUninitialized: false
}));

app.use('/kiraci', kiraciHotelRoutes);
app.use(authRoutes);
app.use('/host', hotelsRoute);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));







    
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login");
});



app.get("/signup", (req, res) => {
    res.render("signup");
});

app.get("/admin", (req,res)=>{
    res.render("admin")
})



app.get("/add-hotel",(req,res)=>{
res.render("host/add-hotel");
})