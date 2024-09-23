import { Node, NodeEventType, Vec2, Vec3, __private, game, path, sp, v2 } from "cc";
import { GameObj } from "../../../GameRoot";
import { IEntity } from "./IEntity";
import { LikeNode } from "../MapData";
import { Lerp, Mathf, abss, minn } from "../../../utils/Utils";
import { FrameType, SkillBullet, SkillEffect } from "../SkillStruct";
import { ResMgr } from "../../../manager/ResMgr";
import { HomeScene } from "../HomeScene";
import { Bezier, CreateBezier } from "../../../utils/Bezier";
import { Tips } from "../../login/Tips";
import { DEV } from "cc/env";
import { Parabola } from "../../../utils/Parabola";
import Logger from "../../../utils/Logger";

export class Effect extends GameObj {

    private static dispatcher: Node = new Node();
    /** 添加监听 */
    static on(type: string | NodeEventType, callback: __private._types_globals__AnyFunction, target?: unknown, useCapture?: any): void {
        this.dispatcher.on(type, callback, target, useCapture);
    }
    /** 派发监听 */
    private static emit(type: string, arg0?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any): void {
        this.dispatcher.emit(type, arg0, arg1, arg2, arg3, arg4);
    }


    private static effects: { [id: string]: Effect } = {};
    private static seed: number = 0;

    protected $prefab: string = "prefabs/home/Effect";
    protected $skeBody: sp.Skeleton;
    private id: string;
    private cfg: SkillEffect;
    private bulletCfg: SkillBullet;
    private current: LikeNode;
    private target: LikeNode;
    private speed: number;
    private moveTick: number;
    private playTick: number;
    private bezier: Vec2[];
    private h: number;
    private loop = 0;
    private params: any[];

    protected onLoad(): void {
        this.$skeBody = this.find("ske", sp.Skeleton);
        this.$skeBody.setCompleteListener(this.onActionEnd.bind(this));
    }

    protected async play(action: string, loop: boolean = true) {
        if (!this.$skeBody.skeletonData) return;
        if (!this.$hasLoad) await this.loadSub;
        let actions = this.$skeBody.skeletonData.getAnimsEnum();
        if (!actions[action]) {
            let name = this.cfg ? this.cfg.Res : "";
            this.error(name + "找不到此动画:" + action + "请检查朝向配置");
            return;
        }
        this.$skeBody.setAnimation(0, action, loop);
    }

    private error(msg: string) {
        if (DEV) {
            Tips.Show(msg);
        } else {
            console.warn(msg);
        }
        this.finish();
    }
    private finish() {
        let params = this.params;
        this.receive();//回收
        this.params = undefined;
        Effect.emit(this.id, this.cfg, this.bulletCfg, params);
    }

    private onActionEnd() {
        this.loop++;
        if (this.bulletCfg) return;
        Logger.log("onActionEnd", this.playTick, this.loop, this.cfg.Times);
        if (this.playTick) {
            if (game.totalTime / 1000 < this.playTick) return;
        } else if (this.loop < this.cfg.Times) return;
        this.finish();
    }

    protected async init(id: any, cfg: SkillEffect, attacker: Node, isBack: boolean, isLeft: boolean) {
        if (id != undefined) {
            this.id = id;
        } else {
            this.id = "$$" + (++Effect.seed);
        }
        this.cfg = cfg;
        let offsetx = cfg.Offset[0] || 0;
        let offsety = cfg.Offset[1] || 0;
        switch (cfg.Depth) {
            case 0://角色下层
                if (!attacker) {
                    this.error("#0攻击角色错误！联系前端");
                    return;
                }
                attacker.addChild(this);
                this.setPosition(0, 0);
                this.setSiblingIndex(0);
                break;
            case 1://角色上层
                if (!attacker) {
                    console.warn("#1攻击角色错误！联系前端");
                    return;
                }
                attacker.addChild(this);
                this.setPosition(0, 0);
                break;
            case 2://影子层
                HomeScene.ins.AddShadow(this);
                this.setPosition(attacker.position.x, attacker.position.y);
                break;
            case 3://场景动态层
                HomeScene.ins.AddEntity(this);
                this.setPosition(attacker.position.x, attacker.position.y);
                break;
            case 4://天空层
                HomeScene.ins.AddSkyObj(this);
                this.setPosition(attacker.position.x, attacker.position.y);
                break;
        }
        if (cfg.Duration) {
            this.playTick = game.totalTime / 1000 + cfg.Duration;
        } else {
            this.playTick = undefined;
        }
        this.loop = 0;
        this.setScale(this.cfg.Scale || 1, this.cfg.Scale || 1);
        await this.loadSub;

        if (this.cfg.Res) {
            let url = path.join("spine/effect/", this.cfg.Res, this.cfg.Res);
            let currentId = this.id;
            let skeletonData = await ResMgr.LoadResAbSub(url, sp.SkeletonData);
            if (currentId != this.id) return;
            this.$skeBody.skeletonData = skeletonData;
        } else {
            this.$skeBody.skeletonData = undefined;
        }
        switch (this.cfg.Toward) {
            case 0:
                this.play("Front", true);
                break;
            case 1:
                if (isBack) {
                    this.play("Back", true);
                } else {
                    this.play("Front", true);
                }
                let scale = this.getScale();
                if (isLeft) {
                    this.setScale(abss(scale.x), scale.y);
                } else {
                    this.setScale(-abss(scale.x), scale.y);
                }
                break;
            case 2:
                this.play("Front", true);
                break;
        }
        if (attacker) {
            let hero: IEntity = <unknown>attacker as IEntity;
            let scale = this.getScale();
            if (hero.isLeft) {
                offsetx *= -1;
            }
            if (!hero.isBack) {
                offsety *= -1;
            }
            let p = this.position;
            this.setPosition(p.x + offsetx, p.y + offsety);
        }
    }

