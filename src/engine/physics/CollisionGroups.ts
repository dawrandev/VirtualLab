import { interactionGroups } from "@react-three/rapier";

/**
 * Bitmask groups for Rapier collision masks. Each entry is a group index 0-15.
 * Used with `interactionGroups(group, with)` to wire which colliders interact.
 */
export const PHYS_GROUPS = {
  TABLE: 0, // table top, room floor — receivers
  TOOL: 1, // all draggable lab tools
  STATIC_PROP: 2, // lamp body, microscope, culture-tube stand, matchbox base, slide rest
  DROPLET: 3, // pipette droplets (dynamic, low-mass spheres)
  ASH: 4, // match ash debris
} as const;

/**
 * Pre-built interaction masks. A collider in group X with mask `[Y, Z]`
 * collides only with colliders in groups Y or Z.
 *
 * Design:
 *   - Tools collide with table, static props, and each other.
 *   - Droplets / ash only collide with table + static props (NOT with tools)
 *     so a droplet falling next to its pipette doesn't bump the pipette.
 *   - Static props collide with everything that can land on them.
 */
export const PHYS_MASKS = {
  table: interactionGroups(PHYS_GROUPS.TABLE, [
    PHYS_GROUPS.TOOL,
    PHYS_GROUPS.STATIC_PROP,
    PHYS_GROUPS.DROPLET,
    PHYS_GROUPS.ASH,
  ]),
  tool: interactionGroups(PHYS_GROUPS.TOOL, [
    PHYS_GROUPS.TABLE,
    PHYS_GROUPS.STATIC_PROP,
    PHYS_GROUPS.TOOL,
  ]),
  staticProp: interactionGroups(PHYS_GROUPS.STATIC_PROP, [
    PHYS_GROUPS.TABLE,
    PHYS_GROUPS.TOOL,
    PHYS_GROUPS.DROPLET,
    PHYS_GROUPS.ASH,
  ]),
  droplet: interactionGroups(PHYS_GROUPS.DROPLET, [
    PHYS_GROUPS.TABLE,
    PHYS_GROUPS.STATIC_PROP,
  ]),
  ash: interactionGroups(PHYS_GROUPS.ASH, [
    PHYS_GROUPS.TABLE,
    PHYS_GROUPS.STATIC_PROP,
  ]),
};
