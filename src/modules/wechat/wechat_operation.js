/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-04 15:50:18
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-08 06:12:29
 * @FilePath: \\src\\modules\\wechat\\wechat_operation.js
 * @Description: 微信操作接口
 */
import {
    TIME_OUT_MS,
    SHORT_WAIT_MS,
    EX_SHORT_WAIT_MS
} from '../../global';

import {
    Logger
} from '../logger/logger'

import {
    LanguageNotSupported,
    NotInWechatApp,
    NotOnChatPage,
    NotOnHomePage,
    CannotGetSelfUsername
} from './wechat_operation_exeption';

import {
    PermissionObtainingFailure,
    WidgetNotFound
} from '../../global_exception';

export class Wechat {
    constructor(language_code) {

        this.logger = new Logger("Wechat");

        this.getSelfUsername(false);

        switch (language_code) {
            case "CN":
                this.mark = {
                    desc_to_voice_button: "切换到按住说话",
                    desc_chat_info_button: "聊天信息",
                    reg_chat_info_page_title: "^[^聊天信息]+$",
                    text_send_message_button: "发送",
                    desc_search_button: "搜索",
                    desc_avatar_suffix: "头像"
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
        this.logger.verbose("return to home page");
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
        this.logger.verbose(`open chat page with ${username}`);
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
        this.logger.verbose("open chat list page");
        return this.pressNavigationButton(40);
    }

    /**
     * @return {boolean} true if press successfully
     * @description: turn to address list page
     */
    openAddressListPage() {
        this.logger.verbose("open address list page");
        return this.pressNavigationButton((device.width / 2) - 40);
    }

    /**
     * @return {boolean} true if press successfully
     * @description: turn to discover page
     */
    openDiscoverPage() {
        this.logger.verbose("open discover page");
        return this.pressNavigationButton((device.width / 2) + 40);
    }

    /**
     * @return {boolean} true if press successfully
     * @description: turn to personal information page
     */
    openPersonalInformationPage() {
        this.logger.verbose("open personal information page");
        return this.pressNavigationButton(device.width - 40);
    }

    /**
     * @return {Array} matched data {chat_name: "xx", chat_number: xx}
     * @description: get chat page title and number of chat users by ocr
     */
    getChatPageTitleByOCR() {
        this.checkIsOnChatPage();
        let img;
        try {
            img = captureScreen();
        } catch (err) {
            this.logger.warn("no screenshot permission");
            if (!(function () {
                launch("com.hamibot.hamibot");
                sleep(SHORT_WAIT_MS);

                this.logger.verbose("try to obtain screenshot permission");
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
        this.logger.verbose("image captured successfully");
        img = images.clip(img, 0, 80, device.width, 200);
        let result = ocr.recognize(img).results[0].text;
        this.logger.verbose(`OCR result: ${result}`);
        img.recycle();

        match = /^(.+)[\(|（](\d*)[\)|）]$/.exec(result);

        return {
            chat_name: match !== null ? match[1] : result,
            chat_user_number: match !== null ? Number(match[2]) : 1
        };
    }

    /**
     * @return {string} other's username
     * @description: get username of whom you are talking to
     */
    getChatUsernameByChatInfoPage() {
        // TODO: Change this function to get a list of chat members instead
        this.checkIsOnChatPage();
        desc(this.mark.desc_chat_info_button)
            .findOne(TIME_OUT_MS)
            .click();
        sleep(SHORT_WAIT_MS);
        let username = className("TextView")
            .textMatches(this.mark.reg_chat_info_page_title)
            .findOne(TIME_OUT_MS)
            .text();
        this.verbose(`Get chat username: ${username}`);
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
        // TODO: Return to the original page
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
        this.logger.verbose(`Self username: ${username}`);
        sleep(SHORT_WAIT_MS);
        this.openChatListPage();
        return username;
    }

    /**
     * @param {boolean} strict_mode whether throws exception on failure to get self username, default is true
     * @return {string} self username
     * @description: get self username to attach when sending messages
     */
    getSelfUsername(strict_mode = ture) {
        try {
            this.checkIsInWechat();
            if (this.self_username == "") {
                if (this.isOnChatPage()) {
                    let chat_name = this.getChatPageTitleByOCR().chat_name;
                    sleep(SHORT_WAIT_MS);
                    this.returnToHomePage();
                    sleep(SHORT_WAIT_MS);
                    this.self_username = this.getSelfUsernameByhomePage();
                    sleep(SHORT_WAIT_MS);
                    this.openChatPageBySearch(chat_name);
                } else {
                    this.self_username = this.getSelfUsernameByhomePage();
                }
            }
            return this.self_username;
        } catch (e) {
            if (strict_mode) {
                throw new CannotGetSelfUsername();
            } else {
                this.logger.warn("Failed to get self username");
                return "";
            }
        }
    }

    /**
     * @return {UiCollection} collection of each message object
     * @description: get the list of currently visible chats
     */
    getMessageList() {
        this.checkIsOnChatPage();
        this.logger.verbose("get message list");
        return className("ListView")
            .findOne(TIME_OUT_MS)
            .children()
    }

    /**
     * @return {UiCollection} collection of others messages object
     * @description: get the list of currently visible chats with out self messages
     */
    getOtherMessageList() {
        this.checkIsOnChatPage();
        this.getSelfUsername();
        this.logger.verbose("get other message list");

        return className("RelativeLayout").filter(function (i) {
            let result = i.findOne(
                className("ImageView").filter(function (i) {
                    let reg_pattern = new RegExp(`^(.+)${this.mark.desc_avatar_suffix}$`);
                    let result = reg_pattern.exec(i.contentDescription);
                    return result != null && result[1] != this.self_username;
                })
            );
            return result != null && i.parent().className().includes("ListView");
        }).find();
    }

    /**
     * @param {UiOobject} message_object selector object for a single message
     * @return {Array} message information {username: string, message: string}
     * @description: get the sender's username and message text by message selector object
     */
    getMessageInfoByUIObject(message_object) {
        let selector = message_object.children().slice(-1)[0];

        // get message sender
        let reg_pattern = new RegExp(`^(.+)${this.mark.desc_avatar_suffix}$`);
        let sender = reg_pattern.exec(
            selector.findOne(className("ImageView")).contentDescription
        );

        // get message text
        let text = selector.find(className("TextView"))
            .slice(-1)[0]
            .text;

        let result = {
            username: sender,
            message: text
        };
        logger.verbose(`Message info: ${result}`);
        return result;
    }

    /**
     * @return {Array} message information {username: string, message: string}
     * @description: get latest raw message form other side of chat
     */
    getRecentMessage() {
        let messages = this.getMessageList();
        return this.getMessageInfoByUIObject(messages.slice(-1)[0])
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
        this.logger.verbose('replace input box with: ${message}');
        return setText(0, message);
    }

    /**
     * @param {string} message text to append
     * @return {boolean} true if append text successfully
     * @description: append text in input box
     */
    appendUserInput(message) {
        this.checkIsOnChatPage();
        this.logger.verbose(`append input box with: ${message}`);
        return input(0, message);
    }

    /**
     * @return {boolean} true if press button successfully
     * @description: press send button
     */
    sendMessage() {
        this.checkIsOnChatPage();
        this.logger.verbose("send message");
        return className("Button")
            .text(this.mark.text_send_message_button)
            .findOne(TIME_OUT_MS)
            .click();
    }
}
