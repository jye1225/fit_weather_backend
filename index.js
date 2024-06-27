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
mongoose
  .connect(config.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

// authRoutes 추가
app.use("/api/auth", authRoutes);

app.get("/api/users/", (req, res) => res.send("Hello World! 안녕하세요~"));

// 회원가입 부분
app.post("/api/users/register", (req, res) => {
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
httpsServer.listen(PORT, () => {
  console.log(`${PORT}번 포트 돌아가는 즁~!`);
});

// HTTP 서버 - 명은, 지선
// app.listen(port, () => {
//   console.log(`${port}번 포트 돌아가는 즁~!`);
// });
