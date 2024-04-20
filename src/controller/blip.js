const { StatusCodes } = require("http-status-codes");
const Blip = require("../models/blip");
const Comment = require("../models/comment");
const SubComment = require("../models/subcomment");
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

const fetchBlip = async (req, res) => {
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
    const result = await   Blip.aggregate([
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
      message: "Blip does not exist..!",
      data:null
  });
 }
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };

 //upload Profile Pic 


const uploadProfilePic = async (req, res) => {
  const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const accountName = process.env.ACCOUNT_NAME;
const accountKey = process.env.KEY_DATA;
const containerName = process.env.PROFILE_CONTAINER;
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
    }else if (file.size>(5*1024*1024)){
      return res.status(400).send({statusCode:1, message:'Maximum allowed size is 5MB',data:null});
    }
    const blobName = file.name;
    const stream = file.data;

    // Upload file to Azure Blob Storage
    let mobileNumber = ""
    debugger
    const authHeader = (req.headers.authorization)?req.headers.authorization:null;
    if(authHeader){
        const token =  authHeader.split(' ')[1];
    if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null});
    console.log("token" , token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    mobileNumber = decoded.mobileNumber;
    console.log("blipdecoded ",decoded.mobileNumber);
    }
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
        const uploadResponse = await blockBlobClient.upload(stream, stream.length);

        console.log('File uploaded successfully to Azure Blob Storage:', uploadResponse);
        const fileUrl = blockBlobClient.url;
        console.log("fileUrl",fileUrl)
        debugger;
        const user = await User.findOneAndUpdate({ mobileNumber: mobileNumber },{ $set: { profilePicture: fileUrl } });
        console.log("user ",user)
    // console.log("user details ",user)
        return res.status(200).send({statusCode:0,message:'',data:{profilePicture:fileUrl}});
    } catch (error) {
        console.error("Error uploading to Azure Blob Storage:", error);
        return res.status(500).send({statusCode:1,message:'Error uploading file to Azure Blob Storage.',data:null});
    }

}

 //upload Blip  File

const uploadBlipFile = async (req, res) => {
    const authHeader = (req.headers.authorization)?req.headers.authorization:null;
    let mobileNumber = ""
    debugger
    if(authHeader){
        const token =  authHeader.split(' ')[1];
    if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null});
    console.log("token" , token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    mobileNumber = decoded.mobileNumber;
    blip_user_id = decoded._id
    console.log("blipdecoded ",decoded.mobileNumber);
    }
    
    
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const accountName = process.env.ACCOUNT_NAME;
const accountKey = process.env.KEY_DATA;
const containerName = process.env.BLIP_CONTAINER;
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
        let description = req.body.captions? req.body.captions:"";
        let hashtag = req.body.hashtags? (req.body.hashtags).split(","):"";
        let tags = req.body.hashtags?(req.body.peoples).split(","):"";
        const blipData ={
            blipUrl:fileUrl,
            description:description,
            hashtag:hashtag,
            tags:tags,
            mobileNumber:mobileNumber,
            blip_user_id : blip_user_id
        }

        Blip.create(blipData).then((data, err) => {
            if (err) res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
            });
        console.log('File uploaded successfully to Azure Blob Storage:', uploadResponse);
        
        return res.status(200).send({statusCode:0,message:'',data:"File uploaded successfully."});
    } catch (error) {
        console.error("Error uploading to Azure Blob Storage:", error);
        return res.status(500).send({statusCode:1,message:'Error uploading file to Azure Blob Storage.',data:null});
    }

}

