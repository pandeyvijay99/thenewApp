const { StatusCodes } = require("http-status-codes");
const User = require("../models/auth");
const Webname = require("../models/webname");
const PhotoComment = require("../models/photocomment")
const blockSchema = require('../models/block');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
const Audit = require("../models/audit")
const moment = require('moment-timezone');
const userControlCenterModel = require('../models/controlCenter')
const mongoose = require("mongoose");

/**
 * @api {post} /api/signin Request User information
 * @apiName signin
 * @apiGroup User
 * @apiParam {coutryCode} {string} CountryCode is required.
 * @apiParam {mobileNumber} {String} MobileNumber is required.
 * 
 */



const contentDetail = async (req, res) => {
  try {
    const { contentId, type } = req.body;
    console.log("contentId and type", contentId, type);

    // Validate the type (should be either "video", "photo", or "blip")
    if (!['blip', 'video', 'photo', 'article', 'thought', 'note', 'music', 'podcast'].includes(type)) {
      return res.status(400).json({
        statusCode: 1,
        message: "Invalid type, it must be either 'video', 'photo', or 'blip'",
        data: null,
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const ObjectId = require('mongoose').Types.ObjectId;
    const _id = new ObjectId(contentId);
    //66e9a388fed6d9fa5bebfa33
    // Determine collection and field details dynamically based on type
    // const fromCollection = type === "video" ? "videos" : type === "photo" ? "photos" : "blips";
    // const fromModel = type === "video" ? "Video" : type === "photo" ? "Photo" : "Blip"; // Model names
    // const contentDetailsField = type === "video" ? "videoDetails" : type === "photo" ? "photoDetails" : "blipDetails";
    // const contentURLField = type === "video" ? "videoUrl" : type === "photo" ? "photoUrl" : "blipUrl";
    // const ratingField = type === "video" ? "videoRating" : type === "photo" ? "photoRating" : "blipRating";
    // const reactionField = type === "video" ? "videoReaction" : type === "photo" ? "photoReaction" : "blipReaction";
    // const userField = type === "video" ? "video_user_id" : type === "photo" ? "photo_user_id" : "blip_user_id";
    // const contentThumbnailURLField = type === "video" ? "thumbnailVideoUrl" : type === "photo" ? "thumbnailphotoUrl" : "thumbnailBlipUrl";
    // console.log("Collection Name:", fromCollection, userField);
    var fromCollection = "";
    var fromModel = "";
    var contentDetailsField = "";
    var contentURLField = "";
    var ratingField = "";
    var reactionField = "";
    var userField = "";
    var contentThumbnailURLField = "";
    var commentCount = "";
    var totalRating = '';
    if (type === "video") {
      fromCollection = "videos";
      fromModel = "Video";
      contentDetailsField = "videoDetails";
      contentURLField = "videoUrl";
      ratingField = "videoRating";
      reactionField = "videoReaction";
      userField = "video_user_id";
      contentThumbnailURLField = "thumbnailVideoUrl";
      contentNameField = "videoDetails.Name";
      commentCount = 'commentCount';
      totalRating = "$videoReaction.ratingno";
    } else if (type === "blip") {
      fromCollection = "blips";
      fromModel = "Blip";
      contentDetailsField = "blipDetails";
      contentURLField = "blipUrl";
      ratingField = "blipRating";
      reactionField = "blipReaction";
      userField = "blip_user_id";
      contentThumbnailURLField = "thumbnailBlipUrl";
      contentNameField = "blipDetails.Name";
      commentCount = 'commentCount';
      totalRating = "$blipRating.ratingno";
    } else if (type === "photo") {
      fromCollection = "photos";
      fromModel = "Photo";
      contentDetailsField = "photoDetails";
      contentURLField = "photoUrl";
      ratingField = "photoRating";
      reactionField = "photoReaction";
      userField = "photo_user_id";
      contentThumbnailURLField = "thumbnailPhotoUrl";
      contentNameField = "photoDetails.Name";
      commentCount = 'commentCount';
      totalRating = "$photoRating.ratingno";
    } else if (type === "article") {
      fromCollection = "articles";
      fromModel = "Article";
      contentDetailsField = "articleDetails";
      contentURLField = "articleUrl";
      ratingField = "articleRating";
      reactionField = "articleReaction";
      userField = "article_user_id";
      contentThumbnailURLField = "thumbnailArticleUrl";
      contentNameField = "articleName";
      commentCount = 'commentCount';
      totalRating = "$articleRating.ratingno";
    } else if (type === "note") {
      fromCollection = "notes";
      fromModel = "Note";
      contentDetailsField = "noteDetails";
      contentURLField = "noteUrl";
      ratingField = "noteRating";
      reactionField = "noteReaction";
      userField = "note_user_id";
      contentThumbnailURLField = "thumbnailNoteUrl";
      contentNameField = "articleName";
      commentCount = 'commentCount';
      totalRating = "$noteRating.ratingno";
    } else if (type === "music") {
      fromCollection = "musics";
      fromModel = "Music";
      contentDetailsField = "musicDetails";
      contentURLField = "musicUrl";
      ratingField = "musicRating";
      reactionField = "musicReaction";
      userField = "music_user_id";
      contentThumbnailURLField = "thumbnailMusicUrl";
      contentNameField = "articleName";
      commentCount = 'commentCount';
      totalRating = "$musicRating.ratingno";
    } else if (type === "podcast") {
      fromCollection = "podcasts";
      fromModel = "Podcast";
      contentDetailsField = "podcastDetails";
      contentURLField = "podcastUrl";
      ratingField = "podcastRating";
      reactionField = "podcastReaction";
      userField = "podcast_user_id";
      contentThumbnailURLField = "thumbnailPodcastUrl";
      contentNameField = "articleName";
      commentCount = 'commentCount';
      totalRating = "$podcastRating.ratingno";
    }

    debugger
    // Check if the model already exists; if not, compile it
    const Model = mongoose.models[fromModel] || mongoose.model(fromModel, new mongoose.Schema({}), fromCollection);

    console.log("Model:", Model);

    const watchlist = await Model.aggregate([
      {
        $match: {
          _id: _id,
        },
      },
      {
        // Add a field where you convert the userField to ObjectId
        $addFields: {
          userFieldAsObjectId: { $toObjectId: `$${userField}` },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userFieldAsObjectId",
          foreignField: "_id",
          as: "user_details",
        },
      },
      {
        $unwind: "$user_details",
      },
      {
        $project: {
          _id: 1,
          [`${contentURLField}`]: 1, // Project URL field dynamically based on type
          [`${contentThumbnailURLField}`]: 1,
          [`${contentNameField}`]: 1,
          [`${commentCount}`]: 1,
          reactionCount: { $size: `$${reactionField}` },
          ratingCount: { $size: `$${ratingField}` },
          tags: 1,
          hashtag: 1,
          views: 1,
          description: 1,
          title: 1,
          totalRating: 1,
          // thumbnailVideoUrl:1,
          // ratingCount: {
          //   $cond: {
          //     if: { $isArray: `$${contentDetailsField}.${ratingField}` }, // Check if it's an array
          //     then: { $size: `$${contentDetailsField}.${ratingField}` }, // Return size if array
          //     else: 0, // If not an array, return 0
          //   },
          // },
          // reactionCount: {
          //   $cond: {
          //     if: { $isArray: `$${contentDetailsField}.${reactionField}` }, // Check if it's an array
          //     then: { $size: `$${contentDetailsField}.${reactionField}` }, // Return size if array
          //     else: 0, // If not an array, return 0
          //   },
          // },
          createdAt: 1,
          updatedAt: 1,
          user_details: 1, // Include user details after the $lookup
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    return res.status(200).json({
      statusCode: "0",
      message: "Found Content Details",
      data: watchlist,
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      statusCode: 1,
      message: error.message,
      data: null,
    });
  }
};
//working Copy

// const contentSearch = async (req, res) => {
//   try {
//     const db = mongoose.connection.db;
//     const searchString = req.body.searchString; // Search string from the request

//     // Define collections and fields to search
//     const allowedCollections = [
//       'blips', 'videos', 'photos', 'users', 'notes', 
//       'thoughts', 'articles', 'musics', 'podcasts', 'chats'
//     ];
//     const searchFields = [
//       "description", "mobileNumber", "comment", 
//       "webName", "fullname", "articleName", "message"
//     ];

//     const results = [];
//     const searchQuery = { 
//       $or: searchFields.map(field => ({ [field]: { $regex: searchString, $options: 'i' } }))
//     };

//     // Prepare asynchronous search operations for all collections
//     const searchOperations = allowedCollections.map(async (collectionName) => {
//       const collection = db.collection(collectionName);

//       // Fetch documents based on search query
//       const documents = await collection.find(searchQuery).toArray();

//       if (documents.length > 0) {
//         // For specified collections, include user details
//         if (['blips', 'videos', 'photos', 'notes', 'thoughts', 'articles', 'musics', 'podcasts', 'chats'].includes(collectionName)) {
//           const userDocuments = await collection.aggregate([
//             { $match: searchQuery },
//             {
//               $lookup: {
//                 from: 'users', // Lookup user details
//                 localField: "mobileNumber", // Match field
//                 foreignField: 'mobileNumber', // Users field
//                 as: 'user_details'
//               }
//             }
//           ]).toArray();

//           results.push({ collection: collectionName, documents: userDocuments });
//         } else {
//           results.push({ collection: collectionName, documents });
//         }
//       }
//     });

//     // Wait for all collection searches to complete
//     await Promise.all(searchOperations);

//     // Respond with aggregated results
//     res.json({ results });
//   } catch (error) {
//     console.error("Search Error:", error);
//     res.status(500).json({
//       statusCode: 1,
//       message: "Something went wrong",
//       data: null,
//     });
//   }
// };

///New code for content Search 
// const contentSearch = async (req, res) => {
//   try {
//     const db = mongoose.connection.db;
//     const searchString = req.body.searchString; // Search string from the request
//     const authHeader = req.headers.authorization || null; // Authorization token from request headers

//     // Decode user information from the authorization token (if available)
//     let userId = null;
//     let token = null;

//     if (authHeader) {
//       try {
//         token = authHeader.split(' ')[1];
//         console.log("Token:", token);
//         const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your JWT secret
//         userId = decoded._id;
//         console.log("Decoded User ID:", userId);
//       } catch (error) {
//         return res.status(401).json({
//           statusCode: 2,
//           message: "Invalid or expired token",
//           data: null,
//         });
//       }
//     }

//     // Define collections and fields to search
//     const allowedCollections = [
//       'blips', 'videos', 'photos', 'users', 'notes', 
//       'thoughts', 'articles', 'musics', 'podcasts', 'chats'
//     ];
//     const searchFields = [
//       "description", "mobileNumber", "comment", 
//       "webName", "fullname", "articleName", "message"
//     ];

//     const results = [];
//     const searchQuery = { 
//       $or: searchFields.map(field => ({ [field]: { $regex: searchString, $options: 'i' } }))
//     };

//     // Prepare asynchronous search operations for all collections
//     const searchOperations = allowedCollections.map(async (collectionName) => {
//       const collection = db.collection(collectionName);

//       // Determine query based on authorization
//       let query = searchQuery;
//       const ObjectId = require('mongoose').Types.ObjectId
//       if (userId && token) {
//         if (collectionName === 'users') {
//           // Match in the users collection by userId and search fields
//           query = {
//             $and: [
//               searchQuery,
//               { _id: new ObjectId(userId) } // Match by current user's ID
//             ]
//           };
//         } else if (['blips', 'videos', 'photos', 'notes', 'thoughts', 'articles', 'musics', 'podcasts', 'chats'].includes(collectionName)) {
//           const userField = `${collectionName.slice(0, -1)}_user_id`; // Derive user field name dynamically
//           query = {
//             $and: [
//               searchQuery,
//               { [userField]: userId } // Match user-specific field
//             ]
//           };
//         }
//       }

//       console.log("Query for", collectionName, ":", query);

//       // Fetch documents based on query
//       const documents = await collection.find(query).toArray();

//       if (documents.length > 0) {
//         if (collectionName !== 'users' && ['blips', 'videos', 'photos', 'notes', 'thoughts', 'articles', 'musics', 'podcasts', 'chats'].includes(collectionName)) {
//           const userDocuments = await collection.aggregate([
//             { $match: query },
//             {
//               $lookup: {
//                 from: 'users', // Lookup user details
//                 localField: "mobileNumber", // Match field
//                 foreignField: 'mobileNumber', // Users field
//                 as: 'user_details'
//               }
//             }
//           ]).toArray();

//           results.push({ collection: collectionName, documents: userDocuments });
//         } else {
//           results.push({ collection: collectionName, documents });
//         }
//       }
//     });

//     // Wait for all collection searches to complete
//     await Promise.all(searchOperations);

//     // Respond with aggregated results
//     res.json({ results });
//   } catch (error) {
//     console.error("Search Error:", error);
//     res.status(500).json({
//       statusCode: 1,
//       message: "Something went wrong",
//       data: null,
//     });
//   }
// };


// const contentSearch = async (req, res) => {
//   try {
//     const db = mongoose.connection.db;
//     const searchString = req.body.searchString;
//     const authHeader = req.headers.authorization || null;

//     let userId = null;
//     let token = null;

//     if (authHeader) {
//       try {
//         token = authHeader.split(' ')[1];
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         userId = decoded._id;
//       } catch (error) {
//         return res.status(401).json({
//           statusCode: 2,
//           message: "Invalid or expired token",
//           data: null,
//         });
//       }
//     }

//     // Fetch logged-in user's believers
//     const loggedInUser = await mongoose.model("User").findById(userId);
//     if (!loggedInUser) {
//       return res.status(404).json({
//         statusCode: 3,
//         message: "User not found",
//         data: null,
//       });
//     }
//     const believers = loggedInUser.believer;

//     // Define collections and fields to search
//     const allowedCollections = [
//       'blips', 'videos', 'photos', 'users', 'notes',
//       'thoughts', 'articles', 'musics', 'podcasts', 'chats'
//     ];
//     const searchFields = [
//       "description", "mobileNumber", "comment",
//       "webName", "fullname", "articleName", "message"
//     ];

//     const results = [];
//     const searchQuery = {
//       $or: searchFields.map(field => ({ [field]: { $regex: searchString, $options: 'i' } }))
//     };

//     const ObjectId = require('mongoose').Types.ObjectId;

//     // Prepare asynchronous search operations
//     const searchOperations = allowedCollections.map(async (collectionName) => {
//       const collection = db.collection(collectionName);

//       // Define dynamic query
//       let query = searchQuery;

//       if (userId && token) {
//         if (collectionName === 'users') {
//           query = {
//             $and: [
//               searchQuery,
//               // Add additional filters for "users" collection if needed
//             ]
//           };
//         } else if (['blips', 'videos', 'photos', 'notes', 'thoughts', 'articles', 'musics', 'podcasts', 'chats'].includes(collectionName)) {
//           const userField = `${collectionName.slice(0, -1)}_user_id`;
//           query = {
//             $and: [
//               searchQuery,
//               // Add additional filters for these collections if needed
//             ]
//           };
//         }
//       }

//       // Fetch documents
//       const documents = await collection.find(query).toArray();

//       if (documents.length > 0) {
//         const formattedDocuments = await Promise.all(
//           documents.map(async (doc) => {
//             let commentCount = 0;

//             if (['videos', 'photos'].includes(collectionName)) {
//               const commentCollection = `${collectionName.slice(0, -1)}comments`;
//               const relatedComments = await db.collection(commentCollection).find({
//                 [`${collectionName.slice(0, -1)}_id`]: doc._id.toString()
//               }).toArray();
//               commentCount = relatedComments.length;
//             }

//             const userField = `${collectionName.slice(0, -1)}_user_id`;
//             const isBeliever = believers.includes(doc[userField]);

//             return {
//               ...doc,
//               commentCount,
//               isBeliever
//             };
//           })
//         );

//         // Push results for this collection
//         results.push({
//           collection: collectionName,
//           documents: formattedDocuments
//         });
//       }
//     });

//     // Wait for all collection searches
//     await Promise.all(searchOperations);

//     // Respond with aggregated results
//     res.json({ results });
//   } catch (error) {
//     console.error("Search Error:", error);
//     res.status(500).json({
//       statusCode: 1,
//       message: "Something went wrong",
//       data: null,
//     });
//   }
// };


// const contentSearch = async (req, res) => {
//   try {
//     const db = mongoose.connection.db;
//     const searchString = req.body.searchString;
//     const authHeader = req.headers.authorization || null;

//     let userId = null;
//     let token = null;

//     if (authHeader) {
//       try {
//         token = authHeader.split(' ')[1];
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         userId = decoded._id;
//       } catch (error) {
//         return res.status(401).json({
//           statusCode: 2,
//           message: "Invalid or expired token",
//           data: null,
//         });
//       }
//     }

//     // Fetch logged-in user's believers
//     const loggedInUser = await mongoose.model("User").findById(userId);
//     if (!loggedInUser) {
//       return res.status(404).json({
//         statusCode: 3,
//         message: "User not found",
//         data: null,
//       });
//     }
//     const believers = loggedInUser.believer;

//     // Define collections and fields to search
//     const allowedCollections = [
//       'blips', 'videos', 'photos', 'users', 'notes',
//       'thoughts', 'articles', 'musics', 'podcasts', 'chats'
//     ];
//     const searchFields = [
//       "description", "mobileNumber", "comment",
//       "webName", "fullname", "articleName", "message", "title"
//     ];

//     const results = [];
//     const searchQuery = {
//       $or: searchFields.map(field => ({ [field]: { $regex: searchString, $options: 'i' } }))
//     };

//     const ObjectId = require('mongoose').Types.ObjectId;

//     // Prepare asynchronous search operations
//     const searchOperations = allowedCollections.map(async (collectionName) => {
//       const collection = db.collection(collectionName);

//       // Define dynamic query
//       let query = searchQuery;

//       if (userId && token) {
//         if (collectionName === 'users') {
//           query = {
//             $and: [
//               searchQuery,
//             ]
//           };
//         } else if (['blips', 'videos', 'photos', 'notes', 'thoughts', 'articles', 'musics', 'podcasts', 'chats'].includes(collectionName)) {
//           const userField = `${collectionName.slice(0, -1)}_user_id`;
//           query = {
//             $and: [
//               searchQuery,
//             ]
//           };
//         }
//       }

//       // Fetch documents
//       const documents = await collection.find(query).toArray();

//       if (documents.length > 0) {
//         const formattedDocuments = await Promise.all(
//           documents.map(async (doc) => {
//             // let commentCount = 0;

//             // if (['blips', 'videos', 'photos', 'notes', 'thoughts', 'articles', 'musics', 'podcasts', 'chats'].includes(collectionName)) {
//             //   const commentCollection = `${collectionName.slice(0, -1)}comments`;
//             //   const relatedComments = await db.collection(commentCollection).find({
//             //     [`${collectionName.slice(0, -1)}_id`]: doc._id.toString()
//             //   }).toArray();
//             //   commentCount = relatedComments.length;
//             // }
//             debugger
//             let userField
//             if (collectionName != "thoughts")
//               userField = `${collectionName.slice(0, -1)}_user_id`;
//             else
//               userField = `${collectionName}_user_id`;
//             console.log("userField", userField)
//             const isBeliever = believers.includes(doc[userField]);
//             let query = `_id: new ObjectId(doc[userField])`
//             console.log("query", query)
//             // Fetch user details
//             const userDetails = await db.collection("users").findOne({ _id: new ObjectId(doc[userField]) });
//             debugger
//             return {
//               ...doc,
//               isBeliever,
//               user_details: userDetails || null // Add user details if found
//             };
//           })
//         );

//         // Push results for this collection
//         results.push({
//           collection: collectionName,
//           documents: formattedDocuments
//         });
//       }
//     });

//     // Wait for all collection searches
//     await Promise.all(searchOperations);

//     // Respond with aggregated results
//     res.json({ results });
//   } catch (error) {
//     console.error("Search Error:", error);
//     res.status(500).json({
//       statusCode: 1,
//       message: "Something went wrong",
//       data: null,
//     });
//   }
// };
//////////////////////////////New Code///////////////////
// const contentSearch = async (req, res) => {
//   try {
//     const db = mongoose.connection.db;
//     const searchString = req.body.searchString;
//     const authHeader = req.headers.authorization || null;

//     let userId = null;
//     let believers = [];

//     // If authHeader is provided, verify the token and get the user
//     if (authHeader) {
//       try {
//         const token = authHeader.split(' ')[1];
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         userId = decoded._id;

//         // Fetch logged-in user's believers
//         const loggedInUser = await mongoose.model("User").findById(userId);
//         if (!loggedInUser) {
//           return res.status(404).json({
//             statusCode: 3,
//             message: "User not found",
//             data: null,
//           });
//         }
//         believers = loggedInUser.believer || [];
//       } catch (error) {
//         return res.status(401).json({
//           statusCode: 2,
//           message: "Invalid or expired token",
//           data: null,
//         });
//       }
//     }

//     // Define collections and fields to search
//     const allowedCollections = [
//       'blips', 'videos', 'photos', 'users', 'notes',
//       'thoughts', 'articles', 'musics', 'podcasts', 'chats'
//     ];
//     const searchFields = [
//       "description", "mobileNumber", "comment",
//       "webName", "fullname", "articleName", "message", "title"
//     ];

//     const results = [];
//     const searchQuery = {
//       $or: searchFields.map(field => ({ [field]: { $regex: searchString, $options: 'i' } }))
//     };

//     const ObjectId = require('mongoose').Types.ObjectId;

//     // Prepare asynchronous search operations
//     const searchOperations = allowedCollections.map(async (collectionName) => {
//       const collection = db.collection(collectionName);

//       // Define dynamic query
//       let query = searchQuery;

//       if (authHeader && userId) {
//         if (['blips', 'videos', 'photos', 'notes', 'thoughts', 'articles', 'musics', 'podcasts', 'chats'].includes(collectionName)) {
//           const userField = `${collectionName.slice(0, -1)}_user_id`;
//           query = {
//             $and: [
//               searchQuery,
//             ]
//           };
//         }
//       }

//       // Fetch documents
//       const documents = await collection.find(query).toArray();

//       if (documents.length > 0) {
//         const formattedDocuments = await Promise.all(
//           documents.map(async (doc) => {
//             const userField = collectionName === "thoughts"
//               ? `${collectionName}_user_id`
//               : `${collectionName.slice(0, -1)}_user_id`;

//             // Determine believer status if authHeader is present
//             const isBeliever = authHeader && believers.includes(doc[userField]);

//             // Fetch user details if available
//             const userDetails = await db.collection("users").findOne({ _id: new ObjectId(doc[userField]) });

//             return {
//               ...doc,
//               isBeliever,
//               user_details: userDetails || null
//             };
//           })
//         );

//         // Push results for this collection
//         results.push({
//           collection: collectionName,
//           documents: formattedDocuments
//         });
//       }
//     });

//     // Wait for all collection searches
//     await Promise.all(searchOperations);

//     // Respond with aggregated results
//     res.json({ results });
//   } catch (error) {
//     console.error("Search Error:", error);
//     res.status(500).json({
//       statusCode: 1,
//       message: "Something went wrong",
//       data: null,
//     });
//   }
// };

///////////////////////////End of Code//////////////////////
const contentSearch = async (req, res) => {
  debugger
  try {
    const db = mongoose.connection.db;
    const searchString = req.body.searchString;
    const authHeader = req.headers.authorization || null;

    let userId = null;
    let token = null;
    let believers = [];

    if (authHeader) {
      try {
        token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded._id;
debugger
        // Fetch logged-in user's believers if the userId is valid
        const loggedInUser = await mongoose.model("User").findById(userId);
        if (!loggedInUser) {
          return res.status(404).json({
            statusCode: 3,
            message: "User not found",
            data: null,
          });
        }
        believers = loggedInUser.believer || [];
      } catch (error) {
        return res.status(401).json({
          statusCode: 2,
          message: "Invalid or expired token",
          data: null,
        });
      }
    }

    // Define collections and fields to search
    const allowedCollections = [
      'blips', 'videos', 'photos', 'users', 'notes',
      'thoughts', 'articles', 'musics', 'podcasts', 'chats'
    ];
    const searchFields = [
      "description", "mobileNumber", "comment",
      "webName", "fullname", "articleName", "message", "title"
    ];

    const results = [];
    const searchQuery = {
      $or: searchFields.map(field => ({ [field]: { $regex: searchString, $options: 'i' } }))
    };
debugger
    const ObjectId = require('mongoose').Types.ObjectId;

    // Prepare asynchronous search operations
    const searchOperations = allowedCollections.map(async (collectionName) => {
      const collection = db.collection(collectionName);

      // Define dynamic query
      let query = searchQuery;
      debugger
      if (userId && token) {
        if (['blips', 'videos', 'photos', 'notes', 'thoughts', 'articles', 'musics', 'podcasts', 'chats'].includes(collectionName)) {
          const userField = `${collectionName.slice(0, -1)}_user_id`;
          query = {
            $and: [searchQuery]
          };
        }
      }

      // Fetch documents
      const documents = await collection.find(query).toArray();

      if (documents.length > 0) {
        const formattedDocuments = await Promise.all(
          documents.map(async (doc) => {
            let isBeliever = false;
            let userDetails = null;

            if (userId && token) {
              const userField = collectionName !== "thoughts"
                ? `${collectionName.slice(0, -1)}_user_id`
                : `${collectionName}_user_id`;

              isBeliever = believers.includes(doc[userField]);
              debugger
              // Fetch user details
              userDetails = await db.collection("users").findOne({ _id: new ObjectId(doc[userField]) });
            }

            return {
              ...doc,
              isBeliever: isBeliever || null,
              user_details: userDetails || null // Add user details if found
            };
          })
        );

        // Push results for this collection
        results.push({
          collection: collectionName,
          documents: formattedDocuments
        });
      }
    });

    // Wait for all collection searches
    await Promise.all(searchOperations);

    // Respond with aggregated results
    res.json({ results });
  } catch (error) {
    console.error("Search Error:", error);
    res.status(500).json({
      statusCode: 1,
      message: "Something went wrong",
      data: null,
    });
  }
};





const saveRecentSearch = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || null;
    let mobileNumber = "";
    let user_id = "";
    const ObjectId = require('mongoose').Types.ObjectId;

    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      mobileNumber = decoded.mobileNumber;
      user_id = decoded._id;
    }

    const db = mongoose.connection.db;
    let type = req.body.type;
    let searchId = req.body.searchId;

    // Validate if type is one of the allowed collections
    const allowedCollections = [ 'blips', 'videos', 'photos', 'users', 'notes',
    'thoughts', 'articles', 'musics', 'podcasts', 'chats'];
    if (!allowedCollections.includes(type)) {
      return res.status(400).json({ statusCode: 1, message: "Invalid type parameter", data: null });
    }

    // Reference to the appropriate collection based on the type
    const collection = db.collection(type);

    // Perform search based on the searchId and type
    const documents = await collection.find({ _id: new ObjectId(searchId) }).toArray();

    if (documents.length === 0) {
      return res.status(404).json({
        statusCode: 1,
        message: "No documents found",
        data: null,
      });
    }

    // If type is 'blips', 'videos', or 'photos', perform a lookup for user details
    let results = documents;
    if (type === 'blips' || type === 'videos' || type === 'photos' || type==='notes'||type==='thoughts'||type==='articles'||type==='musics'||type==='podcasts') {
      results = await collection.aggregate([
        {
          $match: { _id: new ObjectId(searchId) }
        },
        {
          $lookup: {
            from: 'users', // Lookup from the users collection
            localField: "mobileNumber", // Match the user via mobileNumber
            foreignField: "mobileNumber",
            as: 'user_details'
          }
        }
      ]).toArray();
    }

    // Save the search result into the 'recentSearch' collection
    const recentSearchCollection = db.collection('recentSearch');
    await recentSearchCollection.insertOne({
      user_id, // The user performing the search
      type, // The type of collection (blips, videos, etc.)
      searchId, // The searchId used
      result: results, // The results obtained from the search
      searchDate: new Date() // Timestamp of the search
    });

    // Send response with results
    return res.json({
      statusCode: 0,
      message: "Success",
      data: results
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 1,
      message: "Something went wrong",
      data: null,
    });
  }
};

const recentSearch = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || null;
    // let mobileNumber = "";
    let user_id = "";
    // const ObjectId = require('mongoose').Types.ObjectId;
    const db = mongoose.connection.db;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      mobileNumber = decoded.mobileNumber;
      user_id = decoded._id;
    }

    // Reference to the appropriate collection based on the type
    const collection = db.collection('recentSearch');


    // Perform search based on the searchId and type
    const results = await collection.find({ user_id: user_id }).toArray();

    // Send response with results
    return res.json({
      statusCode: 0,
      message: "Success",
      data: results
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 1,
      message: "Something went wrong",
      data: null,
    });
  }
};
const deleteContent = async (req, res) => {
  debugger
  try {
    const authHeader = req.headers.authorization || null;
    let mobileNumber = "";
    let user_id = "";
    const ObjectId = require("mongoose").Types.ObjectId;

    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (!token)
        return res
          .status(403)
          .send({ statusCode: 1, message: "Access denied.", data: null });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      mobileNumber = decoded.mobileNumber;
      user_id = decoded._id;
    }

    const db = mongoose.connection.db;
    const { type, contentId } = req.body;

    // Validate type and determine the collection name
    let collectionName = "";
    if (type === "blip") {
      collectionName = "blips";
    } else if (type === "photo") {
      collectionName = "photos";
    } else if (type === "thoughts") {
      collectionName = "thoughts";
    } else if (type === "video") {
      collectionName = "videos";
    } else if (type === "note") {
      collectionName = "notes";
    } else if (type === "music") {
      collectionName = "musics";
    } else if (type === "podcast") {
      collectionName = "podcasts";
    } else {
      return res.status(400).json({
        statusCode: 1,
        message: "Invalid type parameter",
        data: null,
      });
    }

    // Validate contentId
    if (!ObjectId.isValid(contentId)) {
      return res.status(400).json({
        statusCode: 1,
        message: "Invalid contentId parameter",
        data: null,
      });
    }

    // Reference the appropriate collection
    const collection = db.collection(collectionName);

    // Check if the content exists
    const document = await collection.findOne({
      _id: new ObjectId(contentId),
      // isDeleted: false, // Ensure it's not already deleted
    });
    if (!document) {
      return res.status(404).json({
        statusCode: 1,
        message: "Content not found or already deleted",
        data: null,
      });
    }

    // Perform soft delete by updating the document
    const updateResult = await collection.updateOne(
      { _id: new ObjectId(contentId) },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: user_id,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        statusCode: 1,
        message: "Failed to soft delete the content",
        data: null,
      });
    }

    // Log the deletion in a 'deletionLogs' collection
    const deletionLogsCollection = db.collection("deletionLogs");
    await deletionLogsCollection.insertOne({
      user_id, // The user who performed the deletion
      type, // The type of content
      contentId, // The ID of the deleted content
      deletedAt: new Date(), // Timestamp of deletion
    });

    // Send success response
    return res.json({
      statusCode: 0,
      message: "Content soft deleted successfully",
      data: { contentId, type },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      statusCode: 1,
      message: "Something went wrong",
      data: null,
    });
  }
};


module.exports = { contentDetail, contentSearch, saveRecentSearch, recentSearch ,deleteContent};