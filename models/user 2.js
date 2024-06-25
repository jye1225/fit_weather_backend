const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  password: String, // 비밀번호
  name: String, // 이름
  id: String, // 아이디
  gender: String, // 성별
});

module.exports = mongoose.model("users", UserSchema);
