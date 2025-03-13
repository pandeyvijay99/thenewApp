const express = require("express");
const socketIo = require('socket.io');
const http = require('http');
require("dotenv").config();
const connectDB = require("./src/db/connect");
const fileupload = require("express-fileupload");
const chatController = require('./src/controller/chat');
const userController = require('./src/controller/auth');
const user = require('./src/models/auth');
const Chat = require('./src/models/chat');
const { WebSocket, WebSocketServer } = require('ws');
const jwt = require("jsonwebtoken");
const url = require('url');
const app = express();
var cors = require("cors");
app.use(fileupload());
const {sendPushNotification} = require('./src/controller/notificaion');
// const sendCallNotification = require('./src/controller/notificaion');
const authRouter = require("./src/routes/auth");
const blipRouter = require("./src/routes/blip");
const videoRouter = require("./src/routes/video");
const photoRouter = require("./src/routes/photo");
const chatRouter = require("./src/routes/chat");
const inboxRouter = require("./src/routes/inbox");
const walletRouter = require("./src/routes/wallet");
const agoraRouters = require("./src/routes/agora_helper");
const callRouter = require("./src/routes/call");
const noteRouter = require("./src/routes/note");
const splitmoneyRouter = require("./src/routes/splitmoney");
const articleRouter = require("./src/routes/article");
const thoughtsRouter = require("./src/routes/thoughts");
const podcastRouter = require("./src/routes/podcast");
const musicRouter = require("./src/routes/music");
const reportRouter = require("./src/routes/report");
const callLogRouter = require("./src/routes/calllog");
// const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const io = socketIo(server);
console.log("server and io", server)
app.use(cors());
app.use(express.json());
app.use(express.static('public'))
app.use("/api", authRouter);
app.use("/api", blipRouter)
app.use("/video/api", videoRouter)
app.use("/photo/api", photoRouter)
app.use("/chat/api", chatRouter)
app.use("/notification/api", inboxRouter)
app.use("/wallet/api", walletRouter)
app.use("/api", splitmoneyRouter)
app.use("/connect/api", agoraRouters)
app.use("/call/api", callRouter)
app.use("/note/api", noteRouter)
app.use("/article/api", articleRouter)
app.use("/thoughts/api", thoughtsRouter)
app.use("/podcast/api", podcastRouter)
app.use("/music/api", musicRouter)
app.use("/report/api", reportRouter)
app.use("/calllog/api", callLogRouter)

const port = process.env.PORT || 10000;

app.get('/deeplink/*', (req, res) => {
  res.send('Deep link is working');
});

const onlineUsers = new Map();
/*New Code for handling Message Chat History and message update*/
// wss.on('connection', function (ws, req) {
//    debugger;
//   let currentUserId = null;

//   console.log(req.url)
//   const token = req.url ? req.url.split('?token=')[1] : null;
//   if (!token) {
//     ws.close();
//     return;
//   }

//   // console.log("token is ", token)
//   if (token != null || token != "null" || token != 'null' || token != undefined || token != '') {
//     // console.log("token type is ", typeof (token), token);
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     // console.log("token", token);
//     let currentUserId  = decoded._id;
//     // console.log("currentUserId ", decoded._id);
//     const connectedMessage = new TextEncoder().encode(JSON.stringify({ message: "connected" }));
//   wss.clients.forEach(function each(client) {
//     if (client.readyState === WebSocket.OPEN) {
//       client.send(connectedMessage, { binary: false });  // Ensure this message is not binary
//     }
//   });
//     onlineUsers.set(currentUserId, ws);
//   }
//   ws.on('message', async (data, isBinary) => {

//     const msg = JSON.parse(data);
//     // console.log("message ", msg)
//     /*users status */

//     if (msg.type === 'checkstatus') {
//       debugger;
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const currentUserId = decoded._id;
//       console.log(`User ${currentUserId} connected via WebSocket.`);

