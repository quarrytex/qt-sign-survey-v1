const $ = id => document.getElementById(id);
const KEY = "qt_sign_survey_v1_3";

$("btnSave").onclick = () => {
  const data = collect();
  const errors = validate(data);
  if (errors.length) {
    $("errors").innerHTML = errors.join("<br>");
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(data, null, 2));
  $("saveStatus").textContent = "Saved";
};

$("btnDownload").onclick = () => {
  const data = collect();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `sign-survey-${Date.now()}.json`;
  a.click();
};

$("btnClear").onclick = () => {
  if (confirm("Clear survey?")) {
    localStorage.removeItem(KEY);
    location.reload();
  }
};

function collect() {
  return {
    siteName: $("siteName").value.trim(),
    contact: {
      name: $("contactName").value.trim(),
      phone: $("contactPhone").value.trim()
    },
    surveyor: $("surveyor").value.trim(),
    address: {
      street: $("street").value.trim(),
      city: $("city").value.trim(),
      state: $("state").value.trim(),
      zip: $("zip").value.trim()
    },
    season: $("season").value,
    zones: {
      A: $("zoneA").value.trim(),
      B: $("zoneB").value.trim(),
      C: $("zoneC").value.trim()
    },
    measurements: {
      widthIn: $("widthIn").value,
      heightIn: $("heightIn").value
    },
    notes: $("notes").value.trim(),
    timestamp: new Date().toISOString()
  };
}

function validate(d) {
  const e = [];
  if (!d.siteName) e.push("Site name required");
  if (!d.contact.name) e.push("Contact name required");
  if (!d.surveyor) e.push("Surveyor required");
  if (!d.address.street || !d.address.city || !d.address.state || !d.address.zip)
    e.push("Complete address required");
  if (!d.season) e.push("Season condition required");
  if (!d.measurements.widthIn || !d.measurements.heightIn)
    e.push("Measurements required");
  return e;
}