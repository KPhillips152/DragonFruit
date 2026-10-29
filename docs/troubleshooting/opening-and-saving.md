# Troubleshooting: Opening and saving

This page covers problems importing model files (STL, OBJ, 3MF), importing Lychee `.lys` and ChiTuBox `.chitubox` / `.ctp` scenes, opening and saving `.voxl` scenes, and autosave and crash recovery. Search the page for the words you see on screen.

!!! note "ChiTuBox import is off by default"
    DragonFruit only opens `.chitubox` and `.ctp` files after you turn on **Settings** > **Experiments** > **Chitubox File Import**. The change applies after you restart DragonFruit or reload the window.

If a fix below says to report the problem, follow [Reporting a problem](common-issues.md#reporting-a-problem): it lists what to include and where to find the log file.

## Dropping and picking files

### "Unsupported file format"

<!-- source: src/app/page.tsx -->

**When it appears:** You drag a file over the editor in **Prepare** mode. The empty start screen shows the same thing as "Unsupported file type" and "Unsupported format detected.", followed by the list of formats.

**Why:** None of the files you are dragging have an extension DragonFruit accepts. The accepted extensions are STL, OBJ and 3MF for models, plus the scene formats: VOXL, LYS and, only when the ChiTuBox experiment is on, CHITUBOX and CTP. The check uses the file extension only.

**What to do:**

1. Check the file extension. A model exported as something else (for example `.step` or `.blend`) has to be exported again as STL, OBJ or 3MF from the program that made it.
2. For a `.chitubox` or `.ctp` file, turn on **Settings** > **Experiments** > **Chitubox File Import**, then restart DragonFruit.
3. If the file is a `.zip`, you can't drop it. Open it with **Import mesh…** or **Import scene…** in the DragonFruit app menu (top bar), or with **Load Mesh** on the start screen. DragonFruit lists the models and scenes inside so you can pick them.

### Nothing happens after importing a model or a ZIP

<!-- source: src/features/scene/useSceneCollectionManager.ts -->

**When it appears:** You import an STL, OBJ or 3MF (or a `.zip` of them). The loading overlay closes and no model appears. No error message is shown.

**Why:**

- When a model file fails to load, DragonFruit doesn't show the reason, and doesn't write it to the log file either. Typical reasons are an empty file, a 3MF with no mesh inside, or a file the mesh loader can't read.
- A `.zip` that can't be read, or that has no STL, OBJ, 3MF or scene file inside, is skipped without a message.
- If you clicked to cancel the import in the mesh repair prompt, nothing is added. This is expected.

**What to do:**

1. Open the file in another program (for example your mesh editor) to check that it really holds geometry.
2. Export it again from the program that made it, as a binary STL, and import that.
3. If the file opens elsewhere but not in DragonFruit, report it. Give the file name and type and the exact steps you took, and attach the model if you can. The log file won't contain the reason.

### "Could not reopen this file from cache."

<!-- source: src/components/layout/EmptySceneState.tsx -->

**When it appears:** You click an entry under **Recent files** on the start screen.

**Why:**

- An OBJ or 3MF is no longer where it was opened from (moved, renamed, deleted, or on a drive that isn't connected).
- DragonFruit keeps its own copy of some recent files in the app's storage, and that copy is missing or empty. This happens for older entries and after the app's storage is cleared.

**What to do:**

1. Open the file again from its current location with **Load Mesh** or **Import Scene**. This also fixes the recent entry.
2. To remove broken entries, click **Clear** next to **Recent files**. This empties the whole list, not just the broken entry.

!!! note "Other ways a recent file can misbehave"
    - A moved or deleted STL gives no message: the click just loads nothing. Open the file from its new location instead.
    - A recent scene is always reopened from the copy DragonFruit stored when you last opened it, not from the file on disk. If you changed or moved the file since then, open it with **Open scene…** instead.
    - DragonFruit keeps up to 10 recent files, but the start screen shows only 8 of them.

## Importing Lychee and ChiTuBox scenes

### "… is Experimental"

<!-- source: src/components/organisms/modals/SceneFileModals.tsx -->

**When it appears:** You open a `.lys`, `.chitubox` or `.ctp` file. The title reads "LYS Import is Experimental", "Chitubox Import is Experimental" or "Chitubox Pro Import is Experimental" (or "Plugin Import is Experimental"), with the subtitle "This feature is still under development."

For `.chitubox` and `.ctp` files, this only appears after you turn on **Settings** > **Experiments** > **Chitubox File Import**. Until then DragonFruit doesn't accept those files (see "Unsupported file format").

**Why:** This is a warning, not an error. These formats are converted into DragonFruit's own format, so support placement may differ from the original scene. For `.chitubox` files, the plate position and orientation are not recovered.

**What to do:**

1. Click **Continue** to import, or **Cancel** to stop.
2. Tick **Do not remind again** to stop seeing this warning for that format.
3. After import, check the supports before slicing.

### "Scene import failed: …"

<!-- source: src/features/scene/sceneImportMessages.ts -->

**When it appears:** A `.lys`, `.chitubox` or `.ctp` file fails to import. A pop-up with "Scene import failed:" and the same reason also appears.

**Why:** The text after the colon comes from the importer. The common ones:

- "LYS manifest JSON header not found" or "Unsupported .lys container variant (ZIP-like). Manifest JSON header not found.": the file is not a `.lys` layout this importer knows, or it is not a Lychee scene at all.
- "scene.bin is truncated: … The file is incomplete.", "Geometry file too short": the file was cut off, often by an unfinished download or copy.
- "LysParser: No geometry .bin file found", "LysParser: No parseable geometry .bin payloads found", "LYS import: no object to convert": the scene has no model the importer could read.
- "Failed to decode scene data: …" or "Failed to parse LYS manifest: …": the scene data inside the file could not be read.
- "Not a .chitubox file (magic 0x…).", "Not a .ctp file (too short).", "Not a .ctp file (magic 0x…).", "Invalid .ctp object table.": the file doesn't start the way a ChiTuBox project should. It may be damaged, or be a different file type renamed.
- "No readable geometry in .ctp container.": the `.ctp` file has no model the importer could read.

**What to do:**

1. Copy the file again from where it came from, and make sure the download or copy finished. Then import it again.
2. Open the file in the slicer that made it. If it opens, save it again there, or export the models as STL and import those instead (you lose the supports).
3. If the file opens in its own slicer but not in DragonFruit, report it with the exact message and, if you can, the file.

### "Imported … scene files (… failed)." / "Scene import failed for all … files."

<!-- source: src/features/scene/sceneImportMessages.ts -->

**When it appears:** You import several scene files at once and some or all of them fail.

**Why:** Each failed file failed for one of the reasons on this page. When you import several files at once, the reason for each file is not shown.

**What to do:**

1. Import the failed files one at a time to see each file's own message.
2. Look that message up on this page.

### "No registered scene import handler for …" / "Unsupported scene file: …"

<!-- source: src/features/scene/useSceneCollectionManager.ts -->

**When it appears:** DragonFruit is asked to import a scene file type it has no importer for.

**Why:** The scene importers are built into DragonFruit, so this shouldn't happen in a normal build. The code doesn't show a common user cause.

**What to do:**

1. Check that the file has the right extension (`.voxl`, `.lys`, `.chitubox` or `.ctp`).
2. Update DragonFruit. On Windows and macOS, use **Settings** > **Updates** > **Check for Updates**. On Linux, that tab shows "Managed by Flatpak", so update through Flatpak (your software center, or flatpak update).
3. If it still happens, report it with the exact message and what you were opening.

## Opening `.voxl` scenes

### "Can't open this scene"

<!-- source: src/components/modals/ObsoleteVoxlVersionModal.tsx -->

**When it appears:** You open a `.voxl` scene. The dialog's subtitle is "Saved by an obsolete DragonFruit version", and the message says the file "was saved in the VOXL V1 format, which this version no longer reads." The toast "Could not open …: unsupported VOXL version." appears with it.

**Why:** The scene uses the old VOXL V1 format (JSON or an early binary container). Only pre-release builds of DragonFruit wrote that format. This version refuses those files instead of loading them halfway.

**What to do:**

1. Open the scene in an older DragonFruit build that still reads it, and save it again.
2. Open the re-saved file here.

### "VOXL import failed: …"

<!-- source: src/features/scene/sceneImportMessages.ts -->

**When it appears:** A `.voxl` scene fails to open. A pop-up with "Scene import failed:" and the same reason also appears.

**Why:** The text after the colon says what was wrong:

- "Unsupported VOXL binary version: … Expected 2 or 3.": the scene was saved by a newer DragonFruit than the one you are running.
- "Not a VOXL file: the VOXL binary header is missing.": the file is not a DragonFruit scene. It may be another file renamed to `.voxl`, or it is empty.
- "Invalid VOXL V2 file: too small.", "Invalid VOXL V2 file: truncated directory.", "VOXL V2: chunk … extends beyond file boundary.", "VOXL V2: chunk … size mismatch after decompression …": the file is cut off or damaged, often by an unfinished copy, download or cloud sync.
- "VOXL V2: missing META chunk." or "VOXL V2: missing SUPP chunk.": parts of the scene are missing from the file.

**What to do:**

1. For a newer-version error, update DragonFruit. On Windows and macOS, use **Settings** > **Updates** > **Check for Updates**. On Linux, that tab shows "Managed by Flatpak", so update through Flatpak (your software center, or flatpak update).
2. For a damaged file, copy it again from where it came from (backup, cloud, the other computer), and wait for any sync to finish.
3. Look next to the scene file for a recovery copy named like *name*_autosave.voxl. If there is one, try opening it.
4. If a file that should be fine still fails, report it with the exact message and, if you can, the file.

### "Imported VOXL scene: … skipped … models." / "VOXL import finished with no importable meshes."

<!-- source: src/features/scene/sceneImportMessages.ts -->

**When it appears:** A `.voxl` scene opens, but some models are left out. If all of them are left out, you see "VOXL import finished with no importable meshes." instead.

**Why:** DragonFruit skips a model it can't load and keeps the rest of the scene. A model is skipped when:

- the scene holds no mesh data for it inside the file, or the mesh data is missing;
- the mesh fails to load, or fails its integrity check.

**What to do:**

1. Compare the scene with what you expected to see. DragonFruit doesn't say which models it skipped, and doesn't write their names to the log file.
2. Import those models again from their original STL, OBJ or 3MF files, and save the scene.
3. If the file was copied or synced, try a fresh copy, since damaged mesh data also causes this.

## Saving scenes

!!! note "Hidden models are not saved"
    **Save scene** writes only the models that are visible at the time. Models you have hidden are left out of the `.voxl` file, unless every model is hidden. Show all models before saving if you want to keep them.

### "Could not save the scene"

<!-- source: src/app/page.tsx -->

**When it appears:** You use **Save scene** or **Save scene as…** (or Ctrl+S) and the file could not be written. The message under the title is the reason.

**Why:**

- If writing to the scene's current location fails, DragonFruit first asks you for a new save location. This message appears when that second try also fails.
- Common reasons name the file and end with the reason from your system, such as "Failed creating destination directory '…': …", "Failed flushing '…' to disk before commit: …" or "Failed committing '…' over '…' after 3 attempts: …". The usual causes are a folder you can't write to, a full disk, a drive or network share that went away, or another program (antivirus, cloud sync, file preview) holding the file open.
- "Could not write … to the selected destination." means the write failed without a more specific reason.

**What to do:**

1. Save to a local folder you own, such as your Documents folder, with **Save scene as…**.
2. Check that the drive has free space and is still connected.
3. If the file sits in a synced or scanned folder, pause the sync or wait a moment and save again.

!!! note "Your previous file is kept"
    The scene is written to a temporary file first and only then moved over the old one. If saving fails, the last good version on disk is left as it was.

### "Scene is too large to save"

<!-- source: src/app/page.tsx -->

**When it appears:** You save a scene that is over the 4 GB limit of the `.voxl` format. The box below the message lists up to five of the largest models with their compressed size.

**Why:** DragonFruit refuses to save rather than write a broken file. There are two cases, and the message tells you which one you hit:

- "This scene is … compressed and exceeds the VOXL 4 GB limit.": the whole scene is over 4 GB after compression.
- "“…” is … on its own, which exceeds the VOXL 4 GB limit for a single mesh.": one model is over 4 GB on its own, either compressed or uncompressed. The message names that model and gives its size.

**What to do:**

1. If the whole scene is too large, remove one of the largest models listed, or move some models into a separate scene. Then save again.
2. If one model is too large on its own, removing other models or splitting the scene won't help. Reduce that model itself (for example, re-export it from your mesh editor with fewer triangles), or remove it from the scene.

The message also suggests turning off "Save original model along with decimated". This build has no setting with that name, so the steps above are the fix.

## Autosave and crash recovery

### "Restore Failed"

<!-- source: src/app/page.tsx -->

**When it appears:** You click **Restore** in the **Unsaved Scene Found** dialog at startup, and the autosaved scene can't be loaded.

**Why:**

- "The autosave recovery file could not be found.": the recovery file was deleted or moved, or it was beside a project folder that is no longer reachable.
- "The autosaved recovery file is corrupted or unreadable.", with the detail "The scene importer rejected or could not parse the autosave data.": the file was found but could not be opened as a scene, usually because it was only partly written when DragonFruit closed. A "VOXL import failed: …" message with the exact reason usually appears too (see above).
- Other details, such as "Autosaved VOXL file is empty." or "Failed reading autosaved scene: …", give the reason directly.

**What to do:**

1. Open your last manually saved copy of the scene, if you have one.
2. If it still happens, report it with the exact message and the detail text.

!!! note "A failed restore loses the recovery copy"
    By the time this message appears, DragonFruit has already deleted the autosave file and cleared the recovery state. You can't retry, and the autosave file is not left on disk. To protect a recovery copy the next time, copy the file in your file manager before you click **Restore**. The **Unsaved Scene Found** dialog shows the file under **Name** (hover over it for the full path). The subtitle says where it is: "Recovered from beside your project file" means it sits next to your project, and "Recovered from the app data folder" means it is in the autosave folder inside DragonFruit's app data folder.

### "Autosave is not working"

<!-- source: src/app/page.tsx -->

**When it appears:** While you work, after background autosave has failed twice in a row. The message is the reason. If there is no reason, it is "The background recovery save failed repeatedly." The last line tells you when the last successful autosave happened, or says "No autosave has succeeded this session. Save your project manually."

**Why:** The crash-recovery copy could not be written. The reasons are the same as for "Could not save the scene" (folder not writable, disk full, drive gone, file locked), or the scene is over the 4 GB limit (see "Scene is too large to save"). You only see this message once per outage.

**What to do:**

1. Save your scene now with **Save scene**, so your work does not depend on autosave.
2. Fix the cause named in the message (free space, reconnect the drive, save the project to a local folder).
3. Check **Settings** > **Scene Autosave**. The current failure is shown there under **Standing Autosave Error** until the next autosave works.

### "Standing Autosave Error"

<!-- source: src/components/settings/SceneAutosaveSettingsTab.tsx -->

**When it appears:** In **Settings** > **Scene Autosave**, under **Autosave Status**.

**Why:** The most recent autosave attempt failed, and the text below the heading is its reason. It clears by itself after the next autosave works.

**What to do:**

1. Follow the steps under "Autosave is not working" above.
2. Click **Refresh** after making a change to see the current state.

### "Could not write beside the project (…), so the default location is being used."

<!-- source: src/components/settings/SceneAutosaveSettingsTab.tsx -->

**When it appears:** In **Settings** > **Scene Autosave**, under **Autosave scene file**.

**Why:** For a saved project, autosave tries to write the recovery copy beside the project file. When it can't, it writes to the app data folder instead. The word in brackets says why:

- "parent-missing": the project's folder no longer exists or isn't reachable.
- "parent-unwritable": DragonFruit can't create files in the project's folder.
- "not-a-scene-file": the project isn't a scene file DragonFruit saves to.
- "no-project": the scene hasn't been saved as a project yet.

Autosave still works in all these cases. Only the location changes.

**What to do:**

1. Nothing is required. The recovery copy is in the folder shown under **Autosave scene file**.
2. To keep the copy beside your project, save the project with **Save scene as…** to a folder you can write to.

!!! note "no-project can show while autosave works normally"
    When the last autosave did not record a reason, this tab works one out without knowing your project, and that always gives "no-project". Check the path under **Autosave scene file** to see where the copy really is.

### "Failed to load autosave status." / "Failed to mark autosave as clean." / "Failed to open autosave location."

<!-- source: src/components/settings/SceneAutosaveSettingsTab.tsx -->

**When it appears:** In **Settings** > **Scene Autosave**: when the tab opens or you click **Refresh**, when you click **Mark Recovery Clean**, or when you click **Open Autosave Location**.

**Why:** DragonFruit could not read, write or open its autosave folder in the app data location. The code shows no single common cause. Possible causes include that folder being read-only or blocked by security software, or (for the last message) the autosave file no longer existing.

**What to do:**

1. Restart DragonFruit and open the tab again.
2. If it keeps failing, report it with the exact message and which button you clicked.

!!! note "Mark Recovery Clean deletes the autosave file"
    **Mark Recovery Clean** doesn't only clear the recovery flag. It also deletes the autosave file itself, so only use it when you are sure you don't need that copy.

## Support data and support splitting

### "Support import failed." / "Support import failed: unsupported support JSON format."

<!-- source: src/features/scene/sceneImportMessages.ts -->

**When it appears:** You use **Load Support Data (V2)** in the island scan card and pick a file.

**Why:**

- "Support import failed.": the file isn't valid JSON. This includes picking a `.lys` file here, which the file picker allows but this import can't read.
- "… unsupported support JSON format.": the file is JSON but isn't a DragonFruit support export.

**What to do:**

1. Pick a support JSON exported from DragonFruit.
2. To bring in a Lychee scene with its supports, open the `.lys` with **Import scene…** instead.

### "Failed to split supports" / "Failed to merge supports" / "Scan failed: …"

<!-- source: src/features/scene/sceneImportMessages.ts -->

**When it appears:** You right-click a model and use **Supports** > **Split supports**, **Merge supports** or **Scan for Supports**.

**Why:** An unexpected error happened while splitting, merging or scanning the mesh. The code shows no common cause. For a scan, the text after "Scan failed:" is the reason.

**What to do:**

1. Undo, then try the command again.
2. If it keeps failing, report it with the exact message, the steps you took and, if you can, the model.
