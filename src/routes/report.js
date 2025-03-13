const express = require("express");
const router = express.Router();
const userAuthCheck = require("../middleware/auth");
const { report } = require("../controller/report");

router
    .route("/report")
    .post(userAuthCheck,report);

module.exports = router;