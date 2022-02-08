/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-05 15:28:37
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-08 23:32:20
 * @FilePath: \\src\\modules\\chat\\chat.js
 * @Description: 聊天管理
 */

import { wechat } from "../../init";

import { Logger } from "../logger/logger";

export class ChatManager {
    constructor() {
        this.logger = new Logger("chat_manager");

        wechat.register_listener("enter_chat_page", () => {

            let { chat_name, chat_user_number } = wechat.getChatPageTitleByOCR();
            let chat_obj = new Chat(chat_name, chat_user_number);

            if (typeof this.chat_list == "undefined") {
                this.chat_list = [chat_obj];
            } else if (this.chat_list.every(i => {return i.chat_name !== chat_name})) {
                this.logger.verbose("add new chat obj to chat list");
                this.chat_list.push(chat_obj);
            } else {
                this.chat_list.forEach(i => {
                    if (i.chat_name === chat_name) {
                        i.update_chat();
                    }
                })
            }

            this.logger.verbose(`chat in list number: ${this.chat_list.length}`);
            return chat_obj;
        });
    }
}

export class Chat {
    constructor(chat_name, chat_user_number) {
        this.logger = new Logger(`Chat: ${chat_name}`);
        this.chat_name = chat_name;
        this.chat_user_number = chat_user_number;
        this.update_chat();
    }
    
    update_chat() {
        this.current_msg = wechat.getRecentOtherMessageInfo();
        this.logger.verbose(`update current message: ${JSON.stringify(this.current_msg)}`)
    }
}
