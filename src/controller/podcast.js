const { StatusCodes } = require("http-status-codes");
const watchListSchema = require('../models/watchlist');
const Podcast = require("../models/podcast");
const PodcastComment = require("../models/podcastcomment");
const PodcastSubComment = require("../models/podcastsubcomment");
const sendPushNotification = require('./notificaion');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
// const { DefaultAzureCredential } = require('@azure/identity');
const multer = require('multer');
const path = require('path');
const User = require("../models/auth");
const reactionD = require("../helper");

const Webname = require("../models/webname");
const { json } = require("express");
const logAudit = require("../common")
require("dotenv").config();


//Fetch User Details 

const fetchPodcast = async (req, res) => {
  // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
    if (!req.body.countryCode || !req.body.mobileNumber) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Please Enter Valid Number with country Code",
      });
    }

    //  const data = await Blip.find({ mobileNumber: req.body.mobileNumber });
    const result = await Podcast.aggregate([
      {
        $match: {
          mobileNumber: req.body.mobileNumber
        } // unwind the comments array
      },
      {
        $lookup: {
          from: "users", // name of the comment collection
          localField: "mobileNumber",
          foreignField: "mobileNumber",
          as: "user_details"
        }
      },
      {
        $project: {
          _id: 1,
          tags: 1,
          hashtag: 1,
          user_details: {
            fullName: 1,
            profilePicture: 1,
            _id: 1,
            webName: 1
            // include other fields from user collection as needed
          }
        }
      }
    ]);
    console.log("data is ", result);
    // console.log("user details ",user)
    if (result) {
      console.log("user ", result);
      return res.status(StatusCodes.OK).json({
        statusCode: 0, message: "",
        data: result
      });

    } else {
      return res.status(StatusCodes.OK).json({
        statusCode: 1,
        message: "Podcast does not exist..!",
        data: null
      });
    }
  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};



const uploadPodcastFile = async (req, res) => {
  let file = "";
  let podcast_thumbnail = "";
  if (req.files) {
    file = req.files.file;
    podcast_thumbnail = req.files.thumbnail;
  } else {
    return res.status(400).send({ statusCode: 1, message: 'Seems file is not', data: null });
  }
  const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
  let mobileNumber = ""
  debugger
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
    console.log("token", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    mobileNumber = decoded.mobileNumber;
    podcast_user_id = decoded._id
    console.log("podcastdecoded ", decoded.mobileNumber);
  }


  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });
  const accountName = process.env.ACCOUNT_NAME;
  const accountKey = process.env.KEY_DATA;
  const containerName = process.env.PODCAST_CONTAINER;
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);
  // const file = req.files.file;

  if (!file) {
    return res.status(400).send({ statusCode: 1, message: 'No file uploaded.', data: null });
  } else if (file.size > (1024 * 1024 * 1024)) {
    return res.status(400).send({ statusCode: 1, message: 'Maximum allowed size is 1GB', data: null });
  }

  // const blobName = file.name;
  const stream = file.data;
  const thumbnail_stream = podcast_thumbnail.data;
  const originalFileName = path.basename(file.name);
  const currentDate = Date.now();

  // const folderName =
  const originalBlobName = podcast_user_id + "/" + currentDate + "/" + originalFileName;
  const blockBlobClient = containerClient.getBlockBlobClient(originalBlobName);

  /*thumbnail */
  const originalThumbnailFileName = path.basename(podcast_thumbnail.name);
  const originalThumbnailBlobName = podcast_user_id + "/" + currentDate + "/" + originalThumbnailFileName;
  const blockThumbnailBlobClient = containerClient.getBlockBlobClient(originalThumbnailBlobName);

  // Upload file to Azure Blob Storage
  // const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  try {
    const uploadResponse = await blockBlobClient.upload(stream, stream.length);
    const fileUrl = blockBlobClient.url;
    const uploadThumbnailResponse = await blockThumbnailBlobClient.upload(thumbnail_stream, stream.length);
    const thumbnailFileUrl = blockThumbnailBlobClient.url;
    debugger;
    console.log("fileUrl", fileUrl)
    // const { countryCode, mobileNumber } = req.body;
    debugger;
    let title = req.body.title ? req.body.title : "";
    let description = req.body.captions ? req.body.captions : "";
    let hashtag = req.body.hashtags ? (req.body.hashtags).split(",") : "";
    let tags = req.body.peoples ? (req.body.peoples).split(",") : "";
    const podcastData = {
      title: title,
      podcastUrl: fileUrl,
      thumbnailPodcastUrl: thumbnailFileUrl,
      description: description,
      hashtag: hashtag,
      tags: tags,
      mobileNumber: mobileNumber,
      podcast_user_id: podcast_user_id
    }

    Podcast.create(podcastData).then((data, err) => {
      if (err) res.status(StatusCodes.OK).json({ statusCode: 1, message: err, data: null });
    });
    console.log('File uploaded successfully to Azure Blob Storage:', uploadResponse);
    console.log('File uploaded successfully to Azure Blob Storage:', uploadThumbnailResponse);
    await logAudit("Podcast", "",mobileNumber, fileUrl, thumbnailFileUrl, "", podcast_user_id, description, "")
    const ObjectId = require('mongoose').Types.ObjectId
    await User.updateOne(
      { _id: new ObjectId(podcast_user_id) }, // Match the user ID
      { $inc: { podcast_count: 1 } } // Increment the blip_count
    );
    return res.status(200).send({ statusCode: 0, message: '', data: "File uploaded successfully." });
  } catch (error) {
    console.error("Error uploading to Azure Blob Storage:", error);
    return res.status(500).send({ statusCode: 1, message: 'Error uploading file to Azure Blob Storage.', data: null });
  }

}

