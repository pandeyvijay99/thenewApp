const { StatusCodes } = require("http-status-codes");
const VideoComment = require("../models/videocomment");
const videosubcommentModel =  require("../models/videosubcomment")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { BlobServiceClient,StorageSharedKeyCredential } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
// const { DefaultAzureCredential } = require('@azure/identity');
const multer = require('multer');
const path = require('path');
const mongoose = require("mongoose");
const reactionD = require("../helper");
require("dotenv").config();


//Insert Comments

const postVideoComment = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.comment || !req.body.comment) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "Coment is required",data:null
        });
     }
     if (!req.body.video_id || !req.body.video_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "video_id is required",data:null
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
        const ObjectId = require('mongoose').Types.ObjectId
        user_id = new ObjectId(user_id)
        console.log("user_id ", user_id)
        const videocommentData ={
            user_id:user_id,
            video_id:req.body.video_id,
            comment:req.body.comment
        }
        debugger;
        VideoComment.create(videocommentData).then((data, err) => {
            if (err) return res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
            });
        console.log('comment data', videocommentData);
        
        return res.status(200).send({statusCode:0,message:'',data:"Comment added successfully."});
 
 } catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };

 const postVideoSubComment = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.comment || !req.body.comment) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "Coment is required",data:null
        });
     }
        const authHeader = (req.headers.authorization)?req.headers.authorization:null;
        if(authHeader){
            const token =  authHeader.split(' ')[1];
            if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log("token" , token);
                comment_user_id = decoded._id;
                console.log("videodecoded ",decoded._id);
        }
        const videocommentData =[{
            comment_user_id:comment_user_id,
            comment:req.body.comment,
            parent_comment_id:req.body.parent_comment_id

        }]

        debugger;
        const ObjectId = require('mongoose').Types.ObjectId
        // const filter = { _id: new ObjectId( req.body.parent_commnet_id) };
        // console.log("filer is ",filter);
        // const doc = await subcommentModel.findOneAndUpdate(filter, {$push:{subComment:commentData}}, {
        //   returnOriginal: false
        // });

        videosubcommentModel.create(videocommentData).then((data, err) => {
          if (err) return res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
          });
      console.log('comment data', videocommentData);
      
      return res.status(200).send({statusCode:0,message:'',data:"sub-Comment added successfully."});

      //   res.status(StatusCodes.OK).json({statusCode:0,
      //    message:"",   
      //    data: { doc },
      // });
 
 } catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };


 //upload Video  File



const fetchVideoComment = async (req, res) => {
    
  try {
    if (!req.body.video_id || !req.body.video_id) {
       return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "Video id is required",data:null
        });
     }
      debugger;
      let user_id="";
 
