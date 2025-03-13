const express = require("express");
const router = express.Router();
const { fetchMusic, uploadMusicFile, fetchAllMusic, postMusicReaction, postMusicRating, totalMusicReaction, totalMusicRating, fetchGroupMusicRating, musicView, trendingViews, believersMusic, recommendedMusics, getUserMusicBasedOnWebname, addToWatchList, removeFromWatchList, fetchMusicWatchList } = require("../controller/music");
const { postMusicComment, postMusicSubComment, fetchMusicComment, fetchMusicSubComment, postMusicCommentReaction, fetchMusicCommentReaction } = require("../controller/musiccomment");
const userAuthCheck = require("../middleware/auth");
router.route("/getMusic").post(fetchMusic);
// router.route("/uploadProfilePic").post(uploadProfilePic)
router.route("/uploadMusicFile").post(userAuthCheck, uploadMusicFile)
router.route("/getAllMusic").post(fetchAllMusic);
router.route("/post-comment").post(userAuthCheck, postMusicComment)
router.route("/post-sub-comment").post(userAuthCheck, postMusicSubComment)
router.route("/fetch-comment").post(fetchMusicComment)
router.route("/fetch-sub-comment").post(fetchMusicSubComment)
router.route("/postReaction").post(userAuthCheck, postMusicReaction)
router.route("/postRating").post(userAuthCheck, postMusicRating)
router.route("/totalReaction").post(totalMusicReaction)
router.route("/totalRating").post(totalMusicRating)
router.route("/postCommentReaction").post(postMusicCommentReaction)
router.route("/fetchCommentReaction").post(fetchMusicCommentReaction)
router.route("/fetchGroupMusicRating").post(fetchGroupMusicRating)
router.route("/musicView").post(musicView)
router.route("/trendingViews").post(trendingViews)
router.route("/believers").post(userAuthCheck, believersMusic)
router.route("/recommendedMusics").post(recommendedMusics)
//router.route("/getAllMusicsWithCount").post(getAllMusicsWithCount)
router.route("/getUserMusicBasedOnWebname").post( getUserMusicBasedOnWebname)
router.route("/addToWatchList").post(addToWatchList)
router.route("/fetchMusicWatchList").post(fetchMusicWatchList)
router.route("/removeFromWatchList").post(removeFromWatchList)
module.exports = router;
