import { Color, Component, Label, Node, Sprite, SpriteFrame, Toggle, path, sp } from "cc";
import { SDownlineInfo } from "../roleModule/PlayerData";
import { SetLabelColor } from "../../utils/Utils";
export class FanyuUpSelectFriendItem extends Component {

    private hightlight: Sprite;
    private icon: Sprite;
    private playerName: Label;
    private activity: Node;
    private activity_num: Label;
    private suss_num: Label;
    private toggle: Toggle;

    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;

    protected onLoad(): void {
        this.hightlight = this.node.getChildByName("hightlight").getComponent(Sprite);
        this.icon = this.node.getChildByPath("icon_bg/icon").getComponent(Sprite);
        this.playerName = this.node.getChildByPath("LabelNode/playerName").getComponent(Label);
        this.activity = this.node.getChildByPath("LabelNode/Node/activity");
        this.activity_num = this.node.getChildByPath("LabelNode/Node/activity/activity_num").getComponent(Label);
        this.suss_num = this.node.getChildByPath("LabelNode/Node/suss/suss_num").getComponent(Label);
        this.toggle = this.node.getComponent(Toggle);
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

    async setData(data:{info:SDownlineInfo,select: boolean, sussNum: number},  activityValue:number) {
        if (!this.hasLoad) await this.loadSub;
        this.playerName.string = data.info.name
        if(!data.info.is_upline){
            this.activity.active = true;
            this.activity_num.string = (data.info.daily_activity == 0 ? 0 : data.info.daily_activity) + ""
            this.activity_num.color = (data.info.daily_activity >= activityValue ? new Color().fromHEX('4A718D') : new Color().fromHEX('FF0000'))
        }else{
            this.activity.active = false;
        }
        this.suss_num.string = Math.floor(data.sussNum * 100) + "%"
        this.toggle.isChecked = data.select;
    }




}