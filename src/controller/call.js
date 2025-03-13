const call = require("../models/call");
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
const getCall = async (req, res) => {
    try {
        let user_id = "";
        const limit = req.body.limit ? req.body.limit : 10;
        const offset = req.body.offset ? req.body.offset : 0;

        const authHeader = req.headers.authorization ? req.headers.authorization : null;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (!token) {
                return res.status(403).send({ statusCode: 1, message: "Access denied.", data: null });
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user_id = decoded._id;
        }

        const ObjectId = require('mongoose').Types.ObjectId;

        // Use aggregation to fetch call details along with receiver's details
        const result = await call.aggregate([
            {
                $match: { caller: new ObjectId(user_id) }
            },
            {
                $lookup: {
                    from: "users", // Collection name for the users
                    localField: "receiver", // Field in callSchema to match
                    foreignField: "_id", // Field in userSchema to match
                    as: "receiver_details"
                }
            },
            {
                $unwind: {
                    path: "$receiver_details",
                    preserveNullAndEmptyArrays: true // Include calls without receiver details
                }
            },
            {
                $project: {
                    _id: 1,
                    caller: 1,
                    receiver: 1,
                    calltype: 1,
                    chatId: 1,
                    startTime: 1,
                    endTime: 1,
                    isAttended: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    receiver_details: {
                        fullName: 1,
                        webName: 1,
                        profilePicture: 1,
                        mobileNumber: 1,
                        countryCode: 1
                    }
                }
            },
            { $skip: offset },
            { $limit: limit }
        ]);

        return res.status(StatusCodes.OK).json({
            statusCode: "0",
            message: "",
            data: result
        });
    } catch (error) {
        console.error("Error in getCall:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: 1,
            message: error.message,
            data: null
        });
    }
};

const pushCall = async (req, res) => {
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

        req.body.caller = user_id;
        const data = new call(req.body) ;
        const result = await data.save();
        
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


module.exports = { getCall, pushCall };