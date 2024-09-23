import { Input, LODGroup, Label, Node, Sprite, SpriteFrame, Tween, UITransform, Vec3, tween, v3 } from "cc";
import { GameObj } from "../../../GameRoot";
import { BuildingType } from "../HomeStruct";
import { ResMgr, folder_home } from "../../../manager/ResMgr";
import { SpriteLabel } from "../../../utils/SpriteLabel";
import { Building } from "./Building";
import { HomeScene } from "../HomeScene";
import { Convert, ConvertNode, formatNumber } from "../../../utils/Utils";

export class Add extends GameObj {
    protected $prefab: string = "prefabs/ui/Add";
    private bg: UITransform;
    private icon: Sprite;
    private label: Label;
    private initx: number;
    private inity: number;
    private initw: number;
    private inith: number;
    protected onLoad(): void {
        super.onLoad();
        this.bg = this.find("bg").getComponent(UITransform);
        this.initw = this.bg.contentSize.width;
        this.inith = this.bg.contentSize.height;
        this.icon = this.find("icon", Sprite);
        this.label = this.find("label", Label);
        this.label.cacheMode = Label.CacheMode.BITMAP;
        this.initx = this.label.node.position.x;
        this.inity = this.label.node.position.y;
        // this.on(Node.EventType.PARENT_CHANGED, this.onEnd, this);
    }

    protected update(dt: number): void {
        let [x, y] = Convert(this.initx, this.inity + 5, this.icon.node.parent, this.label.node.parent);
        this.label.node.setPosition(x, y);
        let dw = this.label.getComponent(UITransform).contentSize.width - 64.3125;
        this.bg.setContentSize(this.initw + dw, this.inith);
    }

    async Init(type: number, value: number) {
        Tween.stopAllByTarget(this);
        // this.setPosition(0, 600);
        // tween(this as Node).to(1, { position: new Vec3(0, 800, 0) }).call(
        //     this.onEnd.bind(this)
        // ).start();

        if (!this.$hasLoad) await this.loadSub;
        let thisObj = this;
        let p = this.position;
        tween(this as Node).to(1, { position: v3(p.x, p.y + 100, p.z) }).call(() => {
            thisObj.onEnd();
        }).start();
        HomeScene.ins.AddLab(this.label.node);
        this.label.string = `+${formatNumber(value, 2)}`;
        let dw = this.label.getComponent(UITransform).contentSize.width - 64.3125;
        this.bg.setContentSize(this.initw + dw, this.inith);
        let url: string;
        switch (type) {
            case BuildingType.cai_kuang:
                url = folder_home + "/rock/spriteFrame";
                break;
            case BuildingType.cai_mu:
                url = folder_home + "/wood/spriteFrame";
                break;
            case BuildingType.cai_shui:
                url = folder_home + "/water/spriteFrame";
                break;
            case BuildingType.hua_fang:
                url = folder_home + "/seed/spriteFrame";
                break;
        }
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(url, SpriteFrame);
    }

    private onEnd(e?: any) {
        if (e) {
            console.log("onEnd", e);
        }
        Tween.stopAllByTarget(this);
        this.parent && this.parent.removeChild(this);
        this.label.node.parent && this.label.node.parent.removeChild(this.label.node);
        if (loop.indexOf(this) == -1) loop.push(this);
    }
}

let loop: Add[] = [];

export function PlayAddRes(building: Building, type: number, value: number, offsetX: number = 0, offsetY: number = 0) {
    if (value <= 0) return;
    let stateBar = building['stateBar'];
    if (!stateBar) return;

    let item: Add;
    if (!building.prefabNode) return;
    if (loop.length) {
        item = loop.shift();
    } else {
        item = Add.Create();
    }

    //let [x, y] = ConvertNode(stateBar, building);
    item.setPosition(building.position.x + offsetX, building.position.y + offsetY);
    HomeScene.ins.AddBar(item);
    item.Init(type, value);
}