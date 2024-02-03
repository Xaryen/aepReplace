// Version 1.0
// Script to import an AEP file and categorize its items

(function() {
    // Function to import an AEP file and categorize project items
    function importAEPAndCategorizeItems(aepPath) {
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

            // Initialize object to categorize items
            var categorizedItems = {
                compositions: [],
                footage: []
            };

            // Iterate through project items to categorize them
            for (var i = 1; i <= project.rootFolder.numItems; i++) {
                var item = project.rootFolder.item(i);
                if (item instanceof CompItem) {
                    // Item is a composition
                    categorizedItems.compositions.push(item);
                } else if (item instanceof FootageItem) {
                    // Item is footage
                    categorizedItems.footage.push(item);
                }
            }

            // Log or use the categorized items as needed
            // For now, we'll just log to the JavaScript Console
            $.writeln("Compositions: " + categorizedItems.compositions.length);
            $.writeln("Footage: " + categorizedItems.footage.length);

        } catch (e) {
            alert("Failed to import AEP file: " + e.toString());
        } finally {
            app.endUndoGroup();
        }
    }

    // Example usage
    // NOTE: Replace '/path/to/your/project.aep' with the actual file path
    // importAEPAndCategorizeItems('/path/to/your/project.aep');
})();
