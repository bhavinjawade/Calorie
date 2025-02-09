document.addEventListener("DOMContentLoaded", function () {
    const addEntryTab = document.getElementById("addEntryTab");
    const historyTab = document.getElementById("historyTab");
    const addEntrySection = document.getElementById("addEntrySection");
    const historySection = document.getElementById("historySection");
    const entryForm = document.getElementById("entryForm");
    const weightEntriesDiv = document.getElementById("weightEntries");
    const inEntriesDiv = document.getElementById("inEntries");
    const outEntriesDiv = document.getElementById("outEntries");
    const historyListDiv = document.getElementById("historyList");
  
    // --- Navigation: Toggle between Add Entry and History ---
    addEntryTab.addEventListener("click", function () {
      addEntrySection.classList.remove("d-none");
      historySection.classList.add("d-none");
      addEntryTab.classList.add("active");
      historyTab.classList.remove("active");
    });
  
    historyTab.addEventListener("click", function () {
      addEntrySection.classList.add("d-none");
      historySection.classList.remove("d-none");
      historyTab.classList.add("active");
      addEntryTab.classList.remove("active");
      updateHistoryList();
    });
  
    /**
     * Helper to merge items in existing array by matching `item[key]`.
     * If newArr item matches oldArr item (same key value), overwrite. Otherwise, push.
     */
    function mergeByKey(oldArr, newArr, key) {
      newArr.forEach((newItem) => {
        const matchIndex = oldArr.findIndex((oldItem) => oldItem[key] === newItem[key]);
        if (matchIndex >= 0) {
          oldArr[matchIndex] = newItem; // Overwrite same key
        } else {
          oldArr.push(newItem); // Append
        }
      });
    }
  
    /**
     * Merge logic for the entire "entry" object:
     * - If there's an existing entry on the same date, we merge:
     *   - Weights by label
     *   - InEntries by description
     *   - OutEntries by description
     * - Otherwise, we add a new entry.
     */
    function mergeEntryInLocalStorage(newEntry) {
      let entries = JSON.parse(localStorage.getItem("entries")) || [];
      const existingIndex = entries.findIndex((e) => e.date === newEntry.date);
  
      if (existingIndex >= 0) {
        // Merge with existing
        const existing = entries[existingIndex];
  
        // Merge weights by label
        mergeByKey(existing.weights, newEntry.weights, "label");
        // Merge inEntries by description
        mergeByKey(existing.inEntries, newEntry.inEntries, "description");
        // Merge outEntries by description
        mergeByKey(existing.outEntries, newEntry.outEntries, "description");
  
        entries[existingIndex] = existing;
      } else {
        // No existing entry => add new
        entries.push(newEntry);
      }
      localStorage.setItem("entries", JSON.stringify(entries));
    }
  
    // --- Helper: Parse "YYYY-MM-DD" as a local Date object (no time offset) ---
    function parseLocalDateString(dateStr) {
      const [y, m, d] = dateStr.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
  
    // --- Auto-Save function (check/tick button) ---
    function autoSaveEntry() {
      const dateValue = document.getElementById("entryDate").value; // "YYYY-MM-DD"
      if (!dateValue) {
        console.log("No date selected, skipping auto-save.");
        return;
      }
  
      // Gather weight entries
      const weightEntries = [];
      const weightItems = weightEntriesDiv.querySelectorAll(".entry-item");
      weightItems.forEach((item) => {
        const labelSelect = item.querySelector("select");
        const customInput = item.querySelector(".custom-label-input");
        const weightInput = item.querySelector('input[type="number"]');
  
        let label = "";
        if (labelSelect.value === "Other") {
          label = customInput.value.trim();
        } else {
          label = labelSelect.value;
        }
  
        const weight = parseFloat(weightInput.value);
        if (label || !isNaN(weight)) {
          weightEntries.push({ label, weight });
        }
      });
  
      // Gather food entries
      const inEntries = [];
      const inItems = inEntriesDiv.querySelectorAll(".entry-item");
      inItems.forEach((item) => {
        const inputs = item.querySelectorAll("input");
        const description = inputs[0].value.trim();
        const calories = parseFloat(inputs[1].value);
        if (description || !isNaN(calories)) {
          inEntries.push({ description, calories });
        }
      });
  
      // Gather exercise entries
      const outEntries = [];
      const outItems = outEntriesDiv.querySelectorAll(".entry-item");
      outItems.forEach((item) => {
        const inputs = item.querySelectorAll("input");
        const description = inputs[0].value.trim();
        const calories = parseFloat(inputs[1].value);
        if (description || !isNaN(calories)) {
          outEntries.push({ description, calories });
        }
      });
  
      // Build the new entry
      const entry = {
        id: Date.now(),
        date: dateValue, // "YYYY-MM-DD"
        weights: weightEntries,
        inEntries: inEntries,
        outEntries: outEntries,
      };
  
      // Merge with existing data for that date
      mergeEntryInLocalStorage(entry);
  
      console.log("Auto-saved entry at " + new Date().toISOString() + " for date " + dateValue);
    }
  
    // --- Functions to create new input entry elements ---
    function createWeightEntry(label = "", weight = "") {
      const div = document.createElement("div");
      div.className = "entry-item";
  
      // Select for label
      const labelSelect = document.createElement("select");
      labelSelect.className = "form-control";
  
      // Default prompt
      const defaultOption = document.createElement("option");
      defaultOption.value = "";
      defaultOption.textContent = "When did you weigh yourself?";
      if (!label) {
        defaultOption.selected = true;
      }
      labelSelect.appendChild(defaultOption);
  
      // Preset options
      const options = [
        "After Waking Up",
        "After First Dump",
        "After Breakfast",
        "Pre-Workout",
        "Post-Workout",
        "After Gym",
        "After Lunch",
        "Before Dinner",
        "After Dinner",
        "Before Bed",
        "Other",
      ];
      options.forEach((optionText) => {
        const option = document.createElement("option");
        option.value = optionText;
        option.textContent = optionText;
        if (optionText === label) {
          option.selected = true;
        }
        labelSelect.appendChild(option);
      });
  
      // Custom label input
      const customInput = document.createElement("input");
      customInput.type = "text";
      customInput.placeholder = "Enter custom label";
      customInput.className = "form-control custom-label-input";
      customInput.style.display = "none";
  
      if (label && !options.includes(label)) {
        labelSelect.value = "Other";
        customInput.value = label;
        customInput.style.display = "block";
      }
  
      labelSelect.addEventListener("change", function () {
        if (labelSelect.value === "Other") {
          customInput.style.display = "block";
        } else {
          customInput.style.display = "none";
          customInput.value = "";
        }
      });
  
      // Weight input
      const weightInput = document.createElement("input");
      weightInput.type = "number";
      weightInput.placeholder = "Weight (kg)";
      weightInput.step = "0.1";
      weightInput.value = weight;
      weightInput.className = "form-control";
  
      // Remove button
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn btn-danger remove-btn";
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.addEventListener("click", function () {
        div.remove();
      });
  
      // Tick (auto-save) button
      const tickBtn = document.createElement("button");
      tickBtn.type = "button";
      tickBtn.className = "btn btn-success tick-btn";
      tickBtn.innerHTML = '<i class="fas fa-check"></i>';
      tickBtn.addEventListener("click", autoSaveEntry);
  
      div.appendChild(labelSelect);
      div.appendChild(customInput);
      div.appendChild(weightInput);
      div.appendChild(tickBtn);
      div.appendChild(removeBtn);
  
      return div;
    }
  
    function createInEntry(description = "", calories = "") {
      const div = document.createElement("div");
      div.className = "entry-item";
  
      const descInput = document.createElement("input");
      descInput.type = "text";
      descInput.placeholder = "Food Description";
      descInput.value = description;
      descInput.className = "form-control";
  
      const calInput = document.createElement("input");
      calInput.type = "number";
      calInput.placeholder = "Calories";
      calInput.value = calories;
      calInput.className = "form-control";
  
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn btn-danger remove-btn";
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.addEventListener("click", function () {
        div.remove();
      });
  
      const tickBtn = document.createElement("button");
      tickBtn.type = "button";
      tickBtn.className = "btn btn-success tick-btn";
      tickBtn.innerHTML = '<i class="fas fa-check"></i>';
      tickBtn.addEventListener("click", autoSaveEntry);
  
      div.appendChild(descInput);
      div.appendChild(calInput);
      div.appendChild(tickBtn);
      div.appendChild(removeBtn);
  
      return div;
    }
  
    function createOutEntry(description = "", calories = "") {
      const div = document.createElement("div");
      div.className = "entry-item";
  
      const descInput = document.createElement("input");
      descInput.type = "text";
      descInput.placeholder = "Exercise Description";
      descInput.value = description;
      descInput.className = "form-control";
  
      const calInput = document.createElement("input");
      calInput.type = "number";
      calInput.placeholder = "Calories Burned";
      calInput.value = calories;
      calInput.className = "form-control";
  
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn btn-danger remove-btn";
      removeBtn.innerHTML = '<i class="fas fa-times"></i>';
      removeBtn.addEventListener("click", function () {
        div.remove();
      });
  
      const tickBtn = document.createElement("button");
      tickBtn.type = "button";
      tickBtn.className = "btn btn-success tick-btn";
      tickBtn.innerHTML = '<i class="fas fa-check"></i>';
      tickBtn.addEventListener("click", autoSaveEntry);
  
      div.appendChild(descInput);
      div.appendChild(calInput);
      div.appendChild(tickBtn);
      div.appendChild(removeBtn);
  
      return div;
    }
  
    // Add one default input for each section on load
    function addDefaultEntries() {
      weightEntriesDiv.innerHTML = "";
      inEntriesDiv.innerHTML = "";
      outEntriesDiv.innerHTML = "";
  
      weightEntriesDiv.appendChild(createWeightEntry());
      inEntriesDiv.appendChild(createInEntry());
      outEntriesDiv.appendChild(createOutEntry());
    }
  
    addDefaultEntries();
  
    // --- Event Listeners for "Add" buttons ---
    document.getElementById("addWeightBtn").addEventListener("click", function () {
      weightEntriesDiv.appendChild(createWeightEntry());
    });
  
    document.getElementById("addInBtn").addEventListener("click", function () {
      inEntriesDiv.appendChild(createInEntry());
    });
  
    document.getElementById("addOutBtn").addEventListener("click", function () {
      outEntriesDiv.appendChild(createOutEntry());
    });
  
    // --- Form Submission: Save the entry (the original "Save Entry" button) ---
    entryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const dateValue = document.getElementById("entryDate").value;
      if (!dateValue) {
        alert("Please select a date");
        return;
      }
  
      // Gather weight entries
      const weightEntries = [];
      const weightItems = weightEntriesDiv.querySelectorAll(".entry-item");
      weightItems.forEach((item) => {
        const labelSelect = item.querySelector("select");
        const customInput = item.querySelector(".custom-label-input");
        const weightInput = item.querySelector('input[type="number"]');
  
        let label = "";
        if (labelSelect.value === "Other") {
          label = customInput.value.trim();
        } else {
          label = labelSelect.value;
        }
  
        const weight = parseFloat(weightInput.value);
        if (label || !isNaN(weight)) {
          weightEntries.push({ label, weight });
        }
      });
  
      // Gather food entries
      const inEntries = [];
      const inItems = inEntriesDiv.querySelectorAll(".entry-item");
      inItems.forEach((item) => {
        const inputs = item.querySelectorAll("input");
        const description = inputs[0].value.trim();
        const calories = parseFloat(inputs[1].value);
        if (description || !isNaN(calories)) {
          inEntries.push({ description, calories });
        }
      });
  
      // Gather exercise entries
      const outEntries = [];
      const outItems = outEntriesDiv.querySelectorAll(".entry-item");
      outItems.forEach((item) => {
        const inputs = item.querySelectorAll("input");
        const description = inputs[0].value.trim();
        const calories = parseFloat(inputs[1].value);
        if (description || !isNaN(calories)) {
          outEntries.push({ description, calories });
        }
      });
  
      // Build the new entry
      const entry = {
        id: Date.now(),
        date: dateValue, // "YYYY-MM-DD"
        weights: weightEntries,
        inEntries: inEntries,
        outEntries: outEntries,
      };
  
      // Merge with existing data for that date
      mergeEntryInLocalStorage(entry);
  
      alert("Entry saved!");
  
      // Reset the form
      entryForm.reset();
      addDefaultEntries();
    });
  
    // --- Update History List (Show Date + average weight on the right) ---
    function updateHistoryList() {
      historyListDiv.innerHTML = "";
      let entries = JSON.parse(localStorage.getItem("entries")) || [];
  
      // Sort by date descending (newest first)
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  
      entries.forEach((entry) => {
        // Create the card container
        const card = document.createElement("div");
        card.className = "card mb-2";
  
        // Card header (collapse toggle)
        const cardHeader = document.createElement("div");
        cardHeader.className = "card-header";
        cardHeader.id = "heading" + entry.id;
  
        const h5 = document.createElement("h5");
        h5.className = "mb-0";
  
        // Expand/collapse button with flex layout
        const button = document.createElement("button");
        button.className =
          "history-collapse-button collapsed d-flex justify-content-between align-items-center w-100";
        button.type = "button";
        button.setAttribute("data-toggle", "collapse");
        button.setAttribute("data-target", "#collapse" + entry.id);
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-controls", "collapse" + entry.id);
  
        // Left side: local date
        const localDate = parseLocalDateString(entry.date);
        const dateDisplay = localDate.toDateString();
        const headerText = document.createElement("span");
        headerText.textContent = dateDisplay;
  
        // Right side: (Avg Wt) + arrow
        const rightSideDiv = document.createElement("div");
        rightSideDiv.className = "d-flex align-items-center gap-2 avgwt";
  
        // If there's weight data, calculate the average
        if (entry.weights && entry.weights.length > 0) {
          let sum = 0;
          let validCount = 0;
          entry.weights.forEach((w) => {
            if (!isNaN(w.weight)) {
              sum += w.weight;
              validCount++;
            }
          });
          if (validCount > 0) {
            const avg = sum / validCount;
            const avgSpan = document.createElement("span");
            avgSpan.textContent = `${avg.toFixed(1)} kg`;
            rightSideDiv.appendChild(avgSpan);
          }
        }
  
        // Arrow icon
        const arrowIcon = document.createElement("span");
        arrowIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
        rightSideDiv.appendChild(arrowIcon);
  
        // Put it all together
        button.appendChild(headerText);     // date on the left
        button.appendChild(rightSideDiv);   // average weight + arrow on the right
        h5.appendChild(button);
        cardHeader.appendChild(h5);
        card.appendChild(cardHeader);
  
        // The collapsible content
        const collapseDiv = document.createElement("div");
        collapseDiv.id = "collapse" + entry.id;
        collapseDiv.className = "collapse";
        collapseDiv.setAttribute("aria-labelledby", "heading" + entry.id);
        collapseDiv.setAttribute("data-parent", "#historyList");
  
        // Card body details
        const cardBody = document.createElement("div");
        cardBody.className = "card-body";
  
        // Summary: totalIn, totalOut, net
        const totalIn = (entry.inEntries || []).reduce(
          (sum, item) => sum + (isNaN(item.calories) ? 0 : item.calories),
          0
        );
        const totalOut = (entry.outEntries || []).reduce(
          (sum, item) => sum + (isNaN(item.calories) ? 0 : item.calories),
          0
        );
        const net = totalIn - totalOut;
        const summary = document.createElement("p");
        summary.innerHTML = `<strong>Summary:</strong> Total In: ${totalIn} cal, Total Out: ${totalOut} cal, Net: ${net} cal`;
        cardBody.appendChild(summary);
  
        // Weights
        if (entry.weights && entry.weights.length > 0) {
          const weightsHeader = document.createElement("h6");
          weightsHeader.textContent = "Weights:";
          cardBody.appendChild(weightsHeader);
          const ulWeights = document.createElement("ul");
          entry.weights.forEach((w) => {
            const li = document.createElement("li");
            li.textContent = `${w.label || "No Label"}: ${w.weight} kg`;
            ulWeights.appendChild(li);
          });
          cardBody.appendChild(ulWeights);
        }
  
        // Food
        if (entry.inEntries && entry.inEntries.length > 0) {
          const inHeader = document.createElement("h6");
          inHeader.textContent = "Food In:";
          cardBody.appendChild(inHeader);
          const ulIn = document.createElement("ul");
          entry.inEntries.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = `${item.description || "No Description"}: ${item.calories} cal`;
            ulIn.appendChild(li);
          });
          cardBody.appendChild(ulIn);
        }
  
        // Exercise
        if (entry.outEntries && entry.outEntries.length > 0) {
          const outHeader = document.createElement("h6");
          outHeader.textContent = "Exercise Out:";
          cardBody.appendChild(outHeader);
          const ulOut = document.createElement("ul");
          entry.outEntries.forEach((item) => {
            const li = document.createElement("li");
            li.textContent = `${item.description || "No Description"}: ${item.calories} cal`;
            ulOut.appendChild(li);
          });
          cardBody.appendChild(ulOut);
        }
  
        collapseDiv.appendChild(cardBody);
        card.appendChild(collapseDiv);
        historyListDiv.appendChild(card);
      });
    }
  
    // --- CSV Export Functionality ---
    function exportHistoryAsCSV() {
      let entries = JSON.parse(localStorage.getItem("entries")) || [];
      if (!entries.length) {
        alert("No entries to export.");
        return;
      }
      let csvContent =
        "Date,Weights,Food In,Exercise Out,Total In (cal),Total Out (cal),Net (cal)\n";
      entries.forEach((entry) => {
        // We'll just use the stored "YYYY-MM-DD" for the Date column
        const date = entry.date;
  
        const weightsStr =
          entry.weights && entry.weights.length > 0
            ? entry.weights.map((w) => `${w.label}: ${w.weight} kg`).join("; ")
            : "";
        const foodStr =
          entry.inEntries && entry.inEntries.length > 0
            ? entry.inEntries.map((i) => `${i.description}: ${i.calories} cal`).join("; ")
            : "";
        const exerciseStr =
          entry.outEntries && entry.outEntries.length > 0
            ? entry.outEntries.map((o) => `${o.description}: ${o.calories} cal`).join("; ")
            : "";
        const totalIn = (entry.inEntries || []).reduce(
          (sum, item) => sum + (isNaN(item.calories) ? 0 : item.calories),
          0
        );
        const totalOut = (entry.outEntries || []).reduce(
          (sum, item) => sum + (isNaN(item.calories) ? 0 : item.calories),
          0
        );
        const net = totalIn - totalOut;
  
        function escapeCSVField(field) {
          if (
            typeof field === "string" &&
            (field.includes(",") || field.includes('"') || field.includes("\n"))
          ) {
            field = field.replace(/"/g, '""');
            field = `"${field}"`;
          }
          return field;
        }
  
        const row = [
          date,
          weightsStr,
          foodStr,
          exerciseStr,
          totalIn,
          totalOut,
          net,
        ]
          .map(escapeCSVField)
          .join(",");
        csvContent += row + "\n";
      });
  
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "calorie_tracker_history.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  
    // --- Attach CSV Export Event Listener ---
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", exportHistoryAsCSV);
    }
  
    // --- CSV Import Functionality ---
    const importCsvBtn = document.getElementById("importCsvBtn");
    const importCsvInput = document.getElementById("importCsvInput");
  
    importCsvBtn.addEventListener("click", function () {
      importCsvInput.click();
    });
  
    importCsvInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        const csvText = e.target.result;
        importCSV(csvText);
      };
      reader.readAsText(file);
      importCsvInput.value = "";
    });
  
    // Basic CSV line parser
    function parseCSVLine(line) {
      const result = [];
      let current = "";
      let insideQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuote && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === "," && !insideQuote) {
          result.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    }
  
    // Import CSV and merge into localStorage
    function importCSV(csvText) {
      const lines = csvText.split("\n").filter((line) => line.trim() !== "");
      if (lines.length < 2) {
        alert("CSV file is empty or invalid.");
        return;
      }
  
      // First line is the header
      const header = parseCSVLine(lines[0]);
      // Expected: Date,Weights,Food In,Exercise Out,Total In (cal),Total Out (cal),Net (cal)
  
      const importedEntries = [];
  
      // Process each row (skip header)
      for (let i = 1; i < lines.length; i++) {
        const columns = parseCSVLine(lines[i]);
        if (columns.length < 4) continue;
  
        const csvDateStr = columns[0].trim();
        if (!csvDateStr) continue;
  
        // We'll keep it as "YYYY-MM-DD"
        const dateValue = csvDateStr;
  
        // Weights
        const weights = [];
        if (columns[1]) {
          const weightItems = columns[1]
            .split(";")
            .map((item) => item.trim())
            .filter((item) => item);
          weightItems.forEach((item) => {
            const parts = item.split(":");
            if (parts.length < 2) return;
            const label = parts[0].trim();
            let weightVal = parts[1].replace("kg", "").trim();
            const weight = parseFloat(weightVal);
            if (!isNaN(weight)) {
              weights.push({ label, weight });
            }
          });
        }
  
        // Food (inEntries)
        const inEntries = [];
        if (columns[2]) {
          const foodItems = columns[2]
            .split(";")
            .map((item) => item.trim())
            .filter((item) => item);
          foodItems.forEach((item) => {
            const parts = item.split(":");
            if (parts.length < 2) return;
            const description = parts[0].trim();
            let calVal = parts[1].replace("cal", "").trim();
            const calories = parseFloat(calVal);
            if (!isNaN(calories)) {
              inEntries.push({ description, calories });
            }
          });
        }
  
        // Exercise (outEntries)
        const outEntries = [];
        if (columns[3]) {
          const exerciseItems = columns[3]
            .split(";")
            .map((item) => item.trim())
            .filter((item) => item);
          exerciseItems.forEach((item) => {
            const parts = item.split(":");
            if (parts.length < 2) return;
            const description = parts[0].trim();
            let calVal = parts[1].replace("cal", "").trim();
            const calories = parseFloat(calVal);
            if (!isNaN(calories)) {
              outEntries.push({ description, calories });
            }
          });
        }
  
        // Build the imported entry
        const newEntry = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          date: dateValue,
          weights,
          inEntries,
          outEntries,
        };
        importedEntries.push(newEntry);
      }
  
      if (importedEntries.length === 0) {
        alert("No valid entries found in CSV.");
        return;
      }
  
      // Merge them into existing localStorage
      let existingEntries = JSON.parse(localStorage.getItem("entries")) || [];
  
      // For each imported entry, do the same merge logic as above
      importedEntries.forEach((imp) => {
        const existingIndex = existingEntries.findIndex((e) => e.date === imp.date);
        if (existingIndex >= 0) {
          // Merge with existing
          let existing = existingEntries[existingIndex];
  
          // Merge weights by label
          mergeByKey(existing.weights, imp.weights, "label");
          // Merge inEntries by description
          mergeByKey(existing.inEntries, imp.inEntries, "description");
          // Merge outEntries by description
          mergeByKey(existing.outEntries, imp.outEntries, "description");
  
          existingEntries[existingIndex] = existing;
        } else {
          // No entry for that date => just add
          existingEntries.push(imp);
        }
      });
  
      localStorage.setItem("entries", JSON.stringify(existingEntries));
      alert(`Imported ${importedEntries.length} entries successfully.`);
      updateHistoryList();
    }
  
    // --- Register Service Worker ---
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("./sw.js")
        .then(function (registration) {
          console.log("Service Worker registered with scope:", registration.scope);
        })
        .catch(function (error) {
          console.log("Service Worker registration failed:", error);
        });
    }
  });
  