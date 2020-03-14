### Node.js Web Backend

##### Function
- Auth method: session & cookie. Sessions are stored at redis which is able to be modified in .env file. Cookie and session config is global and is in app.js,
- Scheduled job: using node-schedule.
- CURD of users
- Migration & Seed
- Upload Files
- Phone login & logup(tencent sms service)

##### Backend scaffold module 
- Using just one command to generate models,migrations,controllers!
1. put model xlsx files in ./saffold/model folder.
1. in root dir, run
```node scaffold/scaffold.js```
(make sure scaffold folder is in root direction)
2. follow guide step by step.

##### Frame,modules
- express
- ORM: Sequelize
- DATABASE: mysql
- Redis


###### v2.0
- add backend scaffold module.

###### v1.0
- implement basic function as mentioned 
