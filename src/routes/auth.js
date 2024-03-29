const express = require("express");
const router = express.Router();
const { signUp, signIn ,webNameCheck,updateUserDetails,getUserDetails,searchWebName} = require("../controller/auth");
const {  
  isRequestValidated,
  validateSignUpRequest,
  validateSignIpRequest,
} = require("../validators/auth");
const { fetchBlip, uploadProfilePic ,uploadBlipFile} = require("../controller/blip");
const userAuthCheck = require("../middleware/auth");

router.route("/signin").post(validateSignIpRequest, isRequestValidated, signIn);


router.route("/signup").post(validateSignUpRequest, isRequestValidated, signUp);

router.route("/validateWebName").post(webNameCheck);
router.route("/updateUserDetails").put(userAuthCheck,updateUserDetails);
router.route("/getUserDetails").post(userAuthCheck,getUserDetails);
router.route("/getBlip").post(userAuthCheck,fetchBlip);
router.route("/uploadProfilePic").post(userAuthCheck,uploadProfilePic)
router.route('/searchWebName').post(searchWebName);
router.route("/uploadBlipFile").post(userAuthCheck,uploadBlipFile)


module.exports = router;
