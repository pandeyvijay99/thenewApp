const express = require("express");
const router = express.Router();
const { getAgoraDetails } = require("../controller/agora_helper");
const userAuthCheck = require("../middleware/auth");

router
    .route("/getAgoraDetails")
    .post(userAuthCheck, getAgoraDetails);

module.exports = router;