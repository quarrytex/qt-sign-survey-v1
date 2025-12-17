(() => {
  const $ = id => document.getElementById(id);
  const KEY = "qt_sign_survey_v1_5";

  const els = {
    saveStatus:$("saveStatus"), errors:$("errors"), summary:$("summary"),
    siteName:$("siteName"), contactName:$("contactName"), contactPhone:$("contactPhone"),
    surveyor:$("surveyor"),
    street:$("street"), city:$("city"), state:$("state"), zip:$("zip"),
    season:$("season"), permitStatus:$("permitStatus"), permitDetails:$("permitDetails"),
    municipality:$("municipality"), permitNumber:$("permitNumber"), permitNotes:$("permitNotes"),
    zoneA:$("zoneA"), zoneB:$("zoneB"), zoneC:$("zoneC"),
    widthIn:$("widthIn"), heightIn:$("heightIn"),
    photo1:$("photo1"), photo2:$("photo2"), photo3:$("photo3"),
    notes:$("notes"),
    btnSave:$("btnSave"), btnEmail:$("btnEmail"), btnDownload:$("btnDownload"), btnClear:$("btnClear")
  };

  const fileMeta = i => (i.files && i.files[0]) ? {name:i.files[0].name} : null;

  const collect = () => ({
    version:"V1.5",
    timestamp:new Date().toISOString(),
    siteName:els.siteName.value.trim(),
    contact:{name:els.contactName.value.trim(), phone:els.contactPhone.value.trim()},
    surveyor:els.surveyor.value.trim(),
    address:{street:els.street.value.trim(), city:els.city.value.trim(),
             state:els.state.value.trim().toUpperCase(), zip:els.zip.value.trim()},
    conditions:{
      season:els.season.value,
      permitStatus:els.permitStatus.value,
      permitDetails:els.permitStatus.value==="Yes" ? {
        municipality:els.municipality.value.trim(),
        permitNumber:els.permitNumber.value.trim(),
        permitNotes:els.permitNotes.value.trim()
      } : null
    },
    zones:{A:els.zoneA.value.trim(), B:els.zoneB.value.trim(), C:els.zoneC.value.trim()},
    measurements:{widthIn:+els.widthIn.value||null, heightIn:+els.heightIn.value||null},
    photos:{wide:fileMeta(els.photo1), straight:fileMeta(els.photo2), mount:fileMeta(els.photo3)},
    notes:els.notes.value.trim()
  });

  const validate = d => {
    const e=[];
    if(!d.siteName) e.push("Site name required.");
    if(!d.contact.name) e.push("Contact name required.");
    if(!d.surveyor) e.push("Surveyor required.");
    if(!d.address.street||!d.address.city||!d.address.state||!d.address.zip)
      e.push("Complete address required.");
    if(!d.conditions.season) e.push("Season required.");
    if(!d.conditions.permitStatus) e.push("Permit status required.");
    if(!d.measurements.widthIn||!d.measurements.heightIn) e.push("Measurements required.");
    if(!d.photos.wide||!d.photos.straight||!d.photos.mount) e.push("Three photos required.");
    return e;
  };

  const renderErrors = errs => {
    els.errors.hidden = !errs.length;
    els.errors.innerHTML = errs.length
      ? "<strong>Fix these:</strong><ul>"+errs.map(x=>`<li>${x}</li>`).join("")+"</ul>"
      : "";
  };

  const renderSummary = d => {
    const a=d.address, p=d.conditions;
    els.summary.textContent =
`SIGN SITE SURVEY — ${d.version}
${new Date(d.timestamp).toLocaleString()}

Site: ${d.siteName}
Contact: ${d.contact.name}${d.contact.phone ? " | "+d.contact.phone : ""}
Surveyor: ${d.surveyor}

Address:
${a.street}
${a.city}, ${a.state} ${a.zip}

Season: ${p.season}
Permit: ${p.permitStatus}${p.permitStatus==="Yes" ? `
Municipality: ${p.permitDetails.municipality||"-"}
Permit #: ${p.permitDetails.permitNumber||"-"}
Notes: ${p.permitDetails.permitNotes||"-"}` : ""}

Zones: A=${d.zones.A||"-"}  B=${d.zones.B||"-"}  C=${d.zones.C||"-"}

Measurements: ${d.measurements.widthIn} in × ${d.measurements.heightIn} in

Notes:
${d.notes||"-"}`;
  };

  const updatePermitUI = () => {
    els.permitDetails.hidden = els.permitStatus.value !== "Yes";
  };

  const emailSummary = () => {
    const d = collect();
    renderSummary(d);
    const subject = encodeURIComponent(`Sign Survey — ${d.siteName}`);
    const body = encodeURIComponent(els.summary.textContent);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  els.permitStatus.addEventListener("change", updatePermitUI);

  els.btnSave.onclick = () => {
    const d=collect(), errs=validate(d);
    renderErrors(errs);
    if(errs.length) return;
    localStorage.setItem(KEY, JSON.stringify(d,null,2));
    renderSummary(d);
    els.saveStatus.textContent="Saved";
  };

  els.btnEmail.onclick = () => emailSummary();

  els.btnDownload.onclick = () => {
    const d=collect();
    renderSummary(d);
    const blob=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`sign-survey_${Date.now()}.json`;
    a.click();
  };

  els.btnClear.onclick = () => {
    if(confirm("Clear this survey?")){ localStorage.removeItem(KEY); location.reload(); }
  };

  updatePermitUI();
})();