"use client";

import { Smoke } from "./Smoke";

/** Steam = white smoke alias. */
export function Steam({ active, count = 5 }: { active: boolean; count?: number }) {
  return <Smoke active={active} color="#f4f4f4" count={count} size={10} height={70} width={36} />;
}
