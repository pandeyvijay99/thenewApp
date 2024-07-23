const { StatusCodes } = require("http-status-codes");
const Video = require("../models/video");
const VideoComment = require("../models/videocomment");
const VideoSubComment = require("../models/videosubcomment");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
const { BlobServiceClient,StorageSharedKeyCredential } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
// const { DefaultAzureCredential } = require('@azure/identity');
const multer = require('multer');
const path = require('path');
const User = require("../models/auth");
const reactionD = require("../helper");

const Webname = require("../models/webname");
const { json } = require("express");
const logAudit = require("../../src/common")
require("dotenv").config();


//Fetch User Details 

const fetchVideo = async (req, res) => {
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
    const result = await   Video.aggregate([
        {
            $match:{
                mobileNumber:req.body.mobileNumber
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
               hashtag:1,
               user_details: {
                 fullName: 1,
                 profilePicture: 1,
                 _id:1,
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
        return res.status(StatusCodes.OK).json({statusCode:0,message:"",
        data:result
  });
 
 } else {
  return res.status(StatusCodes.OK).json({statusCode:1,
      message: "Video does not exist..!",
      data:null
  });
 }
 } catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };



const uploadVideoFile = async (req, res) => {
  let file = "";
  let video_thumbnail="";
  if (req.files) {
    file = req.files.file;
    video_thumbnail = req.files.thumbnail;
  } else {
    return res.status(400).send({ statusCode: 1, message: 'Seems file is not', data: null });
  }
    const authHeader = (req.headers.authorization)?req.headers.authorization:null;
    let mobileNumber = ""
    debugger
    if(authHeader){
        const token =  authHeader.split(' ')[1];
    if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null});
    console.log("token" , token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    mobileNumber = decoded.mobileNumber;
    video_user_id = decoded._id
    console.log("videodecoded ",decoded.mobileNumber);
    }
    
    
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const accountName = process.env.ACCOUNT_NAME;
const accountKey = process.env.KEY_DATA;
const containerName = process.env.VIDEO_CONTAINER;
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
);
const containerClient = blobServiceClient.getContainerClient(containerName);
// const file = req.files.file;

    if (!file) {
        return res.status(400).send({statusCode:1, message:'No file uploaded.',data:null});
    }else if (file.size>(20*1024*1024)){
      return res.status(400).send({statusCode:1, message:'Maximum allowed size is 20MB',data:null});
    }
    
    // const blobName = file.name;
    const stream = file.data;
    const thumbnail_stream =video_thumbnail.data;
    const originalFileName = path.basename(file.name);
    const folderName = originalFileName; 
    const originalBlobName = `${folderName}/${originalFileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(originalBlobName);

    /*thumbnail */
    const originalThumbnailFileName = path.basename(video_thumbnail.name);
    const originalThumbnailBlobName = `${folderName}/${originalThumbnailFileName}`;
    const blockThumbnailBlobClient = containerClient.getBlockBlobClient(originalThumbnailBlobName);

    // Upload file to Azure Blob Storage
    // const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
        const uploadResponse = await blockBlobClient.upload(stream, stream.length);
        const fileUrl = blockBlobClient.url;
        const uploadThumbnailResponse = await blockThumbnailBlobClient.upload(thumbnail_stream, stream.length);
        const thumbnailFileUrl = blockThumbnailBlobClient.url;
        debugger;
        console.log("fileUrl",fileUrl)
        // const { countryCode, mobileNumber } = req.body;
        debugger;
        let title = req.body.title?req.body.title:"";
        let description = req.body.captions? req.body.captions:"";
        let hashtag = req.body.hashtags? (req.body.hashtags).split(","):"";
        let tags = req.body.peoples?(req.body.peoples).split(","):"";
        const videoData ={
            title:title,
            videoUrl:fileUrl,
            thumbnailVideoUrl:thumbnailFileUrl,
            description:description,
            hashtag:hashtag,
            tags:tags,
            mobileNumber:mobileNumber,
            video_user_id : video_user_id
        }

        Video.create(videoData).then((data, err) => {
            if (err) res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
            });
        console.log('File uploaded successfully to Azure Blob Storage:', uploadResponse);
        console.log('File uploaded successfully to Azure Blob Storage:', uploadThumbnailResponse);
        await logAudit("Video", mobileNumber, fileUrl,thumbnailFileUrl,"" ,video_user_id,description,"")
        return res.status(200).send({statusCode:0,message:'',data:"File uploaded successfully."});
    } catch (error) {
        console.error("Error uploading to Azure Blob Storage:", error);
        return res.status(500).send({statusCode:1,message:'Error uploading file to Azure Blob Storage.',data:null});
    }

}

const fetchAllVideo = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
    const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
    const offset = (pageNumber - 1) * pageSize; // Calculate offset
    const authHeader = (req.headers.authorization)?req.headers.authorization:null;
    let arrayOfIds = "";
        if(authHeader){
            const token =  authHeader.split(' ')[1];
            if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log("token" , token);
                c_r_user = user_id = decoded._id;
                mobileNumber =decoded.mobileNumber?decoded.mobileNumber:null;
                console.log("user_id ",decoded._id);
                console.log("belie",req.body.isBelieverRequire)
                const ObjectId = require('mongoose').Types.ObjectId
                const user_ids = await User.find({ _id: new ObjectId(user_id) }, { believer: 1 })
              if( req.body.isBelieverRequire ==false)
                condition = { }
              else if (req.body.isBelieverRequire && req.body.isBelieverRequire ==true){
                const ObjectId = require('mongoose').Types.ObjectId
                const user_ids = await User.find({_id:new ObjectId(user_id)},{believer:1})
                console.log("user_ids ",user_ids?user_ids[0].believer:null);
                arrayOfIds = user_ids?user_ids[0].believer:null;
                condition = { video_user_id :{
                  $in :user_ids[0].believer
                }}
                console.log("condition",condition)

              }
                debugger
                console.log("user_id",arrayOfIds)
                console.log("current_user_id", user_id)
                const result = await   Video.aggregate([ 
                  {
                    $match :condition
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
                      videoUrl: 1,
                      thumbnailVideoUrl:1,
                      tags: 1,
                      hashtag:1,
                      comments:1,
                      user_details:1,
                      views:1,
                      description:1,
                      title:1,
                      totalRating: 1,
                      // isInArray: {
                      //   $in: ["$_video_user_id", arrayOfIds]  // Check if the document's _id is in the provided array of ObjectIds
                      // },
                      ratingCount:  {
                        $cond: {
                          if: { $isArray: "$videoRating" }, // Check if reactions field is an array
                          then: { $size: "$videoRating" },   // If reactions is an array, return its size
                          else: 0                           // If reactions is not an array or doesn't exist, return 0
                        }
                      },
                      reactionCount: {
                        $cond: {
                          if: { $isArray: "$videoReaction" }, // Check if reactions field is an array
                          then: { $size: "$videoReaction" },   // If reactions is an array, return its size
                          else: 0                           // If reactions is not an array or doesn't exist, return 0
                        }
                      },
                      believerStatus: {
                        $cond: {
                          if: { '$in': ["$video_user_id", user_ids[0].believer] }, // Check if reactions field is an array
                          then: true,   // If reactions is an array, return its size
                          else: false                        // If reactions is not an array or doesn't exist, return 0
                        }
                      },
                      // videoCount: {
                      //    $size: '$video_user_id' 
                      // },
                      createdAt:1,
                      updatedAt:1
                      
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
                 const totalComment = await VideoComment.aggregate([
                  {
                    $match :condition
                  },
                    {
                      $group: {
                        _id: '$video_id',
                        count: { $sum: 1 } // this means that the count will increment by 1
                      }
                    }
                  ]);
                  debugger;
                 const videoCount =  await Video.find({video_user_id:user_id}).count();
                 console.log("video count ", videoCount);
                 if (result) {
                       console.log("user ", result);
                   return res.status(StatusCodes.OK).json({statusCode:"0",message:"",
                    data:{result,totalComment,videoCount}
              });
             
             } else {
             return  res.status(StatusCodes.OK).json({statusCode:1,
                  message: "Video does not exist..!",
                  data:null
              });
             }
        }
    
    else{
    const result = await   Video.aggregate([ 
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
          videoUrl: 1,
          thumbnailVideoUrl:1,
          tags: 1,
          hashtag:1,
          comments:1,
          user_details:1,
          views:1,
          totalRating: 1,
          description:1,
          title:1,
          ratingCount:  {
            $cond: {
              if: { $isArray: "$videoRating" }, // Check if reactions field is an array
              then: { $size: "$videoRating" },   // If reactions is an array, return its size
              else: 0                           // If reactions is not an array or doesn't exist, return 0
            }
          },
          reactionCount: {
            $cond: {
              if: { $isArray: "$videoReaction" }, // Check if reactions field is an array
              then: { $size: "$videoReaction" },   // If reactions is an array, return its size
              else: 0                           // If reactions is not an array or doesn't exist, return 0
            }
          },
        //  videoCount : {
        //     $size: '$video_user_id' 
        //  },
          createdAt:1,
          updatedAt:1
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
     const totalComment = await VideoComment.aggregate([
        {
          $group: {
            _id: '$video_id',
            count: { $sum: 1 } // this means that the count will increment by 1
          }
        }
      ]);
      const videoCount =  await Video.aggregate([
        {
          $group: {
            _id: "$video_user_id", // Group by column1
           // Example: Summing up column2 for each group
            count: { $sum: 1 } // Example: Counting the number of documents in each group
          }
        }
      ])
     if (result) {
           console.log("user ", result);
        return res.status(StatusCodes.OK).json({statusCode:"0",message:"",
        data:{result,totalComment,videoCount}
  });
 
 } else {
  return res.status(StatusCodes.OK).json({statusCode:1,
      message: "Video does not exist..!",
      data:null
  });
 }
}
} catch (error) {
    console.log("catch ", error );
  return  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };
 /*Post Reaction functionality */

 const postVideoReaction = async (req, res) => {
    // console.log("validation ")
    // console.log("helperdata ",reactionD.reactionemoji[4]._id);
    let arr = reactionD.reactionemoji;
    let mapped = arr.map(ele => ele._id);
    let found = mapped.includes(req.body.reaction);
    if(found==true){
      reactionValue = reactionD.reactionemoji[req.body.reaction].emoji;
    }
    // console.log("found ",found)
    // console.log(reactionD.reactionemoji.includes(req.body.reaction)); // true

  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.reaction || !req.body.reaction) {
       return  res.status(StatusCodes.BAD_REQUEST).json({
           message: "reaction is required",
        });
     }
     if (!req.body.video_id || !req.body.video_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
           message: "video_id is required",
        });
     }
     /*code for getting user_id from  header*/
        const authHeader = (req.headers.authorization)?req.headers.authorization:null;
        if(authHeader){
            const token =  authHeader.split(' ')[1];
            if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log("token" , token);
                user_id = decoded._id;
                console.log("videodecoded ",decoded._id);
        }
        /*reactions */
        
        /**/
        const ObjectId = require('mongoose').Types.ObjectId
        user_id = new ObjectId(user_id)
        console.log("user_id ", user_id)
        const videoReaction ={
            reaction_user_id:user_id,
            reaction:req.body.reaction,
            reactionValue:reactionValue
        }
        debugger;
        // const ObjectId = require('mongoose').Types.ObjectId
        const filter = { _id: new ObjectId( req.body.video_id) };
        console.log("filer is ",filter);
        const result = await Video.findOneAndUpdate(filter, {$push:{videoReaction:videoReaction}}, {
          returnOriginal: false
        });
        return res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result },
      });
 
 } catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };
 /*End of code*/
  /*Post Reaction functionality */

  const postVideoRating = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.rating || !req.body.rating) {
       return res.status(StatusCodes.BAD_REQUEST).json({
           message: "reaction is required",
        });
     }
     if (!req.body.video_id || !req.body.video_id) {
       return res.status(StatusCodes.BAD_REQUEST).json({
           message: "video_id is required",
        });
     }
     /*code for getting user_id from  header*/
        const authHeader = (req.headers.authorization)?req.headers.authorization:null;
        if(authHeader){
            const token =  authHeader.split(' ')[1];
            if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log("token" , token);
                user_id = decoded._id;
                console.log("Videodecoded ",decoded._id);
        }
        const current_user_id = user_id
        const ObjectId = require('mongoose').Types.ObjectId
        user_id = new ObjectId(user_id)
        console.log("user_id ", user_id)
        const videoRating ={
          rating_user_id:user_id,
            ratingno:req.body.rating
        }
        debugger;
        // const ObjectId = require('mongoose').Types.ObjectId
        const filter = { _id: new ObjectId( req.body.video_id) };
        console.log("filer is ",filter);
        // const result = await Video.findOneAndUpdate(filter, {$push:{videoRating:videoRating}}, {
        //   returnOriginal: false
        // });
        const product = await Video.findById({ _id: new ObjectId(req.body.video_id) });

        if (!product) {
          return res.status(StatusCodes.OK).json({
            statusCode: 1,
            message: "Video Not available",
            data: null,
          });
        }
        debugger
        console.log("product ", product.videoRating[0]?product.videoRating[0].ratingno:"");
        let existingUserRating = product.videoRating[0]?product.videoRating[0].ratingno : 0
        // Calculate the new total rating
    
        const newTotalRating = (((product.totalRating ? parseFloat(product.totalRating) : 0)) + parseFloat(req.body.rating));
        console.log("newTotalRating", newTotalRating)
    
        // Update the total rating in the database
    
        /*End of the code*/
    
        currentUserRating = await Video.aggregate([
          {
            $unwind: "$videoRating"
          },
          { $match: { "$and": [{ $expr: { $eq: ["$videoRating.rating_user_id", new ObjectId(user_id)] } }, { _id: new ObjectId(req.body.video_id) }] } },
    
          {
            $project: {
              "videoRating.ratingno": 1
            }
          }
    
        ]);
        if (currentUserRating.length > 0) {
          const newTotalRating = (((product.totalRating ? parseFloat(product.totalRating) : 0)) + parseFloat(req.body.rating) - existingUserRating);
          const filterData = {
            "videoRating.rating_user_id": new ObjectId(user_id),
            _id: new ObjectId(req.body.video_id),
            // 'comments.postedBy': 'Specific user',
          };
          const update = {
            $set: {
              'videoRating.$.ratingno': req.body.rating,
              totalRating: newTotalRating
            },
          };
          const options = { new: true };
    
          Video.findOneAndUpdate(filterData, update, options)
            .then(updatedPost => {
              if (updatedPost) {
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
          const result = await Video.findOneAndUpdate(filter, { $push: { videoRating: videoRating } }, {
            returnOriginal: false
          });
          const updatedProduct = await Video.findOneAndUpdate(
            { _id: new ObjectId(req.body.video_id) },
            { $set: { totalRating: newTotalRating } },
            { new: true } // Return the updated document
          );
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
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };
 /*End of code*/
 const totalVideoReaction = async (req, res) => {
   
  try {
    debugger;
    console.log("inside count ")
     
     if (!req.body.video_id || !req.body.video_id) {
       return res.status(StatusCodes.BAD_REQUEST).json({
           message: "video_id is required",
        });
     }
     
        debugger;
         const ObjectId = require('mongoose').Types.ObjectId
   
    result = await Video.aggregate([
        {
          $match: { _id: new ObjectId(req.body.video_id) } // Match the parent document with the given ID
        },
        {
          $project: {
            totalReaction: { $size: '$videoReaction' } // Project a field with the size of the subdocuments array
          }
        }
      ]);
        console.log("result is ",result);
        const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
        const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
        const offset = (pageNumber - 1) * pageSize; // Calculate offset
   
    grp = await Video.aggregate([
        {
          $unwind: '$videoReaction' // Unwind the subdocuments array
        },
        {
          $lookup: {
              from: "users", // name of the comment collection
              localField: "videoReaction.reaction_user_id",
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
              "videoReaction.reaction": 1,
              "videoReaction.updatedAt":1,
              "user_details.webName": 1,
              "user_details.fullName": 1,
              "user_details.profilePicture": 1,// Include other user details you may need
              "videoReaction.reactionValue":1
          }
      },
      {
        $skip: offset
      },
      {
        $limit: pageSize
      }
      ])
      console.log("video count reactionwise ",grp)
        return res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result ,grp},
      });
 
 } catch (error) {
    console.log("catch ", error );
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 }; 

 const totalVideoRating = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside count ")
     
     if (!req.body.video_id || !req.body.video_id) {
       return res.status(StatusCodes.BAD_REQUEST).json({
           message: "video_id is required",
        });
     }
     
        debugger;
         const ObjectId = require('mongoose').Types.ObjectId
        
    //     res.status(StatusCodes.OK).json({statusCode:0,
    //      message:"",   
    //      data: { result },
    //   });
    Ratings = await Video.aggregate([
        {
          $match: { _id: new ObjectId(req.body.video_id) } // Match the parent document with the given ID
        },
        {
          $unwind: "$videoRating"
        },
        {
          $group: {
            _id: "$videoRating.ratingno",        // Group by the 'rating' field
            count: { $sum: 1 }     // Count the number of movies in each group
          }
        },
      ]);
      let currentUserRating = "";
    if (req.body.current_user_id) {
      // userID = new ObjectId(req.body.blip_user_id)

      currentUserRating = await Video.aggregate([
        {
          $unwind: "$videoRating"
        },
        // { $match: { $expr: { $eq: ["$videoRating.rating_user_id", new ObjectId(req.body.current_user_id)] } } },
        {
          $match: {
            _id: new ObjectId(req.body.video_id),
            $expr: {
              $eq: ["$videoRating.rating_user_id", new ObjectId(req.body.current_user_id)]
            }
          }
    },
        {
          $project: {
            "videoRating.ratingno": 1
          }
        }

      ]);
    }
    // console.log("loggedIn user",currentUserRating); return;
    console.log("result is ", Ratings);
        // console.log("result is ",result);
        const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
        const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
        const offset = (pageNumber - 1) * pageSize; // Calculate offset
      RatingCount = await Video.aggregate([
        {
            $match:{
                _id : new ObjectId(req.body.video_id)
            }
        },
        {
          $unwind: '$videoRating' // Unwind the subdocuments array
        },
        {
          $lookup: {
              from: "users", // name of the comment collection
              localField: "videoRating.rating_user_id",
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
              "videoRating.ratingno": 1,
              "videoRating.updatedAt":1,
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
      console.log("video count ratings ",RatingCount)
        return res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { Ratings ,RatingCount,currentUserRating},
      });
 
 } catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 }; 
/**/

const fetchGroupVideoRating = async (req, res) => {
  // console.log("validation ")
try {
  debugger;
  console.log("inside count ")
   
   if (!req.body.video_id || !req.body.video_id) {
     return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
         message: "video_id is required",data:null
      });
   }
   
      debugger;
       const ObjectId = require('mongoose').Types.ObjectId
      

      // console.log("result is ",result);
      const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
      const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
      const offset = (pageNumber - 1) * pageSize; // Calculate offset
    RatingCount = await Video.aggregate([
      {
          $match:{
              _id : new ObjectId(req.body.video_id)
          }
      },
      {
        $unwind: '$videoRating' // Unwind the subdocuments array
      },
      {
        $group: {
          _id: '$videoRating.ratingno',
          count: { $sum: 1 } 
        },
      }
    ])
    console.log("video count ratings ",RatingCount)
      return res.status(StatusCodes.OK).json({statusCode:0,
       message:"",   
       data:  RatingCount
    });

} catch (error) {
  console.log("catch ", error );
 return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
}
}; 
/*Blip Views */
const videoView = async (req, res) => {
  // console.log("validation ")
try {
  debugger;
  console.log("inside count ")
   
   if (!req.body.video_id || !req.body.video_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
         message: "video_id is required",
      });
   }
   
      debugger;
       const ObjectId = require('mongoose').Types.ObjectId


       const conditions = {  _id: new ObjectId(req.body.video_id) };

// Define the update operation
const update = { $inc: { views: 1 } }; // $inc is used to increment a value

// Options to findOneAndUpdate method (optional)
const options = {
  new: true, // return the modified document rather than the original
};
viewCount = await Video.findOneAndUpdate(conditions, update, options);
    // viewCount = await Blip.findOneAndUpdate({ _id: new ObjectId(req.body.blip_id) },{ $inc: { views: 1 } }, {new: true });
    console.log("video views ",viewCount)
      return res.status(StatusCodes.OK).json({statusCode:0,
       message:"",   
       data:  viewCount
    });

} catch (error) {
  console.log("catch ", error );
 return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
}
}; 

/*Trending Blip  */
const trendingViews = async (req, res) => {
  const pipeline = [
    {
      $project: {
        views: 1,
        ratingCount:  {
          $cond: {
            if: { $isArray: "$videoRating" }, // Check if reactions field is an array
            then: { $size: "$videoRating" },   // If reactions is an array, return its size
            else: 0                           // If reactions is not an array or doesn't exist, return 0
          }
        },// Calculate total ratings for each video
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
  Video.aggregate(pipeline)
    .then(results => {
      console.log('Results:', results);
      return res.status(StatusCodes.OK).json({statusCode:0,
        message:"",   
        data:  results
     });

    })
    .catch(error => {
      console.error('Error:', error);
      return res.status(StatusCodes.OK).json({statusCode:1,
        message:"something went wrong",   
        data:  null
     });
    });
}; 

/*BelieversBlip Functionality*/
const believersVideo = async (req, res) => {
  // console.log("validation ")

  try {
  debugger;
  console.log("inside validation ")
    /*code for getting user_id from  header*/
    const authHeader = (req.headers.authorization)?req.headers.authorization:null;
    if(authHeader){
        const token =  authHeader.split(' ')[1];
        if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("token" , token);
            user_id = decoded._id;
            console.log("user_id  ",decoded._id);
    }
    const ObjectId = require('mongoose').Types.ObjectId
  const user_ids = User.find({_id:new ObjectId(user_id)},{believer:1})
  console.log("user_ids ",user_ids);
  // return;
  //  const data = await Blip.find({});
  const result = await   Video.aggregate([
    {
      $project: {
        _id: 1,
        videoUrl: 1,
        tags: 1,
        hashtag:1,
        comments:1,
        // ratingCount: { $size: '$blipRating' }, // Count of ratings sub-documents
        ratingCount:  {
          $cond: {
            if: { $isArray: "$videoRating" }, // Check if reactions field is an array
            then: { $size: "$videoRating" },   // If reactions is an array, return its size
            else: 0                           // If reactions is not an array or doesn't exist, return 0
          }
        },
        reactionCount: {
          $cond: {
            if: { $isArray: "$videoReaction" }, // Check if reactions field is an array
            then: { $size: "$videoReaction" },   // If reactions is an array, return its size
            else: 0                           // If reactions is not an array or doesn't exist, return 0
          }
        },
      }
    }
   ]);
   debugger;
   const totalComment = await VideoComment.aggregate([
      {
        $group: {
          _id: '$video_id',
          count: { $sum: 1 } // this means that the count will increment by 1
        }
      }
    ]);

   if (result) {
         console.log("user ", result);
     return res.status(StatusCodes.OK).json({statusCode:"0",message:"",
      data:{result,totalComment}
});

} else {
return res.status(StatusCodes.OK).json({statusCode:1,
    message: "Video does not exist..!",
    data:null
});
}
} catch (error) {
  console.log("catch ", error );
//  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
 return res.status(StatusCodes.OK).json({statusCode:1,
  message: "Video does not exist..!",
  data:null
});
}
};
/*End of the code*/
/*Recommended Video*/
const recommendedVideos = async (req, res) => {
  let limit = req.body.limmit ?req.body.limmit:10;
  let offset = req.body.offset? req.body.offset:0;
  try{
  const result = await Video.find({}).skip(offset).limit(limit)
  return res.status(StatusCodes.OK).json({statusCode:"0",message:"",
      data:{result}
});
  }catch(error){
    console.log("catch ", error );
 return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
  
};

const getAllVideosWithCount = async (req, res) => {
  let limit = req.body.limmit ?req.body.limmit:10;
  let offset = req.body.offset? req.body.offset:0;
  debugger;
  let results =  await Video.aggregate([
    {
      $lookup: {
          from: "users", // name of the comment collection
          localField: "_id",
          foreignField: "video_user_id",
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
        videos: { $push: { title: '$title', description: '$description' } },
        videoCount: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        userDetails: 1,
        videos: 1,
        videoCount: 1
      }
    }
  ])
  .then(results => {
    console.log(results);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:0,message:"",data:{results }});

  })
  .catch(error => {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null});
  });  
}; 

const getUserVideoBasedOnWebname = async (req, res) => {
  // console.log("validation ")
try {
  debugger;
  const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
  const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
  const offset = (pageNumber - 1) * pageSize; // Calculate offset
  const authHeader = (req.headers.authorization)?req.headers.authorization:null;
  let arrayOfIds = "";
      if(authHeader){
          const token =  authHeader.split(' ')[1];
          if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
              const decoded = jwt.verify(token, process.env.JWT_SECRET);
               user_id = decoded._id;
              mobileNumber =decoded.mobileNumber?decoded.mobileNumber:null;
              console.log("user_id ",decoded._id);
              const ObjectId = require('mongoose').Types.ObjectId
              let userDetails = await User.findOne({ webName: req.body.webName });
              Did = (userDetails._id).toString();
               const filter = { video_user_id: Did };
               console.log("user details ",filter);
              arrayOfIds = userDetails.believer?userDetails.believer:"";
               console.log("user_id",arrayOfIds)
              const result = await   Video.aggregate([ 
                {
                  $match :filter
                },
                {
                  $project: {
                    _id: 1,
                    videoUrl: 1,
                    thumbnailVideoUrl:1,
                    tags: 1,
                    hashtag:1,
                    comments:1,
                    views:1,
                    description:1,
                    title:1,
                    believerStatus: {
                      $cond: {
                        if: { '$in': [user_id,arrayOfIds] }, // Check if reactions field is an array
                        then: true,   // If reactions is an array, return its size
                        else: false                        // If reactions is not an array or doesn't exist, return 0
                      }
                    },
                    
                    createdAt:1,
                    updatedAt:1
                    
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
               
               if (userDetails) {
                    //  console.log("user ", userDetails);
                 return res.status(StatusCodes.OK).json({statusCode:"0",message:"",
                  data:{userDetails,result}
            });
           
           } 
      }
  
 
} catch (error) {
  console.log("catch ", error );
return  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
}
};

 module.exports = {fetchVideo,uploadVideoFile ,fetchAllVideo,postVideoReaction,
            postVideoRating,totalVideoReaction,totalVideoRating,fetchGroupVideoRating,videoView,trendingViews
          ,believersVideo,recommendedVideos,getAllVideosWithCount,getUserVideoBasedOnWebname};