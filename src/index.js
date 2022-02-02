/*
 * @Author: BATU1579
 * @Date: 2022-01-31 22:52:46
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-03 04:16:17
 * @Description: 微信加密聊天脚本
 */

// constants defined

const VERSION = "0.1.0";

const TIME_OUT_MS = 1000;

const SHORT_WAIT_MS = 700;

const SHOW_CONSOLE = true;

// script initialization

console.info('Launching...');
events.on("exit", function() {
    console. info("Exit...");
});

// check accessibility permission
if (auto.service === null) {
    alert('Please enable accessibility permissions and restart Hamibot');
    auto();
}

// check is service alive
if (device.height === 0 || device.width === 0) {
    alert(
        'Failed to get the screen size. ' +
        'Please try restarting the service or re-installing Hamibot'
    );
    exit();
} else {
    console.log('screen size : ' + device.width + ' x ' + device.height);
}

// show console
if (SHOW_CONSOLE) {
    console.show();
    sleep(SHORT_WAIT_MS);
    console.setPosition(0, 100);
    console.setSize(device.width, device.height / 4);
}
  
setScreenMetrics(1080, 2400);

// classes and functions

class BasePermissionException extends Error {
    constructor(message) {
        super("[Permission Exception] " + message);
        this.name = "BasePermissionException";
    }
}

class PermissionObtainingFailure extends BasePermissionException {
    constructor(permission) {
        super(permission + "obtaining failure");
        this.name = PermissionObtainingFailure;
    }
}

class BaseWidgetException extends Error {
    constructor(message) {
        super("[Widget Exception] " + message);
        this.name = 'BaseWidgetException';
    }
}

class WidgetNotFound extends BaseWidgetException {
    constructor(widget_name) {
        super(widget_name + ' widget not found');
        this.name = 'WidgetNotFound';
    }
}

class Wechat {
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
                .filter(function(i) {
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
            if (! (() => {
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
        let result =  /^(.+)[\(|（](\d*)[\)|）]$/.exec(title);
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
            .filter(function(i) {
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
     * @return {string} raw message
     * @description: get latest raw message form other side of chat
     */
    getRawMessage() {
        this.checkIsOnChatPage();
        return className("TextView")
            .find()
            .slice(-1)[0]
            .text();
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
     * @return {boolean} true if replace text successfully
     * @description: replace text in input box
     */
    replaceUserInput(encoded_message) {
        this.checkIsOnChatPage();
        return setText(0, encoded_message);
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

class BaseWechatOprationException extends Error {
    constructor(message) {
        super("[Wechat Exception] " + message);
        this.name = "BaseWechatOprationException";
    }
}

class LanguageNotSupported extends BaseWechatOprationException {
    constructor(language_code) {
        super("Language " + language_code + " is not supported");
        this.name = "LanguageNotSupported";
    }
}

class NotInWechatApp extends BaseWechatOprationException {
    constructor() {
        super("Wechat is not displayed");
        this.name = "NotInWechatApp";
    }
}

class NotOnChatPage extends BaseWechatOprationException {
    constructor() {
        super("Wechat is not on the chat page");
        this.name = "NotOnChatPage";
    }
}

class NotOnHomePage extends BaseWechatOprationException {
    constructor() {
        super("Wechat is not on the home page");
        this.name = "NotOnHomePage";
    }
}

// main loop

var wechat = new Wechat("CN");
var uname = wechat.getSelfUsername();
log(uname);
