import PlayerData from "../module/roleModule/PlayerData";

enum TimeUnit {
    S,//秒
    M,//分
    H,//时
    D//天
}

export class DateUtils {
    /**
     * 将时间戳转换为Date对象
     * @param timestamp 时间戳（毫秒）
     * @returns Date对象
     */
    private static toDate(timestamp: number): Date {
        return new Date(timestamp);
    }

    /**
     * 判断两个时间戳是否代表同一天（忽略时间）
     * @param timestamp1 第一个时间戳
     * @param timestamp2 第二个时间戳 默认为当前时间
     * @returns 如果是同一天返回true，否则返回false
     */
    static isSameDay(timestamp1: number, timestamp2: number = Date.now()): boolean {
        const date1 = this.toDate(timestamp1);
        const date2 = this.toDate(timestamp2);
        return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
    }

    /**
     * 判断两个时间戳是否代表同一月（忽略日期和时间）
     * @param timestamp1 第一个时间戳
     * @param timestamp2 第二个时间戳 默认为当前时间
     * @returns 如果是同一月返回true，否则返回false
     */
    static isSameMonth(timestamp1: number, timestamp2: number = Date.now()): boolean {
        const date1 = this.toDate(timestamp1);
        const date2 = this.toDate(timestamp2);
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth()
        );
    }

    /**
     * 判断两个时间戳是否代表同一年（忽略月份和日期）
     * @param timestamp1 第一个时间戳
     * @param timestamp2 第二个时间戳 默认为当前时间
     * @returns 如果是同一年返回true，否则返回false
     */
    static isSameYear(timestamp1: number, timestamp2: number = Date.now()): boolean {
        const date1 = this.toDate(timestamp1);
        const date2 = this.toDate(timestamp2);
        return date1.getFullYear() === date2.getFullYear();
    }

    /**
    * 计算从过去某个时间戳到现在经过的时间
    * @param timestamp 过去的时间戳（毫秒）
    * @returns 经过的时间对象，包含天、小时、分钟和秒
    */
    static timeElapsedSince(timestamp: number): { days: number; hours: number; minutes: number; seconds: number } {
        const now = Date.now(); // 获取当前时间的时间戳
        const elapsed = now - timestamp; // 经过的毫秒数

        const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
        const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    }

    /**
     * 获取当天秒数
     */
    static GetTodaySecond(timestamp?: number): number {
        const startOfDay = new Date();
        if (timestamp) {
            startOfDay.setTime(timestamp);
        } else {
            startOfDay.setHours(0, 0, 0);
        }
        return startOfDay.getHours() * 3600 + startOfDay.getMinutes() * 60 + startOfDay.getSeconds();
    }

    /**
     * 对单位为秒的时间生成格式化时间字符串
     * @param sec 时间s
     * @param format 格式化字符串
     * @example
     * // 当format为string时，会以format中的最大时间单位进行格式化
     * FormatTime(3601, "%{m}:%{s}"); // 60:1
     * FormatTime(3601, "%{mm}:%{ss}"); // 60:01
     * FormatTime(3601, "%{hh}:%{mm}:%{ss}"); // 01:00:01
     * 
     * // 当format为object时，会以传入的sec计算最大的时间单位，并选择format对应的字符串进行格式化
     * FormatTime(100, {
     *     S: "%{s}秒",
     *     M: "%{m}分%{s}秒",
     *     H: "%{h}时%{m}分%{s}秒",
     *     D: "%{d}天%{h}时%{m}分%{s}秒"
     * }); // 1分40秒
     * FormatTime(100000, {
     *     S: "%{s}秒",
     *     M: "%{m}分%{s}秒",
     *     H: "%{h}时%{m}分%{s}秒",
     *     D: "%{d}天%{h}时%{m}分%{s}秒"
     * }); // 1天3时46分40秒
    */
    static FormatTime(sec: number, format: string | { "S": string; "M": string; "H": string; "D": string } = "%{hh}:%{mm}:%{ss}"): string {
        let seconds: number = Math.floor(sec);
        let minutes: number = Math.floor(seconds / 60);
        let hours: number = Math.floor(seconds / 3600);
        let days: number = Math.floor(seconds / 86400);
        let maxUnit: TimeUnit = TimeUnit.S;
        let result: string = "";
        if (typeof format === "string") {
            result = format;
            if (/d/i.test(format)) {
                maxUnit = TimeUnit.D;
            } else if (/h/i.test(format)) {
                maxUnit = TimeUnit.H;
            } else if (/m/i.test(format)) {
                maxUnit = TimeUnit.M;
            }
        } else {
            if (days > 0) {
                maxUnit = TimeUnit.D;
                result = format.D;
            } else if (hours > 0) {
                maxUnit = TimeUnit.H;
                result = format.H;
            } else if (minutes > 0) {
                maxUnit = TimeUnit.M;
                result = format.M;
            } else {
                maxUnit = TimeUnit.S;
                result = format.S;
            }
        }
        if (maxUnit > TimeUnit.S) {
            seconds %= 60;
        }
        if (maxUnit > TimeUnit.M) {
            minutes %= 60;
        }
        if (maxUnit > TimeUnit.H) {
            hours %= 24;
        }
        let data = {
            d: `${days}`,
            hh: hours < 10 ? `0${hours}` : `${hours}`,
            h: `${hours}`,
            mm: minutes < 10 ? `0${minutes}` : `${minutes}`,
            m: `${minutes}`,
            ss: seconds < 10 ? `0${seconds}` : `${seconds}`,
            s: `${seconds}`
        };

        for (const key in data) {
            const value = data[key];
            result = result.replace(new RegExp(`%{${key}}`, "g"), value);
        }
        return result;
    }


    /**时间戳转日期
     * timestamp(毫秒)
     * 返回 [年，月，日，小时，分钟，秒]
     */
    static TimestampToDate(timestamp: number, isZeroFill: boolean = false) {
        let date = this.toDate(timestamp); // 时间戳转换为Date对象
        let year: number = date.getFullYear();// 获取年份
        let month: number = (date.getMonth() + 1); // 获取月份
        let day: number = date.getDate(); // 获取天
        let hour: number = date.getHours();//小时
        let minutes: number = date.getMinutes();//分钟
        let seconds: number = date.getSeconds();//秒
        let formatList: number[] = [year, month, day, hour, minutes, seconds];
        let results: string[] = [];
        for (let index = 0; index < formatList.length; index++) {
            let val: number = formatList[index];
            results[index] = isZeroFill ? (val < 10 ? `0${val}` : `${val}`) : val.toString();
        }
        return results // 返回格式化日期字符串
    }

    static getTimeToNextWeek() {
        // 获取当前时间
        const now = new Date();

        // 获取当前星期几
        const currentDay = now.getDay(); // 0 表示星期天, 1 表示星期一, ..., 6 表示星期六

        // 计算距离下周一还有几天
        const daysUntilNextMonday = (8 - currentDay) % 7;

        // 获取下周一的日期
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilNextMonday);
        nextMonday.setHours(0, 0, 0, 0); // 设置为下周一的0点0分0秒

        // 计算时间差（毫秒）
        let timeDifference = nextMonday.getTime() - now.getTime();
        if (timeDifference <= 0) { timeDifference = 604800000 + timeDifference };

        // 转换为小时、分钟和秒
        let seconds: any = Math.floor((timeDifference / 1000) % 60);
        let minutes: any = Math.floor((timeDifference / 1000 / 60) % 60);
        let hours: any = Math.floor((timeDifference / 1000 / 60 / 60) % 24);
        let days = Math.floor(timeDifference / 1000 / 60 / 60 / 24);

        if (hours < 10 && hours != 0) hours = `0${hours}`
        if (minutes < 10 && minutes != 0) minutes = `0${minutes}`
        if (seconds < 10 && seconds != 0) seconds = `0${seconds}`
        return `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`
    }

    static getTimeToNextDay() {
        // 获取当前时间
        const now = new Date();

        // 获取明天0点的时间
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // 设置为明天的0点0分0秒

        // 计算时间差（毫秒）
        let timeDifference = tomorrow.getTime() - now.getTime();
        if (timeDifference <= 0) { timeDifference = 86400000 + timeDifference };

        // 转换为小时、分钟和秒
        let seconds: any = Math.floor((timeDifference / 1000) % 60);
        let minutes: any = Math.floor((timeDifference / 1000 / 60) % 60);
        let hours: any = Math.floor((timeDifference / 1000 / 60 / 60));

        if (hours < 10 && hours != 0) hours = `0${hours}`
        if (minutes < 10 && minutes != 0) minutes = `0${minutes}`
        if (seconds < 10 && seconds != 0) seconds = `0${seconds}`
        return `${hours}小时 ${minutes}分钟 ${seconds}秒`
    }

    /**
     * 获取当天凌晨时间戳(单位秒)
     * @param timeZone 时区 默认北京时间
     * @returns 
     */
    public static WeeHoursTime(timeZone:number = 8):number{
        let serverTime:number = PlayerData.GetServerTime();
        let offsetTime:number = serverTime % 86400 + (timeZone * 3600);
        let curTime:number = serverTime - offsetTime;
        //let dates:string[] = DateUtils.TimestampToDate(curTime * 1000, true);
        //console.log(`凌晨时间戳----------------->${dates[0]}-${dates[1]}-${dates[2]}  ${dates[3]}:${dates[4]}:${dates[5]}`);
        return curTime;
    }

    static SecondsToDetailedTime(seconds: number): string {
        seconds = Math.floor(seconds);
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
    
        // 使用条件运算符简化字符串拼接
        const timeStr = `${days > 0 ? `${days}天` : ''}${hours > 0 ? `${hours}小时` : ''}${minutes > 0 ? `${minutes}分钟` : ''}${secs > 0 ? `${secs}秒` : ''}`.trim();
    
        return timeStr || "0秒"; // 如果所有单位都是0，则返回"0秒"
    }
}