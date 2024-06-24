const express = require("express");
const router = express.Router();
const Users = require("../models/user");

router.post("/signup", async (req, res) => {
  try {
    const new_user = new Users(req.body);
    await new_user.save();
    return res.status(200).json({ message: "저장 성공!", data: new_user });
  } catch (err) {
    return res.status(500).json({ message: "저장 실패!" });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const user = await Users.findOne({
      id: req.body.id,
      password: req.body.password,
    });
    if (user) {
      return res.status(200).json({ message: "유저 찾음!", data: user });
    } else {
      return res.status(404).json({ message: "유저 없음!" });
    }
  } catch (err) {
    return res.status(500).json({ message: "에러!" });
  }
});

module.exports = router;
