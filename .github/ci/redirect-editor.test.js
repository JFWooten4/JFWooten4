const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const {createHandler,validateInput,seal,unseal,csrfToken}=require("../../api/redirect-edit");
const key=Buffer.alloc(32,7),name="__Host-wooten-redirect-session";
const env={WOOTEN_REDIRECT_RUNNER_URL:"https://runner.example",WOOTEN_REDIRECT_SESSION_KEY:key.toString("base64url")};
const session={token:"opaque",expires:10000},now=()=>1000;
const req=(method,action,extra={})=>({method,query:{action},headers:{},...extra});
async function call(handler,request){
  const out={headers:{}};
  await handler(request,{setHeader(n,v){out.headers[n]=v;},status(v){out.status=v;return this;},json(v){out.body=v;},redirect(v,d){out.status=v;out.location=d;}});
  return out;
}
const response=(body,status=200)=>({status,ok:status<400,json:async()=>body});
const headers=()=>({cookie:name+"="+seal(session,key,name),origin:"https://wooten.link","x-csrf-token":csrfToken(session,key),"content-type":"application/json"});
test("fails closed without configuration, origin, session, or CSRF",async()=>{
  const fetchImpl=()=>assert.fail("Unauthorized request reached runner");
  assert.equal((await call(createHandler({env:{},fetchImpl,now}),req("GET","session"))).status,503);
  const handler=createHandler({env,fetchImpl,now});
  assert.deepEqual((await call(handler,req("GET","session"))).body,{authenticated:false});
  assert.equal((await call(handler,req("POST","save"))).status,403);
  assert.equal((await call(handler,req("POST","save",{headers:{...headers(),origin:"https://evil.example"}}))).status,403);
  assert.equal((await call(handler,req("POST","save",{headers:{...headers(),"x-csrf-token":"forged"}}))).status,403);
});
test("cookies authenticate their purpose and expiry",()=>{
  const token=seal(session,key,name);
  assert.deepEqual(unseal(token,key,name,1000),session);
  assert.equal(unseal(token,key,"wrong",1000),null);
  assert.equal(unseal(token,key,name,10000),null);
  assert.equal(unseal(token.slice(0,-4)+"aaaa",key,name,1000),null);
});
test("save forwards only allowed fields and returns verified commit link",async()=>{
  const sha="a".repeat(40),url="https://github.com/JFWooten4/JFWooten4/commit/"+sha;
  let calls=0;
  const handler=createHandler({env,now,fetchImpl:async(path,options)=>{
    calls++;
    assert.equal(path,"https://runner.example/api/wooten-redirects");
    assert.equal(options.headers.Authorization,"Bearer opaque");
    assert.deepEqual(JSON.parse(options.body),{key:"+12",href:"/ref/a.pdf",comment:""});
    return response({key:"+12",sha,url});
  }});
  assert.equal((await call(handler,req("POST","save",{headers:headers(),body:{key:"+12",href:"/ref/a.pdf",author:"forged"}}))).status,400);
  assert.equal((await call(handler,req("POST","save",{headers:headers(),body:{key:"+12",href:"/ref/a.pdf"}}))).body.url,url);
  assert.equal(calls,1);
});
test("validates destinations and keeps editor separate from existing search",()=>{
  assert.ok(validateInput({key:"_12",href:"https://example.com/a%20b"}));
  for(const href of ["javascript:alert(1)","//evil.example","https://user:pw@example.com","https://example.com/%ZZ","/%2fexample.com"])assert.equal(validateInput({key:"new",href}),false);
  const page=fs.readFileSync("static/search.html","utf8");
  assert.match(page,/id="new-redirect"/);
  assert.match(page,/id="redirect-dialog" aria-labelledby=/);
  assert.match(page,/src="\/search-editor\.js" defer/);
  assert.doesNotThrow(()=>new vm.Script(fs.readFileSync("static/search-editor.js","utf8")));
  assert.doesNotThrow(()=>new vm.Script(page.match(/<script>([\s\S]*?)<\/script>/)[1]));
});
