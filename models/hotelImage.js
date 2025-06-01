const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const HotelImage = sequelize.define("HotelImage", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: "HotelImages",
  timestamps: false
});

module.exports = HotelImage;
