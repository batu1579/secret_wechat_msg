/*
 * @Author: BATU1579
 * @CreateDate: 2022-02-05 04:00:16
 * @LastEditor: BATU1579
 * @LastTime: 2022-02-05 05:46:03
 * @FilePath: \\src\\modules\\logger\\logger.js
 * @Description: 简单包装一下 console
 */

export class Logger {
    constructor (modules_name) {
        this.modules_name = modules_name;
    }

    pattern (level, message) {
        return "[" + level + "] <" + this.modules_name + "> : " + message;
    }

    verbose (message) {
        console.verbose(
            this.pattern("VERBOSE", message)
        );
    }

    info (message) {
        console.info(
            this.pattern("INFO", message)
        );
    }

    warn (message) {
        console.warn(
            this.pattern("WARN", message)
        );
    }

    error (message) {
        console.error(
            this.pattern("ERROR", message)
        );
    }
}
