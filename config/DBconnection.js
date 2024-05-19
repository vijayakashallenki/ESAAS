const mongoose = require("mongoose");

const dbconnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✔️  DB connected successfully!");
  } catch (error) {
    console.log("❗", error);
  }
};

module.exports = dbconnection;
