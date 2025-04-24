import os
import json
import requests
import dotenv
from tools import run_query

dotenv.load_dotenv()

ORGANIZATION = "sustech-cs304"


ORG_MEMBERS_QUERY = """
query($org: String!, $first: Int!, $after: String) {
  organization(login: $org) {
    membersWithRole(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        login
        name
        email
      }
    }
  }
}
"""


def fetch_org_members_graphql():
    print("🔍 Fetching members with GraphQL")
    all_members = []
    has_next = True
    cursor = None

    while has_next:
        variables = {"org": ORGANIZATION, "first": 100, "after": cursor}
        result = run_query(ORG_MEMBERS_QUERY, variables)
        data = result["data"]["organization"]["membersWithRole"]
        all_members.extend(data["nodes"])
        has_next = data["pageInfo"]["hasNextPage"]
        cursor = data["pageInfo"]["endCursor"]

    users = [m for m in all_members]
    print(f"✅ Total {len(users)} members fetched.")
    return users


if __name__ == "__main__":
    users = fetch_org_members_graphql()
    with open("./tmp/classroom_users.json", "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)


