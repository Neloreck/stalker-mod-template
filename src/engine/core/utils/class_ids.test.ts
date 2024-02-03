import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { clsid } from "xray16";

import { registerSimulator } from "@/engine/core/database";
import { Squad } from "@/engine/core/objects/squad";
import {
  isActor,
  isArtefact,
  isBoar,
  isBurer,
  isController,
  isCreature,
  isDog,
  isFlesh,
  isGrenade,
  isMonster,
  isMonsterSquad,
  isPoltergeist,
  isPsyDog,
  isSmartTerrain,
  isSnork,
  isSquad,
  isSquadId,
  isStalker,
  isStrappableWeapon,
  isTrader,
  isTushkano,
  isWeapon,
} from "@/engine/core/utils/class_ids";
import { MAX_U16 } from "@/engine/lib/constants/memory";
import { ServerActorObject, ServerHumanObject, ServerObject } from "@/engine/lib/types";
import { MockSquad } from "@/fixtures/engine";
import { MockAlifeCreatureActor, MockAlifeHumanStalker, MockAlifeObject, MockGameObject } from "@/fixtures/xray";

describe("isArtefact utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object is an artefact", () => {
    expect(isArtefact(MockGameObject.mockWithClassId(clsid.artefact))).toBe(true);
    expect(isArtefact(MockGameObject.mockWithClassId(clsid.artefact_s))).toBe(true);
    expect(isArtefact(MockGameObject.mockWithClassId(clsid.art_black_drops))).toBe(true);
    expect(isArtefact(MockAlifeObject.mockWithClassId(clsid.artefact))).toBe(true);
    expect(isArtefact(MockAlifeObject.mockWithClassId(clsid.artefact_s))).toBe(true);
    expect(isArtefact(MockAlifeObject.mockWithClassId(clsid.art_black_drops))).toBe(true);

    expect(isArtefact(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isArtefact(MockAlifeObject.mockWithClassId(clsid.zone_mbald_s))).toBe(false);
  });
});

describe("isGrenade utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object is a grenade", () => {
    expect(isGrenade(MockGameObject.mockWithClassId(clsid.wpn_grenade_f1_s))).toBe(true);
    expect(isGrenade(MockGameObject.mockWithClassId(clsid.wpn_grenade_rgd5_s))).toBe(true);
    expect(isGrenade(MockAlifeObject.mockWithClassId(clsid.wpn_grenade_f1_s))).toBe(true);
    expect(isGrenade(MockAlifeObject.mockWithClassId(clsid.wpn_grenade_rgd5_s))).toBe(true);

    expect(isGrenade(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isGrenade(MockAlifeObject.mockWithClassId(clsid.wpn_ak74_s))).toBe(false);
  });
});

describe("isActor utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object is an actor", () => {
    expect(isActor(MockAlifeObject.mockWithClassId(clsid.online_offline_group_s))).toBe(false);
    expect(isActor(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
    expect(isActor(MockAlifeObject.mockWithClassId(clsid.dog_s))).toBe(false);
    expect(isActor(MockAlifeObject.mockWithClassId(clsid.wpn_ak74_s))).toBe(false);
    expect(isActor(MockAlifeObject.mockWithClassId(clsid.script_actor))).toBe(true);
    expect(isActor(MockAlifeObject.mockWithClassId(clsid.script_stalker))).toBe(false);
  });
});

describe("isSquad utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object is a squad", () => {
    expect(isSquad(MockAlifeObject.mockWithClassId(clsid.online_offline_group_s))).toBe(true);
    expect(isSquad(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
    expect(isSquad(MockAlifeObject.mockWithClassId(clsid.dog_s))).toBe(false);
    expect(isSquad(MockAlifeObject.mockWithClassId(clsid.wpn_ak74_s))).toBe(false);
    expect(isSquad(MockAlifeObject.mockWithClassId(clsid.script_actor))).toBe(false);
    expect(isSquad(MockAlifeObject.mockWithClassId(clsid.script_stalker))).toBe(false);
  });
});

