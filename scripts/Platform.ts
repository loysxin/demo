import { Canvas, Event, Game, Node, NodeEventType, RenderTexture, SpriteFrame, Texture2D, game, native, profiler } from "cc";
import { ANDROID, DEBUG, DEV, HUAWEI, IOS } from "cc/env";
import { GameSet } from "./module/GameSet";
import { EventMgr, Evt_Hide_Scene, Evt_Layout_Status_Bar, Evt_ReLogin } from "./manager/EventMgr";
import { AdHelper } from "./AdHelper";
import { copyToClip } from "./utils/Utils";
import LocalStorage from "./utils/LocalStorage";

/**游戏是否切换到后台 */
export function IsBackGround() {
    return background > 0;// && game.totalTime - background >= 5000;
}
let select_server = false;
let auto_login = false;
let debug_login = false;
let background: number = -1;
let jsbInit = false;
let initSuccess: Function;
let initPromise: Promise<any>;
let appInfo: {
    versionCode:string,
    versionName:string,
    accountId: string,
    avatar: string,
    distinctId: string,
    inviteCode: string,
    isNew: string,
    nickname: string,
    token: string,
    unionId: string,
    deviceInfo: {
        Device_Manufacturer: string,
        Device_Model: string,
        Android_Version: string,
        API_Level: string,
        Device_Id: string
    }
};
let channelInfo: {
    accountId: string,
    avatar: string,
    distinctId: string,
    inviteCode: string,
    isNew: string,
    nickname: string,
    token: string,
    unionId: string,
}

export const Api_Init: string = "init";
export const Api_StatusBarHeight: string = "StatusBarHeight";
export const Api_Pick_phone: string = "pick_phone";
export const Api_Image_base64: string = "image_base64";
export const Api_Has_image: string = "has_image";
export const Api_Exit_Game: string = "exit";
export const Api_Copy_Clip: string = "copy_clip";
export const Api_Get_Clip: string = "get_clip";
export const Api_Login_Channel: string = "login_channel";
export const Api_Token_Expired: string = "token_expired";
export const Api_Login_Init: string = "login_init";
export const Api_Inster_Image: string = "api_inster_image";
export const Api_Check_Permission: string = "api_check_permission";
export const Api_Share: string = "api_share";
export const Api_User_Profile: string = "user_profile";

export const GameVer: string = "v1.0.0.2267";//游戏版本号

let adcfg: {
    readonly cpId: any;
    readonly appId: any;
    readonly channel: any;
    readonly debug: any;
    readonly intertAdid: any;
    readonly splashAdId: any;
    readonly fullScreenAdId: any;
    readonly rewardAdId1: any;
    readonly rewardAdId2: any;
    readonly rewardAdId3: any;
    readonly rewardAdId4: any;
}
export function getAdcfg() {
    if (!adcfg) {
        //ios
        if (IOS) {
            adcfg = {
                cpId: '554389974204485',
                appId: '574939944251525',
                channel: 'iOS',
                debug: true,
                intertAdid: '578828359024837',
                splashAdId: '574940040655045',
                fullScreenAdId: '578828409331909',
                rewardAdId1: '582052268404933',
                rewardAdId2: '584762333716677',
                rewardAdId3: '584762387296453',
                rewardAdId4: '584762429493445'
            };
        } else {
            adcfg = {
                cpId: '554389974204485',
                appId: '574939944251525',
                channel: 'demo-xiaomi',
                debug: true,
                intertAdid: '578828359024837',
                splashAdId: '574940040655045',
                fullScreenAdId: '578828409331909',
                rewardAdId1: '574940085264581',
                rewardAdId2: '584762109395141',
                rewardAdId3: '584762176528581',
                rewardAdId4: '584762238447813'
            }
        }
    }

    return adcfg;
}

