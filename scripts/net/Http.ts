import { EvtPass } from "../utils/Utils";
import { game } from "cc";
import { GameSet } from "../module/GameSet";

/**
 * 云信消息协议
 * @im消息无序，所以上下行消息合成一条完整协议，避免下行消息前后错乱
 * @请务必研究消息针对游戏业务逻辑所需的上下行耦合策略，如果有耦合错误则会导致其他依赖此消息的协议出现数据错乱的风险
 */
export type HttpInterface = {
    readonly serverUrl?: string;//服务器地址   
    readonly uri: string;// 消息接口地址
    readonly isGet?: boolean;// 是否GET方法，不配默认POST
    readonly msgType?: string;// 消息类型
    readonly awaitList?: HttpInterface | HttpInterface[]; // 需要等待的前置消息列表，前置消息未返回则无法向服务器发送此协议
    readonly awaitMsg?: string;// 消息未返回提示
    readonly awaitTick?: number;
    readonly headers?: Record<string, string>;//消息头参数
}

/**表示自己 */
export const HttpInterfaceSelf: HttpInterface = { uri: "$self" }; //占位作用不可修改

/**获取toke */
export const GetLoginInfo: HttpInterface = {
    uri: "/wechat_login",
    isGet: false,
};

/**潮游sdk登录 */
export const SendChaoyouToken: HttpInterface = {
    uri: "/chaoyou_login",
    isGet: false,
};

/**畅游戏服获取公告列表 */
export const SendGetAllNotice: HttpInterface = {
    serverUrl: "https://mgapi.chaoyouhuyu.com",
    uri: "/biz-marketing/public/announcement/getAll",
    headers: { "X-SERVER-APP-ID": "zljq", "X-APP-ID": "zljq" },
    isGet: false,
};
/**精英服获取公告列表 */
export const SendGetAllNoticeJy: HttpInterface = {
    serverUrl: "https://mgapi.chaoyouhuyu.com",
    uri: "/biz-marketing/public/announcement/getAll",
    headers: { "X-SERVER-APP-ID": "zljqjy", "X-APP-ID": "zljqjy" },
    isGet: false,
};

/**获取排行榜数据列表 */
export const SendGetRankData: HttpInterface = {
    serverUrl: "http://192.168.0.74:9898",
    uri: "/ranking",
};

const SERVER_HOST = "https://192.168.0.118:7880"; //周科本地

type HandleStruct = {
    cb: Function,
    mod: any,
    isOnce: boolean,
    protocol: HttpInterface
}
export function MsgId(protocol: HttpInterface) { return protocol.uri + "->" + (protocol.msgType ? protocol.msgType : ""); }

/**
 * 会话
 */
export class Http {
    private static msgHandles: Map<string, HandleStruct[]> = new Map<string, HandleStruct[]>();
    static on(protocol: HttpInterface, cb: Function, module: any, isOnce = false) {
        let msgId = MsgId(protocol);
        let handles: HandleStruct[] = this.msgHandles[msgId];
        if (!handles) {
            handles = [];
            this.msgHandles[msgId] = handles;
        }
        for (var handle of handles) {
            if (handle.cb == cb && handle.mod == module) {
                return false;
            }
        }
        handles.push({ cb: cb, mod: module, isOnce: isOnce, protocol: protocol });
        return true;
    }
    static del(protocol: HttpInterface) {
        let msgId = MsgId(protocol);
        if (this.msgHandles.has(msgId)) {
            this.msgHandles.delete(msgId);
        }
    }

    private static dispatchDatas(msgId: string, ...args: any[]) {
        let handles: HandleStruct[] = this.msgHandles[msgId];
        if (!handles) return;
        for (let i = 0; i < handles.length;) {
            let handle = handles[i];
            if (handle.isOnce) {
                handles.splice(i, 1);
            } else {
                i++;
            }
            let cb = handle.cb
            cb.call(handle.mod, ...args);
        }
    }
    private static states: { [msgId: string]: number } = {};

