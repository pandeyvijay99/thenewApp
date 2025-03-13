

var admin = require("firebase-admin");
var inbox = require("../models/inbox");
var serviceAccount = require("../configs/thenameappstagging-firebase-adminsdk-3muld-4355e5f30d.json");
var GenericNotificationModel = require("../models/notification");
var userSchema = require("../models/auth");
const apn = require('apn');
const path = require("path");
const { v4: uuidv4 } = require('uuid');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function sendPushNotification(receiverUserId, fromUserID, type, contentID, avoidInbox) {

    try {
        const user = await userSchema.findById(receiverUserId);
        // console.log("user in ",user);
        let notify = user.userControlCenter;
        console.log("notify", notify.get('notifyStatus'))
        if (user == null || user.fcmToken == null) {
            console.log("empty data")
            return;
        }
        const fromUser = await userSchema.findById(fromUserID);
        if (fromUser == null) {
            return;
        }
        // Optionally, you can add data to the notification
        const options = {
            priority: "high",
            timeToLive: 60 * 60 * 24, // 1 day
        };
        // const message = {
        //     title: "TheName.app",
        //     body: fromUser.webName + " Rated your post",
        // }

        const message = getNotificationMessages(type, fromUser.webName);

        const genericNotificationModel = new GenericNotificationModel(
            message.title,
            message.body,
            fromUserID,
            fromUser.webName,
            fromUser.profilePicture,
            contentID
        );

        if (avoidInbox == null || avoidInbox == false) {
            const filter = { to: receiverUserId, type: type };
            const update = {
                $push: { notifications: genericNotificationModel }
            };
            const optionsInsert = {
                new: true,
                upsert: true,
            };
            var updated = await inbox.findOneAndUpdate(filter, update, optionsInsert);
            // console.log(updated);

        }
        const payload = {
            token: user.fcmToken,
            notification: {
                title: message.title,
                body: message.body,
            },
        };
        // console.log("user details ",user.userControlCenter[].autoPlay)

        if (notify.get('notifyStatus') == false) {
            return
        }


        admin.messaging().send(payload)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.error('Error sending message:', error);
            });
    } catch (err) {
        console.log("error")
        console.log(err)
    }
}
// async function sendPushNotification(receiverUserId, fromUserID, type, contentID, avoidInbox) {
//     try {
//         const receiver = await userSchema.findById(receiverUserId);
//         if (!receiver || !receiver.fcmToken) {
//             console.log("Receiver not found or missing FCM token.");
//             return;
//         }

//         const notify = receiver.userControlCenter?.get('notifyStatus');
//         if (notify === false) {
//             console.log("User has disabled notifications.");
//             return;
//         }

//         const sender = await userSchema.findById(fromUserID);
//         if (!sender) return;

//         const message = getNotificationMessages(type, sender.webName);

//         if (!avoidInbox) {
//             await inbox.findOneAndUpdate(
//                 { to: receiverUserId, type },
//                 { $push: { notifications: new GenericNotificationModel(message.title, message.body, fromUserID, sender.webName, sender.profilePicture, contentID) } },
//                 { new: true, upsert: true }
//             );
//         }

//         const payload = {
//             token: receiver.fcmToken,
//             notification: { title: message.title, body: message.body },
//         };

//         await admin.messaging().send(payload);
//         console.log("Push notification sent successfully.");
//     } catch (err) {
//         console.error("Error sending push notification:", err);
//     }
// }


const sendCallNotification = async (req, res) => {
    try {
        const user = await userSchema.findById(req.body.fromUserId);
        if (user == null) {
            console.log("empty data")
            return;
        }
        const toUserID = await userSchema.findById(req.body.toUserId);
        if (toUserID == null) {
            return;
        }
        const callUUID = uuidv4();
        console.log("Generated UUID:", callUUID);
        if (toUserID.device.get('deviceType') == "Android") {
            const payload = {
                token: toUserID.fcmToken,
                data: {
                    type: req.body.type,
                    callerId: callUUID,//"550e8400-e29b-41d4-a716-" + req.body.toUserId,
                    callerName: user.webName,
                    channelName: req.body.channelName,
                    fromUserId: req.body.fromUserId,
                    chatId: req.body.chatId
                },
                android: {
                    priority: "high",
                    ttl: 0 // Ensures immediate delivery
                },
                apns: {
                    headers: {
                        "apns-priority": "10"
                    },
                    payload: {
                        aps: {
                            contentAvailable: true
                        }
                    }
                }
            };

            admin.messaging().send(payload)
                .then((response) => {
                    console.log('Successfully sent message:', response);
                    res.send('sent');
                })
                .catch((error) => {

                    console.error('Error sending message:', error);
                    res.send('failed');
                });

        } else if (toUserID.device.get('deviceType') == "iOS") {
            console.log(path.join(__dirname, "..", "..", '.well-known/appnamekey.p8'));
            const options = {
                token: {
                    key: path.join(__dirname, "..", "..", '.well-known/appnamekey.p8'), // Correct path
                    keyId: "K6CB3QZH5Y",
                    teamId: "459M82T6PN",
                },
                production: true,//req.body.production, // Set to true for production
            };

            const apnProvider = new apn.Provider(options);

            // ✅ Use the VoIP Token from iOS logs
            const deviceToken = toUserID.voipToken; //req.body.token;

            const notification = new apn.Notification({
                alert: {
                    title: "Incoming Call",
                    body: `${user.webName} calling you`,
                },
                sound: "default",
                topic: "thename.app.stagging.voip", // Ensure this is your VoIP bundle ID
                payload: {
                    "aps": {
                        "alert": "Incoming call",
                        "content-available": 1,  // Critical for VoIP background wakeup
                        "sound": "default"
                    },
                    callerId: callUUID,//"550e8400-e29b-41d4-a716-446655440012",
                    callerName: user.webName,
                    channelName: req.body.channelName,
                    isVideo: req.body.type == "video_call" ? true : false,
                    "incomingCall": true,
                    fromUserId: req.body.fromUserId,
                    chatId: req.body.chatId
                },
                priority: 10,
                pushType: "voip",
                "content-available": 1
            });

            apnProvider.send(notification, deviceToken).then((result) => {
                console.log(result);
                if (result.failed.length > 0) {
                    console.error("Failed to send notification:", result.failed);
                    res.send('failed');
                } else {
                    console.log("Notification sent successfully:", result.sent);
                    res.send('sent');
                }
            });
        } else {
            res.send('failed some other device');
        }
    } catch (err) {
        console.log("error")
        console.log(err)
        res.send('failed');
    }
};


function getNotificationMessages(type, webName) {
    var title = "TheName.app"
    var message = "Got a new notification"

    if (type == "videoRating") {
        title = "TheName.app"
        message = webName + " Rated your post";
    }
    else if (type == "videoComment") {
        title = "TheName.app"
        message = webName + " commented on your video";
    }
    else if (type == "videoReaction") {
        title = "TheName.app"
        message = webName + " reacted on your video";
    }
    else if (type == "blipReaction") {
        title = "TheName.app"
        message = webName + " reacted on your blip";
    }
    else if (type == "blipRating") {
        title = "TheName.app"
        message = webName + " rated your blip";
    }
    else if (type == "blipComment") {
        title = "TheName.app"
        message = webName + " commented on your blip";
    }
    else if (type == "receivedBlessing") {
        title = "TheName.app"
        message = webName + " gave you blessings";
    }
    else if (type == "NewMessage") {
        title = webName
        message = webName + " sent you message";
    }

    return {
        title: title,
        body: message
    }
}

module.exports = { sendPushNotification, sendCallNotification };