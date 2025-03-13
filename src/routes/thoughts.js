const express = require("express");
const router = express.Router();
const { fetchThoughts ,uploadThoughtsFile,fetchAllThoughts,postReaction,postRating,totalReaction,totalRating,fetchGroupRating,thoughtsView,trendingViews,believersThoughts,getUserThoughtsBasedOnWebname} = require("../controller/thoughts");
const { postComment,postSubComment,fetchComment,fetchSubComment,postCommentReaction,fetchCommentReaction} = require("../controller/thoughtscomment");
const userAuthCheck = require("../middleware/auth");
router.route("/getThoughts").post(fetchThoughts);
// router.route("/uploadProfilePic").post(uploadProfilePic)
router.route("/uploadThoughtsFile").post(userAuthCheck,uploadThoughtsFile)
router.route("/getAllThoughts").post(fetchAllThoughts);
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
router.route("/thoughtsView").post(thoughtsView)
router.route("/trendingViews").post(trendingViews)
router.route("/believersThoughts").post(userAuthCheck,believersThoughts)
router.route("/getUserThoughtsBasedOnWebname").post(getUserThoughtsBasedOnWebname)


module.exports = router;
