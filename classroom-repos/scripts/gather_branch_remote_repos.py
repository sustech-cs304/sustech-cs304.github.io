import os
import json
from concurrent.futures import ThreadPoolExecutor, as_completed

from tools import run_query  # 你已有的 GraphQL 请求工具

ORGANIZATION = "sustech-cs304"
MULTI_THREAD = True
WORKERS = 16

BRANCH_QUERY = """
query($owner: String!, $repo: String!, $first: Int!, $after: String) {
  repository(owner: $owner, name: $repo) {
    refs(refPrefix: "refs/heads/", first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        target {
          ... on Commit {
            committedDate
          }
        }
      }
    }
  }
}
"""

def fetch_all_branches(owner, repo):
    print(f"Start fetching branches for {owner}/{repo}")
    all_branches = []
    has_next = True
    cursor = None

    while has_next:
        variables = {
            "owner": owner,
            "repo": repo,
            "first": 50,
            "after": cursor
        }
        result = run_query(BRANCH_QUERY, variables)
        refs_data = result["data"]["repository"]["refs"]
        all_branches.extend(refs_data["nodes"])
        has_next = refs_data["pageInfo"]["hasNextPage"]
        cursor = refs_data["pageInfo"]["endCursor"]

    os.makedirs("./tmp/branches", exist_ok=True)
    with open(f"./tmp/branches/{repo}.json", "w", encoding="utf-8") as f:
        json.dump(all_branches, f, indent=2, ensure_ascii=False)
    print(f"Finished {owner}/{repo} with {len(all_branches)} branches")
    return repo, len(all_branches)


def fetch_branches_parallel(repo_list):
    if MULTI_THREAD:
        with ThreadPoolExecutor(max_workers=WORKERS) as executor:
            futures = {
                executor.submit(fetch_all_branches, owner, repo): f"{owner}/{repo}"
                for owner, repo in repo_list
            }
            for future in as_completed(futures):
                repo_name = futures[future]
                try:
                    _, count = future.result()
                    print(f"[✓] {repo_name} - {count} branches fetched")
                except Exception as e:
                    print(f"[✗] {repo_name} - Error: {e}")
    else:
        for owner, repo in repo_list:
            try:
                _, count = fetch_all_branches(owner, repo)
                print(f"[✓] {owner}/{repo} - {count} branches fetched")
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

    fetch_branches_parallel(repos_to_fetch)
