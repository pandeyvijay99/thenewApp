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
require("dotenv").config();


//Fetch User Details 

const fetchVideo = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.countryCode || !req.body.mobileNumber) {
        res.status(StatusCodes.BAD_REQUEST).json({
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
        res.status(StatusCodes.OK).json({statusCode:0,message:"",
        data:result
  });
 
 } else {
  res.status(StatusCodes.OK).json({statusCode:1,
      message: "Video does not exist..!",
      data:null
  });
 }
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };

 //upload Profile Pic 


// const uploadProfilePic = async (req, res) => {
//   const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
// const accountName = process.env.ACCOUNT_NAME;
// const accountKey = process.env.KEY_DATA;
// const containerName = process.env.PROFILE_CONTAINER;
// const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
// const blobServiceClient = new BlobServiceClient(
//     `https://${accountName}.blob.core.windows.net`,
//     sharedKeyCredential
// );
// const containerClient = blobServiceClient.getContainerClient(containerName);
// const file = req.files.file;
// // const upload = multer({ 
// //   storage: storage,
// //   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// // });


//     if (!file) {
//         return res.status(400).send({statusCode:1, message:'No file uploaded.',data:null});
//     }else if (file.size>(5*1024*1024)){
//       return res.status(400).send({statusCode:1, message:'Maximum allowed size is 5MB',data:null});
//     }
//     const blobName = file.name;
//     const stream = file.data;

//     // Upload file to Azure Blob Storage
//     let mobileNumber = ""
//     debugger
//     const authHeader = (req.headers.authorization)?req.headers.authorization:null;
//     if(authHeader){
//         const token =  authHeader.split(' ')[1];
//     if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null});
//     console.log("token" , token);
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     mobileNumber = decoded.mobileNumber;
//     console.log("blipdecoded ",decoded.mobileNumber);
//     }
//     const blockBlobClient = containerClient.getBlockBlobClient(blobName);
//     try {
//         const uploadResponse = await blockBlobClient.upload(stream, stream.length);

//         console.log('File uploaded successfully to Azure Blob Storage:', uploadResponse);
//         const fileUrl = blockBlobClient.url;
//         console.log("fileUrl",fileUrl)
//         debugger;
//         const user = await User.findOneAndUpdate({ mobileNumber: mobileNumber },{ $set: { profilePicture: fileUrl } });
//         console.log("user ",user)
//     // console.log("user details ",user)
//         return res.status(200).send({statusCode:0,message:'',data:{profilePicture:fileUrl}});
//     } catch (error) {
//         console.error("Error uploading to Azure Blob Storage:", error);
//         return res.status(500).send({statusCode:1,message:'Error uploading file to Azure Blob Storage.',data:null});
//     }

// }

 //upload Blip  File

const uploadVideoFile = async (req, res) => {
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
const file = req.files.file;
// const upload = multer({ 
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// });


    if (!file) {
        return res.status(400).send({statusCode:1, message:'No file uploaded.',data:null});
    }else if (file.size>(20*1024*1024)){
      return res.status(400).send({statusCode:1, message:'Maximum allowed size is 5MB',data:null});
    }
    const blobName = file.name;
    const stream = file.data;

    // Upload file to Azure Blob Storage
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
        const uploadResponse = await blockBlobClient.upload(stream, stream.length);
        const fileUrl = blockBlobClient.url;
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
        if(authHeader){
            const token =  authHeader.split(' ')[1];
            if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log("token" , token);
                user_id = decoded._id;
                mobileNumber =decoded.mobileNumber?decoded.mobileNumber:null;
                console.log("user_id ",decoded._id);
                console.log("belie",req.body.isBelieverRequire)
              if( req.body.isBelieverRequire ==false)
                condition = { mobileNumber:mobileNumber}
              else if (req.body.isBelieverRequire && req.body.isBelieverRequire ==true){
                const ObjectId = require('mongoose').Types.ObjectId
                const user_ids = await User.find({_id:new ObjectId(user_id)},{believer:1})
                console.log("user_ids ",user_ids[0].believer);
                condition = { video_user_id :{
                  $in :user_ids[0].believer
                }}
                console.log("condition",condition)
              //  return  res.status(StatusCodes.OK).json({statusCode:"0",message:"",
              //       data:{user_ids}
              // });

              }
                debugger
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
                      tags: 1,
                      hashtag:1,
                      comments:1,
                      user_details:1,
                      views:1,
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
                 const totalComment = await Comment.aggregate([
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
                 if (result) {
                       console.log("user ", result);
                    res.status(StatusCodes.OK).json({statusCode:"0",message:"",
                    data:{result,totalComment}
              });
             
             } else {
              res.status(StatusCodes.OK).json({statusCode:1,
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
          tags: 1,
          hashtag:1,
          comments:1,
          user_details:1,
          views:1,
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
     if (result) {
           console.log("user ", result);
        res.status(StatusCodes.OK).json({statusCode:"0",message:"",
        data:{result,totalComment}
  });
 
 } else {
  res.status(StatusCodes.OK).json({statusCode:1,
      message: "Video does not exist..!",
      data:null
  });
 }
}
} catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
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
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "reaction is required",
        });
     }
     if (!req.body.video_id || !req.body.video_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
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
        res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result },
      });
 
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
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
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "reaction is required",
        });
     }
     if (!req.body.video_id || !req.body.video_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
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
        const result = await Video.findOneAndUpdate(filter, {$push:{videoRating:videoRating}}, {
          returnOriginal: false
        });
        res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result },
      });
 
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };
 /*End of code*/
 const totalVideoReaction = async (req, res) => {
   
  try {
    debugger;
    console.log("inside count ")
     
     if (!req.body.video_id || !req.body.video_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
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
        res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result ,grp},
      });
 
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 }; 

 const totalVideoRating = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside count ")
     
     if (!req.body.video_id || !req.body.video_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "video_id is required",
        });
     }
     
        debugger;
         const ObjectId = require('mongoose').Types.ObjectId
        
    //     res.status(StatusCodes.OK).json({statusCode:0,
    //      message:"",   
    //      data: { result },
    //   });
    result = await Video.aggregate([
        {
          $match: { _id: new ObjectId(req.body.video_id) } // Match the parent document with the given ID
        },
        {
          $project: {
            totalRating: { $size: '$videoRating' } // Project a field with the size of the subdocuments array
          }
        }
      ]);
        console.log("result is ",result);
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
        res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result ,RatingCount},
      });
 
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 }; 
/**/

