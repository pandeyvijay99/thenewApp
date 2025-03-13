const { StatusCodes } = require("http-status-codes");
const User = require("../models/auth");
const Webname = require("../models/webname");
const blockSchema = require('../models/block');
const Chat = require('../models/chat');
const Blip = require("../models/blip");
const Video = require("../models/video");
const Photo = require("../models/photo");
const Article = require("../models/article");
const Podcast = require("../models/podcast");
const Music = require("../models/music");
const Thoughts = require("../models/thoughts");
const Note = require("../models/note");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const shortid = require("shortid");
const Audit = require("../models/audit")
const moment = require('moment-timezone');
const mongoose = require("mongoose");
const Invite = require("../models/invite");
const userControlCenterModel = require('../models/controlCenter')
/**
 * @api {post} /api/signin Request User information
 * @apiName signin
 * @apiGroup User
 * @apiParam {coutryCode} {string} CountryCode is required.
 * @apiParam {mobileNumber} {String} MobileNumber is required.
 * 
 */
const signUp = async (req, res) => {
   const { countryCode, mobileNumber } = req.body;
   if (!countryCode || !mobileNumber) {
      return res.status(StatusCodes.BAD_REQUEST).json({
         statusCode: 1,
         message: "Please Provide Required Information", data: null
      });
   }

   //   const hash_password = await bcrypt.hash(password, 10);

   //   const userData = {
   //      countryCode,
   //      mobileNumber
   //   };
   const userData = req.body;
   try{
   const user = await User.findOne({ mobileNumber });
   if (user) {
      return res.status(StatusCodes.OK).json({
         statusCode: 1,
         message: "User already registered", data: null
      });
   } else {
      const userDefaultControlCenter = new userControlCenterModel(true, true, true, true);
      userData.userControlCenter = userDefaultControlCenter.toObject();
      User.create(userData).then((user, err) => {
         if (err) return res.status(StatusCodes.OK).json({ statusCode: 1, message: err, data: null });
         else {
            // console.log("data is ", user);
            /*Insert webName */
            const update = { webName: req.body.webName, mobileNumber: req.body.mobileNumber };

            // `doc` is the document _after_ `update` was applied because of
            // `returnOriginal: false`
            //   const doc = await Webname.findOneAndUpdate(filter, update, {
            //     returnOriginal: false
            //   });
            Webname.create(update).then((data, err) => {
               if (err) return res.status(StatusCodes.OK).json({ statusCode: 1, message: err, data: null });
               // else
               //   res
               //    .status(StatusCodes.OK)
               //    .json({statusCode:0, message: "User created Successfully",data:null });
            });
            /*End of WebName insertion*/
            const accessToken = jwt.sign(
               { _id: user._id, mobileNumber: user.mobileNumber },
               process.env.JWT_SECRET, { expiresIn: "100d" });
            res
               .status(StatusCodes.OK)
               .json({ statusCode: 0, message: "User created Successfully", data: { accessToken, user } });
         }
      });
   }
   }catch(err){
   console.log("error ", err)
   return res.status(StatusCodes.OK).json({
      statusCode: 1,
      message: "Something went wrong", data: null
   });

}
};
const signIn = async (req, res) => {
   // console.log("validation ")
   try {
      console.log("inside validation ")
      if (!req.body.countryCode || !req.body.mobileNumber) {
         return res.status(StatusCodes.BAD_REQUEST).json({
            statusCode: 1,
            message: "Please Enter Valid Number with country Code", data: null
         });
      }

      const user = await User.findOne({ mobileNumber: req.body.mobileNumber });
      // console.log("user details ",user)
      if (user) {
         const accessToken = jwt.sign(
            { _id: user._id, mobileNumber: user.mobileNumber },
            process.env.JWT_SECRET, { expiresIn: "100d" });
         const { _id, mobileNumber, countryCode } = user;
         // const refreshToken = jwt.sign({ username: user.username, role: user.role }, refreshTokenSecret);

         // refreshTokens.push(refreshToken);

         return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "",


            // refreshTokens,
            //   data: { _id,countryCode, mobileNumber },
            data: { accessToken, user }
         });

      } else {
         return res.status(StatusCodes.OK).json({
            statusCode: 1,
            message: "User does not exist..!", data: null
         });
      }
   } catch (error) {
      console.log("catch ", error);
      return res.status(StatusCodes.BAD_REQUEST).json({ statusCode: 1, message: error, data: null });
   }
};
//update the existing document with new details
const webNameCheck = async (req, res) => {
   console.log("webName validation ")
   try {

      console.log("inside  webName validation ", req.body);
      if (!req.body.webName) {
         return res.status(StatusCodes.BAD_REQUEST).json({
            statusCode: 1,
            message: "Please Enter Valid WebName", data: null
         });
      }

      const user = await Webname.findOne({ webName: req.body.webName });
      if (user) {
         return res.status(StatusCodes.OK).json({
            statusCode: 1,
            message: "WebName already registered", data: null
         });
      } else {
         console.log("data available")
         //   const filter = { mobileNumber: req.body.mobileNumber };
         //   const update = { webName: req.body.webName ,mobileNumber: req.body.mobileNumber};

         //   // `doc` is the document _after_ `update` was applied because of
         //   // `returnOriginal: false`
         // //   const doc = await Webname.findOneAndUpdate(filter, update, {
         // //     returnOriginal: false
         // //   });
         // Webname.create(update).then((data, err) => {
         //    if (err) res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
         //    else
         //      res
         //       .status(StatusCodes.OK)
         //       .json({statusCode:0, message: "User created Successfully",data:null });
         //    });
         //   res.status(StatusCodes.OK).json({statusCode:0,
         //    message:"",   
         //    data: { doc },

         // });
         return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "webName available", data: null
         });

      }

   } catch (error) {
      console.log("catch ", error);
      return res.status(StatusCodes.BAD_REQUEST).json({ statusCode: 1, message: error, data: null });
   }
};

//user details Update 
const updateUserDetails = async (req, res) => {
   // console.log("user updation ")
   try {

      console.log("userUpdation ", req.body);
      if (((req.body.fullName) && !req.body.fullName) || ((req.body.description) && !req.body.description)) {
         return res.status(StatusCodes.BAD_REQUEST).json({
            statusCode: 1,
            message: "Please Enter Valid Input", data: null
         });
      }

      const user = await User.where({ mobileNumber: req.body.mobileNumber });
      //  console.log("user details ",user)
      if (user) {
         const filter = { mobileNumber: req.body.mobileNumber };
         const update = req.body;
         // console.log("updated value",update)
         // `doc` is the document _after_ `update` was applied because of
         // `returnOriginal: false`
         const doc = await User.findOneAndUpdate(filter, { $set: req.body }, {
            returnOriginal: false
         });
         return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "",
            data: { doc },
         });
      }
   } catch (error) {
      console.log("catch ", error);
      return res.status(StatusCodes.OK).json({ statusCode: 1, message: error, data: null });
   }
};

