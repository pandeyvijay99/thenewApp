const express = require("express");
const router = express.Router();
const { saveMessage,getRecentMessages} = require("../controller/chatsystem");
const userAuthCheck = require("../middleware/auth");
// router.route("/getBlip").post(fetchBlip);
router.route("/userChat").post(userAuthCheck,saveMessage)
router.route("/getChatHistory").post(userAuthCheck,getRecentMessages)
// router.route("/chatWithSocket").post()

module.exports = router;
