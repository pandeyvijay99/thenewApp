const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const getAgoraDetails = async (req, res) => {
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
        console.log(req.body)

        const chatID = req.body.chatID;

        if (chatID == null) {
            return res.status(StatusCodes.OK).json({
                statusCode: "1",
                message: "missing chatID",
                data: null
            });
        }

        //
        const appID = process.env.AGORA_APPID;
        const appCertificate = process.env.AGORA_APPCERTIFICATE;
        const channelName = chatID
        const uid = user_id; // Replace with the user ID
        const role = RtcRole.PUBLISHER; // Set role to either PUBLISHER or SUBSCRIBER
        const expireTimeInSeconds = parseInt(process.env.AGORA_EXPIRE_TIME); // 1 hour (in seconds)
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpireTime = currentTimestamp + expireTimeInSeconds;

        //...

        //
        // Generate the token
        const token = RtcTokenBuilder.buildTokenWithUid(
            appID,
            appCertificate,
            channelName,
            uid,
            role,
            privilegeExpireTime
        );
        //...

        if (token != null) {
            const data = { channelName: chatID, token: token }
            return res.status(StatusCodes.OK).json({
                statusCode: "0",
                message: "generated successfully",
                data: data
            });
        } else {
            const data = { channelName: chatID, token: token }
            return res.status(StatusCodes.OK).json({
                statusCode: "1",
                message: "failed to generated token",
                data: null
            });
        }


    } catch (error) {
        console.log("catch ", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            statusCode: "1",
            message: error.message,
            data: null
        });
    }
};


module.exports = { getAgoraDetails };