//Fetch User Details 

// const getUserDetails = async (req, res) => {
//    // console.log("validation ")
//    const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
//    if (authHeader) {
//       const token = authHeader.split(' ')[1];
//       if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       current_user_id = decoded._id;
//       console.log("current_user_id", decoded._id )
//    }
//    try {
//       console.log("inside validation ")
//       if (!req.body.webName) {
//          return res.status(StatusCodes.BAD_REQUEST).json({
//             statusCode: 1,
//             message: "Please Provide Valid details ", data: null
//          });
//       }

//       const user = await User.findOne({ webName: req.body.webName });
//       debugger
//        console.log("user details ",user._id);
//       let isBeliever = false
//       let userId = (user._id).toString();
//       console.log("userId",userId)
//       let believers = user.believer;
//       console.log("believers",current_user_id)
      
//       // if (believers.includes(current_user_id.toString())) {
//       //    isBeliever = true
//       // } else {
//       //    isBeliever = false
//       // }

//       believers.forEach(element => {
//          console.log("Element:", element.toString(), "Current User ID:", current_user_id.toString());
//          console.log("Comparison Result:", element.toString() === current_user_id.toString());
//          if (element.toString() === current_user_id.toString()) {
//              isBeliever = true;
//          }
//      });
//       console.log("isBeliever",isBeliever)
//       const videoCount = await Video.countDocuments({ video_user_id: userId });
//       const photoCount = await Photo.countDocuments({ photo_user_id: userId });
//       const blipCount = await Blip.countDocuments({ blip_user_id: userId });
//       believerCount = (user.believer).length;

//       console.log("user details ", videoCount, photoCount, blipCount, believerCount, isBeliever)
//       /*Blocked user status */
//       debugger;
//       console.log("current_user_id , user_id",current_user_id,userId)
//       let isBlockedStatus = "";
//       const ObjectId = require('mongoose').Types.ObjectId
//       const isBlocked = await blockSchema.find({
//            from: new ObjectId(current_user_id),
//           to: new ObjectId(userId)
//          // type: 'user'  // Assuming we're checking block type for users
//      });
//      console.log("isBlocked",isBlocked.length)
//      if (isBlocked.length>0) {
//       isBlockedStatus =  true
//   } else {
//      isBlockedStatus = false
//   }

//       /*End of the code*/

//       if (user) {
//          // console.log("user ", user);
//          return res.status(StatusCodes.OK).json({
//             statusCode: 0, message: "",
//             data: { user, videoCount, photoCount, blipCount, isBeliever ,isBlockedStatus}
//          });

//       } else {
//          return res.status(StatusCodes.BAD_REQUEST).json({
//             statusCode: 1,
//             message: "User does not exist..!",
//             data: null
//          });
//       }
//    } catch (error) {
//       // console.log("catch ", error);
//       return res.status(StatusCodes.BAD_REQUEST).json({ error });
//    }
// };
const getUserDetails = async (req, res) => {
   const authHeader = req.headers.authorization || null;
   let current_user_id = null;

   if (authHeader) {
      try {
         const token = authHeader.split(' ')[1];
         if (!token) {
            return res.status(403).json({ statusCode: 1, message: "Access denied.", data: null });
         }
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         current_user_id = decoded._id;
         console.log("current_user_id", current_user_id);
      } catch (error) {
         console.error("Invalid token:", error);
         return res.status(403).json({ statusCode: 1, message: "Invalid token.", data: null });
      }
   }

   try {
      if (!req.body.webName) {
         return res.status(StatusCodes.BAD_REQUEST).json({
            statusCode: 1,
            message: "Please Provide Valid details",
            data: null
         });
      }

      const user = await User.findOne({ webName: req.body.webName });

      if (!user) {
         return res.status(StatusCodes.BAD_REQUEST).json({
            statusCode: 1,
            message: "User does not exist..!",
            data: null
         });
      }

      let isBeliever = false;
      let userId = user._id.toString();

      if (current_user_id) {
         user.believer.forEach(element => {
            if (element.toString() === current_user_id.toString()) {
               isBeliever = true;
            }
         });
      }

      const videoCount = await Video.countDocuments({ video_user_id: userId });
      const photoCount = await Photo.countDocuments({ photo_user_id: userId });
      const blipCount = await Blip.countDocuments({ blip_user_id: userId });
      let believerCount = user.believer.length;

      let isBlockedStatus = false;

      if (current_user_id) {
         const ObjectId = require('mongoose').Types.ObjectId;
         const isBlocked = await blockSchema.find({
            from: new ObjectId(current_user_id),
            to: new ObjectId(userId)
         });

         isBlockedStatus = isBlocked.length > 0;
      }

      return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: "",
         data: { user, videoCount, photoCount, blipCount, isBeliever, isBlockedStatus }
      });

   } catch (error) {
      console.error("Error:", error);
      return res.status(StatusCodes.BAD_REQUEST).json({ error });
   }
};


const searchWebName = async (req, res) => {
   try {
      let user_id = "";
      const authHeader = req.headers.authorization ? req.headers.authorization : null;
      if (authHeader) {
         const token = authHeader.split(' ')[1];
         if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         user_id = decoded._id;
      }

      // Validate search string
      if (!req.body.searchString) {
         return res.status(StatusCodes.BAD_REQUEST).json({
            statusCode: 1,
            message: "Please Enter Valid Input", 
            data: null
         });
      }

      // Find users matching the search string
      const users = await User.find({ webName: { $regex: req.body.searchString, $options: "i" } });
      if (users.length === 0) {
         return res.status(StatusCodes.OK).json({
            statusCode: 1,
            message: "No data found", 
            data: null
         });
      }

      // Iterate over each matched user to get chat details
      const userDetailsWithChatId = await Promise.all(users.map(async (users) => {
         // If the matched user is the logged-in user, exclude chat_id
         if (users._id.toString() === user_id) {
            return {
             users,
               chat_id: null // Exclude chat_id for the logged-in user
            };
         }

         // Find a chat between logged-in user and the matched user
         const chat = await Chat.findOne({
            $or: [
               { messageSender: user_id, messageReceiver: users._id },
               { messageSender: users._id, messageReceiver: user_id }
            ]
         });

         // Return user details with chat_id (if chat exists)
         return {
            // _id: user._id,
            // webName: user.webName,
            // fullName: user.fullName,
            // profilePicture: user.profilePicture,
            users,
            chat_id: chat ? chat._id : null
         };
      }));

      return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: "User details and chat IDs retrieved successfully",
         data: userDetailsWithChatId
      });

   } catch (error) {
      console.error("Error occurred:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
         statusCode: 1, 
         message: error.message, 
         data: null 
      });
   }
};

/*Believers older 17- dec -backup */
// const believer = async (req, res) => {

