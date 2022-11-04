const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, time, ActionRowBuilder, ButtonBuilder, ButtonStyle, Embed } = require('discord.js');

const DiscordMusicUtil = require("discord-music-player/dist/utils/Utils.js")

function IsPlayList(Search) {
    let SpotifyPlaylistLink = DiscordMusicUtil.Utils.regexList.SpotifyPlaylist.test(Search);
    let YouTubePlaylistLink = DiscordMusicUtil.Utils.regexList.YouTubePlaylist.test(Search);
    let ApplePlaylistLink = DiscordMusicUtil.Utils.regexList.ApplePlaylist.test(Search);

    if (SpotifyPlaylistLink){
        return true
    }

    if (YouTubePlaylistLink){
        return true
    }

    if (ApplePlaylistLink){
        return true
    }

    return false
}


function SetupPlayingPanel(BotClient, interaction, PlayEmbed){
    let MusicQueue = BotClient.player.getQueue(interaction.guild.id)

    const MusicPlayRow1 = new ActionRowBuilder();
    const MusicPlayRow2 = new ActionRowBuilder();
    const PauseSongButton = new ButtonBuilder();
    PauseSongButton.setCustomId("music_pause_song");
    PauseSongButton.setLabel('Pause');
    PauseSongButton.setStyle(ButtonStyle.Primary);

    const ResumeSongButton = new ButtonBuilder();
    ResumeSongButton.setCustomId("music_resume_song");
    ResumeSongButton.setLabel('Resume');
    ResumeSongButton.setStyle(ButtonStyle.Primary);

    const SkipSongButton = new ButtonBuilder();
    SkipSongButton.setCustomId("music_skip_song");
    SkipSongButton.setLabel('Skip');
    SkipSongButton.setStyle(ButtonStyle.Primary);
    
    const VolumeUpButton = new ButtonBuilder();
    VolumeUpButton.setCustomId("music_volume_up_song");
    VolumeUpButton.setLabel('Volume Up');
    VolumeUpButton.setStyle(ButtonStyle.Primary);

    const VolumeDownButton = new ButtonBuilder();
    VolumeDownButton.setCustomId("music_volume_down_song");
    VolumeDownButton.setLabel('Volume Down');
    VolumeDownButton.setStyle(ButtonStyle.Primary);

    const DisconnectButton = new ButtonBuilder();
    DisconnectButton.setCustomId("music_disconnect_song");
    DisconnectButton.setLabel('Disconnect');
    DisconnectButton.setStyle(ButtonStyle.Primary);

    MusicPlayRow1.addComponents(PauseSongButton, ResumeSongButton, SkipSongButton, VolumeUpButton, VolumeDownButton);
    MusicPlayRow2.addComponents(DisconnectButton);

    const filter = (filter_interaction) => {
        if (filter_interaction.user.id == interaction.user.id){
            return true
        }else{
            return false
        }
    };

    const collector = interaction.channel.createMessageComponentCollector({filter: filter, max: 1000000, time: ((60 * 25) * 60) * 1000 });

    let MusicValues = {
        Paused: false,
        Volume: 100,
        QueueEmpty: false
    }

    async function ButtonHandler(ButtonInteraction){
        await ButtonInteraction.deferUpdate();

        MusicQueue = BotClient.player.getQueue(interaction.guild.id)

        if (MusicQueue == null){
            return ButtonInteraction.deleteReply();
        }

        if (ButtonInteraction.customId != null){
            if (ButtonInteraction.customId == "music_pause_song"){
                if (MusicValues.Paused == false){
                    MusicValues.Paused = true

                    MusicQueue.setPaused(true)
                }
            }// Pause Song
            else if (ButtonInteraction.customId == "music_resume_song"){
                if (MusicValues.Paused == true){
                    MusicValues.Paused = false

                    MusicQueue.setPaused(false)
                }
            }// Resume Song
            else if (ButtonInteraction.customId == "music_skip_song"){
                MusicQueue.skip()
            }// Skip Song
            else if (ButtonInteraction.customId == "music_volume_up_song"){
                if (MusicValues.Volume < 200){
                    MusicValues.Volume = MusicValues.Volume + 50
                    MusicQueue.setVolume(MusicValues.Volume)
                }
            }// Song Volume Up
            else if (ButtonInteraction.customId == "music_volume_down_song"){
                if (MusicValues.Volume >= 100){
                    MusicValues.Volume = MusicValues.Volume - 50
                    MusicQueue.setVolume(MusicValues.Volume)
                }
            }// Song Volume Down
            else if (ButtonInteraction.customId == "music_disconnect_song"){
                return MusicQueue.leave()
            }// Song Stop / Disconnect
        }

        PlayEmbed.setDescription(`Now playing '${MusicQueue.nowPlaying}'`)
        return ButtonInteraction.editReply({embeds: [PlayEmbed], components: [MusicPlayRow1, MusicPlayRow2]});
    }

    function SongChanged(_, newSong, _){
        MusicQueue = BotClient.player.getQueue(interaction.guild.id)

        if (newSong != null && MusicQueue != null){
            PlayEmbed.setDescription(`Now playing '${newSong}'`)
            return interaction.editReply({embeds: [PlayEmbed], components: [MusicPlayRow1, MusicPlayRow2]});
        }
    }

    function SongAdded(_, newSong){
        MusicQueue = BotClient.player.getQueue(interaction.guild.id)

        if (newSong != null && MusicQueue != null){
            if (MusicValues.QueueEmpty){
                MusicValues.QueueEmpty = false
                PlayEmbed.setDescription(`Now playing '${newSong}'`)
                return interaction.editReply({embeds: [PlayEmbed], components: [MusicPlayRow1, MusicPlayRow2]});
            }
        }
    }


    function NoSongsLeftInQueue(){
        MusicQueue = BotClient.player.getQueue(interaction.guild.id)

        if (MusicQueue != null){
            MusicValues.QueueEmpty = true
            PlayEmbed.setDescription(`There is currently no songs in the queue!`)
            return interaction.editReply({embeds: [PlayEmbed], components: [MusicPlayRow1, MusicPlayRow2]});
        }
    }

    function BotDisconnected(queue){
        BotClient.RemoveFromArray(BotClient.GuildsPlayCommandActivations, interaction.guild.id)
        collector.off("collect", ButtonHandler)
        BotClient.player.off("channelEmpty", BotDisconnected)
        BotClient.player.off("clientDisconnect", BotDisconnected)
        BotClient.player.off("queueDestroyed", BotDisconnected)
        BotClient.player.off("queueEnd", NoSongsLeftInQueue)
        BotClient.player.off("songChanged", SongChanged)
        BotClient.player.off("songAdd", SongAdded)
        interaction.deleteReply();
    }

    BotClient.player.on("songChanged", SongChanged)
    BotClient.player.on("songAdd", SongAdded)
    BotClient.player.on("channelEmpty", BotDisconnected)
    BotClient.player.on("clientDisconnect", BotDisconnected)
    BotClient.player.on("queueDestroyed", BotDisconnected)
    BotClient.player.on("queueEnd", NoSongsLeftInQueue)

    collector.on("collect", ButtonHandler)

    PlayEmbed.setDescription(`Now playing '${MusicQueue.nowPlaying}'`)
    return interaction.editReply({embeds: [PlayEmbed], components: [MusicPlayRow1, MusicPlayRow2]})
}

