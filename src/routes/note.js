const express = require("express");
const router = express.Router();
const { fetchNote ,uploadNoteFile,fetchAllNote,postReaction,postRating,totalReaction,totalRating,fetchGroupRating,noteView,trendingViews,believersNote,getUserNoteBasedOnWebname} = require("../controller/note");
const { postComment,postSubComment,fetchComment,fetchSubComment,postCommentReaction,fetchCommentReaction} = require("../controller/notecomment");
const userAuthCheck = require("../middleware/auth");
router.route("/getNote").post(fetchNote);
// router.route("/uploadProfilePic").post(uploadProfilePic)
router.route("/uploadNoteFile").post(userAuthCheck,uploadNoteFile)
router.route("/getAllNote").post(fetchAllNote);
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
router.route("/noteView").post(noteView)
router.route("/trendingViews").post(trendingViews)
router.route("/believersNote").post(userAuthCheck,believersNote)
router.route("/getUserNoteBasedOnWebname").post(getUserNoteBasedOnWebname)


module.exports = router;
