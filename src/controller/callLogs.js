const callLogs = require("../models/callLogs");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");


// const getCall = async (req, res) => {
//     try {
//        let user_id = "";
//        limit = req.body.limit?req.body.limit:10;
//        offset = req.body.offset? req.body.offset:0;
//         const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
//         if (authHeader) {
//             const token = authHeader.split(' ')[1];
//             if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);
//             console.log("token", token);
//             user_id = decoded._id;
//             console.log("user_id  ", decoded._id);
//         }
//         const ObjectId = require('mongoose').Types.ObjectId
//          const result = await call.find({caller:new ObjectId(user_id)}).limit(limit).skip(offset);
       
//         return res.status(StatusCodes.OK).json({
//             statusCode: "0",
//             message: "",
//             data: result
//         });
//     } catch (error) {
//         console.log("catch ", error);
//         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//             statusCode: 1,
//             message: error.message,
//             data: null
//         });
//     }
// };
const getCallLogs = async (req, res) => {
    try {
        let user_id = "";
        const limit = req.body.limit ? parseInt(req.body.limit) : 10;
        const offset = req.body.offset ? parseInt(req.body.offset) : 0;

        const authHeader = req.headers.authorization ? req.headers.authorization : null;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user_id = decoded._id;
        }

        if (!user_id) {
            return res.status(401).json({ statusCode: 1, message: "Unauthorized", data: null });
        }

        const ObjectId = require('mongoose').Types.ObjectId;

        // Use aggregation to fetch call details along with receiver's details
        const result = await callLogs.aggregate([
            {
                $match: {
                    $or: [
                        { callerId: new ObjectId(user_id) },
                        { receiverId: new ObjectId(user_id) }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "receiverId",
                    foreignField: "_id",
                    as: "receiverDetails"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "callerId",
                    foreignField: "_id",
                    as: "callerDetails"
                }
            },
            {
                $unwind: { path: "$receiverDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $unwind: { path: "$callerDetails", preserveNullAndEmptyArrays: true }
            },
            {
                $sort: { createdAt: -1 } // Sort by latest calls first
            },
            {
                $skip: offset * limit
            },
            {
                $limit: limit
            },
            {
                $project: {
                    _id: 1,
                    callerId: 1,
                    receiverId: 1,
                    callDuration: 1,
                    receiverStatus: 1,
                    callerStatus: 1,
                    callType: 1,
                    chatId: 1,
                    callStartTime: 1,
                    callEndTime: 1,
                    createdAt: 1,
                    receiverDetails: {
                        _id: 1,
                        fullName: 1,
                        webName: 1,
                        profilePicture: 1
                    },
                    callerDetails: {
                        _id: 1,
                        fullName: 1,
                        webName: 1,
                        profilePicture: 1
                    }
                }
            }
        ]);

        return res.status(200).json({
            statusCode: 0,
            message: "Call logs fetched successfully",
            data: result
        });
    } catch (error) {
        console.error("Error in getCallLogs:", error);
        return res.status(500).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};


const insertCallLog = async (req, res) => {
    try {
       
        const authHeader = (req.headers.authorization) ? req.headers.authorization : null;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log("token", token);
            user_id = decoded._id;
            console.log("user_id  ", decoded._id);
        }

        const callData = new callLogs(req.body) ;
        const result = await callData.save();
        
        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "uploaded successfully",
            data: result
        });
    } catch (error) {
        console.log("catch ", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};


module.exports = { insertCallLog, getCallLogs };