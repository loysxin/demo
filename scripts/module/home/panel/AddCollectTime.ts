import { _decorator, Button, Component, game, Input, Label, Node, RichText, tween, Tween, v3 } from 'cc';
import { Panel } from '../../../GameRoot';
import { countDown } from '../../../utils/Utils';
import Logger from '../../../utils/Logger';
import PlayerData, { SAdvister } from '../../roleModule/PlayerData';
import { AdvisterId, CfgMgr, StdAdvister } from '../../../manager/CfgMgr';
import { SetNodeGray } from '../../common/BaseUI';
import { MsgPanel } from '../../common/MsgPanel';
import { AdActionResult, AdHelper } from '../../../AdHelper';
import { getAdcfg, getQbAdCfg } from '../../../Platform';
import { EventMgr, Evt_AdvisterUpdate, Evt_Collect_Update, Evt_Res_Update } from '../../../manager/EventMgr';
import { Tips } from '../../login/Tips';
import { DateUtils } from '../../../utils/DateUtils';
import { GameSet } from '../../GameSet';
const { ccclass, property } = _decorator;

@ccclass('AddCollectTime')
export class AddCollectTime extends Panel {
    protected prefab: string = 'prefabs/home/AddCollectTime';
    close: Node;
    timeStr: Label;
    endTime: number;
    addTimeBtn: Button;
    addTimeBtnLab: Label;
    addTimeIcon: Node;
    addTimeLab: Label;
    private jumpAd:Node
    private _endTime: number;
    private tick = 1;
    protected onLoad(): void {
        this.CloseBy('panel/closeBtn');
        this.CloseBy("mask");
        // this.close.on(Input.EventType.TOUCH_END, this.Hide, this);
        this.addTimeBtn = this.find('panel/addTimeBtn', Button);
        this.jumpAd = this.find('panel/addTimeBtn/cont/icon/jumpAd');
        this.addTimeBtnLab = this.find('panel/addTimeBtn/cont/addTimeBtnlab', Label);
        this.addTimeIcon = this.find('panel/addTimeBtn/cont/icon');
        this.timeStr = this.find('panel/Item1/time').getComponent(Label);
        this.addTimeLab = this.find('panel/addTimeLab', Label);
        this.addTimeBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);

