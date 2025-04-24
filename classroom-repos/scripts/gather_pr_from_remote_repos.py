import os
import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tools import run_query

ORGANIZATION = "sustech-cs304"
MULTI_THREAD = True
WORKERS = 16

PR_QUERY = """
query($owner: String!, $repo: String!, $first: Int!, $after: String) {
  repository(owner: $owner, name: $repo) {
    pullRequests(first: $first, after: $after, orderBy: {field: CREATED_AT, direction: ASC}) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        title
        createdAt
        closedAt
        mergedAt
        number
        author {
          login
        }
        commits {
          totalCount
        }
      }
    }
  }
}
"""


def fetch_all_prs(owner, repo):
    print(f"Start fetching PRs for {owner}/{repo}")
    all_prs = []
    has_next = True
    cursor = None

    while has_next:
        variables = {
            "owner": owner,
            "repo": repo,
            "first": 50,
            "after": cursor
        }
        result = run_query(PR_QUERY, variables)
        repo_data = result["data"]["repository"]["pullRequests"]
        all_prs.extend(repo_data["nodes"])
        has_next = repo_data["pageInfo"]["hasNextPage"]
        cursor = repo_data["pageInfo"]["endCursor"]

    # 写入到 JSON 文件
    os.makedirs("./tmp/pr", exist_ok=True)
    with open(f"./tmp/pr/{repo}.json", "w", encoding="utf-8") as f:
        json.dump(all_prs, f, indent=2, ensure_ascii=False)
    print(f"Finished {owner}/{repo} with {len(all_prs)} PRs")
    return repo, len(all_prs)


def fetch_repos_parallel(repo_list):
    if MULTI_THREAD:
        with ThreadPoolExecutor(max_workers=WORKERS) as executor:
            futures = {
                executor.submit(fetch_all_prs, owner, repo): f"{owner}/{repo}"
                for owner, repo in repo_list
            }
            for future in as_completed(futures):
                repo_name = futures[future]
                try:
                    _, count = future.result()
                    print(f"[✓] {repo_name} - {count} PRs fetched")
                except Exception as e:
                    print(f"[✗] {repo_name} - Error: {e}")
    else:
        for owner, repo in repo_list:
            try:
                _, count = fetch_all_prs(owner, repo)
                print(f"[✓] {owner}/{repo} - {count} PRs fetched")
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

    fetch_repos_parallel(repos_to_fetch)
