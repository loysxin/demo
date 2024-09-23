import { Button, EditBox, Label } from "cc";
import { Panel } from "../../GameRoot";
import { ConsumeItem } from "../common/ConsumeItem";
import LocalStorage from "../../utils/LocalStorage";
import PlayerData from "../roleModule/PlayerData";
import { MsgPanel } from "../common/MsgPanel";
import { EventMgr, Evt_UserDataChange } from "../../manager/EventMgr";
enum EditType {
    Edit_Name = 1,//编辑名字
    Edit_WeChat,//编辑微信
    Edit_QQ,//编辑QQ
};
export class UserEditInfoPanel extends Panel {
    protected prefab: string = "prefabs/panel/userInfo/UserEditInfoPanel";
    private titleLab:Label;
    private editBox: EditBox;
    private btn:Button;
    private btnLab:Label;
    private consumeItem:ConsumeItem;
    private curType:EditType;
    protected onLoad(): void {
        this.titleLab = this.find("titleLab", Label);
        this.editBox = this.find("editBox", EditBox);
        this.btn = this.find("btn", Button);
        this.btnLab = this.find("btn/cont/btnLab", Label);
        this.consumeItem = this.find("btn/cont/consumeItem").addComponent(ConsumeItem);
        this.CloseBy("mask");
        this.CloseBy("closeBtn");
        this.btn.node.on(Button.EventType.CLICK, this.onBtnClick, this);
        
    }
    public flush(type:number): void {
        this.curType = type;
        this.updateView();
    }
    
    protected onShow(): void {
        
    }

    protected onHide(...args: any[]): void {

    }
    private onBtnClick(btn:Button):void{
        let inputStr:string = this.editBox.string;
        if(this.curType == EditType.Edit_Name){
            if(inputStr.length > 7 || inputStr.length< 2){
                MsgPanel.Show("请输入2-7字符的名字");
                return;
            }
        }else if(this.curType == EditType.Edit_WeChat){
            let reg = new RegExp("[\\u4E00-\\u9FFF]+","g");
            if(reg.test(inputStr)){     
                MsgPanel.Show("微信号输入有误");
                return;        
            }
            LocalStorage.SetPlayerData(PlayerData.playerIdKey, "UserWeChat", inputStr);
        }else if(this.curType == EditType.Edit_QQ){
            let qqReg = new RegExp(/^[1-9]\d{4,9}$/);
            if(!qqReg.test(inputStr)){
                MsgPanel.Show("QQ号输入有误");
                return;
            }
            LocalStorage.SetPlayerData(PlayerData.playerIdKey, "UserQQ", Number(inputStr));
        }
        MsgPanel.Show("修改成功");
        EventMgr.emit(Evt_UserDataChange);
        
        this.Hide();
    }
    
    private updateView():void{
        this.consumeItem.node.active = false;
        if(this.curType == EditType.Edit_Name){
            this.consumeItem.node.active = true;
            this.titleLab.string = "改名";
            this.editBox.string = PlayerData.roleInfo.name;
        }else if(this.curType == EditType.Edit_WeChat){
            this.titleLab.string = "编辑微信号";
            this.editBox.placeholder = "请输入微信号";
            let myWeChat:number = LocalStorage.GetPlayerData(`Player_${PlayerData.roleInfo.player_id}`, "UserWeChat");
            if(myWeChat){
                this.editBox.string = myWeChat.toString();
            }else{
                this.editBox.string = "";
            }
        }else if(this.curType == EditType.Edit_QQ){
            this.titleLab.string = "编辑QQ号";
            this.editBox.placeholder = "请输入QQ号";
            let myQQ:number = LocalStorage.GetPlayerData(`Player_${PlayerData.roleInfo.player_id}`, "UserQQ");
            if(myQQ){
                this.editBox.string = myQQ.toString();
            }else{
                this.editBox.string = "";
            }
        }
    }
    
}