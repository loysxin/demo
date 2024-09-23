import { Button, EditBox, EventTouch, Input, Label, Node, Sprite, SpriteFrame, Toggle, Touch, UIOpacity, instantiate, path, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { EventMgr, Evt_CloseFriendBindOrUnbindPanel } from "../../manager/EventMgr";
import { QrcodeMaker } from "../../utils/QrcodeMaker";
import { GetDeviceInfo, GetInviteCode } from "../../Platform";
import { SaveImage } from "../../utils/SaveImage";
import PlayerData from "../roleModule/PlayerData";
import { ResMgr, folder_head_round } from "../../manager/ResMgr";
import { AudioMgr, Audio_CommonClick } from "../../manager/AudioMgr";

export class FriendSharePanel extends Panel {
    protected prefab: string = "prefabs/panel/friend/FriendSharePanel";

    
    private save: Button;
    private name_str: Label;
    private uid_str: Label;
    private sever_str: Label;
    private icon: Sprite;
   
    protected onLoad(): void {
        //25328825
        let url = "http://test.daochat.cn?inviteCode="+GetInviteCode()+"&appId=test";
        let qrcode = QrcodeMaker.Create(url, 240, 240);
        qrcode.setPosition(-120,-120)
        this.find("node/qrcode").addChild(qrcode);

        this.CloseBy("node");  
        this.name_str = this.find("node/name_str", Label);  
        this.uid_str = this.find("node/uid_str", Label);  
        this.sever_str = this.find("node/sever_str", Label);  
        this.icon = this.find("node/bg/Mask/icon", Sprite);     
        this.save = this.find("node/save", Button);     
        this.save.node.on("click", this.onSave, this);    
        // EventMgr.on(Evt_CloseFriendBindOrUnbindPanel, this.onClose, this)
    }

    protected onShow(): void {
        
    }

    async flush() {
        this.name_str.string = PlayerData.roleInfo.name;
        this.uid_str.string = "ID:" + PlayerData.roleInfo.player_id;
        // this.sever_str.string = "";
        let url =  PlayerData.roleInfo.icon_url?  PlayerData.roleInfo.icon_url: "01"
        this.icon.spriteFrame = await ResMgr.LoadResAbSub(path.join(folder_head_round,  url, "spriteFrame"), SpriteFrame);
    }


    private onSave(btn:Button) {
        AudioMgr.PlayOnce(Audio_CommonClick);
        EventMgr.on("save_image_complete",this.onClose,this);
        SaveImage(this.find("node"));
    }


    private onClose(){
        this.Hide();
    }

    protected onHide(...args: any[]): void {
    }
}