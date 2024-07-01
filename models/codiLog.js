const mongoose = require("mongoose");
const { Schema, model } = mongoose; //mongoose에서 schema를 갖고온다, model 형태로 내보낼것임

const CodiLogSchema = new Schema(
    {
        image: String,
        memo: String,
        tag: [String],
        address: String,

        maxTemp: Number,
        minTemp: Number,
        sky: String,
        codiDate: String,

        userid: String,
        // username: String,
    },
    {
        timestamps: true,
        collection: "userCodiLog", //collection 이름 직접 설정. 안 하면 자동 설정
    }
);

const CodiLogModel = model("CodiLog", CodiLogSchema);
module.exports = CodiLogModel; //내보내기. 외부(index.js)에서 이 모델을 사용