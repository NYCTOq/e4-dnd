# E4 D&D I-MEGA2a Visible Control Interaction Repair

The I-MEGA2 unit, integration and production build stages passed.

The browser matrix produced:

- 24 passed
- 6 failed

All six failures came from one test:

`builder route exposes usable interactive controls`

Root causes:

- `select.first()` resolved to a hidden responsive select.
- `button:enabled.first()` resolved to a responsive navigation toggle whose DOM node changed during focus verification.
- The application itself remained loaded and usable.

This repair changes the browser test to:

- select only visible text inputs
- select only visible `<select>` controls
- select only visible and enabled buttons
- perform a real physical button click
- rerun the targeted browser matrix
- rerun the complete I-MEGA2 package

Run:

```powershell
cd D:\Projects\e4_dnd
powershell -ExecutionPolicy Bypass -File .\APPLY_VISIBLE_CONTROL_INTERACTION_REPAIR_I_MEGA2A.ps1
```