//    try {
//       /*code for getting user_id from  header*/
//       const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
//       if (authHeader) {
//          const token = authHeader.split(' ')[1];
//          if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
//          const decoded = jwt.verify(token, process.env.JWT_SECRET);
//          console.log("token", token);
//          user_id = decoded._id;
//          console.log("user id ", decoded._id);
//       }
//       if (!req.body.believers && (req.body.believers).length == 0) {
//          return res.status(StatusCodes.BAD_REQUEST).json({
//             statusCode: 1,
//             message: "Provide atleast one believer", data: null
//          });
//       }
//       const ObjectId = require('mongoose').Types.ObjectId
//       //   const conditions = {  _id: new ObjectId(user_id) };
//       //   const result = await User.updateMany(conditions,{ $addToSet: { believer: { $each: req.body.believers } } }, { multi: true })
//       debugger
//       const doc = await User.findById(new ObjectId(user_id));

//       if (!doc) {
//          return res.status(StatusCodes.OK).json({
//             statusCode: 1,
//             message: "no data found", data: ""
//          });
//       }

//       const index = doc.believer.indexOf(req.body.believers);
//       if (index > -1) {
//          // User ID is in the believers array, remove it
//          doc.believer.splice(index, 1);
//       } else {
//          // User ID is not in the believers array, add it
//          console.log("believer", req.body.believers)
//          let believer = req.body.believers
//          doc.believer.push(...believer);
//       }

//       await doc.save();

//       return res.status(StatusCodes.OK).json({
//          statusCode: 0,
//          message: "", data: "data saved"
//       });
//       debugger
//    } catch (error) {
//       return res.status(StatusCodes.OK).json({
//          statusCode: 1,
//          message: error, data: null
//       });
//    }
// };

///////////////
const believer = async (req, res) => {
   try {
      // Extract user_id from authHeader
      const authHeader = req.headers.authorization ? req.headers.authorization : null;
      if (!authHeader) {
         return res.status(403).json({ statusCode: 1, message: "Access denied.", data: null });
      }

      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).json({ statusCode: 1, message: "Access denied.", data: null });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user_id = decoded._id;

      // Validate req.body.believers
      if (!req.body.believers || req.body.believers.length === 0) {
         return res.status(400).json({ statusCode: 1, message: "Provide at least one believer.", data: null });
      }

      const believerIds = req.body.believers; // Array of believer user IDs
      const ObjectId = require('mongoose').Types.ObjectId;

      // Fetch the requester (current user) document
      const requester = await User.findById(new ObjectId(user_id));
      if (!requester) {
         return res.status(404).json({ statusCode: 1, message: "Requester not found.", data: null });
      }

      // Fetch all the users from req.body.believers
      const believersDocs = await User.find({ _id: { $in: believerIds.map(id => new ObjectId(id)) } });

      if (believersDocs.length !== believerIds.length) {
         return res.status(404).json({
            statusCode: 1,
            message: "Some believers not found.",
            data: null
         });
      }

      // Initialize updates for batch operations
      const bulkRequesterUpdates = [];
      const bulkBelieverUpdates = [];

      believerIds.forEach(believerId => {
         const believerDoc = believersDocs.find(doc => doc._id.toString() === believerId);

         if (!requester.believer.includes(believerId)) {
            // Add to requester's believer array if not present
            bulkRequesterUpdates.push(believerId);

            // Add requester to believer's believedBy array if not present
            if (!believerDoc.believedBy.includes(user_id)) {
               believerDoc.believedBy.push(user_id);
               bulkBelieverUpdates.push({
                  updateOne: {
                     filter: { _id: believerDoc._id },
                     update: { $addToSet: { believedBy: user_id } }
                  }
               });
            }
         } else {
            // Remove from requester's believer array if present
            requester.believer = requester.believer.filter(id => id !== believerId);

            // Remove requester from believer's believedBy array if present
            believerDoc.believedBy = believerDoc.believedBy.filter(id => id !== user_id);
            bulkBelieverUpdates.push({
               updateOne: {
                  filter: { _id: believerDoc._id },
                  update: { $pull: { believedBy: user_id } }
               }
            });
         }
      });

      // Save changes for requester
      if (bulkRequesterUpdates.length > 0) {
         requester.believer = bulkRequesterUpdates;
      }
      await requester.save();

      // Bulk update believers
      if (bulkBelieverUpdates.length > 0) {
         await User.bulkWrite(bulkBelieverUpdates);
      }

      return res.status(200).json({
         statusCode: 0,
         message: "Believer data updated successfully.",
         data: "Data saved"
      });
   } catch (error) {
      console.error(error);
      return res.status(500).json({
         statusCode: 1,
         message: "An error occurred.",
         data: error.message
      });
   }
};



/*Believers List  */
// const getBeleiver = async (req, res) => {
// debugger
//    try {
//       /*code for getting user_id from  header*/
//       const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
//       if (authHeader) {
//          const token = authHeader.split(' ')[1];
//          if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
//          const decoded = jwt.verify(token, process.env.JWT_SECRET);
//          console.log("token", token);
//          user_id = decoded._id;
//          console.log("user id ", decoded._id);
//       }
//       const currentUser = await User.findById(user_id).exec();
//       console.log("current user",currentUser)
//     if (!currentUser) {
//       throw new Error('User not found');
//     }
//     const believerIds = currentUser.believer;
//    //  const believersDetails = await User.find({ _id: { $in: believerIds } }).exec();
//    const ObjectId = require('mongoose').Types.ObjectId
//    const believersDetails = await User.aggregate([
//       {
//          $match :{ _id: {$in: believerIds.map(id => new ObjectId(id)) } }
//        },
//        {
//          $lookup: {
//            from: "chats", // name of the comment collection
//            localField: "_id",
//            foreignField: "messageSender",
//            as: "chats"
//          }
//       },
//       {
//          $unwind: {
//            path: '$chats',
//            preserveNullAndEmptyArrays: true
//          }
//        },
//       {
//          $project: {
//           'chats._id':1,
//            mobileNumber:1,
//            webName:1,
//            fullName:1,
//            mobileNumber:1,
//            profilePicture:1
//          }
//        }

//    ])
//       return res.status(StatusCodes.OK).json({
//          statusCode: 0,
//          message: "", data: believersDetails
//       });
//       // debugger
//    } catch (error) {
//       return res.status(StatusCodes.OK).json({
//          statusCode: 1,
//          message: "something went wrong", data: null
//       });
//    }
// };

