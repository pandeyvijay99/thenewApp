const express = require("express");
const router = express.Router();
const { fetchBlip, uploadProfilePic ,uploadBlipFile,fetchAllBlip,postReaction,postRating,totalReaction,totalRating,fetchGroupRating,blipView,trendingViews,believersBlip,getUserBlipBasedOnWebname} = require("../controller/blip");
const { postComment,postSubComment,fetchComment,fetchSubComment,postCommentReaction,fetchCommentReaction} = require("../controller/comment");
const userAuthCheck = require("../middleware/auth");
router.route("/getBlip").post(fetchBlip);
router.route("/uploadProfilePic").post(uploadProfilePic)
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
router.route("/postCommentReaction").post(postCommentReaction)
router.route("/fetchCommentReaction").post(fetchCommentReaction)
router.route("/fetchGroupRating").post(fetchGroupRating)
router.route("/blipView").post(blipView)
router.route("/trendingViews").post(trendingViews)
router.route("/believersBlip").post(userAuthCheck,believersBlip)
router.route("/getUserBlipBasedOnWebname").post(userAuthCheck,getUserBlipBasedOnWebname)


module.exports = router;
