import { Button, Color, Component, EventTouch, Input, Label, Node, Slider, Sprite, SpriteFrame, Toggle, UIOpacity, UITransform, Vec3, instantiate, path, sp, v3 } from "cc";
import { MsgTypeSend } from "../../MsgType";
import { Session } from "../../net/Session";
import PlayerData, { SDownlineInfo, SGetAgentInfo, SIncomesInfo, SPlayerData, SPlayerDataRole, SPlayerDataTask, SRoleAssistData, STaskState } from "../roleModule/PlayerData";
import { ResMgr, folder_head_card, folder_head_round, folder_icon, quality_color } from "../../manager/ResMgr";
import { SelectHeroPanel } from "../common/SelectHeroPanel";
import { CardQuality, CfgMgr, StdCommonType, StdRole } from "../../manager/CfgMgr";
import { Mathf, ToFixed, formatNumber } from "../../utils/Utils";
import { Tips } from "../login/Tips";

export class FriendHelpItem extends Component {

    private help_num: Label;

    private quality: Sprite;
    private addBtn: Node;
    private spine: sp.Skeleton;
    private lock: Node;
    private lv: Label;

    private unlockNode: Node;
    private cost_num: Label;
    private Slider: Slider;
    private progress: Node;
    private cost_consumeNum: Label;
    private cost_hasNum: Label;
    private confirmBtn: Button;
    private left: Node;
    private right: Node
    private income_num: Label;

    private lockNode: Node;
    private unlock_cost: Label;
    private unlockBtn: Node;
    private tips: Node;

    //助战配置
    private cfgData
    private select_fee = 0;
    private maxCount = 0;
    private minCount = 0;
    private all_unlock_coun = 0;
    private role: SPlayerDataRole;
    private time: number;
    private dt: number = 0.01;
    private touchIndex = 0;
    private touchTime = 0;
    private pos: number;
    private unlock_cost_num: number = 0;
    private info: SGetAgentInfo;

    protected complete: Function;
    protected hasLoad = false;
    protected $loadSub: Promise<any>;

    protected get loadSub() {
        if (this.$loadSub) return this.$loadSub;
        let thisObj = this;
        this.$loadSub = new Promise((resolve, reject) => {
            thisObj.complete = resolve;
        });
        return this.$loadSub;
    }

    protected onLoad(): void {
        // let tittle = this.node.getChildByPath("frame/tittle_bg/tittle").getComponent(Label);
        // let help = this.node.getChildByPath("frame/tittle_bg/lblNode/help").getComponent(Label);
        this.help_num = this.node.getChildByPath("frame/tittle_bg/lblNode/help_num").getComponent(Label);
        this.quality = this.node.getChildByPath("frame/Node/quality").getComponent(Sprite);
        this.addBtn = this.node.getChildByPath("frame/Node/addBtn");
        this.spine = this.node.getChildByPath("frame/Node/spine").getComponent(sp.Skeleton);
        this.lock = this.node.getChildByPath("frame/Node/lock");
        this.lv = this.node.getChildByPath("frame/Node/lv").getComponent(Label);

        this.unlockNode = this.node.getChildByPath("frame/unlockNode");
        this.cost_num = this.node.getChildByPath("frame/unlockNode/help_cost_bg/bg/cost_bg/cost_num").getComponent(Label);
        this.income_num = this.node.getChildByPath("frame/unlockNode/help_cost_bg/incomeNode/income_num").getComponent(Label);
        this.Slider = this.node.getChildByPath("frame/unlockNode/page1/Slider").getComponent(Slider);
        this.progress = this.node.getChildByPath("frame/unlockNode/page1/Slider/progress");
        this.confirmBtn = this.node.getChildByPath("frame/unlockNode/page1/confirmBtn").getComponent(Button);
        this.left = this.node.getChildByPath("frame/unlockNode/page1/left");
        this.right = this.node.getChildByPath("frame/unlockNode/page1/right");

        this.lockNode = this.node.getChildByPath("frame/lockNode");
        this.unlock_cost = this.node.getChildByPath("frame/lockNode/bg/incomeNode/unlock_cost").getComponent(Label);
        this.unlockBtn = this.node.getChildByPath("frame/lockNode/unlockBtn");
        this.tips = this.node.getChildByPath("frame/lockNode/tips");

        // this.addBtn.on(Input.EventType.TOUCH_START, this.onSelsectHero, this);
        this.node.getChildByPath("frame/Node").on(Input.EventType.TOUCH_END, this.onSelsectHero, this);
        this.Slider.node.on('slide', this.onSlider, this);
        this.left.on(Input.EventType.TOUCH_END, this.onDel, this);
        this.right.on(Input.EventType.TOUCH_END, this.onAdd, this);
        this.left.on(Input.EventType.TOUCH_START, () => { this.onTouchStart(1) }, this);
        this.right.on(Input.EventType.TOUCH_START, () => { this.onTouchStart(2) }, this);
        this.confirmBtn.node.on("click", this.onConfirmBtn, this);
        this.unlockBtn.on("click", this.onUnlockBtn, this);
        this.hasLoad = true;
        this.complete?.();
    }