const getBeleiver = async (req, res) => {
   debugger
   try {
      /* code for getting user_id from header */
      // const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
      // if (authHeader) {
      //    const token = authHeader.split(' ')[1];
      //    if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
      //    const decoded = jwt.verify(token, process.env.JWT_SECRET);
      //    console.log("token", token);
      //    user_id = decoded._id;
      //    console.log("user id ", decoded._id);
      // }
      let user_id;
debugger
      // Check if webName is provided in the payload
      if (req.body?.webName) {
         const user = await User.findOne({ webName: req.body.webName }).select("_id").exec();
         if (!user) {
            return res.status(404).json({ statusCode: 1, message: "User not found with the given webName.", data: null });
         }
         user_id = user._id;  // Use the _id fetched from the User model
      } else {
         // Extract user ID from Authorization token
         const authHeader = req.headers.authorization || null;
         if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user_id = decoded._id;
         }
      }
      const currentUser = await User.findById(user_id).exec();
      console.log("current user", currentUser)
      if (!currentUser) {
         throw new Error('User not found');
      }
      const believerIds = currentUser.believer;
      const ObjectId = require('mongoose').Types.ObjectId;

      const believersDetails = await User.aggregate([
         {
            $match: { _id: { $in: believerIds.map(id => new ObjectId(id)) } }
         },
         {
            $lookup: {
               from: "chats", // name of the chat collection
               let: { believerId: "$_id" },
               pipeline: [
                  { $match: { $expr: { $or: [{ $eq: ["$messageSender", "$$believerId"] }, { $eq: ["$messageReceiver", "$$believerId"] }] } } },
                  { $match: { $expr: { $or: [{ $eq: ["$messageSender", new ObjectId(user_id)] }, { $eq: ["$messageReceiver", new ObjectId(user_id)] }] } } },
                  { $project: { _id: 1 } }
               ],
               as: "chats"
            }
         },
         {
            $unwind: {
               path: '$chats',
               preserveNullAndEmptyArrays: true
            }
         },
         {
            $project: {
               'chats._id': 1,
               mobileNumber: 1,
               webName: 1,
               fullName: 1,
               profilePicture: 1
            }
         }
      ]);

      return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: "",
         data: believersDetails
      });
   } catch (error) {
      console.error("Error: ", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         statusCode: 1,
         message: "something went wrong",
         data: null
      });
   }
};

// const checkMobileNumbers = async (req, res) => {
//    debugger
//    console.log(req.body.contacts);
//    try {
//       let numbers = req.body.contacts ? req.body.contacts : "";
//       const foundNumbers = await User.find({ mobileNumber: { $in: req.body.contacts } });
//       const foundSet = new Set(foundNumbers.map(num => num.mobileNumber));
//       const results = numbers.map(mobileNumber => ({
//          mobileNumber,
//          present: foundSet.has(mobileNumber)
//       }));
//       return res.status(StatusCodes.OK).json({
//          statusCode: 0,
//          message: "", data: results
//       });
//    } catch (err) {
//       console.error('Error checking mobile numbers', err);
//       return res.status(StatusCodes.OK).json({
//          statusCode: 1,
//          message: err, data: null
//       });
//    }
// };

// const checkMobileNumbers = async (req, res) => {
//    debugger
//    console.log(req.body.contacts);
//    try {
//         const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
//       if (authHeader) {
//          const token = authHeader.split(' ')[1];
//          if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
//          const decoded = jwt.verify(token, process.env.JWT_SECRET);
//          console.log("token", token);
//          const user_id = decoded._id;
//          console.log("user id ", decoded._id);
//       }
//       let numbers = req.body.contacts ? req.body.contacts : [];
      
//       // Find users whose mobile numbers exist in the provided array
//       const foundUsers = await User.find({ mobileNumber: { $in: numbers } }, {
//          fullName: 1, 
//          webName: 1, 
//          mobileNumber: 1, 
//          profilePicture: 1
//       });
//       console.log("foundUsers",foundUsers)

      
//       debugger;
      
//       const results = numbers.map(mobileNumber => {
//          const user = foundUsers.find(user => user.mobileNumber === mobileNumber);
//          // const chat = user ? chatDetails.find(c => c.userId.toString() === user._id.toString()) : null;
//          return user
//             ? {
//                mobileNumber: user.mobileNumber,
//                fullName: user.fullName,
//                webName: user.webName,
//                profilePicture: user.profilePicture,
//                // chat_id: chat ? chat.chat_id : null,
//                present: true
//             }
//             : {
//                mobileNumber,
//                present: false
//             };
//       });
      

//       return res.status(StatusCodes.OK).json({
//          statusCode: 0,
//          message: "",
//          data: results
//       });
//    } catch (err) {
//       console.error('Error checking mobile numbers', err);
//       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//          statusCode: 1,
//          message: "An error occurred while checking mobile numbers",
//          data: null
//       });
//    }
// };
const checkMobileNumbers = async (req, res) => {
   try {
      const authHeader = req.headers.authorization || null;
      if (!authHeader) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });

      const token = authHeader.split(' ')[1];
      if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const loggedInUserId = decoded._id;

      const numbers = req.body.contacts ? req.body.contacts : [];

      // Find users by mobile numbers
      const foundUsers = await User.find({ mobileNumber: { $in: numbers } }, {
         fullName: 1, 
         webName: 1, 
         mobileNumber: 1, 
         profilePicture: 1
      });

      const userIds = foundUsers.map(user => user._id);

      // Find chats where loggedInUser is involved with these users
      const chatDetails = await Chat.find({
         $or: [
            { messageSender: loggedInUserId, messageReceiver: { $in: userIds } },
            { messageReceiver: loggedInUserId, messageSender: { $in: userIds } }
         ]
      }, { _id: 1, messageSender: 1, messageReceiver: 1 });

      const results = numbers.map(mobileNumber => {
         const user = foundUsers.find(u => u.mobileNumber === mobileNumber);
         if (user) {
            const chat = chatDetails.find(c =>
               (c.messageSender.toString() === loggedInUserId && c.messageReceiver.toString() === user._id.toString()) ||
               (c.messageReceiver.toString() === loggedInUserId && c.messageSender.toString() === user._id.toString())
            );

            return {
               user_id: user._id,
               mobileNumber: user.mobileNumber,
               fullName: user.fullName,
               webName: user.webName,
               profilePicture: user.profilePicture,
               chat_id: chat ? chat._id : null,
               present: true
            };
         } else {
            return {
               mobileNumber,
               present: false
            };
         }
      });

      return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: "Mobile numbers checked successfully.",
         data: results
      });
   } catch (err) {
      console.error('Error checking mobile numbers', err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         statusCode: 1,
         message: "An error occurred while checking mobile numbers",
         data: null
      });
   }
};




// const userActivity = async (req, res) => {
//    debugger
  
//    //////////////////////////////////////Content Search Copy
//    try {
//       const db = mongoose.connection.db;
//       const searchString = req.body.webName;
//       const authHeader = req.headers.authorization;
    
//       let token = null;
    
//       // Step 1: Decode the user ID from token (if provided)
//       let userId = null;
//       if (authHeader) {
//         try {
//           token = authHeader.split(' ')[1];
//           const decoded = jwt.verify(token, process.env.JWT_SECRET);
//           userId = decoded._id;
//         } catch (error) {
//           return res.status(401).json({
//             statusCode: 2,
//             message: "Invalid or expired token",
//             data: null,
//           });
//         }
//       }
    