describe("isSquadId utils", () => {
  beforeEach(() => registerSimulator());

  it("correctly check if id is a squad object", () => {
    const squad: Squad = MockSquad.mock();
    const actor: ServerActorObject = MockAlifeCreatureActor.mock();
    const stalker: ServerHumanObject = MockAlifeHumanStalker.mock();

    expect(isSquadId(squad.id)).toBe(true);
    expect(isSquadId(actor.id)).toBe(false);
    expect(isSquadId(stalker.id)).toBe(false);
  });
});

describe("isSmartTerrain utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object is a monster", () => {
    expect(isSmartTerrain(MockAlifeObject.mockWithClassId(clsid.smart_terrain))).toBe(true);
    expect(isSmartTerrain(MockAlifeObject.mockWithClassId(clsid.online_offline_group_s))).toBe(false);
    expect(isSmartTerrain(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
    expect(isSmartTerrain(MockAlifeObject.mockWithClassId(clsid.dog_s))).toBe(false);
    expect(isSmartTerrain(MockAlifeObject.mockWithClassId(clsid.wpn_ak74_s))).toBe(false);
    expect(isSmartTerrain(MockAlifeObject.mockWithClassId(clsid.script_actor))).toBe(false);
    expect(isSmartTerrain(MockAlifeObject.mockWithClassId(clsid.script_stalker))).toBe(false);
  });
});

describe("isMonster utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object is a monster", () => {
    expect(isMonster(MockGameObject.mockWithClassId(clsid.boar_s))).toBe(true);
    expect(isMonster(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(true);
    expect(isMonster(MockGameObject.mockWithClassId(clsid.dog_s))).toBe(true);
    expect(isMonster(MockAlifeObject.mockWithClassId(clsid.dog_s))).toBe(true);

    expect(isMonster(MockGameObject.mockWithClassId(clsid.zone_mbald_s))).toBe(false);
    expect(isMonster(MockAlifeObject.mockWithClassId(clsid.wpn_ak74_s))).toBe(false);
    expect(isMonster(MockAlifeObject.mockWithClassId(clsid.script_actor))).toBe(false);
    expect(isMonster(MockAlifeObject.mockWithClassId(clsid.script_stalker))).toBe(false);
  });
});

