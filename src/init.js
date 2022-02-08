/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-04 20:58:39
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-08 23:00:10
 * @FilePath: \\src\\init.js
 * @Description: 脚本初始化
 */
import { SHORT_WAIT_MS } from "./global";

import { Logger } from "./modules/logger/logger";

import { Wechat } from "./modules/wechat/wechat_operation";

import { ChatManager } from "./modules/chat/chat";

const { SHOW_CONSOLE } = hamibot.env;

const { WECHAT_LANGUAGE } = hamibot.env;

export const wechat = new Wechat(WECHAT_LANGUAGE != null ? WECHAT_LANGUAGE : "CN");

export const chat_manager = new ChatManager();

export function init() {
    let logger = new Logger("init");

    logger.info('Launching...');
    events.on("exit", () => { console.info(logger.pattern("INFO", "Exit...")); });

    // check accessibility permission
    if (auto.service === null) {
        alert('Please enable accessibility permissions and restart Hamibot');
        auto();
    } else {
        logger.verbose("Access permissions enabled");
    }

    // check is service alive
    if (device.height === 0 || device.width === 0) {
        alert(
            'Failed to get the screen size. ' +
            'Please try restarting the service or re-installing Hamibot'
        );
        exit();
    } else {
        logger.verbose("Screen size: " + device.height + "x" + device.width);
    }

    // show console
    if (SHOW_CONSOLE != null ? SHOW_CONSOLE : false) {
        console.show();
        sleep(SHORT_WAIT_MS);
        console.setPosition(0, 100);
        console.setSize(device.width, device.height / 4);
    }

    setScreenMetrics(1080, 2400);
}
