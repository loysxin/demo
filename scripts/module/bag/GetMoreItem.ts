import { Button, Component, Label, Node, Sprite, SpriteFrame, path } from "cc";
import { ResMgr, folder_item } from "../../manager/ResMgr";
import { Fetch } from "../../manager/CfgMgr";

export class GetMoreItem extends Component {

    private item_bg: Sprite;
    private item_icon: Sprite;
    private item_name: Label;
    private tips: Label;
    private btn_go: Button;
    private callBack: Function;
    private data: Fetch;

    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;

    protected onLoad(): void {
        this.item_bg = this.node.getChildByName("item_bg").getComponent(Sprite);
        this.item_icon = this.node.getChildByPath("item_bg/item_icon").getComponent(Sprite);
        this.item_name = this.node.getChildByName("item_name").getComponent(Label);
        this.tips = this.node.getChildByName("tips").getComponent(Label);
        this.btn_go = this.node.getChildByName("btn_go").getComponent(Button);
        this.btn_go.node.on(Button.EventType.CLICK, this.onGoTo, this)
        this.hasLoad = true;
        this.complete?.();
    }

    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
    }

    async setData(data: Fetch, callback: Function) {
        if (!this.hasLoad) await this.loadSub;
        this.data = data;
        this.callBack = callback;
        let icon_url = path.join(folder_item, data.Icon, "spriteFrame");
        this.item_icon.spriteFrame = await ResMgr.LoadResAbSub(icon_url, SpriteFrame);
        this.item_name.string = data.WinName;
        this.tips.string = data.Desc;
    }

    private onGoTo() {
        let callBack = this.callBack;
        this.callBack = undefined;
        callBack?.(this.data);

    }




}