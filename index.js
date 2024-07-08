const https = require("https");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
require("dotenv").config();
const axios = require("axios");
const mongoose = require("mongoose");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// express
const app = express();
const PORT = 8080;

// SSL/TLS 인증서 파일 경로 설정
const privateKey = fs.readFileSync("certs/cert.key", "utf8");
const certificate = fs.readFileSync("certs/cert.crt", "utf8");
const credentials = { key: privateKey, cert: certificate };

// CORS 설정
app.use(
  cors({
    credentials: true,
    origin: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type"], // Authorization 헤더를 사용하지 않음
  })
);

app.use(express.json());
app.use(cookieParser());

// MongoDB 연결
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

const User = require("./models/User"); // User 모델 생성

const salt = bcrypt.genSaltSync(10);
const jwtSecret = process.env.JWT_SECRET; // 환경변수로 처리

// JWT 토큰을 검증하는 미들웨어
const authenticateToken = (req, res, next) => {
  const token = req.query.token; // 쿼리 파라미터에서 토큰을 가져옴
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// 카카오 회원가입 기능
app.post("/kakao-register", async (req, res) => {
  const { userid, username, profile_image } = req.body;
  console.log(req.body);

  try {
    const userDoc = await User.create({
      userid,
      username,
      password: String(Math.floor(Math.random() * 1000000)),
      profile_image,
    });
    console.log("문서", userDoc);
    res.json(userDoc);
  } catch (e) {
    console.error("카카오 로그인 에러", e);
    res.status(400).json({ message: "failed", error: e.message });
  }
});

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
  console.log("로그인 기능----", req.body);
  const userDoc = await User.findOne({ userid });

  if (!userDoc) {
    res.json({ message: "nouser" });
    return;
  }

  const passOK = bcrypt.compareSync(password, userDoc.password);
  if (passOK) {
    jwt.sign(
      { userid, username: userDoc.username, id: userDoc._id },
      jwtSecret,
      {},
      (err, token) => {
        if (err) throw err;
        console.log(token);
        res.cookie("token", token).json({
          token,
          id: userDoc._id,
          username: userDoc.username,
          userid,
        });
      }
    );
  } else {
    res.json({ message: "failed" });
  }
});

// 로그아웃 기능
app.post("/logout", (req, res) => {
  res.cookie("token", "").json();
});

// 현재 로그인된 사용자의 ID 가져오기
app.get("/getUserid", authenticateToken, (req, res) => {
  res.json({ userid: req.user.userid });
});

