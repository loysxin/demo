import { CfgMgr, GuildPostType, StdGuide, StdGuildRole } from "../../manager/CfgMgr";
import { EventMgr, Evt_GuildChange, Evt_GuildSearch } from "../../manager/EventMgr";
import { MsgTypeRet } from "../../MsgType";
import { Session } from "../../net/Session";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";
import { MsgPanel } from "../common/MsgPanel";
import { Tips } from "../login/Tips";
import PlayerData, { SGuild, SGuildEvent, SGuildMember } from "../roleModule/PlayerData";
import { GuildInfoPanel } from "./GuildInfoPanel";
import { GuildNonePanel } from "./GuildNonePanel";
import { GuildPanel } from "./GuildPanel";
/**错误码类型*/
export enum GuildErrorCodeType {
    GuildErrorAlreadyJoin                  = 100, // 已经加入了公会
	GuildErrorCreateNameIsTooShort         = 101, // 公会名字太短
	GuildErrorCreateNameIsTooLong          = 102, // 公会名字太长
	GuildErrorCreateNameIsInvalid          = 103, // 无效的名称
	GuildErrorAnnouncementContentIsTooLong = 104, // 公告内容太长
	GuildErrorSearchNameIsTooShort         = 105, // 搜索：公会名字太短
	GuildErrorSearchNameIsTooLong          = 106, // 搜索：公会名字太长
	GuildErrorSearchNameIsInvalid          = 107, // 搜索：无效的名称
    GuildErrorNotJoin                      = 108, // 未加入任何公会
	GuildErrorGuildNotFound                = 109, // 公会不存在
	GuildErrorMemberFull                   = 110, // 公会成员已满
	GuildErrorCanNotLeaveHasMember         = 111, // 会长在有成员的情况下不能离开
    GuildErrorBadGuildIDArg                = 112, // 无效的公会ID参数
	GuildErrorCanNotUpdateSelfRole         = 113, // 不能修改自己的角色
	GuildErrorPermissionDenied             = 114, // 权限不足
	GuildErrorMemberRoleIsMax              = 115, // 成员角色已达到最大值
	GuildErrorMemberNotExists              = 116, // 成员不存在
}
export class GuildModule{
    private errorStr:{[key: string]: string} = BeforeGameUtils.toHashMapObj(
        GuildErrorCodeType.GuildErrorAlreadyJoin,"已经加入了公会",
        GuildErrorCodeType.GuildErrorCreateNameIsTooShort,"公会名字太短",
        GuildErrorCodeType.GuildErrorCreateNameIsTooLong,"公会名字太长",
        GuildErrorCodeType.GuildErrorCreateNameIsInvalid,"无效的名称",
        GuildErrorCodeType.GuildErrorAnnouncementContentIsTooLong,"公告内容太长",
        GuildErrorCodeType.GuildErrorSearchNameIsTooShort,"搜索：公会名字太短",
        GuildErrorCodeType.GuildErrorSearchNameIsTooLong,"搜索：公会名字太长",
        GuildErrorCodeType.GuildErrorSearchNameIsInvalid,"搜索：无效的名称",
        GuildErrorCodeType.GuildErrorNotJoin,"未加入任何公会",
        GuildErrorCodeType.GuildErrorGuildNotFound,"公会不存在",
        GuildErrorCodeType.GuildErrorMemberFull,"公会成员已满",
        GuildErrorCodeType.GuildErrorCanNotLeaveHasMember,"会长在有成员的情况下不能离开",
        GuildErrorCodeType.GuildErrorBadGuildIDArg,"无效的公会ID参数",
        GuildErrorCodeType.GuildErrorCanNotUpdateSelfRole,"不能修改自己的角色",
        GuildErrorCodeType.GuildErrorPermissionDenied,"权限不足",
        GuildErrorCodeType.GuildErrorMemberRoleIsMax,"成员角色已达到最大值",
        GuildErrorCodeType.GuildErrorMemberNotExists,"成员不存在",
    );
    constructor() {
        Session.on(MsgTypeRet.GuildCreateRet, this.onGuildCreate, this);
        Session.on(MsgTypeRet.GuildGetSelfRet, this.onGuildGetSelfRet, this);
        Session.on(MsgTypeRet.GuildGetSelfEventRet, this.onGuildGetSelfEventRet, this);   
        Session.on(MsgTypeRet.GuildRecommendedListRet, this.onGuildRecommendedListRet, this);   
        Session.on(MsgTypeRet.GuildSearchByIDRet, this.onGuildSearchByIDRet, this);   
        Session.on(MsgTypeRet.GuildSearchByNameRet, this.onGuildSearchByNameRet, this);   
        Session.on(MsgTypeRet.GuildJoinRet, this.onGuildJoinRet, this);   
        Session.on(MsgTypeRet.GuildLeaveRet, this.onGuildLeaveRet, this);   
        Session.on(MsgTypeRet.GuildKickRet, this.onGuildKickRet, this);   
        Session.on(MsgTypeRet.GuildChangeMemberRoleRet, this.onGuildChangeMemberRoleRet, this);   
        Session.on(MsgTypeRet.GuildChangeMemberLeaderRet, this.onGuildChangeMemberLeaderRet, this);   
    }
    private onGuildCreate(data:{code:number, guild:SGuild}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        }
        GuildPanel.Show();
        GuildNonePanel.Hide(); 
        PlayerData.MyGuild = data.guild;
       
    }
    private onGuildGetSelfRet(data:{code:number, guild:SGuild}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.MyGuild = data.guild;
        EventMgr.emit(Evt_GuildChange);
    }
    private onGuildGetSelfEventRet(data:{code:number, events:SGuildEvent[]}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        
    }
    private onGuildRecommendedListRet(data:{code:number, guild_list:SGuild[]}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_GuildSearch, data.guild_list, true);
    }
    private onGuildSearchByIDRet(data:{code:number, guild_list:SGuild[]}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_GuildSearch, data.guild_list, false);
    }
    private onGuildSearchByNameRet(data:{code:number, guild_list:SGuild[]}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_GuildSearch, data.guild_list, false);
    }
    private onGuildJoinRet(data:{code:number, guild:SGuild, guild_id:string, is_join_immediately:boolean, is_send_application:boolean}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        if(data.is_join_immediately){
            MsgPanel.Show("成功加入公会");
            PlayerData.MyGuild = data.guild;
            GuildPanel.Show();
            GuildNonePanel.Hide();
            
        }else{
            MsgPanel.Show("申请成功");
        }
    }
    private onGuildLeaveRet(data:{code:number, guild_id:string}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        MsgPanel.Show("成功退出公会");
        PlayerData.MyGuild = null;
        EventMgr.emit(Evt_GuildChange);
    }
    private onGuildKickRet(data:{code:number, guild_id:string, player_id:string}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        if(PlayerData.MyGuild){
            //踢掉的是我自己
            if(PlayerData.roleInfo.player_id == data.player_id){
                PlayerData.MyGuild = null;
                Tips.Show("你被踢出公会");
            }else{
                let memberData:SGuildMember = PlayerData.MyGuild.members[data.player_id];
                if(memberData){
                    delete PlayerData.MyGuild.members[data.player_id];
                    PlayerData.MyGuild.member_count--;
                    MsgPanel.Show(`${memberData.name||""}被踢出公会`);
                }
            }
        }
        EventMgr.emit(Evt_GuildChange);
    }
    private onGuildChangeMemberRoleRet(data:{code:number, guild_id:string, player_id:string, role_id:number}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        if(PlayerData.MyGuild){
            let memberData:SGuildMember = PlayerData.MyGuild.members[data.player_id];
            if(memberData){
                memberData.role = data.role_id;
                let stdRole:StdGuildRole = CfgMgr.GetGuildRole(data.role_id);
                if(stdRole){
                    if(PlayerData.roleInfo.player_id == data.player_id){
                        MsgPanel.Show(`你被任命为公会${stdRole.Name}`);
                    }else{
                        MsgPanel.Show(`${memberData.name || ""}被任命为公会${stdRole.Name}`);
                    }
                }
            }
        }
        EventMgr.emit(Evt_GuildChange);
    }
    private onGuildChangeMemberLeaderRet(data:{code:number, guild_id:string, player_id:string, role_id:number}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        if(PlayerData.MyGuild){
            let oldPresident = PlayerData.MyGuild.leader_info;
            let oldMember = PlayerData.MyGuild.members[oldPresident.player_id];
            oldMember.role = GuildPostType.Member;
            let newMemberData:SGuildMember = PlayerData.MyGuild.members[data.player_id];
            newMemberData.role = GuildPostType.President;
            PlayerData.MyGuild.leader_info = newMemberData;
            let stdRole:StdGuildRole = CfgMgr.GetGuildRole(GuildPostType.President);
            if(stdRole){
                if(PlayerData.roleInfo.player_id == data.player_id){
                    MsgPanel.Show(`你被任命为公会${stdRole.Name}`);
                }else{
                    MsgPanel.Show(`${newMemberData.name || ""}被任命为公会${stdRole.Name}`);
                }
            }
            
        }
        EventMgr.emit(Evt_GuildChange);
    }
    
    private showErrorCode(code:number):void{
        let errorStr:string = this.errorStr[code];
        if(errorStr){
            MsgPanel.Show(errorStr);
        }
        
    }
}