    /**
     * 运动
     * @param current 
     * @param target 
     */
    protected moveTo(current: LikeNode, target: LikeNode, bulletCfg: SkillBullet) {
        this.current = current;
        this.target = target;
        this.bulletCfg = bulletCfg;
        let leng = Mathf.distance(current, target);
        this.speed = leng / 64 / this.bulletCfg.Speed;
        this.moveTick = game.totalTime / 1000;
        let offsetX = this.bulletCfg.Offset[0] || 0;
        let offsetY = this.bulletCfg.Offset[1] || 0;
        if (bulletCfg.PathType == 1) {
            let p1 = v2(...bulletCfg.Path[0]);
            let p2 = v2(...bulletCfg.Path[1]);
            let p3 = v2(...bulletCfg.Path[2]);
            let p4 = v2(current.x, current.y);
            let p5 = v2(target.x, target.y);
            this.bezier = CreateBezier(p1, p2, p3, p4, p5, offsetX, offsetY);
            Logger.log("moveTo", this.bezier);
        } else if (bulletCfg.PathType == 2) {
            this.h = bulletCfg.Path[0][0];
        }
    }

    protected update(dt: number): void {
        if (!this.current || !this.target || !this.speed) return;
        let t = minn(1, (game.totalTime / 1000 - this.moveTick) / this.speed);
        if (!this.bulletCfg || this.bulletCfg.PathType == 0) {
            Lerp(this, this.current, this.target, t);
            // Logger.log("update", this.current, this.target, t);
        } else {
            if (this.bulletCfg.PathType == 1) {
                let result = Bezier(this.bezier[0], this.bezier[1], this.bezier[2], t);
                this.setPosition(result.x, result.y);
            } else {
                let start = v2(this.current.x, this.current.y);
                let end = v2(this.target.x, this.target.y);
                let [x, y] = Parabola(start, end, this.h, t);
                Logger.log("update", this.current.x, this.current.y, x, y, this.h);
                this.setPosition(x, y);
            }
            // Logger.log("update", result, t);
        }
        if (t >= 1) this.finish();
    }

    /**播放特效 */
    static Play(id: any, cfg: SkillEffect, attacker: IEntity) {
        let effect: Effect = Effect.Create();
        let node = <unknown>attacker as Node;
        effect.init(id, cfg, node, attacker.isBack, attacker.isLeft);
        return effect.id;
    }

    /**播放子弹 */
    static Bullet(id: any, bulletCfg: SkillBullet, attacker: IEntity, current: LikeNode, target: LikeNode, ...params: any[]) {
        let cfg: SkillEffect = {
            Id: 0,
            ObjType: FrameType.Effect,
            Desc: "",
            Res: bulletCfg.Res,
            Times: 0,
            Duration: 0,
            Depth: 4,
            Toward: 2,
            Offset: bulletCfg.Offset,
            Scale: bulletCfg.Scale
        };
        let effect: Effect = Effect.Create();
        effect.params = params;
        let node = <unknown>attacker as Node;
        effect.init(id, cfg, node, attacker.isBack, attacker.isLeft);
        effect.moveTo(current, target, bulletCfg);
        return effect.id;
    }
}
