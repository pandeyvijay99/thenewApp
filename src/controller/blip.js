const { StatusCodes } = require("http-status-codes");
const Blip = require("../models/blip");
const Comment = require("../models/comment");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
const { BlobServiceClient,StorageSharedKeyCredential } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
// const { DefaultAzureCredential } = require('@azure/identity');
const multer = require('multer');
const path = require('path');
const User = require("../models/auth");
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
            mobileNumber:mobileNumber
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
    console.log("inside validation ")
    //  if (!req.body.countryCode || !req.body.mobileNumber) {
    //     res.status(StatusCodes.BAD_REQUEST).json({
    //        message: "Please Enter Valid Number with country Code",
    //     });
    //  }
 
    //  const data = await Blip.find({});
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
               tags: 1,
               hashtag:1,
               count:1,
               user_details: {$arrayElemAt:["$user_details",0]},
               blipUrl:1,
               createdAt:1,
           }
       }
     ]);
     debugger;
    //  const records = await Comment.aggregate([
    //     {
    //       $group: {
    //         _id: '$blip_id',
    //         count: { $sum: 1 } // this means that the count will increment by 1
    //       }
    //     }
    //   ]);
    //  console.log("user details ",records)
     if (result) {
           console.log("user ", result);
        res.status(StatusCodes.OK).json({statusCode:"0",message:"",
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
 /*Post Reaction functionality */

 const postReaction = async (req, res) => {
    // console.log("validation ")
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
        const ObjectId = require('mongoose').Types.ObjectId
        user_id = new ObjectId(user_id)
        console.log("user_id ", user_id)
        const blipReaction ={
            reaction_user_id:user_id,
            reaction:req.body.reaction
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
            reaction_user_id:user_id,
            rating:req.body.rating
        }
        debugger;
        // const ObjectId = require('mongoose').Types.ObjectId
        const filter = { _id: new ObjectId( req.body.blip_id) };
        console.log("filer is ",filter);
        const result = await Blip.findOneAndUpdate(filter, {$push:{ratings:blipRating}}, {
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
            totalReaction: { $size: '$blipReaction' } // Project a field with the size of the subdocuments array
          }
        }
      ]);
        console.log("result is ",result);
    //   groupbyres = await Blip.aggregate([
    //     {
    //         $match:{
    //             _id : new ObjectId(req.body.blip_id)
    //         }
    //     },
    //     {
    //       $unwind: '$blipReaction' // Unwind the subdocuments array
    //     },
    //     {
    //       $group: {
    //         reaction: '$blipReaction.reaction', // Group by the 'name' field within subdocuments
    //         blipReactionC: { $sum: 1 } // Count subdocuments in each group
    //       }
    //     }
    //   ])
    grp = await Blip.aggregate([
        {
          $unwind: '$blipReaction' // Unwind the subdocuments array
        },
        {
          $group: {
            _id: '$blipReaction.reaction', // Group by the 'name' field within subdocuments
            totalCount: { $sum: 1 } // Count subdocuments in each group
          }
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
            totalRating: { $size: '$ratings' } // Project a field with the size of the subdocuments array
          }
        }
      ]);
        console.log("result is ",result);
      grp = await Blip.aggregate([
        {
            $match:{
                _id : new ObjectId(req.body.blip_id)
            }
        },
        {
          $unwind: '$ratings' // Unwind the subdocuments array
        },
        {
          $group: {
            ratings: '$ratings.rating', // Group by the 'name' field within subdocuments
            totalCount: { $sum: 1 } // Count subdocuments in each group
          }
        }
      ])
      console.log("blip count ratings ",grp)
        res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result ,groupbyres},
      });
 
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 }; 
 module.exports = {fetchBlip,uploadProfilePic,uploadBlipFile ,fetchAllBlip,postReaction,postRating,totalReaction,totalRating};