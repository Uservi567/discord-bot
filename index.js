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

// ===== ระบบรับยศ =====
const ROLE_NAME = 'Verified';
const CATEGORY_NAME = '📌 เริ่มต้น';
const VERIFY_CHANNEL_NAME = '✅│รับยศ';
const CHAT_CHANNEL_NAME = '💬│พูดคุย';
const VERIFY_BUTTON_ID = 'verify_member_role';

// ===== ระบบสถิติ =====
const STATS_CATEGORY_NAME = '📊 SERVER STATUS';
const TOTAL_CHANNEL_PREFIX = '👥 สมาชิกทั้งหมด: ';
const ONLINE_CHANNEL_PREFIX = '🟢 ออนไลน์: ';
const BOT_CHANNEL_PREFIX = '🤖 บอท: ';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
});

client.once('clientReady', async () => {
  console.log(`บอทออนไลน์แล้ว ${client.user.tag}`);
  console.log('ใช้ !setupverify เพื่อสร้างระบบรับยศ');
  console.log('ใช้ !setupstats เพื่อสร้างห้องสถิติ');

  for (const guild of client.guilds.cache.values()) {
    await updateStatsForGuild(guild);
  }

  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await updateStatsForGuild(guild);
    }
  }, 5 * 60 * 1000);
});

function findChannelByName(guild, name, type = null) {
  return guild.channels.cache.find((ch) => {
    if (type !== null) return ch.name === name && ch.type === type;
    return ch.name === name;
  });
}

function findVoiceChannelStartsWith(guild, prefix) {
  return guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildVoice &&
      typeof ch.name === 'string' &&
      ch.name.startsWith(prefix)
  );
}

async function sendVerifyMessage(channel) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(VERIFY_BUTTON_ID)
      .setLabel(`กดเพื่อรับยศ ${ROLE_NAME}`)
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({
    content: `ยินดีต้อนรับ\n\nกดปุ่มด้านล่างเพื่อรับยศ **${ROLE_NAME}** แล้วระบบจะเปิดห้องใช้งานให้คุณอัตโนมัติ`,
    components: [row],
  });
}

async function ensureStatChannel(guild, category, prefix, value) {
  const targetName = `${prefix}${value}`;
  let channel = findVoiceChannelStartsWith(guild, prefix);

  if (!channel) {
    channel = await guild.channels.create({
      name: targetName,
      type: ChannelType.GuildVoice,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionsBitField.Flags.ViewChannel],
          deny: [PermissionsBitField.Flags.Connect],
        },
      ],
      reason: 'สร้างห้องสถิติสมาชิก',
    });
    return;
  }

  if (channel.name !== targetName) {
    await channel.setName(targetName, 'อัปเดตสถิติสมาชิก');
  }

  if (channel.parentId !== category.id) {
    await channel.setParent(category.id);
  }
}

async function getStats(guild) {
  await guild.members.fetch();

  const totalMembers = guild.memberCount;
  const members = guild.members.cache;

  const botCount = members.filter((m) => m.user.bot).size;
  const onlineCount = members.filter(
    (m) => !m.user.bot && m.presence && m.presence.status !== 'offline'
  ).size;

  return { totalMembers, botCount, onlineCount };
}

async function updateStatsForGuild(guild) {
  try {
    let category = findChannelByName(
      guild,
      STATS_CATEGORY_NAME,
      ChannelType.GuildCategory
    );

    if (!category) {
      category = await guild.channels.create({
        name: STATS_CATEGORY_NAME,
        type: ChannelType.GuildCategory,
        reason: 'สร้างหมวดสถิติสมาชิก',
      });
    }

    const { totalMembers, botCount, onlineCount } = await getStats(guild);

    await ensureStatChannel(guild, category, TOTAL_CHANNEL_PREFIX, totalMembers);
    await ensureStatChannel(guild, category, ONLINE_CHANNEL_PREFIX, onlineCount);
    await ensureStatChannel(guild, category, BOT_CHANNEL_PREFIX, botCount);
  } catch (error) {
    console.error(`อัปเดตสถิติไม่สำเร็จใน ${guild.name}:`, error.message);
  }
}

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // ===== setup verify =====
  if (message.content === '!setupverify') {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
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

      let memberRole = guild.roles.cache.find((role) => role.name === ROLE_NAME);

      if (!memberRole) {
        memberRole = await guild.roles.create({
          name: ROLE_NAME,
          reason: 'สร้างยศสำหรับระบบกดรับยศอัตโนมัติ',
        });
      }

      if (memberRole.position >= botMember.roles.highest.position) {
        return message.reply(
          `บอทแจกยศ ${ROLE_NAME} ไม่ได้ เพราะ role ของบอทต้องอยู่สูงกว่า role ${ROLE_NAME}`
        );
      }

      let category = findChannelByName(guild, CATEGORY_NAME, ChannelType.GuildCategory);

      if (!category) {
        category = await guild.channels.create({
          name: CATEGORY_NAME,
          type: ChannelType.GuildCategory,
          reason: 'สร้างหมวดสำหรับระบบเริ่มต้น/รับยศ',
        });
      }

      let verifyChannel = findChannelByName(guild, VERIFY_CHANNEL_NAME, ChannelType.GuildText);

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

      let chatChannel = findChannelByName(guild, CHAT_CHANNEL_NAME, ChannelType.GuildText);

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

      await sendVerifyMessage(verifyChannel);

      await message.reply(
        `ตั้งค่าระบบรับยศเรียบร้อยแล้ว\n- role: ${ROLE_NAME}\n- หมวด: ${CATEGORY_NAME}\n- ห้องรับยศ: ${VERIFY_CHANNEL_NAME}\n- ห้องสมาชิก: ${CHAT_CHANNEL_NAME}`
      );
    } catch (error) {
      console.error('SETUP VERIFY ERROR:', error);
      await message.reply('เกิดข้อผิดพลาดระหว่างสร้างระบบรับยศ');
    }
  }

  // ===== send verify again =====
  if (message.content === '!sendverify') {
    try {
      const verifyChannel = findChannelByName(
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

  // ===== setup stats =====
  if (message.content === '!setupstats') {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply('คำสั่งนี้ใช้ได้เฉพาะแอดมินหรือคนที่มีสิทธิ์จัดการเซิร์ฟเวอร์');
      }

      const botMember = await message.guild.members.fetchMe();

      const needPerms = [
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ViewChannel,
      ];

      const missingPerms = needPerms.filter(
        (perm) => !botMember.permissions.has(perm)
      );

      if (missingPerms.length > 0) {
        return message.reply('บอทยังมีสิทธิ์ไม่ครบ ต้องมีอย่างน้อย: Manage Channels, View Channels');
      }

      await updateStatsForGuild(message.guild);
      await message.reply('สร้าง/อัปเดตห้องสถิติเรียบร้อยแล้ว');
    } catch (error) {
      console.error('SETUP STATS ERROR:', error);
      await message.reply('เกิดข้อผิดพลาดระหว่างสร้างห้องสถิติ');
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

client.on('guildMemberAdd', async (member) => {
  await updateStatsForGuild(member.guild);
});

client.on('guildMemberRemove', async (member) => {
  await updateStatsForGuild(member.guild);
});

client.on('presenceUpdate', async (oldPresence, newPresence) => {
  const guild = newPresence?.guild || oldPresence?.guild;
  if (!guild) return;
  await updateStatsForGuild(guild);
});

client.on('error', console.error);
process.on('unhandledRejection', console.error);

client.login(TOKEN);
