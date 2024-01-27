import { describe, expect, it } from "@jest/globals";

import { ETreasureType } from "@/engine/core/managers/treasures";
import { readIniTreasuresList } from "@/engine/core/managers/treasures/utils/treasures_init";
import { parseConditionsList } from "@/engine/core/utils/ini";
import { MockIniFile } from "@/fixtures/xray";

describe("treasures_init utils", () => {
  it("readIniTreasuresList should correctly read", () => {
    expect(readIniTreasuresList(MockIniFile.mock("test.ltx", {}))).toEqualLuaTables({});

    expect(
      readIniTreasuresList(
        MockIniFile.mock("test.ltx", {
          config: {
            rare_cost: 5000,
            epic_cost: 10000,
          },
          list: {
            jup_b1_secret: null,
            jup_b2_secret: null,
          },
          jup_b1_secret: {
            empty: "{+info_b10_first_zone_visited} true, false",
            wpn_abakan: "1, 1",
            wpn_addon_scope: "1, 1",
          },
          jup_b2_secret: {
            refreshing: "true",
            wpn_abakan: "2, 1",
          },
        })
      )
    ).toEqualLuaTables({
      jup_b1_secret: {
        checked: false,
        type: ETreasureType.RARE,
        empty: parseConditionsList("{+info_b10_first_zone_visited} true, false"),
        given: false,
        refreshing: null,
        items: {
          wpn_abakan: {
            "1": {
              count: 1,
              itemsIds: null,
              probability: 1,
            },
          },
          wpn_addon_scope: {
            "1": {
              count: 1,
              itemsIds: null,
              probability: 1,
            },
          },
        },
        itemsToFindRemain: 0,
      },
      jup_b2_secret: {
        checked: false,
        type: ETreasureType.EPIC,
        empty: null,
        given: false,
        items: {
          wpn_abakan: {
            "1": {
              count: 2,
              itemsIds: null,
              probability: 1,
            },
          },
        },
        itemsToFindRemain: 0,
        refreshing: parseConditionsList("true"),
      },
    });
  });
});
