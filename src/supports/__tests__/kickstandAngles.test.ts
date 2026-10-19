import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';

import { DEFAULT_SHAFT_MAX_ANGLE_DEG } from '../Settings/defaults';
import { getSettings, setSettings } from '../Settings/state';
import { createDefaultSettings } from '../Settings/types';
import { buildKickstandData, toKickstandPreviewData } from '../SupportTypes/Kickstand/kickstandBuilder';
import { kickstandHasValidAngles } from '../SupportTypes/Kickstand/kickstandRules';
import { kickstandPlacementStore } from '../SupportTypes/Kickstand/kickstandPlacementState';
import { getKickstandMaxAngleFromVerticalDeg } from '../SupportTypes/Kickstand/kickstandSettings';
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
    const maxAngle = getKickstandMaxAngleFromVerticalDeg();
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

test('the grid minimum rejects an unchanged member allowed by the default shaft maximum', () => {
    const build = buildKickstandData(input({ x: 4, y: 0, z: 8.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
    }));
    const original = structuredClone(build);
    assert.equal(kickstandHasValidAngles(build, DEFAULT_SHAFT_MAX_ANGLE_DEG), true);
    assertValidity(build, true);

    const settings = getSettings();
    setSettings({ ...settings, grid: { ...settings.grid, enabled: true } });
    assertValidity(build, false);
    assert.deepEqual(build, original, 'the grid minimum must not relocate the root, host or joints');
});

test('a custom grid minimum accepts its exact boundary without short-member slack', () => {
    for (const lateral of [4, 0.4]) {
        const build = buildKickstandData(input({ x: lateral, y: 0, z: 4.5 + lateral }, {
            authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
        }));
        for (const [minimum, expected] of [[45, true], [45.001, false], [44.999, true]] as const) {
            const settings = getSettings();
            setSettings({ ...settings, grid: { ...settings.grid, enabled: true, minBranchAngleDeg: minimum } });
            assertValidity(build, expected);
        }
    }
});

test('disabled and zero-spacing grids retain the shaft limit', () => {
    const build = buildKickstandData(input({ x: 4, y: 0, z: 8.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
    }));
    for (const [enabled, spacingMm, expected] of [
        [true, 20, false],
        [false, 20, true],
        [true, 0, true],
        [true, -1, true],
    ] as const) {
        const settings = getSettings();
        setSettings({ ...settings, grid: { ...settings.grid, enabled, spacingMm } });
        assertValidity(build, expected);
    }
});

test('neither a weaker shaft maximum nor a weaker grid minimum can override the stricter limit', () => {
    const build = buildKickstandData(input({ x: 4, y: 0, z: 8.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
    }));
    for (const [shaftMaximum, gridMinimum, expected] of [
        [45, 40, true],
        [44.999, 40, false],
        [44.999, 30, false],
        [50, 45.001, false],
        [80, 45.001, false],
    ] as const) {
        const settings = getSettings();
        setSettings({
            ...settings,
            shaft: { ...settings.shaft, maxAngleDeg: shaftMaximum },
            grid: { ...settings.grid, enabled: true, minBranchAngleDeg: gridMinimum },
        });
        assertValidity(build, expected);
    }
});

test('an omitted grid minimum restores the default minimum instead of keeping a prior custom value', () => {
    const build = buildKickstandData(input({ x: 4, y: 0, z: 8.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
    }));
    const settings = getSettings();
    setSettings({ ...settings, grid: { ...settings.grid, enabled: true, minBranchAngleDeg: 40 } });
    assertValidity(build, true);

    const legacySettings = structuredClone(getSettings());
    Reflect.deleteProperty(legacySettings.grid, 'minBranchAngleDeg');
    setSettings(legacySettings);
    assertValidity(build, false);
});

test('explicit generation context applies the grid minimum independently of the global toggle', () => {
    const build = buildKickstandData(input({ x: 4, y: 0, z: 8.5 }, {
        authoredColumn: { topPos: { x: 0, y: 0, z: 4.5 } },
    }));
    const settings = getSettings();
    setSettings({ ...settings, grid: { ...settings.grid, enabled: false, spacingMm: 0 } });
    assert.equal(kickstandHasValidAngles(build, getKickstandMaxAngleFromVerticalDeg(true)), false);
    setSettings({ ...settings, grid: { ...settings.grid, enabled: true } });
    assert.equal(kickstandHasValidAngles(build, getKickstandMaxAngleFromVerticalDeg(false)), true);
    setSettings({
        ...settings,
        shaft: { ...settings.shaft, maxAngleDeg: 40 },
        grid: { ...settings.grid, enabled: true },
    });
    assert.equal(kickstandHasValidAngles(build, getKickstandMaxAngleFromVerticalDeg(false)), false);
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

test('a stationary snap target publishes valid-invalid-valid transitions from grid-only setting changes', () => {
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
        for (const [minimum, expectedError] of [
            [40, undefined],
            [50, 'SHAFT_ANGLE_TOO_FLAT'],
            [40, undefined],
        ] as const) {
            const settings = getSettings();
            setSettings({ ...settings, grid: { ...settings.grid, enabled: true, minBranchAngleDeg: minimum } });
            kickstandPlacementStore.setPreview(target, build, toKickstandPreviewData(build));
            assert.equal(kickstandPlacementStore.getSnapshot().previewData!.error, expectedError);
        }
    } finally {
        kickstandPlacementStore.clearPreview();
    }
});