// 사용자 정보 업데이트
app.post("/updateUserInfo", authenticateToken, async (req, res) => {
  const { password, gender } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, salt);
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword,
      gender,
    });
    res.json({ message: "User information updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/// ~~~~~~~~~~~~~~ 나영 부분 시작~~~~~~~~~~~~~~
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// codiLogToday Get

app.get("/codiLogToday/:today/:userid", async (req, res) => {
  // console.log('>>>>>>요청 성공 >> codiLogToday Get ');
  const { today, userid } = req.params;
  try {
    const codiLogToday = await CodiLogModel.find({
      userid: userid,
      codiDate: today,
    });
    if (codiLogToday.length > 0) {
      // console.log(codiLogToday[0]);
      res.json(codiLogToday[0]);
    } else {
      // console.log("해당날짜 기록 없음");
      res.json(null); // 해당 날짜에 대한 데이터가 없을 때
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// codiLogSimilar Get
app.get(
  "/codiLogSimilar/:maxTemp/:minTemp/:sky/:userid/:today",
  async (req, res) => {
    const { maxTemp, minTemp, sky, userid, today } = req.params;
    // console.log("-------------요청 성공 >> ", maxTemp, minTemp, sky, userid); // 예 ) 31 21 구름많음 nayoung
    // 비슷한 날씨 : 기온 차이 4도 미만 으로 설정
    //1순위 : 기온차 조건 ok + sky 똑같음 //2순위 : 기온차 조건 ok   //부합하는 기록이 여러개라면 : 랜덤
    try {
      const ListSimilarTemp = await CodiLogModel.find({
        userid: userid,
        maxTemp: { $gte: parseInt(maxTemp) - 2, $lte: parseInt(maxTemp) + 2 },
        minTemp: { $gte: parseInt(minTemp) - 2, $lte: parseInt(minTemp) + 2 },
        codiDate: { $ne: today },
      });

      let setListCheckSimilar = []; //
      if (ListSimilarTemp.length > 0) {
        const ListSimilarSky = ListSimilarTemp.filter(
          (item) => item.sky === sky
        );
        if (ListSimilarSky.length !== 0) {
          setListCheckSimilar = [...ListSimilarSky];
        } else {
          setListCheckSimilar = [...ListSimilarTemp];
        }

        // console.log("---조건 부합한 기록 갯수 ---", setListCheckSimilar.length);
        const randomIndex = Math.floor(
          Math.random() * setListCheckSimilar.length
        ); // 0부터 (listLength-1) 사이의 랜덤한 정수 얻기
        // console.log(
        //   "@@@랜덤숫자, 해당 기록@@@@",
        //   randomIndex,
        //   setListCheckSimilar[randomIndex]
        // );
        res.json(setListCheckSimilar[randomIndex]);
      } else {
        res.json(null); // 해당하는 데이터가 없을 때
        console.log("!!!!조간 부합한 기록이 없다!!!!");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "codiLogSimilar : Internal Server Error" });
    }
  }
);

// codiLogList GET
app.get("/codiLogList/:userid", async (req, res) => {
  console.log("codiLogList 요청 옴");
  const { userid } = req.params;
  // 유효한 userid 확인
  if (!userid) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const limit = parseInt(req.query.limit, 10) || 32; // 페이지당 가져올 데이터 수
  const page = parseInt(req.query.page, 10) || 0; // 현재 페이지 번호
  const skip = page * limit; // 건너뛸 데이터 수 계산

  // 로그인 되면 userid -> 로그인한 사람 id로 바꾸기
  try {
    const codiLogList = await CodiLogModel.find({ userid: userid })
      .sort({ codiDate: -1 }) // 최신순으로 정렬
      .skip(skip) // 페이지네이션을 위한 건너뛰기
      .limit(limit); // 페이지당 데이터 수 제한
    console.log(codiLogList.length);
    res.json(codiLogList); // 생성된 codiLogList를 JSON 형태로 클라이언트에 응답으로 보냄
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// multer 설정
const storage = multer.diskStorage({
  destination: "uploads/codiLog",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// codiWrite POST 요청 핸들러
const CodiLogModel = require("./models/codiLog");

app.post("/codiWrite", upload.single("file"), async (req, res) => {
  const { memo, tag, address, maxTemp, minTemp, codiDate, sky, userid } =
    req.body;
  const { filename, path } = req.file;
  // console.log("codiWrite 잘 돌아감", memo, tag, filename, path);

  try {
    const codiDoc = await CodiLogModel.create({
      image: path,
      tag,
      memo,
      address,
      maxTemp,
      minTemp,
      sky,
      codiDate,
      // codiDate: '2024-07-01',
      userid,
    });
    res.json(codiDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//코디기록 수정페이지 codiEdit PUT
app.put("/codiEdit/:id", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  const { memo, tag } = req.body;
  const { filename, path } = req.file;
  console.log("---codiEdit 잘 돌아감", id, memo, tag, filename, path);

  try {
    await CodiLogModel.findByIdAndUpdate(id, {
      memo,
      tag,
      image: path,
    });
    res.status(200).json({ message: "CodiEdit successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "codiEdit - Server Error" });
  }
});

// 코디기록 삭제 codiDelete DELETE
app.delete("/codiDelete/:id", async (req, res) => {
  const { id } = req.params;
  console.log(">>codiDelete>>", id);

  try {
    const codiLog = await CodiLogModel.findById(id);
    const imgPath = codiLog.image;

    await CodiLogModel.findByIdAndDelete(id);

    fs.unlink(imgPath, (err) => {
      //uploads/codiLog 폴더의 이미지파일도 삭제되도록
      if (err) {
        console.error("파일 삭제 실패:", err);
        return;
      }
      console.log("파일이 성공적으로 삭제되었습니다.");
    });

    res.status(200).json({ message: "codiDelete successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "codiDelete - Server Error" });
  }
});
//// ~~~~~~~~~~~~~~ 나영 부분 끝~~~~~~~~~~~~~~

// --------------커뮤니티 부분 시작--------------------------

const postRouter = require("./routes/post.js");
const commentRouter = require("./routes/comment.js")(User);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

// --------------커뮤니티 부분 끝------------------------------

// //// >>>>> 지선 부분 시작 - GPT 프롬프트

const { OpenAI } = require("openai"); // openai 모듈

// openai apiKey
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/talkBox", async (req, res) => {
  console.log(req.body);
  const { temperature, maxTemp, minTemp, popValue, dust, uv } = req.body;

  // 날씨를 전달해주는 prompt
  let prompt = "";
  prompt += `오늘의 날씨를 제시해줄게. 현재기온 : ${temperature}°C, 최고기온/최저기온 : ${maxTemp}°C / ${minTemp}°C, 자외선 : ${uv}, 미세먼지 : ${dust}, 강수확률: ${popValue}%`;
  prompt += `날씨는 3~4줄로 요약해서 말해줘야 하고, 친구에게 말하듯이 친근한 말투로 말해줘.`;
  prompt += `주의할 점은 숫자로 된 수치정보는 언급하지 말고 아래의 기준에 맞춰서 답변해줘.
  1. 최저기온이 25°C 이상이면 겉옷 얘기 금지
  2. 미세먼지 값이 좋음 또는 보통이면 마스크 얘기 금지, 미세먼지 얘기 금지
  3. 강수확률이 40% 이하이면 비 안 온다 얘기 금지, 우산 얘기 금지
  4. 강수확률이 40% 이상 60% 미만이면 “비가 올 수도 있으니 우산 챙겨가!” 답변 추가
  5. 강수확률이 60% 이상이면 “오늘 비오니까 우산 챙겨가!” 답변 추가
  6. 자외선 값이 매우높음 또는 높음이면 썬크림 얘기 해주고, 보통 또는 낮음이면 자외선, 썬크림 얘기 금지`;
  prompt += `답변의 한 문장이 끝날 때 다음 답변을 이어서 쓰지 말고 줄을 바꿔줘`;

  // prompt를 전달하고 결과를 받아옴
  const result = await callChatGPT(prompt);
  if (result) {
    res.json({ response: result });
  } else {
    res.status(500).json({ error: "실패" });
  }
});

async function callChatGPT(prompt) {
  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o", // gpt 모델 버전
      messages: [
        // 1. GPT 역할 부여 샘플
        {
          role: "system",
          content:
            "당신은 날씨에 따라 어떻게 옷을 입어야 할지 고민이 많은 친구나 동생에게 날씨를 알려줘야 한다.",
        },
        {
          role: "user",
          content:
            "당신은 날씨에 따라 어떻게 옷을 입어야 할지 고민이 많은 친구나 동생에게 날씨를 알려줘야 한다.",
        },
        {
          role: "assistant",
          content:
            "저는 주변인을 잘 챙기고 꼼꼼한 성격입니다. 날씨에 맞게 옷을 잘 입고 패션에 대해 잘 압니다.",
        },

        // 2. 내가 전달한 prompt
        { role: "user", content: prompt },
      ],
      max_tokens: 1000, // 돈 많이 나갈까봐 글자수 제한;
      temperature: 0.8, // 0.0 ~ 1.0 사이의 값. 0.0에 가까울수록 더 안전한 선택을, 1.0에 가까울수록 더 창의적인 선택을 함.
      top_p: 1, // 0.0 ~ 1.0 사이의 값. 1.0에 가까울수록 다양한 선택을 함.
      frequency_penalty: 0.0, // 0.0 ~ 1.0 사이의 값. 0.0에 가까울수록 더 반복적인 선택을 함.
      presence_penalty: 0.0, // 0.0 ~ 1.0 사이의 값. 0.0에 가까울수록 더 새로운 선택을 함.
    });

    console.log("result: ", result.choices[0].message);
    return result.choices[0].message;
  } catch (e) {
    console.log(e);
  }
}

app.post("/codiTalkBox", async (req, res) => {
  console.log(req.body);
  const {
    temperature,
    maxTemp,
    minTemp,
    popValue,
    dust,
    uv,
    clothes,
    selectedTemp,
  } = req.body;

  // 날씨를 전달해주는 prompt
  let codiPrompt = "";
  codiPrompt += `오늘의 날씨를 제시해줄게. 현재기온 : ${temperature}°C, 최고기온/최저기온 : ${maxTemp}°C / ${minTemp}°C, 자외선 : ${uv}, 미세먼지 : ${dust}, 강수확률: ${popValue}%`;
  codiPrompt += `오늘의 날씨와 비교해서 ${selectedTemp}한 코디를 알려줘`;
  codiPrompt += `코디 정보는 3줄 이내로 요약해서 말해줘야 하고, 친구에게 말하듯이 친근한 말투로 말해줘`;
  codiPrompt += `사용자의 성별은 여자`;
  codiPrompt += `사용자의 옷장에는 ${clothes} 이런 옷들이 들어있어. 이 옷장에 있는 옷들을 조합해서 추천해줘`;
  codiPrompt += `tops에는 각각 긴팔, 반팔, 민소매 종류로 있고, bottoms에는 각각 긴바지, 반바지 종류가 있어`;
  codiPrompt += `주의할 점은 날씨에 관한 얘기는 하면 안 되고, 사용자의 성별이 여자일 경우에만 블라우스, 롱스커트, 미니스커트, 원피스를 제시해줘. 남자일 경우에는 저 코디를 제시받으면 안 돼`;
  codiPrompt += `시원한 코디를 알려줄 때, 현재기온과 최고기온이 25°C 이상일 때는 outers 종류는 추천하면 안 돼`;
  codiPrompt += `자외선이 아무리 높아도 자외선 차단제 얘기는 하면 안 돼`;
  codiPrompt += `신발 얘기는 강수확률이 60% 이상일 때만 "비오니까 장화 신고 가!" 덧붙여줘. 그 외에는 신발 얘기는 하면 안 돼`;
  codiPrompt += `꼭 사용자의 옷장에 있는 옷들만 추천해줘. 옷장에 없는 옷은 절대로 추천하면 안 돼.`;

  // prompt를 전달하고 결과를 받아옴
  const result = await callCodiAI(codiPrompt);
  if (result) {
    res.json({ response: result });
  } else {
    res.status(500).json({ error: "실패" });
  }
});

async function callCodiAI(codiPrompt) {
  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o", // gpt 모델 버전
      messages: [
        // 1. GPT 역할 부여 샘플
        {
          role: "system",
          content:
            "당신은 날씨에 따라 어떻게 옷을 입어야 할지 고민이 많은 친구나 동생에게 코디를 알려줘야 한다.",
        },
        {
          role: "user",
          content:
            "당신은 날씨에 따라 어떻게 옷을 입어야 할지 고민이 많은 친구나 동생에게 코디를 알려줘야 한다.",
        },
        {
          role: "assistant",
          content:
            "저는 주변인을 잘 챙기고 꼼꼼한 성격입니다. 날씨에 맞게 옷을 잘 입고 패션에 대해 잘 압니다.",
        },

        // 2. 내가 전달한 prompt
        { role: "user", content: codiPrompt },
      ],
      max_tokens: 1000, // 돈 많이 나갈까봐 글자수 제한;
      temperature: 0.8, // 0.0 ~ 1.0 사이의 값. 0.0에 가까울수록 더 안전한 선택을, 1.0에 가까울수록 더 창의적인 선택을 함.
      top_p: 1, // 0.0 ~ 1.0 사이의 값. 1.0에 가까울수록 다양한 선택을 함.
      frequency_penalty: 0.0, // 0.0 ~ 1.0 사이의 값. 0.0에 가까울수록 더 반복적인 선택을 함.
      presence_penalty: 0.0, // 0.0 ~ 1.0 사이의 값. 0.0에 가까울수록 더 새로운 선택을 함.
    });

    console.log("result: ", result.choices[0].message);
    return result.choices[0].message;
  } catch (e) {
    console.log(e);
  }
}

// //// <<<<<<< 지선 부분 끝

// ---- 마이페이지 - 내 커뮤니티 활동 - 시작 -------

const CommuCollRouter = require("./routes/commuColl.js");
app.use("/mypage", CommuCollRouter);

// ---- 마이페이지 - 내 커뮤니티 활동 - 끝 ---------

// 기본 루트 경로(/)에 대한 GET 요청 핸들러
app.get("/", (req, res) => {
  res.send("app.get 잘 돌아감");
});

// 모든 경로에 대해 React 앱의 index.html 제공 --> 이게 다른 get요청보다 후순위어야 오류가 안 나서 아래로 옮겼습니다! -나영
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
// });

// HTTPS 서버 생성 및 리스닝 - 맥
// const httpsServer = https.createServer(credentials, app);
// httpsServer.listen(PORT, () => {
//   console.log(`${PORT}번 포트 돌아가는 즁~!`);
// });

// HTTP 서버 - 윈도우
app.listen(PORT, () => {
  console.log(`${PORT}번 포트 돌아가는 즁~!`);
});
