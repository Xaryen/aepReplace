/*Originally based on mitsutsumi's AEP Routine Work https://www.3223.pics/2018/02/aeaep-routine-work-v10.html
* Version "3.0"
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
        inName: "IN_1".toLowerCase(), // default as in_1 for compatibility but won't be adding option to add multiple in layers
        outName: "OUT".toLowerCase(), 
        layerSuffix: "", //what will be attached to the top level layer, empty string means it will stay as default e.g. "A"
        fxFolder: "04_celfx", //subfolder in project root folder where imported materials will be placed
        fxFolderSuffix: "_FX",
        pathDepth: 4, //how many directory levels to go up from current project file before applying preset path and opening default location
        presetPath: "/_SOZAI/02_charaFX",
        presetPathFallback: "D:/", 
        solidsFolder: "99_solids",      //all solids will go here
        texturesFolder: "FX_textures"   //all footage items will go here, subfolder of fxFolder
    };

    function splitPath(path) {
        return path.split(/\\|\//); // This regex handles both \ and / for compatibility
    }

    function joinPath(parts) {
        return parts.join("\\"); // Use backslash for Windows paths
    }

    function getDefaultPath() {
        var currentProjectPath = app.project.file ? app.project.file.fsName : "";
        if (currentProjectPath === "") {
            return config.presetPathFallback;
        } else {
            var pathParts = splitPath(currentProjectPath);
            pathParts.length = Math.max(pathParts.length - config.pathDepth, 1); // Ensure we don't go below the root
            //$.writeln(pathParts);
            return joinPath(pathParts)+config.presetPath;
        }
    }

    function selectAEPFile() {
        var defaultPath = getDefaultPath();
        //$.writeln(defaultPath);
        // Set initial directory for the open dialog
        var initialDir = new Folder(defaultPath);
        $.writeln(initialDir);
        var aepFile = initialDir.openDlg("Select an After Effects Project", "After Effects Project:*.aep", initialDir, false);

        if (aepFile !== null) {
            return aepFile;
        } else {
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

        try {
            var importedProject = project.importFile(importOptions);

            var importedItems = {
                folders: [],
                compositions: [],
                footage: [],
                solids: []
            };

            function doCategorize(importedProject) {

                for (var i = 1; i <= importedProject.numItems; i++) {
                    var item = importedProject.item(i);
                    switch (true) { 
                        case (item instanceof FolderItem):
                            importedItems.folders.push(item);
                            doCategorize(item); 
                            break; 

                        case (item instanceof CompItem):
                            importedItems.compositions.push(item);
                            break;

                        case (item instanceof FootageItem):
                            if (item.mainSource instanceof SolidSource){
                                importedItems.solids.push(item);break;}
                            else {
                                importedItems.footage.push(item);break;}
                        default:
                            break;
                    }
                }

            }

            doCategorize(importedProject);

            // Log or use the categorized items as needed
            // For now, we'll just log to the JavaScript Console
            $.writeln("Folders: " + importedItems.folders.length);
            $.writeln("Compositions: " + importedItems.compositions.length);
            $.writeln("Footage: " + importedItems.footage.length);
            $.writeln("Solids: " + importedItems.solids.length);

            return importedItems;

        } catch (e) {
            alert("Failed to import AEP file: " + e.toString());
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
    }

    function checkLayers(layerArray){
        for (i = 0; i < layerArray.length; i++) {
                var layer = layerArray[i];
                $.writeln("Layer name: " + layer.name);
        }
    }

    function clearProjectPanelSelection(itemToSelect){
        for (i = 1; i < app.project.numItems; i++){
            var item = app.project.item(i);
            if (item.selected === true){
                item.selected = false;
            }
        }
        if (!itemToSelect){return null;}
        else{itemToSelect.selected = true;return itemToSelect;}
    }

    function clearTimelineSelection(itemToSelect){
        for (i = 1; i < app.project.activeItem.layers; i++){
            var item = app.project.activeItem.layer(i);
            if (item.selected === true){
                item.selected = false;
            }
        }
        if (!itemToSelect){return null;}
        else{itemToSelect.selected = true;return itemToSelect;}
    }
    
    function applyLayerProps(layer, refObj) { 
        switch (true) { 
            case (layer.source instanceof CompItem):
                //special cases for comps
                break; 

            case (layer.source instanceof FootageItem && layer.source.mainSource instanceof !SolidSource):
                //special cases for footage
                break;
                
            case (layer.source.mainSource instanceof SolidSource && layer.nullLayer == false):
                layer.source.width = refObj.width;
                layer.source.height = refObj.height;
                break;

            case (layer instanceof ShapeLayer): 
                //all shape layers should already be self-adjusting through expressions so only change in/out
                break;

            default:
                break;
        }
        //layer.inPoint = refObj.inPoint;
        if (layer.outPoint < refObj.duration){layer.outPoint = refObj.duration};
        //reset position to middle
        layer.transform.position.setValue([refObj.width/2,refObj.height/2,0]);
    }

    function applyItemProps(item, refObj) { 
        switch (true) { 
            case (item instanceof CompItem):
                item.width = refObj.width;
                item.height = refObj.height;
                item.duration = refObj.duration;
                break; 

            case (item instanceof FootageItem && item.mainSource instanceof !SolidSource):
                //special cases for footage
                break;
                
            case (item.mainSource instanceof SolidSource):
                //to resize nulls or not to
                break;

            default:
                break;
        }
    
    }

    function saveLayerProps(layer) {
        return {
            name: layer.name,
            transform: layer.transform,
            height: layer.source.height, 
            width: layer.source.width,
            duration: layer.source.duration,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint,
        };
    }

//-----------main-exec----------------------------------------------------//
    
    var selLayer = app.project.activeItem.selectedLayers[0];
    if (!selLayer){
        alert("No layers selected.");
        return;
    }
    
    var selectedAEPPath = selectAEPFile();
    if (!selectedAEPPath) {
        $.writeln("No AEP file selected.");
        return;
    } 
    
    //TODO: maybe save project at this point in case something shits the back
    var selLayerProps = saveLayerProps(selLayer);
    var categorizedItems = importAEP(selectedAEPPath); //import here
    app.beginUndoGroup("aepReplace script");
    var outComp = findCompByName(config.outName, categorizedItems);
    var importedLayers = catalogLayers(categorizedItems);
    importedLayers.sort();
    var inLayer = findLayerByName(config.inName, importedLayers);
    if (!outComp || !inLayer){
        alert("Issue with template aep.");
        return;
    }
    $.writeln(selLayer.name);
    var oldOutName = outComp.name; //"out"
    var newOutName = selLayer.name + config.layerSuffix; //"A" + "_FX"

    var inSource = inLayer.source; //hold onto inlayer for deleting it later

    inLayer.replaceSource(selLayer.source, false);


    selLayer.replaceSource(outComp, true);

    //project panel folder management (TODO: wrap this into a function later ig)
    var getFxFolder = findOrCreateFolder(config.fxFolder);
    var getSolidsFolder = findOrCreateFolder(config.solidsFolder);
    if (categorizedItems.footage.length > 0){
        var getTextureFolder = findOrCreateFolder(config.texturesFolder);
        if (getTextureFolder && getTextureFolder.parentFolder !== getFxFolder){
            getTextureFolder.parentFolder = getFxFolder;
        };
    }
    categorizedItems.folders.push(getTextureFolder);
    var makeFolderName = selLayerProps.name + config.fxFolderSuffix;
    var aepRootFolder = categorizedItems.compositions[0].parentFolder
    //$.writeln(aepRootFolder.name);
    aepRootFolder.name = makeFolderName;
    aepRootFolder.parentFolder = getFxFolder;
    //end of folder mngmt

    //organize imported stuff
    outComp.name = config.layerSuffix;
    categorizedItems.compositions.forEach(function(item){
        applyItemProps(item, selLayerProps);
        item.name = selLayerProps.name +item.name;
    });
    categorizedItems.footage.forEach(function(item){
        item.parentFolder = getTextureFolder;
    });
    categorizedItems.solids.forEach(function(item){
        item.parentFolder = getSolidsFolder;
    });
    inSource.remove(); // needs to be after footage/solids but before folders
    categorizedItems.folders.forEach(function(item){
        if (item.numItems === 0){item.remove()}    
    });

    selLayer.name = ""; //set to empty string so that the name will match projectItem
    inLayer.name = ""; //set to empty string so that the name will match projectItem
    app.project.autoFixExpressions(oldOutName, newOutName);

    importedLayers.forEach(function(layer){
        applyLayerProps(layer, selLayerProps);
    });
    //
    
    clearProjectPanelSelection(outComp);
    clearTimelineSelection(selLayer);
    //
    
    app.endUndoGroup();
    $.writeln("joever");
    return 0;
})();

