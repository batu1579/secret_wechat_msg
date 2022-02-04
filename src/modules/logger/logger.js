/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-05 04:00:16
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-05 04:14:01
 * @FilePath: \\src\\modules\\logger\\logger.js
 * @Description: 简单包装一下 console
 */

export class Logger {
    constructor (modules_name) {
        this.modules_name = modules_name;
    }

    patten (level, message) {
        return "[" + level + "] <" + this.modules_name + "> : " + message;
    }

    verbose (message) {
        console.verbose(
            this.patten("VERBOSE", message)
        );
    }

    info (message) {
        console.info(
            this.patten("INFO", message)
        );
    }

    warn (message) {
        console.warn(
            this.patten("WARN", message)
        );
    }

    error (message) {
        console.error(
            this.patten("ERROR", message)
        );
    }
}