const fetchAllPodcast = async (req, res) => {
  // console.log("validation ")
  try {
    debugger;
    const pageNumber = req.body.offset ? req.body.offset : 1; // Assuming page number starts from 1
    const pageSize = (req.body.limit) ? (req.body.limit) : 10; // Number of documents per page
    const offset = (pageNumber - 1) * pageSize; // Calculate offset
    const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
    let arrayOfIds = "";
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("token", token);
      c_r_user = user_id = decoded._id;
      mobileNumber = decoded.mobileNumber ? decoded.mobileNumber : null;
      console.log("user_id ", decoded._id);
      console.log("belie", req.body.isBelieverRequire)
      const ObjectId = require('mongoose').Types.ObjectId
      const user_ids = await User.find({ _id: new ObjectId(user_id) }, { believer: 1 })
      if (req.body.isBelieverRequire == false)
        condition = {}
      else if (req.body.isBelieverRequire && req.body.isBelieverRequire == true) {
        const ObjectId = require('mongoose').Types.ObjectId
        const user_ids = await User.find({ _id: new ObjectId(user_id) }, { believer: 1 })
        console.log("user_ids ", user_ids ? user_ids[0].believer : null);
        arrayOfIds = user_ids ? user_ids[0].believer : null;
        condition = {
          podcast_user_id: {
            $in: user_ids[0].believer
          }
        }
        console.log("condition", condition)

      }
      debugger
      console.log("user_id", arrayOfIds)
      console.log("current_user_id", user_id)
      const result = await Podcast.aggregate([
        {
          $match: condition
        },

        {
          $lookup: {
            from: "users", // name of the comment collection
            localField: "mobileNumber",
            foreignField: "mobileNumber",
            as: "user_details"
          }
        },
        {
          $project: {
            _id: 1,
            podcastUrl: 1,
            thumbnailPodcastUrl: 1,
            tags: 1,
            commentCount: 1,
            hashtag: 1,
            comments: 1,
            user_details: 1,
            views: 1,
            description: 1,
            title: 1,
            totalRating: 1,
            // isInArray: {
            //   $in: ["$_podcast_user_id", arrayOfIds]  // Check if the document's _id is in the provided array of ObjectIds
            // },
            ratingCount: {
              $cond: {
                if: { $isArray: "$podcastRating" }, // Check if reactions field is an array
                then: { $size: "$podcastRating" },   // If reactions is an array, return its size
                else: 0                           // If reactions is not an array or doesn't exist, return 0
              }
            },
            reactionCount: {
              $cond: {
                if: { $isArray: "$podcastReaction" }, // Check if reactions field is an array
                then: { $size: "$podcastReaction" },   // If reactions is an array, return its size
                else: 0                           // If reactions is not an array or doesn't exist, return 0
              }
            },
            believerStatus: {
              $cond: {
                if: { '$in': ["$podcast_user_id", user_ids[0].believer] }, // Check if reactions field is an array
                then: true,   // If reactions is an array, return its size
                else: false                        // If reactions is not an array or doesn't exist, return 0
              }
            },
            // podcastCount: {
            //    $size: '$podcast_user_id' 
            // },
            createdAt: 1,
            updatedAt: 1

          }
        },
        { "$sort": { "_id": -1 } },
        {
          $skip: offset
        },
        {
          $limit: pageSize
        }
      ]);
      debugger;
      // const totalComment = await PodcastComment.aggregate([
      //   {
      //     $match: condition
      //   },
      //   {
      //     $group: {
      //       _id: '$podcast_id',
      //       count: { $sum: 1 } // this means that the count will increment by 1
      //     }
      //   }
      // ]);
      debugger;
      const podcastCount = await Podcast.find({ podcast_user_id: user_id }).count();
      console.log("podcast count ", podcastCount);
      if (result) {
        console.log("user ", result);
        return res.status(StatusCodes.OK).json({
          statusCode: "0", message: "",
          data: { result, podcastCount }
        });

      } else {
        return res.status(StatusCodes.OK).json({
          statusCode: 1,
          message: "Podcast does not exist..!",
          data: null
        });
      }
    }

    else {
      const result = await Podcast.aggregate([
        {
          $lookup: {
            from: "users", // name of the comment collection
            localField: "mobileNumber",
            foreignField: "mobileNumber",
            as: "user_details"
          }
        },
        {
          $project: {
            _id: 1,
            podcastUrl: 1,
            thumbnailPodcastUrl: 1,
            tags: 1,
            hashtag: 1,
            comments: 1,
            user_details: 1,
            views: 1,
            totalRating: 1,
            description: 1,
            title: 1,
            commentCount: 1,
            ratingCount: {
              $cond: {
                if: { $isArray: "$podcastRating" }, // Check if reactions field is an array
                then: { $size: "$podcastRating" },   // If reactions is an array, return its size
                else: 0                           // If reactions is not an array or doesn't exist, return 0
              }
            },
            reactionCount: {
              $cond: {
                if: { $isArray: "$podcastReaction" }, // Check if reactions field is an array
                then: { $size: "$podcastReaction" },   // If reactions is an array, return its size
                else: 0                           // If reactions is not an array or doesn't exist, return 0
              }
            },
            //  podcastCount : {
            //     $size: '$podcast_user_id' 
            //  },
            createdAt: 1,
            updatedAt: 1
          }
        },
        { "$sort": { "_id": -1 } },
        {
          $skip: offset
        },
        {
          $limit: pageSize
        }
      ]);
      debugger;
      // const totalComment = await PodcastComment.aggregate([
      //   {
      //     $group: {
      //       _id: '$podcast_id',
      //       count: { $sum: 1 } // this means that the count will increment by 1
      //     }
      //   }
      // ]);
      const podcastCount = await Podcast.aggregate([
        {
          $group: {
            _id: "$podcast_user_id", // Group by column1
            // Example: Summing up column2 for each group
            count: { $sum: 1 } // Example: Counting the number of documents in each group
          }
        }
      ])
      if (result) {
        console.log("user ", result);
        return res.status(StatusCodes.OK).json({
          statusCode: "0", message: "",
          data: { result, podcastCount }
        });

      } else {
        return res.status(StatusCodes.OK).json({
          statusCode: 1,
          message: "Podcast does not exist..!",
          data: null
        });
      }
    }
  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};
