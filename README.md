# Job Posting - Backend

A service which helps recruiters post jobs and find the most suitable candidates among the applicants.
Refer the [Helper File](helperFile.txt) for a walkthrough of testing from Postman.

## Endpoints

### Recruiter

Use `/recruiters` before every mentioned endpoint.

- signup: `POST: /`
- login: `POST: /login`
- logout: `POST: /logout`
- logout of multiple sessions: `POST: /logoutAll`
- Fetch Personal details: `GET: /me`
- Update personal details. `PATCH: /me`
- Fetch job posts: `GET: /jobs`
- Post a job. `POST: /jobs`
- Update Job details: `PATCH: /jobs`
- Get particular job details: `/jobs/:job_id`
- Update Particular Job details: `PATCH: /jobs/:job_id`
- Reject or accept a candidate: `POST: /jobs/:job_id/:candidate_id/:outcome`

### Candidate

Use `/candidates` before every mentioned endpoint.

- signup: `POST: /`
- login: `POST: /login`
- logout: `POST: /logout`
- logout of multiple sessions: `POST: /logoutAll`
- Fetch Personal details: `GET: /me`
- Update personal details. `PATCH: /me`
- Fetch job applications: `GET: /applications`
- Apply for a job. `POST: /applications/:job_id`
- Delete Job application: `DELETE: /applications/:job_id`
- Fetch all drafts: `/drafts`
- Save as draft: `PATCH: /drafts/:job_id`
- Delete or publish draft: `POST: /drafts/:job_id/:option`

### Mails

Mails are sent when a candidate applies for a job and when a recruiter accepts/rejects the candidate. nodemailer is used for the purpose and mails are sent via smtp but if you have your own domain conside OAuth.

## Config

You need a `dev.env` file to run in development environment.

You're required to create you'r own config folder with `dev.env` file containing

- PORT
- JWT_SECRET
- MONGODB_URL
- MailId
- MailPassword

## cloning and starting application

- Clone:

  ```bash
  git clone <repo>
  cd <repo_name>
  ```

- install packages and dev-dependencies:

  ```
  npm install
  ```

- create `config` folder and file as mentioned above.
- start development server

  ```
  npm run dev
  ```
