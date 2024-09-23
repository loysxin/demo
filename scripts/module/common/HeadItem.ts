import { Component, Sprite, Node, path, SpriteFrame, Button} from "cc";
import PlayerData, { SSimpleData } from "../roleModule/PlayerData";
import { CfgMgr, StdHead } from "../../manager/CfgMgr";
import { folder_head, folder_head_round, ResMgr } from "../../manager/ResMgr";
import { EventMgr, Evt_UserInfoChange } from "../../manager/EventMgr";

export class HeadItem extends Component {
    private headBg:Node;
    private frameBg:Node;
    private icon:Sprite;
    private frame:Sprite;
    private btn:Button;
    private clickCb:(data: SSimpleData) => void = null;
    private isInit:boolean = false;
    private _data:SSimpleData;
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
        //点击自己
        if(this._data.player_id == PlayerData.roleInfo.player_id) return;
        // TODO 发送查看玩家数据
        console.log("请求查看玩家数据");
    }
    private onUserInfoChange(data:SSimpleData):void{
        if(!this.node.activeInHierarchy) return;
        if(this._data.player_id != data.player_id) return;
        this._data = data;
        this.updateShow();
    }
    SetClickBc(clickCb:(data: SSimpleData) => void):void{
        this.clickCb = clickCb;
    }
    SetData(data:SSimpleData) {
        this._data = data;
        this.updateShow();
    }

    private updateShow():void{
        if(!this.isInit || !this._data) return;
        this.headBg.active = false;
        this.frameBg.active = false;
        let std:StdHead = CfgMgr.GetHead(this._data.headId || 4);
        if(std){
            let headUrl = path.join(folder_head_round, std.IconRes, "spriteFrame");
            ResMgr.LoadResAbSub(headUrl, SpriteFrame, res => {
                this.icon.spriteFrame = res;
            });
        }
        std = CfgMgr.GetHead(this._data.headFarmerId);
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

    get data():SSimpleData{
        return this._data;
    }
}