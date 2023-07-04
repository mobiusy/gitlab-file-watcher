# GitLab Change Notifier

[中文](README.zh-CN.md)

This project is a simple tool for monitoring file changes to GitLab repositories and sending notifications via email.

My use case is to monitor error code file in GitLab repository and send an email notification to people who concerned when the file is changed.

## Usage

### Run by node

To use this tool, you'll need to do the following:

1. Clone the repository to your local machine.
2. Install the required dependencies by running `npm install`.
3. Create a `.env` file in the root directory of the project and add the following environment variables:

    ```bash
    # gitlab config
    GITLAB_URL=https://gitlab.com
    # relative path from repository root to the file you want to check
    FILE_PATH=src/lib/exception-code.ts
    # format: namespace/repository
    REPOSITORY=your-group/repository-name
    # how to generate your private token, see: https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token
    PRIVATE_TOKEN=xxxxxxxxxxxx
    # commit since time, format: YYYY-MM-DDTHH:mm:ssZ
    SINCE=2023-07-04T08:00:00.000Z

    # Running schedule
    # Cron-style Scheduling, see: https://crontab.guru
    SCHEDULE=*/5 * * * *

    # email config
    EMAIL_HOST=smtp.domain.com
    PORT=465
    SECURE=true
    AUTH_USER=your-email@example.com
    AUTH_PASS=your-email-password
    # recipients, split by comma
    RECIPIENTS=tom@example.com,jerry@example.com
    ```

5. Run the tool by running `npm run start`.

### Run by docker

under root directory of the project, run:
 
```bash
docker build -t gitlab-change-notifier:latest .
docker run -d \
    -v /absolute/path/to/.env:/app/.env \
    --name gitlab-change-notifier \
    --restart=always \
    gitlab-change-notifier:latest
```

### Run by docker-compose

under root directory of the project, run:

```bash
docker-compose up -d
```