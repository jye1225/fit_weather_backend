const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserSchema = new Schema({
  userid: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String },
  userprofile: { type: String, default: null },
  shortBio: { type: String, default: null },
  gender: { type: String },
});

const UserModel = model("User", UserSchema);
module.exports = UserModel;