const fetchGroupVideoRating = async (req, res) => {
  // console.log("validation ")
try {
  debugger;
  console.log("inside count ")
   
   if (!req.body.video_id || !req.body.video_id) {
      res.status(StatusCodes.BAD_REQUEST).json({
         message: "video_id is required",
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
      res.status(StatusCodes.OK).json({statusCode:0,
       message:"",   
       data:  RatingCount
    });

} catch (error) {
  console.log("catch ", error );
 res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
}
}; 
/*Blip Views */
const videoView = async (req, res) => {
  // console.log("validation ")
try {
  debugger;
  console.log("inside count ")
   
   if (!req.body.video_id || !req.body.video_id) {
      res.status(StatusCodes.BAD_REQUEST).json({
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
      res.status(StatusCodes.OK).json({statusCode:0,
       message:"",   
       data:  viewCount
    });

} catch (error) {
  console.log("catch ", error );
 res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
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
      res.status(StatusCodes.OK).json({statusCode:0,
        message:"",   
        data:  results
     });

    })
    .catch(error => {
      console.error('Error:', error);
      res.status(StatusCodes.OK).json({statusCode:1,
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
      res.status(StatusCodes.OK).json({statusCode:"0",message:"",
      data:{result,totalComment}
});

} else {
res.status(StatusCodes.OK).json({statusCode:1,
    message: "Video does not exist..!",
    data:null
});
}
} catch (error) {
  console.log("catch ", error );
 res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
}
};
/*End of the code*/
 module.exports = {fetchVideo,uploadVideoFile ,fetchAllVideo,postVideoReaction,
            postVideoRating,totalVideoReaction,totalVideoRating,fetchGroupVideoRating,videoView,trendingViews
          ,believersVideo};