describe("isStalker utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object is a stalker", () => {
    expect(isStalker(MockGameObject.mockWithClassId(clsid.script_actor))).toBe(true);
    expect(isStalker(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(true);
    expect(isStalker(MockAlifeObject.mockWithClassId(clsid.script_actor))).toBe(true);
    expect(isStalker(MockAlifeObject.mockWithClassId(clsid.script_stalker))).toBe(true);
    expect(isStalker(MockAlifeObject.mockWithClassId(clsid.trader))).toBe(false);

    expect(isStalker(MockGameObject.mockWithClassId(clsid.zone_mbald_s))).toBe(false);
    expect(isStalker(MockGameObject.mockWithClassId(clsid.zone_mbald_s))).toBe(false);
    expect(isStalker(MockAlifeObject.mockWithClassId(clsid.wpn_ak74_s))).toBe(false);
    expect(isStalker(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isCreature utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object is a stalker", () => {
    expect(isCreature(MockGameObject.mockWithClassId(clsid.script_actor))).toBe(true);
    expect(isCreature(MockGameObject.mock(), clsid.script_actor)).toBe(true);
    expect(isCreature(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(true);
    expect(isCreature(MockGameObject.mock(), clsid.script_stalker)).toBe(true);
    expect(isCreature(MockAlifeObject.mockWithClassId(clsid.script_actor))).toBe(true);
    expect(isCreature(MockAlifeObject.mockWithClassId(clsid.script_stalker))).toBe(true);
    expect(isCreature(MockAlifeObject.mockWithClassId(clsid.trader))).toBe(false);
    expect(isCreature(MockGameObject.mock(), clsid.trader)).toBe(false);
    expect(isCreature(MockGameObject.mockWithClassId(clsid.boar_s))).toBe(true);
    expect(isCreature(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(true);
    expect(isCreature(MockGameObject.mockWithClassId(clsid.dog_s))).toBe(true);

    expect(isCreature(MockGameObject.mock(), clsid.zone_mbald_s)).toBe(false);
    expect(isCreature(MockGameObject.mockWithClassId(clsid.zone_mbald_s))).toBe(false);
    expect(isCreature(MockAlifeObject.mockWithClassId(clsid.wpn_ak74_s))).toBe(false);
  });
});

describe("isTrader utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object is a stalker", () => {
    expect(isTrader(MockAlifeObject.mockWithClassId(clsid.trader))).toBe(true);
    expect(isTrader(MockGameObject.mock(), clsid.trader)).toBe(true);

    expect(isTrader(MockGameObject.mockWithClassId(clsid.script_actor))).toBe(false);
    expect(isTrader(MockGameObject.mock(), clsid.script_actor)).toBe(false);
    expect(isTrader(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isTrader(MockGameObject.mock(), clsid.script_stalker)).toBe(false);
    expect(isTrader(MockAlifeObject.mockWithClassId(clsid.script_actor))).toBe(false);
    expect(isTrader(MockAlifeObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isTrader(MockGameObject.mock(), clsid.zone_mbald_s)).toBe(false);
    expect(isTrader(MockGameObject.mockWithClassId(clsid.zone_mbald_s))).toBe(false);
    expect(isTrader(MockAlifeObject.mockWithClassId(clsid.wpn_ak74_s))).toBe(false);
    expect(isTrader(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isStrappableWeapon utils", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if object can be strapped", () => {
    expect(isStrappableWeapon(MockGameObject.mockWithSection("wpn_ak74"))).toBe(true);
    expect(isStrappableWeapon(MockGameObject.mockWithSection("wpn_svu"))).toBe(true);
    expect(isStrappableWeapon(MockGameObject.mockWithSection("wpn_another"))).toBe(false);
    expect(isStrappableWeapon(MockGameObject.mockWithSection("grenade_f1"))).toBe(false);
    expect(isStrappableWeapon(null)).toBe(false);
  });
});

describe("isWeapon utils", () => {
  beforeEach(() => registerSimulator());

  it("utils should correctly check object class ids", () => {
    expect(isWeapon(null)).toBeFalsy();
    expect(isWeapon(MockGameObject.mockWithClassId(1))).toBeFalsy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_ammo))).toBeFalsy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_ammo_s))).toBeFalsy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBeFalsy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_binocular))).toBeFalsy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_binocular_s))).toBeFalsy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.zone_mbald_s))).toBeFalsy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.artefact_s))).toBeFalsy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.script_stalker))).toBeFalsy();

    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_knife))).toBeTruthy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_knife_s))).toBeTruthy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_silencer))).toBeTruthy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_silencer_s))).toBeTruthy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_ak74))).toBeTruthy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_grenade_rgd5))).toBeTruthy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_shotgun_s))).toBeTruthy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_shotgun))).toBeTruthy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_walther))).toBeTruthy();
    expect(isWeapon(MockGameObject.mockWithClassId(clsid.wpn_walther))).toBeTruthy();
  });
});

describe("isMonsterSquad util", () => {
  beforeEach(() => registerSimulator());

  it("should correctly check if squad object assigned with no leader", () => {
    const squad: MockSquad = MockSquad.mock();

    jest.spyOn(squad, "commander_id").mockImplementation(() => MAX_U16);

    expect(isMonsterSquad(squad)).toBe(false);
  });

  it("should correctly check if squad object assigned with monsters", () => {
    const squad: MockSquad = MockSquad.mock();
    const leader: ServerObject = MockAlifeObject.mockWithClassId(clsid.boar_s);

    jest.spyOn(squad, "commander_id").mockImplementation(() => leader.id);

    expect(isMonsterSquad(squad)).toBe(true);
  });

  it("should correctly check if squad object assigned with stalkers", () => {
    const squad: MockSquad = MockSquad.mock();
    const leader: ServerObject = MockAlifeObject.mockWithClassId(clsid.script_stalker);

    jest.spyOn(squad, "commander_id").mockImplementation(() => leader.id);

    expect(isMonsterSquad(squad)).toBe(false);
  });
});

