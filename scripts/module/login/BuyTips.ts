import { Input, Label, Node, path, Sprite, SpriteFrame } from "cc";
import { Panel } from "../../GameRoot";
import { ResMgr } from "../../manager/ResMgr";

export class BuyTips extends Panel {
    protected prefab: string = "prefabs/ui/BuyTips";
    private title: Label;
    private info1: Label;
    private info2: Label;
    private money: Label;
    private icon1: Sprite;
    private icon2: Sprite;
    private count: Label;
    private buyBtn: Node;
    private okCallback: Function;
    private btnCount: Label;
    protected onLoad(): void {
        this.title = this.find("title", Label);
        this.info1 = this.node.getChildByPath("content/Label").getComponent(Label);
        this.info2 = this.node.getChildByPath("numCont/numLab").getComponent(Label);
        this.money = this.node.getChildByPath("content/info/money").getComponent(Label);
        this.icon1 = this.node.getChildByPath("content/info/money/icon").getComponent(Sprite);
        this.icon2 = this.node.getChildByPath("content/info/money/Label/icon2").getComponent(Sprite);
        this.count = this.icon2.node.getChildByName("count").getComponent(Label);
        this.btnCount = this.node.getChildByPath("buyBtn/ConsumeItem/numLab").getComponent(Label);
        this.buyBtn = this.find("buyBtn");
        this.buyBtn.on(Input.EventType.TOUCH_END, this.onOk, this);
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
    }

    protected onShow(): void {

    }
    public flush(msg, okCallBack?: Function): void {
        this.title.string = msg.title? msg.title : "提示";
        this.info1.string = msg.info1? msg.info1 : "";
        this.info2.string = msg.info2? msg.info2 : "";
        this.money.string = msg.money? `x${msg.money}` : "";
        this.count.string = msg.count? `x${msg.count}` : "";
        this.btnCount.string = msg.money? msg.money : "";
        this.okCallback = okCallBack;
        this.buyBtn.active = true;
        this.LoadIcon(msg.icon1, this.icon1);
        this.LoadIcon(msg.icon2, this.icon2);
    }

    private async LoadIcon(url: string, sprite: Sprite) {
        if (url) {
            let icon = await ResMgr.LoadResAbSub<SpriteFrame>(path.join(url, "spriteFrame"), SpriteFrame);;
            sprite.spriteFrame = icon;
        }
    }

    protected onHide(...args: any[]): void {
        this.okCallback = undefined;
    }
    private onOk() {
        this.okCallback && this.okCallback();
        this.Hide();
    }
}