const express = require("express");
const router = express.Router();
const { signUp, signIn ,webNameCheck,updateUserDetails,getUserDetails} = require("../controller/auth");
const {  
  isRequestValidated,
  validateSignUpRequest,
  validateSignIpRequest,
} = require("../validators/auth");
const { fetchBleep } = require("../controller/blip");
const userAuthCheck = require("../middleware/auth");

router.route("/signin").post(validateSignIpRequest, isRequestValidated, signIn);


router.route("/signup").post(validateSignUpRequest, isRequestValidated, signUp);

router.route("/validateWebName").post(userAuthCheck,webNameCheck);
router.route("/updateUserDetails").put(userAuthCheck,updateUserDetails);
router.route("/getUserDetails").post(userAuthCheck,getUserDetails);
router.route("/fetchBleep").post(userAuthCheck,fetchBleep);

module.exports = router;
