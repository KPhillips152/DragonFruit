# Troubleshooting: Slicing, export and printers

This page covers messages you may see while slicing and exporting, importing or exporting LUT curves, opening the output folder, connecting to network printers (NanoDLP/Athena and Elegoo SDCP), sending and starting prints, and using the printer monitor and webcam. Search the page for the words on your screen.

If a fix below says to report the problem, follow [Reporting a problem](common-issues.md#reporting-a-problem): it lists what to include and where to find the log file.

## Exporting and opening the output folder

### "Export failed. Check console for details."

<!-- source: src/features/export/components/ExportPanel.tsx -->

**When it appears:** as an error notice after you click export in the **Export** panel (mesh export such as STL, 3MF or `.voxl`, including export of one file per model or per plate).

**Why:** writing the file failed. The real reason is only written to the developer console, which the desktop app does not show. Reasons the code can hit include:

- The selected models have no triangle geometry to write ("Cannot export: no triangle geometry found." or "Cannot export 3MF: no triangle geometry found.").
- Writing to the chosen location failed, for example a folder you cannot write to or a full disk.

**What to do:**

1. Check that the models you are exporting are visible and actually contain a mesh. **Include Model Mesh** must be on to export the model.
2. Try again and save to a different folder, for example your Documents folder, and check you have free disk space.
3. Try a different format. If only one format fails, mention that when you report it.
4. If it still fails, report it with the steps you took.

!!! note "The log file may not have the reason"
    This error is logged in the app's internal console, not in the log file, so the log may not show it. Describe the export settings and scope you used in the report.

### "Failed to open directory."

<!-- source: src/components/modals/SliceCompletedModal.tsx -->

**When it appears:** in the **Slicing Finished** window after you click **Open Directory**. The same kind of message can appear in the **Printing** panel when you click the folder button next to the saved file path (its tooltip says **Open file location**).

**Why:** DragonFruit could not start your system's file manager. It only checks that the file manager program starts, so you usually see the system's own reason instead of this text:

- "Failed to open file manager: …" (Linux). DragonFruit opens the file's folder with xdg-open, and this appears when xdg-open is not installed.
- "Failed to open Explorer: …" (Windows) or "Failed to reveal in Finder: …" (macOS). These only appear if the system's own file manager program cannot be started at all.
- "Path is empty": no file path was recorded for this slice.

If the button works but no window opens, the file manager started and then failed on its own. DragonFruit does not see that, so no message appears.

If the folder button is greyed out and its tooltip says "Path unavailable", the file was not saved to a known location, so there is nothing to open.

**What to do:**

1. Read the path shown under **File Location** (in the **Slicing Finished** window) or **Saved to** (in the **Printing** panel) and open that folder yourself.
2. On Linux, install xdg-open (part of the xdg-utils package on most distributions) and make sure a file manager is set as the default for folders.
3. If the path is correct and your file manager works, report it.

## LUT curves

### "Unsupported LUT profile format. Use a DragonFruit .lutcurve.json file or a UVTools 256-value .lut/.json LUT array."

<!-- source: src/features/slicing/components/LutCurveEditor.tsx -->

**When it appears:** in a pop-up after you click **Import** in the LUT curve editor and pick a file.

**Why:** the file is valid JSON but is neither of the two formats DragonFruit reads:

- a DragonFruit curve file (`.lutcurve.json`) exported by DragonFruit, or
- a UVTools LUT: a plain list of exactly 256 numbers.

A list with a different count is rejected, and so is a list with an entry that cannot be read as a number (for example a word or an empty value).

**What to do:**

1. Re-export the curve from DragonFruit (**Export** in the LUT curve editor) or from UVTools, and import that file.
2. If you edited the file by hand, check that a UVTools LUT has exactly 256 values.

### "Failed to import LUT profile."

<!-- source: src/features/slicing/components/LutCurveEditor.tsx -->

**When it appears:** in a pop-up after you pick a file to **Import** in the LUT curve editor. Instead of this text you may see the reason itself, usually a JSON reading error such as "Unexpected token …" or "JSON Parse error: …".

**Why:** the file is not valid JSON. It may be damaged, cut short, or a different kind of file renamed to `.json` or `.lut`.

**What to do:**

1. Open the file in a text editor and check it is complete JSON.
2. Export the curve again from the program that made it and import the new file.

### "Failed to export LUT curve profile. …"

<!-- source: src/features/slicing/components/LutCurveEditor.tsx -->

**When it appears:** in a pop-up after you click **Export** in the LUT curve editor and choose where to save. In the desktop app the text after the first sentence is usually "Unknown export error".

**Why:** writing the file to the chosen location failed. The desktop app does not pass the system's reason on to this message, so it rarely says why.

**What to do:**

1. Export again and choose a different folder, for example your Documents folder.
2. Check you have free disk space.
3. If it fails in every folder, report it.

## Connecting to network printers

### "No printers found." / "No … printers found on the network."

<!-- source: src/components/printers/PrinterVariantPickerModal.tsx -->

**When it appears:** after the network scan under **Auto Detect**. In **Initial Setup** (when you add a printer) the message is "No … printers found on the network.", or "Network scan failed." or a reason from the scan if the scan itself failed. In **Network Settings** you only see "No printers found.".

!!! note "Finding Network Settings"
    Open the printer profile settings. If the profile has no saved network printer yet, click **Network Settings**. Once a printer is saved, the button reads **Show Fleet**: click it, then click **Manage Fleet**. The window that opens is titled **Network Settings**, or **Fleet Management** when you have more than one printer.

**Why:** the scan found no matching printer. Common causes:

- The printer is off, still starting up, or not on the network.
- Your computer and the printer are on different networks or subnets (for example guest Wi-Fi, a VPN, or a mesh network that isolates devices). The scan only checks your local subnet.
- A firewall on your computer blocks DragonFruit's network access.
- Athena printers do not announce themselves on the network, so DragonFruit has to probe each address in your subnet. This takes a moment.

**What to do:**

1. Check the printer is on and shows an IP address on its own screen or web page.
2. Click **Scan again**.
3. Use **Manual IP Entry**, type the printer's IP address (for example 192.168.1.100) and click **Connect**.
4. Allow DragonFruit through your firewall, and turn off any VPN while connecting.
5. In **Initial Setup**, to skip networking for now, click **Configure Networking Later**.

### "Couldn't connect to …" / "NanoDLP host unreachable or invalid status payload" / "SDCP host unreachable"

<!-- source: src/components/printers/PrinterVariantPickerModal.tsx -->

**When it appears:** in **Initial Setup**, under the list of found printers after you click one. In **Network Settings** (**Manage Fleet**), after you click **Connect**: the reason shows as a small line under the printer in **Managed Printers**, and the printer is marked **Offline**.

**Why:** DragonFruit could not get a valid answer from that address:

- The IP address is wrong or has changed (many routers hand out new addresses).
- The printer is off, busy starting up, or not reachable from this computer.
- For NanoDLP/Athena, DragonFruit asks the printer's web server for its status. If something else answers at that address, or the printer's web server is not running, the reply is not a valid status.

**What to do:**

1. Check the printer's current IP address on its screen and enter it again.
2. Open that address in a web browser on the same computer. If the printer's web page does not load, the problem is the network, not DragonFruit.
3. Restart the printer and try again.
4. If your router allows it, give the printer a fixed (reserved) IP address so it does not change.

### "Printer model mismatch: expected …" / "Unsupported printer model. Supported models: Athena, Athena 2."

<!-- source: plugins/athena/rust/network.rs -->

**When it appears:** when connecting to a NanoDLP printer. The message may end with 'found "…"', naming the model the printer reported.

**Why:** the printer answered, but it reports a different model than the printer profile you are setting up, or a model DragonFruit does not support for this connection. Only Athena and Athena 2 are supported over NanoDLP.

**What to do:**

1. Check you picked the right printer profile for this machine (for example Athena 2, not Athena).
2. Check you typed the IP address of the right printer, if you have more than one.
3. If the printer really is the model you picked, report it with the model name shown in the message.

### "Could not read printer data."

<!-- source: src/components/printers/PrinterVariantPickerModal.tsx -->

**When it appears:** in **Initial Setup**, after DragonFruit connects to the printer and tries to detect its exact model. A reason from the printer may appear instead, such as "HTTP 404" or "Invalid printer data payload".

**Why:** the connection worked, but the printer did not return the data DragonFruit uses to tell its variants apart. Older printer firmware may not provide it.

**What to do:**

1. Once the printer has finished starting up, click it again in the list of found printers.
2. Update the printer's firmware if an update is available.
3. To add the printer without detection, click **Cancel**, turn the printer off or disconnect it from the network, and start adding the printer again with **Auto Detect**. When the scan finds no printers, click **Configure Networking Later** and pick your variant by hand. Turn the printer back on and connect it afterwards in **Network Settings** (**Manage Fleet**).

### "Detected a … screen that doesn't match any known variant of …"

<!-- source: src/components/printers/PrinterVariantPickerModal.tsx -->

**When it appears:** in **Initial Setup**, after the printer reports its screen bit depth.

**Why:** DragonFruit picks the printer variant from the screen bit depth the printer reports. The reported value does not match any variant of the printer family you chose. "Detected a ? screen" means the printer did not report a bit depth.

**What to do:**

1. Check that you chose the right printer family.
2. To pick the variant by hand, click **Cancel**, turn the printer off or disconnect it from the network, and start adding the printer again with **Auto Detect**. When the scan finds no printers, click **Configure Networking Later** and choose the variant. Connect the printer afterwards in **Network Settings** (**Manage Fleet**).
3. If your printer is the family you chose, report it with the bit depth shown in the message.

## Printer offline

### "This machine is currently offline"

<!-- source: src/components/organisms/modals/PrintingModals.tsx -->

**When it appears:** in the printer monitor, in place of the printer's status. The body says "Reconnect this printer in Network Settings, or choose a different online printer from the selector above." Related signs of the same state:

- "… is offline" as the tooltip of a printer card on the **Monitoring Dashboard**. Offline cards cannot be opened.
- "Selected printer is offline" as the tooltip of the **Monitor** button in the top bar.
- **Offline** next to a printer's IP address in printer lists.

**Why:** DragonFruit cannot currently reach the printer: it did not answer its last status check, or it was never connected in this session. Common causes are the printer being off or asleep, a changed IP address, or a network problem between the computer and the printer.

**What to do:**

1. Check the printer is on and connected to the network.
2. Click **Open Network Settings** and click the connect button next to the printer under **Managed Printers** to reconnect.
3. If the IP address changed, add the printer again with its new address.
4. If you have several printers, pick an online one from the printer selector at the top of the monitor.

### "Printer is responding slowly"

<!-- source: src/components/organisms/modals/PrintingModals.tsx -->

**When it appears:** in the printer monitor. The body says "We will keep trying to reconnect for another …s. If reconnection fails, please verify the network configuration and confirm the printer is online."

**Why:** the printer answered a status check recently but has stopped answering. Printers can be slow to respond while busy, for example while processing a file. DragonFruit waits for a grace period (30 seconds by default) before it shows the printer as offline.

**What to do:**

1. Wait for the countdown. If the printer answers, the monitor returns to normal.
2. If it then shows "This machine is currently offline", follow the steps in that entry.

### "Selected printer is offline. Choose an online printer to continue."

<!-- source: src/components/organisms/modals/PrintingModals.tsx -->

**When it appears:** in the **Fleet Upload** or **Pre-Slice Targeting** window, under the list of printers.

**Why:** the printer selected as the target is not reachable right now. Offline printers are greyed out and marked **Offline**.

**What to do:**

1. Pick a printer marked **Online**.
2. Or reconnect the printer in **Network Settings** (**Manage Fleet**) (see "This machine is currently offline"), then try again.

## Slicing for a network printer

### "Remote material unavailable." / "Network unavailable."

<!-- source: src/features/slicing/components/SlicingPanel.tsx -->

**When it appears:** in an **Offline Layer Height** box in the **Slicing** panel. The full text reads "Network unavailable. Select a matching material during import instead."

**Why:** your printer profile uses material profiles stored on the printer (NanoDLP/Athena), but the printer is not connected or not reachable. DragonFruit cannot read the printer's material, so it cannot take the layer height from it.

**What to do:**

1. To slice anyway, set the layer height in the **Offline Layer Height** box (in micrometres, 10 to 1000). Use the layer height of the material you will print with.
2. When you upload later, pick a material on the printer that has the same layer height.
3. Or reconnect the printer in **Network Settings** (**Manage Fleet**) so DragonFruit can read its materials.

### "No material on this printer matches sliced layer height … mm." / "No matching material profile found on this printer."

<!-- source: src/features/printing/usePrintingMonitorManager.ts -->

**When it appears:** in the **Fleet Upload** window, under **Target material (matching sliced layer height)**. In **Pre-Slice Targeting** the message is "No material profiles found on this printer." Related messages in the upload window:

- "Selected material on this printer does not match sliced layer height … mm."
- "Select a matching material profile before upload."

**Why:** for NanoDLP/Athena, each upload is tied to a material profile stored on the printer, and its layer height must match the layer height you sliced with. None of the printer's materials match, or no material is selected. This message also appears when the printer answers the material request with an error, because DragonFruit then gets an empty list. If the request cannot be made at all, the error text is shown in place of this message.

**What to do:**

1. Slice again with the layer height of a material that is already on the printer.
2. Or, on the printer's web interface, create or edit a material profile with the layer height shown in the message. Then restart DragonFruit and upload again.
3. If the printer does have a matching material, check that the printer is online, then restart DragonFruit and try again.

!!! note "Restart after changing materials on the printer"
    DragonFruit reads a printer's material list once per session and keeps it. Changes you make on the printer, or a list that came back empty because of an error, are only picked up after you restart DragonFruit.

## Sending and starting prints

### "Send failed: …"

<!-- source: src/app/page.tsx -->

**When it appears:** in the upload window after you click **Upload to …** (or **Upload to Selected Printer**). The stage shows "Upload failed". The text after "Send failed:" is the reason.

**Why:** the file did not reach the printer, or the printer refused it. Common reasons:

- "error sending request for url (…)": DragonFruit could not reach the printer during the upload. The printer went offline, its IP address changed, or the network dropped.
- "HTTP" followed by a number, such as "HTTP 500": the printer received the request but refused it. On NanoDLP this can mean the printer is busy, out of storage, or does not accept the file or material.
- "SDCP upload chunk failed (HTTP …)": an Elegoo printer refused part of the file.
- "Network operation timed out": the upload took longer than DragonFruit allows (10 minutes for a NanoDLP upload).
- "Network error during upload": the connection broke during the transfer.
- "Lost connection while waiting for device processing.": the upload finished, but the printer stopped answering while it processed the file.
- "Failed to open upload file …" or "Failed to read SDCP upload chunk from native file path.": DragonFruit could not read the sliced file from its temporary folder. It may have been removed, or the disk may be full.

If you cancelled the upload yourself, you see "Upload canceled. You can retry when ready." instead.

**What to do:**

1. Check the printer is on and shows as online, then click **Retry Upload**.
2. For an "HTTP …" reason, open the printer's own web page or screen and check it is idle and has free storage. Delete old files from the printer if needed.
3. For a timeout on a large file, move the printer or computer closer to the router, or use a wired connection, and try again.
4. If the sliced file could not be read, slice again and upload the new file.
5. If the same reason keeps appearing, report it with the full message.

### "No printer IP address available for send operation." / "No connected printer is available for upload."

<!-- source: src/app/page.tsx -->

**When it appears:** in the upload window or the **Printing** panel when you try to upload. A similar message, "No printer IP address available for Print Now.", can appear when you click **Start Print**.

**Why:** the printer profile has no connected printer, or the saved printer has no IP address.

**What to do:**

1. Open **Network Settings** (**Manage Fleet**) for your printer profile and connect the printer (see "Couldn't connect to …" if that fails).
2. Try the upload again.

### "Upload complete. Device is still processing metadata after waiting."

<!-- source: src/app/page.tsx -->

**When it appears:** in the upload window, with the stage "Device still processing". It may include the plate number.

**Why:** the file was uploaded, but the printer had still not finished preparing it after DragonFruit waited 10 minutes. Very large files can take a long time on the printer.

**What to do:**

1. Check the printer's own screen or web page. The file is usually there and may finish processing on its own.
2. Once it is ready, start the print from the printer, or from the file list in the DragonFruit printer monitor.

### "Print start failed: …"

<!-- source: src/app/page.tsx -->

**When it appears:** in the upload window after you click **Start Print**. The stage shows "Start print failed".

**Why:** the printer did not accept the start command. The reason after the colon is usually one of:

- "HTTP" followed by a number: a NanoDLP printer refused the command, for example because it is already printing or the plate no longer exists.
- "SDCP printer/start failed.": an Elegoo printer did not confirm the command. This also happens when the printer does not answer in time.
- "Unable to resolve SDCP mainboard ID for control command.": DragonFruit could not identify the Elegoo printer on the network to send the command to.
- "error sending request for url (…)": the printer could not be reached.

**What to do:**

1. Check the printer is idle, the build plate and vat are in place, and no error is shown on its screen.
2. Click **Start Print** again.
3. If it still fails, start the uploaded file from the printer's own screen, or from the file list in the DragonFruit printer monitor.
4. For the "mainboard ID" reason, reconnect the printer in **Network Settings** (**Manage Fleet**) and try again.

## Printer monitor and webcam

### "The webcam image could not be loaded."

<!-- source: src/components/organisms/modals/PrintingModals.tsx -->

**When it appears:** in the webcam area of the printer monitor, under the title "Webcam Unavailable". Other messages in the same place:

- "Webcam stream stalled. Retrying (…)…": the stream stopped; DragonFruit retries it twice by itself.
- "The webcam stream did not deliver any video data in time." or "RTSP relay websocket disconnected.": the video stream from the printer stopped or never started.
- "Webcam timed out … times in a row. Auto-retries are paused to prevent request spam. Click Retry Webcam to try again.": the printer did not answer webcam requests 3 times in a row. The button to use is **Retry**.
- "No camera endpoint available from this printer." or "No webcam endpoint reported by this printer.", under "Webcam Not Ready": the printer did not report a camera.

**Why:** DragonFruit could not get a picture from the printer's camera. The camera may be off, unplugged, busy, or not reachable over the network.

**What to do:**

1. Click **Retry**.
2. Check the camera works in the printer's own web interface or app.
3. If **Reset stream slot** is shown (the title is then "Video Stream Busy"), the printer has reached its limit of video streams. Close other apps or browser tabs that show the camera, or click **Reset stream slot**, then **Retry**.
4. If your printer has no camera, you can ignore this.
