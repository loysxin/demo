import { Widget, assetManager, game, sp } from "cc";
import { Panel } from "../../GameRoot";
import { Second } from "../../utils/Utils";
import { EventMgr, Evt_Map_Tile_Complete } from "../../manager/EventMgr";
import { AudioMgr } from "../../manager/AudioMgr";
import { GameSet } from "../GameSet";

export class ChangeScenePanel extends Panel {
    protected prefab: string = "prefabs/panel/ChangeScenePanel";
    private effect: sp.Skeleton;
    private static seed = 0;
    private static delay: number;
    private static mapComplete: boolean = false;

    protected onLoad(): void {
        this.effect = this.find("effect", sp.Skeleton);
        this.effect.setCompleteListener(this.onShowSub.bind(this));
    }

    private async onShowSub(e: sp.spine.TrackEntry) {
        if (this.effect.getCurrent(0).animation.name == "show") {
            let playId = ++ChangeScenePanel.seed;
            this.runCallBack();
            if (ChangeScenePanel.delay) {
                await Second(ChangeScenePanel.delay);
            } else {
                let t = game.totalTime;
                while (!ChangeScenePanel.mapComplete) {
                    await Second(0.1);
                    // if (game.totalTime - t >= 5000) break;
                }
            }
            if (playId != ChangeScenePanel.seed) return;
            this.effect.setAnimation(0, "close", false);
        } else {
            this.runCallBack();
            this.Hide();
        }

    }

    private runCallBack() {
        if (ChangeScenePanel.callBack) {
            let callBback = ChangeScenePanel.callBack;
            ChangeScenePanel.callBack = undefined;
            callBback();
        }
    }

    private static onMapComplete() {
        assetManager.downloader.maxConcurrency = GameSet.maxConcurrency;
        this.mapComplete = true;
    }

    private static callBack: Function;
    static async PlayEffect(t: number | string) {
        ChangeScenePanel.seed++;
        if (typeof (t) == "number") {
            ChangeScenePanel.delay = t;
            EventMgr.off(Evt_Map_Tile_Complete, this.onMapComplete, this);
        } else {
            ChangeScenePanel.delay = undefined;
            ChangeScenePanel.mapComplete = false;
            EventMgr.once(t, this.onMapComplete, this);
        }
        if (this.callBack) {
            let callBback = this.callBack;
            this.callBack = undefined;
            callBback();
        }
        let promise = new Promise((resolve, reject) => {
            this.callBack = resolve;
        })
        this.ShowTop();
        return promise;
    }

    protected onShow(): void {
        this.effect.getComponent(Widget).top = -GameSet.StatusBarHeight;
    }

    public flush() {
        this.effect.setAnimation(0, "show", false);
        AudioMgr.playSound("change_scene", false);
    }

    protected onHide(...args: any[]): void {
        this.runCallBack();
    }
}