/*Post Reaction functionality */

const postPodcastReaction = async (req, res) => {
  // console.log("validation ")
  // console.log("helperdata ",reactionD.reactionemoji[4]._id);
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
        message: "reaction is required",
      });
    }
    if (!req.body.podcast_id || !req.body.podcast_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "podcast_id is required",
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
      console.log("podcastdecoded ", decoded._id);
    }
    /*reactions */

    /**/
    const ObjectId = require('mongoose').Types.ObjectId
    user_id = new ObjectId(user_id)
    console.log("user_id ", user_id)
    const podcastReaction = {
      reaction_user_id: user_id,
      reaction: req.body.reaction,
      reactionValue: reactionValue
    }
    debugger;
    // const ObjectId = require('mongoose').Types.ObjectId
    const filter = { _id: new ObjectId(req.body.podcast_id) };
    console.log("filer is ", filter);
    const result = await Podcast.findOneAndUpdate(filter, { $push: { podcastReaction: podcastReaction } }, {
      returnOriginal: false
    });
    sendPushNotification(result.podcast_user_id, user_id, "podcastReaction", req.body.podcast_id);
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
/*Post Reaction functionality */

const postPodcastRating = async (req, res) => {
  // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
    if (!req.body.rating || !req.body.rating) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "reaction is required",
      });
    }
    if (!req.body.podcast_id || !req.body.podcast_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "podcast_id is required",
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
      console.log("Podcastdecoded ", decoded._id);
    }
    const current_user_id = user_id
    const ObjectId = require('mongoose').Types.ObjectId
    user_id = new ObjectId(user_id)
    console.log("user_id ", user_id)
    const podcastRating = {
      rating_user_id: user_id,
      ratingno: req.body.rating
    }
    debugger;
    // const ObjectId = require('mongoose').Types.ObjectId
    const filter = { _id: new ObjectId(req.body.podcast_id) };
    console.log("filer is ", filter);
    // const result = await Podcast.findOneAndUpdate(filter, {$push:{podcastRating:podcastRating}}, {
    //   returnOriginal: false
    // });
    const product = await Podcast.findById({ _id: new ObjectId(req.body.podcast_id) });

    if (!product) {
      return res.status(StatusCodes.OK).json({
        statusCode: 1,
        message: "Podcast Not available",
        data: null,
      });
    }
    debugger
    console.log("product ", product.podcastRating[0] ? product.podcastRating[0].ratingno : "");
    let existingUserRating = product.podcastRating[0] ? product.podcastRating[0].ratingno : 0
    // Calculate the new total rating

    const newTotalRating = (((product.totalRating ? parseFloat(product.totalRating) : 0)) + parseFloat(req.body.rating));
    console.log("newTotalRating", newTotalRating)

    // Update the total rating in the database

    /*End of the code*/

    currentUserRating = await Podcast.aggregate([
      {
        $unwind: "$podcastRating"
      },
      { $match: { "$and": [{ $expr: { $eq: ["$podcastRating.rating_user_id", new ObjectId(user_id)] } }, { _id: new ObjectId(req.body.podcast_id) }] } },

      {
        $project: {
          "podcastRating.ratingno": 1
        }
      }

    ]);
    if (currentUserRating.length > 0) {
      const newTotalRating = (((product.totalRating ? parseFloat(product.totalRating) : 0)) + parseFloat(req.body.rating) - existingUserRating);
      const filterData = {
        "podcastRating.rating_user_id": new ObjectId(user_id),
        _id: new ObjectId(req.body.podcast_id),
        // 'comments.postedBy': 'Specific user',
      };
      const update = {
        $set: {
          'podcastRating.$.ratingno': req.body.rating,
          totalRating: newTotalRating
        },
      };
      const options = { new: true };

      Podcast.findOneAndUpdate(filterData, update, options)
        .then(updatedPost => {
          if (updatedPost) {
            sendPushNotification(updatedPost.podcast_user_id, current_user_id, "podcastRating", req.body.podcast_id);
            return res.status(StatusCodes.OK).json({
              statusCode: 0,
              message: "",
              data: { updatedPost },
            });
          } else {

            return
          }
        })
        .catch(error => {
          console.error('Error updating post:', error);
        });
    } else {

      // console.log("filer is ",filter);
      const result = await Podcast.findOneAndUpdate(filter, { $push: { podcastRating: podcastRating } }, {
        returnOriginal: false
      });
      const updatedProduct = await Podcast.findOneAndUpdate(
        { _id: new ObjectId(req.body.podcast_id) },
        { $set: { totalRating: newTotalRating } },
        { new: true } // Return the updated document
      );
      sendPushNotification(new ObjectId(updatedProduct.podcast_user_id), current_user_id, "podcastRating", req.body.podcast_id);
      return res.status(StatusCodes.OK).json({
        statusCode: 0,
        message: "",
        data: { result },
      });
    }
    //   return res.status(StatusCodes.OK).json({statusCode:0,
    //    message:"",   
    //    data: { result },
    // });

  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};
