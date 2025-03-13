class GenericNotificationModel {
    /**
     * Create a generic response.
     * @param {string} title - Indicates if the request was successful.
     * @param {string} body - Indicates if an error should be shown.
     * @param {string} from - Indicates if the request was successful.
     * @param {string} fromWebName - Indicates if the request was successful.
     * @param {string} fromProfilePic - Indicates if the request was successful.
     * @param {string} contentID - Indicates if the request was successful.
     */
    constructor(title, body, from, fromWebName, fromProfilePic, contentID) {
        /** @type {string} */
        this.title = title;
        /** @type {string} */
        this.body = body;
        /** @type {string} */
        this.from = from;
        /** @type {string} */
        this.fromWebName = fromWebName;
        /** @type {string} */
        this.fromProfilePic = fromProfilePic;
        /** @type {string} */
        this.contentID = contentID;

    }
}

module.exports = GenericNotificationModel;