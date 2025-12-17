(() => {
  const $ = (id) => document.getElementById(id);
  const KEY = "qt_sign_survey_v1_4";

  const els = {
    saveStatus: $("saveStatus"),
    errors: $("errors"),
    summary: $("summary"),

    siteName: $("siteName"),
    contactName: $("contactName"),
    contactPhone: $("contactPhone"),
    surveyor: $("surveyor"),

    street: $("street"),
    city: $("city"),
    state: $("state"),
    zip: $("zip"),

    season: $("season"),
    permitStatus: $("permitStatus"),
    permitDetails: $("permitDetails"),
    municipality: $("municipality"),
    permitNumber: $("permitNumber"),
    permitNotes: $("permitNotes"),

    zoneA: $("zoneA"),
    zoneB: $("zoneB"),
    zoneC: $("zoneC"),

    widthIn: $("widthIn"),
    heightIn: $("heightIn"),

    photo1: $("photo1"),
    photo2: $("photo2"),
    photo3: $("photo3"),

    notes: $("notes"),

    btnSave: $("btnSave"),
    btnDownload: $("btnDownload"),
    btnClear: $("btnClear")
  };

  const fileMeta = (input) => {
    const f = input.files && input.files[0];
    if (!f) return null;
    return { name: f.name, size: f.size, type: f.type, lastModified: f.lastModified };
  };

  const collect = () => {
    const permitStatus = els.permitStatus.value;

    return {
      version: "V1.4",
      timestamp: new Date().toISOString(),

      siteName: els.siteName.value.trim(),
      contact: {
        name: els.contactName.value.trim(),
        phone: els.contactPhone.value.trim()
      },
      surveyor: els.surveyor.value.trim(),

      address: {
        street: els.street.value.trim(),
        city: els.city.value.trim(),
        state: els.state.value.trim().toUpperCase(),
        zip: els.zip.value.trim()
      },

      conditions: {
        season: els.season.value,
        permitStatus: permitStatus,
        permitDetails: permitStatus === "Yes" ? {
          municipality: els.municipality.value.trim(),
          permitNumber: els.permitNumber.value.trim(),
          permitNotes: els.permitNotes.value.trim()
        } : null
      },

      zones: {
        A: els.zoneA.value.trim(),
        B: els.zoneB.value.trim(),
        C: els.zoneC.value.trim()
      },

      measurements: {
        widthIn: els.widthIn.value ? Number(els.widthIn.value) : null,
        heightIn: els.heightIn.value ? Number(els.heightIn.value) : null
      },

      photos: {
        wide: fileMeta(els.photo1),
        straight: fileMeta(els.photo2),
        mount: fileMeta(els.photo3)
      },

      notes: els.notes.value.trim()
    };
  };

  const validate = (d) => {
    const e = [];

    if (!d.siteName) e.push("Site / Business Name is required.");
    if (!d.contact.name) e.push("On-site Contact Name is required.");
    if (!d.surveyor) e.push("Surveyor is required.");

    if (!d.address.street || !d.address.city || !d.address.state || !d.address.zip) {
      e.push("Complete address is required (Street, City, State, ZIP).");
    }

    if (!d.conditions.season) e.push("Season Conditions is required.");
    if (!d.conditions.permitStatus) e.push("Permit Status is required (Unknown / No / Yes).");

    if (!d.measurements.widthIn || d.measurements.widthIn <= 0) e.push("Width must be > 0.");
    if (!d.measurements.heightIn || d.measurements.heightIn <= 0) e.push("Height must be > 0.");

    if (!d.photos.wide || !d.photos.straight || !d.photos.mount) {
      e.push("Three photos are required (Wide, Straight-on, Mount detail).");
    }

    return e;
  };

  const renderErrors = (errs) => {
    if (!errs.length) {
      els.errors.hidden = true;
      els.errors.innerHTML = "";
      return;
    }
    els.errors.hidden = false;
    els.errors.innerHTML = "<strong>Fix these items:</strong><ul>" +
      errs.map(x => `<li>${escapeHtml(x)}</li>`).join("") +
      "</ul>";
  };

  const renderSummary = (d) => {
    const a = d.address;
    const permit = d.conditions.permitStatus;

    els.summary.textContent =
`SIGN SITE SURVEY — ${d.version}
Timestamp: ${d.timestamp}

Site: ${d.siteName}
Contact: ${d.contact.name}  ${d.contact.phone ? " | " + d.contact.phone : ""}
Surveyor: ${d.surveyor}

Address:
${a.street}
${a.city}, ${a.state} ${a.zip}

Season Conditions: ${d.conditions.season}
Permit Status: ${permit}${permit === "Yes" ? `
Municipality: ${d.conditions.permitDetails.municipality || "-"}
Permit #: ${d.conditions.permitDetails.permitNumber || "-"}
Permit Notes: ${d.conditions.permitDetails.permitNotes || "-"}` : ""}

Zones:
A: ${d.zones.A || "-"}
B: ${d.zones.B || "-"}
C: ${d.zones.C || "-"}

Measurements:
Width: ${d.measurements.widthIn} in
Height: ${d.measurements.heightIn} in

Photos:
Wide: ${d.photos.wide ? "Attached" : "Missing"}
Straight-on: ${d.photos.straight ? "Attached" : "Missing"}
Mount detail: ${d.photos.mount ? "Attached" : "Missing"}

Notes:
${d.notes || "-"}`;
  };

  const updatePermitUI = () => {
    const v = els.permitStatus.value;
    els.permitDetails.hidden = (v !== "Yes");
  };

  const escapeHtml = (s) => String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  // Events
  els.permitStatus.addEventListener("change", () => {
    updatePermitUI();
    els.saveStatus.textContent = "Not saved";
  });

  document.addEventListener("input", () => {
    els.saveStatus.textContent = "Not saved";
  });

  document.addEventListener("change", () => {
    els.saveStatus.textContent = "Not saved";
  });

  els.btnSave.addEventListener("click", () => {
    const data = collect();
    const errs = validate(data);
    renderErrors(errs);

    if (errs.length) return;

    localStorage.setItem(KEY, JSON.stringify(data, null, 2));
    renderSummary(data);
    els.saveStatus.textContent = "Saved";
  });

  els.btnDownload.addEventListener("click", () => {
    const data = collect();
    // allow download even if incomplete
    renderSummary(data);

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sign-survey_${Date.now()}.json`;
    a.click();
  });

  els.btnClear.addEventListener("click", () => {
    if (!confirm("Clear this survey?")) return;
    localStorage.removeItem(KEY);
    location.reload();
  });

  // Init
  updatePermitUI();

  // Restore latest (optional convenience)
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const d = JSON.parse(saved);
      // Minimal restore for core text fields
      els.siteName.value = d.siteName || "";
      els.contactName.value = d.contact?.name || "";
      els.contactPhone.value = d.contact?.phone || "";
      els.surveyor.value = d.surveyor || "";

      els.street.value = d.address?.street || "";
      els.city.value = d.address?.city || "";
      els.state.value = d.address?.state || "";
      els.zip.value = d.address?.zip || "";

      els.season.value = d.conditions?.season || "";
      els.permitStatus.value = d.conditions?.permitStatus || "";
      updatePermitUI();
      if (d.conditions?.permitDetails) {
        els.municipality.value = d.conditions.permitDetails.municipality || "";
        els.permitNumber.value = d.conditions.permitDetails.permitNumber || "";
        els.permitNotes.value = d.conditions.permitDetails.permitNotes || "";
      }

      els.zoneA.value = d.zones?.A || "";
      els.zoneB.value = d.zones?.B || "";
      els.zoneC.value = d.zones?.C || "";

      els.widthIn.value = d.measurements?.widthIn ?? "";
      els.heightIn.value = d.measurements?.heightIn ?? "";

      els.notes.value = d.notes || "";

      renderSummary(d);
      els.saveStatus.textContent = "Saved (restored)";
    }
  } catch {
    // ignore restore errors
  }
})();