/*End of code*/
const totalPodcastReaction = async (req, res) => {

  try {
    debugger;
    console.log("inside count ")

    if (!req.body.podcast_id || !req.body.podcast_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "podcast_id is required",
      });
    }

    debugger;
    const ObjectId = require('mongoose').Types.ObjectId

    result = await Podcast.aggregate([
      {
        $match: { _id: new ObjectId(req.body.podcast_id) } // Match the parent document with the given ID
      },
      {
        $project: {
          totalReaction: { $size: '$podcastReaction' } // Project a field with the size of the subdocuments array
        }
      }
    ]);
    console.log("result is ", result);
    const pageNumber = req.body.offset ? req.body.offset : 1; // Assuming page number starts from 1
    const pageSize = (req.body.limit) ? (req.body.limit) : 10; // Number of documents per page
    const offset = (pageNumber - 1) * pageSize; // Calculate offset

    grp = await Podcast.aggregate([
      {
        $match: {
          _id: new ObjectId(req.body.podcast_id)
        },
      },
      {
        $unwind: '$podcastReaction' // Unwind the subdocuments array
      },
      {
        $lookup: {
          from: "users", // name of the comment collection
          localField: "podcastReaction.reaction_user_id",
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
          "podcastReaction.reaction": 1,
          "podcastReaction.updatedAt": 1,
          "user_details.webName": 1,
          "user_details.fullName": 1,
          "user_details.profilePicture": 1,// Include other user details you may need
          "podcastReaction.reactionValue": 1
        }
      },
      {
        $skip: offset
      },
      {
        $limit: pageSize
      }
    ])
    console.log("podcast count reactionwise ", grp)
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

const totalPodcastRating = async (req, res) => {
  // console.log("validation ")
  try {
    debugger;
    console.log("inside count ")

    if (!req.body.podcast_id || !req.body.podcast_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "podcast_id is required",
      });
    }

    debugger;
    const ObjectId = require('mongoose').Types.ObjectId

    //     res.status(StatusCodes.OK).json({statusCode:0,
    //      message:"",   
    //      data: { result },
    //   });
    Ratings = await Podcast.aggregate([
      {
        $match: { _id: new ObjectId(req.body.podcast_id) } // Match the parent document with the given ID
      },
      {
        $unwind: "$podcastRating"
      },
      {
        $group: {
          _id: "$podcastRating.ratingno",        // Group by the 'rating' field
          count: { $sum: 1 }     // Count the number of movies in each group
        }
      },
    ]);
    let currentUserRating = "";
    if (req.body.current_user_id) {
      // userID = new ObjectId(req.body.blip_user_id)

      currentUserRating = await Podcast.aggregate([
        {
          $unwind: "$podcastRating"
        },
        // { $match: { $expr: { $eq: ["$podcastRating.rating_user_id", new ObjectId(req.body.current_user_id)] } } },
        {
          $match: {
            _id: new ObjectId(req.body.podcast_id),
            $expr: {
              $eq: ["$podcastRating.rating_user_id", new ObjectId(req.body.current_user_id)]
            }
          }
        },
        {
          $project: {
            "podcastRating.ratingno": 1
          }
        }

      ]);
    }
    // console.log("loggedIn user",currentUserRating); return;
    console.log("result is ", Ratings);
    // console.log("result is ",result);
    const pageNumber = req.body.offset ? req.body.offset : 1; // Assuming page number starts from 1
    const pageSize = (req.body.limit) ? (req.body.limit) : 10; // Number of documents per page
    const offset = (pageNumber - 1) * pageSize; // Calculate offset
    RatingCount = await Podcast.aggregate([
      {
        $match: {
          _id: new ObjectId(req.body.podcast_id)
        }
      },
      {
        $unwind: '$podcastRating' // Unwind the subdocuments array
      },
      {
        $lookup: {
          from: "users", // name of the comment collection
          localField: "podcastRating.rating_user_id",
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
          "podcastRating.ratingno": 1,
          "podcastRating.updatedAt": 1,
          "user_details.webName": 1,
          "user_details.fullName": 1,
          "user_details.profilePicture": 1,// Include other user details you may need
        }
      },
      {
        $skip: offset
      },
      {
        $limit: pageSize
      }
    ])
    console.log("podcast count ratings ", RatingCount)
    return res.status(StatusCodes.OK).json({
      statusCode: 0,
      message: "",
      data: { Ratings, RatingCount, currentUserRating },
    });

  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};
/**/

const fetchGroupPodcastRating = async (req, res) => {
  // console.log("validation ")
  try {
    debugger;
    console.log("inside count ")

    if (!req.body.podcast_id || !req.body.podcast_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        statusCode: 1,
        message: "podcast_id is required", data: null
      });
    }

    debugger;
    const ObjectId = require('mongoose').Types.ObjectId


    // console.log("result is ",result);
    const pageNumber = req.body.offset ? req.body.offset : 1; // Assuming page number starts from 1
    const pageSize = (req.body.limit) ? (req.body.limit) : 10; // Number of documents per page
    const offset = (pageNumber - 1) * pageSize; // Calculate offset
    RatingCount = await Podcast.aggregate([
      {
        $match: {
          _id: new ObjectId(req.body.podcast_id)
        }
      },
      {
        $unwind: '$podcastRating' // Unwind the subdocuments array
      },
      {
        $group: {
          _id: '$podcastRating.ratingno',
          count: { $sum: 1 }
        },
      }
    ])
    console.log("podcast count ratings ", RatingCount)
    return res.status(StatusCodes.OK).json({
      statusCode: 0,
      message: "",
      data: RatingCount
    });

  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};
