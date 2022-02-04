/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-04 15:50:18
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-04 22:00:58
 * @FilePath: \\src\\modules\\wechat\\wechat_operation.js
 * @Description: 微信操作接口
 */
import {
    TIME_OUT_MS,
    SHORT_WAIT_MS
} from '../../global';

import {
    LanguageNotSupported,
    NotInWechatApp,
    NotOnChatPage,
    NotOnHomePage
} from './wechat_operation_exeption';

import {
    PermissionObtainingFailure,
    WidgetNotFound
} from '../global_exception';

export class Wechat {
    constructor(language_code) {
        switch (language_code) {
            case "CN":
                this.mark = {
                    desc_to_voice_button: "切换到按住说话",
                    desc_chat_info_button: "聊天信息",
                    reg_chat_info_page_title: "^[^聊天信息]+$",
                    text_send_message_button: "发送",
                    desc_search_button: "搜索"
                }
                break;
            default:
                throw new LanguageNotSupported(language_code);
        }
    }

    /**
     * @return {boolean} true if wechat is displayed
     * @description: check whether wechat is displayed
     */
    isInWechat() {
        return currentPackage() === "com.tencent.mm";
    }

    /**
     * @description: Check whether wechat is displayed, if not, throw an exception
     */
    checkIsInWechat() {
        if (!this.isInWechat()) {
            throw new NotInWechatApp();
        }
    }

    /**
     * @return {boolean} true if is on chat page
     * @description: check does wechat on chat page
     */
    isOnChatPage() {
        if (this.isInWechat()) {
            return className("ImageButton")
                .desc(this.mark.desc_to_voice_button)
                .exists();
        } else {
            return false;
        }
    }

    /**
     * @description: check does wechat is on chat page, if not, throw an exception
     */
    checkIsOnChatPage() {
        if (!this.isOnChatPage()) {
            throw new NotOnChatPage();
        }
    }

    /**
     * @return {boolean} true if is on home page
     * @description: check does wechat on home page
     */
    isOnHomePage() {
        if (this.isInWechat()) {
            return boundsContains(10, device.height - 10, device.width - 10, device.height)
                .className("LinearLayout")
                .filter(function (i) {
                    return i.childCount() == 4;
                })
                .exists();
        } else {
            return false;
        }
    }

    /**
     * @description: check does wechat is on home page, if not, throw an exception
     */
    checkIsOnHomePage() {
        if (!this.isOnHomePage()) {
            throw new NotOnHomePage();
        }
    }

    /**
     * @return {boolean} true if return successfully
     * @description: Return to the main page from the chat page
     */
    returnToHomePage() {
        this.checkIsOnChatPage();
        return className("LinearLayout")
            .clickable()
            .find()[1]
            .click();
    }

    /**
     * @param {string} username
     * @return {boolean} true if open chat page successfully
     * @description: 
     */
    openChatPageBySearch(username) {
        this.checkIsOnHomePage();
        let search_widget = desc(this.mark.desc_search_button)
            .findOne(TIME_OUT_MS)
        if (search_widget == null) {
            throw new WidgetNotFound("search button");
        }
        search_widget.click();
        sleep(SHORT_WAIT_MS);
        setText(0, username);
        sleep(SHORT_WAIT_MS);
        return className("ListView")
            .findOne(TIME_OUT_MS)
            .child(2)
            .click();
    }

    /**
     * @param {Number} position_x The x-coordinate of the center point
     * @param {Number} offset pixels offset from the center point
     * @return {boolean} true if press successfully
     * @description: find the navigation bar button by x-coordinate
     */
    pressNavigationButton(position_x, offset = 20) {
        this.checkIsOnHomePage();
        return boundsContains(
            position_x - offset,
            device.height - 10,
            position_x + offset,
            device.height)
            .className("RelativeLayout")
            .clickable()
            .findOne(TIME_OUT_MS)
            .click();
    }

    /**
     * @return {boolean} true if press successfully
     * @description: turn to chat list page
     */
    openChatListPage() {
        return this.pressNavigationButton(40);
    }

    /**
     * @return {boolean} true if press successfully
     * @description: turn to address list page
     */
    openAddressListPage() {
        return this.pressNavigationButton((device.width / 2) - 40);
    }

    /**
     * @return {boolean} true if press successfully
     * @description: turn to discover page
     */
    openDiscoverPage() {
        return this.pressNavigationButton((device.width / 2) + 40);
    }

    /**
     * @return {boolean} true if press successfully
     * @description: turn to personal information page
     */
    openPersonalInformationPage() {
        return this.pressNavigationButton(device.width - 40);
    }

    /**
     * @return {string} original chat page title
     * @description: get chat page title by ocr
     */
    getChatPageTitleByOCR() {
        this.checkIsOnChatPage();
        let img;
        try {
            img = captureScreen();
        } catch (err) {
            if (!(() => {
                launch("com.hamibot.hamibot");
                sleep(SHORT_WAIT_MS);
                let results = requestScreenCapture();
                sleep(SHORT_WAIT_MS);
                launch("com.tencent.mm");
                return results;
            })()) {
                throw new PermissionObtainingFailure("Screenshots permission");
            } else {
                className("ImageButton")
                    .desc(this.mark.desc_to_voice_button)
                    .findOne();
                sleep(SHORT_WAIT_MS);
                img = captureScreen();
            }
        }
        img = images.clip(img, 0, 80, device.width, 200);
        let result = ocr.recognize(img).results[0].text;
        img.recycle();
        return result;
    }

