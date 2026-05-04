"use client";

import { RigidBody, type RigidBodyProps } from "@react-three/rapier";
import { type ReactNode } from "react";
import { PHYS_MASKS } from "@/engine/physics/CollisionGroups";

interface StaticPropProps extends Omit<RigidBodyProps, "type" | "colliders"> {
  /** Set to "trimesh" for complex geometry, "cuboid" for boxes (default).
   *  Set to false to skip auto-colliders — wrap explicit <CuboidCollider/> /
   *  <CylinderCollider/> children inside instead. */
  colliders?: RigidBodyProps["colliders"];
  children: ReactNode;
}

/**
 * Wraps a static lab prop (lamp body, matchbox, culture-tube stand,
 * microscope, slide rest) in a Rapier fixed RigidBody so kinematic tools
 * bumping into it can't pass through.
 *
 * Default colliders="cuboid" — pass explicit child colliders for cylinders /
 * compound shapes.
 */
export function StaticProp({
  colliders = "cuboid",
  children,
  ...rest
}: StaticPropProps) {
  return (
    <RigidBody
      type="fixed"
      colliders={colliders}
      collisionGroups={PHYS_MASKS.staticProp}
      {...rest}
    >
      {children}
    </RigidBody>
  );
}
