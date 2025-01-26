import {
  account_manager,
  action_base,
  action_planner,
  alife_simulator,
  CALifeSmartTerrainTask,
  CCar,
  CConsole,
  CGameTask,
  color,
  cond,
  cover_point,
  CPhrase,
  CPhraseDialog,
  CPhraseScript,
  CPhysicObject,
  CSavedGameWrapper,
  CScriptXmlInit,
  cse_abstract,
  cse_alife_creature_abstract,
  cse_alife_creature_actor,
  cse_alife_dynamic_object,
  cse_alife_dynamic_object_visual,
  cse_alife_helicopter,
  cse_alife_human_abstract,
  cse_alife_inventory_box,
  cse_alife_item,
  cse_alife_item_ammo,
  cse_alife_item_artefact,
  cse_alife_item_custom_outfit,
  cse_alife_item_detector,
  cse_alife_item_grenade,
  cse_alife_item_helmet,
  cse_alife_item_pda,
  cse_alife_item_torch,
  cse_alife_item_weapon,
  cse_alife_item_weapon_auto_shotgun,
  cse_alife_item_weapon_magazined,
  cse_alife_item_weapon_magazined_w_gl,
  cse_alife_item_weapon_shotgun,
  cse_alife_level_changer,
  cse_alife_monster_abstract,
  cse_alife_monster_base,
  cse_alife_object,
  cse_alife_object_hanging_lamp,
  cse_alife_object_physic,
  cse_alife_online_offline_group,
  cse_alife_smart_zone,
  cse_alife_space_restrictor,
  cse_anomalous_zone,
  cse_smart_cover,
  cse_torrid_zone,
  cse_zone_visual,
  CTime,
  CUIGameCustom,
  CZoneCampfire,
  danger_object,
  effector_params,
  entity_action,
  flags32,
  FS_file_list,
  FS_file_list_ex,
  FS_item,
  game_object,
  GameGraph__CVertex,
  hanging_lamp,
  hit,
  ini_file,
  IXR_squad_member,
  login_manager,
  move,
  net_packet,
  noise,
  object_binder,
  object_factory,
  particles_object,
  patrol,
  physics_element,
  physics_joint,
  physics_shell,
  profile,
  profile_store,
  profile_timer,
  property_evaluator,
  property_storage,
  reader,
  render_device,
  sound_object,
  TXR_animation,
  TXR_animation_key,
  TXR_bloodsucker_visibility_state,
  TXR_callback,
  TXR_class_id,
  TXR_class_key,
  TXR_danger_object,
  TXR_DIK_key,
  TXR_entity_action,
  TXR_GAME_TYPE,
  TXR_look,
  TXR_MonsterBodyStateKey,
  TXR_move,
  TXR_net_processor,
  TXR_ProfilerType,
  TXR_relation,
  TXR_SightType,
  TXR_snd_type,
  TXR_sound_key,
  TXR_sound_object_type,
  TXR_TaskState,
  TXR_ui_event,
  vector,
  vector2,
  world_property,
  world_state,
} from "xray16";

export type ALifeSmartTerrainTask = CALifeSmartTerrainTask;
export type AccountManager = account_manager;
export type ActionBase = action_base;
export type ActionPlanner = action_planner;
export type AlifeSimulator = alife_simulator;
export type AnyGameObject = game_object | cse_alife_object;
export type Car = CCar;
export type Color = color;
export type Cond = cond;
export type Console = CConsole;
export type CoverPoint = cover_point;
export type DangerObject = danger_object;
export type EffectorParams = effector_params;
export type EntityAction = entity_action;
export type FSFileList = FS_file_list;
export type FSFileListEX = FS_file_list_ex;
export type FSItem = FS_item;
export type Flags32 = flags32;
export type GameGraphVertex = GameGraph__CVertex;
export type GameHud = CUIGameCustom;
export type GameObject = game_object;
export type GameTask = CGameTask;
export type HangingLamp = hanging_lamp;
export type Hit = hit;
export type IniFile = ini_file;
export type LoginManager = login_manager;
export type MonsterBodyStateKey = TXR_MonsterBodyStateKey;
export type Move = move;
export type NetPacket = net_packet;
export type NetProcessor = TXR_net_processor;
export type NetReader = reader;
export type Noise = noise;
export type ObjectBinder = object_binder;
export type ObjectFactory = object_factory;
export type ParticlesObject = particles_object;
export type Patrol = patrol;
export type Phrase = CPhrase;
export type PhraseDialog = CPhraseDialog;
export type PhraseScript = CPhraseScript;
export type PhysicObject = CPhysicObject;
export type PhysicsElement = physics_element;
export type PhysicsJoint = physics_joint;
export type PhysicsShell = physics_shell;
export type Profile = profile;
export type ProfileStore = profile_store;
export type ProfileTimer = profile_timer;
export type PropertyEvaluator = property_evaluator;
export type PropertyStorage = property_storage;
export type RenderDevice = render_device;
export type SavedGameWrapper = CSavedGameWrapper;
export type ServerAbstractObject = cse_abstract;
export type ServerActorObject = cse_alife_creature_actor;
export type ServerAnomalousZoneObject = cse_anomalous_zone;
export type ServerArtefactItemObject = cse_alife_item_artefact;
export type ServerCreatureObject = cse_alife_creature_abstract;
export type ServerDynamicObject = cse_alife_dynamic_object;
export type ServerDynamicVisualObject = cse_alife_dynamic_object_visual;
export type ServerGroupObject = cse_alife_online_offline_group;
export type ServerHangingLampObject = cse_alife_object_hanging_lamp;
export type ServerHelicopterObject = cse_alife_helicopter;
export type ServerHumanObject = cse_alife_human_abstract;
export type ServerInventoryBox = cse_alife_inventory_box;
export type ServerItemAmmoObject = cse_alife_item_ammo;
export type ServerItemArtefactObject = cse_alife_item_artefact;
export type ServerItemDetectorObject = cse_alife_item_detector;
export type ServerItemGrenadeObject = cse_alife_item_grenade;
export type ServerItemHelmetObject = cse_alife_item_helmet;
export type ServerItemObject = cse_alife_item;
export type ServerItemOutfitObject = cse_alife_item_custom_outfit;
export type ServerItemPdaObject = cse_alife_item_pda;
export type ServerItemTorchObject = cse_alife_item_torch;
export type ServerLevelChangerObject = cse_alife_level_changer;
export type ServerMonsterAbstractObject = cse_alife_monster_abstract;
export type ServerMonsterBaseObject = cse_alife_monster_base;
export type ServerObject = cse_alife_object;
export type ServerPhysicObject = cse_alife_object_physic;
export type ServerSmartCoverObject = cse_smart_cover;
export type ServerSmartZoneObject = cse_alife_smart_zone;
export type ServerSpaceRestrictorObject = cse_alife_space_restrictor;
export type ServerSquadMemberDescriptor<T extends cse_alife_creature_abstract = cse_alife_creature_abstract> =
  IXR_squad_member<T>;
