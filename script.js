(() => {
  const $ = id => document.getElementById(id);
  const els = {
    siteName:$("siteName"), address:$("address"),
    contactName:$("contactName"), contactPhone:$("contactPhone"),
    surveyDate:$("surveyDate"), surveyor:$("surveyor"),
    otherTypeWrap:$("otherTypeWrap"), otherType:$("otherType"),
    widthIn:$("widthIn"), heightIn:$("heightIn"),
    groundBlock:$("groundBlock"), wallBlock:$("wallBlock"),
    bottomToGradeIn:$("bottomToGradeIn"), postSpacingIn:$("postSpacingIn"),
    mountHeightFt:$("mountHeightFt"),
    mounting:$("mounting"), surface:$("surface"),
    surfaceOtherWrap:$("surfaceOtherWrap"), surfaceOther:$("surfaceOther"),
    photoWide:$("photoWide"), photoStraight:$("photoStraight"), photoMount:$("photoMount"),
    thumbWide:$("thumbWide"), thumbStraight:$("thumbStraight"), thumbMount:$("thumbMount"),
    powerVisibleWrap:$("powerVisibleWrap"),
    notes:$("notes"),
    btnSave:$("btnSave"), btnClear:$("btnClear"), btnDownload:$("btnDownload"),
    errors:$("errors"), summary:$("summary"), saveStatus:$("saveStatus")
  };
  const KEY="qt_sign_survey_v1_1";

  const now=()=>new Date().toLocaleString();
  els.surveyDate.value=now();

  const radio = name => (document.querySelector(`input[name="${name}"]:checked`)||{}).value||"";

  const updateUI=()=>{
    const st=radio("signType");
    els.groundBlock.hidden=st!=="Ground";
    els.wallBlock.hidden=st!=="Wall";
    els.otherTypeWrap.hidden=st!=="Other";
    els.surfaceOtherWrap.hidden=els.surface.value!=="Other";
    els.powerVisibleWrap.hidden=radio("illuminated")!=="Yes";
  };

  const fileMeta=i=>i.files[0]?{name:i.files[0].name,size:i.files[0].size,type:i.files[0].type}:null;

  const collect=()=>({
    version:"V1.1",
    siteName:els.siteName.value.trim(),
    address:els.address.value.trim(),
    contact:{ name:els.contactName.value.trim(), phone:els.contactPhone.value.trim() },
    surveyDate:els.surveyDate.value,
    surveyor:els.surveyor.value.trim(),
    signType:radio("signType"), otherType:els.otherType.value.trim(),
    widthIn:+els.widthIn.value||null, heightIn:+els.heightIn.value||null,
    ground:{ bottomToGradeIn:+els.bottomToGradeIn.value||null, postSpacingIn:+els.postSpacingIn.value||null },
    wall:{ mountHeightFt:+els.mountHeightFt.value||null },
    mounting:els.mounting.value, surface:els.surface.value, surfaceOther:els.surfaceOther.value.trim(),
    photos:{ wide:fileMeta(els.photoWide), straight:fileMeta(els.photoStraight), mount:fileMeta(els.photoMount) },
    electrical:{ illuminated:radio("illuminated"), powerVisible:radio("powerVisible")||"N/A" },
    notes:els.notes.value.trim()
  });

  const validate=d=>{
    const e=[];
    if(!d.siteName) e.push("Site / Business Name is required.");
    if(!d.address) e.push("Address is required.");
    if(!d.contact.name) e.push("On-site Contact Name is required.");
    if(!d.surveyor) e.push("Surveyor is required.");
    if(!d.signType) e.push("Select a Sign Type.");
    if(!d.widthIn||!d.heightIn) e.push("Width and Height are required.");
    if(d.signType==="Ground" && (!d.ground.bottomToGradeIn||!d.ground.postSpacingIn))
      e.push("Ground sign measurements required.");
    if(d.signType==="Wall" && !d.wall.mountHeightFt)
      e.push("Wall mount height required.");
    if(!d.photos.wide||!d.photos.straight||!d.photos.mount)
      e.push("Three photos are required.");
    return e;
  };

  const summary=d=>{
    els.summary.textContent=
`SIGN SITE SURVEY — ${d.version}
Date: ${d.surveyDate}
Site: ${d.siteName}
Address: ${d.address}

Contact: ${d.contact.name}
Phone: ${d.contact.phone||"-"}

Type: ${d.signType}${d.otherType?` (${d.otherType})`:""}
Size: ${d.widthIn} in × ${d.heightIn} in

Mounting: ${d.mounting}
Surface: ${d.surface}${d.surfaceOther?` (${d.surfaceOther})`:""}

Electrical: ${d.electrical.illuminated}

Notes:
${d.notes||"-"}`;
  };

  const thumb=(i,t)=>{ if(!i.files[0]){t.style.backgroundImage="";return;}
    t.style.backgroundImage=`url(${URL.createObjectURL(i.files[0])})`; };

  document.addEventListener("change",()=>{
    updateUI();
    thumb(els.photoWide,els.thumbWide);
    thumb(els.photoStraight,els.thumbStraight);
    thumb(els.photoMount,els.thumbMount);
    els.saveStatus.textContent="Not saved";
  });

  els.btnSave.onclick=()=>{
    const d=collect(), errs=validate(d);
    if(errs.length){
      els.errors.hidden=false;
      els.errors.innerHTML="<ul>"+errs.map(x=>`<li>${x}</li>`).join("")+"</ul>";
      return;
    }
    els.errors.hidden=true;
    localStorage.setItem(KEY,JSON.stringify(d,null,2));
    summary(d);
    els.saveStatus.textContent="Saved";
  };

  els.btnDownload.onclick=()=>{
    const d=collect();
    const blob=new Blob([JSON.stringify(d,null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`sign-survey_${Date.now()}.json`;
    a.click();
  };

  els.btnClear.onclick=()=>{
    if(confirm("Clear this survey?")){ localStorage.removeItem(KEY); location.reload(); }
  };

  updateUI();
})();