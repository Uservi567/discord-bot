require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const PREFIX = "!";

if (!TOKEN) {
  console.error("ไม่พบ TOKEN ในไฟล์ .env");
  process.exit(1);
}

const CONFIG = {
  memberRoleId: "1347851123364593753",
  verifyButtonId: "main_verify_button",

  // หมวด START HERE เดิมของคุณ
  startHereCategoryId: "1480603184207630346",

  // ช่องที่อยากให้คนทั่วไปเห็นทั้งหมด
  publicChannelIds: [
    "1480603186107781394",
    "1347851123834228800",
    "1347851123834228802",
    "1480603194118766746",
  ],

  // ห้องรับยศ
  verifyChannelId: "1480603194118766746",
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function getMemberRole(guild) {
  return guild.roles.cache.get(CONFIG.memberRoleId) || null;
}

async function ensureStartHereVisible(guild) {
  const category = guild.channels.cache.get(CONFIG.startHereCategoryId);

  if (!category) {
    throw new Error(`ไม่พบหมวด START HERE id: ${CONFIG.startHereCategoryId}`);
  }

  if (category.type !== ChannelType.GuildCategory) {
    throw new Error("ID ของ START HERE ไม่ใช่หมวดหมู่");
  }

  // เปิดให้ everyone เห็นหมวด
  await category.permissionOverwrites.set([
    {
      id: guild.roles.everyone.id,
      allow: [PermissionsBitField.Flags.ViewChannel],
      deny: [],
    },
  ]);

  const botMember = await guild.members.fetchMe();

  for (const channelId of CONFIG.publicChannelIds) {
    const channel = guild.channels.cache.get(channelId);

    if (!channel) {
      console.log("ไม่พบ channel:", channelId);
      continue;
    }

    if (channel.type !== ChannelType.GuildText) {
      console.log("ไม่ใช่ text channel:", channelId);
      continue;
    }

    // ย้ายเข้าหมวด START HERE เดิม
    if (channel.parentId !== category.id) {
      await channel.setParent(category.id, { lockPermissions: false }).catch(console.error);
    }

    // เปิดให้ทุกคนเห็น + อ่านย้อนหลังได้ แต่ส่งข้อความไม่ได้
    await channel.permissionOverwrites.set([
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
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ManageChannels,
          PermissionsBitField.Flags.ManageMessages,
        ],
        deny: [],
      },
    ]).catch(console.error);
  }
}

function buildVerifyPanel(guild) {
  const role = getMemberRole(guild);
  const roleName = role ? role.name : "Member";

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CONFIG.verifyButtonId)
      .setLabel(`รับยศ ${roleName}`)
      .setStyle(ButtonStyle.Success)
  );

  return {
    content:
      "## 🎭 รับยศสมาชิก\n" +
      `กดปุ่มด้านล่างเพื่อรับยศ **${roleName}**\n` +
      "หลังรับยศแล้ว ห้องสมาชิกของเซิร์ฟเวอร์จะเปิดให้ใช้งาน",
    components: [row],
  };
}

async function clearOldBotMessages(channel) {
  try {
    const messages = await channel.messages.fetch({ limit: 30 });
    const botMessages = messages.filter((m) => m.author.id === client.user.id);
    for (const msg of botMessages.values()) {
      await msg.delete().catch(() => {});
    }
  } catch (e) {
    console.error("clearOldBotMessages error:", e);
  }
}

async function refreshVerifyPanel(guild) {
  const channel = guild.channels.cache.get(CONFIG.verifyChannelId);

  if (!channel) {
    throw new Error(`ไม่พบห้องรับยศ id: ${CONFIG.verifyChannelId}`);
  }

  if (channel.type !== ChannelType.GuildText) {
    throw new Error("verifyChannelId ไม่ใช่ text channel");
  }

  await clearOldBotMessages(channel);
  await channel.send(buildVerifyPanel(guild));
}

client.once("clientReady", async () => {
  console.log(`บอทออนไลน์แล้ว ${client.user.tag}`);
  console.log("ใช้ !fixstart เพื่อเปิด START HERE ให้คนทั่วไปเห็น");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  console.log("MESSAGE:", message.content);

  if (message.content === "!testbot") {
    return message.reply("บอทอ่านคำสั่งได้แล้ว");
  }

  if (!message.content.startsWith(PREFIX)) return;
  const cmd = message.content.slice(PREFIX.length).trim().toLowerCase();

  if (cmd === "fixstart") {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply("คำสั่งนี้ใช้ได้เฉพาะแอดมิน");
      }

      const memberRole = getMemberRole(message.guild);
      if (!memberRole) {
        return message.reply(`ไม่พบ Member role ตาม ID นี้: ${CONFIG.memberRoleId}`);
      }

      const botMember = await message.guild.members.fetchMe();
      const needed = [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageRoles,
      ];

      const missing = needed.filter((perm) => !botMember.permissions.has(perm));
      if (missing.length > 0) {
        return message.reply(
          "บอทยังมีสิทธิ์ไม่ครบ ต้องมี: View Channels, Send Messages, Read Message History, Manage Channels, Manage Roles"
        );
      }

      const status = await message.reply("กำลังซ่อม START HERE...");

      await status.edit("1/2 กำลังเปิดสิทธิ์ห้องให้คนทั่วไปเห็น...");
      await ensureStartHereVisible(message.guild);

      await status.edit("2/2 กำลังรีเฟรชปุ่มรับยศ...");
      await refreshVerifyPanel(message.guild);

      await status.edit("ซ่อม START HERE เรียบร้อยแล้ว ✅");
    } catch (error) {
      console.error("fixstart error:", error);
      await message.reply(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.guild) return;

  if (interaction.isButton() && interaction.customId === CONFIG.verifyButtonId) {
    try {
      const guild = interaction.guild;
      const member = await guild.members.fetch(interaction.user.id);
      const role = getMemberRole(guild);
      const botMember = await guild.members.fetchMe();

      if (!role) {
        return interaction.reply({
          content: "ไม่พบ Member role เดิมของเซิร์ฟ",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: "บอทให้ยศนี้ไม่ได้ เพราะ role ของบอทต้องอยู่สูงกว่า role Member",
          flags: MessageFlags.Ephemeral,
        });
      }

      if (member.roles.cache.has(role.id)) {
        return interaction.reply({
          content: `คุณมียศ ${role.name} อยู่แล้ว`,
          flags: MessageFlags.Ephemeral,
        });
      }

      await member.roles.add(role);

      return interaction.reply({
        content: `รับยศ ${role.name} เรียบร้อยแล้ว 🎉`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("verify button error:", error);
      return interaction.reply({
        content: "เกิดข้อผิดพลาด",
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  }
});

client.on("error", console.error);
process.on("unhandledRejection", console.error);

client.login(TOKEN);
