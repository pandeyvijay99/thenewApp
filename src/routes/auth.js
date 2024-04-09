const express = require("express");
const router = express.Router();
const { signUp, signIn ,webNameCheck,updateUserDetails,getUserDetails,searchWebName} = require("../controller/auth");
const {  
  isRequestValidated,
  validateSignUpRequest,
  validateSignIpRequest,
} = require("../validators/auth");
const { fetchBlip, uploadProfilePic ,uploadBlipFile,fetchAllBlip,postReaction,postRating,totalReaction,totalRating} = require("../controller/blip");
const { postComment,postSubComment,fetchComment,fetchSubComment} = require("../controller/comment");
const userAuthCheck = require("../middleware/auth");

router.route("/signin").post(validateSignIpRequest, isRequestValidated, signIn);


router.route("/signup").post(validateSignUpRequest, isRequestValidated, signUp);

router.route("/validateWebName").post(webNameCheck);
router.route("/updateUserDetails").put(userAuthCheck,updateUserDetails);
router.route("/getUserDetails").post(userAuthCheck,getUserDetails);
router.route("/getBlip").post(fetchBlip);
router.route("/uploadProfilePic").post(uploadProfilePic)
router.route('/searchWebName').post(searchWebName);
router.route("/uploadBlipFile").post(userAuthCheck,uploadBlipFile)
router.route("/getAllBlip").post(fetchAllBlip);
router.route("/post-comment").post(userAuthCheck,postComment)
router.route("/post-sub-comment").post(userAuthCheck,postSubComment)
router.route("/fetch-comment").post(fetchComment)
router.route("/fetch-sub-comment").post(fetchSubComment)
router.route("/postReaction").post(userAuthCheck,postReaction)
router.route("/postRating").post(userAuthCheck,postRating)
router.route("/totalReaction").post(totalReaction)
router.route("/totalRating").post(totalRating)

module.exports = router;
