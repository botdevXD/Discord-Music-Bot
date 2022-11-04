const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, time } = require('discord.js');

module.exports = {
    SlashCommandData: new SlashCommandBuilder()
    .setName('currentsong')
    .setDescription('Returns the current song playing!'),

    execute: async(BotClient, interaction) => {
        //
        let MusicQueue = BotClient.player.getQueue(interaction.guild.id)
        MusicQueue = (typeof MusicQueue != "undefined") ? MusicQueue : BotClient.player.createQueue(interaction.guild.id)
        
        let CurrentSongEmbed = new EmbedBuilder()
        CurrentSongEmbed.setTitle(`${BotClient.user.username} Current Song`)
        CurrentSongEmbed.setColor("Green");

        if (typeof MusicQueue.connection == "undefined"){
            CurrentSongEmbed.setColor("Red");
            CurrentSongEmbed.setDescription("I have to be connected to a voice channel to use this command!")

            return interaction.reply({embeds: [CurrentSongEmbed]})
        }

        await interaction.deferReply()

        if (MusicQueue.isPlaying){
            CurrentSongEmbed.setDescription(`Playing '${MusicQueue.nowPlaying}'`)
        }else{
            CurrentSongEmbed.setDescription("There is no song playing currently!")
        }

        return interaction.editReply({embeds: [CurrentSongEmbed]})

        //
    }
}