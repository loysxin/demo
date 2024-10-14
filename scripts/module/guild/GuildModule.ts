import { CfgMgr, GuildPostType, StdGuide, StdGuildRole } from "../../manager/CfgMgr";
import { EventMgr, Evt_SelfApplyGuildUpdate, Evt_GuildChange, Evt_GuildSearch, Evt_GuildAuditUpdate, Evt_GuildAuditResult, Evt_GuildApplyResult, Evt_GuildRankUpdate, Evt_GuildEventUpdate } from "../../manager/EventMgr";
import { MsgTypeRet } from "../../MsgType";
import { Session } from "../../net/Session";
import { BeforeGameUtils } from "../../utils/BeforeGameUtils";
import { MsgPanel } from "../common/MsgPanel";
import { Tips } from "../login/Tips";
import PlayerData, { SGuild, SGuildAnnouncement, SGuildApplication, SGuildDepositTotal, SDeposit, SGuildEvent, SGuildJoinCriteria, SGuildMember } from "../roleModule/PlayerData";
import { GuildBankPanel } from "./GuildBankPanel";
import { GuildBankSelectPanel } from "./GuildBankSelectPanel";
import { GuildCreatPanel } from "./GuildCreatPanel";
import { GuildInfoPanel } from "./GuildInfoPanel";
import { GuildNonePanel } from "./GuildNonePanel";
import { GuildPanel } from "./GuildPanel";
import { GuildSavingsPanel } from "./GuildSavingsPanel";
import { GuildSavingsViewPanel } from "./GuildSavingsViewPanel";
/**错误码类型*/
enum GuildErrorCodeType {
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
    GuildErrorHomeLevelNotEnough           = 117, // 主城等级不足
	GuildErrorMemberMessageIsTooLong       = 118, // 成员心情留言过长
	GuildErrorPlayerApplicationsIsMax      = 119, // 玩家申请公会数量已达上限
	GuildErrorGuildApplicationsIsMax       = 120, // 公会申请数量已达上限
	GuildErrorHasInvalidApplications       = 121, //包含无效的申请
    GuildErrorHasBeensendApplications      = 122, //已发送过申请
    GuildErrorNameSuspect                  = 123, //公会名称内容不安全
    GuildErrorAnnouncementsuspect          = 124, //公会公告内容不安全
    GuildErrorMessagesuspect               = 125, //公会心情留言内容不安全
    GuildErrorExitCD                       = 126, //处于公会退出冷却时间
    GuildErrorBadAcceptLeaderMinJoinTime   = 127, //转让会长的目标成员入会时间不足
    GuildErrorNameExists                   = 128,//公会名字已存在
}
enum GuildBankErrorCode{
    gbErrGuildVerifyFailed = 300, // 玩家不在公会内，验证玩家公会归属不通过
	gbErrGuildLevelVerifyFailed = 301, // 操作要求公会等级不足
	gbErrNoConfigForDonateID = 302, // 无效的donateID，配置中不存在
	gbErrNoConfigForCostType = 303, // 无效的costType，配置中不存在
	gbErrDepositChargebackFailed = 304, // 扣款失败
	gbErrDepositTooManyTimes = 305, // 已经有存款了，不能在存款中继续存入
	gbErrDepositOnSettling = 306, // 结算中不能进行存款
	SysErrCode = 500, 			// 操作失败，服务器报错
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
        GuildErrorCodeType.GuildErrorHomeLevelNotEnough,"主城等级不足",
        GuildErrorCodeType.GuildErrorMemberMessageIsTooLong,"成员心情留言过长",
        GuildErrorCodeType.GuildErrorPlayerApplicationsIsMax,"玩家申请公会数量已达上限",
        GuildErrorCodeType.GuildErrorGuildApplicationsIsMax,"公会申请数量已达上限",
        GuildErrorCodeType.GuildErrorHasInvalidApplications,"包含无效的申请",
        GuildErrorCodeType.GuildErrorHasBeensendApplications,"已发送过申请",
        GuildErrorCodeType.GuildErrorNameSuspect,"公会名称内容不安全",
        GuildErrorCodeType.GuildErrorAnnouncementsuspect,"公会公告内容不安全",
        GuildErrorCodeType.GuildErrorMessagesuspect,"公会心情留言内容不安全",
        GuildErrorCodeType.GuildErrorExitCD,"处于公会退出冷却时间",
        GuildErrorCodeType.GuildErrorBadAcceptLeaderMinJoinTime,"转让会长的目标成员入会时间不足",
        GuildErrorCodeType.GuildErrorNameExists,"公会名字已存在",
        
    );
    private bankErrorStr:{[key: string]: string} = BeforeGameUtils.toHashMapObj(
        GuildBankErrorCode.gbErrGuildVerifyFailed,"玩家不在公会内，验证玩家公会归属不通过",
        GuildBankErrorCode.gbErrGuildLevelVerifyFailed,"操作要求公会等级不足",
        GuildBankErrorCode.gbErrNoConfigForDonateID,"无效的donateID，配置中不存在",
        GuildBankErrorCode.gbErrNoConfigForCostType,"无效的costType，配置中不存在",
        GuildBankErrorCode.gbErrDepositChargebackFailed,"扣款失败",
        GuildBankErrorCode.gbErrDepositTooManyTimes,"已经有存款了，不能在存款中继续存入",
        GuildBankErrorCode.gbErrDepositOnSettling,"结算中不能进行存款",
        GuildBankErrorCode.SysErrCode,"操作失败，服务器报错",
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
        Session.on(MsgTypeRet.GuildKickPush, this.onGuildKickPush, this); 
        Session.on(MsgTypeRet.GuildChangeMemberRoleRet, this.onGuildChangeMemberRoleRet, this);   
        Session.on(MsgTypeRet.GuildChangeMemberLeaderRet, this.onGuildChangeMemberLeaderRet, this);
        Session.on(MsgTypeRet.GuildChangeAnnouncementRet, this.onGuildChangeAnnouncementRet, this);
        Session.on(MsgTypeRet.GuildChangeLogoRet, this.onGuildChangeLogoRet, this);
        Session.on(MsgTypeRet.GuildChangeNameRet, this.onGuildChangeNameRet, this);
        Session.on(MsgTypeRet.GuildChangeJoinCriteriaRet, this.onGuildChangeJoinCriteriaRet, this);
        Session.on(MsgTypeRet.GuildChangeSelfMessageRet, this.onGuildChangeSelfMessageRet, this);
        Session.on(MsgTypeRet.GuildGetSelfApplicationsRet, this.onGuildGetSelfApplicationsRet, this);
        Session.on(MsgTypeRet.GuildGetApplicationsRet, this.onGuildGetApplicationsRet, this);
        Session.on(MsgTypeRet.GuildMemberChangePush, this.onGuildMemberChangePush, this);
        Session.on(MsgTypeRet.GuildApprovalApplicationsRet, this.onGuildApprovalApplicationsRet, this);
        Session.on(MsgTypeRet.GuildBankGetDepositInfosRet, this.onGuildBankGetDepositTotalsRet, this);
        Session.on(MsgTypeRet.GuildBankGetDonateDepositsRet, this.onGuildBankGetDonateDepositsRet, this);
        Session.on(MsgTypeRet.GuildGetRankingListRet, this.onGuildGetRankingListRet, this);
        Session.on(MsgTypeRet.GuildBankDepositRet, this.onGuildBankDepositRet, this);
        Session.on(MsgTypeRet.GuildJoinPush, this.onGuildJoinPush, this);
        Session.on(MsgTypeRet.GuildInfoChangePush, this.onGuildInfoChangePush, this);
        
    }
    private onGuildCreate(data:{code:number, guild:SGuild}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        }
        GuildNonePanel.Hide();
        PlayerData.MyGuild = data.guild;
        EventMgr.emit(Evt_GuildChange);
        GuildPanel.Show();
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
        if(!data.events) return;
        let eventData:SGuildEvent;
        for (let index = 0; index < data.events.length; index++) {
            eventData = data.events[index];
           
        }
        
        EventMgr.emit(Evt_GuildEventUpdate, data.events);
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
    private onGuildJoinRet(data:{code:number, guild:SGuild, guild_id:string, is_join_immediately:boolean, is_send_applications:boolean, send_applications:SGuildApplication}):void{
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
            EventMgr.emit(Evt_GuildApplyResult, data.send_applications);
            MsgPanel.Show("申请成功");
        }
    }
    private onGuildLeaveRet(data:{code:number, guild_id:string}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        MsgPanel.Show("成功退出公会");
        PlayerData.ResetMyGuildData();
        EventMgr.emit(Evt_GuildChange);
    }
    private onGuildKickRet(data:{code:number, guild_id:string, player_id:string}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        if(PlayerData.MyGuild){
            let memberData:SGuildMember = PlayerData.MyGuild.members[data.player_id];
            if(memberData){
                delete PlayerData.MyGuild.members[data.player_id];
                PlayerData.MyGuild.member_count--;
                MsgPanel.Show(`${memberData.name||""}被踢出公会`);
            }
        }
        EventMgr.emit(Evt_GuildChange);
    }
    private onGuildKickPush(data:{code:number, guild_id:string}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        if(PlayerData.MyGuild && PlayerData.MyGuild.guild_id == data.guild_id){
            PlayerData.ResetMyGuildData();
            Tips.Show("你被踢出公会");
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
    private onGuildChangeAnnouncementRet(data:{code:number, guild_id:string, new_announcement:SGuildAnnouncement}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.MyGuild.announcement = data.new_announcement;
        this.updateGuildBaseChange();
    }
    private onGuildChangeLogoRet(data:{code:number, guild_id:string, new_logo:string}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.MyGuild.logo = data.new_logo;
        this.updateGuildBaseChange();
    }
    private onGuildChangeNameRet(data:{code:number, guild_id:string, new_name:string, new_count:number}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.MyGuild.name = data.new_name;
        PlayerData.MyGuild.name_changed = data.new_count || 0;
        this.updateGuildBaseChange();
    }
    private onGuildChangeJoinCriteriaRet(data:{code:number, guild_id:number, new_join_criteria:SGuildJoinCriteria}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.MyGuild.join_criteria = data.new_join_criteria;
        this.updateGuildBaseChange();
    }
    private onGuildChangeSelfMessageRet(data:{code:number, new_message:string}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        if(PlayerData.MyGuild){
            let temp:SGuildMember = PlayerData.MyGuild.members[PlayerData.roleInfo.player_id];
            if(temp){
                temp.message = data.new_message;
                MsgPanel.Show(`修改留言成功！`);
                EventMgr.emit(Evt_GuildChange);
            }
           
        }
    }
    private onGuildGetSelfApplicationsRet(data:{code:number, applications:SGuildApplication[]   }):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_SelfApplyGuildUpdate, data.applications || []);
    }
    private onGuildJoinPush(data:{code:number, guild:SGuild}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        PlayerData.MyGuild = data.guild;
        if(GuildNonePanel.Showing){
            GuildPanel.Show();
            GuildNonePanel.Hide();
        }
        
    }
    private onGuildInfoChangePush(data:{guild:SGuild}):void{
        PlayerData.MyGuild = data.guild;
        
        EventMgr.emit(Evt_GuildChange);
    }
    private onGuildGetApplicationsRet(data:{code:number, applications:SGuildApplication[]}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_GuildAuditUpdate, data.applications);
    }
    private onGuildMemberChangePush(data:{code:number, guild_id:string, member_add:SGuildMember[], member_remove:SGuildMember[], member_update:SGuildMember[]}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        if(!PlayerData.MyGuild) return;
        let memberData:SGuildMember;
        if(data.member_add){
            for (let index = 0; index < data.member_add.length; index++) {
                memberData = data.member_add[index];
                PlayerData.MyGuild.member_count ++ ;
                PlayerData.MyGuild.members[memberData.player_id] = memberData;
            }
        }
        if(data.member_remove){
            for (let index = 0; index < data.member_remove.length; index++) {
                memberData = data.member_remove[index];
                PlayerData.MyGuild.member_count --;
                delete PlayerData.MyGuild.members[memberData.player_id];
            }
        }
        if(data.member_update){
            for (let index = 0; index < data.member_update.length; index++) {
                memberData = data.member_update[index];
                PlayerData.MyGuild.members[memberData.player_id] = memberData;
            }
        }
        
        EventMgr.emit(Evt_GuildChange);
    }
    private onGuildApprovalApplicationsRet(data:{code:number, is_permit:boolean, applications_ids:string[], failed_applications_ids:string[], failed_applications_ids_codes:number[]}):void{
        if(data.failed_applications_ids_codes && data.failed_applications_ids_codes.length > 0){
            for (let index = 0; index < data.failed_applications_ids_codes.length; index++) {
                this.showErrorCode(data.failed_applications_ids_codes[index]);
            }
            
        }
        EventMgr.emit(Evt_GuildAuditResult, data.is_permit, data.applications_ids||[], data.failed_applications_ids||[]);
    }
    private onGuildBankGetDepositTotalsRet(data:{code:number, info:SDeposit, totals:SGuildDepositTotal}):void{
        if(data.code){
            this.showBankErrorCode(data.code);
            return;
        } 
        if(data.info && data.info.status == "active"){
            
            GuildBankPanel.Show(data.info, data.totals[data.info.cost_type]);
        }else{
            GuildBankSelectPanel.Show(data.totals||{});
        }
    }
    private onGuildBankGetDonateDepositsRet(data:{code:number, list:SDeposit[]}):void{
        if(data.code){
            this.showBankErrorCode(data.code);
            return;
        }
        GuildSavingsViewPanel.Show(data.list);
        
    }
    private onGuildGetRankingListRet(data:{code:number, guild_ranking:{[key:string]:SGuild[]}}):void{
        if(data.code){
            this.showErrorCode(data.code);
            return;
        } 
        EventMgr.emit(Evt_GuildRankUpdate, data.guild_ranking);
    }
    private onGuildBankDepositRet(data:{code:number, info:SDeposit, totals:SGuildDepositTotal}):void{
        if(data.code){
            this.showBankErrorCode(data.code);
            return;
        } 
        if(data.info && data.info.status == "active"){
            MsgPanel.Show(`储蓄成功！`);
            GuildBankSelectPanel.Hide();
            GuildSavingsPanel.Hide();
            GuildBankPanel.Show(data.info, data.totals[data.info.cost_type]);
        }
        
        
    }
    
    private timeNumber:any = null;
    private updateGuildBaseChange():void{
        this.clearTime();
        this.timeNumber = setTimeout(()=>{
            MsgPanel.Show(`修改成功！`);
            this.clearTime();
            EventMgr.emit(Evt_GuildChange);
        }, 200);
    }
    private clearTime():void{
        if(this.timeNumber){
            clearTimeout(this.timeNumber);
            this.timeNumber = null;
        }
    }
    private showErrorCode(code:number):void{
        let errorStr:string = this.errorStr[code];
        if(errorStr){
            MsgPanel.Show(errorStr);
        }
        
    }
    private showBankErrorCode(code:number):void{
        let errorStr:string = this.bankErrorStr[code];
        if(errorStr){
            MsgPanel.Show(errorStr);
        }
        
    }
}