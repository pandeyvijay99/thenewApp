const { StatusCodes } = require("http-status-codes");
const PhotoComment = require("../models/photocomment");
var Photo = require('../models/photo');
const photosubcommentModel = require("../models/photosubcomment")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
// const { DefaultAzureCredential } = require('@azure/identity');
const multer = require('multer');
const path = require('path');
const mongoose = require("mongoose");
const reactionD = require("../helper");
require("dotenv").config();


//Insert Comments

const postComment = async (req, res) => {
  // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
    if (!req.body.comment || !req.body.comment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        statusCode: 1,
        message: "Coment is required", data: null
      });
    }
    if (!req.body.photo_id || !req.body.photo_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        statusCode: 1,
        message: "photo_id is required", data: null
      });
    }
    /*code for getting user_id from  header*/
    const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("token", token);
      user_id = decoded._id;
      console.log("photodecoded ", decoded._id);
    }
    const ObjectId = require('mongoose').Types.ObjectId
    user_id = new ObjectId(user_id)
    console.log("user_id ", user_id)
    const commentData = {
      user_id: user_id,
      photo_id: req.body.photo_id,
      comment: req.body.comment
    }
    debugger;
    const comment = await PhotoComment.create(commentData);

    if (comment) {

      await Photo.findByIdAndUpdate(req.body.photo_id, {
        $inc: { commentCount: 1 }, // Increment commentCount by 1
      });
      console.log('comment data', commentData);

      return res.status(200).send({ statusCode: 0, message: '', data: "Comment added successfully." });

    } else {
      return res.status(StatusCodes.OK).json({ statusCode: 1, message: 'Something went wrong', data: null });
    }



  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};

const postSubComment = async (req, res) => {
  // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
    if (!req.body.comment || !req.body.comment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        statusCode: 1,
        message: "Coment is required", data: null
      });
    }
    const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("token", token);
      comment_user_id = decoded._id;
      console.log("photodecoded ", decoded._id);
    }
    const commentData = [{
      comment_user_id: comment_user_id,
      comment: req.body.comment,
      parent_comment_id: req.body.parent_comment_id

    }]

    debugger;
    const ObjectId = require('mongoose').Types.ObjectId
    // const filter = { _id: new ObjectId( req.body.parent_commnet_id) };
    // console.log("filer is ",filter);
    // const doc = await subcommentModel.findOneAndUpdate(filter, {$push:{subComment:commentData}}, {
    //   returnOriginal: false
    // });

    photosubcommentModel.create(commentData).then((data, err) => {
      if (err) return res.status(StatusCodes.OK).json({ statusCode: 1, message: err, data: null });
    });
    console.log('comment data', commentData);

    return res.status(200).send({ statusCode: 0, message: '', data: "sub-Comment added successfully." });

    //   res.status(StatusCodes.OK).json({statusCode:0,
    //    message:"",   
    //    data: { doc },
    // });

  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};


//upload Photo  File



const fetchComment = async (req, res) => {
  try {
    const { photo_id } = req.body;

    if (!photo_id) {
      return res.status(400).json({
        statusCode: 1,
        message: "photo_id is required",
        data: null,
      });
    }

    const result = await PhotoComment.aggregate([
      {
        $match: { photo_id }, // Match comments by the given photo_id
      },
      {
        $lookup: {
          from: "users", // Join with users collection
          localField: "user_id",
          foreignField: "_id",
          as: "user_details",
        },
      },
      {
        $lookup: {
          from: "photosubcomments", // Join with subcomments collection
          let: { comment_id: { $toString: "$_id" } },
          pipeline: [
            { $match: { $expr: { $eq: ["$parent_comment_id", "$$comment_id"] } } }
          ],
          as: "subcomments",
        },
      },
      {
        $project: {
          _id: 1,
          comment: 1,
          user_details: { $arrayElemAt: ["$user_details", 0] },
          createdAt: 1,
          updatedAt: 1,
          reactionCount: { $size: "$commentReaction" }, // Count reactions for the comment
          subCommentCount: { $size: "$subcomments" },   // Count subcomments
          subComments: {
            $map: {
              input: "$subcomments",
              as: "sub",
              in: {
                _id: "$$sub._id",
                comment: "$$sub.comment",
                comment_user_id: "$$sub.comment_user_id",
                reactionCount: { $size: "$$sub.commentReaction" }, // Count reactions for each sub-comment
              },
            },
          },
        },
      },
    ]);

    const totalCount = result.length;

    if (totalCount > 0) {
      return res.status(200).json({
        statusCode: 0,
        message: "",
        data: { result, totalCount },
      });
    } else {
      return res.status(200).json({
        statusCode: 1,
        message: "No comments found for this note.",
        data: null,
      });
    }
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({
      statusCode: 1,
      message: "Internal server error",
      data: null,
    });
  }
};

