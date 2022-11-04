const { Client, GatewayIntentBits, REST, Routes, PermissionFlagsBits } = require('discord.js');
const Axios = require("axios");
const { Player, RepeatMode } = require("discord-music-player");
const FileSystem = require("fs");
const {PRODUCTION_TOKEN, OWNER_IDS} = require("./BotConfig.json");
let Token = PRODUCTION_TOKEN;
const rest = new REST({ version: '10' }).setToken(Token);
const BotClient = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

const player = new Player(BotClient, {
    leaveOnEmpty: true,
    leaveOnStop: false,
    leaveOnEnd: false,
    deafenOnJoin: true
});

const TimepatternValues = {
	["m"]: 60,
	["h"]: 3600,
	["d"]: 86400
};

function alphaOnly(a) {
    var b = '';
    for (var i = 0; i < a.length; i++) {
        if (a[i] >= 'A' && a[i] <= 'z') b += a[i] + " ";
    }
    return b;
};

function TimeStringtoSeconds(str) {
	let totalSeconds = 0;
    let characters = alphaOnly(str).split(" ");

	str.match(/[^a-zA-Z]+/g).forEach((Number, Index) => {
        const Character = characters[Index];
		const Pattern = TimepatternValues[Character];

		if (Pattern){
			totalSeconds = totalSeconds + (Pattern * Number);
		};

    });
	return totalSeconds;
};

function SetupSlashCommandForGuild(GUILD_ID){
    return rest.put(Routes.applicationGuildCommands(BotClient.user.id.toString(), GUILD_ID.toString()), {
        body: BotClient.SlashCommandsJSON
    }).then(() => {}).catch({});
};

function LoadSlashCommandsIntoArrays(callback){
    BotClient.SlashCommandsJSON = [];
    BotClient.SlashCommands = [];

    return FileSystem.readdir(__dirname + "/SlashCommands", async (Error, Files) => {
        if (Error) {
            return console.log(`Failed to access SlashCommands folder!`);
        };
    
        for (const [_, File] of Object.entries(Files)){
            await FileSystem.promises.readFile(__dirname + "/SlashCommands/" + File, "ascii").then((Data) => {
                const SlashCommandContents = eval(Data.toString())

                BotClient.SlashCommandsJSON.push(SlashCommandContents.SlashCommandData.toJSON());
                BotClient.SlashCommands[SlashCommandContents.SlashCommandData.name] = SlashCommandContents.execute;
            }).catch((err) => {})
        };

        if (typeof callback != "undefined" & callback != null){
            return callback()
        }
    });
};

BotClient.TimeStringtoSeconds = TimeStringtoSeconds;
BotClient.Token = Token;
BotClient.Axios = Axios;
BotClient.OwnerIDs = OWNER_IDS;
BotClient.player = player;
BotClient.RepeatMode = RepeatMode;
BotClient.SetupSlashCommandForGuild = SetupSlashCommandForGuild;
BotClient.DirectoryName = __dirname
BotClient.SlashCommandsJSON = [];
BotClient.SlashCommands = [];
BotClient.LoadSlashCommandsIntoArrays = LoadSlashCommandsIntoArrays;
BotClient.GuildsPlayCommandActivations = [];
BotClient.FindInArray = function(Array, STR){
    if (Array.indexOf(STR) <= -1){
        return false;
    }else{
        return true;
    };
};

BotClient.RemoveFromArray = function(Array, STR){
    const ArrayIndex = Array.indexOf(STR);

    if (ArrayIndex > -1){
        return Array.splice(ArrayIndex, 1);
    };
};

// Load Slash Commands into our array
LoadSlashCommandsIntoArrays();

// Bot Started
BotClient.on("ready", () => {
    console.log(`Bot started as ${BotClient.user.tag}`);

    BotClient.user.setStatus("dnd");
    BotClient.user.setActivity({
        name: "Playing music for everyone!"
    });

    BotClient.guilds.cache.forEach(guild => {
        SetupSlashCommandForGuild(guild.id)
    });
});

// Discord Slash Command Listener
BotClient.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand){return};

    if (BotClient.SlashCommands[interaction.commandName] != null){
        return BotClient.SlashCommands[interaction.commandName](BotClient, interaction);
    }
});

BotClient.on("guildCreate", (Guild) => {
    return SetupSlashCommandForGuild(Guild.id)
});

// Bot Init / Login
BotClient.login(Token);