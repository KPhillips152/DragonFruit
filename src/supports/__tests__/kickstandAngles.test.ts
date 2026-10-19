import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

import { DEFAULT_SHAFT_MAX_ANGLE_DEG } from '../Settings/defaults';
import { getSettings, setSettings } from '../Settings/state';
import { createDefaultSettings } from '../Settings/types';
import { buildKickstandData, toKickstandPreviewData } from '../SupportTypes/Kickstand/kickstandBuilder';
import { kickstandHasValidAngles } from '../SupportTypes/Kickstand/kickstandRules';
import { kickstandPlacementStore } from '../SupportTypes/Kickstand/kickstandPlacementState';
import type { KickstandBuildInput, KickstandBuildResult } from '../SupportTypes/Kickstand/types';
import type { Vec3 } from '../types';

beforeEach(() => {
    const settings = createDefaultSettings();
    settings.roots.diskHeightMm = 0.2;
    settings.roots.coneHeightMm = 0.3;
    settings.grid.spacingMm = 20;
    setSettings(settings);
});

function input(hostPos: Vec3, overrides: Partial<KickstandBuildInput> = {}): KickstandBuildInput {
    return {
        modelId: 'kickstand-angles',
        rootPos: { x: 0, y: 0, z: 0 },
        host: {
            segmentId: 'host-shaft',
            supportKind: 'trunk',
            t: 0.5,
            pos: hostPos,
            diameterMm: 1,
        },
        ...overrides,
    };
}

function assertValidity(build: KickstandBuildResult, expected: boolean): void {
    const maxAngle = getSettings().shaft.maxAngleDeg ?? DEFAULT_SHAFT_MAX_ANGLE_DEG;
    assert.equal(kickstandHasValidAngles(build, maxAngle), expected);
    assert.equal(toKickstandPreviewData(build).error, expected ? undefined : 'SHAFT_ANGLE_TOO_FLAT');
}

test('grid-offset low hosts keep their geometry and are invalid with grid on or off', () => {
    for (const enabled of [false, true]) {
        const settings = getSettings();
        setSettings({ ...settings, grid: { ...settings.grid, enabled } });
        for (const height of [0.7, 4]) {
            const request = input({ x: 0, y: 0, z: height }, {
                rootPos: { x: settings.grid.spacingMm, y: 0, z: 0 },
            });
            const build = buildKickstandData(request);
            const original = structuredClone(build);
            const terminal = build.kickstand.segments.at(-1)!;
            assert.equal(terminal.bottomJoint!.pos.z > build.hostKnot.pos.z, height === 0.7,
                'fixtures include both a descending and a rising, nearly horizontal terminal');
            assertValidity(build, false);

            assert.deepEqual(build, original, 'validation and preview must not reshape the kickstand');
        }
    }
});

test('sufficient host rise is allowed independently of grid-specific branch angle settings', () => {
    for (const enabled of [false, true]) {
        const settings = getSettings();
        setSettings({ ...settings, grid: { ...settings.grid, enabled, minBranchAngleDeg: 85 } });
        const build = buildKickstandData(input({ x: 0, y: 0, z: 20 }, {
            rootPos: { x: settings.grid.spacingMm, y: 0, z: 0 },
        }));
        assertValidity(build, true);
    }
});

test('moving the same root one grid spacing away can invalidate otherwise valid geometry', () => {
    const host = { x: 0, y: 0, z: 8 };
    assertValidity(buildKickstandData(input(host, { rootPos: { x: 4, y: 0, z: 0 } })), true);
    assertValidity(buildKickstandData(input(host, {
        rootPos: { x: getSettings().grid.spacingMm, y: 0, z: 0 },
    })), false);
});

test('an authored terminal accepts the exact angle boundary and reads changed limits on the same build', () => {
    const build = buildKickstandData(input({ x: 4, y: 0, z: 8.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
    }));
    for (const [limit, expected] of [[45, true], [44.999, false], [45.001, true]] as const) {
        const settings = getSettings();
        setSettings({ ...settings, shaft: { ...settings.shaft, maxAngleDeg: limit } });
        assertValidity(build, expected);
    }
});

test('an unset shaft angle uses the canonical default rather than an earlier custom limit', () => {
    const build = buildKickstandData(input({ x: 10, y: 0, z: 5.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
    }));
    const settings = getSettings();
    setSettings({ ...settings, shaft: { ...settings.shaft, maxAngleDeg: 85 } });
    assertValidity(build, true);
    setSettings({ ...settings, shaft: { ...settings.shaft, maxAngleDeg: undefined } });
    assertValidity(build, false);
});

