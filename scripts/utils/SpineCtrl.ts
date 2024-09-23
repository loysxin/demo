import { _decorator, Component, Node, sp } from 'cc';
import Logger from './Logger';
const { ccclass, property } = _decorator;


class SpineCtrl {
    private static _instance: SpineCtrl;
    /** 获取单例 */
    public static get instance(): SpineCtrl {
        this._instance = this._instance || new SpineCtrl();
        return this._instance;
    }
    private spineTimeMap: Map<Node, number>;
    protected constructor() {
        this.spineTimeMap = new Map<Node, number>();
    }

    private _playCount = 0;
    /**
     * 播放第几次结束的回调
     * @param spNode 
     * @param clip  播放动画
     * @param bool 是否循环播放
     * @param count  播放次数
     * @param callback 返回
     * @returns 
     */
    setCompleteListener(spNode: Node, clip: string, bool: boolean = false, count: number = 1, callback: Function = null) {
        if (!spNode.getComponent(sp.Skeleton)) {
            Logger.log("spNode没有sp.Skeleton组件");
            return;
        }
        this._playCount = 0;
        let skeleton = spNode.getComponent(sp.Skeleton);
        skeleton.setCompleteListener(() => {
            this._playCount += 1;
            if (this._playCount == count) {
                callback && callback();
            }
        });
        skeleton.setAnimation(0, clip, bool);
    }

    /**
     * 播放第几帧的回调
     * @param spNode 
     * @param clip 播放动画
     * @param bool 是否循环播放
     * @param frame 播放到第几帧
     * @param callback 返回
     * @returns 
     */
    setFrameListener(spNode: Node, clip: string, bool: boolean = false, frame: number, callback: Function = null) {
        if (!spNode.getComponent(sp.Skeleton)) {
            Logger.log("spNode没有sp.Skeleton组件");
            return;
        }
        this.clearTimeOut(spNode);
        let time = frame / 30;
        let skeleton = spNode.getComponent(sp.Skeleton);
        skeleton.setAnimation(0, clip, bool);
        let tiemId = setTimeout(() => {
            callback && callback();
            this.spineTimeMap.delete(spNode);
        }, time * 1000);
        this.spineTimeMap.set(spNode, tiemId);
    }

    /**
     * 取消定时器
     */
    clearTimeOut(spNode: Node) {
        let id = this.spineTimeMap.get(spNode);
        if (id) {
            clearTimeout(id);
        }
    }

    /**
    * 播放骨骼动画
    * @param node 当前节点
    * @param anim1 动画1
    * @param anim2 动画2
    * @param loop 是否循环播放
    * @param callback  播放完执行的函数
    */
    play2Spine(spNode: Node, anim1: string, anim2: string = null, loop: boolean = false, callback: Function = null) {
        let tanim: sp.Skeleton = spNode.getComponent(sp.Skeleton)
        let tloop = anim2 ? false : loop
        tanim.setAnimation(0, anim1, tloop);
        tanim.setCompleteListener(() => {
            if (tanim.animation == anim1) {
                if (anim2) {
                    tanim.setAnimation(0, anim2, loop);
                    tanim.setCompleteListener(() => {
                        if (tanim.animation == anim2) {
                            if (!loop) {
                                callback && callback();
                            }
                        }
                    })
                } else {
                    callback && callback();
                }
            }
        });
    }
}

export default SpineCtrl;