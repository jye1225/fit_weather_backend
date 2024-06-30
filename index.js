const https = require("https");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth");
const multer = require("multer");
require("dotenv").config();

//express
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

// SSL/TLS 인증서 파일 경로 설정
const privateKey = fs.readFileSync("certs/cert.key", "utf8");
const certificate = fs.readFileSync("certs/cert.crt", "utf8");
const credentials = { key: privateKey, cert: certificate };

// CORS 설정
app.use(
  cors({
    credentials: true,
    origin: true, // 모든 출처 허용
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type"],
  })
);

//--- 예은 설정값 ---

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { User } = require("./models/User.js");
const { auth } = require("./middleware/auth.js");

const config = require("./config/key.js");

// application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// application/json
app.use(bodyParser.json());
app.use(cookieParser());

// mongoDB 연결
const mongoose = require("mongoose");
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

// authRoutes 추가
app.use("/api/auth", authRoutes);

app.get("/api/users/", (req, res) => res.send("Hello World! 안녕하세요~"));

// 회원가입 부분
app.post("/api/users/signup", (req, res) => {
  // 회원 가입 할 때 필요한 정보들을 client에서 가져오면 그것들을 데이터베이스에 넣어준다.
  const user = new User(req.body); // body parser를 이용해서 json 형식으로 정보를 가져온다.

  user.save((err, userInfo) => {
    // 몽고디비에서 오는 메소드
    if (err) return res.json({ success: false, err });
    return res.status(200).json({
      // status(200)은 성공했다는 뜻
      success: true,
    });
  });
});

// 로그인 부분
app.post("/api/users/login", (req, res) => {
  // 요청된 이메일을 데이터베이스에 있는지 찾는다.
  User.findOne(
    {
      email: req.body.email,
    },
    (err, user) => {
      if (!user) {
        return res.json({
          loginSuccess: false,
          message: "이메일에 해당하는 유저가 없습니다.",
        });
      }
      // 요청된 이메일이 데이터 베이스에 있다면 비밀번호가 맞는 비밀번호인지 확인
      user.comparePassword(req.body.password, (err, isMatch) => {
        if (!isMatch) {
          return res.json({
            loginSuccess: false,
            message: "비밀번호가 틀렸습니다.",
          });
        }
        // 비밀번호까지 맞다면 토큰 생성
        user.generateToken((err, user) => {
          if (err) return res.status(400).send(err);
          // 토큰 저장 -> 쿠키, 로컬스토리지, 세션 등등
          res
            .cookie("x_auth", user.token)
            .status(200)
            .json({ loginSuccess: true, userId: user._id });
        });
      });
    }
  );
});

// auth 미들웨어를 통과해야 다음으로 넘어감
app.get("/api/users/auth", auth, (req, res) => {
  // 여기까지 미들웨어를 통과해 왔다는 얘기는 Authentication이 true라는 말
  res.status(200).json({
    _id: req.user._id,
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    image: req.user.image,
  });
});

// 로그아웃 부분
app.get("/api/users/logout", auth, (req, res) => {
  console.log(req.user);
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, user) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({ success: true });
  });
});

app.get("/api/hello", (req, res) => {
  res.send("안녕하세요");
});

//--- 예은 설정값 끝 ---

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

const postRouter = require("./routes/post.js");
const commentRouter = require('./routes/comment.js')
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

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

// app.post("/codiTalkBox", async (req, res) => {
//   console.log(req.body);
//   const { temperature, maxTemp, minTemp, rain, dust, uv, clothes } = req.body;

//   // 날씨를 전달해주는 prompt
//   let codiPrompt = "";
//   codiPrompt += `오늘의 날씨를 제시해줄게. 현재기온 : ${temperature}°C, 최고기온/최저기온 : ${maxTemp}°C / ${minTemp}°C, 자외선 : ${uv}, 미세먼지 : ${dust}, 강수확률: ${rain}%`;
//   codiPrompt += `오늘의 날씨에 적합한 코디를 알려줘`;
//   codiPrompt += `코디 정보는 3~4줄로 요약해서 말해줘야 하고, 친구에게 말하듯이 친근한 말투로 말해줘`;
//   codiPrompt += `사용자의 성별은 여자`;
//   codiPrompt += `사용자의 옷장에는 ${clothes} 이런 옷들이 들어있어. 이 옷장에 있는 옷들로만 추천해줘`;
//   codiPrompt += `tops에는 각각 긴팔, 반팔, 민소매 종류로 있고, bottoms에는 각각 긴바지, 반바지 종류가 있어`;
//   codiPrompt += `주의할 점은 날씨에 관한 얘기는 하면 안 되고, 사용자의 성별이 여자일 경우에만 블라우스, 롱스커트, 미니스커트, 원피스를 제시해줘. 남자일 경우에는 저 코디를 제시받으면 안 돼`;
//   codiPrompt += `자외선이 아무리 높아도 자외선 차단제 얘기는 하면 안 돼`;
//   codiPrompt += `신발 얘기는 강수확률이 60% 이상일 때만 "비오니까 장화 신고 가!" 덧붙여줘. 그 외에는 신발 얘기는 하면 안 돼`;

//   // prompt를 전달하고 결과를 받아옴
//   const result = await callCodiAI(codiPrompt);
//   if (result) {
//     res.json({ response: result });
//   } else {
//     res.status(500).json({ error: "실패" });
//   }
// });

// async function callCodiAI(codiPrompt) {
//   try {
//     const result = await openai.chat.completions.create({
//       model: "gpt-4o", // gpt 모델 버전
//       messages: [
//         // 1. GPT 역할 부여 샘플
//         {
//           role: "system",
//           content:
//             "당신은 날씨에 따라 어떻게 옷을 입어야 할지 고민이 많은 친구나 동생에게 코디를 알려줘야 한다.",
//         },
//         {
//           role: "user",
//           content:
//             "당신은 날씨에 따라 어떻게 옷을 입어야 할지 고민이 많은 친구나 동생에게 코디를 알려줘야 한다.",
//         },
//         {
//           role: "assistant",
//           content:
//             "저는 주변인을 잘 챙기고 꼼꼼한 성격입니다. 날씨에 맞게 옷을 잘 입고 패션에 대해 잘 압니다.",
//         },

//         // 2. 내가 전달한 prompt
//         { role: "user", content: codiPrompt },
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
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
// });

// HTTPS 서버 생성 및 리스닝 - 나영
// const httpsServer = https.createServer(credentials, app);
// httpsServer.listen(PORT, () => {
//   console.log(`${PORT}번 포트 돌아가는 즁~!`);
// });

// HTTP 서버 - 명은, 지선
app.listen(PORT, () => {
  console.log(`${PORT}번 포트 돌아가는 즁~!`);
});
