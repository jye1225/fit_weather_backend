const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// 포스트 이미지 저장 경로 multer 설정
const postImgUpload = multer.diskStorage({
  destination: "uploads/postImg/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const postImgUp = multer({ storage: postImgUpload });

// 몽구스 모델 호출
const Post = require("../models/postModel");
const Like = require("../models/likeModel");
const CoordiReview = require("../models/coordiReview");

// ---- 커뮤니티 디테일 페이지 정보 get요청
router.get("/postDetail/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const detailData = await Post.findById(postId);
    // console.log(detailData);
    res.json(detailData);
  } catch (error) {
    console.error("디테일 데이터 에러", error);
    res.status(500).json({ message: "디테일DB관련 서버 에러 발생" });
  }
});

// ---- 글 가져오기 get요청
router.get("/getAllPosts", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;// 클라이언트에서 전달한 페이지 번호
    const { filter } = req.query
    console.log('프론트에서 전달', page, filter);

    const firstPageLimit = 15; // 첫 페이지 포스트 수
    const restPageLimit = 10; // 나머지 페이지 포스트 수

    let limit, skip
    if (page === 1) {
      limit = firstPageLimit
      skip = 0
    } else {
      limit = restPageLimit
      skip = firstPageLimit + (page - 2) * restPageLimit
    }

    let query = {}
    if (filter === 'all') {
      query.category = { $in: ['coordi', 'weather'] };
      console.log(query);
    } else {
      query.category = filter;
      console.log(query);
    }

    const postsList = await Post.find(query).sort({ createdAt: -1 })
      .skip(skip).limit(limit)

    const totalPosts = await Post.countDocuments(query);
    const hasMore = totalPosts > skip + postsList.length

    res.json({
      postsList,
      hasMore
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "전체DB 관련 서버 에러 발생" });
  }
});

// ---- 글쓰기 post요청
router.post("/writePost", postImgUp.single("file"), async (req, res) => {
  const { postCate, onReview, title, content, region } = req.body;
  const path = req.file ? req.file.path : null;
  const { userId, username } = req.query
  console.log("글쓰기", postCate, region, onReview, title, content);
  console.log("이미지 경로", path);
  console.log('글쓴이', userId, username);

  try {
    const postDoc = await Post.create({
      userId,
      username,
      category: postCate,
      title,
      content,
      image: path,
      region,
      likeCount: 0,
      commentsCount: 0,
      coordiReview: onReview,
      coordiGood: 0,
      coordiSoso: 0,
      coordiBad: 0,
    });
    res.json(postDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json("글쓰기 서버 에러", { err });
  }
});

// ---- 좋아요 클릭
router.post("/like", async (req, res) => {
  console.log("좋아요클릭", req.body);
  try {
    const { postId, isLike, userId } = req.body;
    console.log(isLike);
    const updateLikeCount = await Post.findByIdAndUpdate(postId, {
      $inc: { likeCount: isLike ? 1 : -1 },
    });

    const likeDoc = await Like.findOne({ userId });

    console.log(likeDoc);

    if (likeDoc) {
      const isPostIdAleady = likeDoc.postId.includes(postId);

      if (isPostIdAleady) {
        const likeListDel = await Like.findOneAndUpdate(
          { userId },
          { $pull: { postId: postId } }
        );
        console.log("좋아요 취소", likeListDel);
      } else {
        const likeListUpdate = await Like.findOneAndUpdate(
          { userId },
          { $push: { postId: postId } }
        );
        console.log("좋아요 추가", likeListUpdate);
      }
    } else {
      const likeListCreate = await Like.create({
        postId: [postId],
        userId,
      });
      console.log("좋아요 리스트 생성", likeListCreate);
    }
    res.json({ success: true, likes: updateLikeCount.likeCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "좋아요 서버 에러" });
  }
});

// ---- 사용자 좋아요 리스트 체크용 get요청
router.get("/likeCheck/:postId", async (req, res) => {
  // const { postId } = req.params
  const { userId } = req.query;
  // console.log('좋아요 체크용 포스트 아이디', postId, userId);
  try {
    const likeList = await Like.findOne({ userId });
    // console.log(likeList);
    res.json(likeList);
  } catch (error) {
    console.error("좋아요 체크용 리스트 서버 에러", { error });
    res.status(500).json("좋아요 체크용 리스트 서버 에러", { error });
  }
});

// ---- 유저 코디리뷰 상태 체크용 get요청
router.get("/reviewCheck/:postId", async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.query;
  console.log("유저 코디리뷰 상태 체크용", postId, userId);
  try {
    const reviewCheckDoc = await CoordiReview.findOne({ postId, userId });
    console.log(reviewCheckDoc);
    res.json(reviewCheckDoc);
  } catch (error) {
    console.error("코디리뷰 상태 체크 get요청 서버 에러", { error });
    res.status(500).json("코디리뷰 상태 체크 get요청 서버 에러", { error });
  }
});

