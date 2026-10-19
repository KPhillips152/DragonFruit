import assert from 'node:assert/strict';
import test from 'node:test';

const React = require('react');
const r3f = require('@react-three/fiber');

// Mock window and other DOM elements needed by KickstandPlacementController
const registeredListeners: { [type: string]: Array<(e: any) => void> } = {};
global.window = {
  addEventListener: (type: string, listener: (e: any) => void) => {
    if (!registeredListeners[type]) {
      registeredListeners[type] = [];
    }
    registeredListeners[type].push(listener);
  },
  removeEventListener: (type: string, listener: (e: any) => void) => {
    if (registeredListeners[type]) {
      registeredListeners[type] = registeredListeners[type].filter(l => l !== listener);
    }
  },
  dispatchEvent: (event: any) => {
    const listeners = registeredListeners[event.type] || [];
    for (const listener of listeners) {
      listener(event);
    }
    return true;
  }
} as any;

if (typeof (global as any).CustomEvent === 'undefined') {
  (global as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, options?: { detail?: any }) {
      this.type = type;
      this.detail = options?.detail;
    }
  };
}

// Override React hooks so they behave synchronously outside of a renderer
React.useEffect = (effect: () => (void | (() => void)), deps?: any[]) => {
  effect();
};
React.useCallback = (fn: any, deps?: any[]) => fn;
React.useMemo = (fn: any, deps?: any[]) => fn();
React.useRef = (initialValue?: any) => ({ current: initialValue });
React.useSyncExternalStore = (subscribe: any, getSnapshot: any) => getSnapshot();
React.useContext = (context: any) => {
  return {
    getHotkey: (key: string) => ''
  };
};
React.useState = (initialValue: any) => [
  typeof initialValue === 'function' ? initialValue() : initialValue,
  () => {}
];

// Mock react-three-fiber hooks
const mockDomElement = {
  addEventListener: () => {},
  removeEventListener: () => {},
};
const mockThreeState = {
  camera: {
    position: { x: 0, y: 0, z: 10 },
  },
  gl: {
    domElement: mockDomElement,
  },
  pointer: { x: 0, y: 0 },
  raycaster: {
    ray: {
      origin: { x: 0, y: 0, z: 10 },
      direction: { x: 0, y: 0, z: -1 },
    },
    setFromCamera: () => {},
  },
};
r3f.useThree = () => mockThreeState as any;
r3f.useFrame = () => {};

// Now import the controller and stores
import { KickstandPlacementController } from '../SupportTypes/Kickstand/KickstandPlacementController';
import { kickstandPlacementStore } from '../SupportTypes/Kickstand/kickstandPlacementState';
import { readKickstands } from './helpers/kickstandFixture';
import { addSupportEntity, getSnapshot, resetStore, resetKickstandsInState } from '../state';

