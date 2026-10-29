# Troubleshooting: Mesh repair and hollowing

This page covers the warnings and errors you can see when DragonFruit checks a mesh on import, repairs it, hollows it, or punches drain holes into it. Search the page for the words you see on screen.

## Mesh checks on import

### "Mesh Issue detected"

<!-- source: src/components/modals/ManifoldWarningModal.tsx -->

**When it appears:** right after you import a model, with the subtitle "This mesh isn't a valid solid". The dialog says that the red-striped areas in the viewport mark the parts that failed validation. You see this dialog once per import, even if several models in the batch are flagged.

**Why:** the mesh is not a closed solid. Edges are left open, faces cross through each other, or surfaces do not quite meet. Slicing and support placement expect a sealed solid, so these defects can reach the print.

**What to do:**

1. Click **Repair Now** to start repairing straight away. It repairs one model: the first flagged model in the scene, which may be a model from an earlier import rather than the one you just added. To repair the others, see the next step.
2. Or click **Dismiss** and keep working. You can repair later: right-click the model and choose **Repair** > **Auto-Repair**, then click **Repair** in the **Repair Mesh** dialog that opens. If several models are selected, they are all repaired one after another.
3. If the red stripes are still there after repairing, see "Repair Incomplete" below.

!!! note "Very large meshes are not checked"
    When automatic repair is on, meshes with 3 million triangles or more skip it on import, so they are not checked or repaired. Run **Auto-Repair** by hand on these.

### "Repair recommended before slicing"

<!-- source: src/components/scene/MeshRepairConfirmModal.tsx -->

**When it appears:** during import of a mesh file, before the model is loaded, when **Auto-Repair** is on in **Settings** > **General**. The subtitle reads "This model has severe mesh issues and is likely to need heavy repair." The dialog shows the triangle, component, non-manifold edge and boundary loop counts, plus a disclaimer: "Repair is recommended. Loading this mesh as-is may cause slicing errors or print failures, and successful output cannot be guaranteed."

**Why:** a quick check found non-manifold edges (edges shared by more than two faces), open holes (boundary loops), faces pointing the wrong way, or 256 or more separate pieces. A repair of a file like this can take a while, so DragonFruit asks first.

**What to do:**

1. Click **Repair** to repair the whole file as one model. This is the usual choice.
2. If the file holds several objects on one plate, click **Repair parts separately**. This button is shown only when the file has two or more separate shells and was opened from a file on disk (not, for example, from inside a zip archive or dropped into the browser version). Each object is repaired and reported on its own, and the ones that are fine stay as they are.
3. Click **Load As-Is** only if you plan to fix the file elsewhere, or you know the defects do not matter. Closing the dialog cancels the import of this model.

!!! note "Turning automatic repair off"
    Automatic repair on import is set in **Settings** > **General** with **Auto-Repair** (for mesh files) and **Auto-Repair Scenes** (for scene files).

## Repairing a mesh

### "Repair Incomplete"

<!-- source: src/components/scene/MeshRepairReportModal.tsx -->

**When it appears:** after a repair, as the title of the repair report. The text reads "DragonFruit could not fully repair this mesh — it is still not a valid manifold and may cause problems later in your workflow."

**Why:** the repair fixed what it could (the report lists it under **What DragonFruit repaired**, for example "Cleaned up 12 non-manifold edges." or "Reduced disconnected mesh sections from 40 to 3."), but the mesh still has defects. The leftover problems are listed in the report's follow-up notes.

**What to do:**

1. Read the follow-up notes in the report to see what is left.
2. Right-click the model and choose **Repair**. If you repaired the model from this menu earlier, choose **Repair Again**; after the automatic repair on import, the menu shows only **Auto-Repair**. A second pass sometimes resolves more.
3. If the file holds several objects, delete the model and import it again. When **Auto-Repair** is on in **Settings** > **General** and the file has the severe issues that trigger the "Repair recommended before slicing" dialog, pick **Repair parts separately** there.
4. If it still fails, fix the file in a 3D modeling program such as Blender or Netfabb, then import it again.
5. To go back to the model as it was imported, right-click it and choose **Repair** > **Undo Repairs**. This item (and **Show Report**) appears only after you have repaired the model from this menu, not after the automatic repair on import.

When you report a problem, click **Copy JSON** in the report and paste it into the issue.

### "Repair failed: …"

<!-- source: src/features/scene/meshRepairMessages.ts -->

**When it appears:** as an error toast after **Auto-Repair** or **Repair Again**. When several models are repaired at once, it reads "Repair failed for (model name): …" and the other models are still repaired.

**Why:** the repair stopped with an error, and the model was left unchanged. The text after the colon is the internal reason. The code does not point to one common cause.

**What to do:**

1. Try the repair again.
2. Restart DragonFruit and try once more.
3. If it keeps failing, report it (see "Reporting a problem" at the end of this page) with the full message text.

If you clicked **Stop** during a repair, you see "Repair cancelled. The model is unchanged." instead. That is not an error.

### "Could not restore the model."

<!-- source: src/features/scene/useSceneCollectionManager.ts -->

**When it appears:** after you choose **Repair** > **Undo Repairs**, which the menu offers only after you have repaired the model from the **Repair** menu. A related warning, "No source file to restore this model from.", means the same action had nothing to work with.

