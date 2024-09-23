import { Button, Component, instantiate, Label, Layout, Node, UITransform, v3, Widget } from "cc";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";
import { CfgMgr, GuildPostType, StdGuildRole } from "../../manager/CfgMgr";
import PlayerData, { SGuildMember } from "../roleModule/PlayerData";
import { Session } from "../../net/Session";
import { MsgTypeSend } from "../../MsgType";
import { MsgPanel } from "../common/MsgPanel";
import { Tips } from "../login/Tips";
import { ClickTipsPanel } from "../common/ClickTipsPanel";
enum GuildMenuType {
    KickOut = 1,//踢出公会
    Appoint,//任命成员
    Alienator,//转让会长
    AppointViceChairman,//任命副会长
    AppointOfficer,//任命官员
    AppointMember,//任命普通成员
};
/**按钮数据 */
interface GuildMenuBtnData {
    btnId:GuildMenuType, 
    btnName:string, 
    postId?:GuildPostType,
}
export class GuildMenuCont extends Component {
    private tempBtnNode:Node;
    private mainMenuCont:Node;
    private mainBtnCont:Node;
    private mainBg:Node;
    private otherMenuCont:Node;
    private otherBtnCont:Node;
    private otherBg:Node;
    private isInit:boolean = false;
    private data:SGuildMember;
    private myRole:StdGuildRole;
    private targetRole:StdGuildRole;
    private curMainMenuList: GuildMenuType[];
    private curOtherMenuList: GuildMenuType[];
    private btnInfo:{[key: string]: GuildMenuBtnData} = BeforeGameUtils.toHashMapObj(
        GuildMenuType.KickOut, {btnId: GuildMenuType.KickOut, btnName:"踢出公会"},
        GuildMenuType.Appoint, {btnId: GuildMenuType.Appoint, btnName:"成员任命"},
        GuildMenuType.Alienator, {btnId: GuildMenuType.Alienator, btnName:"转让会长"},
        GuildMenuType.AppointViceChairman, {btnId: GuildMenuType.AppointViceChairman, btnName:"副会长", postId:GuildPostType.VicePresident},
        GuildMenuType.AppointOfficer, {btnId: GuildMenuType.AppointOfficer, btnName:"官员", postId:GuildPostType.Officer},
        GuildMenuType.AppointMember, {btnId: GuildMenuType.AppointMember, btnName:"成员", postId:GuildPostType.Member},
        
    )
    private btnMainMenuInfo:{[key: string]: []} = BeforeGameUtils.toHashMapObj(
        GuildPostType.President, [GuildMenuType.KickOut, GuildMenuType.Appoint, GuildMenuType.Alienator],
        GuildPostType.VicePresident, [GuildMenuType.KickOut, GuildMenuType.Appoint],
        GuildPostType.Officer, [GuildMenuType.KickOut],
    );
    private btnOtherMenuInfo:{[key: string]: []} = BeforeGameUtils.toHashMapObj(
        GuildPostType.President, [GuildMenuType.AppointViceChairman, GuildMenuType.AppointOfficer, GuildMenuType.AppointMember],
        GuildPostType.VicePresident, [GuildMenuType.AppointOfficer, GuildMenuType.AppointMember],
    );
    protected onLoad(): void {
        this.tempBtnNode = this.node.getChildByName("tempBtnNode");
        this.mainMenuCont = this.node.getChildByName("mainMenuCont");
        this.mainBtnCont = this.node.getChildByPath("mainMenuCont/btnCont");
        this.mainBg = this.node.getChildByPath("mainMenuCont/bg");
        this.otherMenuCont = this.node.getChildByName("otherMenuCont");
        this.otherBtnCont = this.node.getChildByPath("otherMenuCont/btnCont");
        this.otherBg = this.node.getChildByPath("otherMenuCont/bg");
        this.isInit = true;
        this.updateShow();
    }
    