const fetchAllBlip = async (req, res) => {
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
                condition = { blip_user_id :{
                  $in :user_ids[0].believer
                }}
                console.log("condition",condition)
              //  return  res.status(StatusCodes.OK).json({statusCode:"0",message:"",
              //       data:{user_ids}
              // });

              }
                debugger
                const result = await   Blip.aggregate([ 
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
                      blipUrl: 1,
                      tags: 1,
                      hashtag:1,
                      comments:1,
                      user_details:1,
                      views:1,
                      ratingCount:  {
                        $cond: {
                          if: { $isArray: "$blipRating" }, // Check if reactions field is an array
                          then: { $size: "$blipRating" },   // If reactions is an array, return its size
                          else: 0                           // If reactions is not an array or doesn't exist, return 0
                        }
                      },
                      reactionCount: {
                        $cond: {
                          if: { $isArray: "$blipReaction" }, // Check if reactions field is an array
                          then: { $size: "$blipReaction" },   // If reactions is an array, return its size
                          else: 0                           // If reactions is not an array or doesn't exist, return 0
                        }
                      },
                      
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
                        _id: '$blip_id',
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
                  message: "Blip does not exist..!",
                  data:null
              });
             }
        }
    
    else{
    const result = await   Blip.aggregate([ 
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
          blipUrl: 1,
          tags: 1,
          hashtag:1,
          comments:1,
          user_details:1,
          views:1,
          ratingCount:  {
            $cond: {
              if: { $isArray: "$blipRating" }, // Check if reactions field is an array
              then: { $size: "$blipRating" },   // If reactions is an array, return its size
              else: 0                           // If reactions is not an array or doesn't exist, return 0
            }
          },
          reactionCount: {
            $cond: {
              if: { $isArray: "$blipReaction" }, // Check if reactions field is an array
              then: { $size: "$blipReaction" },   // If reactions is an array, return its size
              else: 0                           // If reactions is not an array or doesn't exist, return 0
            }
          },
          
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
          $group: {
            _id: '$blip_id',
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
      message: "Blip does not exist..!",
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

 const postReaction = async (req, res) => {
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
     if (!req.body.blip_id || !req.body.blip_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "blip_id is required",
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
                console.log("blipdecoded ",decoded._id);
        }
        /*reactions */
        
        /**/
        const ObjectId = require('mongoose').Types.ObjectId
        user_id = new ObjectId(user_id)
        console.log("user_id ", user_id)
        const blipReaction ={
            reaction_user_id:user_id,
            reaction:req.body.reaction,
            reactionValue:reactionValue
        }
        debugger;
        // const ObjectId = require('mongoose').Types.ObjectId
        const filter = { _id: new ObjectId( req.body.blip_id) };
        console.log("filer is ",filter);
        const result = await Blip.findOneAndUpdate(filter, {$push:{blipReaction:blipReaction}}, {
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

  const postRating = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.rating || !req.body.rating) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "reaction is required",
        });
     }
     if (!req.body.blip_id || !req.body.blip_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "blip_id is required",
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
                console.log("blipdecoded ",decoded._id);
        }
        const ObjectId = require('mongoose').Types.ObjectId
        user_id = new ObjectId(user_id)
        console.log("user_id ", user_id)
        const blipRating ={
          rating_user_id:user_id,
            ratingno:req.body.rating
        }
        debugger;
        // const ObjectId = require('mongoose').Types.ObjectId
        const filter = { _id: new ObjectId( req.body.blip_id) };
        console.log("filer is ",filter);
        const result = await Blip.findOneAndUpdate(filter, {$push:{blipRating:blipRating}}, {
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
 const totalReaction = async (req, res) => {
   
  try {
    debugger;
    console.log("inside count ")
     
     if (!req.body.blip_id || !req.body.blip_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "blip_id is required",
        });
     }
     
        debugger;
         const ObjectId = require('mongoose').Types.ObjectId
   
    result = await Blip.aggregate([
        {
          $match: { _id: new ObjectId(req.body.blip_id) } // Match the parent document with the given ID
        },
        {
          $project: {
            totalReaction: { $size: '$blipReaction' } // Project a field with the size of the subdocuments array
          }
        }
      ]);
        console.log("result is ",result);
        const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
        const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
        const offset = (pageNumber - 1) * pageSize; // Calculate offset
   
    grp = await Blip.aggregate([
        {
          $unwind: '$blipReaction' // Unwind the subdocuments array
        },
        {
          $lookup: {
              from: "users", // name of the comment collection
              localField: "blipReaction.reaction_user_id",
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
              "blipReaction.reaction": 1,
              "blipReaction.updatedAt":1,
              "user_details.webName": 1,
              "user_details.fullName": 1,
              "user_details.profilePicture": 1,// Include other user details you may need
              "blipReaction.reactionValue":1
          }
      },
      {
        $skip: offset
      },
      {
        $limit: pageSize
      }
      ])
      console.log("blip count reactionwise ",grp)
        res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result ,grp},
      });
 
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 }; 

 const totalRating = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside count ")
     
     if (!req.body.blip_id || !req.body.blip_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "blip_id is required",
        });
     }
     
        debugger;
         const ObjectId = require('mongoose').Types.ObjectId
        
    //     res.status(StatusCodes.OK).json({statusCode:0,
    //      message:"",   
    //      data: { result },
    //   });
    result = await Blip.aggregate([
        {
          $match: { _id: new ObjectId(req.body.blip_id) } // Match the parent document with the given ID
        },
        {
          $project: {
            totalRating: { $size: '$blipRating' } // Project a field with the size of the subdocuments array
          }
        }
      ]);
        console.log("result is ",result);
        const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
        const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
        const offset = (pageNumber - 1) * pageSize; // Calculate offset
      RatingCount = await Blip.aggregate([
        {
            $match:{
                _id : new ObjectId(req.body.blip_id)
            }
        },
        {
          $unwind: '$blipRating' // Unwind the subdocuments array
        },
        {
          $lookup: {
              from: "users", // name of the comment collection
              localField: "blipRating.rating_user_id",
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
              "blipRating.ratingno": 1,
              "blipRating.updatedAt":1,
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
      console.log("blip count ratings ",RatingCount)
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

const fetchGroupRating = async (req, res) => {
  // console.log("validation ")
try {
  debugger;
  console.log("inside count ")
   
   if (!req.body.blip_id || !req.body.blip_id) {
      res.status(StatusCodes.BAD_REQUEST).json({
         message: "blip_id is required",
      });
   }
   
      debugger;
       const ObjectId = require('mongoose').Types.ObjectId
      

      // console.log("result is ",result);
      const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
      const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
      const offset = (pageNumber - 1) * pageSize; // Calculate offset
    RatingCount = await Blip.aggregate([
      {
          $match:{
              _id : new ObjectId(req.body.blip_id)
          }
      },
      {
        $unwind: '$blipRating' // Unwind the subdocuments array
      },
      {
        $group: {
          _id: '$blipRating.ratingno',
          count: { $sum: 1 } 
        },
      }
    ])
    console.log("blip count ratings ",RatingCount)
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
const blipView = async (req, res) => {
  // console.log("validation ")
try {
  debugger;
  console.log("inside count ")
   
   if (!req.body.blip_id || !req.body.blip_id) {
      res.status(StatusCodes.BAD_REQUEST).json({
         message: "blip_id is required",
      });
   }
   
      debugger;
       const ObjectId = require('mongoose').Types.ObjectId


       const conditions = {  _id: new ObjectId(req.body.blip_id) };

// Define the update operation
const update = { $inc: { views: 1 } }; // $inc is used to increment a value

// Options to findOneAndUpdate method (optional)
const options = {
  new: true, // return the modified document rather than the original
};
viewCount = await Blip.findOneAndUpdate(conditions, update, options);
    // viewCount = await Blip.findOneAndUpdate({ _id: new ObjectId(req.body.blip_id) },{ $inc: { views: 1 } }, {new: true });
    console.log("blip views ",viewCount)
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
            if: { $isArray: "$blipRating" }, // Check if reactions field is an array
            then: { $size: "$blipRating" },   // If reactions is an array, return its size
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
  Blip.aggregate(pipeline)
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
const believersBlip = async (req, res) => {
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
  const user_ids = User.find({_id:new ObjectId(user_id)},{believer:1})
  console.log("user_ids ",user_ids);
  return;
  //  const data = await Blip.find({});
  const result = await   Blip.aggregate([


   {

   },
    {
      $project: {
        _id: 1,
        blipUrl: 1,
        tags: 1,
        hashtag:1,
        comments:1,
        // ratingCount: { $size: '$blipRating' }, // Count of ratings sub-documents
        ratingCount:  {
          $cond: {
            if: { $isArray: "$blipRating" }, // Check if reactions field is an array
            then: { $size: "$blipRating" },   // If reactions is an array, return its size
            else: 0                           // If reactions is not an array or doesn't exist, return 0
          }
        },
        reactionCount: {
          $cond: {
            if: { $isArray: "$blipReaction" }, // Check if reactions field is an array
            then: { $size: "$blipReaction" },   // If reactions is an array, return its size
            else: 0                           // If reactions is not an array or doesn't exist, return 0
          }
        },
      }
    }
   ]);
   debugger;
   const totalComment = await Comment.aggregate([
      {
        $group: {
          _id: '$blip_id',
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
    message: "Blip does not exist..!",
    data:null
});
}
} catch (error) {
  console.log("catch ", error );
 res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
}
};
/*End of the code*/
 module.exports = {fetchBlip,uploadProfilePic,uploadBlipFile ,fetchAllBlip,postReaction,
            postRating,totalReaction,totalRating,fetchGroupRating,blipView,trendingViews
          ,believersBlip};