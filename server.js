const express = require("express");
const app = express();
const port = 4000;
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const upload = multer({ dest: "uploads/" });

const mongoose = require("mongoose");
const user = require("./routes/user");
app.use("/user", user);

require("dotenv").config();

const cors = require("cors");
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

app.use(express.json());

// app.post("/kakao-login", async (req, res) => {
//   const { code } = req.query;

//   try {
//     const tokenResponse = await axios.post(
//       `https://kauth.kakao.com/oauth/token`,
//       null,
//       {
//         params: {
//           grant_type: "authorization_code",
//           client_id: REST_API_KEY,
//           redirect_uri: REDIRECT_URI,
//           code,
//         },
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
//         },
//       }
//     );

//     const accessToken = tokenResponse.data.access_token;

//     const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//     });

//     const user = userResponse.data;
//     // 필요한 로직 추가 (DB 저장 등)

//     res.json({ user, token: accessToken });
//   } catch (error) {
//     console.error("카카오 로그인 실패:", error);
//     res.status(500).json({ message: "카카오 로그인 실패" });
//   }
// });

const server = app.listen(port, () => {
  console.log(`서버진행중~~~ 포트번호는 ${port}`);
});
