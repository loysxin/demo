import { _decorator, native } from 'cc';
import PlayerData from './module/roleModule/PlayerData';
import { Base64_Encode } from './utils/Utils';
import { Loading } from './Loading';
import { ANDROID, HUAWEI, IOS } from 'cc/env';
import { GameSet } from './module/GameSet';
import { MsgTypeSend } from './MsgType';
import { Session } from './net/Session';
const { ccclass, property } = _decorator;
/**
 * 广告结果
 */
export enum AdActionResult {
    OnLoadSuccess = "onLoadSuccess",//广告加载成功
    OnLoadFailed = "onLoadFailed",//广告加载失败
    OnShowSuccess = "onShowSuccess",//广告展示成功
    OnShowFailed = "onShowFailed",//广告展示失败
    OnAdClosed = "onAdClosed",//广告关闭
    OnAdClicked = "onAdClicked",//广告点击关闭
    OnTimeOver = "onTimeOver",//广告倒计时结束
    OnSkip = "onSkip",//用户点击跳过
    OnADShow = "onADShow",//广告展示
    OnVideoComplete = "onVideoComplete",//视频播放完成
    OnReward = "onReward",//发放奖励
}

@ccclass('AdHelper')
export class AdHelper {
    private static $hasInit: boolean = false;
    static map = new Map<string, (action: string, errorCode?: string, errorMsg?: string) => void>();

    static get hasInit() { return this.$hasInit; }

    static logMsg(...data: any[]) {
        let infoMsg = "";
        if (data) {
            data.forEach(it => {
                if (infoMsg == "") {
                    infoMsg = it;
                } else {
                    infoMsg = infoMsg + ", " + it;
                }
            })
        }
        console.log("cocs page info : ", infoMsg);
    }

    static startAction() {
        native.jsbBridgeWrapper.addNativeEventListener("acceptNativeMethodResult", (ps: string) => {
            //methodId: string, action:string, errorCode?:string, errorMsg?:string

            this.logMsg("callback data : " + ps);

            const psObj = JSON.parse(ps);
            const callbackId = psObj["callbackId"];
            if (callbackId == undefined || !callbackId) {
                return;
            }

            const method = this.map.get(callbackId);
            if (method == undefined || !method) {
                this.logMsg("无此回调方法 : " + callbackId);
                return;
            }

            const action = psObj["action"];
            if (action == undefined || !action) {
                return;
            }

            if ('onLoadFailed' == action || 'onShowFailed' == action || 'onAdClosed' == action) {
                if ('onAdClosed' == action) {
                    setTimeout(() => {
                        this.map.delete(callbackId);
                    }, 500);
                } else {
                    this.map.delete(callbackId);
                }

            }

            const errorCode = psObj["errorCode"];
            const errorMsg = psObj["errorMsg"];
            method(action, errorCode, errorMsg);
        });
    }

    static init(cpid: string, appid: string, channel: string, debug: boolean) {
        this.logMsg(cpid, appid, channel, debug);

        let json = JSON.stringify({
            action: "init",
            cpid: cpid,
            appid: appid,
            channel: channel,
            debug: debug
        })
        console.log("adhelp.init", json);
        native.jsbBridgeWrapper.dispatchEventToNative('duot_ad_option', json);
        this.$hasInit = true;
    }

    static async splash(adid: string, callback?: (action: string, errorCode?: string, errorMsg?: string) => void) {
        if (!this.$hasInit) return;
        const ps = {
            action: "splash",
            adid: adid
        };
        const callbackId = "splash_callback_" + this.getRandomInt(0, 100000) + "_" + new Date().getTime();
        let p: Promise<string[]>;
        if (callback) {
            this.map.set(callbackId, callback);
            ps["callbackId"] = callbackId;
        } else {
            p = new Promise<string[]>((resolve, reject) => {
                this.map.set(callbackId, (action: string, errorCode?: string, errorMsg?: string) => {
                    resolve([action, errorCode, errorMsg]);
                });
                ps["callbackId"] = callbackId;
            });
        }
        let json = JSON.stringify(ps);
        console.log("adhelp.splash", json);
        native.jsbBridgeWrapper.dispatchEventToNative('duot_ad_option', json);
        return p;
    }

    static async insertAd(adid: string, callback?: (action: string, errorCode?: string, errorMsg?: string) => void) {
        if (!this.$hasInit) return;
        const ps = {
            action: "insert",
            adid: adid
        };
        const callbackId = "insert_callback_" + this.getRandomInt(0, 100000) + "_" + new Date().getTime();
        let p: Promise<string[]>;
        if (callback) {
            this.map.set(callbackId, callback);
            ps["callbackId"] = callbackId;
        } else {
            p = new Promise<string[]>((resolve, reject) => {
                AdHelper.map.set(callbackId, (action: string, errorCode?: string, errorMsg?: string) => {
                    resolve([action, errorCode, errorMsg]);
                });
                ps["callbackId"] = callbackId;
            });
        }
        let json = JSON.stringify(ps);
        console.log("adhelp.insertAd", json);
        native.jsbBridgeWrapper.dispatchEventToNative('duot_ad_option', json);
        return p;
    }

