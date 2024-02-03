// Originally based on mitsutsumi's AEP Routine Work https://www.3223.pics/2018/02/aeaep-routine-work-v10.html
// Version 3.0

(function() {

    if (!Array.prototype.forEach) {
		Array.prototype.forEach = function(callback, thisArg) {
			for (var i = 0; i < this.length; i++) {
				callback.call(thisArg, this[i], i, this);
			}
		};
	}

    var config = {
        inName: "IN_1".toLowerCase(), // Ensure case-insensitive match
        outName: "OUT".toLowerCase(), // Ensure case-insensitive match
        fitItem: true,
        fxFolder: "04_celfx"
    };

        // Function to get a default path two folders up from the current project
    function splitPath(path) {
        // On Windows, paths use backslashes (\), so we split by backslash
        return path.split(/\\|\//); // This regex handles both \ and / for compatibility
    }

    // Function to handle path joining correctly on Windows
    function joinPath(parts) {
        // On Windows, paths are joined with backslashes (\)
        return parts.join("\\"); // Use backslash for Windows paths
    }

    // Updated function to get a default path two folders up from the current project
    function getDefaultPath() {
        var currentProjectPath = app.project.file ? app.project.file.fsName : "";
        if (currentProjectPath === "") {
            // If there's no current project, use the user's home directory as a fallback
            return Folder.myDocuments.fsName;
        } else {
            var pathParts = splitPath(currentProjectPath);
            // Remove the last two segments (the project file name and one folder up)
            pathParts.length = Math.max(pathParts.length - 2, 1); // Ensure we don't go below the root
            return joinPath(pathParts);
        }
    }

    // Function to select an AEP file
    function selectAEPFile() {
        var defaultPath = getDefaultPath();
        // Set initial directory for the open dialog
        var initialDir = new Folder(defaultPath);
        var aepFile = initialDir.openDlg("Select an After Effects Project", "After Effects Project:*.aep", initialDir, false);

        if (aepFile !== null) {
            // If the user selected a file, return the file path
            return aepFile;
        } else {
            // If the user canceled the selection, return null
            return null;
        }
    }

    // Function to import an AEP file and categorize project items
    function importAEP(aepPath) {
        // Check if the provided path is valid
        if (aepPath == null || aepPath === "") {
            alert("Invalid path for AEP file.");
            return;
        }

        // Import the AEP file
        var importOptions = new ImportOptions(File(aepPath));
        var project = app.project;
        app.beginUndoGroup("Import AEP");

        try {
            var importedProject = project.importFile(importOptions);

            var importedItems = {
                compositions: [],
                footage: [],
                solids: []
            };

            function doCategorize(importedProject) {

                // Iterate through project items to categorize them
                for (var i = 1; i <= importedProject.numItems; i++) {
                    var item = importedProject.item(i);
                    switch (true) { // Use `true` as the switch expression
                        case (item instanceof FolderItem):
                            doCategorize(item); 
                            break; 

                        case (item instanceof CompItem):
                            importedItems.compositions.push(item);
                            break;

                        case (item instanceof FootageItem):
                            if (item.mainSource instanceof SolidSource){importedItems.solids.push(item);break;}
                            else {importedItems.footage.push(item);break;}
                        default:
                            break;
                    }
                }

            }

            doCategorize(importedProject);

            // Log or use the categorized items as needed
            // For now, we'll just log to the JavaScript Console
            $.writeln("Compositions: " + importedItems.compositions.length);
            $.writeln("Footage: " + importedItems.footage.length);
            $.writeln("Solids: " + importedItems.solids.length);

            return importedItems;

        } catch (e) {
            alert("Failed to import AEP file: " + e.toString());
        } finally {
            app.endUndoGroup();
        }
    }

    // Function to catalog layers in all imported compositions
    function catalogLayersInComps(categorizedItems) {
        var compLayers = [];

        categorizedItems.compositions.forEach(function(comp) {
            var layers = [];
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                compLayers.push(layer);
            }
        });

        return compLayers;
    }

    // Function to find a layer by name in the cataloged compositions
    function findLayerByName(layerName, layerArray) {
        for (i = 0; i < layerArray.length; i++) {
        
                if (layerArray[i].name.toLowerCase() === layerName) {
                    return layerArray[i];
                }
            }
            
        return null; // Return null if the layer is not found
    }

    function findCompByName(compName, importedItems) {
        for (i = 0; i < importedItems.compositions.length; i++) {
            var comp = importedItems.compositions[i];
            if (comp.name.toLowerCase() === compName) {
                return comp;
            }
        }
            
        return null; // Return null if the layer is not found
    }

    function checkLayers(layerArray){
        for (i = 0; i < layerArray.length; i++) {
                var layer = layerArray[i];
                $.writeln("Layer name: " + layer.name);
        }
    }

//------------------exec----------------------------------------------------//
    var selectedAEPPath = selectAEPFile();
    $.writeln(selectedAEPPath);
    if (!selectedAEPPath) {
        alert("No AEP file selected.");
    } 
    else {
        
        var categorizedItems = importAEP(selectedAEPPath);
        var getAllLayers = catalogLayersInComps(categorizedItems);

        getAllLayers.sort();
        var inLayer = findLayerByName(config.inName, getAllLayers);
        $.writeln(inLayer.name);
        var outComp = findCompByName(config.outName, categorizedItems);
        $.writeln(outComp.name);



        $.writeln("joever");
    }

})();
