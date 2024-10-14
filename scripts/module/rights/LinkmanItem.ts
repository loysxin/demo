import { Button, Component, Label } from "cc";
import { StdShopowner } from "../../manager/CfgMgr";
import { CopyToClip } from "../../Platform";
import { MsgPanel } from "../common/MsgPanel";
import LocalStorage from "../../utils/LocalStorage";
import PlayerData from "../roleModule/PlayerData";

export class LinkmanItem extends Component {
    private nameLab: Label;
    private uidLab:Label;
    private qqBtn:Button;
    private qqBtnLab:Label;
    private weCahtBtn:Button;
    private weCahtBtnLab:Label;
    private isInit:boolean = false;
    private data:StdShopowner;
    protected onLoad(): void {
        this.nameLab = this.node.getChildByName("nameLab").getComponent(Label);
        this.uidLab = this.node.getChildByName("uidLab").getComponent(Label);
        this.qqBtn = this.node.getChildByName("qqBtn").getComponent(Button);
        this.qqBtnLab = this.node.getChildByPath("qqBtn/qqBtnLab").getComponent(Label);
        this.weCahtBtn = this.node.getChildByName("weChatBtn").getComponent(Button);
        this.weCahtBtnLab = this.node.getChildByPath("weChatBtn/weChatBtnLab").getComponent(Label);
        this.isInit = true;
        this.qqBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.weCahtBtn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        this.updateShow();
    }
    private onBtnClick(btn: Button):void{
        switch(btn){
            case this.qqBtn:
                CopyToClip(this.data.QQid, (desc: string) => {
                    if (desc != undefined || desc != null) {
                        this.setLocal(this.data.ID);
                        MsgPanel.Show("已复制到粘贴板");
                    }
                });
                break;
            case this.weCahtBtn:
                CopyToClip(this.data.VXid, (desc: string) => {
                    if (desc != undefined || desc != null) {
                        this.setLocal(this.data.ID);
                        MsgPanel.Show("已复制到粘贴板");
                    }
                });
                break;
        }
    }
    private setLocal(id:number):void{
        let keyData:any = LocalStorage.GetPlayerData(PlayerData.playerIdKey, "LinkmanClick");
        let val:number;
        if(!keyData){
            keyData = {};
        }
        val = keyData[id];
        if(val){
            val++;
        }
        keyData[id] = val || 1;
        LocalStorage.SetPlayerData(PlayerData.playerIdKey, "LinkmanClick", keyData);
    }
    SetData(data:StdShopowner) {
        this.data = data;
        this.updateShow();
        
    }
    
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        this.nameLab.string = this.data.Shopowner_Name;
        this.uidLab.string = this.data.Uid;
        this.qqBtnLab.string = "复制";//this.data.QQid;
        this.weCahtBtnLab.string = "复制";//this.data.VXid;
    }
}