module.exports = {
    SlashCommandData: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays the specified music in ur voice channel!')
    .addStringOption(option => option.setName("query").setDescription("provide a song url / name to play! (Supports Youtube, Spotify, Apple Music, SoundCloud)").setRequired(true)),
    
    execute: async(BotClient, interaction) => {
        //
        const SongUrl = interaction.options.get("query").value
        let MusicQueue = BotClient.player.getQueue(interaction.guild.id)
        MusicQueue = (typeof MusicQueue != "undefined") ? MusicQueue : BotClient.player.createQueue(interaction.guild.id)
        
        let PlayEmbed = new EmbedBuilder()
        PlayEmbed.setTitle(`${BotClient.user.username} Play`)
        PlayEmbed.setColor("Green");

        if (typeof MusicQueue.connection == "undefined"){
            PlayEmbed.setColor("Red");
            PlayEmbed.setDescription("I have to be connected to a voice channel to use this command!")

            return interaction.reply({embeds: [PlayEmbed]})
        }

        await interaction.deferReply()

        let IsBotPlaying = MusicQueue.isPlaying

        function PlayHandler(song){
            PlayEmbed.setColor("Green");

            if (IsBotPlaying == false){
                IsBotPlaying = MusicQueue.isPlaying

                if (!BotClient.FindInArray(BotClient.GuildsPlayCommandActivations, interaction.guild.id)){
                    BotClient.GuildsPlayCommandActivations.push(interaction.guild.id)
                    return SetupPlayingPanel(BotClient, interaction, PlayEmbed)
                }else{
                    interaction.deleteReply()
                }
            }else{
                PlayEmbed.setDescription(`Added '${song.name}' to the queue`)
                return interaction.editReply({embeds: [PlayEmbed]})
            }
        }

        function PlayFailed(song){
            if (MusicQueue.isPlaying){
                return SetupPlayingPanel(BotClient, interaction, PlayEmbed)
            }

            PlayEmbed.setColor("Red");
            PlayEmbed.setDescription("Failed to find / play song! (Supports Youtube, Spotify, Apple Music, SoundCloud)")
            return interaction.editReply({embeds: [PlayEmbed]})
        }

        if (!IsPlayList(SongUrl.toString())){
            await MusicQueue.play(SongUrl.toString()).then((song) => {
                return PlayHandler(song)
            }).catch((err) => {
                return PlayFailed()
            })
        }else{
            await MusicQueue.playlist(SongUrl.toString()).then((song) => {
                return PlayHandler(song)
            }).catch((err) => {
                return PlayFailed()
            })
        }
        //
    }
}