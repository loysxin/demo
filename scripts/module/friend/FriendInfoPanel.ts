import { Button, EventTouch, Input, Label, Node, Sprite, SpriteFrame, Toggle, UIOpacity, instantiate, path, v3 } from "cc";
import { Panel } from "../../GameRoot";
import { MsgTypeSend } from "../../MsgType";
import { EventMgr, Evt_GetContactInfo, Evt_GetIncommons } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { ResMgr, folder_head_round } from "../../manager/ResMgr";
import { SDownlineInfo, SGetContactInfo } from "../roleModule/PlayerData";
import { CopyToClip } from "../../Platform";
import { MsgPanel } from "../common/MsgPanel";

export class FriendInfoPanel extends Panel {
    protected prefab: string = "prefabs/panel/friend/FriendInfoPanel";

    private player_name: Label;
    private id: Label;
    private wx_num: Label;
    private qq_num: Label;
    private icon: Sprite;
    private idCloneBtn: Button;
    private wxCloneBtn: Button;
    private qqCloneBtn: Button;



    protected onLoad(): void {
        this.CloseBy("mask");
        this.CloseBy("frame/closeBtn");
        this.player_name = this.find("frame/friendInfoPage/player_name", Label);
        this.id = this.find("frame/friendInfoPage/id", Label);
        this.wx_num = this.find("frame/friendInfoPage/wx_num", Label);
        this.qq_num = this.find("frame/friendInfoPage/qq_num", Label);
        this.icon = this.find("bg/icon", Sprite);
        this.idCloneBtn = this.find("frame/friendInfoPage/idCloneBtn", Button);
        this.wxCloneBtn = this.find("frame/friendInfoPage/wxCloneBtn", Button);
        this.qqCloneBtn = this.find("frame/friendInfoPage/qqCloneBtn", Button);
        this.idCloneBtn.node.on("click", this.onClick, this);
        this.wxCloneBtn.node.on("click", this.onClick, this);
        this.qqCloneBtn.node.on("click", this.onClick, this);
        EventMgr.on(Evt_GetContactInfo, this.updateInfo, this);
    }

    protected onShow(): void {
    }

    async flush(player_id: string) {
        let data = {
            type: MsgTypeSend.GetContactInfoRequest,
            data: { player_id: player_id }
        }
        Session.Send(data);
    }

    private updateInfo(data: SGetContactInfo) {
        this.player_name.string = data.name;
        this.id.string = data.player_id;
        this.wx_num.string = data.wechat_id != "" ? data.wechat_id : "未填写信息";
        this.qq_num.string = data.qq_id != "" ? data.qq_id : "未填写信息";
    }

    private onClick(event: Button) {
        let name = event.node.name;
        switch (name) {
            case "idCloneBtn":
                this.copyInfo(this.id.string)
                console.log("clone_id")
                break;
            case "wxCloneBtn":
                this.copyInfo(this.wx_num.string)
                console.log("clone_wx")
                break;
            case "qqCloneBtn":
                this.copyInfo(this.qq_num.string)
                console.log("clone_qq")
                break;
            default:
                break;
        }
    }

    private copyInfo(info:string){
        CopyToClip(info, (desc: string) => {
            if (desc ==  info) {
                MsgPanel.Show("已复制到粘贴板");
            }
        });
    }

    protected onHide(...args: any[]): void {

    }
}