const { StatusCodes } = require("http-status-codes");
const Photo = require("../models/photo");
const PhotoComment = require("../models/photocomment");
// const PotoSubComment = require("../models/photosubcomment");
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

const fetchPhoto = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.countryCode || !req.body.mobileNumber) {
        return res.status(StatusCodes.BAD_REQUEST).json({
           message: "Please Enter Valid Number with country Code",
        });
     }
 
    //  const data = await Photo.find({ mobileNumber: req.body.mobileNumber });
    const result = await   Photo.aggregate([
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
      message: "Photo does not exist..!",
      data:null
  });
 }
 } catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };

 //upload Profile Pic 




 //upload Photo  File

const uploadPhotoFile = async (req, res) => {
    const authHeader = (req.headers.authorization)?req.headers.authorization:null;
    let mobileNumber = ""
    debugger
    if(authHeader){
        const token =  authHeader.split(' ')[1];
    if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null});
    console.log("token" , token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    mobileNumber = decoded.mobileNumber;
    photo_user_id = decoded._id
    console.log("photodecoded ",decoded.mobileNumber);
    }
    console.log("file data",req.files.file)
    debugger;
    const filedata = (Array.isArray(req.files.file)?req.files.file:[req.files.file]).filter(e=>e);
    console.log("myfile ",filedata.length)
    // const filedata = req.files.file?req.files.file:"";
    // console.log("filedata ", filedata[0].name,typeof(filedata));
    if(filedata.length==0 )
      return res.status(400).send({statusCode:1, message:'No file uploaded.',data:null}); 
    console.log("file length ",filedata.length)
    
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const accountName = process.env.ACCOUNT_NAME;
const accountKey = process.env.KEY_DATA;
const containerName = process.env.PHOTO_CONTAINER;
const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
);
    
    const containerClient = blobServiceClient.getContainerClient(containerName);

    if (!filedata) {
        return res.status(400).send({statusCode:1, message:'No file uploaded.',data:null});
    }else if (filedata.size>(20*1024*1024)){
      return res.status(400).send({statusCode:1, message:'Maximum allowed size is 5MB',data:null});
    }
    let blobURLs =[];
    for (const files of filedata) { 
    const blobName = files.name;
    const stream = files.data;
      console.log("filename ",blobName)
    // Upload file to Azure Blob Storage
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
        const uploadResponse = await blockBlobClient.upload(stream, stream.length);
        const fileUrl = blockBlobClient.url;
        blobURLs.push(fileUrl)
        debugger;
        console.log("fileUrl",fileUrl)
        console.log('File uploaded successfully to Azure Blob Storage:', uploadResponse);
        // const { countryCode, mobileNumber } = req.body;
      } catch (error) {
        console.error("Error uploading to Azure Blob Storage:", error);
        return res.status(500).send({statusCode:1,message:'Error uploading file to Azure Blob Storage.',data:null});
    }
  }
        debugger;
        let description = req.body.captions? req.body.captions:"";
        let hashtag = req.body.hashtags? (req.body.hashtags).split(","):"";
        let tags = req.body.peoples?(req.body.peoples).split(","):"";
        const photoData ={
            photoUrl:blobURLs,
            description:description,
            hashtag:hashtag,
            tags:tags,
            mobileNumber:mobileNumber,
            photo_user_id : photo_user_id
        }

        Photo.create(photoData).then((data, err) => {
            if (err) return res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
            });
       
        
        return res.status(200).send({statusCode:0,message:'',data:"File uploaded successfully."});
  
  

}

