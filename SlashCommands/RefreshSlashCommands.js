const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, time } = require('discord.js');

module.exports = {
    SlashCommandData: new SlashCommandBuilder()
    .setName('refresh_slash_commands')
    .setDescription('Refreshes all slash commands (Developer Only)!'),
    
    execute: async(BotClient, interaction) => {
        //

        await interaction.deferReply();

        if (BotClient.OwnerIDs.indexOf(interaction.user.id.toString()) <= -1){
            return interaction.editReply({content: "Only the owner can use this slash command!"});
        };

        BotClient.LoadSlashCommandsIntoArrays(async () => {
            await BotClient.guilds.cache.forEach(guild => {
                BotClient.SetupSlashCommandForGuild(guild.id)
            });

            interaction.editReply({content: "Slash Commands Updated For All Guilds!"});
        })
        //
    }
}