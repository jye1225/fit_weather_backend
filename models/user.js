const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  userid: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String },
  gender: { type: String },
  profile_image: { type: String },

  // email: { type: String, required: true, unique: true },
});

const UserModel = model("User", UserSchema);
module.exports = UserModel;
