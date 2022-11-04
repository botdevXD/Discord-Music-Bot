const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, time } = require('discord.js');

module.exports = {
    SlashCommandData: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Adds the bot to your current voice channel!'),
    
    execute: async(BotClient, interaction) => {
        //
        let MusicQueue = BotClient.player.getQueue(interaction.guild.id)
        MusicQueue = (typeof MusicQueue != "undefined") ? MusicQueue : BotClient.player.createQueue(interaction.guild.id)
        
        let JoinEmbed = new EmbedBuilder()
        JoinEmbed.setTitle(`${BotClient.user.username} Join`)
        JoinEmbed.setColor("Green");

        if (typeof MusicQueue.connection != "undefined"){
            JoinEmbed.setColor("Red");
            JoinEmbed.setDescription("I'm already in another voice channel!")
            
            return interaction.reply({embeds: [JoinEmbed]})
        }

        MusicQueue.join(interaction.member.voice.channel).then(() => {
            JoinEmbed.setColor("Green");
            JoinEmbed.setDescription("Successfully connected to voice channel!")

            return interaction.reply({embeds: [JoinEmbed]})
        }).catch(() => {
            JoinEmbed.setColor("Red");
            JoinEmbed.setDescription("Failed to connect to voice channel!")

            return interaction.reply({embeds: [JoinEmbed]})
        })
        //
    }
}