const fetchAllPhoto = async (req, res) => {
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
                condition = { photo_user_id :{
                  $in :user_ids[0].believer
                }}
                console.log("condition",condition)
              //  return  res.status(StatusCodes.OK).json({statusCode:"0",message:"",
              //       data:{user_ids}
              // });

              }
                debugger
                const result = await   Photo.aggregate([ 
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
                      photoUrl: 1,
                      tags: 1,
                      hashtag:1,
                      comments:1,
                      user_details:1,
                      views:1,
                      ratingCount:  {
                        $cond: {
                          if: { $isArray: "$photoRating" }, // Check if reactions field is an array
                          then: { $size: "$photoRating" },   // If reactions is an array, return its size
                          else: 0                           // If reactions is not an array or doesn't exist, return 0
                        }
                      },
                      reactionCount: {
                        $cond: {
                          if: { $isArray: "$photoReaction" }, // Check if reactions field is an array
                          then: { $size: "$photoReaction" },   // If reactions is an array, return its size
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
                 const totalComment = await PhotoComment.aggregate([
                  {
                    $match :condition
                  },
                    {
                      $group: {
                        _id: '$photo_id',
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
                  message: "Photo does not exist..!",
                  data:null
              });
             }
        }
    
    else{
    const result = await   Photo.aggregate([ 
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
          photoUrl: 1,
          tags: 1,
          hashtag:1,
          comments:1,
          user_details:1,
          views:1,
          ratingCount:  {
            $cond: {
              if: { $isArray: "$photoRating" }, // Check if reactions field is an array
              then: { $size: "$photoRating" },   // If reactions is an array, return its size
              else: 0                           // If reactions is not an array or doesn't exist, return 0
            }
          },
          reactionCount: {
            $cond: {
              if: { $isArray: "$photoReaction" }, // Check if reactions field is an array
              then: { $size: "$photoReaction" },   // If reactions is an array, return its size
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
     const totalComment = await PhotoComment.aggregate([
        {
          $group: {
            _id: '$photo_id',
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
      message: "Photo does not exist..!",
      data:null
  });
 }
}
} catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
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
        return res.status(StatusCodes.BAD_REQUEST).json({
           message: "reaction is required",
        });
     }
     if (!req.body.photo_id || !req.body.photo_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
           message: "photo_id is required",
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
                console.log("photodecoded ",decoded._id);
        }
        /*reactions */
        
        /**/
        const ObjectId = require('mongoose').Types.ObjectId
        user_id = new ObjectId(user_id)
        console.log("user_id ", user_id)
        const photoReaction ={
            reaction_user_id:user_id,
            reaction:req.body.reaction,
            reactionValue:reactionValue
        }
        debugger;
        // const ObjectId = require('mongoose').Types.ObjectId
        const filter = { _id: new ObjectId( req.body.photo_id) };
        console.log("filer is ",filter);
        const result = await Photo.findOneAndUpdate(filter, {$push:{photoReaction:photoReaction}}, {
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

  const postRating = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.rating || !req.body.rating) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "reaction is required",data:null
        });
     }
     if (!req.body.photo_id || !req.body.photo_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "photo_id is required",data:null
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
                console.log("photodecoded ",decoded._id);
        }
        const ObjectId = require('mongoose').Types.ObjectId
        user_id = new ObjectId(user_id)
        console.log("user_id ", user_id)
        const photoRating ={
          rating_user_id:user_id,
            ratingno:req.body.rating
        }
        debugger;
        // const ObjectId = require('mongoose').Types.ObjectId
        const filter = { _id: new ObjectId( req.body.photo_id) };
        console.log("filer is ",filter);
        const result = await Photo.findOneAndUpdate(filter, {$push:{photoRating:photoRating}}, {
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
 const totalReaction = async (req, res) => {
   
  try {
    debugger;
    console.log("inside count ")
     
     if (!req.body.photo_id || !req.body.photo_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "photo_id is required",data:null
        });
     }
     
        debugger;
         const ObjectId = require('mongoose').Types.ObjectId
   
    result = await Photo.aggregate([
        {
          $match: { _id: new ObjectId(req.body.photo_id) } // Match the parent document with the given ID
        },
        {
          $project: {
            totalReaction: { $size: '$photoReaction' } // Project a field with the size of the subdocuments array
          }
        }
      ]);
        console.log("result is ",result);
        const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
        const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
        const offset = (pageNumber - 1) * pageSize; // Calculate offset
   
    grp = await Photo.aggregate([
        {
          $unwind: '$photoReaction' // Unwind the subdocuments array
        },
        {
          $lookup: {
              from: "users", // name of the comment collection
              localField: "photoReaction.reaction_user_id",
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
              "photoReaction.reaction": 1,
              "photoReaction.updatedAt":1,
              "user_details.webName": 1,
              "user_details.fullName": 1,
              "user_details.profilePicture": 1,// Include other user details you may need
              "photoReaction.reactionValue":1
          }
      },
      {
        $skip: offset
      },
      {
        $limit: pageSize
      }
      ])
      console.log("photo count reactionwise ",grp)
       return res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result ,grp},
      });
 
 } catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 }; 

 const totalRating = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside count ")
     
     if (!req.body.photo_id || !req.body.photo_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "photo_id is required",data:null
        });
     }
     
        debugger;
         const ObjectId = require('mongoose').Types.ObjectId
        
    //     res.status(StatusCodes.OK).json({statusCode:0,
    //      message:"",   
    //      data: { result },
    //   });
    result = await Photo.aggregate([
        {
          $match: { _id: new ObjectId(req.body.photo_id) } // Match the parent document with the given ID
        },
        {
          $project: {
            totalRating: { $size: '$photoRating' } // Project a field with the size of the subdocuments array
          }
        }
      ]);
        console.log("result is ",result);
        const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
        const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
        const offset = (pageNumber - 1) * pageSize; // Calculate offset
      RatingCount = await Photo.aggregate([
        {
            $match:{
                _id : new ObjectId(req.body.photo_id)
            }
        },
        {
          $unwind: '$photoRating' // Unwind the subdocuments array
        },
        {
          $lookup: {
              from: "users", // name of the comment collection
              localField: "photoRating.rating_user_id",
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
              "photoRating.ratingno": 1,
              "photoRating.updatedAt":1,
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
      console.log("photo count ratings ",RatingCount)
        return res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { result ,RatingCount},
      });
 
 } catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 }; 
