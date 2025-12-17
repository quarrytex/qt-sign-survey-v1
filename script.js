(function () {
  const $ = (id) => document.getElementById(id);

  const els = {
    saveStatus: $("saveStatus"),
    errors: $("errors"),
    summary: $("summary"),

    siteName: $("siteName"),
    address: $("address"),
    surveyDate: $("surveyDate"),
    surveyor: $("surveyor"),

    otherTypeWrap: $("otherTypeWrap"),
    otherType: $("otherType"),

    widthIn: $("widthIn"),
    heightIn: $("heightIn"),

    groundBlock: $("groundBlock"),
    wallBlock: $("wallBlock"),
    bottomToGradeIn: $("bottomToGradeIn"),
    postSpacingIn: $("postSpacingIn"),
    mountHeightFt: $("mountHeightFt"),

    mounting: $("mounting"),
    surface: $("surface"),
    surfaceOtherWrap: $("surfaceOtherWrap"),
    surfaceOther: $("surfaceOther"),

    photoWide: $("photoWide"),
    photoStraight: $("photoStraight"),
    photoMount: $("photoMount"),
    thumbWide: $("thumbWide"),
    thumbStraight: $("thumbStraight"),
    thumbMount: $("thumbMount"),

    powerVisibleWrap: $("powerVisibleWrap"),

    notes: $("notes"),

    btnSave: $("btnSave"),
    btnClear: $("btnClear"),
    btnDownload: $("btnDownload"),
    btnCopy: $("btnCopy"),
  };

  const STORAGE_KEY = "qt_sign_survey_v1_latest";

  // --- Init ---
  function nowLocalString() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  }

  els.surveyDate.value = nowLocalString();

  // Restore last saved (excluding photos; browsers do not allow restoring file inputs)
  const saved = safeParse(localStorage.getItem(STORAGE_KEY));
  if (saved) restore(saved);

  bindEvents();
  updateConditionalUI();
  updateSummary();

  // --- Events ---
  function bindEvents() {
    document.addEventListener("change", (e) => {
      const t = e.target;

      if (t.name === "signType") updateConditionalUI();
      if (t.id === "surface") updateConditionalUI();
      if (t.name === "illuminated") updateConditionalUI();

      if (t.classList && t.classList.contains("photo")) updateThumbs();

      // Update summary live as user works
      updateSummary();
      setStatus("Not saved", "muted");
    });

    document.addEventListener("input", () => {
      updateSummary();
      setStatus("Not saved", "muted");
    });

    els.btnSave.addEventListener("click", () => {
      const data = collect();
      const issues = validate(data);

      if (issues.length) {
        showErrors(issues);
        return;
      }

      hideErrors();
      data.savedAt = nowLocalString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
      setStatus("Saved", "ok");
      updateSummary(data);
    });

    els.btnClear.addEventListener("click", () => {
      if (!confirm("Clear all fields?")) return;
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    });

    els.btnDownload.addEventListener("click", () => {
      const data = collect();
      const issues = validate(data, { allowPhotosMissing: true });

      // Allow downloading even if photo missing (sometimes they want to save draft)
      if (issues.length) showErrors(issues);
      else hideErrors();

      data.exportedAt = nowLocalString();
      const filename = makeFilename(data);
      downloadJSON(filename, data);
      setStatus("JSON downloaded", "muted");
    });

    els.btnCopy.addEventListener("click", async () => {
      const text = els.summary.textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        setStatus("Summary copied", "muted");
      } catch {
        // fallback
        prompt("Copy this summary:", text);
      }
    });

    // Photo previews
    els.photoWide.addEventListener("change", updateThumbs);
    els.photoStraight.addEventListener("change", updateThumbs);
    els.photoMount.addEventListener("change", updateThumbs);
  }

  // --- Conditional UI ---
  function getSelectedRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  }

  function updateConditionalUI() {
    const signType = getSelectedRadio("signType");
    const surface = els.surface.value;
    const illuminated = getSelectedRadio("illuminated");

    // Sign type blocks
    els.groundBlock.hidden = signType !== "Ground";
    els.wallBlock.hidden = signType !== "Wall";

    // Other sign type description
    els.otherTypeWrap.hidden = signType !== "Other";

    // Surface other
    els.surfaceOtherWrap.hidden = surface !== "Other";

    // Electrical power visible only if illuminated
    els.powerVisibleWrap.hidden = illuminated !== "Yes";
  }

  // --- Data ---
  function collect() {
    const signType = getSelectedRadio("signType");
    const illuminated = getSelectedRadio("illuminated") || "No";
    const powerVisible = getSelectedRadio("powerVisible") || "No";

    return {
      version: "V1",
      siteName: trim(els.siteName.value),
      address: trim(els.address.value),
      surveyDate: trim(els.surveyDate.value),
      surveyor: trim(els.surveyor.value),

      signType,
      otherType: trim(els.otherType.value),

      widthIn: numOrNull(els.widthIn.value),
      heightIn: numOrNull(els.heightIn.value),

      ground: {
        bottomToGradeIn: numOrNull(els.bottomToGradeIn.value),
        postSpacingIn: numOrNull(els.postSpacingIn.value),
      },

      wall: {
        mountHeightFt: numOrNull(els.mountHeightFt.value),
      },

      mounting: els.mounting.value || "",
      surface: els.surface.value || "",
      surfaceOther: trim(els.surfaceOther.value),

      photos: {
        wide: fileMeta(els.photoWide),
        straight: fileMeta(els.photoStraight),
        mount: fileMeta(els.photoMount),
      },

      electrical: {
        illuminated,
        powerVisible: illuminated === "Yes" ? powerVisible : "N/A",
      },

      notes: trim(els.notes.value),
    };
  }

  function validate(data, opts = {}) {
    const allowPhotosMissing = !!opts.allowPhotosMissing;
    const issues = [];

    if (!data.siteName) issues.push("Site / Business Name is required.");
    if (!data.address) issues.push("Address is required.");
    if (!data.surveyor) issues.push("Surveyor is required.");

    if (!data.signType) issues.push("Select a Sign Type.");
    if (data.signType === "Other" && !data.otherType) issues.push("Please describe the sign type (Other).");

    if (data.widthIn === null || data.widthIn <= 0) issues.push("Width (in) is required and must be > 0.");
    if (data.heightIn === null || data.heightIn <= 0) issues.push("Height (in) is required and must be > 0.");

    if (!data.mounting) issues.push("Mounting is required.");
    if (!data.surface) issues.push("Surface is required.");
    if (data.surface === "Other" && !data.surfaceOther) issues.push("Please describe the surface (Other).");

    // Conditional required measurements
    if (data.signType === "Ground") {
      if (data.ground.bottomToGradeIn === null || data.ground.bottomToGradeIn < 0) {
        issues.push("Ground sign: Bottom to Grade (in) is required.");
      }
      if (data.ground.postSpacingIn === null || data.ground.postSpacingIn < 0) {
        issues.push("Ground sign: Post Spacing (in) is required.");
      }
    }

    if (data.signType === "Wall") {
      if (data.wall.mountHeightFt === null || data.wall.mountHeightFt < 0) {
        issues.push("Wall sign: Mount Height from Ground (ft) is required.");
      }
    }

    // Photos: required in V1 save; optional for JSON download drafts
    if (!allowPhotosMissing) {
      if (!data.photos.wide) issues.push("Photo required: Wide context shot.");
      if (!data.photos.straight) issues.push("Photo required: Straight-on sign location.");
      if (!data.photos.mount) issues.push("Photo required: Mount / surface detail.");
    }

    return issues;
  }

  // --- Summary ---
  function updateSummary(forcedData) {
    const data = forcedData || collect();
    const lines = [];

    lines.push(`SIGN SITE SURVEY — ${data.version}`);
    lines.push(`Date/Time: ${data.surveyDate}`);
    lines.push(`Surveyor: ${data.surveyor || "-"}`);
    lines.push("");
    lines.push(`Site: ${data.siteName || "-"}`);
    lines.push(`Address: ${data.address || "-"}`);
    lines.push("");
    lines.push(`Sign Type: ${data.signType || "-"}` + (data.signType === "Other" ? ` (${data.otherType || "-"})` : ""));
    lines.push("");
    lines.push(`Measurements:`);
    lines.push(`- Width: ${fmtNum(data.widthIn)} in`);
    lines.push(`- Height: ${fmtNum(data.heightIn)} in`);

    if (data.signType === "Ground") {
      lines.push(`- Bottom to grade: ${fmtNum(data.ground.bottomToGradeIn)} in`);
      lines.push(`- Post spacing: ${fmtNum(data.ground.postSpacingIn)} in`);
    }
    if (data.signType === "Wall") {
      lines.push(`- Mount height: ${fmtNum(data.wall.mountHeightFt)} ft`);
    }

    lines.push("");
    lines.push(`Mounting: ${data.mounting || "-"}`);
    lines.push(`Surface: ${data.surface || "-"}` + (data.surface === "Other" ? ` (${data.surfaceOther || "-"})` : ""));
    lines.push("");
    lines.push(`Electrical: Illuminated = ${data.electrical.illuminated}, Power visible = ${data.electrical.powerVisible}`);
    lines.push("");

    lines.push(`Photos (captured on device):`);
    lines.push(`- Wide: ${data.photos.wide ? "Attached" : "Missing"}`);
    lines.push(`- Straight-on: ${data.photos.straight ? "Attached" : "Missing"}`);
    lines.push(`- Mount detail: ${data.photos.mount ? "Attached" : "Missing"}`);

    lines.push("");
    lines.push("Notes:");
    lines.push(data.notes || "-");

    els.summary.textContent = lines.join("\n");
  }

  // --- Thumbnails (previews only; not stored) ---
  function updateThumbs() {
    setThumb(els.photoWide, els.thumbWide);
    setThumb(els.photoStraight, els.thumbStraight);
    setThumb(els.photoMount, els.thumbMount);
  }

  function setThumb(fileInput, thumbDiv) {
    const f = fileInput.files && fileInput.files[0];
    if (!f) {
      thumbDiv.style.backgroundImage = "";
      return;
    }
    const url = URL.createObjectURL(f);
    thumbDiv.style.backgroundImage = `url("${url}")`;
  }

  // --- Restore (last saved) ---
  function restore(data) {
    if (data.siteName) els.siteName.value = data.siteName;
    if (data.address) els.address.value = data.address;
    if (data.surveyor) els.surveyor.value = data.surveyor;

    // Keep current time if missing
    if (data.surveyDate) els.surveyDate.value = data.surveyDate;

    if (data.signType) {
      const r = document.querySelector(`input[name="signType"][value="${cssEscape(data.signType)}"]`);
      if (r) r.checked = true;
    }
    if (data.otherType) els.otherType.value = data.otherType;

    if (data.widthIn !== null && data.widthIn !== undefined) els.widthIn.value = data.widthIn;
    if (data.heightIn !== null && data.heightIn !== undefined) els.heightIn.value = data.heightIn;

    if (data.ground) {
      if (data.ground.bottomToGradeIn !== null && data.ground.bottomToGradeIn !== undefined) els.bottomToGradeIn.value = data.ground.bottomToGradeIn;
      if (data.ground.postSpacingIn !== null && data.ground.postSpacingIn !== undefined) els.postSpacingIn.value = data.ground.postSpacingIn;
    }

    if (data.wall) {
      if (data.wall.mountHeightFt !== null && data.wall.mountHeightFt !== undefined) els.mountHeightFt.value = data.wall.mountHeightFt;
    }

    if (data.mounting) els.mounting.value = data.mounting;
    if (data.surface) els.surface.value = data.surface;
    if (data.surfaceOther) els.surfaceOther.value = data.surfaceOther;

    if (data.electrical && data.electrical.illuminated) {
      const r = document.querySelector(`input[name="illuminated"][value="${cssEscape(data.electrical.illuminated)}"]`);
      if (r) r.checked = true;

      if (data.electrical.powerVisible && data.electrical.powerVisible !== "N/A") {
        const rp = document.querySelector(`input[name="powerVisible"][value="${cssEscape(data.electrical.powerVisible)}"]`);
        if (rp) rp.checked = true;
      }
    }

    if (data.notes) els.notes.value = data.notes;

    setStatus("Saved (restored)", "ok");
  }

  // --- Helpers ---
  function trim(v) { return (v || "").toString().trim(); }
  function numOrNull(v) {
    const s = trim(v);
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  function fmtNum(v) {
    if (v === null || v === undefined) return "-";
    return Number.isFinite(v) ? String(v) : "-";
  }
  function fileMeta(input) {
    const f = input.files && input.files[0];
    if (!f) return null;
    return { name: f.name, size: f.size, type: f.type, lastModified: f.lastModified };
  }
  function safeParse(s) {
    try { return s ? JSON.parse(s) : null; } catch { return null; }
  }
  function showErrors(list) {
    els.errors.hidden = false;
    els.errors.innerHTML = `<strong>Fix these items:</strong><ul>${list.map(li => `<li>${escapeHtml(li)}</li>`).join("")}</ul>`;
    els.errors.scrollIntoView({ behavior: "smooth", block: "start" });
    setStatus("Needs fixes", "danger");
  }
  function hideErrors() {
    els.errors.hidden = true;
    els.errors.innerHTML = "";
  }
  function setStatus(text, kind) {
    els.saveStatus.textContent = text;
    els.saveStatus.style.color = kind === "ok" ? "var(--ok)" : (kind === "danger" ? "var(--danger)" : "var(--muted)");
  }
  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function makeFilename(data) {
    const safe = (s) => (s || "site").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    return `sign-survey_${safe(data.siteName)}_${stamp}.json`;
  }
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  // For safe attribute selectors
  function cssEscape(s) {
    return String(s).replace(/["\\]/g, "\\$&");
  }
})();