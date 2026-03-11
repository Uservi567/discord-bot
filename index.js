require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  ChannelType,
  AuditLogEvent,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// =========================
// CONFIG
// =========================
const TOKEN = process.env.TOKEN;
const PREFIX = "!";

// รับยศ
const TARGET_ROLE_ID = "1347851123364593753";
const ROLE_CHANNEL_NAME = "🎭│รับยศ";
const PANEL_GIF = "https://i.postimg.cc/BvgsywmH/snaptik-7505147525616176389-hd.gif";
const BUTTON_ID = "toggle_role_1347851123364593753";

// หมวดหลักที่คุณให้มา
const CATEGORY_ID = "1480603195800551434";

// สถานะเซิร์ฟ
const STATUS_TOTAL_NAME = "👥 สมาชิกทั้งหมด";
const STATUS_ONLINE_NAME = "🟢 ออนไลน์";
const STATUS_BOT_NAME = "🤖 บอท";

// ห้อง log
const LOG_JOIN_LEAVE_NAME = "📝│member-logs";
const LOG_MESSAGE_NAME = "💬│message-logs";
const LOG_MOD_NAME = "🛡️│mod-logs";
const LOG_VOICE_NAME = "🔊│voice-logs";

// อัปเดตสถานะทุก 60 วินาที
const STATUS_UPDATE_INTERVAL = 60 * 1000;

// =========================
// ROLE PANEL HELPERS
// =========================
function buildRolePanelEmbed(guild) {
  return new EmbedBuilder()
    .setColor(0x0b0b10)
    .setAuthor({
      name: guild.name,
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle("✦ ระบบรับยศ")
    .setDescription(
      [
        "กดปุ่มด้านล่างเพื่อรับยศหรือเอายศออกได้ทันที",
        "",
        `> **ยศ:** <@&${TARGET_ROLE_ID}>`,
        "> ระบบจะสลับยศให้อัตโนมัติ",
      ].join("\n")
    )
    .setImage(PANEL_GIF)
    .setThumbnail(guild.iconURL({ dynamic: true }) || null);
}

function buildRolePanelButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_ID)
      .setLabel("รับยศ / เอายศออก")
      .setEmoji("⚡")
      .setStyle(ButtonStyle.Danger)
  );
}

async function validateRoleSetup(guild) {
  const role = await guild.roles.fetch(TARGET_ROLE_ID).catch(() => null);
  if (!role) {
    return {
      ok: false,
      message: `❌ ไม่พบ role ID: ${TARGET_ROLE_ID}`,
    };
  }

  const botMember = guild.members.me;
  if (!botMember) {
    return {
      ok: false,
      message: "❌ ไม่พบบอทในเซิร์ฟเวอร์นี้",
    };
  }

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return {
      ok: false,
      message: "❌ บอทไม่มีสิทธิ์ Manage Roles",
    };
  }

  if (botMember.roles.highest.position <= role.position) {
    return {
      ok: false,
      message:
        "❌ บอทจัดการ role นี้ไม่ได้ เพราะ role ของบอทอยู่ต่ำกว่าหรือเท่ากับ role เป้าหมาย",
    };
  }

  return { ok: true, role };
}

async function findExistingRoleChannel(guild) {
  return guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildText &&
      ch.parentId === CATEGORY_ID &&
      ch.name === ROLE_CHANNEL_NAME
  );
}

// =========================
// CATEGORY / CHANNEL HELPERS
// =========================
function getMainCategory(guild) {
  const category = guild.channels.cache.get(CATEGORY_ID);
  if (!category || category.type !== ChannelType.GuildCategory) return null;
  return category;
}

async function getOrCreateTextChannel(guild, name, topic = "") {
  let channel = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildText &&
      ch.parentId === CATEGORY_ID &&
      ch.name === name
  );

  if (channel) return channel;

  channel = await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: CATEGORY_ID,
    topic,
  });

  return channel;
}

async function getOrCreateVoiceChannel(guild, name) {
  let channel = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildVoice &&
      ch.parentId === CATEGORY_ID &&
      ch.name.startsWith(name)
  );

  if (channel) return channel;

  channel = await guild.channels.create({
    name: `${name}: 0`,
    type: ChannelType.GuildVoice,
    parent: CATEGORY_ID,
  });

  return channel;
}