describe("isSnork util", () => {
  it("should correctly check object class IDs", () => {
    expect(isSnork(MockGameObject.mockWithClassId(clsid.snork_s))).toBe(true);
    expect(isSnork(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isSnork(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBe(false);

    expect(isSnork(MockAlifeObject.mockWithClassId(clsid.snork_s))).toBe(true);
    expect(isSnork(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isDog util", () => {
  it("should correctly check object class IDs", () => {
    expect(isDog(MockGameObject.mockWithClassId(clsid.dog_s))).toBe(true);
    expect(isDog(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isDog(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBe(false);

    expect(isDog(MockAlifeObject.mockWithClassId(clsid.dog_s))).toBe(true);
    expect(isDog(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isPsyDog util", () => {
  it("should correctly check object class IDs", () => {
    expect(isPsyDog(MockGameObject.mockWithClassId(clsid.psy_dog_s))).toBe(true);
    expect(isPsyDog(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isPsyDog(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBe(false);

    expect(isPsyDog(MockAlifeObject.mockWithClassId(clsid.psy_dog_s))).toBe(true);
    expect(isPsyDog(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isPoltergeist util", () => {
  it("should correctly check object class IDs", () => {
    expect(isPoltergeist(MockGameObject.mockWithClassId(clsid.poltergeist_s))).toBe(true);
    expect(isPoltergeist(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isPoltergeist(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBe(false);

    expect(isPoltergeist(MockAlifeObject.mockWithClassId(clsid.poltergeist_s))).toBe(true);
    expect(isPoltergeist(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isTushkano util", () => {
  it("should correctly check object class IDs", () => {
    expect(isTushkano(MockGameObject.mockWithClassId(clsid.tushkano_s))).toBe(true);
    expect(isTushkano(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isTushkano(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBe(false);

    expect(isTushkano(MockAlifeObject.mockWithClassId(clsid.tushkano_s))).toBe(true);
    expect(isTushkano(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isBurer util", () => {
  it("should correctly check object class IDs", () => {
    expect(isBurer(MockGameObject.mockWithClassId(clsid.burer_s))).toBe(true);
    expect(isBurer(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isBurer(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBe(false);

    expect(isBurer(MockAlifeObject.mockWithClassId(clsid.burer_s))).toBe(true);
    expect(isBurer(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isController util", () => {
  it("should correctly check object class IDs", () => {
    expect(isController(MockGameObject.mockWithClassId(clsid.controller_s))).toBe(true);
    expect(isController(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isController(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBe(false);

    expect(isController(MockAlifeObject.mockWithClassId(clsid.controller_s))).toBe(true);
    expect(isController(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isFlesh util", () => {
  it("should correctly check object class IDs", () => {
    expect(isFlesh(MockGameObject.mockWithClassId(clsid.flesh_s))).toBe(true);
    expect(isFlesh(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isFlesh(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBe(false);

    expect(isFlesh(MockAlifeObject.mockWithClassId(clsid.flesh_s))).toBe(true);
    expect(isFlesh(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(false);
  });
});

describe("isBoar util", () => {
  it("should correctly check object class IDs", () => {
    expect(isBoar(MockGameObject.mockWithClassId(clsid.boar_s))).toBe(true);
    expect(isBoar(MockGameObject.mockWithClassId(clsid.script_stalker))).toBe(false);
    expect(isBoar(MockGameObject.mockWithClassId(clsid.wpn_ammo_vog25))).toBe(false);

    expect(isBoar(MockAlifeObject.mockWithClassId(clsid.boar_s))).toBe(true);
    expect(isBoar(MockAlifeObject.mockWithClassId(clsid.flesh_s))).toBe(false);
  });
});
