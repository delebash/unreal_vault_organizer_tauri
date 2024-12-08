# Unreal Vault Organizer (unreal-vault-organizer-tauri)

Organizer your Unreal vault the way you want.  Tired of not being able to add custom tags or search and sort your vault then give UVO a try.

![Screenshot 2024-12-07 212127](Screenshot%202024-12-07%20212127.png)


![Screenshot 2024-12-07 212153](Screenshot%202024-12-07%20212153.png)


![Screenshot 2024-12-07 212215](Screenshot%202024-12-07%20212215.png)


Intro video:

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/Rl1VeQUUC00/0.jpg)](https://www.youtube.com/watch?v=Rl1VeQUUC00)

Thanks to Quasar and Tauri for making development easy.

Dev Notes:

clone the repo and then to install `npm install` to run `npm run app`

create keys
npx tauri signer generate -- -w test/.tauri/myapp.key
then you will setup a github action and add a repo secret copying the value of the prive key just generated.

tauri open all in external url just add the shell plugin and set the default:shell permissions