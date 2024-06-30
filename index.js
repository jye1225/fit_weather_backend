const https = require("https");
const cors = require("cors");
const authRoutes = require("./middleware/auth");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
require("dotenv").config();

// express
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

// SSL/TLS 인증서 파일 경로 설정
const privateKey = fs.readFileSync("certs/cert.key", "utf8");
const certificate = fs.readFileSync("certs/cert.crt", "utf8");
const credentials = { key: privateKey, cert: certificate };

// CORS 설정
const allowedOrigins = ["http://localhost:3000", "https://localhost:3000"]; // http와 https 모두를 허용하도록 설정
app.use(
  cors({
    credentials: true,
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type"],
  })
);

// ------- 예은 설정값 --------

app.use(express.json());

// mongoDB 연결
const mongoose = require("mongoose");
const connectUri =
  "mongodb+srv://fitweather33:0i9znTMj22IV0a8D@cluster0.ehwrc44.mongodb.net/fitweather?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(connectUri);

const User = require("./models/User"); // User 모델 생성

const bcrypt = require("bcryptjs");
const salt = bcrypt.genSaltSync(10);

const jwt = require("jsonwebtoken");
const jwtSecret = "qwerasdf"; // 환경변수로 처리

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// 회원가입 기능
app.post("/register", async (req, res) => {
  const { userid, username, password, gender } = req.body;
  console.log(req.body);

  try {
    const userDoc = await User.create({
      userid,
      username,
      password: bcrypt.hashSync(password, salt),
      gender,
    });
    res.json(userDoc);
  } catch (e) {
    res.status(400).json({ message: "failed", error: e.message });
  }
});

// 로그인 기능
app.post("/login", async (req, res) => {
  const { userid, password } = req.body;
  const userDoc = await User.findOne({ userid });

  if (!userDoc) {
    res.json({ message: "nouser" });
    return;
  }

  // jwt.sign( { token에 들어갈 데이터 }, 비밀키, { token의 유효기간(안써도됨) }, ( err, token )=>{} )
  const passOK = bcrypt.compareSync(password, userDoc.password); // 두 정보가 맞으면 true, 틀리면 false
  if (passOK) {
    jwt.sign({ userid, id: userDoc._id }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      console.log(token);
      res.json({
        token,
        id: userDoc._id,
        userid,
      });
    });
  } else {
    res.json({ message: "failed" });
  }
});

// 이거 삭제하면 로그아웃 안됨
app.post("/logout", (req, res) => {
  res.cookie("token", "").json();
});

// -------- 예은 설정값 끝 ---------

//// >>>>>> 나영 부분 시작
app.use("/codiUploads", express.static(path.join(__dirname, "codiUploads"))); //Express 앱에서 정적 파일을 서빙하기 위한 설정: express.static 미들웨어를 사용하여 정적 파일을 서빙할 수 있도록

