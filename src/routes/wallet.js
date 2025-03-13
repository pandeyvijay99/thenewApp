const express = require("express");
const router = express.Router();
const { uploadBlessingWallet, getWalletInfo, getDailyHistory, getMonthlyHistory, getTransactionHistory } = require("../controller/wallet");
const userAuthCheck = require("../middleware/auth");

router
    .route("/uploadBlessingWallet")
    .post(userAuthCheck, uploadBlessingWallet);

router
    .route("/getWalletInfo")
    .get(userAuthCheck, getWalletInfo);

router
    .route("/getDailyHistory")
    .get(userAuthCheck, getDailyHistory);
router
    .route("/getMonthlyHistory")
    .get(userAuthCheck, getMonthlyHistory);
router
    .route("/getTransactionHistory")
    .get(userAuthCheck, getTransactionHistory);

module.exports = router;