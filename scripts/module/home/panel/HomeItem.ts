import { Button, Component, path, Sprite, SpriteFrame } from "cc";
import { StdHomeLand } from "../../../manager/CfgMgr";
import { folder_home, ResMgr } from "../../../manager/ResMgr";
import PlayerData from "../../roleModule/PlayerData";
import { HomeLogic } from "../HomeLogic";
import { UnlockHomeLandPanel } from "./UnlockHomeLandPanel";
import { SetNodeGray } from "../../common/BaseUI";

export class HomeItem extends Component {
    private btn:Button;
    private icon:Sprite;
    private data:StdHomeLand;
    private _clickCb:(name:StdHomeLand) => void = null;
    private isInit:boolean = false;
    protected onLoad(): void {
        this.btn = this.node.getComponent(Button);
        this.icon = this.node.getComponent(Sprite);
        this.btn.node.on(Button.EventType.CLICK, this.onClick, this);
        this.isInit = true;
        this.updateShow();

    }
    private onClick():void{
        if(this.data){
            if(this._clickCb != null) this._clickCb(this.data); 
            for (let info of PlayerData.roleInfo.homelands) {
                if (info.id == this.data.HomeId) {
                    HomeLogic.ins.EnterMyHomeScene(this.data.HomeId);
                    return;
                }
            }
            UnlockHomeLandPanel.Show(this.data.HomeId);
            
        }
    }
    SetClickCb(cb:(data:StdHomeLand) => void):void{
        this._clickCb = cb;
    }
    SetData(data:StdHomeLand):void{
        this.data = data;
        this.updateShow();
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        let url = path.join(folder_home, `home_${this.data.HomeId}` , "spriteFrame");
        ResMgr.LoadResAbSub(url, SpriteFrame, res => {
            this.icon.spriteFrame = res;
        });
        SetNodeGray(this.node, true, false);
        for (const homeData of PlayerData.roleInfo.homelands) {
            if(homeData.id == this.data.HomeId){
                SetNodeGray(this.node, false, false);
                break;
            }
            
        }
    }
}