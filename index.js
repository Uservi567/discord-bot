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

  startHereCategoryName: "✨ START HERE",

  startHereChannels: [
    {
      name: "📜│กฎ",
      aliases: ["กฎ", "rules"],
      seed: [
        "# 📜 กฎของเซิร์ฟเวอร์",
        "1. เคารพกันและกัน",
        "2. ห้ามสแปมหรือปั่น",
        "3. ใช้ห้องให้ตรงประเภท",
        "4. ห้ามโฆษณาโดยไม่ได้รับอนุญาต",
      ],
    },
    {
      name: "📢│ประกาศ",
      aliases: ["ประกาศ", "announcements"],
      seed: [
        "# 📢 ประกาศ",
        "ห้องนี้ใช้สำหรับประกาศสำคัญจากทีมงาน",
      ],
    },
    {
      name: "👋│welcome",
      aliases: ["welcome", "ยินดีต้อนรับ", "welcome-chat"],
      seed: [
        "# 👋 ยินดีต้อนรับ",
        "เริ่มต้นที่ห้อง `🎭│รับยศ` เพื่อเปิดห้องทั้งหมดของเซิร์ฟเวอร์",
      ],
    },
    {
      name: "🎭│รับยศ",
      aliases: ["รับยศ", "verify", "roles"],
      seed: [],
    },
    {
      name: "🔗│เชิญเพื่อน",
      aliases: ["invite", "ลิงก์เชิญ", "ลิงก์เชิญเพื่อน"],
      seed: [
        "# 🔗 เชิญเพื่อน",
        "แชร์ลิงก์เชิญเซิร์ฟเวอร์นี้ให้เพื่อนของคุณได้ที่นี่",
      ],
    },
  ],
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s|_-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function simplifiedName(name = "") {
  return normalizeName(name).replace(/\|/g, " ");
}

function getMemberRole(guild) {
  return guild.roles.cache.get(CONFIG.memberRoleId) || null;
}

function getExactChannel(guild, name, type = null) {
  return (
    guild.channels.cache.find((c) => {
      if (type !== null) return c.name === name && c.type === type;
      return c.name === name;
    }) || null
  );
}

function findMatchingTextChannel(guild, name, aliases = []) {
  const acceptable = [simplifiedName(name), ...aliases.map(simplifiedName)];

  return (
    guild.channels.cache.find(
      (c) =>
        c.type === ChannelType.GuildText &&
        acceptable.includes(simplifiedName(c.name))
    ) || null
  );
}

async function ensureStartHereCategory(guild) {
  let category = getExactChannel(
    guild,
    CONFIG.startHereCategoryName,
    ChannelType.GuildCategory
  );

  if (!category) {
    category =
      guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildCategory &&
          simplifiedName(c.name) === simplifiedName(CONFIG.startHereCategoryName)
      ) || null;
  }

  if (!category) {
    category = await guild.channels.create({
      name: CONFIG.startHereCategoryName,
      type: ChannelType.GuildCategory,
      reason: "สร้างหมวด START HERE",
    });
  } else if (category.name !== CONFIG.startHereCategoryName) {
    await category.setName(CONFIG.startHereCategoryName);
  }

  // สำคัญ: คนทั่วไปต้องเห็นหมวดนี้
  await category.permissionOverwrites.set([
    {
      id: guild.roles.everyone.id,
      allow: [PermissionsBitField.Flags.ViewChannel],
      deny: [],
    },
  ]);

  return category;
}

function buildPublicReadOnlyOverwrites(guild, botMember, channelName) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      allow: [PermissionsBitField.Flags.ViewChannel],
      deny: [],
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
  ];

  // ห้องรับยศต้องให้คนทั่วไปเห็นและกดปุ่มได้ แต่ไม่ต้องพิมพ์เอง
  if (channelName === "🎭│รับยศ") {
    overwrites[0] = {
      id: guild.roles.everyone.id,
      allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
      deny: [PermissionsBitField.Flags.SendMessages],
    };
  } else {
    overwrites[0] = {
      id: guild.roles.everyone.id,
      allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
      deny: [PermissionsBitField.Flags.SendMessages],
    };
  }

  return overwrites;
}