test('Kickstand click-commit tests', async (t) => {
  await t.test('succeeds on click-commit with valid preview', () => {
    resetStore();
    resetKickstandsInState();
    kickstandPlacementStore.reset();

    // Render the controller to register event listeners
    KickstandPlacementController();

    // Prepare a mock previewBuild and previewData
    const mockPreviewBuild = {
      kickstand: {
        id: 'kickstand-test-id',
        modelId: 'model-1',
        rootId: 'root-test-id',
        hostKnotId: 'knot-test-id',
        hostSegmentId: 'seg-test-id',
        hostMinT: 0,
        segments: [],
        profile: {
          bodyDiameterMm: 0.8,
          terminalStartDiameterMm: 0.8,
          terminalEndDiameterMm: 1.2,
        },
      },
      root: {
        id: 'root-test-id',
        modelId: 'model-1',
        transform: {
          pos: { x: 5, y: 5, z: 0 },
          rot: { x: 0, y: 0, z: 0, w: 1 },
        },
        diameter: 2,
        diskHeight: 0.4,
        coneHeight: 0.7,
      },
      hostKnot: {
        id: 'knot-test-id',
        parentShaftId: 'seg-test-id',
        t: 0.5,
        pos: { x: 5, y: 5, z: 10 },
        diameter: 1.2,
      },
    };

    const mockPreviewTarget = {
      segmentId: 'seg-test-id',
      supportKind: 'trunk' as const,
      modelId: 'model-1',
      t: 0.5,
      pos: { x: 5, y: 5, z: 10 },
      diameterMm: 1.2,
      minT: 0,
      rootPos: { x: 5, y: 5, z: 0 },
    };

    const mockPreviewData = {
      id: 'kickstand-test-id',
      modelId: 'model-1',
      kind: 'kickstand' as const,
      error: undefined,
    };

    // Set preview state in store
    kickstandPlacementStore.setHotkeyActive(true);
    kickstandPlacementStore.setPreview(
      mockPreviewTarget,
      mockPreviewBuild as any,
      mockPreviewData as any
    );

    // Trigger click event
    const clickEvent = {
      type: 'click',
      target: mockDomElement,
      stopPropagation: () => {},
      preventDefault: () => {},
    };
    window.dispatchEvent(clickEvent as any);

    // Verify the kickstand and its primitives reach the store
    const kickstandSnapshot = readKickstands();
    assert.ok(kickstandSnapshot.kickstands['kickstand-test-id'], 'Expected kickstand to be added');
    assert.ok(kickstandSnapshot.roots['root-test-id'], 'Expected the root to be added');
    assert.ok(kickstandSnapshot.knots['knot-test-id'], 'Expected the knot to be added');

    const supportSnapshot = getSnapshot();
    assert.ok(supportSnapshot.roots['root-test-id'], 'Expected root to be added to supportStore');
    assert.ok(supportSnapshot.knots['knot-test-id'], 'Expected knot to be added to supportStore');
  });

  await t.test('aborts and does not commit on occupied preview (TOO_CLOSE_TO_EXISTING error)', () => {
    resetStore();
    resetKickstandsInState();
    kickstandPlacementStore.reset();

    // Render the controller to register event listeners
    KickstandPlacementController();

    // Prepare a mock previewBuild and previewData
    const mockPreviewBuild = {
      kickstand: {
        id: 'kickstand-test-id-2',
        modelId: 'model-1',
        rootId: 'root-test-id-2',
        hostKnotId: 'knot-test-id-2',
        hostSegmentId: 'seg-test-id-2',
        hostMinT: 0,
        segments: [],
        profile: {
          bodyDiameterMm: 0.8,
          terminalStartDiameterMm: 0.8,
          terminalEndDiameterMm: 1.2,
        },
      },
      root: {
        id: 'root-test-id-2',
        modelId: 'model-1',
        transform: {
          pos: { x: 5, y: 5, z: 0 },
          rot: { x: 0, y: 0, z: 0, w: 1 },
        },
        diameter: 2,
        diskHeight: 0.4,
        coneHeight: 0.7,
      },
      hostKnot: {
        id: 'knot-test-id-2',
        parentShaftId: 'seg-test-id-2',
        t: 0.5,
        pos: { x: 5, y: 5, z: 10 },
        diameter: 1.2,
      },
    };

    const mockPreviewTarget = {
      segmentId: 'seg-test-id-2',
      supportKind: 'trunk' as const,
      modelId: 'model-1',
      t: 0.5,
      pos: { x: 5, y: 5, z: 10 },
      diameterMm: 1.2,
      minT: 0,
      rootPos: { x: 5, y: 5, z: 0 },
    };

    // previewData contains error: 'TOO_CLOSE_TO_EXISTING'
    const mockPreviewData = {
      id: 'kickstand-test-id-2',
      modelId: 'model-1',
      kind: 'kickstand' as const,
      error: 'TOO_CLOSE_TO_EXISTING' as const,
    };

    // Set preview state in store
    kickstandPlacementStore.setHotkeyActive(true);
    kickstandPlacementStore.setPreview(
      mockPreviewTarget,
      mockPreviewBuild as any,
      mockPreviewData as any
    );

    // Trigger click event
    const clickEvent = {
      type: 'click',
      target: mockDomElement,
      stopPropagation: () => {},
      preventDefault: () => {},
    };
    window.dispatchEvent(clickEvent as any);

    // Verify kickstand was NOT added
    const kickstandSnapshot = readKickstands();
    assert.equal(kickstandSnapshot.kickstands['kickstand-test-id-2'], undefined, 'Expected kickstand NOT to be added');
  });

  await t.test('rejects an occupied-root fallback whose rebuilt shafts violate the grid minimum angle', () => {
    resetStore();
    resetKickstandsInState();
    kickstandPlacementStore.reset();

    // Enable grid and set spacing to 2mm
    const { updateGridSettings } = require('../Settings/state');
    updateGridSettings({ enabled: true, spacingMm: 2.0, minBranchAngleDeg: 60 });

    // Place an existing root at { x: 4, y: 4, z: 0 } which is close to proposed { x: 5, y: 5, z: 0 }
    // Both snap to { x: 4, y: 4, z: 0 } on a 2mm grid.
    const { addRoot, addTrunk } = require('../state');
    addRoot({
      id: 'existing-root-id',
      modelId: 'model-1',
      transform: {
        pos: { x: 4, y: 4, z: 0 },
        rot: { x: 0, y: 0, z: 0, w: 1 },
      },
      diameter: 2,
      diskHeight: 0.4,
      coneHeight: 0.7,
    });

    // Also add the host trunk root so we don't collide with that. Let's make it Root at { x: 0, y: 0, z: 0 }.
    addRoot({
      id: 'host-root-id',
      modelId: 'model-1',
      transform: {
        pos: { x: 0, y: 0, z: 0 },
        rot: { x: 0, y: 0, z: 0, w: 1 },
      },
      diameter: 2,
      diskHeight: 0.4,
      coneHeight: 0.7,
    });

    addSupportEntity('trunk', {
      id: 'host-trunk-id',
      modelId: 'model-1',
      rootId: 'host-root-id',
      segments: [
        {
          id: 'seg-test-id-3',
          diameter: 1.2,
          type: 'straight' as const,
        }
      ]
    });

    // Render the controller to register event listeners with updated state
    KickstandPlacementController();

    // Prepare mock preview target and build
    // The proposed rootPos is { x: 5, y: 5, z: 0 } which snaps to { x: 4, y: 4, z: 0 } (same as existing-root-id).
    const mockPreviewBuild = {
      kickstand: {
        id: 'kickstand-test-id-3',
        modelId: 'model-1',
        rootId: 'root-test-id-3',
        hostKnotId: 'knot-test-id-3',
        hostSegmentId: 'seg-test-id-3',
        hostMinT: 0,
        segments: [],
        profile: {
          bodyDiameterMm: 0.8,
          terminalStartDiameterMm: 0.8,
          terminalEndDiameterMm: 1.2,
        },
      },
      root: {
        id: 'root-test-id-3',
        modelId: 'model-1',
        transform: {
          pos: { x: 4, y: 4, z: 0 },
        },
        diameter: 2,
        diskHeight: 0.4,
        coneHeight: 0.7,
      },
      hostKnot: {
        id: 'knot-test-id-3',
        parentShaftId: 'seg-test-id-3',
        t: 0.5,
        pos: { x: 0, y: 0, z: 10 },
        diameter: 1.2,
      },
    };

    const mockPreviewTarget = {
      segmentId: 'seg-test-id-3',
      supportKind: 'trunk' as const,
      modelId: 'model-1',
      t: 0.5,
      pos: { x: 0, y: 0, z: 10 },
      diameterMm: 1.2,
      minT: 0,
      rootPos: { x: 4, y: 4, z: 0 },
    };

    // previewData contains error: 'TOO_CLOSE_TO_EXISTING'
    const mockPreviewData = {
      id: 'kickstand-test-id-3',
      modelId: 'model-1',
      kind: 'kickstand' as const,
      error: 'TOO_CLOSE_TO_EXISTING' as const,
    };

    // Set preview state in store
    kickstandPlacementStore.setHotkeyActive(true);
    kickstandPlacementStore.setPreview(
      mockPreviewTarget,
      mockPreviewBuild as any,
      mockPreviewData as any
    );

    // Trigger click event
    const clickEvent = {
      type: 'click',
      target: mockDomElement,
      stopPropagation: () => {},
      preventDefault: () => {},
    };
    window.dispatchEvent(clickEvent as any);

    const kickstandSnapshot = readKickstands();
    assert.equal(Object.keys(kickstandSnapshot.kickstands).length, 0, 'No too-flat kickstand is committed');
    assert.equal(Object.keys(getSnapshot().roots).length, 2, 'No extra root is committed');
    assert.equal(Object.keys(getSnapshot().knots).length, 0, 'No extra host knot is committed');

    const rejected = kickstandPlacementStore.getSnapshot();
    assert.equal(rejected.previewData?.error, 'SHAFT_ANGLE_TOO_FLAT');
    assert.ok(rejected.previewBuild, 'The rebuilt geometry remains available as an invalid preview');
    const { kickstandHasValidAngles } = require('../SupportTypes/Kickstand/kickstandRules');
    assert.equal(kickstandHasValidAngles(rejected.previewBuild, 80), true,
      'The loose shaft-only rule would have accepted this screenshot-like geometry');
    assert.equal(kickstandHasValidAngles(rejected.previewBuild, 90 - 60), false,
      'The actual members do not meet the configured 60-degree rise above horizontal');
  });
});
