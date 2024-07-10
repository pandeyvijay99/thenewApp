const { StatusCodes } = require("http-status-codes");
const Chat = require("../models/chat");
const Webname = require("../models/webname");
const jwt = require("jsonwebtoken");
const socketIo = require('socket.io');
const multer = require('multer');
const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");
const userChat = async (req, res) => {
     console.log("chat validation ")
  try {
      if (!req.body.sender_user_id || !req.body.receiver_user_id ||  !req.body.message  ) {
        return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
           message: "Please Enter required parameter",data:null
        });
     }
    const ObjectId = require('mongoose').Types.ObjectId
     const chatData ={
      messageSender:new ObjectId(req.body.sender_user_id),
      messageReceiver:new ObjectId(req.body.receiver_user_id),
      message:[{message:req.body.message}]
  }
  console.log("chatData ",chatData)
     if(req.body.chat_id==""){
         debugger;
         const savedChat = await Chat.create(chatData).then((data, err) => {
         if (err) return res.status(StatusCodes.OK).json({statusCode:1,message: err,data:null });
         });
         console.log('chatID created ');
         
     } else {
      debugger;
      console.log("inside else of chat")
      const message ={
         message:req.body.message
     }
     debugger;
  //  const ObjectId = require('mongoose').Types.ObjectId
     const filter = { _id: new ObjectId( req.body.chat_id) };
     console.log("filer is ",filter);
     const result = await Chat.findOneAndUpdate(filter, {$push:{message:message}}, {
       returnOriginal: false
     });
     return res.status(StatusCodes.OK).json({statusCode:0,
      message:"",   
      data: { result },
   });
   }
     
} catch (error) {
    console.log("catch ", error );
   return res.status(StatusCodes.BAD_REQUEST).json({ statusCode:1,message: error,data:null });
  }
};

