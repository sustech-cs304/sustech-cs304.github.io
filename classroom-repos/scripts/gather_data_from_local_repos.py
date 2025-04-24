import os
import sys
import json
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

import git

from tools import check_valid, extract_semestar_name_from_path, check_repo_name_valid, remove_duplicate_commitors

MULTI_THREAD = True
WORKERS = 16  # Useful when MULTI_THREAD is True

valid_extensions = ['.py', '.java', '.js', '.jsx', '.ts', '.tsx', '.c', '.cpp', '.h', '.html', '.css']

import os
import git
from collections import Counter
from datetime import datetime

def gather_repo_data(repo_path):
    semestar_name = extract_semestar_name_from_path(repo_path)
    repo = git.Repo(repo_path)
    repo_name = os.path.basename(repo_path)
    group_name = check_repo_name_valid(semestar_name, repo_path)
    if group_name is None:
        return None

    all_commits = set()
    commit_info_list = []

    valid_extensions = ['.py', '.java', '.js', '.jsx', '.ts', '.tsx', '.c', '.cpp', '.h', '.html', '.css', '.md']
    commit_file_stats =  {ext: 0 for ext in valid_extensions}

    for branch in repo.branches:
        for commit in repo.iter_commits(branch):
            if commit.hexsha not in all_commits:
                all_commits.add(commit.hexsha)
                valid, info = check_valid(semestar_name, commit.author.name, commit.committed_datetime.isoformat())
                if not valid:
                    continue
                stats = commit.stats.total
                commit_info = {
                    "commit_hash": commit.hexsha,
                    "author_name": commit.author.name,
                    "author_email": commit.author.email,   
                    "committed_datetime": commit.committed_datetime.isoformat(),
                    "message": commit.message.strip(),
                    "insertions": stats.get('insertions', 0),
                    "deletions": stats.get('deletions', 0),
                    "files_changed": stats.get('files', 0)
                }
                
                stats = commit.stats.files  # 文件名 -> {'insertions': x, 'deletions': y, ...}
                for file_path, file_stat in stats.items():
                    _, ext = os.path.splitext(file_path)
                    ext = ext.lower()
                    if ext in valid_extensions:
                        commit_file_stats[ext] += file_stat['insertions'] - file_stat['deletions']
                
                commit_info_list.append(commit_info)

    # remove_duplicate_commitors(commit_info_list)
    
    return {
        "repo_name": repo_name,
        "group_name": group_name,
        "commits": commit_info_list,
        "code_line_data": {
            "total_lines": sum(commit_file_stats.values()),
            "ext_status": commit_file_stats
        }
    }



def process_repo(repo_path):
    try:
        res = gather_repo_data(repo_path)
        print("finished processing", repo_path)
        return res
        
    except Exception as e:
        raise e
        print(f"Failed to process {repo_path}: {e}")
        return None


def process_semestar(semestar_dir, semestar_name):
    if not os.path.isdir(semestar_dir):
        print(f"Error: {semestar_dir} is not a valid directory.")
        return

    print(f"🔍 Scanning semestar: {semestar_name} with {WORKERS} workers")
    repo_paths = []
    for name in os.listdir(semestar_dir):
        repo_path = os.path.join(semestar_dir, name)
        git_folder = os.path.join(repo_path, '.git')
        if os.path.isdir(repo_path) and os.path.isdir(git_folder):
            repo_paths.append(repo_path)

    results = []


    if MULTI_THREAD:
        with ThreadPoolExecutor(max_workers=WORKERS) as executor:
            future_to_repo = {executor.submit(process_repo, path): path for path in repo_paths}

            for future in as_completed(future_to_repo):
                repo_path = future_to_repo[future]
                result = future.result()
                if result:
                    results.append(result)
    else:
        for repo_path in repo_paths:
            result = process_repo(repo_path)
            if result:
                results.append(result)

    # 保存结果
    os.makedirs('./tmp', exist_ok=True)
    with open(f'./tmp/{semestar_name}_local_data.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"✅ Finished: {semestar_name} — {len(results)} repos processed.")


if __name__ == "__main__":
    base_directory = "./repos"
    semestar_dirs = [d for d in os.listdir(base_directory) if os.path.isdir(os.path.join(base_directory, d))]

    for semestar in semestar_dirs:
        semestar_path = os.path.join(base_directory, semestar)
        process_semestar(semestar_path, semestar)
