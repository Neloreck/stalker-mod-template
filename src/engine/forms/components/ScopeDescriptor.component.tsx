import { JSXNode, JSXXML } from "jsx-xml";

import { XrComponent } from "@/engine/forms/components/base";

interface IScopeDescriptorProps {
  name: string;
  is169?: boolean;
}

export function ScopeDescriptor({ name, is169 = false }: IScopeDescriptorProps): JSXNode {
  if (is169) {
    return (
      <XrComponent tag={name} x={0} y={0} width={2048} height={1536}>
        <auto_static x={128} y={0} width={768} height={768} stretch={1}>
          <texture>{name}</texture>
        </auto_static>

        <auto_static x={0} y={0} width={128} height={768} stretch={1}>
          <texture>wpn_crosshair_add_l</texture>
        </auto_static>

        <auto_static x={896} y={0} width={128} height={768} stretch={1}>
          <texture>wpn_crosshair_add_r</texture>
        </auto_static>
      </XrComponent>
    );
  }

  return (
    <XrComponent tag={name} x={0} y={0} width={2048} height={1536}>
      <auto_static x={0} y={0} width={1024} height={768} stretch={1}>
        <texture>{name}</texture>
      </auto_static>
    </XrComponent>
  );
}
