import os
import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

from tools import run_query

ORGANIZATION = "sustech-cs304"
MULTI_THREAD = True
WORKERS = 16

ISSUE_QUERY = """
query($owner: String!, $repo: String!, $first: Int!, $after: String) {
  repository(owner: $owner, name: $repo) {
    issues(first: $first, after: $after, orderBy: {field: CREATED_AT, direction: ASC}) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        title
        createdAt
        closedAt
        number
        author {
          login
        }
        comments {
          totalCount
        }
        labels(first: 5) {
          nodes {
            name
          }
        }
      }
    }
  }
}
"""


def fetch_all_issues(owner, repo):
    print(f"Start fetching issues for {owner}/{repo}")
    all_issues = []
    has_next = True
    cursor = None

    while has_next:
        variables = {
            "owner": owner,
            "repo": repo,
            "first": 50,
            "after": cursor
        }
        result = run_query(ISSUE_QUERY, variables)
        repo_data = result["data"]["repository"]["issues"]
        all_issues.extend(repo_data["nodes"])
        has_next = repo_data["pageInfo"]["hasNextPage"]
        cursor = repo_data["pageInfo"]["endCursor"]

    os.makedirs("./tmp/issues", exist_ok=True)
    with open(f"./tmp/issues/{repo}.json", "w", encoding="utf-8") as f:
        json.dump(all_issues, f, indent=2, ensure_ascii=False)
    print(f"Finished {owner}/{repo} with {len(all_issues)} issues")
    return repo, len(all_issues)


def fetch_issues_parallel(repo_list):
    if MULTI_THREAD:
        with ThreadPoolExecutor(max_workers=WORKERS) as executor:
            futures = {
                executor.submit(fetch_all_issues, owner, repo): f"{owner}/{repo}"
                for owner, repo in repo_list
            }
            for future in as_completed(futures):
                repo_name = futures[future]
                try:
                    _, count = future.result()
                    print(f"[✓] {repo_name} - {count} issues fetched")
                except Exception as e:
                    print(f"[✗] {repo_name} - Error: {e}")
    else:
        for owner, repo in repo_list:
            try:
                _, count = fetch_all_issues(owner, repo)
                print(f"[✓] {owner}/{repo} - {count} issues fetched")
            except Exception as e:
                print(f"[✗] {owner}/{repo} - Error: {e}")


if __name__ == "__main__":
    repos_to_fetch = []
    base_out_dir = "./tmp"
    for filename in os.listdir(base_out_dir):
        if filename.endswith("local_data.json"):
            local_data = json.load(open(os.path.join(base_out_dir, filename), "r", encoding="utf-8"))
            for repo in local_data:
                repos_to_fetch.append((ORGANIZATION, repo["repo_name"]))

    fetch_issues_parallel(repos_to_fetch)
