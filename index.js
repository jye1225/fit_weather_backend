const https = require('https'); // Node.js의 HTTPS 모듈
const fs = require('fs'); // Node.js의 파일 시스템 모듈
const express = require("express"); // Express 웹 프레임워크
const cors = require("cors"); // CORS 관련 미들웨어
const mongoose = require("mongoose"); // MongoDB와 연결하기 위한 Mongoose ORM
const bodyParser = require("body-parser"); // 요청의 본문을 파싱하기 위한 미들웨어
const path = require("path"); // 파일 경로 조작을 위한 Node.js 모듈
const authRoutes = require("./routes/auth"); // 인증 관련 라우트 파일

const app = express(); // Express 애플리케이션 생성
const port = 8080; // 서버가 리스닝할 포트 번호

// SSL/TLS 인증서 파일 경로 설정
const privateKey = fs.readFileSync('certs/cert.key', 'utf8');
const certificate = fs.readFileSync('certs/cert.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

// CORS 설정
app.use(cors({
  credentials: true,
  origin: "https://localhost:3000",
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type"],
}));

// express.json() 미들웨어 설정
app.use(express.json());

// MongoDB 연결 설정
const connectUri = "mongodb+srv://fitweather33:0i9znTMj22IV0a8D@cluster0.ehwrc44.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(connectUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Successfully Connected!"))
  .catch((err) => console.log(err.message));

// body-parser 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: "1gb", extended: false }));

// API 라우트 설정
app.use("/api/auth", authRoutes);

// 정적 파일 서빙 설정 (React 앱의 build 폴더)
app.use(express.static(path.join(__dirname, "..", "client", "build")));

// 모든 경로에 대해 React 앱의 index.html 제공
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});

// codiWrite POST 요청 핸들러
app.post("/codiWrite", (req, res) => {
  console.log(req.body);
  res.send("codiWrite 잘 돌아감");
});

// 기본 루트 경로(/)에 대한 GET 요청 핸들러
app.get("/", (req, res) => {
  res.send("app.get 잘 돌아감");
});

// HTTPS 서버 생성 및 리스닝
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () => {
  console.log(`${port}번 포트 돌아가는 즁~!`);
});
