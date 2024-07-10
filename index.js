const express = require("express");
const socketIo = require('socket.io');
const http = require('http');
require("dotenv").config();
const connectDB = require("./src/db/connect");
const fileupload = require("express-fileupload");
const chatController = require('./src/controller/chat');
const chatModel = require('./src/models/chat');
const user = require('./src/models/auth');
const  {WebSocket,WebSocketServer} = require('ws');
const jwt = require("jsonwebtoken");
const url = require('url');
const app = express();
var cors = require("cors");
app.use(fileupload());

const authRouter = require("./src/routes/auth");
const blipRouter = require("./src/routes/blip");
const videoRouter = require("./src/routes/video");
const photoRouter = require("./src/routes/photo");
const chatRouter = require("./src/routes/chat");
const chatsystemRouter = require("./src/routes/chatsystem");
// const { saveMessage } = require("./src/controller/chatsystem");
// const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const io = socketIo(server);
console.log("server and io",server)
app.use(cors());
app.use(express.json());
app.use(express.static('public'))
app.use("/api", authRouter);
app.use("/api",blipRouter)
app.use("/video/api",videoRouter)
app.use("/photo/api",photoRouter)
app.use("/chat/api",chatRouter)
// app.use("/chatsystem/api",chatsystemRouter)
// debugger;

/*end of socket programing*/
const port = process.env.PORT || 10000;

// io.on('connection', (socket) => {
//   console.log('A1 user connected');
// // debugger
//   socket.on('chat message', async (msg) => {
//     console.log("message data is ",msg);
//     try {
//           const savedMessage = await chatController.saveMessage(msg);
//           io.emit('chat message', savedMessage);
//         } catch (err) {
//           console.error('Error saving message:', err);
//         }
//   });
//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });

/**/
wss.on('connection',function  (ws,req)  {
  debugger;
  
   console.log(req.url)
   const token = req.url.split('?token=')[1];
   if (!token) {
    ws.close();
    return;
  }
   console.log("token is ",token)
   if(token!=null || token!="null" || token!='null' || token!=undefined || token !='' ){
    console.log("token type is ",typeof(token), token);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("token", token);
        user_id = decoded._id;
        console.log("user id ", decoded._id);
        ws.user = user_id;
  }
  ws.on('message', async (data, isBinary)=> {
    debugger;
    const msg = JSON.parse(data);
    console.log("message ",msg)
    if(msg.type==='getHistory'){
      let  chatHistory = await chatController.getChatHistory(msg.chat_id)
      console.log("chatHistory",chatHistory)
      chatHistory = new TextEncoder().encode(JSON.stringify(chatHistory))
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN ) {
          client.send(chatHistory, { binary: isBinary });
        }
    });
    }
    if(msg.type==="updateMessage"){
    if(msg.message_id && (msg.message_id).length>0){
      let  updateMessage  = await chatController.updateMessageStatus(msg.chat_id,msg.message_id)
      updateMessage = new TextEncoder().encode(JSON.stringify(updateMessage))
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN ) {
          client.send(updateMessage, { binary: isBinary });
        }
    });
    }
  }
    debugger;
    try{
      if(msg.type==="message"){
      const savedMessage = await chatController.saveMessage(msg);
      debugger
      console.log("messageReciver",savedMessage.messageReceiver)
      const lastMessage = savedMessage.message[savedMessage.message.length - 1];
      console.log('Last inserted message:', lastMessage);
      debugger
      const ObjectId = require('mongoose').Types.ObjectId
      const userDetail = await user.findById(new ObjectId(msg.sender));
       data = {...msg, userDetail: userDetail ,chat_created_at:lastMessage.createdAt?lastMessage.createdAt:"",message_id:lastMessage._id,messageReceiver:savedMessage.messageReceiver?savedMessage.messageReceiver:""}
       data = new TextEncoder().encode(JSON.stringify(data))
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN ) {
          client.send(data, { binary: isBinary });
        }
    });
  }
  }catch(err){
    console.error('Error saving message:', err);
  }
  });

  ws.on('error', console.error);

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// const WebSocket = require('ws');
// const jwt = require('jsonwebtoken');
// const chatController = require('./chatController'); // Ensure you have this module
// const user = require('./userModel'); // Ensure you have this module

// const wss = new WebSocket.Server({ port: 8080 });

// wss.on('connection', function (ws, req) {
//   debugger;

//   console.log(req.url);
//   const token = req.url.split('?token=')[1];
//   if (!token) {
//     ws.close();
//     return;
//   }
//   console.log("token is ", token);

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     console.log("token", token);
//     const user_id = decoded._id;
//     console.log("user id ", user_id);
//     ws.user = user_id;
//   } catch (err) {
//     console.error('Token verification failed:', err);
//     ws.close();
//     return;
//   }

//   ws.on('message', async (data, isBinary) => {
//     const msg = JSON.parse(data);
//     try {
//       const savedMessage = await chatController.saveMessage(msg);
//       debugger;
//       console.log("messageReceiver", savedMessage.messageReceiver);
//       const lastMessage = savedMessage.message[savedMessage.message.length - 1];
//       console.log('Last inserted message:', lastMessage);

//       const ObjectId = require('mongoose').Types.ObjectId;
//       const userDetail = await user.findById(new ObjectId(msg.sender));
//       const updatedData = {
//         ...msg,
//         userDetail: userDetail,
//         chat_created_at: lastMessage.createdAt || "",
//         message_id: lastMessage._id,
//         messageReceiver: savedMessage.messageReceiver || ""
//       };
//       const encodedData = new TextEncoder().encode(JSON.stringify(updatedData));

//       wss.clients.forEach(function each(client) {
//         if (client.readyState === WebSocket.OPEN && client.user === savedMessage.messageReceiver) {
//           client.send(encodedData, { binary: isBinary });
//         }
//       });
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