        let time = CfgMgr.Get("Advister_list")[1].AcquisitionTime;
        let desc = Math.floor(time / 3600 * 10) / 10;
        this.find("panel/Item2/desc", RichText).string = "<color=#136E73>补充四种资源的采集时长，每次补充</color><color=#AD470A>" + desc + "小时,</color><color=#136E73>时长不足时采集将停止！</color>";
    }
    protected onShow(): void {
        EventMgr.on(Evt_AdvisterUpdate, this.onAdvisterUpdate, this);
        EventMgr.on(Evt_Collect_Update, this.updateEndTime, this);
        this.updateEndTime();
    }
    protected updateEndTime() {
        this._endTime = PlayerData.nowhomeLand.total_wood_collect_duration;
        this.tick = 1;
    }
    public flush(...args: any[]): void {
        this.updateAddTime();      
        this.jumpAd.active = PlayerData.GetIsActivateRights();
    }
    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_AdvisterUpdate, this.onAdvisterUpdate, this);
        EventMgr.off(Evt_Collect_Update, this.updateEndTime, this);
    }
    private stopAddTime(): void {
        Tween.stopAllByTarget(this.addTimeLab.node);
        this.addTimeLab.node.position = v3(220, 224, 0);
        this.addTimeLab.node.active = false;
    }
    private playAddTime(): void {
        this.stopAddTime();
        this.addTimeLab.node.active = true;
        this.addTimeLab.node.position = v3(220, 224, 0);
        tween(this.addTimeLab.node).to(1, { position: v3(this.addTimeLab.node.position.x, this.addTimeLab.node.position.y + 100, 0) }).call(() => {
            this.addTimeLab.node.active = false;
        }).start();
    }
    private onAdvisterUpdate(): void {
        if (!this.node.activeInHierarchy) return;
        let stdAd: StdAdvister = CfgMgr.GetAdvister(AdvisterId.Advister_1);
        this.addTimeLab.string = "+" + DateUtils.FormatTime(stdAd.AcquisitionTime, "%{hh}:%{mm}:%{ss}");
        this.stopAddTime();
        this.playAddTime();
        this.updateAddTime();
    }
    private updateAddTime(): void {
        //this.updateEndTime();
        let adData: SAdvister = PlayerData.GetAdvisterData(AdvisterId.Advister_1);
        let stdAd: StdAdvister = CfgMgr.GetAdvister(AdvisterId.Advister_1);
        if (adData.count > 0) {
            let cd: number = adData.cdEndTime - game.totalTime;
            if (cd > 0) {
                this.addTimeBtnLab.string = DateUtils.FormatTime(cd / 1000, "%{mm}:%{ss}");
            } else {
                this.addTimeBtnLab.string = `立即补充${adData.count}/${stdAd.Max_numb}`;
            }
            this.addTimeIcon.active = true;
            SetNodeGray(this.addTimeBtn.node, false, true);
        } else {
            this.addTimeBtnLab.string = "已看完";
            SetNodeGray(this.addTimeBtn.node, true, true);
        }

    }
    private async onBtnClick(btn: Button): Promise<void> {

        switch (btn) {
            case this.addTimeBtn:
                let adData: SAdvister = PlayerData.GetAdvisterData(AdvisterId.Advister_1);
                if (adData.count < 1) {
                    MsgPanel.Show("广告已看完");
                    return;
                }
                if (game.totalTime < adData.cdEndTime) {
                    MsgPanel.Show("冷却中，请稍后！");
                    return;
                }
                this.addTimeBtn.interactable = false;
                // SetNodeGray(this.addTimeBtn.node, true, true);
                if(PlayerData.GetIsActivateRights()){
                    AdHelper.JumpAd(AdvisterId.Advister_1, "")
                }else{
                    console.log("AdHelper---> rewardAdId1:", GameSet.globalCfg.ad_channel.rewardAdId1);
                    let action, errorCode, errorMsg;
                    if (Math.abs(GameSet.globalCfg.ad_channel.rewardAdId1) == 1) {
                        [action, errorCode, errorMsg] = await AdHelper.rewardAd(getAdcfg().rewardAdId1, AdvisterId.Advister_1, "");
                    } else {
                        [action, errorCode, errorMsg] = await AdHelper.rewardQbAd(getQbAdCfg().rewardAdId1, AdvisterId.Advister_1, "");
                    }
                    if (action == "onLoadFailed") {
                        if (Math.abs(GameSet.globalCfg.ad_channel.rewardAdId1) == 1) {
                            if (GameSet.globalCfg.ad_channel.rewardAdId1 > 0) GameSet.globalCfg.ad_channel.rewardAdId1 = 2;
                            Tips.Show("广告加载失败，请稍后再试！");
                        } else {
                            if (GameSet.globalCfg.ad_channel.rewardAdId1 > 0) GameSet.globalCfg.ad_channel.rewardAdId1 = 1;
                            Tips.Show("广告展示失败，请稍后再试！");
                        }
                    } else {
                        // SetNodeGray(this.addTimeBtn.node, false, true);
                    }
                }
                PlayerData.SetAdvisterCd(AdvisterId.Advister_1);
                this.addTimeBtn.interactable = true;
                break;
        }
    }


    protected update(dt: number): void {
        this.tick += dt;
        if (this.tick >= 1) {
            this.tick = 0;
            let residueTime: number = Math.max(this._endTime, 0);
            this._endTime--;
            this.timeStr.string = DateUtils.FormatTime(residueTime, "%{hh}:%{mm}:%{ss}");
        }


        this.updateAddTime();
    }

    advPlay() {
        Logger.log('播放广告------>>>>>')
    }

}