/*Blip Views */
const podcastView = async (req, res) => {
  // console.log("validation ")
  try {
    debugger;
    console.log("inside count ")

    if (!req.body.podcast_id || !req.body.podcast_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "podcast_id is required",
      });
    }

    debugger;
    const ObjectId = require('mongoose').Types.ObjectId


    const conditions = { _id: new ObjectId(req.body.podcast_id) };

    // Define the update operation
    const update = { $inc: { views: 1 } }; // $inc is used to increment a value

    // Options to findOneAndUpdate method (optional)
    const options = {
      new: true, // return the modified document rather than the original
    };
    viewCount = await Podcast.findOneAndUpdate(conditions, update, options);
    // viewCount = await Blip.findOneAndUpdate({ _id: new ObjectId(req.body.blip_id) },{ $inc: { views: 1 } }, {new: true });
    console.log("podcast views ", viewCount)
    return res.status(StatusCodes.OK).json({
      statusCode: 0,
      message: "",
      data: viewCount
    });

  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }
};



/*Trending Blip  */
const trendingViews = async (req, res) => {
  const pipeline = [
    {
      $project: {
        views: 1,
        ratingCount: {
          $cond: {
            if: { $isArray: "$podcastRating" }, // Check if reactions field is an array
            then: { $size: "$podcastRating" },   // If reactions is an array, return its size
            else: 0                           // If reactions is not an array or doesn't exist, return 0
          }
        },// Calculate total ratings for each podcast
      }
    },
    {
      $sort: {
        views: -1, // Sort by views in descending order
        totalRatings: -1 // Sort by total ratings in descending order
      }
    }
  ];
  debugger
  // Execute aggregation
  Podcast.aggregate(pipeline)
    .then(results => {
      console.log('Results:', results);
      return res.status(StatusCodes.OK).json({
        statusCode: 0,
        message: "",
        data: results
      });

    })
    .catch(error => {
      console.error('Error:', error);
      return res.status(StatusCodes.OK).json({
        statusCode: 1,
        message: "something went wrong",
        data: null
      });
    });
};

/*BelieversBlip Functionality*/
const believersPodcast = async (req, res) => {
  // console.log("validation ")

  try {
    debugger;
    console.log("inside validation ")
    /*code for getting user_id from  header*/
    const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("token", token);
      user_id = decoded._id;
      console.log("user_id  ", decoded._id);
    }
    const ObjectId = require('mongoose').Types.ObjectId
    const user_ids = User.find({ _id: new ObjectId(user_id) }, { believer: 1 })
    console.log("user_ids ", user_ids);
    // return;
    //  const data = await Blip.find({});
    const result = await Podcast.aggregate([
      {
        $project: {
          _id: 1,
          podcastUrl: 1,
          tags: 1,
          hashtag: 1,
          comments: 1,
          // ratingCount: { $size: '$blipRating' }, // Count of ratings sub-documents
          ratingCount: {
            $cond: {
              if: { $isArray: "$podcastRating" }, // Check if reactions field is an array
              then: { $size: "$podcastRating" },   // If reactions is an array, return its size
              else: 0                           // If reactions is not an array or doesn't exist, return 0
            }
          },
          reactionCount: {
            $cond: {
              if: { $isArray: "$podcastReaction" }, // Check if reactions field is an array
              then: { $size: "$podcastReaction" },   // If reactions is an array, return its size
              else: 0                           // If reactions is not an array or doesn't exist, return 0
            }
          },
        }
      }
    ]);
    debugger;
    const totalComment = await PodcastComment.aggregate([
      {
        $group: {
          _id: '$podcast_id',
          count: { $sum: 1 } // this means that the count will increment by 1
        }
      }
    ]);

    if (result) {
      console.log("user ", result);
      return res.status(StatusCodes.OK).json({
        statusCode: "0", message: "",
        data: { result, totalComment }
      });

    } else {
      return res.status(StatusCodes.OK).json({
        statusCode: 1,
        message: "Podcast does not exist..!",
        data: null
      });
    }
  } catch (error) {
    console.log("catch ", error);
    //  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
    return res.status(StatusCodes.OK).json({
      statusCode: 1,
      message: "Podcast does not exist..!",
      data: null
    });
  }
};
/*End of the code*/
/*Recommended Podcast*/
const recommendedPodcasts = async (req, res) => {
  let limit = req.body.limmit ? req.body.limmit : 10;
  let offset = req.body.offset ? req.body.offset : 0;
  try {
    const result = await Podcast.find({}).skip(offset).limit(limit)
    return res.status(StatusCodes.OK).json({
      statusCode: "0", message: "",
      data: { result }
    });
  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
  }

};

const getAllPodcastsWithCount = async (req, res) => {
  let limit = req.body.limmit ? req.body.limmit : 10;
  let offset = req.body.offset ? req.body.offset : 0;
  debugger;
  let results = await Podcast.aggregate([
    {
      $lookup: {
        from: "users", // name of the comment collection
        localField: "_id",
        foreignField: "podcast_user_id",
        as: "user_details"
      }
    },
    {
      $unwind: '$user_details'
    },
    {
      $group: {
        _id: '$_id',
        userDetails: { $first: '$user_details' },
        podcasts: { $push: { title: '$title', description: '$description' } },
        podcastCount: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        userDetails: 1,
        podcasts: 1,
        podcastCount: 1
      }
    }
  ])
    .then(results => {
      console.log(results);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 0, message: "", data: { results } });

    })
    .catch(error => {
      console.error(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
    });
};