//       // Step 2: Get the user ID (_id) from req.body.webName
//       const user = await mongoose.model("User").findOne({ webName: searchString });
//       if (!user) {
//         return res.status(404).json({
//           statusCode: 3,
//           message: "User not found",
//           data: null,
//         });
//       }
//       const userIdFromWebName = user._id.toString();
    
//       // Step 3: Define collections to search and their user ID fields
//       const collectionsWithUserIds = [
//         { collection: "blips", userIdField: "blip_user_id" },
//         { collection: "videos", userIdField: "video_user_id" },
//         { collection: "photos", userIdField: "photo_user_id" },
//         { collection: "notes", userIdField: "note_user_id" },
//         { collection: "thoughts", userIdField: "thoughts_user_id" },
//         { collection: "articles", userIdField: "article_user_id" },
//         { collection: "musics", userIdField: "music_user_id" },
//         { collection: "podcasts", userIdField: "podcast_user_id" },
//       ];
    
//       const results = [];
    
//       // Step 4: Iterate through each collection to search for records
//       const searchOperations = collectionsWithUserIds.map(async ({ collection, userIdField }) => {
//         const col = db.collection(collection);
    
//         // Query documents based on string user ID match
//         const documents = await col.find({ [userIdField]: userIdFromWebName }).toArray();
    
//         if (documents.length > 0) {
//           const formattedDocuments = await Promise.all(
//             documents.map(async (doc) => {
//               // Fetch user details
//               const userDetails = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(doc[userIdField]) });
    
//               return {
//                 ...doc,
//                 user_details: userDetails || null, // Include user details if available
//               };
//             })
//           );
    
//           // Push collection results
//           results.push({
//             collection,
//             documents: formattedDocuments,
//           });
//         }
//       });
    
//       // Wait for all search operations to complete
//       await Promise.all(searchOperations);
    
//       // Respond with aggregated results
//       res.json({ results });
//     } catch (error) {
//       console.error("Search Error:", error);
//       res.status(500).json({
//         statusCode: 1,
//         message: "Something went wrong",
//         data: null,
//       });
//     }
    
// };
const userActivity = async (req, res) => {
   try {
      const db = mongoose.connection.db;
      const searchString = req.body.webName;
      const authHeader = req.headers.authorization;
      let userId = null;

      // Step 1: Decode the user ID from token (if provided)
      if (authHeader) {
         try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded._id;
         } catch (error) {
            console.warn("Invalid or expired token:", error.message);
            // Continue execution without userId
         }
      }

      // Step 2: Get the user ID (_id) from req.body.webName
      const user = await mongoose.model("User").findOne({ webName: searchString });
      if (!user) {
         return res.status(404).json({
            statusCode: 3,
            message: "User not found",
            data: null,
         });
      }
      const userIdFromWebName = user._id.toString();

      // Step 3: Define collections to search and their user ID fields
      const collectionsWithUserIds = [
         { collection: "blips", userIdField: "blip_user_id" },
         { collection: "videos", userIdField: "video_user_id" },
         { collection: "photos", userIdField: "photo_user_id" },
         { collection: "notes", userIdField: "note_user_id" },
         { collection: "thoughts", userIdField: "thoughts_user_id" },
         { collection: "articles", userIdField: "article_user_id" },
         { collection: "musics", userIdField: "music_user_id" },
         { collection: "podcasts", userIdField: "podcast_user_id" },
      ];

      const results = [];

      // Step 4: Iterate through each collection to search for records
      const searchOperations = collectionsWithUserIds.map(async ({ collection, userIdField }) => {
         const col = db.collection(collection);
         const documents = await col.find({ [userIdField]: userIdFromWebName }).toArray();

         if (documents.length > 0) {
            const formattedDocuments = await Promise.all(
               documents.map(async (doc) => {
                  // Fetch user details
                  const userDetails = await db.collection("users").findOne({
                     _id: new mongoose.Types.ObjectId(doc[userIdField])
                  });

                  return {
                     ...doc,
                     user_details: userDetails || null, // Include user details if available
                  };
               })
            );

            // Push collection results
            results.push({
               collection,
               documents: formattedDocuments,
            });
         }
      });

      // Wait for all search operations to complete
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


// const userActivity = async (req, res) => {
//    try {
//      const db = mongoose.connection.db;
//      const searchString = req.body.webName;
//      const authHeader = req.headers.authorization;
 
//      let token = null;
//      let userId = null;
//      if (authHeader) {
//        try {
//          token = authHeader.split(' ')[1];
//          const decoded = jwt.verify(token, process.env.JWT_SECRET);
//          userId = decoded._id;
//        } catch (error) {
//          return res.status(401).json({
//            statusCode: 2,
//            message: "Invalid or expired token",
//            data: null,
//          });
//        }
//      }
 
//      const user = await mongoose.model("User").findOne({ webName: searchString });
//      if (!user) {
//        return res.status(404).json({
//          statusCode: 3,
//          message: "User not found",
//          data: null,
//        });
//      }
//      const userIdFromWebName = user._id.toString();
 
//      const collectionsWithUserIds = [
//        { collection: "blips", userIdField: "blip_user_id" },
//        { collection: "videos", userIdField: "video_user_id" },
//        { collection: "photos", userIdField: "photo_user_id" },
//        { collection: "notes", userIdField: "note_user_id" },
//        { collection: "thoughts", userIdField: "thoughts_user_id" },
//        { collection: "articles", userIdField: "article_user_id" },
//        { collection: "musics", userIdField: "music_user_id" },
//        { collection: "podcasts", userIdField: "podcast_user_id" },
//      ];
 
//      let allDocuments = [];
 
//      const searchOperations = collectionsWithUserIds.map(async ({ collection, userIdField }) => {
//        const col = db.collection(collection);
//        const documents = await col.find({ [userIdField]: userIdFromWebName }).toArray();
 
//        if (documents.length > 0) {
//          const formattedDocuments = await Promise.all(
//            documents.map(async (doc) => {
//              const userDetails = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(doc[userIdField]) });
 
//              return {
//                ...doc,
//                user_details: userDetails || null,
//                collectionName: collection, // Track which collection this document belongs to
//              };
//            })
//          );
 
//          allDocuments.push(...formattedDocuments);
//        }
//      });
 
//      await Promise.all(searchOperations);
 
//      // Sort by createdAt in descending order (newest first)
//      allDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 
//      res.json({ results: allDocuments });
//    } catch (error) {
//      console.error("Search Error:", error);
//      res.status(500).json({
//        statusCode: 1,
//        message: "Something went wrong",
//        data: null,
//      });
//    }
//  };
 

// const exploreData = async (req, res) => {
//    debugger
//    try {
//       const trendingVideos = await Video.find().sort({ views: -1 }).limit(5);
//       const trendingBlips = await Blip.find().sort({ views: -1 }).limit(5);
//       const trendingPhotos = await Photo.find().sort({ views: -1 }).limit(5);

//       return res.status(StatusCodes.OK).json({
//          statusCode: 0,
//          message: "", data: { trendingVideos, trendingBlips, trendingPhotos }
//       });
//    } catch (error) {
//       return res.status(StatusCodes.OK).json({
//          statusCode: 1,
//          message: "Something went wrong", data: null
//       });
//    }



// };

const exploreData = async (req, res) => {
   try {
      // Fetch trending videos, blips, and photos
      const trendingVideos = await Video.find().sort({ views: -1 }).limit(5);
      const trendingBlips = await Blip.find().sort({ views: -1 }).limit(5);
      const trendingPhotos = await Photo.find().sort({ views: -1 }).limit(5);

      // Helper function to get user details based on mobileNumber
      const getUserDetails = async (userId) => {
         return await User.findOne({ mobileNumber: userId });
      };

      // Using Promise.all to fetch user details for videos, blips, and photos
      const videosWithUsers = await Promise.all(
         trendingVideos.map(async (video) => {
            console.log()
            const user = await getUserDetails(video.mobileNumber);
            return { ...video._doc, user };
         })
      );

      const blipsWithUsers = await Promise.all(
         trendingBlips.map(async (blip) => {
            const user = await getUserDetails(blip.mobileNumber);
            return { ...blip._doc, user };
         })
      );

      const photosWithUsers = await Promise.all(
         trendingPhotos.map(async (photo) => {
            const user = await getUserDetails(photo.mobileNumber);
            return { ...photo._doc, user };
         })
      );

      // Send the response with trending data and user details
      return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: "",
         data: { 
            trendingVideos: videosWithUsers, 
            trendingBlips: blipsWithUsers, 
            trendingPhotos: photosWithUsers 
         }
      });
   } catch (error) {
      return res.status(StatusCodes.OK).json({
         statusCode: 1,
         message: "Something went wrong",
         data: null
      });
   }
};

