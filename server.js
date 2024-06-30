const express = require("express");
const app = express();
const port = 4000;
const multer = require("multer");
const fs = require("fs"); // Node.js의 파일 시스템 모듈
const path = require("path");

const upload = multer({ dest: "uploads/" });

//--- 예은추가 ---
const mongoose = require("mongoose");
const user = require("./routes/user");
app.use("/user", user);
//---------------

//cors 이슈 해결
const cors = require("cors");
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

app.use(express.json()); //바디파서의 역할

// 기능별 multer 설정하려고 했는데 에러 ㅠ
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     let baseFolder = 'codiUploads/';

//     // 기능별 폴더 선택
//     if (req.body.functionType === 'community') {
//       baseFolder += 'postImg/';
//     }

//     // 폴더가 없는 경우 생성
//     fs.mkdir(baseFolder, { recursive: true });

//     cb(null, baseFolder);
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage: storage });

//-----------커뮤니티 영역------------

// 글 가져오기
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// 글 쓰기
app.post("/postWrite", upload.single("file"), (req, res) => {
  console.log(req.body);
  console.log(req.file);

  if (req.file) {
    const { path, originalname } = req.file;
    // originalname에서 확장자 가져와서 path 재설정
    const part = originalname.split(".");
    const ext = part[part.length - 1];
    const newPath = path + "." + ext;
    fs.renameSync(path, newPath);
    console.log("새로운경로", newPath);
  }

  //   const { title, summary, content } = req.body
  //   const postDoc = await Post.create({
  //     title,
  //     summary,
  //     content,
  //     cover: newPath,
  //     author: info.username,
  //   })

  //   res.json(postDoc)
});

app.listen(PORT, () => {
  console.log(`서버진행중~~~ 포트번호는 ${PORT}`);
});
