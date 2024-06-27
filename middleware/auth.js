const express = require("express");
const router = express.Router();
const { User } = require("../models/User");

// 인증 처리하는 곳
let auth = (req, res, next) => {
  // 클라이언트 쿠키에서 토큰을 가져온다.
  let token = req.cookies.x_auth;
  // 토큰을 복호화 한 후 유저를 찾는다.
  User.findByToken(token, (err, user) => {
    if (err) throw err;
    if (!user) return res.json({ isAuth: false, error: true });
    // 사용할 수 있게 해준다.
    req.token = token;
    req.user = user;
    next(); // 미들웨어에서 다음으로 넘어가는 것
  });
  // 유저가 있으면 인증 Okay
  // 유저가 없으면 인증 No
};

// 아이디 중복 확인
router.post("/check-id", async (req, res) => {
  const { id } = req.body;
  try {
    const user = await User.findOne({ id });
    if (user) {
      return res.status(400).json({ message: "아이디가 이미 사용 중입니다." });
    }
    res.json({ message: "사용 가능한 아이디입니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류입니다." });
  }
});

// 닉네임 중복 확인
router.post("/check-name", async (req, res) => {
  const { name } = req.body;
  try {
    const user = await User.findOne({ name });
    if (user) {
      return res.status(400).json({ message: "닉네임이 이미 사용 중입니다." });
    }
    res.json({ message: "사용 가능한 닉네임입니다." });
  } catch (error) {
    res.status(500).json({ message: "서버 오류입니다." });
  }
});

module.exports = router;
module.exports.auth = auth;
