# GitLab变更通知器

[English](README.md)

 这个项目是一个简单的工具，用于监控GitLab仓库中文件的变更，并通过电子邮件发送通知。
 我的使用案例是监控GitLab仓库中的错误代码文件，并在文件变更时向相关人员发送电子邮件通知。

## 使用方法
### 使用Node运行
要使用这个工具，您需要执行以下步骤：
1. 将仓库克隆到您的本地机器。
2. 运行  `npm install`  安装所需的依赖项。
3. 在项目的根目录下创建一个  `.env`  文件，并添加以下环境变量：
    ```bash
    # gitlab配置
    GITLAB_URL=https://gitlab.com
    # 相对于仓库根目录的文件路径，您想要检查的文件
    FILE_PATH=src/lib/exception-code.ts
    # 格式：命名空间/仓库
    REPOSITORY=your-group/repository-name
    # 如何生成您的私有令牌，请参阅：https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html#create-a-personal-access-token
    PRIVATE_TOKEN=xxxxxxxxxxxx
    # 提交时间，格式：YYYY-MM-DDTHH:mm:ssZ
    SINCE=2023-07-04T08:00:00.000Z
     # 运行计划
    # Cron风格的调度，参见：https://crontab.guru
    SCHEDULE=*/5 * * * *
     # 电子邮件配置
    EMAIL_HOST=smtp.domain.com
    PORT=465
    SECURE=true
    AUTH_USER=your-email@example.com
    AUTH_PASS=your-email-password
    # 收件人，用逗号分隔
    RECIPIENTS=tom@example.com,jerry@example.com
    ```
4. 运行  `npm run start`  启动工具。
   
### 使用Docker运行

在项目的根目录下运行以下命令：
  ```bash
  docker build -t gitlab-change-notifier .
  docker run -d \
    -v /path/to/your/.env:/app/.env \
    --name gitlab-change-notifier \
    --restart=always \
    gitlab-change-notifier
  ```
### 使用Docker Compose运行
在项目的根目录下运行以下命令：
```docker-compose up -d```