const getChatHistory = async (req) => {
  debugger
   console.log("chat validation ")
try {
    if (!req) {
    
      // return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
      //    message: "Please Enter required parameter",data:null
      // });
      return "Please Enter required parameter"
   }
  //  const pageNumber =req.body.offset?req.body.offset:1; // Assuming page number starts from 1
  //  const pageSize = (req.body.limit)? (req.body.limit):10; // Number of documents per page
  //  const offset = (pageNumber - 1) * pageSize; // Calculate offset
  const ObjectId = require('mongoose').Types.ObjectId
      //  const result = await Chat.find({_id:new ObjectId(req.body.chat_id)})
      //  .limit(pageSize)
      //  .skip(offset)
      debugger;
      const result = await   Chat.aggregate([
         {
             $match:{
               _id:new ObjectId(req)
             } // unwind the comments array
         },
         {
            $unwind:"$message"
         },
         {
             $lookup: {
                 from: "users", // name of the comment collection
                 localField: "message.messageSender",
                 foreignField: "_id",
                 as: "user_details"
             }
         },
         {
          $unwind: {
            path: '$user_details',
            preserveNullAndEmptyArrays: true
          }
        },
         {
            $project: {
                _id: 1,
                message: 1,
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

       console.log('chatID created ');
       return result;
      //  return res.status(StatusCodes.OK).json({ statusCode:0,message:"",data:result });
} catch (error) {
  console.log("catch ", error );
  return error.message
//  return res.status(StatusCodes.OK).json({ statusCode:1,message: error,data:null });
}
};
const createChatRoom = async (req,res) => {
   debugger
   try{
      if (!req.body.sender_user_id || !req.body.receiver_user_id) {
         return res.status(StatusCodes.OK).json({statusCode:1,
            message: "Please Enter required parameter",data:null
         });
      }
      const ObjectId = require('mongoose').Types.ObjectId
      let query = {
        $or: [
          { messageSender: new ObjectId(req.body.sender_user_id), messageReceiver: new ObjectId(req.body.receiver_user_id) },
          { messageSender: new ObjectId(req.body.receiver_user_id), messageReceiver: new ObjectId(req.body.sender_user_id)},
        ],
        }
      const chatData ={
       messageSender:new ObjectId(req.body.sender_user_id),
       messageReceiver:new ObjectId(req.body.receiver_user_id)
      }
      let chatRoom = await Chat.findOne(query);

      if (!chatRoom) {
        const savedChat=  await Chat.create(chatData)
        console.log('chatID created ');
         return res.status(StatusCodes.OK).json({statusCode:0,message:"",data: savedChat._id});
      }
      // const savedChat = await Chat.create(chatData)
      return  res.status(StatusCodes.OK).json({statusCode:0,message:"",data: chatRoom._id});
         

   }catch(error){
      console.log("catch ", error );
 return res.status(StatusCodes.OK).json({ statusCode:1,message: error,data:null });
   }

};

const saveMessage = async (req,res) => {

   debugger
//   console.log("request",req)
  try {
   debugger;
   // console.log("inside else of chat")
   const ObjectId = require('mongoose').Types.ObjectId
   const message ={
      message:req.message,
      messageType:req.messageType,
      readStatus:req.readStatus,
      messageSender:new ObjectId(req.sender)
  }
  debugger;

  const filter = { _id: new ObjectId( req.chat_id) };
  console.log("filer is ",filter);
  const result = await Chat.findOneAndUpdate(filter, {$push:{message:message}}, {
    returnOriginal: false
  });
  return result
  } catch (err) {
    console.error('Error saving message:', err);
    throw err;
  }
};

const getRecentMessages = async () => {
   try {
     const messages = await Chat.find().sort({ timestamp: -1 }).limit(50).exec();
   //   console.log("message ", messages)
     return messages.reverse(); // Return messages in chronological order
   } catch (err) {
     console.error('Error retrieving messages:', err);
     throw err;
   }
 };
 const updateMessageStatus = async (chat_id,message_id) => {
  debugger;
  try {
    if (!chat_id || !message_id  ) {
      // return res.status(StatusCodes.BAD_REQUEST).json({statusCode:1,
      //    message: "Please Enter required parameter",data:null
      // });
      return "invalid parameter"
   }
   let stringObjectIdArray= message_id
  // const ObjectId = require('mongoose').Types.ObjectId
//    const chatData ={
//     messageSender:new ObjectId(req.body.sender_user_id),
//     messageReceiver:new ObjectId(req.body.receiver_user_id),
//     message:[{message:req.body.message}]
// }
// console.log("chatData ",chatData)
   
    debugger;
    console.log("inside else of chat")
  //   const message ={
  //     readStatus:req.body.readstatus
  //  }
   debugger;
 const ObjectId = require('mongoose').Types.ObjectId
 let objectIdArray = stringObjectIdArray.map(s => new ObjectId(s));
   console.log("filer is ",objectIdArray);
  
  const result = await Chat.updateMany(
    {'message._id': { $in:(objectIdArray) },_id : new ObjectId(chat_id) },
    { $set: { 'message.$[elem].readStatus': true } },
    { arrayFilters: [{ 'elem._id': { $in: (objectIdArray) } }] }
  );
  console.log(result);
//    return res.status(StatusCodes.OK).json({statusCode:0,
//     message:"",   
//     data: {info:"read status updated successfully"},
//  });
 return result;
   
} catch (error) {
  console.log("catch ", error );
//  return res.status(StatusCodes.BAD_REQUEST).json({ statusCode:1,message: error,data:null });
return error.message
}
 };
 const getUserChat = async (req, res) => {
 
try {
  const authHeader = (req.headers.authorization)?req.headers.authorization:null;
  let current_user_id =""
  debugger
  if(authHeader){
      const token =  authHeader.split(' ')[1];
  if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null});
  console.log("token" , token);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  current_user_id = decoded._id
   }
   const ObjectId = require('mongoose').Types.ObjectId
   debugger
     const result = await   Chat.aggregate([
       
      {
        $match: {
          $or: [
            { messageSender: new ObjectId(current_user_id) },
             { messageReceiver: new ObjectId(current_user_id) }
          ]
        }
      },
      // Unwind the message array to work with individual messages
      { $unwind: "$message" },
      // Group messages by the user and get the latest message and unread count
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
          chat_id: { $first: "$_id" },
        }
      },
      // Lookup to get full user details for the messageSender
       {
            $lookup: {
                from: "users", // name of the comment collection
                localField: "_id",
                foreignField: "_id",
                as: "user_details"
            }
        },
        {
          $unwind: {
            path: '$user_details',
            preserveNullAndEmptyArrays: true
          }
        },
      // Project the final required fields
      {
        $project: {
          chat_id: 1,
          userId: "$_id",
          lastMessage: "$lastMessage.message",
          lastMessageCreatedAt: "$lastMessage.createdAt",
          messageId :"$lastMessage._id",
          messageType:"$lastMessage.messageType",
          unreadCount: "$unreadCount",
          user_details:1,
           }
        
      }
     ]);

      console.log('chatID created ');
      return res.status(StatusCodes.OK).json({ statusCode:0,message:"",data:result });
} catch (error) {
 console.log("catch ", error );
return res.status(StatusCodes.OK).json({ statusCode:1,message: error,data:null });
}
};
const uploadChatFile = async (req, res) => {
  debugger
  console.log("body data", req.body);
  // console.log("file data",(req.files)?req.files.file:"")
  // return
  const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
  let mobileNumber = ""
  debugger
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
    console.log("token", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    mobileNumber = decoded.mobileNumber;
    photo_user_id = decoded._id
    console.log("photodecoded ", decoded.mobileNumber);
  }

  console.log("file data", req.files ? req.files.file : "")
  debugger;
  let filedata = "";
  if (req.files)
    filedata = (Array.isArray(req.files.file) ? req.files.file : [req.files.file]).filter(e => e);
  console.log("myfile ", filedata.length)
  // const filedata = req.files.file?req.files.file:"";
  // console.log("filedata ", filedata[0].name,typeof(filedata));
  if (filedata.length == 0)
    return res.status(400).send({ statusCode: 1, message: 'No file uploaded.', data: null });
  console.log("file length ", filedata.length)

  const storage = multer.memoryStorage();
  const upload = multer({ storage: storage });
  const accountName = process.env.ACCOUNT_NAME;
  const accountKey = process.env.KEY_DATA;
  let containerName ="";
  if(req.body.type=="image")
    containerName = process.env.CHAT_IMAGE_CONTAINER;
  else
  containerName = process.env.CHAT_VIDEO_CONTAINER;
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
  );

  const containerClient = blobServiceClient.getContainerClient(containerName);

  if (!filedata) {
    return res.status(400).send({ statusCode: 1, message: 'No file uploaded.', data: null });
  } else if (filedata.size > (20 * 1024 * 1024)) {
    return res.status(400).send({ statusCode: 1, message: 'Maximum allowed size is 5MB', data: null });
  }
  let blobURLs = [];
  let fileUrl =""
  for (const files of filedata) {
    const blobName = files.name;
    const stream = files.data;
    console.log("filename ", blobName)
    // Upload file to Azure Blob Storage
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    try {
      const uploadResponse = await blockBlobClient.upload(stream, stream.length);
       fileUrl = blockBlobClient.url;
      blobURLs.push(fileUrl)
      debugger;
      console.log("fileUrl", fileUrl)
      console.log('File uploaded successfully to Azure Blob Storage:', uploadResponse);
      // const { countryCode, mobileNumber } = req.body;
    } catch (error) {
      console.error("Error uploading to Azure Blob Storage:", error);
      return res.status(500).send({ statusCode: 1, message: 'Error uploading file to Azure Blob Storage.', data: null });
    }
  }
  return res.status(200).send({ statusCode: 0, message: '', data: fileUrl });
}
module.exports = { userChat,getChatHistory,createChatRoom,getRecentMessages,saveMessage,updateMessageStatus,getUserChat,uploadChatFile};
