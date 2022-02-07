/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-04 15:52:32
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-07 22:49:06
 * @FilePath: \\src\\modules\\wechat\\wechat_operation_exeption.js
 * @Description: 微信操作的异常类
 */
class BaseWechatOprationException extends Error {
    constructor(message) {
        super("[Wechat Exception] " + message);
        this.name = "BaseWechatOprationException";
    }
}

export class LanguageNotSupported extends BaseWechatOprationException {
    constructor(language_code) {
        super("Language " + language_code + " is not supported");
        this.name = "LanguageNotSupported";
    }
}

export class NotInWechatApp extends BaseWechatOprationException {
    constructor() {
        super("Wechat is not displayed");
        this.name = "NotInWechatApp";
    }
}

export class NotOnChatPage extends BaseWechatOprationException {
    constructor() {
        super("Wechat is not on the chat page");
        this.name = "NotOnChatPage";
    }
}

export class NotOnHomePage extends BaseWechatOprationException {
    constructor() {
        super("Wechat is not on the home page");
        this.name = "NotOnHomePage";
    }
}

export class CannotGetSelfUsername extends BaseWechatOprationException {
    constructor() {
        super("Failed to get self username");
        this.name = "CannotGetSelfUsername";
    }
}