let qbCfg: {
    appId: string,
    splashAdId: string,
    intertAdid: string,
    rewardAdId1: string,
    rewardAdId2: string,
    rewardAdId3: string,
    rewardAdId4: string,
}
export function getQbAdCfg() {
    if (!qbCfg) {
        if (IOS) {
        } else {
            qbCfg = {
                appId: '1833762292118868034',
                splashAdId: '',
                intertAdid: '',
                rewardAdId1: '1833762554829099086',
                rewardAdId2: '1834062755796111426',
                rewardAdId3: '1834062958045450322',
                rewardAdId4: '1834063113226309704',
            }
        }
    }
    return qbCfg;
}



/**
 * 平台接口
 */
export class Platform {
    private static instance: Platform;

    static async Init() {
        if (this.instance) return Promise.resolve();
        if (ANDROID || HUAWEI || IOS) {
            initPromise = new Promise((resolve, reject) => {
                initSuccess = resolve;
            })
        }
        this.instance = new Platform();
        if (initPromise) {
            return initPromise;
        } else {
            return Promise.resolve();
        }
    }

    constructor() {
        game.on(Game.EVENT_HIDE, this.onHide, this);
        game.on(Game.EVENT_SHOW, this.onShow, this);

        if (ANDROID || HUAWEI || IOS) {
            if (native && native.jsbBridgeWrapper && native.jsbBridgeWrapper.addNativeEventListener) {
                // 接收app消息
                native.jsbBridgeWrapper.addNativeEventListener("call_game", (jsonStr: string) => {
                    console.log("call_game", jsonStr);
                    try {
                        let json = JSON.parse(jsonStr);
                        switch (json.api) {
                            case Api_Init:
                                if (jsbInit) return;
                                jsbInit = true;
                                appInfo = JSON.parse(json.data);
                                if (appInfo['dout'] && appInfo['dout'] != "") {
                                    AdHelper.init(getAdcfg().cpId, getAdcfg().appId, getAdcfg().channel, getAdcfg().debug);
                                }
                                if (appInfo['debug_login']) debug_login = true;
                                if (appInfo['auto_login']) auto_login = true;
                                if (appInfo['local']) GameSet.globalCfg = undefined;
                                if (appInfo['select_server']) select_server = true;
                                let cache = LocalStorage.GetString("login_channel", "");
                                if (cache && cache != "") {
                                    channelInfo = JSON.parse(cache);
                                }
                                initSuccess();
                                CallApp({ api: Api_Login_Init, appid: "zljq" });
                                break;
                            case Api_Login_Channel:
                                let loginInfo = JSON.parse(json.data);
                                if (IOS && channelInfo && channelInfo.token != loginInfo.token && GameSet.intoGame) {
                                    EventMgr.emit("logout_game");
                                }
                                channelInfo = loginInfo;
                                LocalStorage.SetString("login_channel", json.data);
                                break;
                            case Api_Token_Expired:
                                channelInfo = undefined;
                                LocalStorage.RemoveItem("login_channel");
                                break;
                            case Api_StatusBarHeight:
                                GameSet.StatusBarHeight = json.data || 0;
                                EventMgr.emit(Evt_Layout_Status_Bar);
                                break;
                            case Api_Pick_phone:
                                var callBack = apiCallbacks[json.api];
                                apiCallbacks[json.api] = undefined;
                                callBack && callBack(json.data);
                                break;
                            case Api_Image_base64:
                                var callBack = apiCallbacks[json.api];
                                apiCallbacks[json.api] = undefined;
                                callBack && callBack(json.data);
                                break;
                            case Api_Has_image:
                                var callBack = apiCallbacks[json.api];
                                apiCallbacks[json.api] = undefined;
                                callBack && callBack(json.data);
                                break;
                            case Api_Exit_Game:
                                var callBack = apiCallbacks[json.api];
                                apiCallbacks[json.api] = undefined;
                                callBack && callBack(json.data);
                                break;
                            case Api_Check_Permission:
                                var callBack = apiCallbacks[json.api];
                                apiCallbacks[json.api] = undefined;
                                callBack && callBack(json.data);
                                break;
                            case Api_Copy_Clip:
                                var callBack = apiCallbacks[json.api];
                                apiCallbacks[json.api] = undefined;
                                callBack && callBack(json.data);
                                break;
                            case "key_back":
                                if (!GameSet['release']) {
                                    GameSet.debug = true;
                                    profiler.showStats();
                                }
                                let operate = GameSet.ForBack();
                                CallApp({ api: "key_back", operate: operate });
                                break;
                            case "api_touch":
                                console.log("app touch", json.data);
                                if (json.data == "up") {
                                    EventMgr.emit("app_touch_up");
                                }
                                break;
                            case "sdk_logout":
                                LocalStorage.RemoveItem("login_channel");
                                channelInfo = null;
                                EventMgr.emit("logout_game");
                                break;
                            case "change_account":
                                EventMgr.emit("logout_game");
                                channelInfo = JSON.parse(json.data);
                                LocalStorage.SetString("login_channel", json.data);
                                break;
                            default:

                        }
                    } catch (e) {

                    }
                })
                AdHelper.startAction();
                if (!jsbInit) {
                    CallApp({ api: Api_Init });
                }
            } else {
                console.error("native.jsbBridgeWrapper.addNativeEventListener");
            }
        }
    }

