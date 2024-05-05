const express = require("express");
const router = express.Router();
const { fetchPhoto ,uploadPhotoFile,fetchAllPhoto,postReaction,postRating,totalReaction,totalRating,fetchGroupRating,photoView,trendingViews,believersPhoto} = require("../controller/photo");
const { postComment,postSubComment,fetchComment,fetchSubComment,postCommentReaction,fetchCommentReaction} = require("../controller/photocomment");
const userAuthCheck = require("../middleware/auth");
router.route("/getPhoto").post(fetchPhoto);
// router.route("/uploadProfilePic").post(uploadProfilePic)
router.route("/uploadPhotoFile").post(userAuthCheck,uploadPhotoFile)
router.route("/getAllPhoto").post(fetchAllPhoto);
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
router.route("/photoView").post(photoView)
router.route("/trendingViews").post(trendingViews)
router.route("/believersPhoto").post(userAuthCheck,believersPhoto)


module.exports = router;
