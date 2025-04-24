import os
import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

from tools import run_query

import os
import json
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

from tools import run_query

ORGANIZATION = "sustech-cs304"
MULTI_THREAD = True
WORKERS = 16

COMMIT_USER_QUERY = """
query($owner: String!, $name: String!, $expression: String!) {
  repository(owner: $owner, name: $name) {
    object(expression: $expression) {
      ... on Commit {
        author {
          user {
            id
          }
          name
          email
        }
      }
    }
  }
}
"""

def fetch_commit_author(owner, repo, commit_sha):
    variables = {
        "owner": owner,
        "name": repo,
        "expression": commit_sha
    }

    try:
        result = run_query(COMMIT_USER_QUERY, variables)
        author_info = result["data"]["repository"]["object"]["author"]
        return {
            "commit": commit_sha,
            "id": author_info["user"]["id"] if author_info["user"] else None,
            "name": author_info["name"],
            "email": author_info["email"]
        }
    except Exception as e:
        print(e)
        print(f"Error fetching commit {commit_sha} in {repo}: {e}")
        return {
            "commit": commit_sha,
            "id": None,
            "name": None,
            "email": None
        }

def fetch_commit_users_for_repo(owner, repo, commit_shas):
    print(f"Start fetching users for {owner}/{repo} - {len(commit_shas)} commits")
    users = []

    if MULTI_THREAD:
        with ThreadPoolExecutor(max_workers=WORKERS) as executor:
            futures = {
                executor.submit(fetch_commit_author, owner, repo, sha): sha
                for sha in commit_shas
            }
            for future in as_completed(futures):
                result = future.result()
                if result:
                    users.append(result)
    else:
        for sha in commit_shas:
            result = fetch_commit_author(owner, repo, sha)
            if result:
                users.append(result)

    os.makedirs("./tmp/users", exist_ok=True)
    with open(f"./tmp/users/{repo}.json", "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

    print(f"Finished {owner}/{repo} with {len(users)} commit authors saved.")
    return repo, len(users)


if __name__ == "__main__":
    commits_to_fetch = {}  # repo -> {commits_author: commithash, }
    base_out_dir = "./tmp"
    for filename in os.listdir(base_out_dir):
        if filename.endswith("local_data.json"):
            local_data = json.load(open(os.path.join(base_out_dir, filename), "r", encoding="utf-8"))
            for repo in local_data:
                email2hash = {}
                commit_to_fetch_in_repo = []
                for commit in repo["commits"]:
                    if commit["author_email"] not in email2hash:
                        email2hash[commit["author_email"]] = commit["commit_hash"]
                        commit_to_fetch_in_repo.append(commit["commit_hash"])

                commits_to_fetch[repo["repo_name"]] = commit_to_fetch_in_repo
    for repo, commit_shas in commits_to_fetch.items():
        fetch_commit_users_for_repo(ORGANIZATION, repo, commit_shas)