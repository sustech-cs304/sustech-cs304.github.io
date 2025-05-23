# GET /classrooms/{classroom_id}/assignments

import requests

import tools

classroom_id = "sustech-cs304"
HEADERS = {
    'Authorization': f'token {tools.GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}


def get_classrooms():
    url = "https://api.github.com/classrooms"
    classrooms = []
    page = 1
    while True:
        resp = requests.get(url, headers=HEADERS, params={'page': page, 'per_page': 100})
        if resp.status_code != 200:
            print(f"Error fetching classrooms: {resp.status_code} - {resp.text}")
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
        resp = requests.get(url, headers=HEADERS, params={'page': page, 'per_page': 100})
        if resp.status_code != 200:
            print(f"Error fetching assignments: {resp.status_code} - {resp.text}")
            return []
        data = resp.json()
        if not data:
            break
        assignments.extend(data)
        page += 1
    return assignments


if __name__ == '__main__':
    print("📘 获取 Classrooms...")
    classrooms = get_classrooms()
    if not classrooms:
        print("没有找到任何 Classroom。")
        exit(1)

    for c in classrooms:
        print(f"Classroom 名称: {c['name']}")
        print(f"Classroom ID: {c['id']}")
        print("-" * 30)

    # 手动指定或选择一个 Classroom
    classroom_id = input("请输入你要查看的 Classroom ID: ").strip()

    print(f"\n📘 获取 Classroom ID 为 {classroom_id} 的所有作业...")
    assignments = get_assignments(classroom_id)
    if not assignments:
        print("该 Classroom 下没有作业。")
        exit(1)

    for a in assignments:
        print(f"作业标题: {a['title']}")
        print(f"Assignment ID: {a['id']}")
        print(f"类型: {'小组作业' if a['type'] == 'group' else '个人作业'}")
        print("-" * 30)