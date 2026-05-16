import argparse
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import ssl
from collections import Counter
from datetime import datetime, timedelta, timezone

try:
    import dotenv
except ImportError:
    dotenv = None


DEFAULT_ORG = "sustech-cs304"
DEFAULT_SEMESTER = "26spring"
DEFAULT_START = "2026-02-01"
DEFAULT_END = "2026-06-30"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUTPUT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "static", "chart_data.json"))


def parse_date(value, end_of_day=False):
    hour, minute, second = (23, 59, 59) if end_of_day else (0, 0, 0)
    return datetime.fromisoformat(value).replace(
        hour=hour,
        minute=minute,
        second=second,
        microsecond=0,
        tzinfo=timezone(timedelta(hours=8)),
    )


def parse_github_time(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def semester_display_name(semester_key):
    match = re.fullmatch(r"(\d{2})(spring|fall)", semester_key.lower())
    if not match:
        return semester_key
    year, term = match.groups()
    return f"{year} {term.capitalize()}"


def extract_team_name(semester_key, repo_name):
    match = re.fullmatch(
        rf"team-project-{re.escape(semester_key)}-(.+)",
        repo_name,
        flags=re.IGNORECASE,
    )
    if match:
        suffix = match.group(1)
        numbered_team = re.fullmatch(r"\d{2}s-(\d+)", suffix, flags=re.IGNORECASE)
        if numbered_team:
            return numbered_team.group(1)
        return suffix
    return repo_name


def parse_next_link(link_header):
    for item in link_header.split(","):
        match = re.match(r'\s*<([^>]+)>;\s*rel="([^"]+)"', item)
        if match and match.group(2) == "next":
            return match.group(1)
    return None


class GitHubDashboardCollector:
    def __init__(self, token, organization, semester, start, end):
        self.organization = organization
        self.semester = semester.lower()
        self.start = start
        self.end = end
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "sustech-cs304-dashboard-script",
        }

    def log(self, message):
        print(f"[api-dashboard] {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - {message}")

    def request(self, url, params=None):
        if params:
            separator = "&" if "?" in url else "?"
            url = f"{url}{separator}{urllib.parse.urlencode(params)}"
        for attempt in range(4):
            request = urllib.request.Request(url, headers=self.headers, method="GET")
            try:
                return urllib.request.urlopen(request, timeout=30)
            except urllib.error.HTTPError as error:
                if error.code == 403 and error.headers.get("X-RateLimit-Remaining") == "0":
                    reset_at = int(error.headers.get("X-RateLimit-Reset", "0"))
                    wait_seconds = max(reset_at - int(time.time()) + 5, 5)
                    self.log(f"Rate limit reached. Sleeping {wait_seconds}s.")
                    time.sleep(wait_seconds)
                    continue
                if error.code in {500, 502, 503, 504} and attempt < 3:
                    time.sleep(2**attempt)
                    continue
                raise
            except (urllib.error.URLError, TimeoutError, ssl.SSLError) as error:
                if attempt < 3:
                    wait_seconds = 2**attempt
                    self.log(f"Request failed ({error}). Retrying in {wait_seconds}s.")
                    time.sleep(wait_seconds)
                    continue
                raise
        raise RuntimeError(f"GitHub request failed after retries: {url}")

    def paginate(self, url, params=None):
        params = dict(params or {})
        params.setdefault("per_page", 100)
        while url:
            response = self.request(url, params=params)
            with response:
                yield from json.loads(response.read().decode("utf-8"))
                url = parse_next_link(response.headers.get("Link", ""))
            params = None

    def get_accepted_repositories(self, assignment_id):
        url = f"https://api.github.com/assignments/{assignment_id}/accepted_assignments"
        repos = []
        for item in self.paginate(url):
            repo = item.get("repository") or {}
            repo_name = repo.get("name")
            if not repo_name:
                continue
            repos.append(
                {
                    "repo_name": repo_name,
                    "group_name": extract_team_name(self.semester, repo_name),
                }
            )
        repos.sort(key=lambda item: item["group_name"])
        return repos

    def get_branches(self, repo_name):
        url = f"https://api.github.com/repos/{self.organization}/{repo_name}/branches"
        return [branch["name"] for branch in self.paginate(url)]

    def get_unique_commits_from_all_branches(self, repo_name, branches):
        commits_by_sha = {}
        since = self.start.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        until = self.end.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

        for branch in branches:
            url = f"https://api.github.com/repos/{self.organization}/{repo_name}/commits"
            params = {"sha": branch, "since": since, "until": until}
            for item in self.paginate(url, params=params):
                sha = item.get("sha")
                commit = item.get("commit") or {}
                author = commit.get("author") or {}
                date_value = author.get("date")
                if not sha or not date_value:
                    continue
                committed_at = parse_github_time(date_value)
                if self.start <= committed_at.astimezone(self.start.tzinfo) <= self.end:
                    commits_by_sha[sha] = committed_at

        return list(commits_by_sha.values())

    def count_issues(self, repo_name):
        url = f"https://api.github.com/repos/{self.organization}/{repo_name}/issues"
        start_utc = self.start.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        count = 0
        for item in self.paginate(url, params={"state": "all", "since": start_utc}):
            if "pull_request" in item:
                continue
            created_at = parse_github_time(item["created_at"]).astimezone(self.start.tzinfo)
            if self.start <= created_at <= self.end:
                count += 1
        return count

    def count_pull_requests(self, repo_name):
        url = f"https://api.github.com/repos/{self.organization}/{repo_name}/pulls"
        count = 0
        for item in self.paginate(url, params={"state": "all"}):
            created_at = parse_github_time(item["created_at"]).astimezone(self.start.tzinfo)
            if created_at < self.start:
                continue
            if created_at <= self.end:
                count += 1
        return count

    def collect(self, assignment_id):
        repos = self.get_accepted_repositories(assignment_id)
        self.log(f"Found {len(repos)} accepted repositories for {self.semester}.")
        if not repos:
            raise SystemExit(
                "No accepted repositories found. Not writing chart_data.json; "
                "please check the assignment id and token permissions."
            )

        group_names = []
        commit_counts = []
        issue_counts = []
        branch_counts = []
        pr_counts = []
        all_commit_times = []

        for index, repo in enumerate(repos, start=1):
            repo_name = repo["repo_name"]
            group_name = repo["group_name"]
            self.log(f"[{index}/{len(repos)}] Collecting {repo_name}")

            branches = self.get_branches(repo_name)
            commits = self.get_unique_commits_from_all_branches(repo_name, branches)
            issues = self.count_issues(repo_name)
            prs = self.count_pull_requests(repo_name)

            group_names.append(group_name)
            branch_counts.append(len(branches))
            commit_counts.append(len(commits))
            issue_counts.append(issues)
            pr_counts.append(prs)
            all_commit_times.extend(commits)

        return self.build_chart_data(
            group_names=group_names,
            commit_counts=commit_counts,
            issue_counts=issue_counts,
            branch_counts=branch_counts,
            pr_counts=pr_counts,
            commit_times=all_commit_times,
        )

    def build_chart_data(
        self,
        group_names,
        commit_counts,
        issue_counts,
        branch_counts,
        pr_counts,
        commit_times,
    ):
        china_tz = self.start.tzinfo
        date_counter = Counter(dt.astimezone(china_tz).date().isoformat() for dt in commit_times)
        hour_counter = Counter(dt.astimezone(china_tz).hour for dt in commit_times)

        full_dates = []
        counts_by_date = []
        current = self.start.date()
        while current <= self.end.date():
            date_key = current.isoformat()
            full_dates.append(date_key)
            counts_by_date.append(date_counter.get(date_key, 0))
            current += timedelta(days=1)

        hours = list(range(24))
        counts_by_hour = [hour_counter.get(hour, 0) for hour in hours]

        return {
            "commit_time_distribution_date": {
                "full_dates": full_dates,
                "counts": counts_by_date,
            },
            "commit_time_distribution_hourly": {
                "hours": hours,
                "counts": counts_by_hour,
            },
            "commit_count_per_repo": {
                "group_names": group_names,
                "commit_counts": commit_counts,
                "average_commit_count": average(commit_counts),
            },
            "issue_count_per_repo": {
                "group_names": group_names,
                "issue_counts": issue_counts,
                "average_issues": average(issue_counts),
            },
            "branch_count_per_repo": {
                "group_names": group_names,
                "branch_counts": branch_counts,
                "average_branches": average(branch_counts),
            },
            "pr_count_per_repo": {
                "group_names": group_names,
                "pr_counts": pr_counts,
                "average_pr": average(pr_counts),
            },
        }


