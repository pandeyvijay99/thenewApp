class UserControlCenterModel {
    constructor(notifyStatus = false, muteAudio = false, autoPlay = false, userStatus = false) {
        this.notifyStatus = notifyStatus;
        this.muteAudio = muteAudio;
        this.autoPlay = autoPlay;
        this.userStatus = userStatus;
    }

    // Convert the instance to a plain object
    toObject() {
        return {
            notifyStatus: this.notifyStatus,
            muteAudio: this.muteAudio,
            autoPlay: this.autoPlay,
            userStatus: this.userStatus
        };
    }
}

module.exports = UserControlCenterModel;
