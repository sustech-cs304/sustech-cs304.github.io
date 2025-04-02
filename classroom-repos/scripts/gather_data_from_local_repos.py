import os
import sys
import json
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

import git

MULTI_THREAD = True
WORKERS = 16  # Useful when MULTI_THREAD is True

def count_code_lines(repo_path, valid_extensions=None):
    if valid_extensions is None:
        valid_extensions = ['.py', '.java', '.js', '.jsx', '.ts', '.tsx', '.c', '.cpp', '.h', '.html', '.css']

    extension_to_language = {
        '.py': 'Python',
        '.java': 'Java',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.c': 'C',
        '.cpp': 'C++',
        '.h': 'C/C++ Header',
        '.html': 'HTML',
        '.css': 'CSS',
    }

    total_lines = 0
    lines_by_language = defaultdict(int)
    skipped_files = 0

    for root, dirs, files in os.walk(repo_path):
        for ignore_dir in ['.git', 'node_modules', '__pycache__', 'venv']:
            if ignore_dir in dirs:
                dirs.remove(ignore_dir)

        for filename in files:
            _, ext = os.path.splitext(filename)
            ext = ext.lower()

            if ext in valid_extensions:
                file_path = os.path.join(root, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        line_count = len(lines)
                        total_lines += line_count
                        language = extension_to_language.get(ext, ext)
                        lines_by_language[language] += line_count
                except (UnicodeDecodeError, FileNotFoundError):
                    skipped_files += 1

    return {
        'total_lines': total_lines,
        'lines_by_language': dict(lines_by_language),
        'skipped_files': skipped_files
    }


import os
import git
from collections import Counter  # 如果后面还要用可以保留，否则可以删掉
from datetime import datetime

def gather_repo_data(repo_path):
    repo = git.Repo(repo_path)
    repo_name = os.path.basename(repo_path)

    all_commits = set()
    commit_info_list = []

    for branch in repo.branches:
        for commit in repo.iter_commits(branch):
            if commit.hexsha not in all_commits:
                all_commits.add(commit.hexsha)
                commit_info = {
                    "commit_hash": commit.hexsha,
                    "author_name": commit.author.name,
                    "author_email": commit.author.email,
                    "committed_datetime": commit.committed_datetime.isoformat(),
                    "message": commit.message.strip()
                }
                commit_info_list.append(commit_info)

    code_line_data = count_code_lines(repo_path)

    return {
        "repo_name": repo_name,
        "commits": commit_info_list,
        "code_line_data": code_line_data
    }



def process_repo(repo_path):
    try:
        res = gather_repo_data(repo_path)
        print("finished processing", repo_path)
        return res
    except Exception as e:
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
