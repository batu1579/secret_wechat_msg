/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-04 15:50:18
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-09 03:33:49
 * @FilePath: \\src\\modules\\wechat\\wechat_operation.js
 * @Description: 微信操作接口
 */
import {
    TIMEOUT_MS,
    SHORT_WAIT_MS,
    EX_SHORT_WAIT_MS
} from '../../global';

import { Logger } from '../logger/logger';

import { getMark } from './mark';

import {
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

        this.wechat_events = events.emitter();

        this.add_wechat_detector();

        this.register_listener("quit_wechat", () => {
            this.logger.info("quit wechat");
            this.is_in_wechat = false;
            clearInterval(this.page_detector);
            this.is_on_chat_page = false;
        })

        this.register_listener("back_to_wechat", () => {
            this.logger.info("back to wechat");
            this.is_in_wechat = true;
            this.getSelfUsername(false);
            this.add_page_detector();
        })

        this.register_listener("enter_chat_page", () => {
            this.is_on_chat_page = true;
            this.logger.info("enter chat page");
        })

        this.register_listener("leave_chat_page", () => {
            this.is_on_chat_page = false;
            this.logger.info("leave chat page");
        })

        this.logger.verbose(`loading marks for language: ${language_code}`);
        this.mark = getMark(language_code);
    }

    /**
     * @description: add a listener to detected whether wechat is showing
     */
    add_wechat_detector() {
        let current_pkg = "";
        let last_pkg = "";
        setInterval(() => {
            current_pkg = selector().findOne().packageName();
            if (current_pkg != "com.tencent.mm" && last_pkg == "com.tencent.mm") {
                this.wechat_events.emit("quit_wechat");
            } else if (current_pkg == "com.tencent.mm" && last_pkg != "com.tencent.mm") {
                this.wechat_events.emit("back_to_wechat");
            }
            last_pkg = current_pkg;
        }, EX_SHORT_WAIT_MS);
    }

    /**
     * @description: add a listener to detected whether wechat is in chat page
     */
    add_page_detector() {
        let current_state = false;
        this.page_detector = setInterval(() => {
            current_state = className("ImageButton")
                .desc(this.mark.desc_to_voice_button)
                .exists();
            if (current_state && !this.is_on_chat_page) {
                this.wechat_events.emit("enter_chat_page");
            } else if (!current_state && this.is_on_chat_page) {
                this.wechat_events.emit("leave_chat_page");
            }
            this.is_on_chat_page = current_state;
        }, EX_SHORT_WAIT_MS);
    }

    /**
     * @param {*} event_name event name that you want to handle
     * @param {*} handler function to handle the event
     * @description: register event handler
     */
    register_listener(event_name, handler) {
        this.wechat_events.on(event_name, handler);
    }

    /**
     * @return {boolean} true if wechat is displayed
     * @description: check whether wechat is displayed
     */
    isInWechat() {
        return this.is_in_wechat;
    }

    /**
     * @description: Check whether wechat is displayed, if not, throw an exception
     */
    checkIsInWechat() {
        if (!this.isInWechat()) throw new NotInWechatApp();
    }

    /**
     * @return {boolean} true if is on chat page
     * @description: check does wechat on chat page
     */
    isOnChatPage() {
        return this.is_on_chat_page;
    }

    /**
     * @description: check does wechat is on chat page, if not, throw an exception
     */
    checkIsOnChatPage() {
        if (!this.isOnChatPage()) throw new NotOnChatPage();
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
            .findOne(TIMEOUT_MS)
        if (search_widget == null) {
            throw new WidgetNotFound("search button");
        }
        search_widget.click();
        sleep(SHORT_WAIT_MS);
        setText(0, username);
        sleep(SHORT_WAIT_MS);
        this.logger.verbose(`open chat page with ${username}`);
        return className("ListView")
            .findOne(TIMEOUT_MS)
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
            .findOne(TIMEOUT_MS)
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
            if (!(() => {
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
        img.recycle();

        let match = /^(.+)[\(|（](\d*)[\)|）]$/.exec(result);
        result = {
            chat_name: match !== null ? match[1] : result,
            chat_user_number: match !== null ? Number(match[2]) : 1
        };
        this.logger.verbose(`OCR result: ${JSON.stringify(result)}`);
        return result;
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
            .filter(i => i.text() != "")
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
    getSelfUsername(strict_mode = true) {
        try {
            this.checkIsInWechat();
            if (typeof this.self_username === "undefined") {
                if (this.isOnChatPage()) {
                    let chat_name = this.getChatPageTitleByOCR().chat_name;
                    sleep(SHORT_WAIT_MS);
                    this.returnToHomePage();
                    sleep(SHORT_WAIT_MS);
                    if (text(this.mark.text_cancel_button).exists()) {
                        text(this.mark.text_cancel_button).click();
                    }
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
     * @param {boolean} with_self_messages get message list including self messages. default is false
     * @return {UiCollection} collection of each message object
     * @description: get the list of currently visible chats
     */
    getMessageList(with_self_messages = false) {
        this.checkIsOnChatPage();
        if (!with_self_messages) {
            this.getSelfUsername();
        }
        this.logger.verbose("get message list");

        sleep(SHORT_WAIT_MS);

        return className("RelativeLayout").filter(i => {
            let selector = i.findOne(
                className("ImageView").filter(i => {
                    let reg_pattern = new RegExp(`^(.+)${this.mark.desc_avatar_suffix}$`);
                    let result = reg_pattern.exec(i.contentDescription);
                    if (with_self_messages) {
                        return result !== null;
                    } else {
                        return result != null && result[1] != this.self_username;
                    }
                })
            );
            return selector !== null && i.parent().className().includes("ListView");
        }).find();
    }

    /**
     * @param {UiOobject} message_object selector object for a single message
     * @return {Array} message information {username: string, message: string}
     * @description: get the sender's username and message text by message selector object
     */
    getMessageInfoByUIObject(message_object) {
        let selector = message_object.children().slice(-1)[0];

        if (selector.childCount() == 1) selector = selector.child(0);

        // get message sender
        let avatar_selector = selector.findOne(className("RelativeLayout")).findOne(className("ImageView"));
        let reg_pattern = new RegExp(`^(.+)${this.mark.desc_avatar_suffix}$`);
        let sender = reg_pattern.exec(avatar_selector.contentDescription)[1];

        // get message text
        let text_selectors = selector.find(className("TextView").filter(i => {
            let o_bound = avatar_selector.bounds();
            let i_bound = i.bounds();
            return i_bound.bottom - i_bound.top > (o_bound.bottom - o_bound.top) / 2;
        }));
        text = text_selectors.nonEmpty() ? text_selectors[0].text() : "[other message type]";

        return {
            username: sender,
            message: text
        };
    }

    /**
     * @return {Array} message information {username: string, message: string}
     * @description: get latest message information form other side of chat
     */
    getRecentOtherMessageInfo() {
        let messages = this.getMessageList();
        return messages.nonEmpty() ? this.getMessageInfoByUIObject(messages.slice(-1)[0]) : "";
    }

    /**
     * @return {string} the text in the input box
     * @description: get the text in input box for encryption
     */
    getUserInput() {
        this.checkIsOnChatPage();
        return className("EditText")
            .editable()
            .findOne(TIMEOUT_MS)
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
            .findOne(TIMEOUT_MS)
            .click();
    }
}
