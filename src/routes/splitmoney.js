const express = require("express");
const router = express.Router();
const { addUser, findUsersByMobileNumbers } = require("../controller/splitmoney");

router.route("/addUser").post(addUser);

router.route("/findUsersByMobileNumbers").post(findUsersByMobileNumbers);

module.exports = router;