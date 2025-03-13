const express = require("express");
const router = express.Router();
const { fetchAllNotifications, updateStatusForNotification } = require("../controller/inbox");

router
    .route("/getAllNotifications")
    .get(fetchAllNotifications);

router
    .route("/updateNotification")
    .post(updateStatusForNotification);

module.exports = router;