// const getUserPodcastBasedOnWebname = async (req, res) => {
//   // console.log("validation ")
//   try {
//     debugger;
//     const pageNumber = req.body.offset ? req.body.offset : 1; // Assuming page number starts from 1
//     const pageSize = (req.body.limit) ? (req.body.limit) : 10; // Number of documents per page
//     const offset = (pageNumber - 1) * pageSize; // Calculate offset
//     const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
//     let arrayOfIds = "";
//     if (authHeader) {
//       const token = authHeader.split(' ')[1];
//       if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       user_id = decoded._id;
//       mobileNumber = decoded.mobileNumber ? decoded.mobileNumber : null;
//       console.log("user_id ", decoded._id);
//       const ObjectId = require('mongoose').Types.ObjectId
//       let user_details = await User.findOne({ webName: req.body.webName });
//       Did = (user_details._id).toString();
//       const filter = { podcast_user_id: Did };
//       console.log("user details ", filter);
//       arrayOfIds = user_details.believer ? user_details.believer : "";
//       console.log("user_id", arrayOfIds)
//       const podcasts = await Podcast.aggregate([
//         {
//           $match: filter
//         },
//         {
//           $project: {
//             _id: 1,
//             podcastUrl: 1,
//             thumbnailPodcastUrl: 1,
//             tags: 1,
//             hashtag: 1,
//             comments: 1,
//             views: 1,
//             description: 1,
//             commentCount: 1,
//             title: 1,
//             totalRating: { $sum: "$podcastRating.ratingno" },
//             believerStatus: {
//               $cond: {
//                 if: { '$in': [user_id, arrayOfIds] }, // Check if reactions field is an array
//                 then: true,   // If reactions is an array, return its size
//                 else: false                        // If reactions is not an array or doesn't exist, return 0
//               }
//             },
//             ratingCount: {
//               $cond: {
//                 if: { $isArray: "$podcastRating" }, // Check if reactions field is an array
//                 then: { $size: "$podcastRating" },   // If reactions is an array, return its size
//                 else: 0                           // If reactions is not an array or doesn't exist, return 0
//               }
//             },
//             reactionCount: {
//               $cond: {
//                 if: { $isArray: "$podcastReaction" }, // Check if reactions field is an array
//                 then: { $size: "$podcastReaction" },   // If reactions is an array, return its size
//                 else: 0                           // If reactions is not an array or doesn't exist, return 0
//               }
//             },

//             createdAt: 1,
//             updatedAt: 1

//           }
//         },
//         { "$sort": { "_id": -1 } },
//         {
//           $skip: offset
//         },
//         {
//           $limit: pageSize
//         }
//       ]);
//       debugger;

//       if (user_details) {
//         //  console.log("user ", userDetails);
//         return res.status(StatusCodes.OK).json({
//           statusCode: "0", message: "",
//           data: { result: { user_details, podcasts } }
//         });

//       }
//     }


//   } catch (error) {
//     console.log("catch ", error);
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error, data: null });
//   }
// };

const getUserPodcastBasedOnWebname = async (req, res) => {
  debugger
  try {
    const pageNumber = req.body.offset ? req.body.offset : 1; // Assuming page number starts from 1
    const pageSize = req.body.limit ? req.body.limit : 10; // Number of documents per page
    const offset = (pageNumber - 1) * pageSize; // Calculate offset
    const authHeader = req.headers.authorization || null;

    let arrayOfIds = "";
    let projection = {
      _id: 1,
      musicUrl: 1,
      thumbnailMusicUrl: 1,
      views: 1,
      description: 1,
      totalRating: { $sum: "$podcastRating.ratingno" },
      commentCount: 1,
      ratingCount: {
        $cond: {
          if: { $isArray: "$podcastRating" },
          then: { $size: "$podcastRating" },
          else: 0,
        },
      },
      reactionCount: {
        $cond: {
          if: { $isArray: "$podcastReaction" },
          then: { $size: "$podcastReaction" },
          else: 0,
        },
      },
      createdAt: 1,
      updatedAt: 1,
    };

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (!token)
        return res.status(403).send({
          statusCode: 1,
          message: "Access denied.",
          data: null,
        });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user_id = decoded._id;

      const user_details = await User.findOne({ webName: req.body.webName });
      const Did = user_details._id.toString();
      const filter = { podcast_user_id: Did };
      arrayOfIds = user_details.believer || "";

      // Add `believerStatus` to the projection only if `authHeader` exists
      projection.believerStatus = {
        $cond: {
          if: { $in: [user_id, arrayOfIds] },
          then: true,
          else: false,
        },
      };

      const podcasts = await Podcast.aggregate([
        { $match: filter },
        { $project: projection },
        { $sort: { _id: -1 } },
        { $skip: offset },
        { $limit: pageSize },
      ]);

      if (user_details) {
        return res.status(StatusCodes.OK).json({
          statusCode: "0",
          message: "",
          data: { result: { user_details, podcasts } },
        });
      }
    } else {
      const user_details = await User.findOne({ webName: req.body.webName });
      const Did = user_details._id.toString();
      const filter = { podcast_user_id: Did };

      const podcasts = await Podcast.aggregate([
        { $match: filter },
        { $project: projection }, // No `believerStatus` included in projection
        { $sort: { _id: -1 } },
        { $skip: offset },
        { $limit: pageSize },
      ]);

      if (user_details) {
        return res.status(StatusCodes.OK).json({
          statusCode: "0",
          message: "",
          data: { result: { user_details, podcasts } },
        });
      }
    }
  } catch (error) {
    console.error("catch", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ statusCode: 1, message: error.message, data: null });
  }
};
const addToWatchList = async (req, res) => {

  try {
    console.log(req.body);
    const watchlist = await watchListSchema.create(req.body);

    if (!watchlist) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: "Failed To Add", data: null });
    }
    return res.status(StatusCodes.OK).json({
      statusCode: "0", message: "Added to watch list"
    });
  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error.message, data: null });
  }
}

const removeFromWatchList = async (req, res) => {

  try {
    console.log(req.body);
    const watchlist = await watchListSchema.deleteOne(req.body);

    if (!watchlist) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: "Failed To Add", data: null });
    }
    return res.status(StatusCodes.OK).json({
      statusCode: "0", message: "Removed from watch list"
    });
  } catch (error) {
    console.log("catch ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error.message, data: null });
  }
}