    /**
     * 检测协议是否可以发送
     * @param protocol 
     * @returns 
     */
    static CheckProtocol(protocol: HttpInterface) {
        if (!protocol.awaitList) return null;
        let list = [].concat(protocol.awaitList);
        if (list.length == 0) return null;
        for (let rely of list) {
            let msgId = rely == HttpInterfaceSelf ? MsgId(protocol) : MsgId(rely);
            if (this.states[msgId] > game.totalTime / 1000) return rely;
        }
        return null;
    }

    /**
     * 发送消息
     * @param protocol 
     * @param body 
     * @param uri 
     * @returns 
     */
    static async Send(protocol: HttpInterface, body?: any, uri?: any[], respObj?: any): Promise<any> {
        let rely = this.CheckProtocol(protocol);
        if (rely) {
            console.warn("前置协议尚未返回->", MsgId(rely));
            // if (protocol.awaitMsg) Tips.Show(protocol.awaitMsg);
        } else {
            //记录请求状态
            let msgId = MsgId(protocol);
            this.states[MsgId(protocol)] = protocol.awaitTick ? game.totalTime / 1000 + protocol.awaitTick : Number.MAX_SAFE_INTEGER;

            //格式化url
            let url = protocol.uri;
            while (uri && uri.length) {
                let check = url.match(/\{[^\}]*\}/);
                if (!check) break;
                url = url.replace(check[0], uri.shift());
            }
            let $uri = "";
            for (let i = 0, len = uri ? uri.length : 0; i < len; i++) {
                if ($uri != "") {
                    $uri += "&";
                } else $uri += "?";

                let obj = uri[i];
                for (let k in obj) {
                    $uri = $uri + k + "=" + obj[k];
                }
            }
            url = url + $uri;

            //发出请求
            const method = protocol.isGet ? "GET" : "POST";
            let response = await this.request(protocol.serverUrl, url, protocol.headers, method, body);
            // console.log("http<<<", response);
            if (!response) {
                console.warn("http请求失败！");
            } else if (response.status == 200) {
                let json = await response.json();
                // if (json['code'] != 200) {
                //     // Tips.ShowTop(json['msg']);
                //     console.warn(json);
                //     this.states[msgId] = 0;
                //     return new Promise(() => { });
                // }
                // json = json.data;
                console.log("http<<<", msgId, JSON.stringify(json));
                // if (respObj) {
                //     json = ParseJson(json, respObj);
                // }
                EvtPass.Pass(msgId, body);
                this.dispatchDatas(msgId, json);
                this.states[msgId] = 0;
                return Promise.resolve(json);
            } else {
                console.warn(msgId, "statusText:", response.status, response.statusText);
                // let json = await response.json();
                // console.warn(json);
                // if (json.msg) {
                //     // MsgPanel.Show(json.msg);
                // } else {
                //     // MsgPanel.Show(json.code);
                // }
                this.states[msgId] = 0;
                EvtPass.Pass(msgId, body);
                this.dispatchDatas(msgId, body);
                return Promise.resolve(null);
            }
        }
    }

    static loadBody(res: any) {
        if (res instanceof ArrayBuffer) {
            let responseText = '';
            try {
                const decoder = new TextDecoder();
                responseText = decoder.decode(res);

                console.log("Response body:", responseText); // 输出服务器返回的内容

                // 对responseText进行处理或提取所需数据
                // ...
            } catch (e) {
                console.error("Failed to decode the response text.");
            }
        }
    }

    /**
     * 发消息
     * @param url 
     * @param body 
     * @param token 
     * @returns 
     */
    private static async request(serverUrl: string, uri: string, header: Record<string, string>, method: string, body: any): Promise<Response> {
        let url = `${serverUrl || GameSet.Local_host || SERVER_HOST}${uri}`;
        let json = "";
        if (method.toLocaleLowerCase() == "post") {
            let headers: Record<string, string> = header || {};
            headers['Content-Type'] = 'application/json';
            var init: any = {
                method: 'POST',
                headers
            };
            if (body) {
                init["body"] = JSON.stringify(body);
                json = init["body"];
            }
        } else {
            var init: any = {
                method: 'GET'
            }
        }
        console.log("http>>>", url, json);
        try {
            const response = await fetch(url, init);
            return response;
        } catch (e) {
            return null;
        }
    }
}