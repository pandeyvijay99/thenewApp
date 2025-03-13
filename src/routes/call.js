const express = require("express");
const router = express.Router();
const userAuthCheck = require("../middleware/auth");
const { getCall, pushCall } = require("../controller/call");

router
    .route("/getCall")
    .get(userAuthCheck,getCall);

router
    .route("/pushCall")
    .post(userAuthCheck,pushCall);

module.exports = router;