import { MsgTypeRet, MsgTypeSend } from "../../MsgType";
import { CfgMgr, ThingType } from "../../manager/CfgMgr";
import { EventMgr, Evt_CloseFriendBindOrUnbindPanel, Evt_GetContactInfo, Evt_GetDownLineInfo, Evt_GetIncomeRecords, Evt_GetIncommons, Evt_GetRandomDownline, Evt_GetUPLineInfo, Evt_SetAssistRole, Evt_UpdateFriendAssistRole } from "../../manager/EventMgr";
import { Session } from "../../net/Session";
import { ToFixed, formatNumber } from "../../utils/Utils";
import { RewardTips } from "../common/RewardTips";
import { Tips } from "../login/Tips";
import PlayerData, { SAssistRoleInfo, SDownlineInfo, SGetAgentInfo, SGetContactInfo, SGetDownlines, SGetIncomes, SIncomeRecordInfo, SIncomeRecords, SIncomesInfo, SPlayerData, SPlayerDataItem, SThing } from "../roleModule/PlayerData";

export class FrienModule {
    constructor() {
        Session.on(MsgTypeRet.GetAgentInfoRet, this.GetAgentInfo, this);
        Session.on(MsgTypeRet.GetIncomesRet, this.GetIncomes, this);
        Session.on(MsgTypeRet.IncomeRet, this.IncomeResponse, this);
        Session.on(MsgTypeRet.GetDownlinesRet, this.GetDownlines, this);
        Session.on(MsgTypeRet.GetUplineInfoRet, this.GetUplineInfo, this);
        Session.on(MsgTypeRet.BindUplineRet, this.BindUpline, this);
        Session.on(MsgTypeRet.UnbindUplineRet, this.UnbindUpline, this);
        Session.on(MsgTypeRet.GetContactInfoRet, this.GetContactInfo, this);
        Session.on(MsgTypeRet.GetIncomeRecordsRet, this.GetIncomeRecords, this);

        Session.on(MsgTypeRet.SetAssistRoleRet, this.SetAssistRole, this);
        Session.on(MsgTypeRet.GetAssistRolesRet, this.GetAssistRole, this);
        Session.on(MsgTypeRet.UnlockAssistRoleSlotRet, this.UnlockAssistRoleSlot, this);
        Session.on(MsgTypeRet.CollectAssistIncomeRet, this.CollectAssistIncome, this);
        Session.on(MsgTypeRet.SetAssistRoleUsageFeeRet, this.SetAssistRoleUsageFee, this);
        

        

    }

    /**请求数据 */

    private GetIncomesReq(){
        let incomeData = {
            type: MsgTypeSend.GetIncomesRequest,
            data: {},
        }
        Session.Send(incomeData);

       
    }

    private GetAgentInfoReq(){
        let friendData = {
            type: MsgTypeSend.GetAgentInfoRequest,
            data: {},
        }
        Session.Send(friendData);
    }


    /**玩家上线好友以收益信息 */
    private GetAgentInfo(data: SGetAgentInfo) {
        let role_data = PlayerData.GetRoles()
        if(data.assist_roles && data.assist_roles.length > 0){
            for (let index = 0; index < role_data.length; index++) {
                let is_has = false
                const element  = role_data[index];
                for (let index = 0; index < data.assist_roles.length; index++) {
                    const assist_roles_element = data.assist_roles[index];
                    if(assist_roles_element.role_id == element.id){
                        element.is_assisting = true;
                        is_has = true;
                        break;
                    }     
                }
                if(!is_has){
                    element.is_assisting = false;
                }
            }
        }else{
            for (let index = 0; index < role_data.length; index++) {          
                const element  = role_data[index];          
                element.is_assisting = false;
            }
        }

        EventMgr.emit(Evt_GetIncommons, data)
    }

    /**收益列表 */
    private GetIncomes(data: SGetIncomes) {
        EventMgr.emit(Evt_GetIncommons, data)
    }

    /**领取收益 */
    private IncomeResponse(data) {
        if (data.amount) {
            this.GetIncomesReq();
            this.GetAgentInfoReq();
            let reward: SThing[] = [{ type: ThingType.ThingTypeCurrency, currency: {type: 3, value: data.amount} }]
            RewardTips.Show(reward)
        }
    }

    /**获取下线好友 */
    private GetDownlines(data: SGetDownlines) {
        if(data.include_role){
            //好友的助战角色列表
            // EventMgr.emit(Evt_UpdateFriendAssistRole, data);
        }else{
            //好友列表
            EventMgr.emit(Evt_GetDownLineInfo, data);
            EventMgr.emit(Evt_GetRandomDownline, data);
        }
    }

    /**上线好友信息 */
    private GetUplineInfo(data) {
        EventMgr.emit(Evt_GetUPLineInfo, data)
    }

    /**绑定上线 */
    private BindUpline(data) {
        if (data.upline_id) {
            let upLineData = {
                type: MsgTypeSend.GetUplineInfoRequest,
                data: {},
            }
            Session.Send(upLineData);
            EventMgr.emit(Evt_CloseFriendBindOrUnbindPanel)
        } else {
            Tips.Show("绑定失败")
        }
    }

    /**解绑上线 */
    private UnbindUpline(data) {
        let upLineData = {
            type: MsgTypeSend.GetUplineInfoRequest,
            data: {},
        }
        Session.Send(upLineData);
        EventMgr.emit(Evt_CloseFriendBindOrUnbindPanel)
    }

    /**好友联系方式 */
    private GetContactInfo(data) {
        let datas: SGetContactInfo;
        if (data.player_id != "") {
            datas = data;
        } else {
            datas = { player_id: "1211", name: "hahah", wechat_id: "110", qq_id: "120", };
        }
        EventMgr.emit(Evt_GetContactInfo, datas);
    }

    /**收益记录 */
    private GetIncomeRecords(data:SIncomeRecords){
        EventMgr.emit(Evt_GetIncomeRecords, data);
    }

    /**设置角色助战 */
    private SetAssistRole(data:{fee:number, role_id:string, slot:number, canceled_role:string}) {
        if(data){
            this.updeteInfo();
            // if(data.role_id && data.canceled_role == ""){
            //     let role = PlayerData.GetRoleById(data.role_id)
            //     role.is_assisting = true;
            // }else{
            //     let role = PlayerData.GetRoleById(data.canceled_role)
            //     role.is_assisting = false;
            // }
            EventMgr.emit(Evt_SetAssistRole,data);       
        }else{
            Tips.Show("助战失败")
        }
    }

    /**获取助战角色列表 */
    private GetAssistRole(data:{assistRoles:SAssistRoleInfo[]}) {
        console.log("获取助战角色列表", data)
        if(data && data.assistRoles){
            EventMgr.emit(Evt_UpdateFriendAssistRole, data);
        }
    }

    /**空位解锁 */
    private UnlockAssistRoleSlot(data){
       this.updeteInfo();
        console.log("空位解锁", data)

    }

     /**领取助战奖励 */
     private CollectAssistIncome(data){
        // let count = parseInt(formatDecimal(data.amount, 2));
        let reward: SThing[] = [{ type: ThingType.ThingTypeCurrency, currency: {type: 0, value: data.collected_amount} }]
        RewardTips.Show(reward)
        console.log("领取助战奖励", reward)

    }

    /**设置助战费用 */
    private SetAssistRoleUsageFee(){
        this.updeteInfo();
    }

    /**解锁/助战/取消助战 后刷新数据 */
    private updeteInfo(){
        let friendData = {
            type: MsgTypeSend.GetAgentInfoRequest,
            data: {},
        }
        Session.Send(friendData);
    }

  

    
















}