// ---- 코디 리뷰 클릭(카운트 변경)
router.put("/updateReview/:postId", async (req, res) => {
  const { postId } = req.params;
  const { btnType, count } = req.body;

  const updateField = `coordi${btnType}`;
  const updateCount = count === "increment" ? 1 : -1;

  try {
    const updateReview = await Post.findByIdAndUpdate(
      postId,
      { $inc: { [updateField]: updateCount } },
      { new: true }
    );
    // console.log(updateReview);
    res.json(updateReview);
  } catch (error) {
    console.error("코디 리뷰 서버 에서", error);
  }
});

// ---- 코디 리뷰 클릭(유저 코디리뷰 상태 저장)
router.put("/saveCoordiRevw", async (req, res) => {
  const { userId, postId, btnType } = req.body;
  console.log("코디리뷰 상태저장", userId, postId, btnType);
  try {
    const coordiReviewDoc = await CoordiReview.findOne({ userId, postId });
    console.log(coordiReviewDoc);

    if (coordiReviewDoc) {
      //유저의 해당 게시물에 대한 리뷰가 있는 경우 버튼타입 업데이트
      console.log("버튼타입 업데이트");
      const crdiRvUpdate = await CoordiReview.findOneAndUpdate(
        { userId, postId },
        { btnType },
        { new: true }
      );
      res.json(crdiRvUpdate);
    } else {
      console.log("게시물 코디리뷰 생성");
      // 유저의 해당 게시물에 대한 리뷰가 없다면
      const CoordiRevw = await CoordiReview.create({ userId, postId, btnType });
      res.json(CoordiRevw);
    }
  } catch (error) {
    console.error("유저 코디리뷰 상태 저장 서버 에러", { error });
    res.status(500).json("유저 코디리뷰 상태 저장 서버 에러", { error });
  }
});

// ---- 글 삭제
router.delete("/delPost/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    console.log(postId);
    await Post.findByIdAndDelete(postId);
    res.json({ msg: "ok" });
  } catch (error) {
    console.error("포스트 삭제 실패", error);
    res.status(500).json({ error: "포스트 삭제 서버 에러" });
  }
});

// ---- 글 수정
// 수정페이지용 데이터 요청
router.get("/postEdit/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    console.log(postId);
    const postDoc = await Post.findById(postId);
    res.json(postDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "수정 페이지로 이동시 데이터 서버 에러" });
  }
});

// 수정한 데이터 전송(디테일페이지 수정요청 기능)
router.put(
  "/postUpdate/:postId",
  postImgUp.single("file"),
  async (req, res) => {
    const { postId } = req.params;
    const { postCate, onReview, title, content, region, originImgPath } =
      req.body;
    let path = req.file ? req.file.path : null;
    console.log(
      "글수정-----",
      postId,
      postCate,
      region,
      onReview,
      title,
      content
    );
    console.log("원래 이미 경로", originImgPath);
    console.log("이미지 경로", path);

    if (!path && originImgPath) {
      // 새로운 파일이 없고 원래 이미지 있을 때
      path = originImgPath;
      console.log("변경된 경로", path);
    }

    try {
      const postDoc = await Post.findByIdAndUpdate(postId, {
        category: postCate,
        title,
        content,
        image: path,
        region,
        coordiReview: onReview,
      });
      res.json(postDoc);
    } catch (err) {
      console.error("글수정 업데이트 서버 에러", err);
    }
  }
);

module.exports = router;
