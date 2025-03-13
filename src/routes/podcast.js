const express = require("express");
const router = express.Router();
const { fetchPodcast, uploadPodcastFile, fetchAllPodcast, postPodcastReaction, postPodcastRating, totalPodcastReaction, totalPodcastRating, fetchGroupPodcastRating, podcastView, trendingViews, believersPodcast, recommendedPodcasts, getUserPodcastBasedOnWebname, addToWatchList, removeFromWatchList, fetchPodcastWatchList } = require("../controller/podcast");
const { postPodcastComment, postPodcastSubComment, fetchPodcastComment, fetchPodcastSubComment, postPodcastCommentReaction, fetchPodcastCommentReaction } = require("../controller/podcastcomment");
const userAuthCheck = require("../middleware/auth");
router.route("/getPodcast").post(fetchPodcast);
// router.route("/uploadProfilePic").post(uploadProfilePic)
router.route("/uploadPodcastFile").post(userAuthCheck, uploadPodcastFile)
router.route("/getAllPodcast").post(fetchAllPodcast);
router.route("/post-comment").post(userAuthCheck, postPodcastComment)
router.route("/post-sub-comment").post(userAuthCheck, postPodcastSubComment)
router.route("/fetch-comment").post(fetchPodcastComment)
router.route("/fetch-sub-comment").post(fetchPodcastSubComment)
router.route("/postReaction").post(userAuthCheck, postPodcastReaction)
router.route("/postRating").post(userAuthCheck, postPodcastRating)
router.route("/totalReaction").post(totalPodcastReaction)
router.route("/totalRating").post(totalPodcastRating)
router.route("/postCommentReaction").post(postPodcastCommentReaction)
router.route("/fetchCommentReaction").post(fetchPodcastCommentReaction)
router.route("/fetchGroupPodcastRating").post(fetchGroupPodcastRating)
router.route("/podcastView").post(podcastView)
router.route("/trendingViews").post(trendingViews)
router.route("/believers").post(userAuthCheck, believersPodcast)
router.route("/recommendedPodcasts").post(recommendedPodcasts)
//router.route("/getAllPodcastsWithCount").post(getAllPodcastsWithCount)
router.route("/getUserPodcastBasedOnWebname").post(getUserPodcastBasedOnWebname)
router.route("/addToWatchList").post(addToWatchList)
router.route("/fetchPodcastWatchList").post(fetchPodcastWatchList)
router.route("/removeFromWatchList").post(removeFromWatchList)
module.exports = router;