/**/

const fetchGroupRating = async (req, res) => {
  // console.log("validation ")
try {
  debugger;
  console.log("inside count ")
   
   if (!req.body.photo_id || !req.body.photo_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
         message: "photo_id is required",
      });
   }
   
      debugger;
       const ObjectId = require('mongoose').Types.ObjectId
      

      // console.log("result is ",result);
      const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
      const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
      const offset = (pageNumber - 1) * pageSize; // Calculate offset
    RatingCount = await Photo.aggregate([
      {
          $match:{
              _id : new ObjectId(req.body.photo_id)
          }
      },
      {
        $unwind: '$photoRating' // Unwind the subdocuments array
      },
      {
        $group: {
          _id: '$photoRating.ratingno',
          count: { $sum: 1 } 
        },
      }
    ])
    console.log("photo count ratings ",RatingCount)
      return res.status(StatusCodes.OK).json({statusCode:0,
       message:"",   
       data:  RatingCount
    });

} catch (error) {
  console.log("catch ", error );
 return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
}
}; 
/*Photo Views */
const photoView = async (req, res) => {
  // console.log("validation ")
try {
  debugger;
  console.log("inside count ")
   
   if (!req.body.photo_id || !req.body.photo_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
         message: "photo_id is required",
      });
   }
   
      debugger;
       const ObjectId = require('mongoose').Types.ObjectId


       const conditions = {  _id: new ObjectId(req.body.photo_id) };

// Define the update operation
const update = { $inc: { views: 1 } }; // $inc is used to increment a value

// Options to findOneAndUpdate method (optional)
const options = {
  new: true, // return the modified document rather than the original
};
viewCount = await Photo.findOneAndUpdate(conditions, update, options);
    // viewCount = await Photo.findOneAndUpdate({ _id: new ObjectId(req.body.photo_id) },{ $inc: { views: 1 } }, {new: true });
    console.log("photo views ",viewCount)
      return res.status(StatusCodes.OK).json({statusCode:0,
       message:"",   
       data:  viewCount
    });

} catch (error) {
  console.log("catch ", error );
 return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
}
}; 

/*Trending Photo  */
const trendingViews = async (req, res) => {
  const pipeline = [
    {
      $project: {
        views: 1,
        ratingCount:  {
          $cond: {
            if: { $isArray: "$photoRating" }, // Check if reactions field is an array
            then: { $size: "$photoRating" },   // If reactions is an array, return its size
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
  Photo.aggregate(pipeline)
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

/*BelieversPhoto Functionality*/
const believersPhoto = async (req, res) => {
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
  //  const data = await Photo.find({});
  const result = await   Photo.aggregate([
    {
      $project: {
        _id: 1,
        photoUrl: 1,
        tags: 1,
        hashtag:1,
        comments:1,
        // ratingCount: { $size: '$photoRating' }, // Count of ratings sub-documents
        ratingCount:  {
          $cond: {
            if: { $isArray: "$photoRating" }, // Check if reactions field is an array
            then: { $size: "$photoRating" },   // If reactions is an array, return its size
            else: 0                           // If reactions is not an array or doesn't exist, return 0
          }
        },
        reactionCount: {
          $cond: {
            if: { $isArray: "$photoReaction" }, // Check if reactions field is an array
            then: { $size: "$photoReaction" },   // If reactions is an array, return its size
            else: 0                           // If reactions is not an array or doesn't exist, return 0
          }
        },
      }
    }
   ]);
   debugger;
   const totalComment = await PhotoComment.aggregate([
      {
        $group: {
          _id: '$photo_id',
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
    message: "Photo does not exist..!",
    data:null
});
}
} catch (error) {
  console.log("catch ", error );
 return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
}
};
/*End of the code*/
 module.exports = {fetchPhoto,uploadPhotoFile ,fetchAllPhoto,postReaction,
            postRating,totalReaction,totalRating,fetchGroupRating,photoView,trendingViews
          ,believersPhoto};