const result = await   VideoComment.aggregate([
   {
       $match:{
         video_id:req.body.video_id
       } 
   },
//    {
//     $lookup: {
//         from: "subcomments", // name of the comment collection
//         localField: "comment_id",
//         foreignField: "_id",
//         as: "subcomment"
//     }
// },
   {
       $lookup: {
           from: "users", // name of the comment collection
           localField: "user_id",
           foreignField: "_id",
           as: "user_details"
       }
   },
   {
      $project: {
          _id: 1,
          comment:1,
          user_details: {$arrayElemAt:["$user_details",0]},
          reactionCount: {
            $cond: {
              if: { $isArray: "$subcomment" }, // Check if reactions field is an array
              then: { $size: "$subcomment" },   // If reactions is an array, return its size
              else: 0                           // If reactions is not an array or doesn't exist, return 0
            }
          },
          subdocument: {
            $cond: {
              if: { $isArray: "$commentReaction" }, // Check if reactions field is an array
              then: { $size: "$commentReaction" },   // If reactions is an array, return its size
              else: 0                           // If reactions is not an array or doesn't exist, return 0
            }
          },
          createdAt:1,
          updatedAt:1
      },
      
  },
  

]);
console.log("data is ", result);
//   data.push({totalCount:result.length})
console.log("data lenght ", result.length);
if(result.length>0){
   let totalCount = result.length;
     if (result) {
        //    console.log("user ", data);
        return res.status(StatusCodes.OK).json({statusCode:0,message:"",
        data:{result,totalCount:totalCount}
  });
}else{
    return res.status(StatusCodes.OK).json({statusCode:1,message:"something went wrong",
    data:null
})
 }
 } else {
  return res.status(StatusCodes.OK).json({statusCode:1,
      message: "Comment does not exist..!",
      data:null
  });
 }






 } catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };

 const fetchVideoSubComment = async (req, res) => {
    
    try {
      if (!req.body.comment_id) {
          return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
             message: "Comment  id is required",data:null
          });
       }
   debugger;
   var limit = req.body.limit
  , offset = Math.max(0, req.body.offset)
   const ObjectId = require('mongoose').Types.ObjectId
   const filter = { parent_comment_id:  req.body.comment_id };
  //  const result = await   Comment.aggregate([
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
  //                localField: "subComment.comment_user_id",
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
  
  const result = await   videosubcommentModel.aggregate([
    {
      $match :{
        parent_comment_id :req.body.comment_id
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
                    user_details: {$arrayElemAt:["$user_details",0]},
                    createdAt:1,
                    updatedAt:1
                   
                }
    }
  ])
     console.log("data is ", result);
     console.log("data lenght ", result.length);
       if(result.length>0){
         let totalCount = result.length;
        
           if (result) {
              return res.status(StatusCodes.OK).json({statusCode:0,message:"",
              data:{result,totalCount:totalCount}
        });
      }else{
          return res.status(StatusCodes.OK).json({statusCode:1,message:"something went wrong",
          data:null
      })
       }
       } else {
        return res.status(StatusCodes.OK).json({statusCode:1,
            message: "Comment does not exist..!",
            data:null
        });
       }
   } catch (error) {
      console.log("catch ", error );
     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
    }
   };

/*Post Comment functionality */

const postVideoCommentReaction = async (req, res) => {
  
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
      return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
         message: "reaction is required",data:null
      });
   }
   if (!req.body.comment_id || !req.body.comment_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
         message: "comment_id is required",data:null
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
              console.log("comment user decoded ",decoded._id);
      }
      /*reactions */
      
      /**/
      const ObjectId = require('mongoose').Types.ObjectId
      user_id = new ObjectId(user_id)
      console.log("user_id ", user_id)
      const videocommentReaction ={
          reaction_user_id:user_id,
          reaction:req.body.reaction,
          reactionValue:reactionValue
      }
      debugger;
      // const ObjectId = require('mongoose').Types.ObjectId
      const filter = { _id: new ObjectId( req.body.comment_id) };
      console.log("filer is ",filter);
      const result = await Comment.findOneAndUpdate(filter, {$push:{commentReaction:videocommentReaction}}, {
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

const fetchVideoCommentReaction = async (req, res) => {
   
  try {
    debugger;
    console.log("inside count ")
     
     if (!req.body.comment_id || !req.body.comment_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "comment_id is required",data:null
        });
     }
     
        debugger;
         const ObjectId = require('mongoose').Types.ObjectId
   
    result = await VideoComment.aggregate([
        {
          $match: { _id: new ObjectId(req.body.comment_id) } // Match the parent document with the given ID
        },
        {
          $project: {
            totalReaction: { $size: '$commentReaction' } // Project a field with the size of the subdocuments array
          }
        }
      ]);
        console.log("result is ",result);
        const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
        const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
        const offset = (pageNumber - 1) * pageSize; // Calculate offset
   
    grp = await VideoComment.aggregate([
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
              "commentReaction.updatedAt":1,
              "user_details.webName": 1,
              "user_details.fullName": 1,
              "user_details.profilePicture": 1,// Include other user details you may need
              "commentReaction.reactionValue":1
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

 module.exports = {postVideoComment,postVideoSubComment,fetchVideoComment,fetchVideoSubComment,postVideoCommentReaction,fetchVideoCommentReaction};