async function sendLog(guild, channelName, embed) {
  const channel = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildText &&
      ch.parentId === CATEGORY_ID &&
      ch.name === channelName
  );

  if (!channel) return;
  await channel.send({ embeds: [embed] }).catch(() => {});
}

// =========================
// STATUS SYSTEM
// =========================
async function ensureStatusChannels(guild) {
  await getOrCreateVoiceChannel(guild, STATUS_TOTAL_NAME);
  await getOrCreateVoiceChannel(guild, STATUS_ONLINE_NAME);
  await getOrCreateVoiceChannel(guild, STATUS_BOT_NAME);
}

async function updateServerStatusChannels(guild) {
  try {
    await guild.members.fetch().catch(() => {});

    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter((m) => m.user.bot).size;
    const onlineCount = guild.members.cache.filter((m) => {
      const status = m.presence?.status;
      return status && status !== "offline";
    }).size;

    const totalChannel = await getOrCreateVoiceChannel(guild, STATUS_TOTAL_NAME);
    const onlineChannel = await getOrCreateVoiceChannel(guild, STATUS_ONLINE_NAME);
    const botChannel = await getOrCreateVoiceChannel(guild, STATUS_BOT_NAME);

    const totalName = `${STATUS_TOTAL_NAME}: ${totalMembers}`;
    const onlineName = `${STATUS_ONLINE_NAME}: ${onlineCount}`;
    const botName = `${STATUS_BOT_NAME}: ${botCount}`;

    if (totalChannel.name !== totalName) {
      await totalChannel.setName(totalName).catch(() => {});
    }

    if (onlineChannel.name !== onlineName) {
      await onlineChannel.setName(onlineName).catch(() => {});
    }

    if (botChannel.name !== botName) {
      await botChannel.setName(botName).catch(() => {});
    }
  } catch (error) {
    console.error(`Status update failed in ${guild.name}:`, error);
  }
}

async function setupStatusSystem(guild) {
  const category = getMainCategory(guild);
  if (!category) {
    console.error(`❌ ไม่พบหมวดหมู่ ID ${CATEGORY_ID} ในเซิร์ฟเวอร์ ${guild.name}`);
    return;
  }

  await ensureStatusChannels(guild);
  await updateServerStatusChannels(guild);
}

// =========================
// LOG SYSTEM
// =========================
async function setupLogChannels(guild) {
  const category = getMainCategory(guild);
  if (!category) {
    console.error(`❌ ไม่พบหมวดหมู่ ID ${CATEGORY_ID} ในเซิร์ฟเวอร์ ${guild.name}`);
    return;
  }

  await getOrCreateTextChannel(guild, LOG_JOIN_LEAVE_NAME, "บันทึกคนเข้า-ออก");
  await getOrCreateTextChannel(guild, LOG_MESSAGE_NAME, "บันทึกข้อความที่ลบหรือแก้ไข");
  await getOrCreateTextChannel(guild, LOG_MOD_NAME, "บันทึกการจัดการต่างๆ");
  await getOrCreateTextChannel(guild, LOG_VOICE_NAME, "บันทึกการเข้าออกห้องเสียง");
}

