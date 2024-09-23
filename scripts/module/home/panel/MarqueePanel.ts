import { Node, RichText, Tween, UIOpacity, UITransform, Vec2, Vec3, easing, tween } from "cc";
import { Panel } from "../../../GameRoot";
import PlayerData from "../../roleModule/PlayerData";

export class MarqueePanel extends Panel {
    protected prefab: string = "prefabs/ui/MarqueePanel";
    private speaceX = 50;

    private label: RichText;
    private bar: Node;

    protected onLoad(): void {
        this.bar = this.find(`bar`);
        this.label = this.find("bar/Mask/Label", RichText);
        this.bar.setScale(new Vec3(0, 1, 1));
        // this.CloseBy("bg");
    }

    protected onShow(): void {

    }

    public flush(): void {
        // this.SetLabelAction()
        this.showAction();
        // console.log(PlayerData.TipsList)
    }

    private SetLabelAction() {
        let x = this.label.node.parent.getComponent(UITransform).width + this.speaceX;
        this.label.node.setPosition(new Vec3(x, 0, 1));
        let timeScle = 1;
        let speed = PlayerData.TipsList[0].speed;
        this.label.string = PlayerData.TipsList[0].content;
        switch (speed) {
            case 1:
                timeScle = 2;
                break;
            case 2:
                timeScle = 1;
                break;
            case 3:
                timeScle = 3;
                break;
        }
        let time = 3 * timeScle;
        let end = new Vec3(-x - this.label.node.getComponent(UITransform).width - this.speaceX, 0, 1);
        // console.log(time)
        tween(this.label.node).by(time, { position: end }).call(() => {
            // console.log(PlayerData.TipsList)
            PlayerData.TipsList.shift();
            if (PlayerData.TipsList.length > 0) {
                this.SetLabelAction();
            } else {
                this.hideAction();
            }
        }).start()
    }

    protected onHide(...args: any[]): void {
        this.bar.setScale(new Vec3(0, 1, 1));
    }

    private showAction() {
        if (PlayerData.TipsList.length <= 0) {
            return this.Hide();
        }
        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacity);
        Tween.stopAllByTarget(this.bar);
        opacity.opacity = 0;
        tween(opacity).to(.2, { opacity: 255 }).start();
        tween(this.bar).to(.2, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut }).call(this.SetLabelAction.bind(this)).start();
    }

    private hideAction() {
        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) opacity = this.node.addComponent(UIOpacity);
        Tween.stopAllByTarget(opacity);
        Tween.stopAllByTarget(this.bar);
        tween(this.bar).to(.2, { scale: new Vec3(0, 1, 1) }, { easing: easing.backIn }).call(() => {
            opacity.opacity = 255;
            tween(opacity).to(.2, { opacity: 0 }).start();
            this.Hide();
        }).start();
    }
}