    /**
     * @return {string} chat name
     * @description: get chat name by ocr
     */
    getChatUsernameByOCR() {
        let title = this.getChatPageTitleByOCR();
        let result = /^(.+)[\(|（](\d*)[\)|）]$/.exec(title);
        return result !== null ? result[1] : title;
    }

    /**
     * @return {Number} chat number
     * @description: get chat number by ocr
     */
    getChatNumberByOCR() {
        let title = this.getChatPageTitleByOCR();
        let result = /^(.+)[\(|（](\d*)[\)|）]$/.exec(title);
        return result !== null ? Number(result[2]) : 1;
    }

    /**
     * @return {string} other's username
     * @description: get username of whom you are talking to
     */
    getChatUsernameByChatInfoPage() {
        this.checkIsOnChatPage();
        desc(this.mark.desc_chat_info_button)
            .findOne(TIME_OUT_MS)
            .click();
        sleep(SHORT_WAIT_MS);
        let username = className("TextView")
            .textMatches(this.mark.reg_chat_info_page_title)
            .findOne(TIME_OUT_MS)
            .text();
        sleep(SHORT_WAIT_MS);
        className("Button")
            .findOne(TIME_OUT_MS)
            .click();
        return username;
    }

    /**
     * @return {string} self username
     * @description: get self username by personal information page
     */
    getSelfUsernameByhomePage() {
        this.checkIsOnHomePage();
        this.openPersonalInformationPage();
        sleep(SHORT_WAIT_MS);
        let username = className("android.view.View")
            .filter(function (i) {
                return i.text() != "";
            })
            .find()
            .slice(-1)[0]
            .text();
        sleep(SHORT_WAIT_MS);
        this.openChatListPage();
        return username;
    }

    /**
     * @return {string} self username
     * @description: get self username to attach when sending messages
     */
    getSelfUsername() {
        this.checkIsInWechat();
        let self_username = "";
        if (this.isOnChatPage()) {
            let username = this.getChatUsernameByOCR();
            sleep(SHORT_WAIT_MS);
            this.returnToHomePage();
            sleep(SHORT_WAIT_MS);
            self_username = this.getSelfUsernameByhomePage();
            sleep(SHORT_WAIT_MS);
            this.openChatPageBySearch(username);
        } else {
            self_username = this.getSelfUsernameByhomePage();
        }
        return self_username;
    }

    /**
     * @return {UiCollection} collection of each message object
     * @description: gets the list of currently visible chats
     */
    getMessageList() {
        this.checkIsOnChatPage();
        return className("ListView")
            .findOne(TIME_OUT_MS)
            .children()
    }

    /**
     * @param {UiOobject} message_object selector object for a single message
     * @return {string} sender's username
     * @description: get sender's username by message selector object
     */
     getMessageByUIObject(message_object) {
        let avatar_desc = message_object.children()
            .slice(-1)[0]
            .findOne(
                className("ImageView")
            )
            .contentDescription;
        let reg_pattern = new RegExp("^(.+)" + this.mark.desc_avatar_suffix + "$")
        let result = reg_pattern.exec(avatar_desc);
        return result[1];
    }

    /**
     * @param {UiOobject} message_object selector object for a single message
     * @return {string} message text
     * @description: get message text by message selector object
     */
    getMessageUsernameByUIObject(message_object) {
        return message_object.children()
            .slice(-1)[0]
            .find(
                className("TextView")
            )
            .slice(-1)[0]
            .text();
    }    

    /**
     * @return {string} raw message
     * @description: get latest raw message form other side of chat
     */
     getRecentMessage() {
        let messages = this.getMessageList();
        return this.getMessageByUIObject(messages.slice(-1)[0])
    }

    /**
     * @return {string} Sender username
     * @description: gets the sender username of the most recent message
     */
    getUsernameOfRecentMessage() {
        let messages = this.getMessageList();
        return this.getMessageUsernameByUIObject(messages.slice(-1)[0])
    }

    /**
     * @return {string} the text in the input box
     * @description: get the text in input box for encryption
     */
    getUserInput() {
        this.checkIsOnChatPage();
        return className("EditText")
            .editable()
            .findOne(TIME_OUT_MS)
            .text();
    }

    /**
     * @param {string} message text to send
     * @return {boolean} true if replace text successfully
     * @description: replace text in input box
     */
    replaceUserInput(message) {
        this.checkIsOnChatPage();
        return setText(0, message);
    }

    /**
     * @param {string} message text to append
     * @return {boolean} true if append text successfully
     * @description: append text in input box
     */
    appendUserInput(message) {
        this.checkIsOnChatPage();
        return input(0, message);
    }

    /**
     * @return {boolean} true if press button successfully
     * @description: press send button
     */
    sendMessage() {
        this.checkIsOnChatPage();
        return className("Button")
            .text(this.mark.text_send_message_button)
            .findOne(TIME_OUT_MS)
            .click();
    }
}
