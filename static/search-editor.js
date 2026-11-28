(() => {
  const byId = id => document.getElementById(id);
  const dialog=byId("redirect-dialog"),open=byId("new-redirect"),form=byId("redirect-form"),
    status=byId("redirect-editor-status"),signIn=byId("redirect-sign-in"),signOut=byId("redirect-sign-out"),
    save=byId("redirect-save"),key=byId("redirect-key"),href=byId("redirect-href"),comment=byId("redirect-comment"),
    preview=byId("redirect-preview"),commit=byId("redirect-commit");
  const endpoint="/redirect-editor";
  const pattern=/^(?:[a-z0-9]|[_+][a-z0-9])[a-z0-9._-]{0,79}$/i;
  let csrf="",busy=false,uncertain=false;
  const state=message=>{status.textContent=message;};
  function update(){
    const canonical=key.value.toLowerCase(),value=href.value;
    preview.textContent=pattern.test(canonical)?"https://wooten.link/"+encodeURIComponent(canonical):"Enter a shortlink key";
    const duplicate=typeof redirects!=="undefined"&&Object.hasOwn(redirects,canonical);
    key.setCustomValidity(duplicate?"This shortlink already exists.":key.value&&!pattern.test(canonical)?"Invalid shortlink key.":"");
    let valid=false;
    try {
      const url=new URL(value,location.origin);
      valid=(/^https?:\/\//i.test(value)||(value.startsWith("/")&&!value.startsWith("//")&&!/^\/%(?:2f|5c)/i.test(value)))&&
        !/[\s\\<>\u0000-\u001f\u007f]/u.test(value)&&!/%(?![a-f0-9]{2})/i.test(value)&&!url.username&&!url.password;
    } catch {}
    href.setCustomValidity(value&&!valid?"Enter an HTTP(S) URL or root-relative path.":"");
    save.disabled=!csrf||busy||uncertain||!key.value||!href.value||!form.checkValidity();
  }
  function showCommit(sha){
    if(!/^[a-f0-9]{40}$/.test(sha||""))return;
    commit.href="https://github.com/JFWooten4/JFWooten4/commit/"+sha;
    commit.hidden=false;
  }
  async function session(){
    csrf="";form.hidden=true;signIn.hidden=true;signOut.hidden=true;
    state("Checking GitHub authorization…");
    try {
      const response=await fetch(endpoint,{credentials:"same-origin",cache:"no-store"});
      const result=await response.json();
      if(!response.ok){state(result.error||"Redirect editing is unavailable.");signIn.hidden=response.status===503;return;}
      if(!result.authenticated){state("Sign in with GitHub to add a redirect directly to main.");signIn.hidden=false;return;}
      csrf=result.csrf;state("Signed in as "+result.login+". New redirects go directly to main.");
      form.hidden=false;signOut.hidden=false;update();
    } catch {state("Redirect editing is unavailable.");}
  }
  function show(){if(!dialog.open)dialog.showModal();if(!busy&&!uncertain)void session();}
  open.addEventListener("click",show);
  byId("redirect-close").addEventListener("click",()=>{if(!busy)dialog.close();});
  dialog.addEventListener("cancel",event=>{if(busy)event.preventDefault();});
  dialog.addEventListener("close",()=>open.focus());
  form.addEventListener("input",update);
  form.addEventListener("submit",async event=>{
    event.preventDefault();update();
    if(save.disabled||!form.reportValidity())return;
    const input={key:key.value.toLowerCase(),href:href.value,comment:comment.value};
    if(!window.confirm("Save this mapping directly to main?\n\n"+preview.textContent+"\n→ "+input.href+(input.comment?"\nComment: "+input.comment:"")))return;
    busy=true;commit.hidden=true;update();state("Saving through Codex Pony…");
    try{
      const response=await fetch(endpoint+"?action=save",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","X-CSRF-Token":csrf},body:JSON.stringify(input)});
      const result=await response.json();
      if(!response.ok){uncertain=Boolean(result.sha)||response.status>=500;showCommit(result.sha);state(result.error||"Save was not confirmed.");return;}
      if(!/^[a-f0-9]{40}$/.test(result.sha||"")||result.url!=="https://github.com/JFWooten4/JFWooten4/commit/"+result.sha){uncertain=true;state("Save was not confirmed. Check main before retrying.");return;}
      showCommit(result.sha);state("Saved to main. The new shortlink becomes live after deployment.");form.reset();
    } catch {uncertain=true;state("Save outcome unknown. Check main before retrying.");}
    finally{busy=false;update();}
  });
  signOut.addEventListener("click",async()=>{
    if(busy||!csrf)return;
    try{
      const response=await fetch(endpoint+"?action=logout",{method:"POST",credentials:"same-origin",headers:{"X-CSRF-Token":csrf}});
      if(!response.ok)throw Error("Sign-out failed");
      await session();
    } catch {state("Sign-out failed. Refresh and try again.");}
  });
  const params=new URLSearchParams(location.search);
  if(params.has("redirectEditor")){
    const outcome=params.get("redirectEditor");params.delete("redirectEditor");
    history.replaceState(null,"",location.pathname+(params.size?"?"+params:"")+location.hash);
    if(outcome!=="ready")byId("redirect-auth-result").textContent=outcome==="denied"?"GitHub authorization was declined or write access could not be verified.":"Sign-in could not be completed.";
    show();
  }
})();