//       // Store user as online in the onlineUsers map
//       onlineUsers.set(currentUserId, ws);

//       // Find all users that the current user has chatted with
//       const ObjectId = require('mongoose').Types.ObjectId;

//       // Find users with whom the current user has chatted
//       const chatParticipants = await Chat.aggregate([
//         {
//           $match: {
//             $or: [
//               { messageSender: new ObjectId(currentUserId) },
//               { messageReceiver: new ObjectId(currentUserId) }
//             ]
//           }
//         },
//         {
//           $group: {
//             _id: {
//               $cond: [
//                 { $eq: ["$messageSender", new ObjectId(currentUserId)] },
//                 "$messageReceiver", // Group by messageReceiver if the current user is the sender
//                 "$messageSender" // Group by messageSender if the current user is the receiver
//               ]
//             }
//           }
//         },
//         {
//           $lookup: {
//             from: "users", // Lookup user details from the users collection
//             localField: "_id", // Chat participant ID
//             foreignField: "_id",
//             as: "user_details"
//           }
//         },
//         {
//           $unwind: "$user_details"
//         }
//       ]);

//       // Prepare the list of chat participants with their connection status
//       let participantsStatus = chatParticipants.map(participant => {
//         const user = participant.user_details;
//         const isOnline = onlineUsers.has(user._id.toString()); // Check WebSocket connection

//         const userStatus = user.userControlCenter ? user.userControlCenter.userStatus : false; // Check user status

//         return {
//           _id: user._id,
//           webName: user.webName,
//           fullName: user.fullName,
//           connectionStatus: (userStatus && isOnline) ? true : (userStatus && !isOnline) ? false : false,
//           lastLoggedIn: user.lastLoginMeta ? user.lastLoginMeta.login_time : null
//         };
//       });

//       // Send the chat participants' status via WebSocket
//       ws.send(JSON.stringify({
//         type: 'participantsStatus',
//         data: participantsStatus
//       }));
//     }

//     /*end of code*/
//     if (msg.type === 'getHistory') {
//       debugger;
//       let chatHistory = await chatController.getChatHistory(msg.chat_id)
//       // console.log("chatHistory", chatHistory)
//       chatHistory = new TextEncoder().encode(JSON.stringify(chatHistory))
//       wss.clients.forEach(function each(client) {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(chatHistory, { binary: isBinary });
//         }
//       });
//     }
//     /*User chat*/
//     // if (msg.type === 'userChat') {
//     //   // debugger;
//     //   let userChat = await chatController.getUserChatFromSocket(token)
//     //   console.log("chatHistory", userChat)
//     //   userChat = new TextEncoder().encode(JSON.stringify(userChat))
//     //   wss.clients.forEach(function each(client) {
//     //     if (client.readyState === WebSocket.OPEN) {
//     //       client.send(userChat, { binary: isBinary });
//     //     }
//     //   });
//     // }
//     if (msg.type === 'userChat') {
//       debugger
//       // Get the chat data with online status and unread counts
//       // console.log("online users ",onlineUsers);
//       // console.log("online users ",onlineUsers);
//       let userChat = await chatController.getUserChatFromSocket(token,onlineUsers);
//       // console.log("chatHistory", userChat);

//       // Encode the data to send via WebSocket
//       userChat = new TextEncoder().encode(JSON.stringify(userChat));

