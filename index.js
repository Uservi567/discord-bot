require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

const TOKEN = process.env.TOKEN;

const ROLE_NAME = 'Member';
const CATEGORY_NAME = '📌 เริ่มต้น';
const VERIFY_CHANNEL_NAME = '✅│รับยศ';
const CHAT_CHANNEL_NAME = '💬│พูดคุย';
const VERIFY_BUTTON_ID = 'verify_member_role';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('clientReady', () => {
  console.log(`บอทออนไลน์แล้ว ${client.user.tag}`);
  console.log('ใช้คำสั่ง !setupverify ในห้องไหนก็ได้ เพื่อให้บอทสร้างระบบให้ทั้งหมด');
});

async function findChannelByName(guild, name, type = null) {
  return guild.channels.cache.find((ch) => {
    if (type !== null) return ch.name === name && ch.type === type;
    return ch.name === name;
  });
}

async function sendVerifyMessage(channel) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(VERIFY_BUTTON_ID)
      .setLabel('กดเพื่อรับยศ Member')
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({
    content:
      'ยินดีต้อนรับ\n\nกดปุ่มด้านล่างเพื่อรับยศ **Member** แล้วระบบจะเปิดห้องใช้งานให้คุณอัตโนมัติ',
    components: [row],
  });
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  if (message.content === '!setupverify') {
    try {
      if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
          !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return message.reply('คำสั่งนี้ใช้ได้เฉพาะแอดมินหรือคนที่มีสิทธิ์จัดการเซิร์ฟเวอร์');
      }

      const guild = message.guild;
      const botMember = await guild.members.fetchMe();

      const needPerms = [
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageRoles,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ViewChannel,
      ];

      const missingPerms = needPerms.filter(
        (perm) => !botMember.permissions.has(perm)
      );

      if (missingPerms.length > 0) {
        return message.reply(
          'บอทยังมีสิทธิ์ไม่ครบ ต้องมีอย่างน้อย: Manage Channels, Manage Roles, Send Messages, View Channels'
        );
      }

      // 1) สร้าง role Member ถ้ายังไม่มี
      let memberRole = guild.roles.cache.find((role) => role.name === ROLE_NAME);

      if (!memberRole) {
        memberRole = await guild.roles.create({
          name: ROLE_NAME,
          reason: 'สร้างยศสำหรับระบบกดรับยศอัตโนมัติ',
        });
      }

      // 2) เช็กว่าบอทอยู่สูงกว่า role Member หรือไม่
      if (memberRole.position >= botMember.roles.highest.position) {
        return message.reply(
          `บอทแจกยศ ${ROLE_NAME} ไม่ได้ เพราะ role ของบอทต้องอยู่สูงกว่า role ${ROLE_NAME}`
        );
      }

      // 3) สร้างหมวด
      let category = await findChannelByName(guild, CATEGORY_NAME, ChannelType.GuildCategory);

      if (!category) {
        category = await guild.channels.create({
          name: CATEGORY_NAME,
          type: ChannelType.GuildCategory,
          reason: 'สร้างหมวดสำหรับระบบเริ่มต้น/รับยศ',
        });
      }

      // 4) สร้างห้องรับยศ (ทุกคนเห็น)
      let verifyChannel = await findChannelByName(guild, VERIFY_CHANNEL_NAME, ChannelType.GuildText);

      if (!verifyChannel) {
        verifyChannel = await guild.channels.create({
          name: VERIFY_CHANNEL_NAME,
          type: ChannelType.GuildText,
          parent: category.id,
          reason: 'สร้างห้องกดรับยศ',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
              deny: [PermissionsBitField.Flags.SendMessages],
            },
            {
              id: botMember.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        });
      } else if (verifyChannel.parentId !== category.id) {
        await verifyChannel.setParent(category.id);
      }

      // 5) สร้างห้องพูดคุย (เฉพาะ Member)
      let chatChannel = await findChannelByName(guild, CHAT_CHANNEL_NAME, ChannelType.GuildText);

      if (!chatChannel) {
        chatChannel = await guild.channels.create({
          name: CHAT_CHANNEL_NAME,
          type: ChannelType.GuildText,
          parent: category.id,
          reason: 'สร้างห้องพูดคุยสำหรับคนที่ได้รับยศแล้ว',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: memberRole.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
            {
              id: botMember.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
        });
      } else {
        await chatChannel.permissionOverwrites.edit(guild.roles.everyone.id, {
          ViewChannel: false,
        });

        await chatChannel.permissionOverwrites.edit(memberRole.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
      }

      // 6) ส่งปุ่มในห้องรับยศ
      await sendVerifyMessage(verifyChannel);

      await message.reply(
        `ตั้งค่าระบบเรียบร้อยแล้ว\n- role: ${ROLE_NAME}\n- หมวด: ${CATEGORY_NAME}\n- ห้องรับยศ: ${VERIFY_CHANNEL_NAME}\n- ห้องสมาชิก: ${CHAT_CHANNEL_NAME}`
      );
    } catch (error) {
      console.error('SETUP ERROR:', error);
      await message.reply('เกิดข้อผิดพลาดระหว่างสร้างระบบ');
    }
  }

  if (message.content === '!sendverify') {
    try {
      const verifyChannel = await findChannelByName(
        message.guild,
        VERIFY_CHANNEL_NAME,
        ChannelType.GuildText
      );

      if (!verifyChannel) {
        return message.reply('ยังไม่พบห้องรับยศ กรุณาใช้ !setupverify ก่อน');
      }

      await sendVerifyMessage(verifyChannel);
      await message.reply('ส่งปุ่มรับยศให้อีกครั้งแล้ว');
    } catch (error) {
      console.error('SEND VERIFY ERROR:', error);
      await message.reply('ส่งปุ่มไม่สำเร็จ');
    }
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.guild) return;

  if (interaction.customId === VERIFY_BUTTON_ID) {
    try {
      const guild = interaction.guild;
      const member = await guild.members.fetch(interaction.user.id);
      const role = guild.roles.cache.find((r) => r.name === ROLE_NAME);
      const botMember = await guild.members.fetchMe();

      if (!role) {
        return interaction.reply({
          content: `ไม่พบ role ${ROLE_NAME}`,
          ephemeral: true,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `บอทไม่สามารถให้ยศ ${ROLE_NAME} ได้ เพราะ role ของบอทต้องอยู่สูงกว่า`,
          ephemeral: true,
        });
      }

      if (member.roles.cache.has(role.id)) {
        return interaction.reply({
          content: `คุณมียศ ${ROLE_NAME} อยู่แล้ว`,
          ephemeral: true,
        });
      }

      await member.roles.add(role);

      return interaction.reply({
        content: `รับยศ ${ROLE_NAME} เรียบร้อยแล้ว 🎉`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('BUTTON ERROR:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'เกิดข้อผิดพลาด',
          ephemeral: true,
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'เกิดข้อผิดพลาด',
          ephemeral: true,
        }).catch(() => {});
      }
    }
  }
});

client.login(TOKEN);