const fetchSubComment = async (req, res) => {

  try {
    if (!req.body.comment_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        statusCode: 1,
        message: "Comment  id is required", data: null
      });
    }
    debugger;
    var limit = req.body.limit
      , offset = Math.max(0, req.body.offset)
    const ObjectId = require('mongoose').Types.ObjectId
    const filter = { parent_comment_id: req.body.comment_id };
    //  const result = await   PhotComment.aggregate([
    //        {
    //            $match:{
    //              _id: new ObjectId( req.body.comment_id)
    //            } // unwind the comments array
    //        },
    //        {
    //           $unwind :"$subComment"         
    //        },
    //        {
    //            $lookup: {
    //                from: "users", // name of the comment collection
    //                localField: "photosubComment.comment_user_id",
    //                foreignField: "_id",
    //                as: "user_details"
    //            }
    //        },
    //        {
    //           $project: {
    //               _id: 1,
    //               subComment: 1,
    //               user_details: {$arrayElemAt:["$user_details",0]},

    //           }
    //       }
    //    ]);

    const result = await photosubcommentModel.aggregate([
      {
        $match: {
          parent_comment_id: req.body.comment_id
        }
      },
      {
        $lookup: {
          from: "users", // name of the comment collection
          localField: "comment_user_id",
          foreignField: "_id",
          as: "user_details"
        }
      },
      {
        $project: {
          _id: 1,
          comment: 1,
          createdAt: 1,
          updatedAt: 1,
          user_details: { $arrayElemAt: ["$user_details", 0] },

        }
      }
    ])
    console.log("data is ", result);
    console.log("data lenght ", result.length);
    if (result.length > 0) {
      let totalCount = result.length;

      if (result) {
        return res.status(StatusCodes.OK).json({
          statusCode: 0, message: "",
          data: { result, totalCount: totalCount }
        });
      } else {
        return res.status(StatusCodes.OK).json({
          statusCode: 1, message: "something went wrong",
          data: null
        })
      }
    } else {
      return res.status(StatusCodes.OK).json({
        statusCode: 1,
        message: "Comment does not exist..!",
        data: null
      });
    }
  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};

/*Post Comment functionality */

const postCommentReaction = async (req, res) => {

  let arr = reactionD.reactionemoji;
  let mapped = arr.map(ele => ele._id);
  let found = mapped.includes(req.body.reaction);
  if (found == true) {
    reactionValue = reactionD.reactionemoji[req.body.reaction].emoji;
  }
  // console.log("found ",found)
  // console.log(reactionD.reactionemoji.includes(req.body.reaction)); // true

  try {
    debugger;
    console.log("inside validation ")
    if (!req.body.reaction || !req.body.reaction) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        statusCode: 1,
        message: "reaction is required", data: null
      });
    }
    if (!req.body.comment_id || !req.body.comment_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        statusCode: 1,
        message: "comment_id is required", data: null
      });
    }
    /*code for getting user_id from  header*/
    const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("token", token);
      user_id = decoded._id;
      console.log("comment user decoded ", decoded._id);
    }
    /*reactions */

    /**/
    const ObjectId = require('mongoose').Types.ObjectId
    user_id = new ObjectId(user_id)
    console.log("user_id ", user_id)
    const commentReaction = {
      reaction_user_id: user_id,
      reaction: req.body.reaction,
      reactionValue: reactionValue
    }
    debugger;
    // const ObjectId = require('mongoose').Types.ObjectId
    const filter = { _id: new ObjectId(req.body.comment_id) };
    console.log("filer is ", filter);
    const result = await PhotoComment.findOneAndUpdate(filter, { $push: { commentReaction: commentReaction } }, {
      returnOriginal: false
    });
    return res.status(StatusCodes.OK).json({
      statusCode: 0,
      message: "",
      data: { result },
    });

  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};
/*End of code*/

const fetchCommentReaction = async (req, res) => {

  try {
    debugger;
    console.log("inside count ")

    if (!req.body.comment_id || !req.body.comment_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        statusCode: 1,
        message: "comment_id is required", data: null
      });
    }

    debugger;
    const ObjectId = require('mongoose').Types.ObjectId

    result = await PhotoComment.aggregate([
      {
        $match: { _id: new ObjectId(req.body.comment_id) } // Match the parent document with the given ID
      },
      {
        $project: {
          totalReaction: { $size: '$commentReaction' } // Project a field with the size of the subdocuments array
        }
      }
    ]);
    console.log("result is ", result);
    const pageNumber = req.body.offset ? req.body.offset : 1; // Assuming page number starts from 1
    const pageSize = (req.body.limit) ? (req.body.limit) : 10; // Number of documents per page
    const offset = (pageNumber - 1) * pageSize; // Calculate offset

    grp = await PhotoComment.aggregate([
      {
        $match: { _id: new ObjectId(req.body.comment_id) } // Match the parent document with the given ID
      },
      {
        $unwind: '$commentReaction' // Unwind the subdocuments array
      },
      {
        $lookup: {
          from: "users", // name of the comment collection
          localField: "commentReaction.reaction_user_id",
          foreignField: "_id",
          as: "user_details"
        }
      },
      {
        $unwind: '$user_details'
      },
      {
        $project: {
          // project fields as needed
          "commentReaction.reaction": 1,
          "commentReaction.updatedAt": 1,
          "user_details.webName": 1,
          "user_details.fullName": 1,
          "user_details.profilePicture": 1,// Include other user details you may need
          "commentReaction.reactionValue": 1
        }
      },
      {
        $skip: offset
      },
      {
        $limit: pageSize
      }
    ])
    console.log("photo count reactionwise ", grp)
    return res.status(StatusCodes.OK).json({
      statusCode: 0,
      message: "",
      data: { result, grp },
    });

  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};

module.exports = { postComment, postSubComment, fetchComment, fetchSubComment, postCommentReaction, fetchCommentReaction };