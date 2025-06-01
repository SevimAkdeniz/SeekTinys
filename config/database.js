const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("seektinys", "root", "Kirazmevsimi7.", {
    host: "localhost",
    dialect: "mysql",
    logging: false // Logları kapatmak için
});

module.exports = sequelize;
