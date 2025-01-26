import { JSXNode, JSXXML } from "jsx-xml";

import { ScopeDescriptor } from "@/engine/forms/components/ScopeDescriptor.component";

/**
 * Scopes rendering for 16/9.
 */
export function create(): JSXNode {
  return (
    <w>
      {["wpn_crosshair", "wpn_crosshair_pso", "wpn_crosshair_l85", "wpn_crosshair_g36", "wpn_crosshair_rpg"].map(
        (it) => (
          <ScopeDescriptor name={it} is169 />
        )
      )}

      {["wpn_crosshair_bino"].map((it) => (
        <ScopeDescriptor name={it} />
      ))}
    </w>
  );
}