// codiLogDetail GET
app.get("/codiLogDetail/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const codiLog = await CodiLogModel.findById(id);
    res.json(codiLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// codiLogList GET

app.get("/codiLogList", async (req, res) => {
  console.log("codiLogList 요청 옴");
  // res.send("codiLogList 잘 돌아감");

  // 로그인 되면 userid -> 쿠키 토큰해석해서 쓰기
  //  const { token } = req.cookies;
  // console.log("token:::", token);
  // if (!token) {
  // return res.status(401).json({ message: "인증토큰없음" });
  // }
  try {
    // jwt.verify(token, jwtSecret, {}, async (err, info) => {  //token 해석
    // if (err) throw err;
    // const codiLogList = await codiLogList.find({ userid: id}).sort({ codiDate: -1 });
    //...
    // });

    const codiLogList = await CodiLogModel.find({ userid: "userid" }).sort({
      codiDate: 1,
    });
    // console.log(codiLogList);
    res.json(codiLogList); // 생성된 codiLogList를 JSON 형태로 클라이언트에 응답으로 보냄
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// multer 설정
const storage = multer.diskStorage({
  destination: "codiUploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// codiWrite POST 요청 핸들러
const CodiLogModel = require("./models/codiLog");
app.post("/codiWrite", upload.single("file"), async (req, res) => {
  const { memo, tag, address, maxTemp, minTemp, codiDate } = req.body;
  const { filename, path } = req.file;
  console.log("codiWrite 잘 돌아감", memo, tag, filename, path);

  try {
    const codiDoc = await CodiLogModel.create({
      image: path,
      tag,
      memo,
      address,
      maxTemp,
      minTemp,
      codiDate,
      sky: null,
      username: null,
      userid: null,
    });
    res.json(codiDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//// <<<<<<< 나영 부분 끝

// --------------커뮤니티 부분 시작--------------------------

const postRouter = require("./routes/post");
app.use("/posts", postRouter);

// --------------커뮤니티 부분 끝------------------------------

//// >>>>> 지선 부분 시작 - GPT 프롬프트

// const { OpenAI } = require("openai"); // openai 모듈

// app.post("/talkBox", async (req, res) => {
//   console.log(req.body);
//   const { temperature, maxTemp, minTemp, rain, dust, uv } = req.body;

//   // 날씨를 전달해주는 prompt
//   let prompt = "";
//   prompt += `오늘의 날씨를 제시해줄게. 현재기온 : ${temperature}°C, 최고기온/최저기온 : ${maxTemp}°C / ${minTemp}°C, 자외선 : ${uv}, 미세먼지 : ${dust}, 강수확률: ${rain}%`;
//   prompt += `날씨는 3~4줄로 요약해서 말해줘야 하고, 친구에게 말하듯이 친근한 말투로 말해줘.`;
//   prompt += `주의할 점은 숫자로 된 수치정보는 언급하지 말고 아래의 기준에 맞춰서 답변해줘.
//   1. 최저기온이 25°C 이상이면 겉옷 얘기 금지
//   2. 미세먼지 값이 좋음 또는 보통이면 마스크 얘기 금지, 미세먼지 얘기 금지
//   3. 강수확률이 40% 이하이면 비 안 온다 얘기 금지, 우산 얘기 금지
//   4. 강수확률이 40% 이상 60% 미만이면 “비가 올 수도 있으니 우산 챙겨가!” 답변 추가
//   5. 강수확률이 60% 이상이면 “오늘 비오니까 우산 챙겨가!” 답변 추가
//   6. 자외선 값이 매우높음 또는 높음이면 썬크림 얘기 해주고, 보통 또는 낮음이면 자외선, 썬크림 얘기 금지`;
//   prompt += `답변의 한 문장이 끝날 때 다음 답변을 이어서 쓰지 말고 줄을 바꿔줘`;

//   // prompt를 전달하고 결과를 받아옴
//   const result = await callChatGPT(prompt);
//   if (result) {
//     res.json({ response: result });
//   } else {
//     res.status(500).json({ error: "실패" });
//   }
// });

// async function callChatGPT(prompt) {
//   try {
//     const result = await openai.chat.completions.create({
//       model: "gpt-4o", // gpt 모델 버전
//       messages: [
//         // 1. GPT 역할 부여 샘플
//         {
//           role: "system",
//           content:
//             "당신은 날씨에 따라 어떻게 옷을 입어야 할지 고민이 많은 친구나 동생에게 날씨를 알려줘야 한다.",
//         },
//         {
//           role: "user",
//           content:
//             "당신은 날씨에 따라 어떻게 옷을 입어야 할지 고민이 많은 친구나 동생에게 날씨를 알려줘야 한다.",
//         },
//         {
//           role: "assistant",
//           content:
//             "저는 주변인을 잘 챙기고 꼼꼼한 성격입니다. 날씨에 맞게 옷을 잘 입고 패션에 대해 잘 압니다.",
//         },

//         // 2. 내가 전달한 prompt
//         { role: "user", content: prompt },
//       ],
//       max_tokens: 1000, // 돈 많이 나갈까봐 글자수 제한;
//       temperature: 0.8, // 0.0 ~ 1.0 사이의 값. 0.0에 가까울수록 더 안전한 선택을, 1.0에 가까울수록 더 창의적인 선택을 함.
//       top_p: 1, // 0.0 ~ 1.0 사이의 값. 1.0에 가까울수록 다양한 선택을 함.
//       frequency_penalty: 0.0, // 0.0 ~ 1.0 사이의 값. 0.0에 가까울수록 더 반복적인 선택을 함.
//       presence_penalty: 0.0, // 0.0 ~ 1.0 사이의 값. 0.0에 가까울수록 더 새로운 선택을 함.
//     });

//     console.log("result: ", result.choices[0].message);
//     return result.choices[0].message;
//   } catch (e) {
//     console.log(e);
//   }
// }

//// <<<<<<< 지선 부분 끝

// 기본 루트 경로(/)에 대한 GET 요청 핸들러
app.get("/", (req, res) => {
  res.send("app.get 잘 돌아감");
});

// 모든 경로에 대해 React 앱의 index.html 제공 --> 이게 다른 get요청보다 후순위어야 오류가 안 나서 아래로 옮겼습니다! -나영
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});

// HTTPS 서버 생성 및 리스닝 - 맥
// const httpsServer = https.createServer(credentials, app);
// httpsServer.listen(PORT, () => {
//   console.log(`${PORT}번 포트 돌아가는 즁~!`);
// });

// HTTP 서버 - 윈도우
app.listen(PORT, () => {
  console.log(`${PORT}번 포트 돌아가는 즁~!`);
});
