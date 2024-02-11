# Key differences

## In_1:
 Now only accepts one layer as input, precomp before applying if necessary.
## Out:
 Same as before (evetually will add ability to output multiple comps).
## AutoCrop:
 Large layers processed with autocrop will now be handled correctly.
## Remapping:
 Layers that have been remapped in a way where they don't start at the beginning of the comp will now be handled correctly.
## Naming:
 The name of the selected layer will be appended to all components correctly (hyphen or underscore should be included in the components in the template aep e.g. _celFX -> A_celFX).
## Sorting:
 Textures and solids will now be sorted into appropriate folders upon import.
## Path:
 Instead of replying on saving prefs the selection will by default open in a configurable location above the currently opened project file.
