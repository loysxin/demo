import { Component, Sprite, Node, path, SpriteFrame, Button} from "cc";
import PlayerData, { SPlayerViewInfo } from "../roleModule/PlayerData";
import { CfgMgr, StdHead } from "../../manager/CfgMgr";
import { folder_head, folder_head_round, ResMgr } from "../../manager/ResMgr";
import { EventMgr, Evt_UserInfoChange } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";

export class HeadItem extends Component {
    private headBg:Node;
    private frameBg:Node;
    private icon:Sprite;
    private frame:Sprite;
    private btn:Button;
    private clickCb:(data: SPlayerViewInfo) => void = null;
    private isInit:boolean = false;
    private _data:SPlayerViewInfo;
    protected onLoad(): void {
        this.headBg = this.node.getChildByName("headBg");
        this.frameBg = this.node.getChildByName("frameBg");
        this.icon = this.node.getChildByPath("Mask/icon").getComponent(Sprite);
        this.frame = this.node.getChildByName("frame").getComponent(Sprite);
        this.btn = this.node.getComponent(Button);
        this.btn.node.on(Button.EventType.CLICK, this.onClick, this);
        this.isInit = true;
        this.updateShow();
        EventMgr.on(Evt_UserInfoChange, this.onUserInfoChange, this);
    }
    private onClick():void{
        if(this.clickCb != null){
            return this.clickCb(this._data);
        }
        if(!this.data) return;
        //点击自己
        if(this._data && this._data.player_id == PlayerData.roleInfo.player_id) return;
        // TODO 发送查看玩家数据
        Session.Send({ type: MsgTypeSend.GetPlayerViewInfo, 
            data: {
                player_id: this._data.player_id,
            } 
        });
    }
    private onUserInfoChange(data:SPlayerViewInfo):void{
        if(!this.node.activeInHierarchy) return;
        if(this._data.player_id != data.player_id) return;
        this._data = data;
        this.updateShow();
    }
    SetClickBc(clickCb:(data: SPlayerViewInfo) => void):void{
        this.clickCb = clickCb;
    }
    SetData(data:SPlayerViewInfo) {
        this._data = data;
        this.updateShow();
    }

    private updateShow():void{
        if(!this.isInit || !this._data) return;
        this.headBg.active = false;
        this.frameBg.active = false;
        let std:StdHead = CfgMgr.GetHead(Number(this._data.icon_url) || 4);
        if(std){
            let headUrl = path.join(folder_head_round, std.IconRes, "spriteFrame");
            ResMgr.LoadResAbSub(headUrl, SpriteFrame, res => {
                this.icon.spriteFrame = res;
            });
        }
        std = CfgMgr.GetHead(Number(this._data.avatar_url));
        if(std){
            this.headBg.active = false;
            this.frameBg.active = true;
            let frameUrl = path.join(folder_head, `frame/${std.IconRes}`, "spriteFrame");
            ResMgr.LoadResAbSub(frameUrl, SpriteFrame, res => {
                this.frame.spriteFrame = res;
            });
        }else{
            this.headBg.active = true;
        }
        
    }

    get data():SPlayerViewInfo{
        return this._data;
    }
}