def average(values):
    return round(sum(values) / len(values), 2) if values else 0


def load_existing_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def load_env_file(path):
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as file:
        for line in file:
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def save_json(path, data):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as file:
        json.dump(data, file, indent=2, ensure_ascii=False)
        file.write("\n")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate lightweight dashboard chart_data.json from GitHub API without cloning repos."
    )
    parser.add_argument("--assignment-id", required=True, help="GitHub Classroom assignment id.")
    parser.add_argument("--semester", default=DEFAULT_SEMESTER, help="Semester key, for example 26spring.")
    parser.add_argument("--organization", default=DEFAULT_ORG, help="GitHub organization name.")
    parser.add_argument("--start", default=DEFAULT_START, help="Semester start date in YYYY-MM-DD, Asia/Shanghai.")
    parser.add_argument("--end", default=DEFAULT_END, help="Semester end date in YYYY-MM-DD, Asia/Shanghai.")
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help="Output chart_data.json path. Existing semesters are preserved.",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    env_path = os.path.join(SCRIPT_DIR, ".env")
    if dotenv:
        dotenv.load_dotenv(env_path)
    else:
        load_env_file(env_path)
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise SystemExit("GITHUB_TOKEN is missing. Put it in classroom-repos/.env or export it first.")

    start = parse_date(args.start)
    end = parse_date(args.end, end_of_day=True)

    collector = GitHubDashboardCollector(
        token=token,
        organization=args.organization,
        semester=args.semester,
        start=start,
        end=end,
    )
    semester_data = collector.collect(args.assignment_id)

    chart_data = load_existing_json(args.output)
    chart_data[args.semester.lower()] = semester_data
    save_json(args.output, chart_data)

    collector.log(
        f"Wrote {semester_display_name(args.semester)} dashboard data to {os.path.abspath(args.output)}"
    )


if __name__ == "__main__":
    main()
