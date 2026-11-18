const test = require("node:test");
const assert = require("node:assert/strict");
const { createHandler, normalizeReview, publishedReviews } = require("../api/reviews");

function response() {
  return {
    statusCode: 200, headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    end(body) { this.body = JSON.parse(body); },
  };
}

const env = {
  REVIEW_GITHUB_REPO: "example/private-reviews",
  REVIEW_GITHUB_TOKEN: "local-test-only",
  TURNSTILE_SITE_KEY: "public-key",
  TURNSTILE_SECRET_KEY: "private-key",
  REVIEW_HOSTNAME: "wooten.link",
};
const labels = [{name:"book-review"}, {name:"book-review-approved"}];

test("validates review text and optional rating", () => {
  assert.deepEqual(normalizeReview({review:"A useful and thoughtfully written resource",rating:"4"}), {
    name:"Anonymous reader", rating:4, review:"A useful and thoughtfully written resource",
  });
  assert.equal(normalizeReview({review:"Too short",rating:5}),null);
  assert.equal(normalizeReview({review:"A useful and thoughtfully written resource",rating:6}),null);
});

test("publishes only approved review issues with the expected schema", () => {
  const issue=(n,extra={})=>({
    number:n,created_at:"2026-10-14T10:00:00Z",labels,body:JSON.stringify({
      schema:"book-review-v1",name:"Reader",rating:5,review:"An informative and useful book worth reading."
    }),...extra
  });
  assert.deepEqual(publishedReviews([
    issue(1),issue(2,{labels:[{name:"book-review"}]}),
    issue(3,{pull_request:{url:"pr"}}),
    issue(4,{body:"not JSON"}),
    issue(5,{body:JSON.stringify({schema:"unknown",review:"This review should not be published."})}),
  ]),[{id:1,name:"Reader",rating:5,review:"An informative and useful book worth reading.",date:"2026-10-14"}]);
});

test("GET returns only approved reader reviews and a public site key", async () => {
  let calls=0;
  const fetchImpl=async (url) => {
    calls++;
    assert.match(url,/labels=book-review%2Cbook-review-approved/);
    return {ok:true,json:async()=>[{number:12,created_at:"2026-10-14",labels,body:JSON.stringify({
      schema:"book-review-v1",name:"Reader",rating:null,review:"Detailed and interesting reading for beginners."
    })}]};
  };
  const res=response();
  await createHandler({env,fetchImpl})({method:"GET"},res);
  assert.equal(calls,1);
  assert.equal(res.statusCode,200);
  assert.equal(res.body.reviews[0].id,12);
  assert.equal(res.body.siteKey,"public-key");
  assert.equal(res.body.submissionsEnabled,true);
  assert.ok(!JSON.stringify(res.body).includes("private-key"));
});

test("POST verifies Turnstile hostname and sends a pending issue", async () => {
  const calls=[];
  const fetchImpl=async (url,options) => {
    calls.push({url,options});
    if (url.includes("turnstile")) return {ok:true,json:async()=>({success:true,hostname:"wooten.link"})};
    return {ok:true,status:201,json:async()=>({number:23})};
  };
  const res=response();
  await createHandler({env,fetchImpl})({
    method:"POST",headers:{"content-type":"application/json"},
    body:{name:"Reader",rating:"3",review:"An interesting independent view of financial markets.",captcha:"challenge"},
  },res);
  assert.equal(res.statusCode,201);
  const sent=JSON.parse(calls[1].options.body);
  assert.deepEqual(sent.labels,["book-review"]);
  assert.equal(JSON.parse(sent.body).rating,3);
  assert.ok(!sent.labels.includes("book-review-approved"));
  assert.equal(calls[0].options.body.get("secret"),"private-key");
});

test("POST rejects invalid captcha or a foreign Turnstile hostname", async () => {
  let issueWrites=0;
  const fetchImpl=async (url) => {
    if (url.includes("turnstile")) return {ok:true,json:async()=>({success:true,hostname:"elsewhere.test"})};
    issueWrites++;
    return {ok:true};
  };
  const res=response();
  await createHandler({env,fetchImpl})({
    method:"POST",headers:{"content-type":"application/json"},
    body:{name:"Reader",rating:"5",review:"A compelling introduction to the financial markets.",captcha:"token"},
  },res);
  assert.equal(res.statusCode,400);
  assert.equal(issueWrites,0);
});

test("POST never opens an issue for an invalid review", async () => {
  let calls=0;
  const fetchImpl=async ()=>{ calls++; throw new Error("should not call"); };
  const res=response();
  await createHandler({env,fetchImpl})({
    method:"POST",headers:{"content-type":"application/json"},
    body:{review:"short",rating:8,captcha:"token"},
  },res);
  assert.equal(res.statusCode,400);
  assert.equal(calls,0);
});

test("unconfigured submissions cannot be accepted", async () => {
  const res=response();
  await createHandler({env:{},fetchImpl:()=>{throw Error("should not fetch")}})({
    method:"POST",headers:{"content-type":"application/json"},body:{}
  },res);
  assert.equal(res.statusCode,503);
});
