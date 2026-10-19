# Kickstand

A kickstand is a grounded support that starts on the plate or raft and ends by snapping to another support shaft.

## What it is

- A rooted support-to-support element.
- Distinct from a brace because it begins on the build surface.
- Uses trunk-like anatomy at the base, then ends with a knot on a host shaft.

## Geometry

- Base: Roots.
- Body: shaft and joint chain that rises from the base.
- Terminal transition: the final section that adapts to the host connection.
- End: knot that snaps to a trunk or branch shaft.

## Behavior

- The lower body follows the active trunk diameter settings.
- The end knot slides on the host shaft like a normal knot.
- The top knot cannot move below the host segment's lower boundary.

## Constraints

- The host target must be a trunk or branch shaft.
- Kickstands do not use a contact cone at the top.
- They do not attach to twigs, sticks, or braces at the top.
- Every shaft member, including the final connection to the host, must rise
  within **Shaft → Max Angle**, measured from vertical. The default 80° limit
  requires at least 10° above horizontal. Flat and descending members are invalid.
- The same angle limit applies with grid mode on or off. A low host or a distant
  grid root produces a red invalid preview rather than an unrestricted bridge.
- Clicking an invalid preview adds no kickstand. If an occupied grid node moves
  the proposed root, the rebuilt geometry must pass the angle check too.


## Related

- [Roots](roots.md)
- [Knot](knot.md)
- [Trunk](trunk.md)
- [Branch](branch.md)
- [Brace](brace.md)