    /**好友列表数据 */
    async setData(data: { islock: boolean, lockCost: number, all_unlock_coun: number, assistInfo: SRoleAssistData, role: SPlayerDataRole, }, info?: SGetAgentInfo) {
        if (!this.hasLoad) await this.loadSub;
        this.maxCount = 0;
        this.info = info;
        if (this.time) {
            clearInterval(this.time);
        } else {
            this.time = setInterval(this.updateLayer.bind(this), 20);
        }
        this.pos = data.assistInfo.slot
        let is_lock = data.islock
        this.addBtn.active = is_lock;
        this.lock.active = !is_lock
        this.unlockNode.active = is_lock
        this.lockNode.active = !is_lock
        if (info && info.assist_roles_slots < data.all_unlock_coun) {
            this.tips.active = true;
            this.unlockBtn.active = false;
        } else {
            this.tips.active = false;
            this.unlockBtn.active = true;
        }

        this.spine.node.active = false;
        let _cost_num = 0;
        let _daily_income = 0;
        if (is_lock) {
            let cfg = CfgMgr.GetCommon(StdCommonType.Friend);

            this.spine.node.active = false;
            this.quality.color = new Color().fromHEX(quality_color[0]);
            if (data.role) {
                this.minCount = cfg.CostRangeMin[data.role.quality - 1];
                this.maxCount = cfg.CostRangeMax[data.role.quality - 1];
                this.spine.node.active = true;
                this.setRole(data.role)
                _cost_num = data.assistInfo.usage_fee;
                _daily_income = data.assistInfo.daily_income;
            } else {
                _cost_num = 0;
                _daily_income = 0;
            }
            //助战费用配置
            this.cost_num.string = _cost_num + "";
            this.select_fee = _cost_num;

            //今日收益
            let shownum = ToFixed(_daily_income, 2);
            this.income_num.string = shownum;
        } else {
            this.unlock_cost.string = data.lockCost + "";
            this.unlock_cost_num = data.lockCost;
        }
        this.all_unlock_coun = data.all_unlock_coun;

        this.help_num.string = data.assistInfo.daily_assist_count + "";
        this.Slider.enabled = this.maxCount > 0;
        this.updateCostProgress();
    }


    private onSelsectHero() {
        if (this.spine.node.active) {
            let data = {
                type: MsgTypeSend.SetAssistRoleRequest,
                data: {
                    role_id: "",
                    slot: this.pos,
                    fee: 0,
                }
            }
            Session.Send(data);
        } else if (this.addBtn.active) {
            let roles: SPlayerDataRole[] = [];
            for (const iterator of PlayerData.GetRoles()) {
                if (!iterator.is_assisting) {
                    roles.push(iterator);
                }
            }
            SelectHeroPanel.SelectHelp(roles, [], 1, this.setHeroIcon.bind(this));
        }
    }