const updateFcmToken = async (req, res) => {
   try {
      const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
      if (authHeader) {
         const token = authHeader.split(' ')[1];
         if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         console.log("token", token);
         const user_id = decoded._id;
         console.log("user id ", decoded._id);

         const user = await User.findByIdAndUpdate(user_id, { fcmToken: req.body.fcmToken ,voipToken:req.body.voipToken}, {
            new: true,
            upsert: true,
         })
         console.log(user.fcmToken,user.voipToken);
         return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "Updated token"
         });
      } else {
         return res.status(StatusCodes.UNAUTHORIZED).json({
            statusCode: 1,
            message: "Unauthorized"
         });
      }
   } catch (error) {
      return res.status(StatusCodes.OK).json({
         statusCode: 1,
         message: "Something went wrong", data: null
      });
   }
};

const editProfile = async (req, res) => {
   try {
      const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
      if (authHeader) {
         const token = authHeader.split(' ')[1];
         if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         const user_id = decoded._id;

         const user = await User.findByIdAndUpdate(user_id, req.body, {
            new: true,
            upsert: true,
         })
         return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "Updated User Details",
            data: user
         });
      } else {
         return res.status(StatusCodes.UNAUTHORIZED).json({
            statusCode: 1,
            message: "Unauthorized",
            data: null
         });
      }
   } catch (error) {
      return res.status(StatusCodes.OK).json({
         statusCode: 1,
         message: "Something went wrong",
         data: null
      });
   }
};

const updateUserControlCenter = async (req, res) => {
   try {
      const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
      if (authHeader) {
         const token = authHeader.split(' ')[1];
         if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         const user_id = decoded._id;

         const user = await User.findByIdAndUpdate(user_id, req.body, {
            new: true,
            upsert: true,
         })

         return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "updated control status",
            data: user
         });
      } else {
         return res.status(StatusCodes.UNAUTHORIZED).json({
            statusCode: 1,
            message: "Unauthorized",
            data: null
         });
      }
   } catch (error) {
      return res.status(StatusCodes.OK).json({
         statusCode: 1,
         message: "Something went wrong",
         data: null
      });
   }
};

const deleteOrSignOut = async (req, res) => {
   try {
      debugger
      const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
      if (authHeader) {
         const token = authHeader.split(' ')[1];
         if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         const user_id = decoded._id;

         const actionType = req.body.actionType

         if (actionType == "signOut") {
            const expiredToken = jwt.sign({ _id: decoded._id }, process.env.JWT_SECRET, { expiresIn: '100ms' });
            return res.status(StatusCodes.OK).json({
               statusCode: 0,
               message: "",
               data: "user LoggedOut successfully"
            });

         } else if (actionType == "delete") {
            const user = await User.findOne({ mobileNumber:decoded.mobileNumber });

            if (!user) {
               return res.status(StatusCodes.OK).json({
                  statusCode: 1,
                  message: "User Not found",
                  data: ""
               });
            }

            // If actionType is "delete", update the accountStatus to "deleted"
            else  {
               user.accountStatus = 'deleted';
               user.updatedAt = Date.now(); // Update the timestamp
               await user.save(); // Save changes to the database
               return res.status(StatusCodes.OK).json({
                  statusCode: 0,
                  message: "",
                  data: "User deleted successfully"
               });
            }

         } else {
            return res.status(StatusCodes.OK).json({
               statusCode: 1,
               message: "No Type is selected",
               data: null
            });
         }

         // const user = await User.findByIdAndUpdate(user_id, req.body, {
         //    new: true,
         //    upsert: true,
         // })

         return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: actionType + " done successfully.",
            data: null
         });
      } else {
         return res.status(StatusCodes.UNAUTHORIZED).json({
            statusCode: 1,
            message: "Unauthorized",
            data: null
         });
      }
   } catch (error) {
      return res.status(StatusCodes.OK).json({
         statusCode: 1,
         message: "Something went wrong",
         data: null
      });
   }
};

const blockContentOrUser = async (req, res) => {
   try {
      console.log(req.body);

      const block = await blockSchema.create(req.body);
      if (!block) {
         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: "Failed To block", data: null });
      }
      return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: req.body.type + "blocked successfully",
         data: null
      });
   } catch (error) {
      console.log("catch ", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error.message, data: null });
   }
}

const unblockContentOrUser = async (req, res) => {
   try {
      console.log(req.body);

      const block = await blockSchema.deleteOne(req.body);
      if (!block) {
         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: "Failed To unblock", data: null });
      }
      return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: req.body.type + "unblocked successfully",
         data: null
      });
   } catch (error) {
      console.log("catch ", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ statusCode: 1, message: error.message, data: null });
   }
}

