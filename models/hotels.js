  const { DataTypes } = require("sequelize");
  const sequelize = require("../config/database");
  const HotelImage = require('./hotelImage');



  const Reservation = require('./reservation');



  const Hotel = sequelize.define("Hotel", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true

    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
       onDelete: 'CASCADE',
    
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Bilinmiyor"
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Bilinmiyor"
    },
    description: {
      type: DataTypes.TEXT
      ,
      defaultValue: "Bilinmiyor"
    },
    price_per_night: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: "Bilinmiyor"
    },
    has_pool: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_wifi: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_parking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    pet_friendly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_spa: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_gym: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_sea_view: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_balcony: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    has_air_conditioning: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_all_inclusive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    star_rating: {
      type: DataTypes.INTEGER
    },
    review_score: {
      type: DataTypes.DECIMAL(3, 2),
      get() {
        const rawValue = this.getDataValue('review_score');
        return rawValue !== null ? parseFloat(rawValue).toFixed(1) : null;
      }
    },
    
    room_count: {
      type: DataTypes.INTEGER
    },
    
    max_guests: {
      type: DataTypes.INTEGER
    },
    check_in_time: {
      type: DataTypes.TIME
    },
    check_out_time: {
      type: DataTypes.TIME
    },
    distance_to_center: {
      type: DataTypes.DECIMAL(5, 2), // örnek: 2.75 (km)
      allowNull: true
    },
    highlight_1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    highlight_2: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    

  }, {
    tableName: 'Hotels',
    timestamps: true
  });








  module.exports = Hotel;
