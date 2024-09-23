
/**
 * 日志输出
 */
export default class Logger {
    static trace = true;
    /**
     * debug打印
     * @param args 
     * @returns 
     */
    public static debug(...args): void {
        if (!this.trace) {
            return;
        }
        console.log(...args);
    }

    public static info(...args) {
        if (!this.trace) {
            return;
        }
        console.info(...args);
    }

    public static warn(...args) {
        if (!this.trace) {
            return;
        }
        console.warn(...args);
    }

    public static error(...args) {
        if (!this.trace) {
            return;
        }
        console.error(...args);
    }

    public static log(...args) {
        return this.debug(...args);
    }
}

