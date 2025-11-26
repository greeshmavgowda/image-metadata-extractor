document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const loading = document.getElementById("loading");

  if (!fileInput.files.length) return alert("Please select a file!");

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  loading.classList.remove("hidden");

  try {
    const response = await fetch("/api/extract", {
      method: "POST",
      body: formData
    });

    const { metadata } = await response.json();

    console.log(metadata); // Optional: inspect raw metadata

    renderSummary(metadata);
    renderDetails(metadata);
  } catch (error) {
    console.error("Error extracting metadata:", error);
    alert("Failed to extract metadata. Check console for details.");
  } finally {
    loading.classList.add("hidden");
  }
});

// Robust date/field formatter
function formatDateField(value) {
  if (!value) return "-";

  // If it's an ExifDateTime object
  if (typeof value === "object" && value._ctor === "ExifDateTime") {
    // Construct a JS Date from the fields
    const { year, month, day, hour, minute, second, tzoffsetMinutes } = value;
    // Month in JS Date is 0-based
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    // Adjust for timezone offset
    const offsetMs = (tzoffsetMinutes || 0) * 60 * 1000;
    const localDate = new Date(date.getTime() + offsetMs);
    return localDate.toLocaleString(); // readable local string
  }

  // If it's a normal JS Date
  if (value instanceof Date) return value.toLocaleString();

  // If it's a string like "YYYY:MM:DD HH:MM:SS"
  if (typeof value === "string") return value.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");

  // If it's a nested object (other cases)
  if (typeof value === "object") {
    if ("value" in value) return formatDateField(value.value);
    if ("_" in value) return formatDateField(value._);
    if ("Description" in value) return formatDateField(value.Description);
    return JSON.stringify(value);
  }

  return String(value);
}


// Render summary card
function renderSummary(data) {
  const container = document.getElementById("summary");
  container.classList.remove("hidden");

  container.innerHTML = `
    <div class="card">
      <div class="section-title">Summary</div>
      <div class="data-grid">
        <div>Camera</div><div>${data.Make ?? "-"} ${data.Model ?? ""}</div>
        <div>Lens</div><div>${data.LensModel ?? "-"}</div>
        <div>Date Taken</div><div>${formatDateField(data.DateTimeOriginal)}</div>
        <div>Resolution</div><div>${data.ImageWidth ?? "-"} x ${data.ImageHeight ?? "-"}</div>
        <div>ISO</div><div>${data.ISO ?? "-"}</div>
        <div>Aperture</div><div>${data.Aperture ?? "-"}</div>
        <div>Shutter</div><div>${data.ShutterSpeed ?? "-"}</div>
        <div>Shutter Count</div><div>${data.ShutterCount ?? "-"}</div>
      </div>
    </div>
  `;
}

// Render detailed metadata cards
function renderDetails(data) {
  const container = document.getElementById("detailedSections");
  container.classList.remove("hidden");

  const groups = {
    "Camera Information": [
      "Make", "Model", "Lens Model", "Software", "Firmware Version"
    ],
    "Exposure Settings": [
      "ISO", "Aperture", "Shutter Speed", "Focal Length", "Exposure Mode", "White Balance"
    ],
    "Temperature & Hardware": [
      "Shutter Count", "Ambient Temperature", "Battery Level"
    ],
    "Time & Dates": [
      "Date Time Original", "Create Date", "Modify Date"
    ]
  };

  container.innerHTML = "";

  Object.entries(groups).forEach(([title, keys]) => {
    const section = document.createElement("div");
    section.className = "card";

    let html = `<div class="section-title">${title}</div><div class="data-grid">`;

    keys.forEach(key => {
      html += `
        <div>${key}</div>
        <div>${formatDateField(data[key])}</div>
      `;
    });

    html += "</div>";
    section.innerHTML = html;
    container.appendChild(section);
  });
}
