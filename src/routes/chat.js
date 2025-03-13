const express = require("express");
const router = express.Router();
const { userChat,getChatHistory,createChatRoom,updateMessageStatus,getUserChat,uploadChatFile,getChatHistoryByChatId} = require("../controller/chat");
const userAuthCheck = require("../middleware/auth");
// router.route("/getBlip").post(fetchBlip);
router.route("/userChat").post(userAuthCheck,userChat)
router.route("/getChatHistory").post(userAuthCheck,getChatHistory)
router.route("/createChatRoom").post(userAuthCheck,createChatRoom)
//router.route("/chatWithSocket").post()    
router.route('/updateMessageStatus').post(userAuthCheck,updateMessageStatus)
router.route('/getUserChat').post(userAuthCheck,getUserChat)
router.route('/uploadChatFile').post(userAuthCheck,uploadChatFile)
router.route('/getChatHistoryByChatId').post(userAuthCheck,getChatHistoryByChatId)

module.exports = router;