const getUserBlockList = async (req, res) => {
   try {
      const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
      if (authHeader) {
         const token = authHeader.split(' ')[1];
         if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         const user_id = decoded._id;
         const ObjectId = require('mongoose').Types.ObjectId

         const pageNumber = req.body.pageNumber; // Assuming page number starts from 1
         const limit = 15; // Number of documents per page
         const skip = (pageNumber - 1) * limit; // Calculate offset

         // Query to find documents and apply skip/limit
         let query = await blockSchema.find({ from: new ObjectId(user_id) }).skip(skip).limit(limit).populate({
            path: 'to',
            model: User,
            select: 'fullName webName profilePicture'
         });

         return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "block list",
            data: query
         });
      } else {
         return res.status(StatusCodes.UNAUTHORIZED).json({
            statusCode: 1,
            message: "Unauthorized",
            data: null
         });
      }
   } catch (error) {

      console.log(error);
      return res.status(StatusCodes.OK).json({
         statusCode: 1,
         message: "Something went wrong",
         data: null
      });
   }
}

// const getBelievedUsers = async (req, res) => {
//    debugger
//    try {
//       // Extract the authorization token
//       const authHeader = req.headers.authorization ? req.headers.authorization : null;
//       if (!authHeader) return res.status(StatusCodes.FORBIDDEN).json({ statusCode: 1, message: "Access denied.", data: null });

//       const token = authHeader.split(' ')[1];
//       if (!token) return res.status(StatusCodes.FORBIDDEN).json({ statusCode: 1, message: "Access denied.", data: null });

//       // Decode the token to get the logged-in user ID
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const loggedInUserId = decoded._id;
//       console.log("Logged-in user ID:", loggedInUserId);

//       // Find users where the logged-in user is in the believer array
//       const believedUsers = await User.find({ believer: loggedInUserId }, {
//          _id:1,
//          fullName: 1,
//          webName: 1,
//          profilePicture: 1,
//          mobileNumber: 1
//       });

//       // Check if any users were found
//       if (!believedUsers || believedUsers.length === 0) {
//          return res.status(StatusCodes.OK).json({
//             statusCode: 0,
//             message: "No users found that the logged-in user believes.",
//             data: []
//          });
//       }

//       // Return the found users
//       return res.status(StatusCodes.OK).json({
//          statusCode: 0,
//          message: "Users found.",
//          data: believedUsers
//       });

//    } catch (err) {
//       console.error('Error retrieving believed users:', err);
//       return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//          statusCode: 1,
//          message: "An error occurred while retrieving believed users.",
//          data: null
//       });
//    }
// };
const getBelievedUsers = async (req, res) => {
   try {
     // Extract the authorization token
     const authHeader = req.headers.authorization ? req.headers.authorization : null;
     if (!authHeader) return res.status(StatusCodes.FORBIDDEN).json({ statusCode: 1, message: "Access denied.", data: null });
 
     const token = authHeader.split(' ')[1];
     if (!token) return res.status(StatusCodes.FORBIDDEN).json({ statusCode: 1, message: "Access denied.", data: null });
 
     // Decode the token to get the logged-in user ID
     const decoded = jwt.verify(token, process.env.JWT_SECRET);
     const loggedInUserId = decoded._id;
     console.log("Logged-in user ID:", loggedInUserId);
 
     // Find users where the logged-in user is in the believer array
     const believedUsers = await User.find({ believer: loggedInUserId }, {
       _id: 1,
       fullName: 1,
       webName: 1,
       profilePicture: 1,
       mobileNumber: 1
     });
 
     // Check if any users were found
     if (!believedUsers || believedUsers.length === 0) {
       return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: "No users found that the logged-in user believes.",
         data: []
       });
     }
 
     // Add logic to find chats between the logged-in user and believed users
     const believedUsersWithChat = await Promise.all(believedUsers.map(async (user) => {
       const chat = await Chat.findOne({
         $or: [
           { messageSender: loggedInUserId, messageReceiver: user._id },
           { messageSender: user._id, messageReceiver: loggedInUserId }
         ]
       }, { _id: 1 }); // Get only the chat ID
 
       return {
         ...user._doc, // Keep the user data
         chatId: chat ? chat._id : null // Add the chatId if a chat exists, otherwise null
       };
     }));
 
     // Return the found users along with chatId if a chat exists
     return res.status(StatusCodes.OK).json({
       statusCode: 0,
       message: "Users and chats found.",
       data: believedUsersWithChat
     });
 
   } catch (err) {
     console.error('Error retrieving believed users and chats:', err);
     return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
       statusCode: 1,
       message: "An error occurred while retrieving believed users and chats.",
       data: null
     });
   }
 };
 
const getUserStatus = async (req) => {
   try {
     const authHeader = req ? req : null;
     let current_user_id = "";
 
     if (authHeader) {
       const token = authHeader;
       if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       current_user_id = decoded._id;
     }
 
     const ObjectId = require('mongoose').Types.ObjectId;
 
     const result = await Chat.aggregate([
       {
         $match: {
           $or: [
             { messageSender: new ObjectId(current_user_id) },
             { messageReceiver: new ObjectId(current_user_id) }
           ]
         }
       },
       { $unwind: "$message" },
       {
         $group: {
           _id: {
             $cond: [
               { $eq: ["$messageSender", new ObjectId(current_user_id)] },
               "$messageReceiver",
               "$messageSender"
             ]
           },
           lastMessage: { $last: "$message" },
           unreadCount: {
             $sum: {
               $cond: [
                 {
                   $and: [
                     { $eq: ["$message.readStatus", false] },
                     { $ne: ["$messageSender", new ObjectId(current_user_id)] }
                   ]
                 },
                 1,
                 0
               ]
             }
           },
           chat_id: { $first: "$_id" }
         }
       },
       {
         $lookup: {
           from: "users", // Lookup in users collection
           localField: "_id", // The user ID from the chat
           foreignField: "_id", // The user ID in the users collection
           as: "user_details"
         }
       },
       {
         $unwind: {
           path: "$user_details",
           preserveNullAndEmptyArrays: true
         }
       },
       {
         $project: {
           userStatus: "$user_details.userControlCenter.userStatus" // Only include userStatus from userControlCenter
         }
       }
     ]);
 
     console.log("User statuses retrieved.");
     return result;
   } catch (error) {
     console.log("Error:", error);
     return error;
   }
 };
 
 const getBeleivedBy = async (req, res) => {
   debugger
   try {
      /* code for getting user_id from header */
      // const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
      // if (authHeader) {
      //    const token = authHeader.split(' ')[1];
      //    if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
      //    const decoded = jwt.verify(token, process.env.JWT_SECRET);
      //    console.log("token", token);
      //    user_id = decoded._id;
      //    console.log("user id ", decoded._id);
      // }
      let user_id;

      // Check if webName is provided in the payload
      if (req.body?.webName) {
         const user = await User.findOne({ webName: req.body.webName }).select("_id").exec();
         if (!user) {
            return res.status(404).json({ statusCode: 1, message: "User not found with the given webName.", data: null });
         }
         user_id = user._id;  // Use the _id fetched from the User model
      } else {
         // Extract user ID from Authorization token
         const authHeader = req.headers.authorization || null;
         if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user_id = decoded._id;
         }
      }

      const currentUser = await User.findById(user_id).exec();
      console.log("current user", currentUser)
      if (!currentUser) {
         throw new Error('User not found');
      }
      const believerIds = currentUser.believedBy;
      const ObjectId = require('mongoose').Types.ObjectId;

      const believersDetails = await User.aggregate([
         {
            $match: { _id: { $in: believerIds.map(id => new ObjectId(id)) } }
         },
         {
            $lookup: {
               from: "chats", // name of the chat collection
               let: { believerId: "$_id" },
               pipeline: [
                  { $match: { $expr: { $or: [{ $eq: ["$messageSender", "$$believerId"] }, { $eq: ["$messageReceiver", "$$believerId"] }] } } },
                  { $match: { $expr: { $or: [{ $eq: ["$messageSender", new ObjectId(user_id)] }, { $eq: ["$messageReceiver", new ObjectId(user_id)] }] } } },
                  { $project: { _id: 1 } }
               ],
               as: "chats"
            }
         },
         {
            $unwind: {
               path: '$chats',
               preserveNullAndEmptyArrays: true
            }
         },
         {
            $project: {
               'chats._id': 1,
               mobileNumber: 1,
               webName: 1,
               fullName: 1,
               profilePicture: 1
            }
         }
      ]);

      return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: "",
         data: believersDetails
      });
   } catch (error) {
      console.error("Error: ", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         statusCode: 1,
         message: "something went wrong",
         data: null
      });
   }
};
 
