const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    senderUserId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    senderWebName: {
        type: String,
    },
    type: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
    },
    blessings: {
        type: mongoose.Schema.Types.Decimal128,
        required: [true, "blessings seems to be missing"]
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "to userId seems to be missing"],
        index: true
    },
    userWebname: {
        type: String,
    },
    transactionAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("wallet", walletSchema);


// type enums
//time and attention
//1 watching blips
//2 watching videos
//3 audio call
//4 video call
//5 search
//6 Explore
//7 message sent
//8 photo seen
//21 thoughts
//22 notes
//23 articles
//24 music
//25 podcast

//Engagement and Activity
//9 enagging with reaction
//10 enagging with rating
//11 enagging with commenting
//26 enagging with sharing
//12 inviting user
//13 beliving users


// Creations
//14 creating blip
//15 creating video
//16 creating photo
//27 creating Thoughts
//28 creating notes
//29 creating article
//30 creating music
//31 creating podcast
//17 number of views on each content
//18 Number of Engagement for each Content type


//blessing
//19 sending blessings to the users
//20 deducted amount due to sending blessing to other user