    static async fullscreenAd(adid: string, callback?: (action: string, errorCode?: string, errorMsg?: string) => void) {
        if (!this.$hasInit) return;
        const ps = {
            action: "fullscreen",
            adid: adid
        };
        const callbackId = "fullscreen_callback_" + this.getRandomInt(0, 100000) + "_" + new Date().getTime();
        let p: Promise<string[]>;
        if (callback) {
            this.map.set(callbackId, callback);
            ps["callbackId"] = callbackId;
        } else {
            p = new Promise<string[]>((resolve, reject) => {
                AdHelper.map.set(callbackId, (action: string, errorCode?: string, errorMsg?: string) => {
                    resolve([action, errorCode, errorMsg]);
                });
                ps["callbackId"] = callbackId;
            });
        }
        let json = JSON.stringify(ps);
        console.log("adhelp.fullscreenAd", json);
        native.jsbBridgeWrapper.dispatchEventToNative('duot_ad_option', json);
        return p;
    }

    /**
     * 
     * @param adid 激励广告
     * @param type 类型
     * @param callback 
     * @returns 
     */
    static async rewardAd(adid: string, type: any, params: string, callback?: (action: string, errorCode?: string, errorMsg?: string) => void) {
        if (!(ANDROID || HUAWEI || IOS)) return;
        if (!this.$hasInit || !PlayerData.roleInfo) return;
        let obj = {
            userid: PlayerData.roleInfo.player_id,
            type: type,
            params: params,
            orderid: PlayerData.roleInfo.player_id + "_" + adid + "_" + Date.now()
        }
        const ps = {
            action: "reward",
            channel:"yj",
            adid: adid,
            userid: PlayerData.roleInfo.player_id,
            customData: JSON.stringify(obj)
        };

        Loading.Show(0, 1);
        const callbackId = "reward_callback_" + this.getRandomInt(0, 100000) + "_" + new Date().getTime();
        let p: Promise<string[]>;
        if (callback) {
            this.map.set(callbackId, callback);
            ps["callbackId"] = callbackId;
        } else {
            p = new Promise<string[]>((resolve, reject) => {
                AdHelper.map.set(callbackId, (action: string, errorCode?: string, errorMsg?: string) => {
                    resolve([action, errorCode, errorMsg]);
                    Loading.Show(1, 1);
                });
                ps["callbackId"] = callbackId;
            });
        }
        let json = JSON.stringify(ps);
        console.log("adhelp.rewardAd", json);
        native.jsbBridgeWrapper.dispatchEventToNative('duot_ad_option', json);
        return p;
    }
    
    /**
     * 趣变广告
     * @param adid 
     * @param type 
     * @param params 
     * @param callback 
     * @returns 
     */
    static async rewardQbAd(adid: string, type: any, params: string, callback?: (action: string, errorCode?: string, errorMsg?: string) => void) {
        if (!(ANDROID || HUAWEI || IOS)) return;
        if (!this.$hasInit || !PlayerData.roleInfo) return;
        let obj = {
            userid: PlayerData.roleInfo.player_id,
            type: type,
            params: params,
            orderid: PlayerData.roleInfo.player_id + "_" + adid + "_" + Date.now()
        }
        const ps = {
            action: "reward",
            channel:"qb",
            adid: adid,
            userid: PlayerData.roleInfo.player_id,
            customData: JSON.stringify(obj)
        };

        Loading.Show(0, 1);
        const callbackId = "reward_callback_" + this.getRandomInt(0, 100000) + "_" + new Date().getTime();
        let p: Promise<string[]>;
        if (callback) {
            this.map.set(callbackId, callback);
            ps["callbackId"] = callbackId;
        } else {
            p = new Promise<string[]>((resolve, reject) => {
                AdHelper.map.set(callbackId, (action: string, errorCode?: string, errorMsg?: string) => {
                    resolve([action, errorCode, errorMsg]);
                    Loading.Show(1, 1);
                });
                ps["callbackId"] = callbackId;
            });
        }
        let json = JSON.stringify(ps);
        console.log("adQbhelp.rewardAd", json);
        native.jsbBridgeWrapper.dispatchEventToNative('duot_ad_option', json);
        return p;
    }


    private static getRandomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static JumpAd(type:number, params:string){
        let sendData = {
            type: MsgTypeSend.UseRightsAdRequest,
            data: {
                ad_type: type,
                params: params,
            }
        }
        Session.Send(sendData);
    }
}