test('the first shaft starts at the actual root top, including world Z, disk and cone heights', () => {
    const settings = getSettings();
    setSettings({ ...settings, roots: { ...settings.roots, diskHeightMm: 1.25, coneHeightMm: 2.75 } });
    const build = buildKickstandData(input({ x: 10, y: -5, z: 13 }, {
        rootPos: { x: 10, y: -7, z: 3 },
        authoredColumn: { topPos: { x: 10, y: -5, z: 9 } },
    }));
    assert.equal(kickstandHasValidAngles(build, 45), true);
    assert.equal(kickstandHasValidAngles(build, 44.999), false);

    const descendingColumn = buildKickstandData(input({ x: 10, y: -7, z: 13 }, {
        rootPos: { x: 10, y: -7, z: 3 },
        authoredColumn: { topPos: { x: 10, y: -7, z: 6 } },
    }));
    assertValidity(descendingColumn, false);
});

test('a descending or flat authored terminal cannot pass by using an absolute rise', () => {
    for (const height of [1, 5]) {
        const build = buildKickstandData(input({ x: 0.1, y: 0, z: height }, {
            authoredColumn: { topPos: { x: 0, y: 0, z: 5 } },
        }));
        assert.equal(kickstandHasValidAngles(build, 90), false);
        assertValidity(build, false);
    }
});

test('a shallow intermediate member is rejected even when the root-host chord and terminal are steep enough', () => {
    const build = buildKickstandData(input({ x: 3, y: 0, z: 10 }, {
        layoutOverrides: {
            secondJointHeightRatio: 0.95,
            minJointSpacingMm: 0.1,
            minTerminalClearanceMm: 0.1,
        },
    }));
    const rootTopZ = build.root.transform.pos.z + build.root.diskHeight + build.root.coneHeight;
    const minRisePerLateral = Math.tan((90 - DEFAULT_SHAFT_MAX_ANGLE_DEG) * Math.PI / 180);
    assert.ok((build.hostKnot.pos.z - rootTopZ) / 3 > minRisePerLateral);
    const upper = build.kickstand.segments.find((segment) => segment.bottomJoint && segment.topJoint
        && segment.bottomJoint.pos.x !== segment.topJoint.pos.x)!;
    const upperRise = upper.topJoint!.pos.z - upper.bottomJoint!.pos.z;
    const upperLateral = Math.abs(upper.topJoint!.pos.x - upper.bottomJoint!.pos.x);
    assert.ok(upperRise / upperLateral < minRisePerLateral);
    const terminal = build.kickstand.segments.at(-1)!;
    const terminalRise = build.hostKnot.pos.z - terminal.bottomJoint!.pos.z;
    const terminalLateral = Math.abs(build.hostKnot.pos.x - terminal.bottomJoint!.pos.x);
    assert.ok(terminalRise / terminalLateral > minRisePerLateral);
    assertValidity(build, false);
});

test('coincident root and terminal endpoints have no angle to constrain', () => {
    const rootCoincident = buildKickstandData(input({ x: 0, y: 0, z: 8.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 0.5 } },
    }));
    assertValidity(rootCoincident, true);
    const terminalCoincident = buildKickstandData(input({ x: 0, y: 0, z: 4.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
    }));
    assertValidity(terminalCoincident, true);
});

test('only coincident shafts within the geometry tolerance may ignore a flat or descending direction', () => {
    for (const offset of [0.5e-6, 2e-6]) {
        for (const topPos of [
            { x: offset, y: 0, z: 0.5 },
            { x: 0, y: 0, z: 0.5 - offset },
        ]) {
            const build = buildKickstandData(input({ x: topPos.x, y: 0, z: 4.5 }, {
                authoredColumn: { topPos },
            }));
            assertValidity(build, offset < 1e-6);
        }
    }
});

test('a stationary snap target publishes valid-invalid-valid angle transitions', () => {
    const request = input({ x: 4, y: 0, z: 8.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
    });
    const build = buildKickstandData(request);
    const target = {
        ...request.host,
        modelId: request.modelId,
        minT: request.host.minT ?? 0,
        rootPos: request.rootPos,
    };

    kickstandPlacementStore.clearPreview();
    try {
        for (const [limit, expectedError] of [
            [50, undefined],
            [40, 'SHAFT_ANGLE_TOO_FLAT'],
            [50, undefined],
        ] as const) {
            const settings = getSettings();
            setSettings({ ...settings, shaft: { ...settings.shaft, maxAngleDeg: limit } });
            kickstandPlacementStore.setPreview(target, build, toKickstandPreviewData(build));
            assert.equal(kickstandPlacementStore.getSnapshot().previewData!.error, expectedError);
        }
    } finally {
        kickstandPlacementStore.clearPreview();
    }
});
