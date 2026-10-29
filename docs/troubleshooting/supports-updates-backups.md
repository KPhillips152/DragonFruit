# Troubleshooting: Supports, updates and backups

This page covers messages you may see while placing supports by hand, running auto supports and auto bracing, scanning for islands, updating DragonFruit, and using local backups. Search the page for the words on your screen.

If a fix below says to report the problem, follow [Reporting a problem](common-issues.md#reporting-a-problem): it lists what to include and where to find the log file.

## Placing supports by hand

### "Cannot Place Support"

<!-- source: src/supports/PlacementLogic/SupportLimitations.tsx -->

**When it appears:** a red tooltip next to the cursor while you hover the model in **Support** mode. The preview support turns red and a click does not place it. The second line tells you why.

**Why:** the line under the title is one of these:

- "Surface angle is upward facing. Supports cannot be placed here." The surface faces up, or is too close to a vertical wall. A support tip must touch a surface that faces down.
- "Support base must be below the tip (knot cannot be above the tip)." The point where the support would join its parent is higher than the contact point.
- "Contact point is lower than the stump root — the shaft would extend below the root joint."
- "Support would collide with the model geometry." No path to the build plate was found that does not pass through the model.
- "Too close to an existing support."
- "Support placement is outside the build volume." Part of the contact would sit below the build plate.

**What to do:**

1. Move the cursor to a nearby spot that faces down, or that has a clear path to the build plate.
2. For "Surface angle is upward facing", rotate the model so the area faces down. Setting **Cone Angle** to **Locked** or **Adaptive** in the Support Studio accepts surfaces a few degrees steeper than **Normal** does.
3. For "Too close to an existing support", move away from the support that is already there, or delete it first.
4. To place the support anyway, hold **Q** (the default key, changeable in **Settings** > **Hotkeys**) and click. Supports placed this way can print badly. Check them in the preview.

!!! note "Turning the tooltips off"
    **Settings** > **General** > **Show support tooltips** hides this tooltip and the "Stability Warning" tooltip. It does not change where supports can be placed.

### "Stability Warning"

<!-- source: src/supports/PlacementLogic/SupportLimitations.tsx -->

**When it appears:** a yellow tooltip next to the cursor while you place or drag a support. The support can still be placed.

**Why:** the line under the title is one of these:

- "Horizontal angles are not good for holding up overhangs. They are only good for lateral stability." The contact point is on a near-vertical wall. A support there steadies the model sideways but does little to hold up an overhang.
- "Support angle is too flat (must be >10° from horizontal)." The shaft would lie too flat. While you drag a knot or joint, DragonFruit holds it back to a safe angle and shows this warning.

**What to do:**

1. If the support is meant to hold up an overhang, move the tip to a surface that faces down.
2. If you are dragging a knot or joint, move it back toward a steeper angle until the warning clears.
3. If you only want sideways bracing, you can ignore the warning.

## Auto supports, bracing and presets

### "Auto Brace failed. Check console for details."

<!-- source: src/supports/Settings/SupportSidebar.tsx -->

**When it appears:** after you click **Apply** on the **Bracing** tab of the Support Studio, or press the **G** hotkey while that tab is open. "Clear All failed. Check console for details." is the same error for the **Clear All** button.

**Why:** an unexpected error stopped the bracing step. Bracing does not have a known failure that it reports to you. The details go to the developer console only. They are not written to the log file.

**What to do:**

1. Try **Apply** or **Clear All** again.
2. If it fails again, save the scene, restart DragonFruit and try once more.
3. If it still fails, report it. Say which model and supports you had, and attach the scene file if you can.

!!! note "Not errors"
    "No eligible supports found for Auto Bracing." means there are not enough supports near each other to brace. "No braces to remove on this model." means **Clear All** had nothing to remove. Both are shown in yellow and nothing is wrong.

### "Save failed"

<!-- source: src/supports/Settings/SupportSidebar.tsx -->

**When it appears:** for two seconds, as the tooltip of the save button in the **Support Studio** header after you click it.

**Why:** DragonFruit could not write the support and raft settings to the app's own storage. The settings you see still apply to this session, but they may be gone after a restart.

**What to do:**

1. Click the save button again.
2. If it keeps failing, restart DragonFruit and change the settings again.
3. If it fails after a restart, report it.

### "Invalid auto-support preset file: …"

<!-- source: src/components/controls/autoSupport/AutoSupportPresets.tsx -->

**When it appears:** under the preset buttons in **Auto Supports (Beta) Settings**, after you click **Import** and choose a file.

**Why:** the file is not an auto-support preset that this version can read. The end of the message says why:

- "not valid JSON." or "expected a JSON object." The file is not a preset file, or it is damaged.
- "unsupported kind." The file is JSON, but not an auto-support preset. Files exported by DragonFruit end in `.dragonfruit-auto-support.json`.
- "unsupported format version …" The file was made by a different version of DragonFruit that uses another preset format.
- "missing preset.", "missing preset name." or "settings must be an object." Part of the preset is missing.

**What to do:**

1. Check that you picked a file made with **Export** in the same dialog.
2. If someone sent you the preset, ask them to export it again and send the file without changes.
3. For "unsupported format version", update DragonFruit (see below) or ask for the preset from the same version you use.

### "Built-in presets cannot be deleted"

<!-- source: src/components/controls/autoSupport/AutoSupportPresets.tsx -->

**When it appears:** as the tooltip on the greyed-out **Delete** button in **Auto Supports (Beta) Settings** when a built-in preset is selected. **Rename** shows "A built-in's name is translated and cannot be renamed", and **Save** shows "A built-in preset cannot be saved over — Duplicate it to make it yours".

**Why:** built-in presets ship with DragonFruit and are locked.

**What to do:**

1. Select the built-in preset and click **Duplicate**.
2. Rename, change and save the copy. You can delete the copy at any time.

### "Scan the model to detect unsupported islands"

<!-- source: src/components/controls/IslandsPanel.tsx -->

**When it appears:** in the **Islands** panel before a scan. It stays after a scan when the scan found nothing.

**Why:**

- The scan found no islands at all, including supported ones and ones that touch the plate.
- The scan stopped because the model could not be prepared for scanning. This happens without a message.

**What to do:**

1. Click **Scan Islands** again and wait for **Scanning…** to finish.
2. If a model with clear overhangs never shows islands, right-click it and choose **Repair** > **Auto-Repair**, then scan again.
3. If that does not help, report it and attach the model.

## Updates

### "Update failed"

<!-- source: src/features/updater/UpdateCheckerSection.tsx -->

**When it appears:** in **Settings** > **Updates**, after you click **Install** and confirm **Update & Restart**. The line under the title gives the reason.

**Why:** DragonFruit downloads the update, checks its signature, then starts the installer. The reason line says which step failed:

- "Update failed: …" The download, the signature check or the installer failed. The text after the colon comes from the updater.
- "No cached update. Call check_updates first." The update found earlier is no longer ready, for example because an earlier attempt already used it.
- Any other reason: the update installed, but DragonFruit could not restart itself. The line shows the restart error.

**What to do:**

1. If the reason does not start with "Update failed:" or "No cached update", the update is probably installed. Close DragonFruit and start it again, then check the version in **Settings** > **About**.
2. Otherwise, click **Retry**. This checks for updates again. Then click **Install** again.
3. Check your internet connection and try again. Firewalls or proxies that block GitHub can stop the download.
4. If it keeps failing, download the latest version from https://github.com/Open-Resin-Alliance/DragonFruit/releases and install it over the current one.
5. Report it with the log file. For "Update failed: …" and "No cached update", the updater also writes the reason there. A restart error is not written to the log file, so copy the reason line into your report.

!!! note "Save your work first"
    DragonFruit tries to autosave before it updates, and the confirm dialog warns "Unsaved changes may be lost." Save your scene before you click **Update & Restart**.

### "Up to date" when a newer version exists

<!-- source: src/features/updater/UpdateCheckerSection.tsx -->

**When it appears:** **Settings** > **Updates** shows "Up to date" and "You’re on the latest version", but a newer release is listed on GitHub.

**Why:**

- The update check could not reach the update server. A failed check shows "Up to date" instead of an error.
- You are on a different release channel. **Stable Builds** do not offer **Development Previews**, and the other way round.

**What to do:**

1. Check your internet connection, then click **Check Again**.
2. Click the gear button (**Release channel settings**) at the top right of the tab and check which channel is selected.
3. If the check still finds nothing, download the release from GitHub and install it by hand.

### "Managed by Flatpak"

<!-- source: src/features/updater/UpdateCheckerSection.tsx -->

**When it appears:** in **Settings** > **Updates** on Linux, in place of the update checker.

**Why:** DragonFruit for Linux ships as a Flatpak, so updates are installed outside the app. On Linux DragonFruit does not check for updates and does not show update notices.

**What to do:**

1. Update with your software center, or run the command shown in the tab: flatpak update org.openresinalliance.dragonfruit
2. If you installed from a downloaded Flatpak bundle, click **Releases** and install the newer bundle.

## Local backups

These messages appear in **Settings** > **Backups**, in the bar at the bottom of the tab. Backups hold your app settings and printer and material profiles. They are saved as files in the **Selected directory**. Local backups work in the desktop app only.

!!! note "Automatic backups need the tab open"
    **Enable automatic backups** only makes backups while **Settings** > **Backups** is open. When you close the tab or Settings, no more automatic backups run. Click **Backup Now** before changes you may want to undo.

!!! note "The message does not show the exact cause"
    These messages do not include the reason the system gave for the failure. Check that the folder exists, that your user can write to it, and that the drive has free space.

### "Local backup sync failed."

<!-- source: src/components/settings/LocalBackupsSettingsTab.tsx -->

**When it appears:** after you click **Backup Now**, or when an automatic backup runs. Automatic backups only run while **Settings** > **Backups** is open.

**Why:** DragonFruit could not create the backup folder or write the backup files in it. Common causes are a folder you are not allowed to write to, a removed or disconnected drive, or a full disk.

**What to do:**

1. Check the folder under **Selected directory** exists and that you can create files in it.
2. Click **Use Default Path** to go back to the folder DragonFruit creates for you, then click **Backup Now** again.
3. Or click **Choose Folder** and pick a folder in your user folder.

### "Failed to choose local backup directory."

<!-- source: src/components/settings/LocalBackupsSettingsTab.tsx -->

**When it appears:** after you click **Choose Folder**.

**Why:**

- You closed the folder picker without choosing a folder. This shows the same message, and nothing has changed.
- The picker opened, but DragonFruit could not read the backups in the folder you chose.

**What to do:**

1. If you cancelled the picker, ignore the message. Your previous folder is still selected.
2. Otherwise, click **Choose Folder** again and pick a folder you can read and write.

### "Failed to initialize local backups."

<!-- source: src/components/settings/LocalBackupsSettingsTab.tsx -->

**When it appears:** when you open **Settings** > **Backups**.

**Why:** DragonFruit could not create its default backup folder, or could not read the latest backup in the selected folder.

**What to do:**

1. Click **Use Default Path** if it is shown, or **Choose Folder** to pick another folder.
2. Check that the drive of the selected folder is connected.
3. If the message comes back every time, restart DragonFruit. If it still appears, report it.

### "Failed to load local backup history."

<!-- source: src/components/settings/LocalBackupsSettingsTab.tsx -->

**When it appears:** when the tab loads the list under **Manage Backups**, or after **Refresh**, **Refresh History** or **Backup Now**.

**Why:** DragonFruit could not list the backup history folder inside the selected folder, usually because of folder permissions.

**What to do:**

1. Check you can open the selected folder and the history folder inside it.
2. Click **Refresh**.
3. If it still fails, choose another folder with **Choose Folder**.

### "Failed to load backup snapshot."

<!-- source: src/components/settings/LocalBackupsSettingsTab.tsx -->

**When it appears:** after you click **View snapshot** on an item under **Manage Backups**. The snapshot window closes. "Backup snapshot is malformed." means the same thing, but the file was read and is not a valid backup.

**Why:** the snapshot file could not be read, or it was changed or damaged after it was saved.

**What to do:**

1. Click **Refresh** in case the file was moved or deleted outside DragonFruit.
2. Try an older snapshot.
3. Delete a snapshot that is damaged with **Delete snapshot**.

### "Failed to restore backup snapshot."

<!-- source: src/components/settings/LocalBackupsSettingsTab.tsx -->

**When it appears:** after you click **Restore to App** in the snapshot window and confirm **Yes, restore**.

**Why:** DragonFruit could not read the snapshot file or write it back as the latest backup in the folder. Your current settings were not changed.

**What to do:**

1. Check that the selected folder can be written to.
2. Close the snapshot window, click **Refresh**, open the snapshot again and wait for it to load before you click **Restore to App**.

!!! note "A restore replaces your settings"
    A restore that works overwrites your current app settings and profiles with the snapshot and reloads the app. It cannot be undone. Click **Backup Now** first if you may want your current settings back.

### "Failed to delete backup snapshot."

<!-- source: src/components/settings/LocalBackupsSettingsTab.tsx -->

**When it appears:** after you confirm **Delete** in the **Delete Backup Snapshot** dialog.

**Why:** the snapshot file could not be removed, usually because of folder permissions or because another program has the file open.

**What to do:**

1. Close any program that may have the backup folder open.
2. Try again, or delete the file by hand from the history folder inside the backup folder.

### "Failed to open folder in file manager."

<!-- source: src/components/settings/LocalBackupsSettingsTab.tsx -->

**When it appears:** after you click **Open Folder**.

**Why:** DragonFruit could not start your system's file manager: Explorer on Windows, Finder on macOS, or the default file manager on Linux.

**What to do:**

1. Copy the path shown under **Selected directory** and open it in your file manager by hand.
2. On Linux, check that a default file manager is set for your desktop.

!!! note "Open Folder on Linux"
    On Linux, **Open Folder** opens the folder that contains your backup folder, not the backup folder itself. Open the backup folder from there. If the file manager starts but then fails, DragonFruit does not notice and shows no message. Open the path from **Selected directory** by hand.
