import json
import os
from datetime import datetime, timezone, timedelta
import requests
import re
import dotenv
from itertools import count

dotenv.load_dotenv()


API_URL = "https://api.github.com/graphql"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
if not GITHUB_TOKEN:
    raise Exception("请设置环境变量 GITHUB_TOKEN")
HEADERS = {"Authorization": f"Bearer {GITHUB_TOKEN}"}

UTC_MINUS_8 = timezone(timedelta(hours=-8))

semestar_range = {
    "25spring": (
        datetime(2025, 2, 1, tzinfo=UTC_MINUS_8),
        datetime(2025, 6, 30, tzinfo=UTC_MINUS_8),
    ),
    "24spring": (
        datetime(2024, 2, 1, tzinfo=UTC_MINUS_8),
        datetime(2024, 6, 30, tzinfo=UTC_MINUS_8),
    ),
    "23spring": (
        datetime(2023, 2, 1, tzinfo=UTC_MINUS_8),
        datetime(2023, 6, 30, tzinfo=UTC_MINUS_8),
    ),
}

classroom_users = json.load(open("./tmp/classroom_users.json", "r", encoding="UTF-8"))
classroom_user_names = set([
    u["name"] for u in classroom_users
] + [u["login"] for u in classroom_users])

def check_valid(semestar, author_name, datatime):
    """
    判断提交是否属于指定学期，并且用户属于 classroom。

    参数支持 datatime 是 str（ISO格式）或 datetime.datetime 对象。
    """
    if semestar not in semestar_range:
        return False, f"学期不存在 {semestar}"

    start_date, end_date = semestar_range[semestar]

    # 如果是字符串，转换为 datetime；如果已是 datetime 就跳过
    if isinstance(datatime, str):
        try:
            datatime = datetime.fromisoformat(datatime.replace("Z", "+00:00"))
        except Exception as e:
            print(f"⚠️ 无法解析时间: {datatime}, 错误: {e}")
            return False, f"无法解析时间: {datatime}, 错误: {e}"

    # 判断时间范围 + 用户是否在 classroom 中
    time_check = start_date <= datatime <= end_date
    time_check_info = f"({start_date.isoformat()} <= {datatime.isoformat()} <= {end_date.isoformat()})"

    author_check = author_name in classroom_user_names
    author_check_info = author_name

    # return time_check or author_check, f"{time_check_info} {author_check_info}"
    return time_check, f"{time_check_info} {author_check_info}"

def check_repo_name_valid(semestar_name, repo_path):
    folder_name = os.path.basename(os.path.normpath(repo_path))
    if semestar_name == "25spring":
        match_res = re.match(r"team-project-25spring-(team[_-]?\d+|\d+)$", folder_name)
        if match_res:
            return match_res.group(1)
        else:
            return None
    elif semestar_name == "24spring":
        match_res = re.match(r"team-project-24spring-(team[_-]?\d+|\d+)$", folder_name)
        if match_res:
            return match_res.group(1)
        else:
            return None
    elif semestar_name == "23spring":
        match_res = re.match(r"team-project-(\d+)$", folder_name)
        if match_res:
            return match_res.group(1)
        else:
            return None
    else:
        raise Exception(f"Invalid semestar name: {semestar_name}")



def run_query(query, variables):
    response = requests.post(API_URL, json={"query": query, "variables": variables}, headers=HEADERS)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"GraphQL query failed: {response.status_code}\n{response.text}")
    
def extract_semestar_name_from_path(path):
    # folder: team-project-23spring-submissions
    match = re.search(r"team-project-(\w+)-submissions", path)
    if match:
        return f"{match.group(1)}"
    else:
        raise Exception(f"Invalid folder name: {path}")

def remove_duplicate_commitors(commits):
    commitors_idx_counter = count()
    commitor_names = {}
    commitor_emails = {}

    for commit in commits:
        if "[bot]" in commit["author_name"]:
            continue
        author_name = commit["author_name"]
        author_email = commit["author_email"]
        if (author_name not in commitor_names) and (author_email not in commitor_emails):
            new_idx = next(commitors_idx_counter)
            commitor_names[author_name] = new_idx
            commitor_emails[author_email] = new_idx
        elif (author_name in commitor_names) and (author_email not in commitor_emails):
            commitor_emails[author_email] = commitor_names[author_name]
        elif (author_name not in commitor_names) and (author_email in commitor_emails):
            commitor_names[author_name] = commitor_emails[author_email]
        else:
            if commitor_names[author_name] != commitor_emails[author_email]:
                true_id, fake_id = min(commitor_names[author_name], commitor_emails[author_email]), max(commitor_names[author_name], commitor_emails[author_email])
                for key, value in commitor_names.items():
                    if value == fake_id:
                        commitor_names[key] = true_id
                for key, value in commitor_emails.items():
                    if value == fake_id:
                        commitor_emails[key] = true_id
                
        commit["author_idx_in_group"] = commitor_names[author_name]
            


