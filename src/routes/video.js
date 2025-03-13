const express = require("express");
const router = express.Router();
const { fetchVideo, uploadVideoFile, fetchAllVideo, postVideoReaction, postVideoRating, totalVideoReaction, totalVideoRating, fetchGroupVideoRating, videoView, trendingViews, believersVideo, recommendedVideos, getUserVideoBasedOnWebname, addToWatchList, removeFromWatchList, fetchVideoWatchList } = require("../controller/video");
const { postVideoComment, postVideoSubComment, fetchVideoComment, fetchVideoSubComment, postVideoCommentReaction, fetchVideoCommentReaction } = require("../controller/videocomment");
const userAuthCheck = require("../middleware/auth");
router.route("/getVideo").post(fetchVideo);
// router.route("/uploadProfilePic").post(uploadProfilePic)
router.route("/uploadVideoFile").post(userAuthCheck, uploadVideoFile)
router.route("/getAllVideo").post(fetchAllVideo);
router.route("/post-comment").post(userAuthCheck, postVideoComment)
router.route("/post-sub-comment").post(userAuthCheck, postVideoSubComment)
router.route("/fetch-comment").post(fetchVideoComment)
router.route("/fetch-sub-comment").post(fetchVideoSubComment)
router.route("/postReaction").post(userAuthCheck, postVideoReaction)
router.route("/postRating").post(userAuthCheck, postVideoRating)
router.route("/totalReaction").post(totalVideoReaction)
router.route("/totalRating").post(totalVideoRating)
router.route("/postCommentReaction").post(postVideoCommentReaction)
router.route("/fetchCommentReaction").post(fetchVideoCommentReaction)
router.route("/fetchGroupVideoRating").post(fetchGroupVideoRating)
router.route("/videoView").post(videoView)
router.route("/trendingViews").post(trendingViews)
router.route("/believers").post(userAuthCheck, believersVideo)
router.route("/recommendedVideos").post(recommendedVideos)
//router.route("/getAllVideosWithCount").post(getAllVideosWithCount)
router.route("/getUserVideoBasedOnWebname").post( getUserVideoBasedOnWebname)
router.route("/addToWatchList").post(addToWatchList)
router.route("/fetchVideoWatchList").post(fetchVideoWatchList)
router.route("/removeFromWatchList").post(removeFromWatchList)
module.exports = router;
