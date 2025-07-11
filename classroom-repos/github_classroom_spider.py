import os
import json
import requests
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from collections import Counter, defaultdict
import re
import math
import pytz
import dotenv
import git

CONFIG = {
    "semestar_range": {
        "25spring": (
            datetime(2025, 2, 1, tzinfo=timezone(timedelta(hours=8))),
            datetime(2025, 6, 30, tzinfo=timezone(timedelta(hours=8))),
        ),
        "24spring": (
            datetime(2024, 2, 1, tzinfo=timezone(timedelta(hours=8))),
            datetime(2024, 6, 30, tzinfo=timezone(timedelta(hours=8))),
        ),
        "23spring": (
            datetime(2023, 2, 1, tzinfo=timezone(timedelta(hours=8))),
            datetime(2023, 6, 30, tzinfo=timezone(timedelta(hours=8))),
        ),
    },
    "classroom_id": {
        "25spring": "253851",
        "24spring": "206118",
        "23spring": "152718",
    },
    "assignment_id": {
        "23spring": "403123",
        "24spring": "558214",
        "25spring": "749620",
    },
    "valid_extensions": [
        ".py", ".java", ".js", ".jsx", ".ts", ".tsx", ".c", ".cpp", ".h", ".html", ".css", ".md",
    ],
    "single_file_insertion_limit": 2000,
}


