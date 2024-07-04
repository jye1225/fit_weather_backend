const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  userid: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String },
  profile_image: { type: String },
});

const UserModel = model("User", UserSchema);
module.exports = UserModel;
