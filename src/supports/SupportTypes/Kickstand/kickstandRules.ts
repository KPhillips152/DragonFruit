import * as THREE from 'three';
import { memberDepartureAngleFromVerticalDeg } from '../../PlacementLogic/smartPlacementSearchUtils';
import { isKickstandHostType, KICKSTAND_HOST_TYPES, type KickstandHostTypeId } from '../../supportTypeRegistry';
import type { KickstandBuildResult } from './types';

export function clampKickstandHostT(t: number, minT = 0): number {
    return THREE.MathUtils.clamp(t, minT, 1);
}

/** Throws unless `kind` names a type a kickstand's host knot may ride. */
export function assertKickstandHostKind(kind: string): asserts kind is KickstandHostTypeId {
    if (!isKickstandHostType(kind)) {
        throw new Error(`Kickstand host must be ${KICKSTAND_HOST_TYPES.join(' or ')}. Received: ${kind}`);
    }
}

/** Checks each authored shaft upward from the root top to the host knot. */
export function kickstandHasValidAngles(
    build: KickstandBuildResult,
    maxAngleFromVerticalDeg: number,
): boolean {
    const rootPos = build.root.transform.pos;
    const rootTop = {
        x: rootPos.x,
        y: rootPos.y,
        z: rootPos.z + build.root.diskHeight + build.root.coneHeight,
    };

    for (const segment of build.kickstand.segments) {
        const start = segment.bottomJoint?.pos ?? rootTop;
        const end = segment.topJoint?.pos ?? build.hostKnot.pos;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dz = end.z - start.z;
        // Coincident endpoints within the existing 1e-6 mm geometry tolerance
        // have no shaft direction to constrain.
        if (dx * dx + dy * dy + dz * dz <= 1e-12) continue;
        if (dz <= 0 || !(memberDepartureAngleFromVerticalDeg(start, end) <= maxAngleFromVerticalDeg)) {
            return false;
        }
    }

    return true;
}