//       // Send data to all WebSocket clients
//       wss.clients.forEach(function each(client) {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(userChat, { binary: isBinary });
//         }
//       });
//     }
//     /**/
//     if (msg.type === "updateMessage") {
//       if (msg.message_id && (msg.message_id).length > 0) {
//         let updateMessage = await chatController.updateMessageStatus(msg.chat_id, msg.message_id)
//         updateMessage = new TextEncoder().encode(JSON.stringify(updateMessage))
//         wss.clients.forEach(function each(client) {
//           if (client.readyState === WebSocket.OPEN) {
//             client.send(updateMessage, { binary: isBinary });
//           }
//         });
//       }
//     }
//     //debugger;
//     try {
//       if (msg.type === "message") {
//         const savedMessage = await chatController.saveMessage(msg);
//         //debugger
//         console.log("messageReciver", savedMessage.messageReceiver)
//         const lastMessage = savedMessage.message[savedMessage.message.length - 1];
//         console.log('Last inserted message:', lastMessage);
//         //debugger
//         const ObjectId = require('mongoose').Types.ObjectId
//         const userDetail = await user.findById(new ObjectId(msg.sender));
//         data = { ...msg, userDetail: userDetail, chat_created_at: lastMessage.createdAt ? lastMessage.createdAt : "", message_id: lastMessage._id, messageReceiver: savedMessage.messageReceiver ? savedMessage.messageReceiver : "" }
//         data = new TextEncoder().encode(JSON.stringify(data))
//         wss.clients.forEach(function each(client) {
//           if (client.readyState === WebSocket.OPEN) {
//             client.send(data, { binary: isBinary });
//           }
//         });
//       }
//     } catch (err) {
//       console.error('Error saving message:', err);
//     }
//   });

//   ws.on('error', console.error);

