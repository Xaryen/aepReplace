/*Originally based on mitsutsumi's AEP Routine Work https://www.3223.pics/2018/02/aeaep-routine-work-v10.html
* Version 3.0
*
*
*
*/
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
        //fitItem: true,
        fxFolder: "04_celfx",
        fxFolderSuffix: "_FX",
        presetPath: "",
        presetPathFallback: "",
        solidsFolder: "99_solids",
        texturesFolder: "FX_textures"
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

    function catalogLayers(categorizedItems) {
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

    function findOrCreateFolder(folderName) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof FolderItem && item.name === folderName) {
                return item; 
            }
        }
        return app.project.items.addFolder(folderName);
    };

    function checkLayers(layerArray){
        for (i = 0; i < layerArray.length; i++) {
                var layer = layerArray[i];
                $.writeln("Layer name: " + layer.name);
        }
    }

//------------------exec----------------------------------------------------//
    
    var selLayer = app.project.activeItem.selectedLayers[0];
    if (!selLayer){
        alert("No layers selected");
        return;
    }
    $.writeln(selLayer.name);
    
    var selectedAEPPath = selectAEPFile();
    //$.writeln(selectedAEPPath);
    if (!selectedAEPPath) {
        alert("No AEP file selected.");
        return;
    } 
    

    var categorizedItems = importAEP(selectedAEPPath);
    var getAllLayers = catalogLayers(categorizedItems);

    getAllLayers.sort();
    var inLayer = findLayerByName(config.inName, getAllLayers);
    $.writeln(inLayer.name);
    var outComp = findCompByName(config.outName, categorizedItems);
    $.writeln(outComp.name);


    //project panel folder management
    var getFxFolder = findOrCreateFolder(config.fxFolder);
    var getSolidsFolder = findOrCreateFolder(config.solidsFolder);
    var getTextureFolder = findOrCreateFolder(config.texturesFolder);
    if (getTextureFolder && getTextureFolder.parentFolder !== getFxFolder){
        getTextureFolder.parentFolder = getFxFolder;
    };
    $.writeln(getFxFolder.name);

    var makeFolderName = selLayer.name + config.fxFolderSuffix;
    var aepRootFolder = categorizedItems.compositions[0].parentFolder
    $.writeln(aepRootFolder.name);
    aepRootFolder.name = makeFolderName;
    aepRootFolder.parentFolder = getFxFolder;

    categorizedItems.footage.forEach(function(item){
        item.parentFolder = getTextureFolder;
    });
    categorizedItems.solids.forEach(function(item){
        item.parentFolder = getSolidsFolder;
    });
    for (q = 1; q <= aepRootFolder.numItems; q++){
        if (aepRootFolder.item(q) instanceof FolderItem && aepRootFolder.item(q).numItems === 0){aepRootFolder.item(q).remove()}
    }
    ///end of folder mngmt


    $.writeln("joever");
})();
