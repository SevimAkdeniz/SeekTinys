const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = require("./users");
const Hotel = require("./hotels");
const Reservation = sequelize.define("Reservation", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  guest_count: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending' // veya 'confirmed', 'cancelled'
  },

  is_paid: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},

}, {
  tableName: 'Reservations',
  timestamps: true
});




module.exports = Reservation;
