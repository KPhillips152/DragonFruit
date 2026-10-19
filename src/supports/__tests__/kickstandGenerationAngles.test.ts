import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import * as THREE from 'three';

import { registerMeshForAutoBrace, unregisterMeshForAutoBrace } from '../autoBracing/meshGeometryStore';
import { AUTO_BRACING_HARD_RULES, createDefaultAutoBracingSettings } from '../autoBracing/settings';
import { hasQualifiedTwoAxisBracing } from '../autoBracing/twoAxisDetection';
import { getSettings, setSettings } from '../Settings/state';
import { createDefaultSettings } from '../Settings/types';
import { resolveSegmentEndpoints } from '../SupportPrimitives/Knot/segmentEndpoints';
import { generateRequiredKickstands } from '../SupportTypes/Kickstand/kickstandStabiliser';
import type { KickstandBuildResult } from '../SupportTypes/Kickstand/types';
import { createEmptySupportCollections } from '../supportTypeRegistry';
import type { SupportState } from '../types';

const MODEL_ID = 'kickstand-generation-angles';
const GRID = { enabled: true, spacingMm: 4 };
let previousSettings: ReturnType<typeof getSettings>;
let geometry: THREE.BoxGeometry | undefined;

beforeEach(() => {
    previousSettings = getSettings();
    const settings = createDefaultSettings();
    settings.roots.diskHeightMm = 0.2;
    settings.roots.coneHeightMm = 0.3;
    settings.shaft.maxAngleDeg = 80;
    // The generator's explicit grid context, not the global flag, controls snapping.
    settings.grid.enabled = false;
    settings.grid.spacingMm = GRID.spacingMm;
    settings.grid.minBranchAngleDeg = 60;
    setSettings(settings);
});

afterEach(() => {
    setSettings(previousSettings);
    unregisterMeshForAutoBrace(MODEL_ID);
    geometry?.dispose();
    geometry = undefined;
});

function fixture(topZ: number): SupportState {
    const snapshot: SupportState = {
        ...createEmptySupportCollections(),
        selectedId: null,
        selectedCategory: null,
        hoveredId: null,
        hoveredCategory: 'none',
        interactionWarning: null,
    };
    snapshot.roots['host-root'] = {
        id: 'host-root',
        modelId: MODEL_ID,
        transform: {
            pos: { x: 0, y: 0, z: 0 },
            rot: { x: 0, y: 0, z: 0, w: 1 },
        },
        diameter: 3,
        diskHeight: 0.2,
        coneHeight: 0.3,
    };
    snapshot.trunks.host = {
        id: 'host',
        typeId: 'trunk',
        modelId: MODEL_ID,
        rootId: 'host-root',
        segments: [{
            id: 'host-segment',
            diameter: 1,
            topJoint: { id: 'host-joint', pos: { x: 0, y: 0, z: topZ }, diameter: 1.2 },
        }],
    };
    // A real model sits above the sampled shaft anchors; clearance checks remain active.
    geometry = new THREE.BoxGeometry(10, 10, 10);
    registerMeshForAutoBrace(MODEL_ID, geometry, new THREE.Matrix4().makeTranslation(0, 0, topZ + 5));
    return snapshot;
}

function generate(snapshot: SupportState, grid = GRID): KickstandBuildResult[] {
    return generateRequiredKickstands(
        snapshot,
        { roots: {}, knots: {}, kickstands: {} },
        createDefaultAutoBracingSettings(),
        [],
        grid,
    );
}

function memberRiseAngles(build: KickstandBuildResult): number[] {
    const entity = { ...build.kickstand, typeId: 'kickstand' as const };
    return entity.segments.map((segment, index) => {
        const endpoints = resolveSegmentEndpoints(entity, segment, index, { root: build.root, hostKnot: build.hostKnot });
        assert.ok(endpoints, 'every generated member resolves to actual render endpoints');
        const dx = endpoints.end.x - endpoints.start.x;
        const dy = endpoints.end.y - endpoints.start.y;
        const dz = endpoints.end.z - endpoints.start.z;
        return Math.atan2(dz, Math.hypot(dx, dy)) * 180 / Math.PI;
    });
}

function assertHostHasTwoAxisBracing(builds: KickstandBuildResult[]): void {
    const axes = builds.map(({ root, hostKnot }) => Math.atan2(
        root.transform.pos.y - hostKnot.pos.y,
        root.transform.pos.x - hostKnot.pos.x,
    ));
    assert.ok(hasQualifiedTwoAxisBracing(axes, AUTO_BRACING_HARD_RULES.minAxisSeparationDeg),
        'the generated supports stabilize the host in two independent directions');
}

test('tall grid hosts retain two-axis bracing while actual members meet the grid minimum', () => {
    const builds = generate(fixture(100));
    assertHostHasTwoAxisBracing(builds);
    for (const build of builds) {
        const root = build.root.transform.pos;
        assert.equal(Math.abs(root.x) + Math.abs(root.y), GRID.spacingMm, 'preserve immediate cardinal grid roots');
        for (const rise of memberRiseAngles(build)) {
            assert.ok(rise >= 60 - 1e-9, `member rises ${rise}° above horizontal, below grid minimum 60°`);
        }
    }
});

test('a low grid host cannot retain shallow output when the live grid minimum becomes stricter', () => {
    const snapshot = fixture(20);
    const settings = getSettings();
    setSettings({ ...settings, grid: { ...settings.grid, minBranchAngleDeg: 10 } });
    const looseBuilds = generate(snapshot);
    assertHostHasTwoAxisBracing(looseBuilds);
    const looseAngles = looseBuilds.flatMap(memberRiseAngles);
    assert.ok(looseAngles.every((rise) => rise >= 10), 'the loose shaft80 policy accepts these members');
    assert.ok(looseAngles.some((rise) => rise < 60), 'the previous policy would accept a grid-minimum violation');

    setSettings({ ...settings, grid: { ...settings.grid, minBranchAngleDeg: 60 } });
    assert.deepEqual(generate(snapshot), [], 'all available low-host trials violate the actual-member grid minimum');
});

test('a stricter shaft maximum still rejects tall grid trials', () => {
    const snapshot = fixture(100);
    assertHostHasTwoAxisBracing(generate(snapshot));
    const settings = getSettings();
    setSettings({ ...settings, shaft: { ...settings.shaft, maxAngleDeg: 5 } });
    assert.deepEqual(generate(snapshot), [], 'shaft5 is stricter than grid60 and must constrain every trial');
});

test('explicit grid-off generation retains shaft constraints even when the global grid is enabled', () => {
    const snapshot = fixture(20);
    const settings = getSettings();
    setSettings({ ...settings, grid: { ...settings.grid, enabled: true, minBranchAngleDeg: 85 } });
    const builds = generate(snapshot, { ...GRID, enabled: false });
    assertHostHasTwoAxisBracing(builds);
    const angles = builds.flatMap(memberRiseAngles);
    assert.ok(angles.every((rise) => rise >= 10), 'grid-off members must still obey shaft80');
    assert.ok(angles.some((rise) => rise < 85), 'the inactive grid minimum must not reject otherwise valid members');
});
