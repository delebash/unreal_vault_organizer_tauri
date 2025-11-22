# Unreal Vault Organizer
Organizer your Unreal vault the way you want.  Tired of not being able to add custom tags or search and sort your vault then give UVO a try.

Intro/Setup video https://youtu.be/Rl1VeQUUC00

![Screenshot 2024-12-07 212127](Screenshot%202024-12-07%20212127.png)


![Screenshot 2024-12-07 212153](Screenshot%202024-12-07%20212153.png)


![Screenshot 2024-12-07 212215](Screenshot%202024-12-07%20212215.png)


Intro video:

[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/Rl1VeQUUC00/0.jpg)](https://www.youtube.com/watch?v=Rl1VeQUUC00)

Misc:
Unreal fab api and authentication documentation

[fab-api.md](fab-api-docs/fab-api.md)

## Support:
https://discord.gg/2WkHWNDf8q

## Roadmap:

## My other projects:

Global Environmental System (GES) -- Using Unreal Engine. This system integrates Ultra Dynamic Sky Weather (potentially any Weather System) with Megascan Foliage, Trees, Props, UE Water, Ambient Wind System, and various other Systems.
https://github.com/delebash/UE_GlobalEnvironmentalSystem

Unreal Mapbox Bridge  -  Import real world locations into UE as Landscapes
https://github.com/delebash/UnrealMapboxBridgePlugin

Texture From Mesh Creator - Creates a texture from a screen shot of a Mesh.  Main puporse for this was so I could easily capture the show print of my characters so I could stamp that texture into the landscape for footprint effects.
https://github.com/delebash/TextureFromMeshCreator



Thanks to Quasar and Tauri for making development easy.

Dev Notes:

clone the repo and then to install `npm install` to run `npm run app`

Dev Notes:

create keys
npx tauri signer generate -- -w test/.tauri/myapp.key
then you will setup a github action and add a repo secret copying the value of the prive key just generated.

tauri open all in external url just add the shell plugin and set the default:shell permissions

Debug Tauri Front End:

Set Env Variabe: WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=port

via powershell
`$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9222"`

or set via system environmental variables

Webstorm debug:

Add Debug configuration Attach to Node/Chrome

Set port to same as remote-debugging-port in this case 9222

start tauri app `npm run tauri dev`

start webstorm debug session


