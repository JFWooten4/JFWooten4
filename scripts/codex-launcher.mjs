const threadPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function codexDestination(pageUrl) {
  let page;
  try {
    page = new URL(pageUrl);
  } catch {
    return null;
  }
  const match = /^\/codex\/([^/]+)\/?$/.exec(page.pathname);
  if (!match || !threadPattern.test(match[1]) || page.hash) return null;
  if ([...page.searchParams.keys()].some(key => key !== "url")) return null;
  const provided = page.searchParams.getAll("url");
  if (provided.length > 1 || (provided.length === 1 && provided[0].length > 2048)) return null;
  const fallback = `codex://threads/${match[1]}`;
  if (!provided.length) return fallback;
  try {
    const native = new URL(provided[0]);
    if (native.protocol !== "codex:" || native.hostname !== "threads" ||
        native.pathname.toLowerCase() !== `/${match[1].toLowerCase()}` ||
        native.username || native.password || native.port || native.hash) return null;
    return native.href;
  } catch {
    return null;
  }
}

export function initLauncher(pageUrl, dom, launch, closeTab = () => {}) {
  const status = dom.getElementById("status");
  const open = dom.getElementById("open");
  const copy = dom.getElementById("copy");
  const nativeText = dom.getElementById("native");
  const help = dom.getElementById("help");
  const destination = codexDestination(pageUrl);
  if (!destination) {
    status.textContent = "This Codex conversation link is invalid.";
    return false;
  }
  open.href = destination;
  open.hidden = false;
  copy.hidden = false;
  nativeText.textContent = destination;
  nativeText.hidden = false;
  help.hidden = false;
  status.textContent = "Opening Codex Desktop… If nothing happens, use the button below.";
  // Browsers cannot confirm external app launches. Attempt to close only when
  // the page becomes hidden shortly after a native-protocol handoff.
  let handoffAt = 0;
  const armClose = () => { handoffAt = Date.now(); };
  dom.addEventListener?.("visibilitychange", () => {
    if (dom.visibilityState === "hidden" && handoffAt && Date.now() - handoffAt < 15000) {
      handoffAt = 0;
      closeTab();
    }
  });
  open.addEventListener("click", armClose);
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(destination);
      copy.textContent = "Copied";
    } catch {
      copy.textContent = "Select and copy the link below";
    }
  });
  armClose();
  launch(destination);
  return true;
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  initLauncher(window.location.href, document,
    destination => window.location.assign(destination), () => window.close());
}
