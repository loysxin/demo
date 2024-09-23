import { Button, game, Label, Toggle, Node} from "cc";
import { Panel } from "../../GameRoot";
import LocalStorage from "../../utils/LocalStorage";
import PlayerData, { SSettingData } from "../roleModule/PlayerData";
import { AudioGroup, AudioMgr } from "../../manager/AudioMgr";
import { AdaptBgTop } from "../common/BaseUI";
import { GameVer } from "../../Platform";
import { EventMgr, Evt_Hide_Home_Ui, Evt_Hide_Scene, Evt_Show_Home_Ui, Evt_Show_Scene } from "../../manager/EventMgr";
import { HomeScene } from "../home/HomeScene";

export class SettingPanel extends Panel {
    protected prefab: string = "prefabs/panel/setting/SettingPanel";
    private backBtn:Button;
    private cont:Node;
    private bgmToggle:Toggle;
    private soundToggle:Toggle;
    private hideUiToggle:Toggle;
    private exitBtn:Button;
    private verLab:Label;
    private readonly HIDE_UI_MAX_TIME:number = 5;
    private hideIsInit:boolean = false;
    protected onLoad(): void {
        this.backBtn = this.find("backBtn", Button);
        this.cont = this.find("cont");
        this.bgmToggle = this.find("cont/bgmToggle", Toggle);
        this.soundToggle = this.find("cont/soundToggle", Toggle);
        this.hideUiToggle = this.find("cont/hideUiToggle", Toggle);
        this.exitBtn = this.find("cont/exitBtn", Button);
        this.verLab = this.find("cont/verLab", Label);
        this.CloseBy("cont/mask");
        this.CloseBy("cont/closeBtn");
        let data:SSettingData = LocalStorage.GetObject("Setting_Data");
        if(data){
            this.bgmToggle.isChecked = data.bgmIsOpen;
            this.soundToggle.isChecked = data.soundIsOpen;
        }
        this.exitBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.bgmToggle.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        this.soundToggle.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        this.hideUiToggle.node.on(Toggle.EventType.TOGGLE, this.onToggleChange, this);
        this.backBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
    }
    public async flush(...args: any[]): Promise<void> {
        this.verLab.string = "版本号：" + GameVer;
        this.backBtn.node.active = false;
        this.cont.active = true;
        this.initHideUiBtn();
        AdaptBgTop(this.find("cont/mask"));
        this.onToggleChange(this.bgmToggle, true);
        this.onToggleChange(this.soundToggle, true);
        this.onToggleChange(this.hideUiToggle, true);
    }
    
    protected onShow(): void {
        EventMgr.on("camera_move", this.onCameraMove, this);
    }

    protected onHide(...args: any[]): void {
        PlayerData.isHideUI = false;
        HomeScene.ins.VisibleBarAndLab(true);
        EventMgr.off("camera_move", this.onCameraMove, this);
    }
    private onCameraMove():void{
        this.toDelayHideUi();
    }
    private initHideUiBtn():void{
        this.hideIsInit = this.hideUiToggle.isChecked ? false : true;
        this.hideUiToggle.isChecked = false;
    }
    private onToggleChange(toggle:Toggle, isInit:boolean = false):void{
        let onCont:Node = toggle.node.getChildByName("onCont");
        let offCont:Node = toggle.node.getChildByName("offCont");
        onCont.active = toggle.isChecked;
        offCont.active = !toggle.isChecked;
        if(!isInit){
            let data:SSettingData = LocalStorage.GetObject("Setting_Data");
            switch(toggle){
                case this.bgmToggle:
                    data.bgmIsOpen = toggle.isChecked;
                    LocalStorage.SetObject("Setting_Data", data);
                    AudioMgr.All(!data.bgmIsOpen, AudioGroup.Music);
                    break;
                case this.soundToggle:
                    data.soundIsOpen = toggle.isChecked;
                    LocalStorage.SetObject("Setting_Data", data);
                    AudioMgr.All(!data.soundIsOpen, AudioGroup.Sound);
                    AudioMgr.All(!data.soundIsOpen, AudioGroup.Skill);
                    AudioMgr.All(!data.soundIsOpen, AudioGroup.Scene);
                    break;
                case this.hideUiToggle:
                    if(!this.hideIsInit){
                        this.hideIsInit = true;
                        return;
                    }
                    PlayerData.isHideUI = true;
                    this.scheduleOnce(()=>{
                        
                        this.toDelayHideUi();
                        EventMgr.emit(Evt_Hide_Home_Ui);
                    }, 0.05);
                    
                    break;
            }
            
        }
    }
    private toDelayHideUi():void{
        this.cont.active = false;
        this.backBtn.node.active = true;
        HomeScene.ins.VisibleBarAndLab(false);
        this.unschedule(this.onDelayHideUi);
        this.scheduleOnce(this.onDelayHideUi, this.HIDE_UI_MAX_TIME);
    }
    private exitHideUi():void{
        this.unschedule(this.onDelayHideUi);
        this.backBtn.node.active = false;
        this.cont.active = true;
        HomeScene.ins.VisibleBarAndLab(true);
        this.initHideUiBtn();
    }
    private onDelayHideUi():void{
        this.backBtn.node.active = false;
    }
    private onBtnClick(btn:Button):void{
        switch(btn){
            case this.backBtn:
                this.exitHideUi();
                PlayerData.isHideUI = false;
                EventMgr.emit(Evt_Show_Home_Ui);
                break;
            case this.exitBtn:
                game.restart();
                break;
        }
    }
    
}