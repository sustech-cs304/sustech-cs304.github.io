1. enter repos folder: `cd ./repos`
2. clone semestar repos:
    * 25 Spring: `gh classroom clone student-repos -a 749620`
    * 24 Spring: `gh classroom clone student-repos -a 558214`
    * 23 Spring: `gh classroom clone student-repos -a 403123`
    * ......
    OR pull new commits:
    * 25 Spring: `gh classroom pull student-repos -a 749620`
    * 24 Spring: `gh classroom pull student-repos -a 558214`
    * 23 Spring: `gh classroom pull student-repos -a 403123`
3. Rename special semestar: `mv ./team-project-submissions ./team-project-23spring-submissions`
4. back to main folder: `cd ..`
1. gather all classroom members: `python .\script\gather_classroom_member_info.py`
5. gather data from local repos (Obtain commit data and line status data): `python .\scripts\gather_data_from_local_repos.py`
6. filter: `python .\scripts\remove_outside_commit_author.py`
7. gather data from remote repos (PR and Merge data):
   * set github token: `$env:GITHUB_TOKEN = "YOUR GITHUB TOKEN"`
   * gather pr data: `python .\scripts\gather_pr_from_remote_repos.py`
   * gather issue data: `python .\scripts\gather_issue_from_remote_repos.py`
8. prepare data to draw charts: `python .\scripts\generate_graph_data.py`

METAINFO:

Classroom names and ids:

* sustech-cs304-classroom-23spring: 152718
* 24spring: 206118
* sustech-cs304-25Spring: 253851

Assignment names and ids:
23spring Team project: 403123
24spring Team project: 558214
25spring Team project: 749620