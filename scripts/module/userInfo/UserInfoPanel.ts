import { Button, Label, Sprite, Toggle } from "cc";
import { Panel } from "../../GameRoot";
import PlayerData, { SPlayerData, SPlayerViewInfo } from "../roleModule/PlayerData";
import LocalStorage from "../../utils/LocalStorage";
import { MsgPanel } from "../common/MsgPanel";
import { UserEditInfoPanel } from "./UserEditInfoPanel";
import { EventMgr, Evt_UserDataChange } from "../../manager/EventMgr";
import { CopyToClip } from "../../Platform";
import { UserHeadPanel } from "./UserHeadPanel";
import { HeadItem } from "../common/HeadItem";

export class UserInfoPanel extends Panel {
    protected prefab: string = "prefabs/panel/userInfo/UserInfoPanel";
    private head:HeadItem;
    private changeHeadBtn:Button;
    private nameLab:Label;
    private editNameBtn:Button;
    private uidLab:Label;
    private copyUidBtn:Button;
    private hideToggle:Toggle;
    private weiXinNumLab:Label;
    private weiXinBtn:Button;
    private weiXinBtnLab:Label;
    private qqNumLab:Label;
    private qqBtn:Button;
    private qqBtnLab:Label;
    private _playerData:SPlayerViewInfo;
    protected onLoad(): void {
        this.head = this.find('HeadItem').addComponent(HeadItem);
        this.changeHeadBtn = this.find("changeHeadBtn", Button);
        this.nameLab = this.find("nameCont/nameLab", Label);
        this.editNameBtn = this.find("nameCont/editNameBtn", Button);
        this.uidLab = this.find("UIDCont/uidLab", Label);
        this.copyUidBtn = this.find("UIDCont/copyUidBtn", Button);
        this.hideToggle = this.find("hideToggle", Toggle);
        this.weiXinNumLab = this.find("weiXinCont/weiXinNumLab", Label);
        this.weiXinBtn = this.find("weiXinCont/weiXinBtn", Button);
        this.weiXinBtnLab = this.find("weiXinCont/weiXinBtn/weiXinBtnLab", Label);
        this.qqNumLab = this.find("qqCont/qqNumLab", Label);
        this.qqBtn = this.find("qqCont/qqBtn", Button);
        this.qqBtnLab = this.find("qqCont/qqBtn/qqBtnLab", Label);
        this.CloseBy("mask");
        this.changeHeadBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.editNameBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.copyUidBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.weiXinBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.qqBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.hideToggle.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
    }
    public flush(playerData:SPlayerViewInfo = null): void {
        this._playerData = playerData;
        if(!this._playerData){
            this._playerData = {
                player_id:PlayerData.roleInfo.player_id,
                name:PlayerData.roleInfo.name,
                _weChatNumber:PlayerData.roleInfo.weChatNum,
                _qqNumber:PlayerData.roleInfo.qqNum,
            };
        }
        
        this.head.SetData(this._playerData);
        this.updateView();
    }
    
    protected onShow(): void {
        EventMgr.on(Evt_UserDataChange, this.onUserDataChange, this);
    }

    protected onHide(...args: any[]): void {
        EventMgr.off(Evt_UserDataChange, this.onUserDataChange, this);
    }
    private onUserDataChange():void{
        if(!this.node.activeInHierarchy) return;
        this.updateView();
    }
    private onToggleChange(t:Toggle):void{
        this.hideToggle.isChecked = true;
        MsgPanel.Show("暂不支持开放显示");
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.changeHeadBtn:
                UserHeadPanel.Show();
                if(this.isOwn){
                    MsgPanel.Show("功能暂未开启");
                    return;
                }
                break;
            case this.editNameBtn:
                
                UserEditInfoPanel.Show(1);
                break;
            case this.copyUidBtn:
                let uidStr:string = this.uidLab.string;
                CopyToClip(uidStr, (desc: string) => {
                    if (desc != undefined || desc != null) {
                        MsgPanel.Show("已复制到粘贴板");
                    }
                });
                break;
            case this.weiXinBtn:
                UserEditInfoPanel.Show(2);
                break;
            case this.qqBtn:
                UserEditInfoPanel.Show(3);
                break;
        }
    }
    private updateView():void{
        let weiXinStr:string = "未设置";
        let qqStr:string = "未设置";
        let isHide:boolean = true;//是否隐藏联系方式
        //查看自己
        if(this.isOwn){
            isHide = true;
            this.hideToggle.node.active = true;
            this.hideToggle.isChecked = isHide;
            this.editNameBtn.node.active = true;
            this.changeHeadBtn.node.active = true;
            this.hideToggle.interactable = true;
            let myWeChat:string = LocalStorage.GetPlayerData(PlayerData.playerIdKey, "UserWeChat");
            let myQQ:string = LocalStorage.GetPlayerData(PlayerData.playerIdKey, "UserQQ");
            if(myWeChat){
                weiXinStr = myWeChat;
            }
            if(myQQ){
                qqStr = myQQ;
            }
            this.weiXinBtnLab.string = "编辑";
            this.qqBtnLab.string = "编辑";
        }else{
            isHide = true;
            this.hideToggle.node.active = false;
            this.editNameBtn.node.active = false;
            this.weiXinBtnLab.string = "复制";
            this.qqBtnLab.string = "复制";
            if(isHide){
                qqStr = "********";
                weiXinStr = "********";
                this.weiXinBtn.node.active = false;
                this.qqBtn.node.active = false;
            }else{
                this.weiXinBtn.node.active = true;
                this.qqBtn.node.active = true;
            }
            this.changeHeadBtn.node.active = false;
            this.hideToggle.interactable = false;
        }
        
        this.nameLab.string = this._playerData.name;
        this.uidLab.string = this._playerData.player_id.toString();
        if(this._playerData._weChatNumber) weiXinStr = this._playerData._weChatNumber;
        if(this._playerData._qqNumber) qqStr = this._playerData._qqNumber;
        this.weiXinNumLab.string = weiXinStr;
        this.qqNumLab.string = qqStr;
    }
    /**
     * 是否自己
     */
    private get isOwn():boolean{
        return this._playerData.player_id == PlayerData.roleInfo.player_id;
    }
}