    /**设置助战英雄 */
    private async setHeroIcon(data: SPlayerDataRole[]) {
        if (data && data.length > 0) {
            let role_data = {
                type: MsgTypeSend.SetAssistRoleRequest,
                data: {
                    role_id: data[0].id,
                    slot: this.pos,
                    fee: this.select_fee,
                }
            }
            Session.Send(role_data);
        }
    }

    async setRole(role_data: SPlayerDataRole) {
        if (!role_data) return;
        let std: StdRole = CfgMgr.GetRole()[role_data.type];
        this.quality.color = new Color().fromHEX(quality_color[role_data.quality]);
        // this.spine.node.off(Input.EventType.TOUCH_START);
        // this.spine.node.on(Input.EventType.TOUCH_START, this.onResetHero, this);
        this.spine.node.active = true;
        let scale = std.Scale || 1;
        this.spine.node.setScale(0.4 * scale, 0.4 * scale);
        this.spine.skeletonData = await ResMgr.LoadResAbSub(path.join("spine/role_p", std.Prefab, std.Prefab), sp.SkeletonData);
        this.spine.setAnimation(0, `Idle`, true);

        this.lv.node.active = true;
        this.lv.string = "Lv" + role_data.level;
        this.role = role_data;
    }


    private onDel(event?) {
        this.select_fee -= this.minCount;
        if (this.select_fee < this.minCount) {
            this.select_fee = this.minCount;
        }
        this.updateCostProgress();
        if (event) {
            this.touchIndex = 0;
            this.touchTime = 0;
        }
    }

    private onAdd(event?) {
        this.select_fee += this.minCount;
        if (this.select_fee > this.maxCount) {
            this.select_fee = this.maxCount;
        }
        this.updateCostProgress();
        if (event) {
            this.touchIndex = 0;
            this.touchTime = 0;
        }
    }

    private onSlider(e?: Slider) {
        this.select_fee = this.maxCount * this.Slider.progress;
        if (this.select_fee < this.minCount) {
            this.select_fee = this.minCount;
        }
        this.touchIndex = 0;
        this.touchTime = 0;
        this.updateCostProgress();
    }

    private onConfirmBtn() {
        if (!this.role || !this.role.id) {
            Tips.Show("无助战英雄");
            return;
        }
        let feeData = {
            type: MsgTypeSend.SetAssistRoleUsageFeeRequest,
            data: { role_id: this.role.id, usage_fee: this.select_fee }
        }
        Session.Send(feeData);
    }

    private updateCostProgress() {
        if (this.select_fee == 0) return
        this.select_fee = Math.floor(this.select_fee * 100) / 100
        this.cost_num.string = this.select_fee + "";
        if (this.maxCount == 0) {
            this.Slider.progress = 0
        } else {
            this.Slider.progress = this.select_fee / this.maxCount;
        }
        let size = this.Slider.node.getComponent(UITransform).contentSize;
        this.progress.getComponent(UITransform).setContentSize(this.Slider.progress * size.width, 28);
    }

    private onUnlockBtn() {
        let hasitem = PlayerData.roleInfo.currency
        if (hasitem < this.unlock_cost_num) {
            Tips.Show("彩虹体不足");
            return;
        }
        let unlockData = {
            type: MsgTypeSend.UnlockAssistRoleSlotRequest,
            data: { new_slot_count: this.all_unlock_coun + 1, }
        }
        Session.Send(unlockData);
    }

    private onTouchStart(index: number) {
        this.touchIndex = index;
    }

    private updateLayer() {
        if (this.touchIndex != 0) {
            this.touchTime += this.dt;
            if (this.touchTime >= 0.3) {
                this.touchTime = 0.28;
                switch (this.touchIndex) {
                    case 1:
                        this.onDel();
                        break;
                    case 2:
                        this.onAdd();
                        break;
                }
            }
        }
    }

    public clearTime() {
        clearInterval(this.time);
    }

}