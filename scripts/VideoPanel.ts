import { _decorator, Button, find, game, input, Input, Label, Node, path, Sprite, SpriteFrame, tween, VideoPlayer, view, Widget, widgetManager } from 'cc';
import { Panel } from './GameRoot';
import { GameSet } from './module/GameSet';
import { EventMgr } from './manager/EventMgr';

const { ccclass, property } = _decorator;

export class VideoPanel extends Panel {
    protected prefab: string = 'prefabs/VideoPanel';
    protected callBack: Function;
    protected video: VideoPlayer;
    protected closeBtn: Node;
    protected onLoad() {
        this.closeBtn = this.find("close");
        this.video = this.find("VideoPlayer", VideoPlayer);
        this.video.node.on(VideoPlayer.EventType.COMPLETED, this.onComplete, this);
        this.node.on(Input.EventType.TOUCH_END, this.onTouch, this);
        this.CloseBy(this.closeBtn);
        EventMgr.on("app_touch_up", this.onTouch, this);
    }

    private touchType = undefined;
    onTouch(e) {
        console.log("app_touch_up", this.video.node.position.y);
        if (this.video.node.position.y == 0) {
            this.closeBtn.active = true;
            this.video.node.setPosition(0, -120);
        } else {
            this.video.node.setPosition(0, 0);
        }
    }


    protected onComplete() {
        console.log("video Complete");
        this.Hide();
        this.destroy();
    }

    protected onShow(): void {
        if (GameSet.SceneCanvasHeight / GameSet.SceneCanvasWidth > 1920 / 1080) {
            let dh = GameSet.SceneCanvasHeight - 1920;
            console.log("video**********", dh);
            if (dh < 100) return;
            if (dh / 2 >= 100) {
                this.closeBtn.active = true;
                this.closeBtn.getComponent(Widget).top = -100;
                this.node.off(Input.EventType.TOUCH_END, this.onTouch, this);
                EventMgr.off("app_touch_up", this.onTouch, this);
            } else {
                // this.closeBtn.getComponent(Widget).top = -dh / 2;
                // this.video.node.setPosition(0, -dh / 2);
            }
        }
    }

    public flush(callback: Function): void {
        this.callBack = callback;
    }

    protected onHide(...args: any[]): void {
        if (this.callBack) {
            let callback = this.callBack;
            this.callBack = undefined;
            callback();
        }
    }
}


