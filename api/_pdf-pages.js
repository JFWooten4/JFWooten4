// Shared by the Vercel redirect and the Jekyll fallback.
function isPdfDestination(destination) {
  return /\.pdf$/i.test(destination.split(/[?#]/, 1)[0]);
}

function pdfPageDestination(destination, fragment) {
  if (!isPdfDestination(destination)) {
    return destination;
  }

  const page = /^#0*([1-9]\d*)$/.exec(fragment);
  if (page) {
    return destination.split("#", 1)[0] + "#page=" + page[1];
  }

  // Match HTTP redirect fragment inheritance unless a destination sets its own.
  return destination.includes("#") ? destination : destination + fragment;
}

if (typeof module !== "undefined") {
  module.exports = { isPdfDestination, pdfPageDestination };
}
