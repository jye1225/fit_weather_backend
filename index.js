const https = require("https"); // Node.js의 HTTPS 모듈
const fs = require("fs"); // Node.js의 파일 시스템 모듈
const express = require("express"); // Express 웹 프레임워크
const cors = require("cors"); // CORS 관련 미들웨어
const mongoose = require("mongoose"); // MongoDB와 연결하기 위한 Mongoose ORM
const authRoutes = require("./routes/auth"); // 인증 관련 라우트 파일
const multer = require("multer"); // 파일 업로드를 위한 multer
require("dotenv").config();

const app = express(); // Express 애플리케이션 생성
const port = 8080; // 서버가 리스닝할 포트 번호

// SSL/TLS 인증서 파일 경로 설정
const privateKey = fs.readFileSync("certs/cert.key", "utf8");
const certificate = fs.readFileSync("certs/cert.crt", "utf8");
const credentials = { key: privateKey, cert: certificate };

// CORS 설정
const allowedOrigins = ['http://localhost:3000', 'https://localhost:3000']; //http와 https 모두를 허용하도록 설정
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin)) {
        callback(null, true); // 허용된 출처일 경우 요청을 허용
      } else {
        callback(new Error('Not allowed by CORS')); // 허용되지 않은 출처일 경우 오류 반환
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type"],
  })
);

// express.json() 미들웨어 설정
app.use(express.json());

// MongoDB 연결 설정
const connectUri =
  "mongodb+srv://fitweather33:0i9znTMj22IV0a8D@cluster0.ehwrc44.mongodb.net/fitweather?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(connectUri) //
  .then(() => console.log("몽고디비 연결 성공!")) //
  .catch((err) => console.log(err.message));

//// >>>>> 예은님 부분 시작 - 회원가입, 로그인

const bodyParser = require("body-parser"); // 요청의 본문을 파싱하기 위한 미들웨어
const path = require("path"); // 파일 경로 조작을 위한 Node.js 모듈

// body-parser 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "1gb", extended: false }));

// API 라우트 설정
app.use("/api/auth", authRoutes);

// 정적 파일 서빙 설정 (React 앱의 build 폴더)
app.use(express.static(path.join(__dirname, "..", "client", "build")));

//// <<<<<<< 예은님 부분 끝

//// >>>>>> 나영 부분 시작
app.use('/codiUploads', express.static(path.join(__dirname, 'codiUploads')));//Express 앱에서 정적 파일을 서빙하기 위한 설정: express.static 미들웨어를 사용하여 정적 파일을 서빙할 수 있도록

// codiLogDetail GET
app.get('/codiLogDetail/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const codiLog = await CodiLogModel.findById(id);
    res.json(codiLog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
})

// codiLogList GET

app.get('/codiLogList', async (req, res) => {
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

    const codiLogList = await CodiLogModel.find({ userid: 'userid' }).sort({ codiDate: 1 });
    // console.log(codiLogList);
    res.json(codiLogList); // 생성된 codiLogList를 JSON 형태로 클라이언트에 응답으로 보냄
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }

});


// 멀티파트/form-data 요청 처리를 위한 multer 설정
const storage = multer.diskStorage({
  destination: "codiUploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); //업로드 시간 + path.extname(file.originalname)은 원래 파일의 확장자
  },
});
const upload = multer({ storage: storage });

// codiWrite POST 요청 핸들러

const CodiLogModel = require("./models/codiLog"); // CodiLog 모델을 가져옴

app.post("/codiWrite", upload.single("file"), async (req, res) => {
  // console.log("codiWrite 잘 돌아감", req.file, req.body);

  const { memo, tag, address, maxTemp, minTemp, codiDate } = req.body;
  const { filename, path } = req.file;
  console.log("codiWrite 잘 돌아감", memo, tag, filename, path);

  //⚡︎⚡︎ 로그인 기능 합쳐지면 token 해석이 됐을 때만 실행되도록 수정하기
  try {
    // 새로운 포스트 문서를 생성합니다.
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

    // 생성된 포스트 문서를 JSON 형태로 클라이언트에 응답으로 보냅니다.
    res.json(codiDoc);
  } catch (error) {
    console.error(error);//백 터미널 출력
    res.status(500).json({ error: "Internal Server Error" });//프론 콘솔 출력
  }
});

//// <<<<<<< 나영 부분 끝


// --------------커뮤니티 부분 시작--------------------------

const postRouter = require('./routes/post')
app.use('/posts', postRouter)

// --------------커뮤니티 부분 끝------------------------------



// 기본 루트 경로(/)에 대한 GET 요청 핸들러
app.get("/", (req, res) => {
  res.send("app.get 잘 돌아감");
});

// 모든 경로에 대해 React 앱의 index.html 제공 --> 이게 다른 get요청보다 후순위어야 오류가 안 나서 아래로 옮겼습니다! -나영
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});

// HTTPS 서버 생성 및 리스닝 - 나영
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () => {
  console.log(`${port}번 포트 돌아가는 즁~!`);
});

// HTTP 서버 - 명은, 지선
// app.listen(port, () => {
//   console.log(`${port}번 포트 돌아가는 즁~!`);
// });
