export enum FrameType {
    Box = 1,    //伤害盒子
    Effect = 2, //特效
    Shake = 3,  //震屏
    Bullet = 4, //子弹
    Sound = 5,  //声音
    End = 6
}

export type SkillCfg = {
    SkillId: number;     //技能id
    Level: number;      //技能等级
    Name: string;        //名字
    Description: string; //描述
    Type: number;        //技能类型 1普通技能,2被动技能
    ReleaseType: number; //技能释放类型（1自动2主动自动切换）
    Range: number;       //技能范围
    Prefab: string;      //绑定动作
    ActionId: number;     //技能动作ID
    EndTime: number;
    TargetType: number;  //技能目标类型（0无目标1自己2范围内最近敌人3范围内最远敌人4范围内随机敌人5血量最低敌人6血量最高敌人7血量最低友军8攻击力最高友军）
    // Frameobj: (SkillBox | SkillEffect | SkillShake | SkillBullet | SkillSound | SkillAffect)[];
    // TimeLine: number[];
    CD: number;
    Icon: string;
    Quality: number;
}
export type SkillFrameEvent = {
    Id:number;
    ObjType:number;
    Ratio:number;
    TimeTick:number;
}
export type SkillAction = {
    ActionId: number;
    FrameEvents: SkillFrameEvent[];
    TimeLine: number[];
}

export type SkillLevel = {
    Level: number;       //技能等级
    CD: number;          //技能cd
    ActionId: number;
    ActionParams: {};
}


export type SkillBox = {
    Id: number;            //id
    ObjType: number;       //载体类型详见FrameType
    Desc: string;          //描述
    // RangeType: number;  //伤害盒子类型（0无范围1自身为中心圆形2自身为中心矩形3自身为中心扇形）
    RangePara: number[][]; //伤害盒子范围参数（对应范围类型的大小调整）
    Target: number;        //目标类型  0.自身1.自身碰撞范围所有单位2.目标3.目标碰撞范围所有单位4.碰撞目标5.碰撞目标的碰撞范围所有单位
    SearchType: number;    //搜索类型 
    Affect: SkillAffect[]; //效果表
    HitSound: SkillFrameEvent[];
    HitShake: SkillFrameEvent[];
    HitEffect: SkillFrameEvent[];
    TimeTick?: number;
}

export type SkillEffect = {
    Id: number;        //id
    ObjType: number;   //载体类型详见FrameType
    Desc: string;      //描述
    Res: string;       //特效资源名
    Times: number;     //播放次数
    Duration: number;  //持续时间
    Depth: number;     //层级(0角色下层，1角色上层，2影子层，3场景动态层，4天空层
    Toward: number;    //方向(0无朝向，1跟角色朝向同步，2跟移动方向同步
    Offset: number[];  //特效偏移
    Scale: number;     //特效缩放
}

export enum EffectToward {
    none,
    face,
    move
}

export type SkillShake = {
    Id: number;       //id
    ObjType: number;  //载体类型详见FrameType
    Desc: string;     //描述
    Type: number;     //震动类型(1摄像机抖动,2摄像机拉伸,3复合)
    Power: number;    //震动幅度
    Tick: number;     //震动频率（秒）
    Duration: number; //震动持续时间
}

export type SkillBullet = {
    Id: number;          //id
    ObjType: number;     //载体类型详见FrameType
    Desc: string;        //描述
    Res: string;         //特效资源名
    DelayShoot: number[];      //子弹发射延迟
    Offset: number[];    //特效偏移
    Scale: number;       //缩放
    // FireType:number;     //发射类型 0单个 1多个散射 2连续发射
    // FireParams:number[]; //散射类型[间隔角度，数量]; 连射类型[间隔时间,数量]
    FireTarget: number;  //子弹以自身坐标出发还是目标坐标出发
    FireOffset: number[];//生成子弹距离出发位置的相对坐标
    TargetType: number;     //攻击目标的类型（0无目标1自己2范围内最近敌人3范围内最远敌人4范围内随机敌人5血量最低敌人6血量最高敌人7血量最低友军8攻击力最高友军）
    HitBound: number[][];//碰撞格子
    LifeTime: number;    //子弹存活时间
    Speed: number;       //子弹速度
    PathType: number;    //路径类型0直线，1抛物线
    Path: number[][];    //子弹飞行路径（1直线2抛物线、、、）
    HitNumber: number;   //子弹穿透次数
    HitInterval: number; //子弹击中间隔
    HitBullet: SkillFrameEvent[];//命中后生成的子弹
    EndBullet: SkillFrameEvent[];//消失后生成的子弹
    HitBox: SkillFrameEvent[];
    EndEffect: SkillFrameEvent[]; //消失后生成的特效
    // HitSound: SkillSound[];
    // HitShake: SkillShake[];
    // HitEffect: SkillEffect[];
}

export type SkillSound = {
    Id: number;
    ObjType: number;
    Desc: string;
    Url: string;
    Times: number;
    Duration: number;
}

export type SkillAffect = {
    Id: number;      //id
    ObjType: number; //载体类型详见FrameTypes
    Desc: string;    //描述
    LifeTime: number; //持续时间
    CanRemove: number; //是否可移除
    MaxCount: Number;   //最大叠加数量
}

export function IsLink(objType: number, fileName: string) {
    if (objType == FrameType.Box) {
        switch (fileName) {
            case "Affect":
                return 0;
            case "HitSound":
                return FrameType.Sound;
            case "HitShake":
                return FrameType.Shake;
            case "HitEffect":
                return FrameType.Effect;
        }
    }
    if (objType == FrameType.Bullet) {
        switch (fileName) {
            // case "HitSound":
            //     return FrameType.Sound;
            // case "HitShake":
            //     return FrameType.Shake;
            // case "HitEffect":
            //     return FrameType.Effect;
            case "HitBox":
                return FrameType.Box;
            case "HitBullet":
            case "EndBullet":
                return FrameType.Bullet;
            case "EndEffect":
                return FrameType.Effect;
        }
    }
    return undefined;
}