//   // Handle client disconnection
//   ws.on('close', () => {
//     console.log('Client disconnected');
//   });
// });
wss.on('connection', async function (ws, req, isBinary) {
  debugger
  let currentUserId = null;

  // Extract token from request URL and verify it
  const token = req.url ? req.url.split('?token=')[1] : null;
  if (!token) {
    ws.close();
    return;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  currentUserId = decoded._id;
  try {
    debugger

    // Store the connected user in the `onlineUsers` map
    onlineUsers.set(currentUserId, ws);
    user.findByIdAndUpdate(currentUserId, { lastOnlineTime: new Date() }, { new: true })
      .then((updatedUser) => {
        if (updatedUser) {
          console.log(`User ${currentUserId} lastOnlineTime updated to ${updatedUser.lastOnlineTime}`);
        } else {
          console.log(`User with id ${currentUserId} not found`);
        }
      })
      .catch((err) => {
        console.error(`Error updating lastOnlineTime for user ${currentUserId}:`, err);
      });

    /*online users chat*/
    broadcastToAll({
      type: 'userConnected',
      userId: currentUserId,
    });

    let userChat = await chatController.getUserChatFromSocket(token, onlineUsers);
    userChat = { type: 'userChat', data: userChat };
    userChat = new TextEncoder().encode(JSON.stringify(userChat));
    // Send user chat only to the current user
    ws.send(userChat, { binary: isBinary });

    /*end of code*/
  } catch (err) {
    console.error('Invalid token:', err);
    ws.close();
    return;
  }


  // WebSocket message handling
  ws.on('message', async (data, isBinary) => {
    const msg = JSON.parse(data);

    // Check the status of users who have chatted with the current user
    if (msg.type === 'checkstatus') {
      const chatParticipants = await getChatParticipants(currentUserId);

      const participantsStatus = chatParticipants.map(participant => {
        console.log("getChatParticipants", participant.user_details.fullName)
        const isOnline = onlineUsers.has(participant._id.toString());
        return {
          _id: participant._id,
          fullName: participant.user_details.fullName,
          lastLoginTime: participant.user_details.lastOnlineTime ? participant.user_details.lastOnlineTime : null,
          connectionStatus: isOnline,

        };
      });

      // Send status to the current user
      ws.send(JSON.stringify({
        type: 'participantsStatus',
        data: participantsStatus
      }));
    }

    // Get chat history for a specific chat
    if (msg.type === 'getHistory') {
      debugger
      let chatHistory = await chatController.getChatHistory(msg.chat_id, msg.limit, msg.offset);
      chatHistory = { type: 'getHistory', data: chatHistory };
      chatHistory = new TextEncoder().encode(JSON.stringify(chatHistory));
      // Send chat history only to the requesting user
      ws.send(chatHistory, { binary: isBinary });
    }

    // Handle user chat (list chats for the current user)
    if (msg.type === 'userChat') {
      let userChat = await chatController.getUserChatFromSocket(token, onlineUsers);
      userChat = { type: 'userChat', data: userChat };
      userChat = new TextEncoder().encode(JSON.stringify(userChat));
      // Send user chat only to the current user
      ws.send(userChat, { binary: isBinary });
    }

    // Update message status for a chat
    if (msg.type === "updateMessage") {
      debugger
      if (msg.message_id && msg.message_id.length > 0) {
        let updateMessage = await chatController.updateMessageStatus(msg.chat_id, msg.message_id);
        updateMessage = { type: 'updateMessage', data: updateMessage };
        updateMessage = new TextEncoder().encode(JSON.stringify(updateMessage));

        // Send message update only to users in the same chat
        const chatClients = await getChatClients(msg.chat_id);
        // console.log("chatClients", chatClients)
        if (chatClients && chatClients != null && chatClients.length > 0) {
          chatClients.forEach(client => {
            console.log("client", client)
            if (client != null && client.readyState === WebSocket.OPEN) {
              client.send(updateMessage, { binary: isBinary });
            }
          });
        }
      }
    }

    // Handle sending a new message in a chat
    if (msg.type === "message") {
      debugger;
      try {
        // Save the message in the database
        const savedMessage = await chatController.saveMessage(msg);
        const lastMessage = savedMessage.message[savedMessage.message.length - 1];

        // Retrieve sender details
        const ObjectId = require('mongoose').Types.ObjectId;
        const userDetail = await user.findById(new ObjectId(msg.sender));
        const data = {
          ...msg,
          userDetail: userDetail,
          chat_created_at: lastMessage.createdAt || "",
          message_id: lastMessage._id,
          messageReceiver: savedMessage.messageReceiver || ""
        };

        const encodedData = new TextEncoder().encode(JSON.stringify(data));

        // Get all participants for this chat
        const chatClients = await getChatClients(msg.chat_id);
        console.log("Chat clients for the message:", chatClients);

        // Check if at least one client is online
        let messageDelivered = false;
        chatClients.forEach(client => {
          console.log("client", client)
          if (client && client.readyState === WebSocket.OPEN) {
            client.send(encodedData, { binary: isBinary });
            messageDelivered = true; // Mark message as delivered
            console.log(`Message sent to user: ${client.userId}`);
          }
        });

        // Handle offline case (queue message or notify)
        // sendPushNotification(msg.receiver, msg.sender, "NewMessage", msg.text,false);
        if (!messageDelivered) {
          console.log("All participants offline, queueing the message.");
           sendPushNotification(msg.receiver, msg.sender, "NewMessage", msg.text,false);
        }
      } catch (err) {
        console.error('Error processing message type "message":', err);
      }
    }
  //   if (msg.type === "message") {
  //     debugger;
  //     try {
  //         // Save the message in the database
  //         const savedMessage = await chatController.saveMessage(msg);
  //         const lastMessage = savedMessage.message[savedMessage.message.length - 1];
  
  //         // Retrieve sender details
  //         const ObjectId = require('mongoose').Types.ObjectId;
  //         const userDetail = await user.findById(new ObjectId(msg.sender));
  //         const data = {
  //             ...msg,
  //             userDetail,
  //             chat_created_at: lastMessage?.createdAt || "",
  //             message_id: lastMessage?._id,
  //             messageReceiver: savedMessage.messageReceiver || ""
  //         };
  
  //         const jsonData = JSON.stringify(data); // Directly use JSON
  
  //         // Get all participants for this chat
  //         const chatClients = await getChatClients(msg.chat_id);
  //         console.log("Chat clients for the message:", chatClients);
  
  //         // Check if the receiver is online
  //         const receiverClient = onlineUsers.get(msg.receiver);
  
  //         if (receiverClient && receiverClient.readyState === WebSocket.OPEN) {
  //             receiverClient.send(jsonData); // Remove `{ binary: isBinary }`
  //             console.log(`Message sent to receiver: ${msg.receiver}`);
  //         } else {
  //             console.log("Receiver is offline, sending push notification.");
  //             sendPushNotification(msg.receiver, msg.sender, "NewMessage", msg.message, false);
  //         }
  //     } catch (err) {
  //         console.error('Error processing message:', err);
  //     }
  // }
  
  
  

  });

  // Handle WebSocket errors
  ws.on('error', console.error);

  // Handle client disconnection
  ws.on('close', async () => {
    // console.log('Client disconnected');
    debugger
    onlineUsers.delete(currentUserId); // Remove from online users map on disconnect
    const disconnectedUser = await user.findById(currentUserId);
    console.log("disconnectedUser", disconnectedUser)
    const userDetails = {
      _id: disconnectedUser._id,
      fullName: disconnectedUser.fullName,
      lastLoginTime: disconnectedUser.lastOnlineTime,
      connectionStatus: false, // User is now offline
    };
    broadcastToAll({
      type: 'userDisconnected',
      userId: userDetails,
    });
  });
});

/**
 * Helper function to get all participants in a chat based on chat_id
 */
// async function getChatClients(chat_id) {
//   debugger;
//   const ObjectId = require('mongoose').Types.ObjectId;

//   // Fetch all participants in the chat
//   const chatParticipants = await Chat.aggregate([
//     { $match: { _id: new ObjectId(chat_id) } },
//     { $unwind: "$message" },
//     { $group: { _id: "$message.messageSender" } },
//     {
//       $lookup: {
//         from: "users",
//         localField: "_id",
//         foreignField: "_id",
//         as: "user_details"
//       }
//     },
//     { $unwind: "$user_details" }
//   ]);

//   // console.log("Participants fetched:", chatParticipants);

//   // Filter and return only active WebSocket connections
//   return chatParticipants
//     .map(participant => {
//       const ws = onlineUsers.get(participant._id.toString());
//       return ws ? ws : null;
//     })
//   // .filter(ws => ws !== null); // Exclude offline or invalid connections
// }
async function getChatClients(chat_id) {
  debugger;
  const ObjectId = require('mongoose').Types.ObjectId;

  // Fetch all participants in the chat
  const chatParticipants = await Chat.aggregate([
      { $match: { _id: new ObjectId(chat_id) } },
      { $unwind: "$message" },
      { $group: { _id: "$message.messageSender" } },
      {
          $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user_details"
          }
      },
      { $unwind: "$user_details" }
  ]);

  return chatParticipants
      .map(participant => {
          const ws = onlineUsers.get(participant._id.toString());
          console.log(`User ${participant._id.toString()} WebSocket:`, ws);
          return ws;
      })
      .filter(ws => ws !== null && ws !== undefined); // Exclude offline connections
}



/**
 * Helper function to get chat participants for the current user
 */
async function getChatParticipants(userId) {
  const ObjectId = require('mongoose').Types.ObjectId;
  return await Chat.aggregate([
    {
      $match: {
        $or: [
          { messageSender: new ObjectId(userId) },
          { messageReceiver: new ObjectId(userId) }
        ]
      }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$messageSender", new ObjectId(userId)] },
            "$messageReceiver",
            "$messageSender"
          ]
        }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user_details"
      }
    },
    { $unwind: "$user_details" }
  ]);
}

/*Broadcast all*/
function broadcastToAll(message) {
  onlineUsers.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
/*End of code*/
/*End of code */
/**/
const start = async () => {
  // debugger
  try {
    await connectDB(process.env.MONGO_URL);
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log("error =>", error);
  }
};
start();