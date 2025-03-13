const express = require("express");
const router = express.Router();
const { fetchArticle ,uploadArticleFile,fetchAllArticle,postReaction,postRating,totalReaction,totalRating,fetchGroupRating,articleView,trendingViews,believersArticle,getUserArticleBasedOnWebname} = require("../controller/article");
const { postComment,postSubComment,fetchComment,fetchSubComment,postCommentReaction,fetchCommentReaction} = require("../controller/articlecomment");
const userAuthCheck = require("../middleware/auth");
router.route("/getArticle").post(fetchArticle);
// router.route("/uploadProfilePic").post(uploadProfilePic)
router.route("/uploadArticleFile").post(userAuthCheck,uploadArticleFile)
router.route("/getAllArticle").post(fetchAllArticle);
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
router.route("/articleView").post(articleView)
router.route("/trendingViews").post(trendingViews)
router.route("/believersArticle").post(userAuthCheck,believersArticle)
router.route("/getUserArticleBasedOnWebname").post(getUserArticleBasedOnWebname)


module.exports = router;
