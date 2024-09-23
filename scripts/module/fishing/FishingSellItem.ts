import { Component, Label, Node, path, Sprite, SpriteFrame } from "cc";
import { ConsumeItem } from "../common/ConsumeItem";
import { SFishingItem, SThing } from "../roleModule/PlayerData";
import { CfgMgr, StdFishItem, ThingType } from "../../manager/CfgMgr";
import { folder_icon, ResMgr } from "../../manager/ResMgr";
import { ItemUtil } from "../../utils/ItemUtils";
import { formatNumber } from "../../utils/Utils";
export class FishingSellItem extends Component {
    private nameLab: Label;
    private icon:Sprite;
    private weightLab:Label;
    private rainbowItem: ConsumeItem;
    private select:Node;
    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;
    private data:SFishingItem;
    protected onLoad(): void {
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.icon = this.node.getChildByName("icon").getComponent(Sprite);
        this.weightLab = this.node.getChildByName("weightLab").getComponent(Label);
        this.rainbowItem = this.node.getChildByName("rainbowItem").addComponent(ConsumeItem);
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
    
    async SetData(data:SFishingItem) {
        if (!this.hasLoad) await this.loadSub;
        this.data = data;
        this.icon.node.active = false;
        let std:StdFishItem = CfgMgr.GetFishItem(this.data.fish_id);
        this.nameLab.string = std.Fishsname;
        let url = path.join(folder_icon, `fish/${std.Icon}`, "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.icon.node.active = true;
            this.icon.spriteFrame = res;
        });
        this.weightLab.string = formatNumber(this.data.weight, 2 );
        let thing:SThing = ItemUtil.CreateThing(ThingType.ThingTypeCurrency, 0, this.data.weight);
        this.rainbowItem.SetData(thing);
    }
}