    SetData(data:SGuildMember) {
        this.data = data;
        this.updateShow();
    }
    private onBtnClick(btnData:GuildMenuBtnData, btn:Button):void{
        switch(btnData.btnId){
            case GuildMenuType.KickOut:
                if(this.myRole.PermissionKickPlayer > this.targetRole.PermissionKickPlayer){
                    Tips.Show(`确定将${this.data.name}踢出公会？`, () => {
                        Session.Send({type: MsgTypeSend.GuildKick, 
                            data: {
                                guild_id: PlayerData.MyGuild.guild_id,
                                player_id: this.data.player_id,
                            } 
                        });
                        ClickTipsPanel.Hide();
                    })
                    
                }else{
                    MsgPanel.Show("权限不足");
                }
                break;
            case GuildMenuType.Appoint:
                
                this.otherMenuCont.active = true;
                this.otherBtnCont.getComponent(Layout).updateLayout(true);
                let otherH:number = this.otherMenuCont.getComponent(UITransform).height = this.otherBtnCont.getComponent(UITransform).height + 20;
                let btnPos = btn.node.worldPosition.clone();
                let toPos = this.otherMenuCont.worldPosition.clone();
                this.otherMenuCont.worldPosition = v3(toPos.x, btnPos.y - otherH / 2);
                break;
            case GuildMenuType.Alienator:
                if(this.myRole.PermissionRoleAppointment > this.targetRole.PermissionRoleAppointment){
                    Tips.Show(`确定将${this.myRole.Name}转让给${this.data.name||""}`, () => {
                        Session.Send({type: MsgTypeSend.GuildChangeMemberLeader, 
                            data: {
                                guild_id: PlayerData.MyGuild.guild_id,
                                player_id: this.data.player_id,
                            } 
                        });
                        ClickTipsPanel.Hide();
                    })
                    
                }else{
                    MsgPanel.Show("权限不足");
                }
                break;
            case GuildMenuType.AppointViceChairman:
            case GuildMenuType.AppointOfficer:
            case GuildMenuType.AppointMember:
                if(this.myRole.PermissionRoleAppointment > this.targetRole.PermissionRoleAppointment){
                    let stdRole = CfgMgr.GetGuildRole(btnData.postId);
                    if(stdRole.Member > 0 && PlayerData.GetGuildPostNum(stdRole.ID) >= stdRole.Member){
                        MsgPanel.Show(`【${stdRole.Name}】职位已满，请调整任命`);
                        return;
                    }
                    if(this.data.role == btnData.postId){
                        MsgPanel.Show(`该成员已是【${stdRole.Name}】职位`);
                        return;
                    }
                    Tips.Show(`确定将${this.data.name}任命为${stdRole.Name}`, () => {
                        Session.Send({type: MsgTypeSend.GuildChangeMemberRole, 
                            data: {
                                guild_id: PlayerData.MyGuild.guild_id,
                                player_id: this.data.player_id,
                                role_id:btnData.postId,
                            } 
                        });
                        ClickTipsPanel.Hide();
                    })
                    
                }else{
                    MsgPanel.Show("权限不足");
                }
                break;
        }
    }
    private updateShow():void{
        if(!this.isInit || !this.data) return;
        this.targetRole = CfgMgr.GetGuildRole(this.data.role);
        this.myRole = PlayerData.GetMyGuildLimit();
        this.curMainMenuList = this.btnMainMenuInfo[this.myRole.ID];
        this.curOtherMenuList = this.btnOtherMenuInfo[this.myRole.ID];
        this.otherMenuCont.active = false;
        this.createBtn(this.curMainMenuList, this.mainBtnCont);
        this.mainBtnCont.getComponent(Layout).updateLayout(true);
        let mainH:number = this.mainMenuCont.getComponent(UITransform).height = this.mainBtnCont.getComponent(UITransform).height + 20;

        this.createBtn(this.curOtherMenuList, this.otherBtnCont);
        

        this.node.getComponent(UITransform).height = mainH;
    }
    private createBtn(btnList:GuildMenuType[], cont:Node):void{
        cont.destroyAllChildren();
        if(btnList){
            let stdRole;
            for (let index = 0; index < btnList.length; index++) {
                let btnData:GuildMenuBtnData = this.btnInfo[btnList[index]];
                let btnNode = instantiate(this.tempBtnNode);
                btnNode.active = true;
                let btn:Button = btnNode.getComponent(Button);
                let btnLab:Label = btnNode.getChildByName("btnLab").getComponent(Label);
                if(btnData.postId){
                    stdRole = CfgMgr.GetGuildRole(btnData.postId);
                    btnLab.string = stdRole.Name;
                }else{
                    btnLab.string = btnData.btnName;
                }
                btn.node.on(Button.EventType.CLICK, this.onBtnClick.bind(this, btnData));
                btnNode.parent = cont;
            }
        }

    }
}