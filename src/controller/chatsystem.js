const Message = require('../models/chatsystem');
const { StatusCodes } = require("http-status-codes");
exports.saveMessage = async (req,res) => {

   debugger
  //  console.log("request",req.body)
  //  const authHeader = (req.headers.authorization)?req.headers.authorization:null;
  //       if(authHeader){
  //           const token =  authHeader.split(' ')[1];
  //           if (!token) return res.status(403).send({statusCode:1,message:"Access denied.",data:null}); 
  //               const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //               console.log("token" , token);
  //               user_id = decoded._id;
  //               console.log("blipdecoded ",decoded._id);
  //       }
  const newMessage = new Message({
    username: req.username,
    message: req.message,
  });
  console.log("newMessage",newMessage);
  try {
    const savedMessage = await newMessage.save();
    return savedMessage;
  } catch (err) {
    console.error('Error saving message:', err);
    throw err;
  }
};

exports.getRecentMessages = async () => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50).exec();
    return messages.reverse(); // Return messages in chronological order
  } catch (err) {
    console.error('Error retrieving messages:', err);
    throw err;
  }
};