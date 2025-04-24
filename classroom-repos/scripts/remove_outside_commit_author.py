import json
import os

total_classroom_user = json.load(open("./tmp/classroom_users.json", "r", encoding="utf-8"))
valid_user_ids = [u["id"] for u in total_classroom_user]

email2uid = {}
for folder in os.listdir("./tmp/users/"):
    if folder.endswith(".json"):
        remote_user_info = json.load(open("./tmp/users/" + folder, "r", encoding="utf-8"))
        for u in remote_user_info:
            if u["id"] not in valid_user_ids:
                continue
            
            if u["email"] not in email2uid:
                email2uid[u["email"]] = u["id"]
            else:
                assert email2uid[u["email"]] == u["id"], f"{folder}, {u['email']}, {u['id']}"

base_out_dir = "./tmp"
for filename in os.listdir(base_out_dir):
    if filename.endswith("local_data.json") and not filename.startswith("filtered_"):
        local_data = json.load(open(os.path.join(base_out_dir, filename), "r", encoding="utf-8"))
        new_file = []
        for repo in local_data:
            valid_commit = []
            for commit in repo["commits"]:
                if commit["author_email"] not in email2uid:
                    continue

                commit["author_id"] = email2uid[commit["author_email"]]
                valid_commit.append(commit)

            repo["commits"] = valid_commit

            if len(repo["commits"]) > 0:
                new_file.append(repo)

        with open(os.path.join(base_out_dir, "filtered_" + filename), "w", encoding="utf-8") as f:
            json.dump(new_file, f, indent=2, ensure_ascii=False)