const inviteUser = async (req, res) => {
   debugger
   try {
      /* code for getting user_id from header */
      const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
      if (authHeader) {
         const token = authHeader.split(' ')[1];
         if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         console.log("token", token);
         user_id = decoded._id;
         console.log("user id ", decoded._id);
      }
      let mobileNumber;
      mobileNumber=req.body.contactNumber?req.body.contactNumber:"";
      const newInvite = new Invite({
         userId: user_id, // Extracted from JWT
         contactNumber:mobileNumber,
         joinStatus: false, // Default value
     });

     await newInvite.save();
      return res.status(StatusCodes.OK).json({
         statusCode: 0,
         message: "",
         data: newInvite
      });
   } catch (error) {
      console.error("Error: ", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
         statusCode: 1,
         message: "something went wrong",
         data: null
      });
   }
};


// const getUsersWithBelieverAndBelieving = async (req, res) => {
//    try {
//       const authHeader = req.headers.authorization;
//       if (!authHeader) return res.status(403).send({ statusCode: 1, message: "Access denied." });

//       const token = authHeader.split(' ')[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const loggedInUserId = decoded._id;

//       // Find the logged-in user to get their believers and believedBy
//       const loggedInUser = await User.findById(loggedInUserId, { believer: 1, believedBy: 1 });
//       if (!loggedInUser) return res.status(404).send({ statusCode: 1, message: "User not found." });

//       const believerIds = loggedInUser.believer;
//       const believedByIds = loggedInUser.believedBy;

//       // Find common user IDs between believer and believedBy arrays
//       const commonUserIds = believerIds.filter(id => believedByIds.includes(id));

//       // Fetch user details for common user IDs
//       const users = await User.find({ _id: { $in: commonUserIds } }, {
//          fullName: 1,
//          webName: 1,
//          mobileNumber: 1,
//          profilePicture: 1,
//          believer: 1,
//          believedBy: 1
//       });

//       const results = users.map(user => {
//          return {
//             ...user._doc,
//             isCommonBeliever: true
//          };
//       });

//       res.status(200).json({ statusCode: 0, message: "Common believers retrieved successfully", data: results });
//    } catch (error) {
//       console.error("Error retrieving users", error);
//       res.status(500).json({ statusCode: 1, message: "Error retrieving users" });
//    }
// };

const getUsersWithBelieverAndBelieving = async (req, res) => {
   try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(403).send({ statusCode: 1, message: "Access denied." });

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const loggedInUserId = decoded._id;

      const loggedInUser = await User.findById(loggedInUserId, { believer: 1, believedBy: 1 });
      if (!loggedInUser) return res.status(404).send({ statusCode: 1, message: "User not found." });

      const believerIds = loggedInUser.believer;
      const believedByIds = loggedInUser.believedBy;

      const commonUserIds = believerIds.filter(id => believedByIds.includes(id));

      const users = await User.find({ _id: { $in: commonUserIds } }, {
         fullName: 1,
         webName: 1,
         mobileNumber: 1,
         profilePicture: 1,
         believer: 1,
         believedBy: 1
      });

      const results = await Promise.all(users.map(async user => {
         const chat = await Chat.findOne({
            $or: [
               { messageSender: loggedInUserId, messageReceiver: user._id },
               { messageSender: user._id, messageReceiver: loggedInUserId }
            ]
         }, { _id: 1 });

         return {
            ...user._doc,
            isCommonBeliever: true,
            chatId: chat ? chat._id : null
         };
      }));

      res.status(200).json({ statusCode: 0, message: "Common believers retrieved successfully", data: results });
   } catch (error) {
      console.error("Error retrieving users", error);
      res.status(500).json({ statusCode: 1, message: "Error retrieving users" });
   }
};

const updateVoipToken = async (req, res) => {
   try {
      const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
      if (authHeader) {
         const token = authHeader.split(' ')[1];
         if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
         const decoded = jwt.verify(token, process.env.JWT_SECRET);
         console.log("token", token);
         const user_id = decoded._id;
         console.log("user id ", decoded._id);

         const user = await User.findByIdAndUpdate(user_id, { voipToken: req.body.voipToken }, {
            new: true,
            upsert: true,
         })
         console.log(user.voipTokenToken);
         return res.status(StatusCodes.OK).json({
            statusCode: 0,
            message: "Updated Voip token"
         });
      } else {
         return res.status(StatusCodes.UNAUTHORIZED).json({
            statusCode: 1,
            message: "Unauthorized"
         });
      }
   } catch (error) {
      return res.status(StatusCodes.OK).json({
         statusCode: 1,
         message: "Something went wrong", data: null
      });
   }
};

module.exports = { signUp, signIn, webNameCheck, updateUserDetails, getUserDetails, searchWebName, believer, getBeleiver, checkMobileNumbers, userActivity, exploreData, updateFcmToken, editProfile, updateUserControlCenter, deleteOrSignOut, blockContentOrUser, unblockContentOrUser, getUserBlockList,getBelievedUsers ,getUserStatus,getBeleivedBy,inviteUser,getUsersWithBelieverAndBelieving,updateVoipToken};