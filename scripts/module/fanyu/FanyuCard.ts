import { Component, Label, Node, Sprite, SpriteFrame, path, sp } from "cc";
import { AutoScroller } from "../../utils/AutoScroller";
import { SPlayerDataRole, } from "../roleModule/PlayerData";
import { CardQuality, CfgMgr } from "../../manager/CfgMgr";
import { ResMgr, folder_icon, folder_quality } from "../../manager/ResMgr";

export class FanyuCard extends Component {

    private frame: Sprite;
    private typeIcon: Sprite;
    private quality: Sprite;
    private level: Label;
    private body: sp.Skeleton;
    private skillScroller: AutoScroller;

    protected $loadSub: Promise<any>;
    protected complete: Function;
    protected hasLoad = false;

    protected onLoad(): void {
        this.frame = this.node.getChildByName("bg").getComponent(Sprite);
        this.typeIcon = this.node.getChildByName("type").getComponent(Sprite);
        this.quality = this.node.getChildByName("quality").getComponent(Sprite);
        this.level = this.node.getChildByName("level").getComponent(Label);
        this.body = this.node.getChildByName("body").getComponent(sp.Skeleton);
        this.skillScroller = this.node.getChildByName("skills").getComponent(AutoScroller);

        this.node.getChildByName("layout").active = false;
        this.node.getChildByName("power").active = false;

        this.skillScroller.SetHandle(this.updateSkill.bind(this));
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

    private updateSkill(item: Node, data: any) {

    }

    /**
     * 是否主卡
     * @param value 
     */
    async SetMain(value: boolean) {
        if (!this.hasLoad) await this.loadSub;
        let node = this.node.getChildByName("state");
        if (!node) return;
        let state = node.getComponent(Sprite);
        state.node.active = true;
        if (value) {
            state.spriteFrame = await ResMgr.LoadResAbSub("sheets/fanyu/主/spriteFrame", SpriteFrame);
        } else {
            state.spriteFrame = await ResMgr.LoadResAbSub("sheets/fanyu/副/spriteFrame", SpriteFrame);
        }
    }

    /**
     * 设置角色数据
     * @param role 
     */
    async SetData(role: SPlayerDataRole) {
        // if (!this.hasLoad) await this.loadSub;
        this.level.string = "";
        this.quality.spriteFrame = null;
        this.frame.grayscale = true;
        this.body.node.active = false;
        this.typeIcon.node.active = false;
        this.quality.node.active = false;
        this.skillScroller.node.active = false;
        if (!role) {
            return;
        }
        this.frame.grayscale = false;
        this.body.node.active = true;
        this.typeIcon.node.active = true;
        this.quality.node.active = true;

        let std = CfgMgr.GetRole()[role.type];
        let stdquality = CfgMgr.GetRoleQuality(role.type, role.quality);
        let stdlv = CfgMgr.GetRoleLevel(role.type, role.level);

        if (stdquality) {
            this.frame.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[stdquality.QualityType] + "_card", "spriteFrame"), SpriteFrame);
        } else {
            this.frame.grayscale = true;
        }
        this.typeIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "pos" + std.PositionType, "spriteFrame"), SpriteFrame);
        if (role.quality) {
            this.quality.node.active = true;
            this.quality.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_quality, CardQuality[role.quality], "spriteFrame"), SpriteFrame);
        } else {
            this.quality.node.active = false;
        }
        this.level.string = "Lv." + role.level;
        let prefab = std.Prefab;
        let scale = std.Scale || 1;
        this.body.node.setScale(0.3 * scale, 0.3 * scale);
        this.body.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role", prefab, prefab), sp.SkeletonData);
        this.body.setAnimation(0, "Idle", true);
    }
}