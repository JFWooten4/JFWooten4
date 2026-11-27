const { randomBytes, createHash, createHmac, createCipheriv, createDecipheriv, timingSafeEqual } = require("node:crypto");
const SITE = "https://wooten.link";
const CALLBACK = SITE + "/redirect-editor?action=callback";
const FLOW = "__Host-wooten-redirect-flow", SESSION = "__Host-wooten-redirect-session";
const random = () => randomBytes(32).toString("base64url");
const digest = value => createHash("sha256").update(value).digest("base64url");
function config(env) {
  try {
    const url = new URL(env.WOOTEN_REDIRECT_RUNNER_URL);
    const key = Buffer.from(env.WOOTEN_REDIRECT_SESSION_KEY || "", "base64url");
    if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash || key.length !== 32) return null;
    return { runner: url.origin, key };
  } catch { return null; }
}
function seal(value, key, purpose) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(purpose));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
function unseal(value, key, purpose, now) {
  try {
    if (typeof value !== "string" || value.length > 3500) return null;
    const bytes = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
    decipher.setAAD(Buffer.from(purpose)); decipher.setAuthTag(bytes.subarray(12, 28));
    const data = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]));
    return Number.isFinite(data.expires) && data.expires > now ? data : null;
  } catch { return null; }
}
const cookie = (name, value, age) => name + "=" + value + "; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=" + age;
const readCookie = (req, name) => (req.headers.cookie || "").split(";").map(x => x.trim()).find(x => x.startsWith(name + "="))?.slice(name.length + 1);
const csrfToken = (session, key) => createHmac("sha256", key).update("redirect-csrf:" + session.token).digest("base64url");
function equal(a, b) {
  return typeof a === "string" && typeof b === "string" && Buffer.byteLength(a) === Buffer.byteLength(b) &&
    timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
function validateInput(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(k => !["key","href","comment"].includes(k))) return false;
  const { key, href, comment = "" } = value;
  if (typeof key !== "string" || key.length > 80 || !/^(?:[a-z0-9]|[_+][a-z0-9])[a-z0-9._-]{0,79}$/i.test(key) ||
      typeof href !== "string" || !href || href.length > 2048 || /[\s\\<>\u0000-\u001f\u007f]/u.test(href) || /%(?![a-f0-9]{2})/i.test(href) ||
      typeof comment !== "string" || comment.length > 240 || /[\p{Cc}\p{Zl}\p{Zp}]/u.test(comment)) return false;
  if (!/^https?:\/\//i.test(href) && !(href.startsWith("/") && !href.startsWith("//") && !/^\/%(?:2f|5c)/i.test(href))) return false;
  try { const url = new URL(href, SITE); return ["http:","https:"].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}
function createHandler({ env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  return async (req, res) => {
    res.setHeader("Cache-Control","no-store");
    res.setHeader("Referrer-Policy","no-referrer");
    res.setHeader("X-Content-Type-Options","nosniff");
    const json = (status, body) => res.status(status).json(body);
    const back = result => res.redirect(303, "/search/?redirectEditor=" + result);
    const settings = config(env);
    if (!settings) return json(503,{error:"Redirect editing is not configured."});
    const { runner, key } = settings, action = req.query?.action || "session";
    const session = unseal(readCookie(req,SESSION),key,SESSION,now());
    const clearFlow = cookie(FLOW,"",0), clearSession = cookie(SESSION,"",0);
    const upstream = async (path, options = {}) => {
      const response = await fetchImpl(runner + path, {...options, redirect:"error", signal:AbortSignal.timeout(45000), headers:{Accept:"application/json",...options.headers}});
      return {ok:response.ok,status:response.status,body:await response.json()};
    };
    const auth = token => ({Authorization:"Bearer " + token});
    if (req.method === "GET" && action === "login") {
      try {
        const result = await upstream("/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          client_name:"Wooten Link",redirect_uris:[CALLBACK],token_endpoint_auth_method:"none",grant_types:["authorization_code"],response_types:["code"]
        })});
        if (!result.ok || typeof result.body.client_id !== "string") throw Error("Registration failed");
        const state=random(),verifier=random(),clientId=result.body.client_id;
        res.setHeader("Set-Cookie",cookie(FLOW,seal({state,verifier,clientId,expires:now()+600000},key,FLOW),600));
        const url=new URL("/authorize",runner);
        for(const [name,value] of Object.entries({client_id:clientId,redirect_uri:CALLBACK,response_type:"code",scope:"kefania:read kefania:redirect",state,code_challenge:digest(verifier),code_challenge_method:"S256",resource:runner+"/mcp"})) url.searchParams.set(name,value);
        return res.redirect(303,url.href);
      } catch { return back("unavailable"); }
    }
    if (req.method === "GET" && action === "callback") {
      const flow=unseal(readCookie(req,FLOW),key,FLOW,now());
      res.setHeader("Set-Cookie",clearFlow);
      if (!flow || !equal(req.query.state,flow.state) || req.query.error || typeof req.query.code !== "string" || req.query.code.length > 512) return back("denied");
      try {
        const result=await upstream("/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({
          grant_type:"authorization_code",client_id:flow.clientId,code:req.query.code,code_verifier:flow.verifier,redirect_uri:CALLBACK,resource:runner+"/mcp"
        }).toString()});
        const {access_token:token,expires_in:seconds,scope}=result.body;
        const scopes=String(scope||"").split(" ");
        if (!result.ok || typeof token!=="string" || token.length>1024 || !Number.isFinite(seconds) || seconds<1 || !scopes.includes("kefania:redirect") || scopes.includes("kefania:publish")) throw Error("Token unavailable");
        const eligibility=await upstream("/api/wooten-redirects/session",{headers:auth(token)});
        if(!eligibility.ok || typeof eligibility.body.login!=="string") return back("denied");
        const lifetime=Math.min(900,Math.floor(seconds));
        res.setHeader("Set-Cookie",[clearFlow,cookie(SESSION,seal({token,expires:now()+lifetime*1000},key,SESSION),lifetime)]);
        return back("ready");
      } catch { return back("unavailable"); }
    }
    if(req.method==="GET" && action==="session") {
      if(!session) return json(200,{authenticated:false});
      try {
        const result=await upstream("/api/wooten-redirects/session",{headers:auth(session.token)});
        if(!result.ok || typeof result.body.login!=="string") {
          res.setHeader("Set-Cookie",clearSession);
          return json(403,{error:"GitHub authorization or runner permissions are unavailable. Sign in again."});
        }
        return json(200,{authenticated:true,login:result.body.login,csrf:csrfToken(session,key)});
      } catch { return json(503,{error:"Redirect runner is unavailable."}); }
    }
    if(req.method!=="POST" || !["save","logout"].includes(action)) return json(405,{error:"Unsupported redirect editor operation."});
    if(req.headers.origin!==SITE || !session || !equal(req.headers["x-csrf-token"],csrfToken(session,key))) return json(403,{error:"A valid same-origin session is required. Sign in again."});
    if(action==="logout") {
      res.setHeader("Set-Cookie",clearSession);
      return json(200,{authenticated:false});
    }
    if(!/^application\/json(?:;|$)/i.test(req.headers["content-type"]||"") || Number(req.headers["content-length"]||0)>8192) return json(400,{error:"Invalid redirect payload."});
    let body;
    try {
      body=typeof req.body==="string"?JSON.parse(req.body):req.body;
      if(!validateInput(body) || Buffer.byteLength(JSON.stringify(body))>8192) throw Error("Invalid payload");
    } catch { return json(400,{error:"Invalid redirect fields."}); }
    try {
      const result=await upstream("/api/wooten-redirects",{method:"POST",headers:{...auth(session.token),"Content-Type":"application/json"},body:JSON.stringify({key:body.key,href:body.href,comment:body.comment||""})});
      const sha=result.body.sha,validSha=typeof sha==="string"&&/^[a-f0-9]{40}$/.test(sha);
      if(!result.ok) return json(result.status>=400&&result.status<500?result.status:502,{error:typeof result.body.error==="string"?result.body.error.slice(0,300):"Redirect save was not confirmed.",...(validSha?{sha}:{})});
      const url="https://github.com/JFWooten4/JFWooten4/commit/"+sha;
      if(!validSha||result.body.url!==url||result.body.key!==body.key.toLowerCase()) return json(502,{error:"Runner did not return a verified commit. Check main before retrying."});
      return json(200,{key:result.body.key,sha,url});
    } catch { return json(502,{error:"Save outcome unknown. Check main before retrying."}); }
  };
}
module.exports=createHandler();
Object.assign(module.exports,{createHandler,validateInput,seal,unseal,csrfToken});
