/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-08 06:41:43
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-08 22:35:17
 * @FilePath: \\src\\modules\\wechat\\mark.js
 * @Description: 各种标记（用来适配其他语言的微信）
 */
import { LanguageNotSupported } from "./wechat_operation_exeption";

export function getMark(language_code) {
    switch (language_code) {
        case "CN":
            return {
                desc_to_voice_button: "切换到按住说话",
                desc_chat_info_button: "聊天信息",
                reg_chat_info_page_title: "^[^聊天信息]+$",
                text_send_message_button: "发送",
                desc_search_button: "搜索",
                desc_avatar_suffix: "头像",
                text_cancel_button: "取消"
            }
        default:
            throw new LanguageNotSupported(language_code);
    }
}
