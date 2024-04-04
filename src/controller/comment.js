const { StatusCodes } = require("http-status-codes");
const Comment = require("../models/comment");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { BlobServiceClient,StorageSharedKeyCredential } = require("@azure/storage-blob");
const { v1: uuidv1 } = require("uuid");
// const { DefaultAzureCredential } = require('@azure/identity');
const multer = require('multer');
const path = require('path');
const mongoose = require("mongoose");
require("dotenv").config();


//Insert Comments

const postComment = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.comment || !req.body.comment) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "Coment is required",
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
        const commentData ={
            user_id:user_id,
            blip_id:req.body.blip_id,
            comment:req.body.comment
        }
        debugger;
        Comment.create(commentData).then((data, err) => {
            if (err) res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
            });
        console.log('comment data', commentData);
        
        return res.status(200).send({statusCode:0,message:'',data:"Comment added successfully."});
 
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };

 const postSubComment = async (req, res) => {
    // console.log("validation ")
  try {
    debugger;
    console.log("inside validation ")
     if (!req.body.comment || !req.body.comment) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "Coment is required",
        });
     }
     if (!req.body.comment_user_id || !req.body.comment_user_id) {
        res.status(StatusCodes.BAD_REQUEST).json({
           message: "comment_user_id is required",
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
        const commentData =[{
            comment_user_id:req.body.comment_user_id,
            subcomment:req.body.comment
        }]

        debugger;
        const ObjectId = require('mongoose').Types.ObjectId
        const filter = { _id: new ObjectId( req.body.parent_commnet_id) };
        console.log("filer is ",filter);
        const doc = await Comment.findOneAndUpdate(filter, {$push:{subcomments:commentData}}, {
          returnOriginal: false
        });
        res.status(StatusCodes.OK).json({statusCode:0,
         message:"",   
         data: { doc },
      });
 
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };


 //upload Blip  File



const fetchComment = async (req, res) => {
    
  try {
    if (!req.body.blip_id || !req.body.blip_id) {
        res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "Blip id is required",data:null
        });
     }
 debugger;
     const data = await Comment.find({blip_id:req.body.blip_id});
     console.log("data is data ",data[0].user_id )
    //  const ObjectId = require('mongoose').Types.ObjectId
    //  user_id = new ObjectId(data[0].user_id)
    user_id = data[0].user_id;
     const data1 = await Comment.aggregate().lookup({
        from:"users",
        localField:"user_id",
        foreignField:"_id",
        as:"datav"
     })

    console.log("user details ",data1[0])
     if (data1) {
        //    console.log("user ", data);
        res.status(StatusCodes.OK).json({statusCode:"0",message:"",
        data1
  });
 
 } else {
  res.status(StatusCodes.OK).json({statusCode:1,
      message: "Comment does not exist..!",
      data:null
  });
 }
 } catch (error) {
    console.log("catch ", error );
   res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
  }
 };

 const fetchSubComment = async (req, res) => {
    
    try {
      if (!req.body.comment_id || !req.body.commend_id) {
          res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
             message: "Comment  id is required",data:null
          });
       }
   debugger;
       const data = await Comment.find({blip_id:req.body.blip_id});
       console.log("data is data ",data[0].user_id )
      //  const ObjectId = require('mongoose').Types.ObjectId
      //  user_id = new ObjectId(data[0].user_id)
      user_id = data[0].user_id;
       const data1 = await Comment.aggregate().lookup({
          from:"users",
          localField:"user_id",
          foreignField:"_id",
          as:"datav"
       })
  
      console.log("user details ",data1[0])
       if (data1) {
          //    console.log("user ", data);
          res.status(StatusCodes.OK).json({statusCode:"0",message:"",
          data1
    });
   
   } else {
    res.status(StatusCodes.OK).json({statusCode:1,
        message: "Comment does not exist..!",
        data:null
    });
   }
   } catch (error) {
      console.log("catch ", error );
     res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode:1,message:error,data:null });
    }
   };
 module.exports = {postComment,postSubComment,fetchComment,fetchSubComment};