**Why:** a repair keeps no copy of the mesh it replaced. **Undo Repairs** reloads the original file from disk instead. This fails when:

- the original file was moved, renamed or deleted since you imported it,
- the file changed and no longer holds a mesh,
- DragonFruit has no record of the file the model came from, so there is nothing to reload.

When the reload works and **Auto-Repair Scenes** is on in **Settings** > **General**, the reloaded file goes through automatic repair again, so the restored model is the automatically repaired version, not the raw file.

**What to do:**

1. Put the original file back where it was when you imported it, then try **Undo Repairs** again.
2. Or use normal undo (Ctrl+Z unless you changed the shortcut) right after the repair.
3. Or delete the model and import the original file again.

## Hollowing and drain holes

### "Mesh quality too low"

<!-- source: src/components/organisms/modals/MeshRepairModals.tsx -->

**When it appears:** when you click **Apply** in the hollowing panel or the **Hole Punching** panel. The subtitle reads "Boolean operation requires a manifold mesh", and the text says the mesh has too many self-intersecting triangles and non-manifold edges for boolean operations to succeed.

**Why:** hollowing and hole punching cut into the mesh (a "boolean operation"), which only works on a closed solid. DragonFruit shows this dialog when:

- hollowing removed nothing from inside the model, or
- hole punching left the mesh exactly as it was.

The model is not changed. A badly damaged mesh is the usual reason. For hollowing, the same check also triggers when nothing inside the model is thicker than the **Shell Thickness**, so a thin model can show this dialog even if its mesh is fine.

**What to do:**

1. Right-click the model and choose **Repair** > **Auto-Repair** (or **Repair Again**), click **Repair** in the **Repair Mesh** dialog, then apply again.
2. For hollowing, lower **Shell Thickness** or **Voxel Size** and apply again. Also check that solid areas you painted do not cover the whole inside.
3. If the repair report says "Repair Incomplete", fix the mesh in Blender or Netfabb, as the dialog suggests, and import it again.

### "Hollowing failed: …"

<!-- source: src/features/hollowing/hollowingMessages.ts -->

**When it appears:** as an error after you click **Apply** in the hollowing panel.

**Why:** the hollowing engine stopped with an error. The text after the colon is the internal reason. If it mentions "lock poisoned", an earlier mesh operation crashed while it was running, and mesh operations keep failing until DragonFruit restarts.

**What to do:**

1. Restart DragonFruit, open your project and apply hollowing again.
2. Try a larger **Voxel Size**. Smaller voxel sizes need much more computation.
3. If it keeps failing, report it with the full message text.

!!! note "Preview problems"
    If the hollowing preview does not appear while you change settings, DragonFruit does not show an error for it. Check that the mesh is a valid solid (no "Mesh Issue detected" warning, no red stripes), then click **Apply** to see a real error if there is one.

### "Cannot remove hollowing: original geometry is unavailable."

<!-- source: src/features/hollowing/hollowingMessages.ts -->

**When it appears:** after you click **Remove Hollowing** and confirm.

**Why:** to remove hollowing, DragonFruit swaps the model back to the copy it saved of the solid model before hollowing. That copy is missing, or it could not be read back from the project file.

**What to do:**

1. If you hollowed the model just now, use undo (Ctrl+Z unless you changed the shortcut) instead.
2. Otherwise, delete the model and import the original solid file again.

### "Hole punching failed: …"

<!-- source: src/features/hollowing/hollowingMessages.ts -->

**When it appears:** as an error after you click **Apply** in the **Hole Punching** panel.

**Why:** the hole punch engine stopped with an error. The text after the colon is the internal reason. As with hollowing, "lock poisoned" means an earlier mesh operation crashed, and a restart is needed.

**What to do:**

1. Restart DragonFruit and apply the holes again.
2. If it keeps failing, report it with the full message text.

### "Hole punch source snapshot is missing or invalid. Re-apply cannot continue."

<!-- source: src/features/hollowing/hollowingMessages.ts -->

**When it appears:** when you click **Apply** after changing holes on a model that already has holes punched into it.

**Why:** to change holes, DragonFruit starts again from the copy of the model it saved before the first holes were punched. That copy could not be read, for example because it was damaged in the project file.

**What to do:**

1. Use undo (Ctrl+Z unless you changed the shortcut) to go back to the point before the holes were applied, if you can.
2. Otherwise, import the original model again and place the holes on it.
3. If this happens with a project you saved and reopened, report it and attach the `.voxl` file if you can share it.

### "Hollowing is available in DragonFruit Desktop only."

<!-- source: src/features/hollowing/hollowingMessages.ts -->

**When it appears:** when you apply hollowing in DragonFruit running in a web browser. "Hole punching is available in DragonFruit Desktop only." is the same message for hole punches.

**Why:** hollowing and hole punching run in the desktop app's native engine, which the browser version does not have.

**What to do:**

1. Install and use the DragonFruit desktop app for hollowing and drain holes.

## Reporting a problem

If a fix above says to report the problem, follow [Reporting a problem](common-issues.md#reporting-a-problem). For repair problems, include the report from **Copy JSON** in the repair report.