// const fetchPodcastWatchList = async (req, res) => {
//   try {
//     const { userId, type } = req.body;
//     console.log("userId and type", userId, type);
//     const page = parseInt(req.query.page) || 1;
//     const limit = 5;
//     const skip = (page - 1) * limit;

//     const ObjectId = require('mongoose').Types.ObjectId
//     let user_id = new ObjectId(userId)
//     console.log(user_id);
//     let fromCollection = type+"s";
//     console.log("collectioname ",fromCollection)
//     const watchlist = await watchListSchema.aggregate([
//       {
//         $lookup: {
//           from: fromCollection,
//           localField: "contentID",
//           foreignField: "_id",
//           as: fromCollection+"Details"
//         },

//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "userDetails"
//         },

//       },
//       {
//         $unwind: "$userDetails"
//       },
//       {
//         $unwind: "$"+fromCollection+"Details"
//       },
//       {
//         $project: {
//           _id: 1,
//           "podcastDetails.podcastUrl": 1,
//           "podcastDetails.thumbnailPodcastUrl": 1,
//           "podcastDetails.tags": 1,
//           "podcastDetails.hashtag": 1,
//           "podcastDetails.comments": 1,
//           "podcastDetails.user_details": 1,
//           "podcastDetails.views": 1,
//           "podcastDetails.description": 1,
//           "podcastDetails.title": 1,
//           "podcastDetails.totalRating": 1,
//           // isInArray: {
//           //   $in: ["$_podcast_user_id", arrayOfIds]  // Check if the document's _id is in the provided array of ObjectIds
//           // },
//           ratingCount: {
//             $cond: {
//               if: { $isArray: "$podcastDetails.podcastRating" }, // Check if reactions field is an array
//               then: { $size: "$podcastDetails.podcastRating" },   // If reactions is an array, return its size
//               else: 0                           // If reactions is not an array or doesn't exist, return 0
//             }
//           },
//           reactionCount: {
//             $cond: {
//               if: { $isArray: "$podcastDetails.podcastReaction" }, // Check if reactions field is an array
//               then: { $size: "$podcastDetails.podcastReaction" },   // If reactions is an array, return its size
//               else: 0                           // If reactions is not an array or doesn't exist, return 0
//             }
//           },
//           believerStatus: {
//             $cond: {
//               if: { '$in': ["$podcastDetails.podcast_user_id", "$userDetails.believer"] }, // Check if reactions field is an array
//               then: true,   // If reactions is an array, return its size
//               else: false                        // If reactions is not an array or doesn't exist, return 0
//             }
//           },
//           // podcastCount: {
//           //    $size: '$podcast_user_id' 
//           // },
//           createdAt: 1,
//           updatedAt: 1,
//           userDetails: 1,
//           // podcastDetails:1

//         }
//       },
//       {
//         $skip: skip
//       },
//       {
//         $limit: limit
//       },
//     ]);

//     return res.status(StatusCodes.OK).json({
//       statusCode: "0",
//       message: "Found watch list",
//       data: watchlist
//     });
//   } catch (error) {
//     console.log("catch ", error);
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       statusCode: 1,
//       message: error.message,
//       data: null
//     });
//   }
// };

// const fetchPodcastWatchList = async (req, res) => {
//   try {
//     const { userId, type } = req.body;
//     console.log("userId and type", userId, type);

//     // Validate the type (should be either "podcast" or "photo")
//     if (!["podcast", "photo"].includes(type)) {
//       return res.status(400).json({
//         statusCode: 1,
//         message: "Invalid type, it must be either 'podcast' or 'photo'",
//         data: null
//       });
//     }

//     const page = parseInt(req.query.page) || 1;
//     const limit = 5;
//     const skip = (page - 1) * limit;

//     const ObjectId = require('mongoose').Types.ObjectId;
//     let user_id = new ObjectId(userId);
//     console.log("UserId:", user_id);

//     // Determine collection and field details based on type
//     const fromCollection = type === "podcast" ? "podcasts" : "photos";
//     const contentDetailsField = type === "podcast" ? "podcastDetails" : "photoDetails";
//     const contentURLField = type === "podcast" ? "podcastDetails.podcastUrl" : "photoDetails.photoUrl";
//     const ratingField = type === "podcast" ? "podcastRating" : "photoRating";
//     const reactionField = type === "podcast" ? "podcastReaction" : "photoReaction";
//     const userField = type === "podcast" ? "podcast_user_id" : "photo_user_id";

//     console.log("Collection Name:", fromCollection);

//     const watchlist = await watchListSchema.aggregate([
//       {
//         $lookup: {
//           from: fromCollection,
//           localField: "contentID",
//           foreignField: "_id",
//           as: `${contentDetailsField}`
//         }
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "userId",
//           foreignField: "_id",
//           as: "userDetails"
//         }
//       },
//       {
//         $unwind: "$userDetails"
//       },
//       {
//         $unwind: `$${contentDetailsField}`
//       },
//       {
//         $project: {
//           _id: 1,
//           [`${contentURLField}`]: 1,  // Dynamically project either podcastDetails.podcastUrl or photoDetails.photoURL
//           [`${contentDetailsField}.tags`]: 1,
//           [`${contentDetailsField}.hashtag`]: 1,
//           [`${contentDetailsField}.comments`]: 1,
//           [`${contentDetailsField}.user_details`]: 1,
//           [`${contentDetailsField}.views`]: 1,
//           [`${contentDetailsField}.description`]: 1,
//           [`${contentDetailsField}.title`]: 1,
//           [`${contentDetailsField}.totalRating`]: 1,
//           // Dynamic rating count for podcastRating or photoRating
//           ratingCount: {
//             $cond: {
//               if: { $isArray: `$${contentDetailsField}.${ratingField}` }, // Check if it's an array
//               then: { $size: `$${contentDetailsField}.${ratingField}` },   // Return size if array
//               else: 0 // If not an array, return 0
//             }
//           },