# ========== GithubClassroomSpider ===========
class GithubClassroomSpider:
    """
    GithubClassroomSpider 封装了所有与Github Classroom相关的爬虫与数据处理功能。
    - 所有临时数据统一存储在 tmp.json
    - 所有图表数据统一存储在 chart_data.json
    - 详细日志与注释，便于维护
    """

    def __init__(self, organization="sustech-cs304", repos_dir="./repos"):
        dotenv.load_dotenv()
        self.organization = organization
        self.repos_dir = repos_dir
        self.GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
        if not self.GITHUB_TOKEN:
            raise Exception("请设置环境变量 GITHUB_TOKEN")
        self.HEADERS = {"Authorization": f"Bearer {self.GITHUB_TOKEN}"}
        self.API_URL = "https://api.github.com/graphql"
        self.tmp_path = "tmp.json"
        self.chart_data_path = "chart_data.json"
        self.tmp_data = self._load_json(self.tmp_path) or {}
        self.chart_data = self._load_json(self.chart_data_path) or {}
        self.WORKERS = 16
        self.MULTI_THREAD = True
        self.china_tz = pytz.timezone("Asia/Shanghai")
        self.semestar_range = CONFIG["semestar_range"]
        self.classroom_id = CONFIG["classroom_id"]
        self.assignment_id = CONFIG["assignment_id"]
        self.request_headers = {
            "Authorization": f"token {self.GITHUB_TOKEN}",
            "Accept": "application/vnd.github.v3+json",
        }
        self.valid_extensions = CONFIG["valid_extensions"]
        self.single_file_insertion_limit = CONFIG["single_file_insertion_limit"]
        self._log("GithubClassroomSpider 初始化完成。")

    def _log(self, msg):
        print(
            f"[GithubClassroomSpider] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - {msg}"
        )

    def _load_json(self, path):
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return None

    def _save_json(self, path, data):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def _run_query(self, query, variables):
        response = requests.post(
            self.API_URL,
            json={"query": query, "variables": variables},
            headers=self.HEADERS,
            timeout=15,
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(
                f"GraphQL query failed: {response.status_code}\n{response.text}"
            )

    def extract_team_name_from_repo(self, semestar_name, repo_name):
        if semestar_name == "25spring":
            match_res = re.match(
                r"team-project-25spring-(team[_-]?\d+|\d+)$", repo_name
            )
            if match_res:
                return match_res.group(1)
            else:
                return None
        elif semestar_name == "24spring":
            match_res = re.match(
                r"team-project-24spring-(team[_-]?\d+|\d+)$", repo_name
            )
            if match_res:
                return match_res.group(1)
            else:
                return None
        elif semestar_name == "23spring":
            match_res = re.match(r"team-project-(\d+)$", repo_name)
            if match_res:
                return match_res.group(1)
            else:
                return None
        else:
            raise Exception(f"Invalid semestar name: {semestar_name}")

    # 用于查询github classroom的classroom_id和assignment_id的工具
    # 当新学期开始时，可以使用这个函数获取新学期的classroom id和assignment id
    def get_project_assignment_id(self):
        def get_classrooms():
            url = "https://api.github.com/classrooms"
            classrooms = []
            page = 1
            while True:
                resp = requests.get(
                    url,
                    headers=self.request_headers,
                    params={"page": page, "per_page": 100},
                    timeout=15,
                )
                if resp.status_code != 200:
                    self._log(
                        f"Error fetching classrooms: {resp.status_code} - {resp.text}"
                    )
                    return []
                data = resp.json()
                if not data:
                    break
                classrooms.extend(data)
                page += 1
            return classrooms

        def get_assignments(classroom_id):
            url = f"https://api.github.com/classrooms/{classroom_id}/assignments"
            assignments = []
            page = 1
            while True:
                resp = requests.get(
                    url,
                    headers=self.request_headers,
                    params={"page": page, "per_page": 100},
                    timeout=15,
                )
                if resp.status_code != 200:
                    self._log(
                        f"Error fetching assignments: {resp.status_code} - {resp.text}"
                    )
                    return []
                data = resp.json()
                if not data:
                    break
                assignments.extend(data)
                page += 1
            return assignments

        self._log("📘 获取 Classrooms...")
        classrooms = get_classrooms()
        if not classrooms:
            self._log("没有找到任何 Classroom。")
            exit(1)

        for c in classrooms:
            self._log(f"Classroom 名称: {c['name']}")
            self._log(f"Classroom ID: {c['id']}")
            self._log("-" * 30)

        # 手动指定或选择一个 Classroom
        classroom_id = input("请输入你要查看的 Classroom ID: ").strip()

        self._log(f"\n📘 获取 Classroom ID 为 {classroom_id} 的所有作业...")
        assignments = get_assignments(classroom_id)
        if not assignments:
            self._log("该 Classroom 下没有作业。")
            exit(1)

        for a in assignments:
            self._log(f"作业标题: {a['title']}")
            self._log(f"Assignment ID: {a['id']}")
            self._log(f"类型: {'小组作业' if a['type'] == 'group' else '个人作业'}")
            self._log("-" * 30)

    # ========== 数据准备1. 获取classroom中成员信息 ===========
    def get_classroom_members(self):
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

        self._log("🔍 获取github classroom中所有成员信息")
        all_members = []
        has_next = True
        cursor = None

        while has_next:
            variables = {"org": self.organization, "first": 100, "after": cursor}
            result = self._run_query(ORG_MEMBERS_QUERY, variables)
            data = result["data"]["organization"]["membersWithRole"]
            all_members.extend(data["nodes"])
            has_next = data["pageInfo"]["hasNextPage"]
            cursor = data["pageInfo"]["endCursor"]

        users = [m for m in all_members]
        self._log(f"✅ 获取成功，一共有 {len(users)} 名选课同学")
        self.tmp_data["classroom_members"] = users
        self._save_json(self.tmp_path, self.tmp_data)

    # ========== 数据准备1. 获取project小组中成员信息 ===========
    def get_accepted_assignments(
        self, semestar_list=("23spring", "24spring", "25spring")
    ):
        self._log("开始获取学期project的小组成员信息")
        if "full_group_info" not in self.tmp_data:
            self.tmp_data["full_group_info"] = {}
        if "group_members" not in self.tmp_data:
            self.tmp_data["group_members"] = {}
        for semestar in semestar_list:
            assignment_id = self.assignment_id[semestar]
            self.tmp_data["group_members"][semestar] = {}
            self.tmp_data["full_group_info"][semestar] = []
            # Important! 默认的页数上限是30，考虑到一个学期一般会有40左右个小组，所以这里设置为100，不需要分页获取
            url = f"https://api.github.com/assignments/{assignment_id}/accepted_assignments?per_page=100"
            resp = requests.get(url, headers=self.request_headers, timeout=15)

            if resp.status_code != 200:
                self._log(
                    f"Error fetching accepted assignments: {resp.status_code} - {resp.text}"
                )
                continue
            data = resp.json()
            for accepted_assignment in data:
                repo_name = accepted_assignment["repository"]["name"]
                students = accepted_assignment["students"]
                self.tmp_data["group_members"][semestar][repo_name] = students

            self.tmp_data["full_group_info"][semestar].append(data)
            self._log(f"已获取 {semestar} 学期的小组成员信息。")
        self._log("已获取所有学期的小组成员信息。")
        self._save_json(self.tmp_path, self.tmp_data)

    def join_classroom_members_with_group_members(self):
        self._log("开始将小组成员信息与classroom成员信息进行关联...")
        classroom_members = self.tmp_data["classroom_members"]
        login2id = {m["login"]: m["id"] for m in classroom_members}
        sucess_count, fail_count = 0, 0
        for semestar, repo_members in self.tmp_data["group_members"].items():
            for repo_name, students in repo_members.items():
                for student in students:
                    if student["login"] not in login2id:
                        self._log(f"⚠️ 无法找到 {student['login']} 的github id")
                        student["github_id"] = None
                        fail_count += 1
                        continue
                    student["github_id"] = login2id[student["login"]]
                    sucess_count += 1
        self._log(
            f"关联完成。成功关联 {sucess_count} 名同学，失败 {fail_count} 名同学。"
        )
        self._save_json(self.tmp_path, self.tmp_data)

    # ========== 2. 本地仓库数据收集 ===========
    def gather_data_from_local_repos(self):
        """
        遍历本地所有团队仓库，收集commit和代码行数等信息，存入tmp_data['local_data']
        """

        def extract_semestar_name_from_path(path):
            # 从文件夹名中提取学期名
            match = re.search(r"team-project-(\w+)-submissions", path)
            if match:
                return f"{match.group(1)}"
            else:
                raise Exception(f"Invalid folder name: {path}")

        def check_repo_name_valid(semestar_name, repo_path):
            # 校验repo文件夹名是否合法，并提取组名
            folder_name = os.path.basename(os.path.normpath(repo_path))
            return self.extract_team_name_from_repo(semestar_name, folder_name)

        def check_valid(semestar, author_name, datatime):
            # 检查commit时间是否在学期范围内
            if semestar not in self.semestar_range:
                return False, f"学期不存在 {semestar}"
            start_date, end_date = self.semestar_range[semestar]
            if isinstance(datatime, str):
                try:
                    datatime = datetime.fromisoformat(datatime.replace("Z", "+00:00"))
                except Exception as e:
                    self._log(f"⚠️ 无法解析时间: {datatime}, 错误: {e}")
                    return False, f"无法解析时间: {datatime}, 错误: {e}"
            time_check = start_date <= datatime <= end_date
            author_check = True  # 这里可根据需要校验作者
            return time_check, ""

        self._log("开始收集本地仓库数据...")
        semestar_dirs = [
            d
            for d in os.listdir(self.repos_dir)
            if os.path.isdir(os.path.join(self.repos_dir, d))
        ]
        all_results = {}
        for semestar in semestar_dirs:
            semestar_path = os.path.join(self.repos_dir, semestar)
            semestar_name = extract_semestar_name_from_path(semestar)
            repo_paths = []
            for name in os.listdir(semestar_path):
                repo_path = os.path.join(semestar_path, name)
                git_folder = os.path.join(repo_path, ".git")
                if os.path.isdir(repo_path) and os.path.isdir(git_folder):
                    repo_paths.append(repo_path)
            results = []

            def process_repo(repo_path):
                try:
                    repo = git.Repo(repo_path)
                    repo_name = os.path.basename(repo_path)
                    group_name = check_repo_name_valid(semestar_name, repo_path)
                    if group_name is None:
                        return None
                    all_commits = set()
                    commit_info_list = []
                    commit_file_stats = {ext: 0 for ext in self.valid_extensions}
                    for branch in repo.branches:
                        for commit in repo.iter_commits(branch):
                            if commit.hexsha not in all_commits:
                                all_commits.add(commit.hexsha)
                                valid, _ = check_valid(
                                    semestar_name,
                                    commit.author.name,
                                    commit.committed_datetime.isoformat(),
                                )
                                if not valid:
                                    continue
                                stats = commit.stats.total
                                commit_info = {
                                    "commit_hash": commit.hexsha,
                                    "author_name": commit.author.name,
                                    "author_email": commit.author.email,  # 提交者邮箱
                                    "committed_datetime": commit.committed_datetime.isoformat(),
                                    "message": commit.message.strip(),
                                    "insertions": stats.get("insertions", 0),
                                    "deletions": stats.get("deletions", 0),
                                    "files_changed": stats.get("files", 0),
                                }
                                stats = commit.stats.files
                                for file_path, file_stat in stats.items():
                                    # 跳过单文件插入行数过大的文件（如库文件/依赖/大文件）
                                    if (
                                        file_stat.get("insertions", 0)
                                        > self.single_file_insertion_limit
                                    ):
                                        continue
                                    # 删的太多也不行
                                    if (
                                        file_stat.get("deletions", 0)
                                        > self.single_file_insertion_limit
                                    ):
                                        continue
                                    _, ext = os.path.splitext(file_path)
                                    ext = ext.lower()
                                    if ext in self.valid_extensions:
                                        commit_file_stats[ext] += max(
                                            file_stat["insertions"]
                                            - file_stat["deletions"],
                                            0,
                                        )  # 别整成负数了
                                commit_info_list.append(commit_info)
                    self._log(f"处理仓库 {repo_path} 完成，共 {len(commit_info_list)} 个commit")
                    return {
                        "repo_name": repo_name,
                        "group_name": group_name,
                        "commits": commit_info_list,
                        "code_line_data": {
                            "total_lines": sum(commit_file_stats.values()),
                            "ext_status": commit_file_stats,
                        },
                    }
                except Exception as e:
                    self._log(f"处理仓库 {repo_path} 失败: {e}")
                    return None

            if self.MULTI_THREAD:
                # 多线程加速处理
                try:
                    with ThreadPoolExecutor(max_workers=self.WORKERS) as executor:
                        future_to_repo = {
                            executor.submit(process_repo, path): path
                            for path in repo_paths
                        }
                        for future in as_completed(future_to_repo):
                            repo_path = future_to_repo[future]
                            try:
                                result = future.result(timeout=60)
                                if result:
                                    results.append(result)
                            except Exception as e:
                                self._log(f"处理仓库 {repo_path} 失败: {e}")
                except KeyboardInterrupt:
                    self._log("检测到中断，正在退出线程池...")
                    executor.shutdown(wait=False, cancel_futures=True)
                    raise
            else:
                for repo_path in repo_paths:
                    result = process_repo(repo_path)
                    if result:
                        results.append(result)
            all_results[semestar_name] = results
            self._log(f"学期 {semestar_name} 处理完成，共{len(results)}个仓库。")
        self.tmp_data["local_data"] = all_results
        self._save_json(self.tmp_path, self.tmp_data)
        self._log("本地仓库数据收集完成。")

    # ========== 3. 远程PR爬取 ===========
    def fetch_prs(self):
        """
        并发爬取所有仓库的PR信息，存入tmp_data['pr']
        """
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
        self._log("开始爬取所有仓库的PR信息...")
        pr_data = {}
        # 获取所有repo名
        all_repos = []
        for semestar, repos in self.tmp_data.get("local_data", {}).items():
            for repo in repos:
                all_repos.append(repo["repo_name"])

        def fetch_one_repo_pr(repo_name):
            all_prs = []
            has_next = True
            cursor = None
            while has_next:
                variables = {
                    "owner": self.organization,
                    "repo": repo_name,
                    "first": 50,
                    "after": cursor,
                }
                try:
                    result = self._run_query(PR_QUERY, variables)
                    repo_data = result["data"]["repository"]["pullRequests"]
                    all_prs.extend(repo_data["nodes"])
                    has_next = repo_data["pageInfo"]["hasNextPage"]
                    cursor = repo_data["pageInfo"]["endCursor"]
                except Exception as e:
                    self._log(f"爬取PR失败: {repo_name}: {e}")
                    break
            self._log(f"{repo_name} PR数: {len(all_prs)}")
            return repo_name, all_prs

        if self.MULTI_THREAD:
            try:
                with ThreadPoolExecutor(max_workers=self.WORKERS) as executor:
                    futures = {
                        executor.submit(fetch_one_repo_pr, repo): repo
                        for repo in all_repos
                    }
                    for future in as_completed(futures):
                        repo = futures[future]
                        try:
                            repo, prs = future.result(timeout=30)
                            pr_data[repo] = prs
                        except Exception as e:
                            self._log(f"PR任务异常: {repo} - {e}")
            except KeyboardInterrupt:
                self._log("检测到中断，正在退出线程池...")
                executor.shutdown(wait=False, cancel_futures=True)
                raise
        else:
            for repo in all_repos:
                repo, prs = fetch_one_repo_pr(repo)
                pr_data[repo] = prs
        self.tmp_data["pr"] = pr_data
        self._save_json(self.tmp_path, self.tmp_data)
        self._log("所有PR信息爬取完成。")

    # ========== 3.2 远程Issue爬取 ===========
    def fetch_issues(self):
        """
        并发爬取所有仓库的Issue信息，存入tmp_data['issues']
        """
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
        self._log("开始爬取所有仓库的Issue信息...")
        issue_data = {}
        all_repos = []
        for semestar, repos in self.tmp_data.get("local_data", {}).items():
            for repo in repos:
                all_repos.append(repo["repo_name"])

        def fetch_one_repo_issue(repo_name):
            all_issues = []
            has_next = True
            cursor = None
            while has_next:
                variables = {
                    "owner": self.organization,
                    "repo": repo_name,
                    "first": 50,
                    "after": cursor,
                }
                try:
                    result = self._run_query(ISSUE_QUERY, variables)
                    repo_data = result["data"]["repository"]["issues"]
                    all_issues.extend(repo_data["nodes"])
                    has_next = repo_data["pageInfo"]["hasNextPage"]
                    cursor = repo_data["pageInfo"]["endCursor"]
                except Exception as e:
                    self._log(f"爬取Issue失败: {repo_name}: {e}")
                    break
            self._log(f"{repo_name} Issue数: {len(all_issues)}")
            return repo_name, all_issues

        if self.MULTI_THREAD:
            try:
                with ThreadPoolExecutor(max_workers=self.WORKERS) as executor:
                    futures = {
                        executor.submit(fetch_one_repo_issue, repo): repo
                        for repo in all_repos
                    }
                    for future in as_completed(futures):
                        repo = futures[future]
                        try:
                            repo, issues = future.result(timeout=30)
                            issue_data[repo] = issues
                        except Exception as e:
                            self._log(f"Issue任务异常: {repo} - {e}")
            except KeyboardInterrupt:
                self._log("检测到中断，正在退出线程池...")
                executor.shutdown(wait=False, cancel_futures=True)
                raise
        else:
            for repo in all_repos:
                repo, issues = fetch_one_repo_issue(repo)
                issue_data[repo] = issues
        self.tmp_data["issues"] = issue_data
        self._save_json(self.tmp_path, self.tmp_data)
        self._log("所有Issue信息爬取完成。")

    # ========== 3.3 远程Branch爬取 ===========
    def fetch_branches(self):
        """
        并发爬取所有仓库的分支信息，存入tmp_data['branches']
        """
        BRANCH_QUERY = """
        query($owner: String!, $repo: String!, $first: Int!, $after: String) {
          repository(owner: $owner, name: $repo) {
            refs(refPrefix: \"refs/heads/\", first: $first, after: $after) {
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
        self._log("开始爬取所有仓库的分支信息...")
        branch_data = {}
        all_repos = []
        for semestar, repos in self.tmp_data.get("local_data", {}).items():
            for repo in repos:
                all_repos.append(repo["repo_name"])

        def fetch_one_repo_branch(repo_name):
            all_branches = []
            has_next = True
            cursor = None
            while has_next:
                variables = {
                    "owner": self.organization,
                    "repo": repo_name,
                    "first": 50,
                    "after": cursor,
                }
                try:
                    result = self._run_query(BRANCH_QUERY, variables)
                    refs_data = result["data"]["repository"]["refs"]
                    all_branches.extend(refs_data["nodes"])
                    has_next = refs_data["pageInfo"]["hasNextPage"]
                    cursor = refs_data["pageInfo"]["endCursor"]
                except Exception as e:
                    self._log(f"爬取Branch失败: {repo_name}: {e}")
                    break
            self._log(f"{repo_name} 分支数: {len(all_branches)}")
            return repo_name, all_branches

        if self.MULTI_THREAD:
            try:
                with ThreadPoolExecutor(max_workers=self.WORKERS) as executor:
                    futures = {
                        executor.submit(fetch_one_repo_branch, repo): repo
                        for repo in all_repos
                    }
                    for future in as_completed(futures):
                        repo = futures[future]
                        try:
                            repo, branches = future.result(timeout=30)
                            branch_data[repo] = branches
                        except Exception as e:
                            self._log(f"Branch任务异常: {repo} - {e}")
            except KeyboardInterrupt:
                self._log("检测到中断，正在退出线程池...")
                executor.shutdown(wait=False, cancel_futures=True)
                raise
        else:
            for repo in all_repos:
                repo, branches = fetch_one_repo_branch(repo)
                branch_data[repo] = branches
        self.tmp_data["branches"] = branch_data
        self._save_json(self.tmp_path, self.tmp_data)
        self._log("所有分支信息爬取完成。")

    # ========== 3.4 远程提交作者信息爬取 ===========
    def fetch_commit_authors(self):
        """
        并发爬取所有仓库的提交作者信息，存入tmp_data['commit_authors']
        """
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
        self._log("开始爬取所有仓库的提交作者信息...")
        author_data = {}

        # 从本地数据中获取需要查询的提交
        commits_to_fetch = {}  # repo -> {commits_author: commithash, }
        for semestar, repos in self.tmp_data.get("local_data", {}).items():
            for repo in repos:
                email2hash = {}
                commit_to_fetch_in_repo = []
                for commit in repo["commits"]:
                    if commit["author_email"] not in email2hash:
                        email2hash[commit["author_email"]] = commit["commit_hash"]
                        commit_to_fetch_in_repo.append(commit["commit_hash"])
                commits_to_fetch[repo["repo_name"]] = commit_to_fetch_in_repo

        def fetch_commit_author(repo_name, commit_sha):
            variables = {
                "owner": self.organization,
                "name": repo_name,
                "expression": commit_sha,
            }
            try:
                result = self._run_query(COMMIT_USER_QUERY, variables)
                author_info = result["data"]["repository"]["object"]["author"]
                return {
                    "commit": commit_sha,
                    "id": author_info["user"]["id"] if author_info["user"] else None,
                    "name": author_info["name"],
                    "email": author_info["email"],
                }
            except Exception as e:
                self._log(f"爬取提交作者信息失败: {repo_name}/{commit_sha}: {e}")
                return {"commit": commit_sha, "id": None, "name": None, "email": None}

        def process_repo(repo_name, commit_shas):
            self._log(
                f"开始爬取 {repo_name} 的提交作者信息 - {len(commit_shas)} 个提交"
            )
            users = []
            if self.MULTI_THREAD:
                with ThreadPoolExecutor(max_workers=self.WORKERS) as executor:
                    futures = {
                        executor.submit(fetch_commit_author, repo_name, sha): sha
                        for sha in commit_shas
                    }
                    for future in as_completed(futures):
                        result = future.result()
                        if result:
                            users.append(result)
            else:
                for sha in commit_shas:
                    result = fetch_commit_author(repo_name, sha)
                    if result:
                        users.append(result)
            return repo_name, users

        if self.MULTI_THREAD:
            try:
                with ThreadPoolExecutor(max_workers=self.WORKERS) as executor:
                    futures = {
                        executor.submit(process_repo, repo, commits): repo
                        for repo, commits in commits_to_fetch.items()
                    }
                    for future in as_completed(futures):
                        repo = futures[future]
                        try:
                            repo, users = future.result(timeout=60)
                            author_data[repo] = users
                        except Exception as e:
                            self._log(f"处理仓库提交作者信息任务异常: {repo} - {e}")
            except KeyboardInterrupt:
                self._log("检测到中断，正在退出线程池...")
                executor.shutdown(wait=False, cancel_futures=True)
                raise
        else:
            for repo, commits in commits_to_fetch.items():
                repo, users = process_repo(repo, commits)
                author_data[repo] = users

        self.tmp_data["commit_authors"] = author_data
        self._save_json(self.tmp_path, self.tmp_data)
        self._log("所有提交作者信息爬取完成。")

    # ========== 4 过滤提交信息 ===========
    def filter_commits_by_classroom_user(self):
        self._log("开始过滤提交信息...")
        self.tmp_data["filtered_local_data"] = {}
        for semestar, repos in self.tmp_data.get("local_data", {}).items():
            self.tmp_data["filtered_local_data"][semestar] = []
            for repo in repos:
                remote_commitor_info = self.tmp_data["commit_authors"].get(
                    repo["repo_name"], []
                )
                email2id = {c["email"]: c["id"] for c in remote_commitor_info}
                group_members = (
                    self.tmp_data["group_members"]
                    .get(semestar, {})
                    .get(repo["repo_name"], [])
                )
                valid_ids = set(p["github_id"] for p in group_members)
                valid_commits = []
                for commit in repo["commits"]:
                    if commit["author_email"] not in email2id:  # 鉴定为外部commitor
                        continue
                    if (
                        email2id[commit["author_email"]] in valid_ids
                    ):  # 鉴定为小组内成员
                        commit["author_id"] = email2id[commit["author_email"]]
                        valid_commits.append(commit)
                if len(valid_commits) == 0:
                    continue

                self.tmp_data["filtered_local_data"][semestar].append(
                    {
                        "repo_name": repo["repo_name"],
                        "group_name": repo["group_name"],
                        "commits": valid_commits,
                        "code_line_data": repo["code_line_data"],
                        "group_member_ids": [
                            val for val in valid_ids if val is not None
                        ],
                    }
                )
        self._save_json(self.tmp_path, self.tmp_data)
        self._log("所有提交信息过滤完成。")

    # ========== 5. 图表数据生成 ===========
    def generate_chart_data(self):
        """
        生成所有图表所需数据，存入chart_data.json
        """
        self._log("开始生成图表数据...")
        chart_data = {}
        # 以学期为单位
        for semestar, repos in self.tmp_data.get("filtered_local_data", {}).items():
            # 1. commit时间分布（日）
            all_commits = []
            [all_commits.extend(repo["commits"]) for repo in repos]
            date_list = []
            for commit in all_commits:
                dt = datetime.fromisoformat(commit["committed_datetime"])
                dt_china = dt.astimezone(self.china_tz)
                date_str = dt_china.date().isoformat()
                date_list.append(date_str)
            commit_counter = Counter(date_list)
            if date_list:
                start_date = datetime.fromisoformat(min(date_list))
                end_date = datetime.fromisoformat(max(date_list))
                full_dates = []
                counts = []
                current = start_date
                while current <= end_date:
                    date_str = current.date().isoformat()
                    full_dates.append(date_str)
                    counts.append(commit_counter.get(date_str, 0))
                    current += timedelta(days=1)
            else:
                full_dates, counts = [], []
            chart_data.setdefault(semestar, {})["commit_time_distribution_date"] = {
                "full_dates": full_dates,
                "counts": counts,
            }
            # 2. commit时间分布（小时）
            hour_list = []
            for commit in all_commits:
                dt = datetime.fromisoformat(commit["committed_datetime"])
                dt_china = dt.astimezone(self.china_tz)
                hour = dt_china.hour
                hour_list.append(hour)
            commit_counter_hour = Counter(hour_list)
            full_hours = list(range(24))
            hour_counts = [commit_counter_hour.get(h, 0) for h in full_hours]
            chart_data[semestar]["commit_time_distribution_hourly"] = {
                "hours": full_hours,
                "counts": hour_counts,
            }
            # 3. 每组commit数
            group_names = [repo["group_name"] for repo in repos]
            commit_counts = [len(repo["commits"]) for repo in repos]
            avg_commit_count = (
                round(sum(commit_counts) / len(commit_counts), 2)
                if commit_counts
                else 0
            )
            chart_data[semestar]["commit_count_per_repo"] = {
                "group_names": group_names,
                "commit_counts": commit_counts,
                "average_commit_count": avg_commit_count,
            }
            # 4. 代码行数分布
            code_line_counts = [
                repo.get("code_line_data", {}).get("total_lines", 0) for repo in repos
            ]
            avg_lines = (
                sum(code_line_counts) / len(code_line_counts) if code_line_counts else 0
            )
            chart_data[semestar]["code_line_per_repo"] = {
                "group_names": group_names,
                "total_lines": code_line_counts,
                "average_lines": avg_lines,
            }
            # 5. 语言分布
            language_counter = Counter()
            for repo in repos:
                code_data = repo.get("code_line_data", {})
                lang_data = code_data.get("ext_status", {})
                for lang, count in lang_data.items():
                    language_counter[lang] += count
            sorted_lang = sorted(
                language_counter.items(), key=lambda x: x[1], reverse=True
            )
            languages = [lang for lang, _ in sorted_lang]
            lang_counts = [count for _, count in sorted_lang]
            chart_data[semestar]["language_distribution"] = {
                "languages": languages,
                "counts": lang_counts,
            }
            # 6. PR数/Issue数/分支数
            pr_counts = [
                len(self.tmp_data.get("pr", {}).get(repo["repo_name"], []))
                for repo in repos
            ]
            issue_counts = [
                len(self.tmp_data.get("issues", {}).get(repo["repo_name"], []))
                for repo in repos
            ]
            branch_counts = [
                len(self.tmp_data.get("branches", {}).get(repo["repo_name"], []))
                for repo in repos
            ]
            chart_data[semestar]["pr_count_per_repo"] = {
                "group_names": group_names,
                "pr_counts": pr_counts,
                "average_pr": sum(pr_counts) / len(pr_counts) if pr_counts else 0,
            }
            chart_data[semestar]["issue_count_per_repo"] = {
                "group_names": group_names,
                "issue_counts": issue_counts,
                "average_issues": (
                    sum(issue_counts) / len(issue_counts) if issue_counts else 0
                ),
            }
            chart_data[semestar]["branch_count_per_repo"] = {
                "group_names": group_names,
                "branch_counts": branch_counts,
                "average_branches": (
                    sum(branch_counts) / len(branch_counts) if branch_counts else 0
                ),
            }
            # 7. PR状态分布
            pr_status_counter = {"merged": 0, "closed": 0, "open": 0}
            for repo in repos:
                repo_prs = self.tmp_data.get("pr", {}).get(repo["repo_name"], [])
                for pr in repo_prs:
                    if pr.get("mergedAt"):
                        pr_status_counter["merged"] += 1
                    elif pr.get("closedAt"):
                        pr_status_counter["closed"] += 1
                    else:
                        pr_status_counter["open"] += 1
            chart_data[semestar]["pr_status_distribution"] = pr_status_counter
            # 8. Issue状态分布
            issue_status_counter = {"open": 0, "closed": 0}
            for repo in repos:
                repo_issues = self.tmp_data.get("issues", {}).get(repo["repo_name"], [])
                for issue in repo_issues:
                    if issue.get("closedAt"):
                        issue_status_counter["closed"] += 1
                    else:
                        issue_status_counter["open"] += 1
            chart_data[semestar]["issue_status_distribution"] = issue_status_counter
            # 9. 小组成员数量分布
            repo_active_counts = []
            active_count_bucket = Counter()
            for repo in repos:
                active_count = len(repo["group_member_ids"])
                repo_active_counts.append(
                    {
                        "group_name": repo["group_name"],
                        "active_contributor_count": active_count,
                    }
                )
                active_count_bucket[active_count] += 1
            pie_chart_data = {str(k): v for k, v in sorted(active_count_bucket.items())}
            chart_data[semestar]["repo_active_contributor_count"] = repo_active_counts
            chart_data[semestar]["active_contributor_pie_chart"] = pie_chart_data

            # 10. 贡献差异（Gini系数）
            def gini_coefficient(values):
                values = sorted(values)
                n = len(values)
                if n == 0:
                    return 0
                total = sum(values)
                if total == 0:
                    return 0
                cumulative = 0
                for i, value in enumerate(values):
                    cumulative += (i + 1) * value
                return (2 * cumulative) / (n * total) - (n + 1) / n

            group_names_gini = []
            group_gini_commit = []
            group_gini_change_lines = []
            for repo in repos:
                commit_count_per_people = {id: 0 for id in repo["group_member_ids"]}
                change_lines_per_people = {id: 0 for id in repo["group_member_ids"]}
                for commit in repo["commits"]:
                    author_id = commit.get("author_id")
                    if author_id not in commit_count_per_people:
                        commit_count_per_people[author_id] = 0
                        change_lines_per_people[author_id] = 0
                    commit_count_per_people[author_id] += 1
                    change_lines_per_people[author_id] += commit.get(
                        "insertions", 0
                    ) + commit.get("deletions", 0)
                commit_counts = list(commit_count_per_people.values())
                add_lines = list(change_lines_per_people.values())
                gini_commit = gini_coefficient(commit_counts)
                gini_add_lines = gini_coefficient(add_lines)
                group_names_gini.append(repo["group_name"])
                group_gini_commit.append(gini_commit)
                group_gini_change_lines.append(gini_add_lines)
            chart_data[semestar]["contribution_difference"] = {
                "group_names": group_names_gini,
                "gini_commit": group_gini_commit,
                "gini_add_lines": group_gini_change_lines,
            }

            # 11. commit message信息统计
            def classify_message(message):
                chinese_chars = re.findall(r"[\u4e00-\u9fff]", message)
                english_words = re.findall(r"\b[a-zA-Z]+\b", message)
                chinese_count = len(chinese_chars)
                english_count = len(english_words)
                total_count = chinese_count + english_count
                if total_count == 0:
                    return "mixed", 0
                if (
                    chinese_count >= 0.4 * total_count
                    and english_count >= 0.4 * total_count
                ):
                    lang = "mixed"
                elif chinese_count > english_count:
                    lang = "chinese"
                elif english_count > chinese_count:
                    lang = "english"
                else:
                    lang = "mixed"
                return lang, total_count

            def get_length_distribution(lengths, bin_width=5):
                if not lengths:
                    return []
                min_len = min(lengths)
                max_len = max(lengths)
                num_bins = math.ceil((max_len - min_len + 1) / bin_width)
                bins = [0] * num_bins
                for length in lengths:
                    index = min((length - min_len) // bin_width, num_bins - 1)
                    bins[index] += 1
                distribution = []
                for i, count in enumerate(bins):
                    range_start = min_len + i * bin_width
                    range_end = range_start + bin_width - 1
                    distribution.append(
                        {"length_range": f"{range_start}–{range_end}", "count": count}
                    )
                return distribution

            lang_counter = {"chinese": 0, "english": 0, "mixed": 0}
            lengths = []
            for repo in repos:
                for commit in repo["commits"]:
                    lang, length = classify_message(commit.get("message", ""))
                    if lang in lang_counter:
                        lang_counter[lang] += 1
                    if length <= 100:
                        lengths.append(length)
            distribution = get_length_distribution(lengths)
            chart_data[semestar]["commit_message_info"] = {
                "lang_counter": lang_counter,
                "length_distribution": distribution,
            }
        self.chart_data = chart_data
        self._save_json(self.chart_data_path, self.chart_data)
        self._log("图表数据生成完成。")

    # ========== 6. 保存所有数据 ===========
    def save_all(self):
        self._save_json(self.tmp_path, self.tmp_data)
        self._save_json(self.chart_data_path, self.chart_data)
        self._log("所有数据已保存。")

    def auto_run(self):
        """
        一键自动完成所有数据爬取、过滤、图表生成和保存。
        正确的调用顺序：
        1. 获取 GitHub Classroom 成员信息
        2. 获取作业的小组成员信息
        3. 关联小组成员与 classroom 成员
        4. 收集本地仓库数据
        5. 获取远程提交作者信息
        6. 过滤提交信息
        7. 获取远程 PR/Issue/分支信息
        8. 生成图表数据
        9. 保存所有数据
        """
        self._log("======= 一键自动开始全流程 =======")
        
        # 1. 获取 GitHub Classroom 成员信息
        self._log("步骤 1: 获取 GitHub Classroom 成员信息")
        # self.get_classroom_members()
        
        # 2. 获取作业的小组成员信息
        self._log("步骤 2: 获取作业的小组成员信息")
        # self.get_accepted_assignments()
        
        # 3. 关联小组成员与 classroom 成员
        self._log("步骤 3: 关联小组成员与 classroom 成员")
        # self.join_classroom_members_with_group_members()
        
        # 4. 收集本地仓库数据
        self._log("步骤 4: 收集本地仓库数据")
        # self.gather_data_from_local_repos()
        
        # 5. 获取远程提交作者信息
        self._log("步骤 5: 获取远程提交作者信息")
        self.fetch_commit_authors()
        
        # 6. 过滤提交信息
        self._log("步骤 6: 过滤提交信息")
        self.filter_commits_by_classroom_user()
        
        # 7. 获取远程 PR/Issue/分支信息
        self._log("步骤 7: 获取远程 PR 信息")
        self.fetch_prs()
        
        self._log("步骤 8: 获取远程 Issue 信息")
        self.fetch_issues()
        
        self._log("步骤 9: 获取远程分支信息")
        self.fetch_branches()
        
        # 8. 生成图表数据
        self._log("步骤 10: 生成图表数据")
        self.generate_chart_data()
        
        # 9. 保存所有数据
        self._log("步骤 11: 保存所有数据")
        self.save_all()
        
        self._log("======= 全流程自动完成 =======")


# ========== 用法示例 ===========
if __name__ == "__main__":
    spider = GithubClassroomSpider()
    spider.auto_run()
    # spider.get_project_assignment_id()
    # spider.get_accepted_assignments()
    # spider.join_classroom_members_with_group_members()
    # spider.filter_commits_by_classroom_user()
    # spider.gather_data_from_local_repos()
    # spider.filter_commits_by_classroom_user()
    # spider.generate_chart_data()
