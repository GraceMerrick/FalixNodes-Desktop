var url = window.location.href;
if(url.startsWith("https://panel.falixnodes.net/")
|| url.startsWith("https://dev-panel.falixnodes.net")
|| url.startsWith("https://prem-panel.falixnodes.net")
|| url.startsWith("https://discord.com/")
)
{} else {setTimeout(() => {location.href = 'https://panel.falixnodes.net/'}, 250);}