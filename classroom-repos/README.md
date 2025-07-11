1. create repos folder and enter it: `mkdir ./repos && cd ./repos; `
2. clone semestar repos (make sure you have [github-cli](https://github.com/cli/cli) and gh extention github/gh-classroom installed):
    * 25 Spring: `gh classroom clone student-repos -a 749620`
    * 24 Spring: `gh classroom clone student-repos -a 558214`
    * 23 Spring: `gh classroom clone student-repos -a 403123`
    * ......
    OR pull new commits (if semestar repos already exist):
    * 25 Spring: `gh classroom pull student-repos -a 749620`
    * 24 Spring: `gh classroom pull student-repos -a 558214`
    * 23 Spring: `gh classroom pull student-repos -a 403123`
``
3. Rename special semestar: `mv ./team-project-submissions ./team-project-23spring-submissions`
4. back to `classroom-repos` folder: `cd ..`
5. prepare `.env` file: `cp .env.example .env`, and then replace GITHUB_TOKEN as your own github [personal-access-token](https://github.com/settings/personal-access-tokens/) (make sure it has permission to access "sustech-cs304" organization);
6. RUN!!! `python github_classroom_spider.py`  
7. If success, we can get `chart_data.json`, move it to ../static and all done.