//           // Dynamic reaction count for podcastReaction or photoReaction
//           reactionCount: {
//             $cond: {
//               if: { $isArray: `$${contentDetailsField}.${reactionField}` }, // Check if it's an array
//               then: { $size: `$${contentDetailsField}.${reactionField}` },   // Return size if array
//               else: 0 // If not an array, return 0
//             }
//           },
//           believerStatus: {
//             $cond: {
//               if: { $in: [`$${contentDetailsField}.${userField}`, "$userDetails.believer"] },
//               then: true,
//               else: false
//             }
//           },
//           createdAt: 1,
//           updatedAt: 1,
//           userDetails: 1,
//         }
//       },
//       {
//         $skip: skip
//       },
//       {
//         $limit: limit
//       }
//     ]);

//     return res.status(StatusCodes.OK).json({
//       statusCode: "0",
//       message: "Found watch list",
//       data: watchlist
//     });
//   } catch (error) {
//     console.log("Error:", error);
//     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//       statusCode: 1,
//       message: error.message,
//       data: null
//     });
//   }
// };
const fetchPodcastWatchList = async (req, res) => {
  debugger;
  try {
    const { userId, type } = req.body;
    console.log("userId and type", userId, type);

    // Validate the type (should be either "podcast", "photo", or "blip")
    if (!["podcast", "photo", "blip"].includes(type)) {
      return res.status(400).json({
        statusCode: 1,
        message: "Invalid type, it must be either 'podcast', 'photo', or 'blip'",
        data: null
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const ObjectId = require('mongoose').Types.ObjectId;
    let user_id = new ObjectId(userId);
    console.log("UserId:", user_id);

    // Determine collection and field details based on type
    const fromCollection = type === "podcast" ? "podcasts" : type === "photo" ? "photos" : "blips";
    const contentDetailsField = type === "podcast" ? "podcastDetails" : type === "photo" ? "photoDetails" : "blipDetails";
    const contentURLField = type === "podcast" ? "podcastDetails.podcastUrl" : type === "photo" ? "photoDetails.photoUrl" : "blipDetails.blipUrl";
    const ratingField = type === "podcast" ? "podcastRating" : type === "photo" ? "photoRating" : "blipRating";
    const reactionField = type === "podcast" ? "podcastReaction" : type === "photo" ? "photoReaction" : "blipReaction";
    const userField = type === "podcast" ? "podcast_user_id" : type === "photo" ? "photo_user_id" : "blip_user_id"; // Handle dynamically
    const contentThumbnailURLField = type === "podcast" ? "podcastDetails.thumbnailPodcastUrl" : type === "photo" ? "photoDetails.thumbnailphotoUrl" : "blipDetails.thumbnailBlipUrl";
    console.log("Collection Name:", fromCollection);
    debugger
    const watchlist = await watchListSchema.aggregate([
      {
        $lookup: {
          from: fromCollection,
          localField: "contentID",
          foreignField: "_id",
          as: `${contentDetailsField}`
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $unwind: "$userDetails"
      },
      {
        $unwind: `$${contentDetailsField}`
      },
      {
        $project: {
          _id: 1,
          [`${contentURLField}`]: 1,  // Project podcastUrl, photoUrl, or blipUrl based on type
          [`${contentDetailsField}.tags`]: 1,
          [`${contentDetailsField}.hashtag`]: 1,
          [`${contentDetailsField}.comments`]: 1,
          [`${contentDetailsField}.user_details`]: 1,
          [`${contentDetailsField}.views`]: 1,
          [`${contentDetailsField}.description`]: 1,
          [`${contentDetailsField}.title`]: 1,
          [`${contentDetailsField}.totalRating`]: 1,
          [`${contentThumbnailURLField}`]: 1,
          // Dynamic rating count for podcastRating, photoRating, or blipRating
          ratingCount: {
            $cond: {
              if: { $isArray: `$${contentDetailsField}.${ratingField}` }, // Check if it's an array
              then: { $size: `$${contentDetailsField}.${ratingField}` },   // Return size if array
              else: 0 // If not an array, return 0
            }
          },

          // Dynamic reaction count for podcastReaction, photoReaction, or blipReaction
          reactionCount: {
            $cond: {
              if: { $isArray: `$${contentDetailsField}.${reactionField}` }, // Check if it's an array
              then: { $size: `$${contentDetailsField}.${reactionField}` },   // Return size if array
              else: 0 // If not an array, return 0
            }
          },

          // Believer status based on podcast_user_id, photo_user_id, or blip_user_id
          believerStatus: {
            $cond: {
              if: { $in: [`$${contentDetailsField}.${userField}`, "$userDetails.believer"] },
              then: true,
              else: false
            }
          },

          createdAt: 1,
          updatedAt: 1,
          userDetails: 1,
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    return res.status(StatusCodes.OK).json({
      statusCode: "0",
      message: "Found watch list",
      data: watchlist
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      statusCode: 1,
      message: error.message,
      data: null
    });
  }
};

module.exports = {
  fetchPodcast, uploadPodcastFile, fetchAllPodcast, postPodcastReaction,
  postPodcastRating, totalPodcastReaction, totalPodcastRating, fetchGroupPodcastRating, podcastView, trendingViews
  , believersPodcast, recommendedPodcasts, getAllPodcastsWithCount, getUserPodcastBasedOnWebname, addToWatchList, removeFromWatchList, fetchPodcastWatchList
};