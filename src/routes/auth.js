const express = require("express");
const router = express.Router();
const { signUp, signIn ,webNameCheck,updateUserDetails,getUserDetails,searchWebName,believer,getBeleiver,checkMobileNumbers,userActivity} = require("../controller/auth");
const {  
  isRequestValidated,
  validateSignUpRequest,
  validateSignIpRequest,
} = require("../validators/auth");
const userAuthCheck = require("../middleware/auth");

router.route("/signin").post(validateSignIpRequest, isRequestValidated, signIn);


router.route("/signup").post(validateSignUpRequest, isRequestValidated, signUp);

router.route("/validateWebName").post(webNameCheck);
router.route("/updateUserDetails").put(userAuthCheck,updateUserDetails);
router.route("/getUserDetails").post(userAuthCheck,getUserDetails);
router.route("/believers").post(userAuthCheck,believer)
router.route('/searchWebName').post(searchWebName);
router.route("/getBeleiver").post(userAuthCheck,getBeleiver)
router.route('/checkMobileNumbers').post(checkMobileNumbers)
router.route('/userActivity').post(userAuthCheck,userActivity)

module.exports = router;
