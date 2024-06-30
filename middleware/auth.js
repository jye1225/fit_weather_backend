// 회원가입시 중복확인 기능인데 일단 필요 없어서 주석처리 : 예은

// const { User } = require("../models/User");

// // 아이디 중복 확인
// router.post("/check-id", async (req, res) => {
//   console.log("check-id 요청 수신:", req.body);
//   const { id } = req.body;
//   try {
//     const user = await User.findOne({ id });
//     if (user) {
//       return res.status(400).json({ message: "아이디가 이미 사용 중입니다." });
//     }
//     res.json({ message: "사용 가능한 아이디입니다." });
//   } catch (error) {
//     console.error("check-id 오류:", error);
//     res.status(500).json({ message: "서버 오류입니다." });
//   }
// });

// // 닉네임 중복 확인
// router.post("/check-name", async (req, res) => {
//   console.log("check-name 요청 수신:", req.body);
//   const { name } = req.body;
//   try {
//     const user = await User.findOne({ name });
//     if (user) {
//       return res.status(400).json({ message: "닉네임이 이미 사용 중입니다." });
//     }
//     res.json({ message: "사용 가능한 닉네임입니다." });
//   } catch (error) {
//     console.error("check-name 오류:", error);
//     res.status(500).json({ message: "서버 오류입니다." });
//   }
// });

// // 회원가입
// const createUserSchema = async (userInput) => {
//   const user = await userWithEncodePassword(userInput);
//   return user.save();
// };

// const userWithEncodePassword = async ({ id, name, password, gender }) => {
//   const hash = await bcrypt.hash(password, 10);

//   const user = new User({
//     id,
//     name,
//     password: hash,
//     gender,
//   });
//   return user;
// };

// router.post("/signup", async (req, res, next) => {
//   console.log("signup 요청 수신:", req.body);
//   try {
//     const { id } = req.body;
//     const user = await User.findOne({ id });
//     if (user) {
//       return res.status(400).json({ message: "아이디가 이미 사용 중입니다." });
//     }
//     await createUserSchema(req.body);
//     res.status(200).json({ message: "회원가입에 성공했습니다." });
//   } catch (err) {
//     console.error("signup 오류:", err);
//     res.status(500).json({ message: "회원가입에 실패했습니다." });
//   }
// });

// module.exports = router;
