#!/usr/bin/env python3
import json
import os
import sys
import urllib.request


API_URL = "https://api.github.com/graphql"
OUTPUT_PATH = os.path.join("var", "sponsors.json")
QUERY = """
query($login: String!) {
  user(login: $login) {
    sponsorshipsAsMaintainer(first: 100, activeOnly: true, includePrivate: false) {
      nodes {
        sponsorEntity {
          __typename
          ... on User {
            login
            name
            url
            avatarUrl(size: 96)
          }
          ... on Organization {
            login
            name
            url
            avatarUrl(size: 96)
          }
        }
      }
    }
  }
}
""".strip()


def main() -> int:
  token = os.environ.get("SPONSORS_GH_TOKEN")
  login = os.environ.get("SPONSORS_LOGIN", "JFWooten4")

  if not token:
    print("SPONSORS_GH_TOKEN is required", file=sys.stderr)
    return 1

  payload = json.dumps({
    "query": QUERY,
    "variables": {"login": login},
  }).encode("utf-8")

  request = urllib.request.Request(
    API_URL,
    data=payload,
    headers={
      "Authorization": f"bearer {token}",
      "Content-Type": "application/json",
      "User-Agent": "jfwooten4-sponsors-updater",
    },
    method="POST",
  )

  with urllib.request.urlopen(request) as response:
    body = json.loads(response.read().decode("utf-8"))

  if "errors" in body:
    print(json.dumps(body["errors"], indent=2), file=sys.stderr)
    return 1

  nodes = body["data"]["user"]["sponsorshipsAsMaintainer"]["nodes"]
  sponsors = []

  for node in nodes:
    entity = node.get("sponsorEntity")
    if not entity:
      continue
    sponsors.append({
      "login": entity["login"],
      "name": entity.get("name"),
      "url": entity["url"],
      "avatar_url": entity["avatarUrl"],
    })

  sponsors.sort(key=lambda sponsor: sponsor["login"].lower())

  output = {
    "generated_at": __import__("datetime").datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
    "source": f"https://github.com/sponsors/{login}",
    "count": len(sponsors),
    "sponsors": sponsors,
  }

  os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
  with open(OUTPUT_PATH, "w", encoding="utf-8") as handle:
    json.dump(output, handle, indent=2)
    handle.write("\n")

  print(f"Wrote {len(sponsors)} sponsors to {OUTPUT_PATH}")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