export type ServerTorridZoneObject = cse_torrid_zone;
export type ServerWeaponAutoShotgunObject = cse_alife_item_weapon_auto_shotgun;
export type ServerWeaponMagazinedObject = cse_alife_item_weapon_magazined;
export type ServerWeaponMagazinedWGLObject = cse_alife_item_weapon_magazined_w_gl;
export type ServerWeaponObject = cse_alife_item_weapon;
export type ServerWeaponShotgunObject = cse_alife_item_weapon_shotgun;
export type ServerZoneObject = cse_zone_visual;
export type SoundObject = sound_object;
export type TAnimationKey = TXR_animation_key;
export type TAnimationType = TXR_animation;
export type TBloodsuckerVisibilityState = TXR_bloodsucker_visibility_state;
export type TCallback = TXR_callback;
export type TClassId = TXR_class_id;
export type TClassKey = TXR_class_key;
export type TDangerType = TXR_danger_object;
export type TEntityActionType = TXR_entity_action;
export type TGameType = TXR_GAME_TYPE;
export type TKeyCode = TXR_DIK_key;
export type TLookType = TXR_look;
export type TMoveType = TXR_move;
export type TProfilerType = TXR_ProfilerType;
export type TRelationType = TXR_relation;
export type TSightType = TXR_SightType;
export type TSoundKey = TXR_sound_key;
export type TSoundObjectType = TXR_sound_object_type;
export type TSoundType = TXR_snd_type;
export type TTaskState = TXR_TaskState;
export type TUIEvent = TXR_ui_event;
export type Time = CTime;
export type Vector = vector;
export type Vector2D = vector2;
export type Vertex = GameGraph__CVertex;
export type WorldProperty = world_property;
export type WorldState = world_state;
export type XmlInit = CScriptXmlInit;
export type ZoneCampfire = CZoneCampfire;

export enum EGameObjectPath {
  GAME_PATH = game_object?.game_path || 0,
  LEVEL_PATH = game_object?.level_path || 1,
  PATROL_PATH = game_object?.patrol_path || 2,
}

export enum EGameObjectRelation {
  FRIEND = game_object?.friend || 0,
  NEUTRAL = game_object?.neutral || 1,
  ENEMY = game_object?.enemy || 2,
}

export enum EGameObjectMovementType {
  MASK = game_object?.alifeMovementTypeMask || 0,
  RANDOM = game_object?.alifeMovementTypeRandom || 1,
}

export enum ESoundObjectType {
  S3D = sound_object.s3d || 0,
  LOOPED = sound_object.looped || 1,
  S2D = sound_object.s2d || 2,
}

/**
 * Current state of actor menu interaction.
 */
export enum EActorMenuMode {
  UNDEFINED = 0,
  INVENTORY = 1,
  TRADE = 2,
  UPGRADE = 3,
  DEAD_BODY_SEARCH = 4,
  TALK_DIALOG = 9,
  TALK_DIALOG_SHOW = 10,
  TALK_DIALOG_HIDE = 11,
}

/**
 * Type of actor UI window to drag drop items.
 */
export enum EActorMenuType {
  INVALID = 0,
  ACTOR_SLOT,
  ACTOR_BAG,
  ACTOR_BELT,
  ACTOR_TRADE,
  PARTNER_TRADE_BAG,
  PARTNER_TRADE,
  DEAD_BODY_BAG,
  QUICK_SLOT,
  TRASH_SLOT,
  LIST_TYPE_MAX,
}
