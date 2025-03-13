const express = require("express");
const router = express.Router();
const userAuthCheck = require("../middleware/auth");
const { insertCallLog, getCallLogs } = require("../controller/callLogs");

router
    .route("/insertCallLog")
    .post(userAuthCheck,insertCallLog);

router
    .route("/getCallLogs")
    .post(userAuthCheck,getCallLogs);

module.exports = router;