// =========================
// READY
// =========================
client.once(Events.ClientReady, async (bot) => {
  console.log(`✅ Logged in as ${bot.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await setupLogChannels(guild);
    await setupStatusSystem(guild);
  }

  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await updateServerStatusChannels(guild);
    }
  }, STATUS_UPDATE_INTERVAL);
});

// =========================
// COMMAND: !รับยศ
// =========================
client.on(Events.MessageCreate, async (message) => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;

    if (message.content === `${PREFIX}รับยศ`) {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)
      ) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      const validation = await validateRoleSetup(message.guild);
      if (!validation.ok) {
        return message.reply(validation.message);
      }

      const oldChannel = await findExistingRoleChannel(message.guild);
      if (oldChannel) {
        await oldChannel.delete("Refreshing role panel channel").catch((err) => {
          console.error("Delete old role channel error:", err);
        });
      }

      const permissionOverwrites = [
        {
          id: message.guild.roles.everyone.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
          deny: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.AddReactions,
          ],
        },
        {
          id: message.guild.members.me.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
      ];

      const channel = await message.guild.channels.create({
        name: ROLE_CHANNEL_NAME,
        type: ChannelType.GuildText,
        parent: CATEGORY_ID || null,
        permissionOverwrites,
        reason: "Create new role panel channel",
        topic: `ช่องรับยศอัตโนมัติสำหรับ role ${TARGET_ROLE_ID}`,
      });

      await channel.send({
        embeds: [buildRolePanelEmbed(message.guild)],
        components: [buildRolePanelButtons()],
      });

      await message.reply(`✅ สร้างห้องรับยศใหม่แล้ว: ${channel}`);
      return;
    }

    if (message.content === `${PREFIX}setup`) {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)
      ) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      await setupLogChannels(message.guild);
      await setupStatusSystem(message.guild);

      return message.reply("✅ สร้างห้องสถานะและห้อง log ให้แล้ว");
    }
  } catch (error) {
    console.error("Create role channel error:", error);
    await message.reply("❌ เกิดข้อผิดพลาดขณะสร้างระบบ").catch(() => {});
  }
});

// =========================
// BUTTON INTERACTION
// =========================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (interaction.customId !== BUTTON_ID) return;
    if (!interaction.guild) return;

    const validation = await validateRoleSetup(interaction.guild);
    if (!validation.ok) {
      return interaction.reply({
        content: validation.message,
        ephemeral: true,
      });
    }

    const member = await interaction.guild.members
      .fetch(interaction.user.id)
      .catch(() => null);

    if (!member) {
      return interaction.reply({
        content: "❌ ไม่พบข้อมูลสมาชิก",
        ephemeral: true,
      });
    }

    const role = validation.role;
    const hasRole = member.roles.cache.has(TARGET_ROLE_ID);

    if (hasRole) {
      await member.roles.remove(role, "Self-role remove by panel button");

      const removeEmbed = new EmbedBuilder()
        .setColor(0xff0033)
        .setTitle("✦ ถอดยศเรียบร้อย")
        .setDescription(`ระบบได้เอายศ <@&${TARGET_ROLE_ID}> ออกจากคุณแล้ว`);

      return interaction.reply({
        embeds: [removeEmbed],
        ephemeral: true,
      });
    }

    await member.roles.add(role, "Self-role add by panel button");

    const addEmbed = new EmbedBuilder()
      .setColor(0x00ff9d)
      .setTitle("✦ รับยศสำเร็จ")
      .setDescription(`ระบบได้มอบยศ <@&${TARGET_ROLE_ID}> ให้คุณแล้ว`);

    return interaction.reply({
      embeds: [addEmbed],
      ephemeral: true,
    });
  } catch (error) {
    console.error("Interaction error:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction
        .followUp({
          content: "❌ เกิดข้อผิดพลาดระหว่างจัดการยศ",
          ephemeral: true,
        })
        .catch(() => {});
    } else {
      await interaction
        .reply({
          content: "❌ เกิดข้อผิดพลาดระหว่างจัดการยศ",
          ephemeral: true,
        })
        .catch(() => {});
    }
  }
});

// =========================
// MEMBER LOGS
// =========================
client.on(Events.GuildMemberAdd, async (member) => {
  await updateServerStatusChannels(member.guild);

  const embed = new EmbedBuilder()
    .setColor(0x00ff9d)
    .setTitle("สมาชิกเข้าใหม่")
    .setDescription(`${member.user} เข้าร่วมเซิร์ฟเวอร์แล้ว`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: "ชื่อ", value: `${member.user.tag}`, inline: true },
      { name: "ไอดี", value: `${member.id}`, inline: true }
    )
    .setTimestamp();

  await sendLog(member.guild, LOG_JOIN_LEAVE_NAME, embed);
});

client.on(Events.GuildMemberRemove, async (member) => {
  await updateServerStatusChannels(member.guild);

  const embed = new EmbedBuilder()
    .setColor(0xff0033)
    .setTitle("สมาชิกออก")
    .setDescription(`${member.user.tag} ออกจากเซิร์ฟเวอร์แล้ว`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields({ name: "ไอดี", value: `${member.id}`, inline: true })
    .setTimestamp();

  await sendLog(member.guild, LOG_JOIN_LEAVE_NAME, embed);
});

// =========================
// MESSAGE LOGS
// =========================
client.on(Events.MessageDelete, async (message) => {
  if (!message.guild) return;
  if (message.author?.bot) return;

  const embed = new EmbedBuilder()
    .setColor(0xff9900)
    .setTitle("ลบข้อความ")
    .addFields(
      { name: "ผู้ใช้", value: `${message.author?.tag || "ไม่ทราบ"}`, inline: true },
      { name: "ห้อง", value: `${message.channel}`, inline: true },
      { name: "ข้อความ", value: message.content?.slice(0, 1000) || "ไม่มีข้อความ" }
    )
    .setTimestamp();

  await sendLog(message.guild, LOG_MESSAGE_NAME, embed);
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (!newMessage.guild) return;
  if (newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  const embed = new EmbedBuilder()
    .setColor(0x3399ff)
    .setTitle("แก้ไขข้อความ")
    .addFields(
      { name: "ผู้ใช้", value: `${newMessage.author?.tag || "ไม่ทราบ"}`, inline: true },
      { name: "ห้อง", value: `${newMessage.channel}`, inline: true },
      { name: "ก่อนแก้", value: oldMessage.content?.slice(0, 1000) || "ไม่มีข้อความ" },
      { name: "หลังแก้", value: newMessage.content?.slice(0, 1000) || "ไม่มีข้อความ" }
    )
    .setTimestamp();

  await sendLog(newMessage.guild, LOG_MESSAGE_NAME, embed);
});

// =========================
// VOICE LOGS
// =========================
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const guild = newState.guild || oldState.guild;
  if (!guild) return;

  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  let action = null;

  if (!oldState.channelId && newState.channelId) {
    action = {
      title: "เข้าห้องเสียง",
      desc: `${member.user.tag} เข้าห้อง ${newState.channel}`,
      color: 0x00ff9d,
    };
  } else if (oldState.channelId && !newState.channelId) {
    action = {
      title: "ออกห้องเสียง",
      desc: `${member.user.tag} ออกจากห้อง ${oldState.channel}`,
      color: 0xff0033,
    };
  } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    action = {
      title: "ย้ายห้องเสียง",
      desc: `${member.user.tag} ย้ายจาก ${oldState.channel} ไป ${newState.channel}`,
      color: 0x3399ff,
    };
  }

  if (!action) return;

  const embed = new EmbedBuilder()
    .setColor(action.color)
    .setTitle(action.title)
    .setDescription(action.desc)
    .setTimestamp();

  await sendLog(guild, LOG_VOICE_NAME, embed);
});

// =========================
// MOD LOGS
// =========================
client.on(Events.GuildBanAdd, async (ban) => {
  const embed = new EmbedBuilder()
    .setColor(0xff0033)
    .setTitle("แบนสมาชิก")
    .setDescription(`${ban.user.tag} ถูกแบน`)
    .setTimestamp();

  await sendLog(ban.guild, LOG_MOD_NAME, embed);
});

client.on(Events.GuildBanRemove, async (ban) => {
  const embed = new EmbedBuilder()
    .setColor(0x00ff9d)
    .setTitle("ปลดแบนสมาชิก")
    .setDescription(`${ban.user.tag} ถูกปลดแบน`)
    .setTimestamp();

  await sendLog(ban.guild, LOG_MOD_NAME, embed);
});

// =========================
// PRESENCE UPDATE
// =========================
client.on(Events.PresenceUpdate, async (_, newPresence) => {
  if (!newPresence?.guild) return;
  await updateServerStatusChannels(newPresence.guild);
});

// =========================
// LOGIN
// =========================
if (!TOKEN) {
  console.error("❌ ไม่พบ TOKEN ในไฟล์ .env");
  process.exit(1);
}

client.login(TOKEN);