async function ensureStartHereChannels(guild) {
  const category = await ensureStartHereCategory(guild);
  const botMember = await guild.members.fetchMe();

  for (const channelCfg of CONFIG.startHereChannels) {
    let channel = findMatchingTextChannel(
      guild,
      channelCfg.name,
      channelCfg.aliases || []
    );

    const overwrites = buildPublicReadOnlyOverwrites(
      guild,
      botMember,
      channelCfg.name
    );

    if (!channel) {
      channel = await guild.channels.create({
        name: channelCfg.name,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: overwrites,
        reason: "สร้างห้อง START HERE",
      });
    } else {
      if (channel.name !== channelCfg.name) {
        await channel.setName(channelCfg.name);
      }

      if (channel.parentId !== category.id) {
        await channel.setParent(category.id, { lockPermissions: false });
      }

      await channel.permissionOverwrites.set(overwrites);
    }
  }
}

function buildVerifyPanel(guild) {
  const memberRole = getMemberRole(guild);
  const roleName = memberRole ? memberRole.name : "Member";

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
  } catch {}
}

async function refreshVerifyPanel(guild) {
  const channel = getExactChannel(guild, "🎭│รับยศ", ChannelType.GuildText);
  if (!channel) return false;

  await clearOldBotMessages(channel);
  await channel.send(buildVerifyPanel(guild));
  return true;
}

async function seedRoomIfEmpty(channel, seedLines) {
  if (!seedLines || seedLines.length === 0) return false;
  if (channel.type !== ChannelType.GuildText) return false;

  const messages = await channel.messages.fetch({ limit: 5 }).catch(() => null);
  if (!messages) return false;

  const hasNonBotContent = messages.some(
    (m) => !m.author.bot && m.content.trim() !== ""
  );
  if (hasNonBotContent) return false;

  const hasBotContent = messages.some((m) => m.author.id === client.user.id);
  if (hasBotContent) return false;

  await channel.send(seedLines.join("\n")).catch(() => {});
  return true;
}

async function seedStartHereRooms(guild) {
  let seeded = 0;

  for (const channelCfg of CONFIG.startHereChannels) {
    if (!channelCfg.seed || channelCfg.seed.length === 0) continue;

    const ch = getExactChannel(guild, channelCfg.name, ChannelType.GuildText);
    if (!ch) continue;

    const didSeed = await seedRoomIfEmpty(ch, channelCfg.seed);
    if (didSeed) seeded++;
  }

  return seeded;
}

client.once("clientReady", async () => {
  console.log(`บอทออนไลน์แล้ว ${client.user.tag}`);
  console.log("ใช้ !setupstart เพื่อซ่อม START HERE และระบบรับยศ");

  for (const guild of client.guilds.cache.values()) {
    await ensureStartHereCategory(guild).catch(console.error);
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  console.log("MESSAGE:", message.content);

  if (message.content === "!testbot") {
    return message.reply("บอทอ่านคำสั่งได้แล้ว");
  }

  if (!message.content.startsWith(PREFIX)) return;
  const cmd = message.content.slice(PREFIX.length).trim().toLowerCase();

  if (cmd === "setupstart") {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply("คำสั่งนี้ใช้ได้เฉพาะแอดมิน");
      }

      const memberRole = getMemberRole(message.guild);
      if (!memberRole) {
        return message.reply(
          `ไม่พบ Member role ตาม ID นี้: ${CONFIG.memberRoleId}`
        );
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

      await status.edit("1/3 กำลังตั้งหมวดและห้องให้คนทั่วไปเห็น...");
      await ensureStartHereChannels(message.guild);

      await status.edit("2/3 กำลังส่งปุ่มรับยศ...");
      await refreshVerifyPanel(message.guild);

      await status.edit("3/3 กำลังเติมข้อความห้องที่ยังว่าง...");
      const seeded = await seedStartHereRooms(message.guild);

      await status.edit(`ซ่อม START HERE เสร็จแล้ว ✅ เติมข้อความ ${seeded} ห้อง`);
    } catch (error) {
      console.error("setupstart error:", error);
      await message.reply("เกิดข้อผิดพลาดระหว่างซ่อม START HERE");
    }
  }

  if (cmd === "sendverify") {
    try {
      const ok = await refreshVerifyPanel(message.guild);
      if (!ok) return message.reply("ยังไม่พบห้อง 🎭│รับยศ");
      await message.reply("รีเฟรชปุ่มรับยศเรียบร้อยแล้ว");
    } catch (error) {
      console.error("sendverify error:", error);
      await message.reply("รีเฟรชปุ่มรับยศไม่สำเร็จ");
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
      return interaction
        .reply({
          content: "เกิดข้อผิดพลาด",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
    }
  }
});

client.on("error", console.error);
process.on("unhandledRejection", console.error);

client.login(TOKEN);