    private onHide() {
        // if (ANDROID || HUAWEI || IOS) return;
        console.log("#切换到后台");
        background = game.totalTime;
    }

    private onShow() {
        if (ANDROID || HUAWEI || IOS) {
            background = 0;
        } else {
            console.log("#返回到前台");
            if (IsBackGround()) {
                console.log("#恢复游戏#");
                if (!DEV) location.reload();
            }
            background = -1;
        }
    }
}

export function GetUserCode() {
    if (auto_login) return "test1";
    if (channelInfo && channelInfo.token) return channelInfo.token;
    return window['usercode'];
}

export function hasSdk() {
    if (auto_login) return false;
    if (channelInfo && channelInfo.token) return true;
    return false;
}

export function debugLogin() {
    return debug_login;
}

export function CanSelectServer() {
    return select_server;
}

export function autoLogin() {
    return auto_login;
}

/**获取设备信息 */
export function GetDeviceInfo() {
    if (!appInfo) return undefined;
    return appInfo.deviceInfo;
}

/**获取昵称 */
export function GetNickName() {
    if (!appInfo) return undefined;
    return appInfo.nickname;
}

/**获取邀请码 */
export function GetInviteCode() {
    if (!appInfo) return undefined;
    return appInfo.inviteCode;
}

export function GetVersionCode() {
    if (!appInfo) return undefined;
    return appInfo.versionCode;
}

export function GetVersionName() {
    if (!appInfo) return "1.0.9999999999";
    return appInfo.versionName;
}

let apiCallbacks: { [api: string]: Function } = {};

/**
 * 发送消息给app
 * @param json 
 */
export function CallApp(json: any, callBack?: Function) {
    console.log("CallApp", json.api);
    try {
        if (callBack) apiCallbacks[json.api] = callBack;
        let jsonStr = JSON.stringify(json);
        native.jsbBridgeWrapper.dispatchEventToNative("call_app", jsonStr);
    } catch (e) {

    }
}

/**
 * 复制到粘贴板
 * @param desc 
 * @param callBack 
 */
export function CopyToClip(desc: string, callBack?: (desc: string) => void) {
    if (jsbInit) {
        CallApp({ api: Api_Copy_Clip, desc: desc }, callBack);
    } else {
        let result = copyToClip(desc);
        if (callBack) {
            if (result) {
                callBack(desc);
            } else {
                callBack("");
            }
        }
    }
}

declare var AndroidCaller: any;
export function PostUriMsg(url_type: any) {
    if (ANDROID || HUAWEI || IOS) return;
    console.log('myPostMsg', url_type)
    let data = {
        action: 'h5battlegame',
        message: {
            url_type
        }
    }
    if (window["platform"]) {
        var platform = window["platform"];
    } else {
        var platform = "";
    }
    if (platform == "ios") {
        window['webkit'].messageHandlers.nativeHandler.postMessage(JSON.stringify(data));
    } else if (platform == "android") {
        AndroidCaller.postMessage(JSON.stringify(data));
    } else if (window['uni']) {
        window['uni'].webView.postMessage({
            data
        })
    }
}