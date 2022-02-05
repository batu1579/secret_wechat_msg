/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-04 20:58:39
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-05 15:22:47
 * @FilePath: \\src\\init.js
 * @Description: 脚本初始化
 */
import { SHORT_WAIT_MS } from "./global";

import { Logger } from "./modules/logger/logger";

const { SHOW_CONSOLE } = hamibot.env;

export function init() {
    logger = new Logger("init");

    console.info('Launching...');
    events.on("exit", () => { console.info("Exit..."); });

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
    if (SHOW_CONSOLE) {
        console.show();
        sleep(SHORT_WAIT_MS);
        console.setPosition(0, 100);
        console.setSize(device.width, device.height / 4);
    }

    setScreenMetrics(1080, 2400);
}
