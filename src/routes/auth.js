const express = require("express");
const router = express.Router();
const { signUp, signIn, webNameCheck, updateUserDetails, getUserDetails, searchWebName, believer, getBeleiver, checkMobileNumbers, userActivity, exploreData, updateFcmToken, editProfile, updateUserControlCenter, deleteOrSignOut, blockContentOrUser, unblockContentOrUser, getUserBlockList, getBelievedUsers, getBeleivedBy, inviteUser, getUsersWithBelieverAndBelieving,updateVoipToken } = require("../controller/auth");
const { contentDetail, contentSearch, saveRecentSearch, recentSearch, deleteContent } = require("../controller/contentdetails")
const { sendCallNotification } = require("../controller/notificaion")
const {
  isRequestValidated,
  validateSignUpRequest,
  validateSignIpRequest,
} = require("../validators/auth");
const userAuthCheck = require("../middleware/auth");

router.route("/signin").post(validateSignIpRequest, isRequestValidated, signIn);

router.route("/updateFcmToken").post(userAuthCheck, updateFcmToken);

router.route("/editProfile").put(userAuthCheck, editProfile);

router.route("/updateUserControlCenter").put(userAuthCheck, updateUserControlCenter);

router.route("/deleteOrSignOut").post(userAuthCheck, deleteOrSignOut);

router.route("/signup").post(validateSignUpRequest, isRequestValidated, signUp);

router.route("/validateWebName").post(webNameCheck);
router.route("/updateUserDetails").put(userAuthCheck, updateUserDetails);
router.route("/getUserDetails").post( getUserDetails);
router.route("/believers").post(userAuthCheck, believer)
router.route('/searchWebName').post(searchWebName);
router.route("/getBeleiver").post(userAuthCheck, getBeleiver)
router.route('/checkMobileNumbers').post(checkMobileNumbers)
router.route('/userActivity').post( userActivity)
router.route('/exploreData').post(exploreData)
router.route("/blockContentOrUser").post(blockContentOrUser)
router.route("/unblockContentOrUser").post(unblockContentOrUser)
router.route("/getUserBlockList").post(getUserBlockList)
router.route("/ContentDetail").post(contentDetail)
router.route("/contentSearch").post(contentSearch)
router.route("/saveRecentSearch").post(userAuthCheck, saveRecentSearch)
router.route("/recentSearch").post(userAuthCheck, recentSearch)
router.route('/getBelievedUsers').post(userAuthCheck, getBelievedUsers)
router.route("/deleteContent").post(userAuthCheck, deleteContent)
router.route("/getBeleivedBy").post(userAuthCheck, getBeleivedBy)
router.route("/inviteUser").post(userAuthCheck, inviteUser)
router.route('/getUsersWithBelieverAndBelieving').post(userAuthCheck, getUsersWithBelieverAndBelieving)
router.route('/sendNotificationTNA').post(sendCallNotification)
router.route("/updateVoipToken").post(userAuthCheck, updateVoipToken);


module.exports = router;
