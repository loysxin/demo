import { Node, Button, Label, Sprite, path, SpriteFrame, find } from "cc";
import { Panel } from "../../GameRoot";
import { ResMgr, folder_head_card, folder_head_round, folder_icon } from "../../manager/ResMgr";
import { HomeUI } from "../home/panel/HomeUI";
import { BattleReadyLogic } from "../../battle/Ready/BattleReadyLogic";
import PlayerData, { FightState, SPlayerDataItem, SPlayerDataRole, SThing } from "../roleModule/PlayerData";
import { EventMgr, Evt_LootPlunder } from "../../manager/EventMgr";
import { LootPanel } from "./LootPanel";
import { LootVsPanel } from "./LootVsPanel";
import { CardQuality, CfgMgr, ThingType } from "../../manager/CfgMgr";
import { AutoScroller } from "../../utils/AutoScroller";
import { UpdateBagItem } from "../common/BaseUI";
import { LootVsBuyNumPanel } from "./LootVsBuyNumPanel";
import { Tips } from "../login/Tips";
import { BagItem } from "../bag/BagItem";


export class LootRoleInfoPanel extends Panel {
    protected prefab: string = "prefabs/panel/loot/LootRoleInfoPanel";
    private headIcon: Sprite;
    private roleNameLab: Label;
    private powerLab: Label;
    private pointLab: Label;
    private nameLab: Label;
    private upgradeBtn: Node;
    private empty: Node;
    private defendList: AutoScroller;
    private awardList: AutoScroller;
    private playerData;

    protected onLoad() {
        this.CloseBy("closeBtn");
        this.CloseBy("mask");
        this.headIcon = this.find(`infoCont/headIcon`, Sprite);
        this.roleNameLab = this.find(`infoCont/roleNameLab`, Label);
        this.powerLab = this.find(`infoCont/powerLab`, Label);
        this.pointLab = this.find(`infoCont/pointLab`, Label);
        this.nameLab = this.find(`infoCont/nameLab`, Label);
        this.defendList = this.find(`defendCont/defendList`, AutoScroller);
        this.awardList = this.find(`awardCont/awardList`, AutoScroller);
        this.upgradeBtn = this.find(`upgradeBtn`);
        this.empty = this.find(`defendCont/empty`);
        this.onBtnEvent();
        this.defendList.SetHandle(this.setDefendList.bind(this))
        this.awardList.SetHandle(this.UpdateBagItem.bind(this))
    }

    private onBtnEvent() {
        this.upgradeBtn.on(Button.EventType.CLICK, this.onClickLoot, this);
    }

    protected onShow(): void {
        EventMgr.on(Evt_LootPlunder, this.onGetBattleData, this);
    }

    public flush(...args: any[]): void {
        this.playerData = args[0];
        this.onInitInfo();
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_LootPlunder, this.onGetBattleData, this);
    }

    private async onInitInfo() {
        if (this.playerData.player_icon_url) this.headIcon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_head_round, this.playerData.player_icon_url, "spriteFrame"), SpriteFrame);
        this.nameLab.string = this.playerData.player_name;

        let homeLandMsg = CfgMgr.GetHomeLandInit(this.playerData.buildings[0].id);
        if (homeLandMsg) {
            this.roleNameLab.string = `Lv.${homeLandMsg.Level}`;
        } else {
            this.roleNameLab.string = `Lv.${this.playerData.buildings[0].level}`;
        }
        if (this.playerData.defense_lineup) {
            let datas = []
            this.playerData.defense_lineup.forEach((element) => {
                this.playerData.roles.forEach((element2) => {
                    if (element.role_id == element2.id) {
                        datas.push(element2);
                    }
                })
            });
            this.defendList.UpdateDatas(datas);
            this.empty.active = false
        } else {
            this.defendList.UpdateDatas([]);
            this.empty.active = true
        }

        let data = this.playerData;
        this.powerLab.string = this.playerData.battle_power
        PlayerData.LootMatchList.forEach((curData) => {
            if (curData.player_id == this.playerData.player_id) {
                this.pointLab.string = curData.score;
            }
        })
        let datas: SThing[] = PlayerData.GetLootAwardThings(data);
        this.awardList.UpdateDatas(datas);
    }
    private async setDefendList(item: Node, role: SPlayerDataRole, index: number) {
        let std = CfgMgr.GetRole()[role.type];
        let qualBg = find(`qualBg`, item).getComponent(Sprite);
        let icon = find(`icon`, item).getComponent(Sprite);
        let quality = find(`typeIcon`, item).getComponent(Sprite);
        qualBg.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[role.quality] + "_bag_bg", "spriteFrame"), SpriteFrame);
        icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_head_card, std.Icon, "spriteFrame"), SpriteFrame);
        quality.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_icon, "quality", CardQuality[role.quality], "spriteFrame"), SpriteFrame);
    }

    private onClickLoot() {
        let callBack = () => {
            HomeUI.Hide();
            if (!BattleReadyLogic.ins)
                new BattleReadyLogic();
            // pvp 防守方玩家数据
            let defData = {
                player_id: this.playerData.player_id,
                type: FightState.PvP,
                homeland_id: this.playerData.homeland_id,
                buildings: this.playerData.buildings,
                battle_power: this.playerData.battle_power,
                icon: this.playerData.icon,
                defense_lineup: this.playerData.defense_lineup,
                roles: this.playerData.roles
            }
            BattleReadyLogic.ins.RealyBattle(defData);
            this.Hide();
            LootPanel.Hide();
            LootVsPanel.Hide();
        }
        if (PlayerData.LootPlayerData.match_count <= 0) {
            return LootVsBuyNumPanel.ShowTop(callBack.bind(this));
        }
        callBack();
        // if (!data) return;
    }

    private async UpdateBagItem(item: Node, data: SPlayerDataItem | SThing) {
        let bagItem = item.getComponent(BagItem);
        if (!bagItem) bagItem = item.addComponent(BagItem);
        item.getComponent(BagItem).setIsShowSelect(false);
        bagItem.SetData(data);
    }

    private onGetBattleData(data: any) {
    }
}