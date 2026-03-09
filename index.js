require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const PREFIX = "!";

const CONFIG = {
  verifyRole: "✅ Verified",
  archiveCategory: "🗃️ ARCHIVE OLD",
  statsCategory: "📊 SERVER STATUS",
  ids: {
    verifyButton: "btn_verify_main",
    businessSelect: "select_business_roles",
  },

  roles: [
    { name: "👑 Founder", color: 0xe91e63, hoist: true },
    { name: "🛡 Admin", color: 0xf44336, hoist: true },
    { name: "🎓 Team", color: 0x2196f3, hoist: true },
    { name: "📋 Moderator", color: 0x9c27b0, hoist: true },
    { name: "🤖 Bots", color: 0x95a5a6, hoist: true },

    { name: "💎 Premium Student", color: 0xf1c40f, hoist: true },
    { name: "🟣 Rank B", color: 0x8e44ad, hoist: true },
    { name: "🛒 Etsy Student", color: 0xe67e22, hoist: true },
    { name: "📦 Amazon Student", color: 0x3498db, hoist: true },

    { name: "🚀 VIP", color: 0xff9800, hoist: true },
    { name: "🔥 Booster", color: 0xff5722, hoist: true },

    { name: "✅ Verified", color: 0x2ecc71, hoist: true },
    { name: "🌿 Member", color: 0xecf0f1, hoist: false },
    { name: "⭐ Active Member", color: 0x1abc9c, hoist: false },
    { name: "💬 Community", color: 0x00bcd4, hoist: false },

    { name: "💸 Affiliate", color: 0x7ed321, hoist: false },
    { name: "🧡 Etsy Seller", color: 0xff9800, hoist: false },
    { name: "💰 Amazon Seller", color: 0x1976d2, hoist: false },
    { name: "📦 Dropshipper", color: 0x26a69a, hoist: false },
    { name: "👕 Merch Creator", color: 0xc2185b, hoist: false },

    { name: "🎵 Music", color: 0x607d8b, hoist: false },
  ],

  selfAssignBusinessRoles: [
    "💸 Affiliate",
    "🧡 Etsy Seller",
    "💰 Amazon Seller",
    "📦 Dropshipper",
    "👕 Merch Creator",
  ],

  structure: [
    {
      category: "📌 START HERE",
      channels: [
        { type: "text", name: "📜│กฎ", aliases: ["กฎ", "rules"], everyoneView: true, everyoneSend: false },
        { type: "text", name: "📢│ประกาศ", aliases: ["ประกาศ", "announcements"], everyoneView: true, everyoneSend: false },
        { type: "text", name: "👋│welcome-chat", aliases: ["welcome", "ยินดีต้อนรับ"], everyoneView: true, everyoneSend: false },
        { type: "text", name: "🎭│รับยศ", aliases: ["รับยศ", "verify", "roles"], everyoneView: true, everyoneSend: false },
        { type: "text", name: "🔗│ลิงก์เชิญเพื่อน", aliases: ["invite", "ลิงก์เชิญ"], everyoneView: true, everyoneSend: false },
      ],
    },
    {
      category: "📊 SERVER STATUS",
      channels: [
        { type: "voice", name: "👥 สมาชิกทั้งหมด: 0", stat: "total" },
        { type: "voice", name: "🟢 ออนไลน์: 0", stat: "online" },
        { type: "voice", name: "🤖 บอท: 0", stat: "bots" },
      ],
    },
    {
      category: "💬 COMMUNITY",
      channels: [
        { type: "text", name: "💬│พูดคุย", aliases: ["พูดคุย", "chat"], verifiedOnly: true },
        { type: "text", name: "📷│แชร์ผลงาน", aliases: ["ผลงาน", "แชร์ผลงาน", "showcase"], verifiedOnly: true },
        { type: "text", name: "❓│ถามตอบ", aliases: ["ถามตอบ", "qna"], verifiedOnly: true },
        { type: "text", name: "📊│result-ผลลัพธ์", aliases: ["result", "ผลลัพธ์"], verifiedOnly: true },
      ],
    },
    {
      category: "💰 BUSINESS ZONE",
      channels: [
        { type: "text", name: "💸│affiliate", aliases: ["affiliate"], verifiedOnly: true },
        { type: "text", name: "🧡│etsy", aliases: ["etsy"], verifiedOnly: true },
        { type: "text", name: "💰│amazon", aliases: ["amazon"], verifiedOnly: true },
        { type: "text", name: "📦│dropshipping", aliases: ["dropshipping", "dropship"], verifiedOnly: true },
        { type: "text", name: "👕│amazon-merch", aliases: ["merch", "amazon merch"], verifiedOnly: true },
        { type: "text", name: "🧠│แชร์ไอเดีย", aliases: ["แชร์ไอเดีย", "ideas"], verifiedOnly: true },
      ],
    },
    {
      category: "🧠 TALK ZONE",
      channels: [
        { type: "voice", name: "💬 พูดคุย", aliases: ["พูดคุย voice"], verifiedOnly: true },
        { type: "voice", name: "💼 ธุรกิจ", aliases: ["ธุรกิจ"], verifiedOnly: true },
        { type: "voice", name: "💵 การเงิน", aliases: ["การเงิน"], verifiedOnly: true },
        { type: "voice", name: "📚 อ่านหนังสือ", aliases: ["อ่านหนังสือ"], verifiedOnly: true },
        { type: "voice", name: "🛠 ทำงาน", aliases: ["ทำงาน"], verifiedOnly: true },
      ],
    },
    {
      category: "🎓 CLASS / VIP",
      channels: [
        { type: "text", name: "💎│premium-student", aliases: ["premium", "นักเรียนพิเศษ"], roleView: "💎 Premium Student" },
        { type: "text", name: "🟣│rank-b", aliases: ["rank b", "นักเรียน rank b"], roleView: "🟣 Rank B" },
        { type: "text", name: "🛒│etsy-student", aliases: ["etsy student"], roleView: "🛒 Etsy Student" },
        { type: "text", name: "📦│amazon-student", aliases: ["amazon student"], roleView: "📦 Amazon Student" },
        { type: "text", name: "🚀│vip-class", aliases: ["vip", "vip class"], roleView: "🚀 VIP" },
      ],
    },
    {
      category: "🛠 SUPPORT",
      channels: [
        { type: "text", name: "🎫│เปิดตั๋ว", aliases: ["ticket", "เปิดตั๋ว"], verifiedOnly: true },
        { type: "text", name: "🆘│แจ้งปัญหา", aliases: ["support", "แจ้งปัญหา"], verifiedOnly: true },
      ],
    },
    {
      category: "🎵 MUSIC",
      channels: [
        { type: "text", name: "🎵│music", aliases: ["music"], verifiedOnly: true },
        { type: "voice", name: "🎶 Music Room 1", aliases: ["music room 1"], verifiedOnly: true },
        { type: "voice", name: "🎶 Music Room 2", aliases: ["music room 2"], verifiedOnly: true },
      ],
    },
    {
      category: "👨‍💻 ADMIN",
      channels: [
        { type: "text", name: "📁│รายงานปัญหา", aliases: ["admin-report"], staffOnly: true },
        { type: "voice", name: "🎓 ทีมงาน", aliases: ["team voice"], staffOnly: true },
        { type: "voice", name: "🛡 ผู้ดูแลระบบ", aliases: ["admin voice"], adminOnly: true },
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
    GatewayIntentBits.GuildPresences,
  ],
});

function normalizeName(name = "") {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s|_-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function baseName(name = "") {
  return normalizeName(name).replace(/\|/g, " ");
}

function getRole(guild, name) {
  return guild.roles.cache.find((r) => r.name === name) || null;
}

function getChannelExact(guild, name, type = null) {
  return guild.channels.cache.find((c) => {
    if (type) return c.name === name && c.type === type;
    return c.name === name;
  }) || null;
}

function getChannelType(kind) {
  return kind === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText;
}

function getAllManagedNames() {
  const names = new Set();
  for (const section of CONFIG.structure) {
    names.add(section.category);
    for (const ch of section.channels) names.add(ch.name);
  }
  return names;
}

async function ensureRole(guild, roleConfig) {
  let role = getRole(guild, roleConfig.name);
  if (!role) {
    role = await guild.roles.create({
      name: roleConfig.name,
      color: roleConfig.color,
      hoist: roleConfig.hoist,
      mentionable: false,
      reason: "สร้าง role อัตโนมัติ",
    });
  }
  return role;
}

async function ensureAllRoles(guild) {
  for (const roleConfig of CONFIG.roles) {
    await ensureRole(guild, roleConfig);
  }
}

async function ensureCategory(guild, name) {
  let category = getChannelExact(guild, name, ChannelType.GuildCategory);

  if (!category) {
    const targetBase = baseName(name);
    category = guild.channels.cache.find(
      (c) =>
        c.type === ChannelType.GuildCategory &&
        baseName(c.name) === targetBase
    ) || null;
  }

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      reason: "สร้าง category อัตโนมัติ",
    });
  } else if (category.name !== name) {
    await category.setName(name, "ปรับชื่อ category ให้ตรงโครงสร้าง");
  }

  return category;
}

function buildPermissionOverwrites(guild, botMember, rule = {}) {
  const overwrites = [];

  const everyone = {
    id: guild.roles.everyone.id,
    allow: [],
    deny: [],
  };

  const verifiedRole = getRole(guild, CONFIG.verifyRole);
  const teamRole = getRole(guild, "🎓 Team");
  const modRole = getRole(guild, "📋 Moderator");
  const adminRole = getRole(guild, "🛡 Admin");
  const founderRole = getRole(guild, "👑 Founder");

  if (rule.everyoneView) {
    everyone.allow.push(PermissionsBitField.Flags.ViewChannel);
  } else {
    everyone.deny.push(PermissionsBitField.Flags.ViewChannel);
  }

  if (rule.everyoneSend === false) {
    everyone.deny.push(
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.Connect
    );
  }

  overwrites.push(everyone);

  if (verifiedRole && rule.verifiedOnly) {
    overwrites.push({
      id: verifiedRole.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.Speak,
      ],
    });
  }

  if (rule.roleView) {
    const specialRole = getRole(guild, rule.roleView);
    if (specialRole) {
      overwrites.push({
        id: specialRole.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
        ],
      });
    }
  }

  if (rule.staffOnly) {
    [teamRole, modRole, adminRole, founderRole].filter(Boolean).forEach((r) => {
      overwrites.push({
        id: r.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
        ],
      });
    });
  }

  if (rule.adminOnly) {
    [adminRole, founderRole].filter(Boolean).forEach((r) => {
      overwrites.push({
        id: r.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
        ],
      });
    });
  }

  overwrites.push({
    id: botMember.id,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.Connect,
      PermissionsBitField.Flags.Speak,
    ],
  });

  return overwrites;
}

function findMatchingChannel(guild, channelConfig) {
  const desiredType = getChannelType(channelConfig.type);
  const exact = getChannelExact(guild, channelConfig.name, desiredType);
  if (exact) return exact;

  const targets = [baseName(channelConfig.name)];
  if (channelConfig.aliases?.length) {
    for (const a of channelConfig.aliases) targets.push(baseName(a));
  }

  return guild.channels.cache.find((c) => {
    if (c.type !== desiredType) return false;
    const current = baseName(c.name);
    return targets.includes(current);
  }) || null;
}

async function ensureChannel(guild, category, botMember, channelConfig, managedIds) {
  const type = getChannelType(channelConfig.type);
  let channel = findMatchingChannel(guild, channelConfig);
  const permissionOverwrites = buildPermissionOverwrites(guild, botMember, channelConfig);

  if (!channel) {
    channel = await guild.channels.create({
      name: channelConfig.name,
      type,
      parent: category.id,
      permissionOverwrites,
      reason: "สร้างห้องอัตโนมัติ",
    });
  } else {
    if (channel.name !== channelConfig.name) {
      await channel.setName(channelConfig.name, "ปรับชื่อห้องให้ตรงโครงสร้าง");
    }
    if (channel.parentId !== category.id) {
      await channel.setParent(category.id, { lockPermissions: false });
    }
    await channel.permissionOverwrites.set(permissionOverwrites);
  }

  managedIds.add(channel.id);
  return channel;
}

async function ensureFullStructure(guild) {
  const botMember = await guild.members.fetchMe();
  const managedIds = new Set();

  for (const section of CONFIG.structure) {
    const category = await ensureCategory(guild, section.category);
    managedIds.add(category.id);

    for (const channelConfig of section.channels) {
      await ensureChannel(guild, category, botMember, channelConfig, managedIds);
    }
  }

  return managedIds;
}

function buildVerifyPanel() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CONFIG.ids.verifyButton)
      .setLabel("กดรับยศ Verified")
      .setStyle(ButtonStyle.Success)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(CONFIG.ids.businessSelect)
      .setPlaceholder("เลือกยศสายธุรกิจของคุณ")
      .setMinValues(0)
      .setMaxValues(CONFIG.selfAssignBusinessRoles.length)
      .addOptions(
        CONFIG.selfAssignBusinessRoles.map((roleName) => ({
          label: roleName,
          value: roleName,
        }))
      )
  );

  return {
    content:
      "## 🎭 ศูนย์รับยศ\n" +
      `1. กดปุ่มเพื่อรับยศ **${CONFIG.verifyRole}**\n` +
      "2. เลือกยศสายธุรกิจจากเมนูด้านล่าง\n" +
      "3. ระบบจะซิงก์ห้องให้ตามยศ",
    components: [row1, row2],
  };
}

async function clearBotMessagesInVerify(channel) {
  try {
    const messages = await channel.messages.fetch({ limit: 30 });
    const botMessages = messages.filter((m) => m.author.id === client.user.id);
    for (const msg of botMessages.values()) {
      await msg.delete().catch(() => {});
    }
  } catch {}
}

async function sendOrRefreshVerifyPanel(guild) {
  const channel = getChannelExact(guild, "🎭│รับยศ", ChannelType.GuildText);
  if (!channel) return false;

  await clearBotMessagesInVerify(channel);
  await channel.send(buildVerifyPanel());
  return true;
}

function findStatChannel(guild, prefix) {
  return guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildVoice &&
      typeof ch.name === "string" &&
      ch.name.startsWith(prefix)
  ) || null;
}

async function updateStatsForGuild(guild) {
  try {
    await guild.members.fetch();

    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter((m) => m.user.bot).size;
    const onlineCount = guild.members.cache.filter(
      (m) => !m.user.bot && m.presence && m.presence.status !== "offline"
    ).size;

    const statsCategory = await ensureCategory(guild, CONFIG.statsCategory);

    const entries = [
      { prefix: "👥 สมาชิกทั้งหมด: ", value: totalMembers },
      { prefix: "🟢 ออนไลน์: ", value: onlineCount },
      { prefix: "🤖 บอท: ", value: botCount },
    ];

    for (const entry of entries) {
      let ch = findStatChannel(guild, entry.prefix);
      const newName = `${entry.prefix}${entry.value}`;

      if (!ch) {
        ch = await guild.channels.create({
          name: newName,
          type: ChannelType.GuildVoice,
          parent: statsCategory.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
              deny: [PermissionsBitField.Flags.Connect],
            },
          ],
          reason: "สร้างห้องสถิติอัตโนมัติ",
        });
      } else {
        if (ch.name !== newName) await ch.setName(newName);
        if (ch.parentId !== statsCategory.id) {
          await ch.setParent(statsCategory.id, { lockPermissions: false });
        }
      }
    }
  } catch (error) {
    console.error("Stats update error:", error);
  }
}

async function archiveOldChannels(guild, managedIds) {
  const archiveCategory = await ensureCategory(guild, CONFIG.archiveCategory);

  const protectedCategoryNames = new Set([
    CONFIG.archiveCategory,
    CONFIG.statsCategory,
  ]);

  const protectedChannelNames = getAllManagedNames();

  let moved = 0;

  for (const channel of guild.channels.cache.values()) {
    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildVoice
    ) continue;

    if (managedIds.has(channel.id)) continue;
    if (protectedChannelNames.has(channel.name)) continue;
    if (channel.parent && protectedCategoryNames.has(channel.parent.name)) continue;

    try {
      await channel.setParent(archiveCategory.id, { lockPermissions: false });
      moved++;
    } catch (e) {
      console.error(`archive failed: ${channel.name}`, e.message);
    }
  }

  return moved;
}

client.once("clientReady", async () => {
  console.log(`บอทออนไลน์แล้ว ${client.user.tag}`);
  console.log("ใช้ !setupfull เพื่อซิงก์ห้อง/ยศทั้งหมด");
  console.log("ใช้ !cleanupold เพื่อย้ายห้องเก่าไป archive");

  for (const guild of client.guilds.cache.values()) {
    await updateStatsForGuild(guild);
  }

  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await updateStatsForGuild(guild);
    }
  }, 5 * 60 * 1000);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const command = message.content.slice(PREFIX.length).trim().toLowerCase();

  if (command === "testbot") {
    return message.reply("บอทอ่านคำสั่งได้แล้ว");
  }

  if (command === "setupfull") {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply("คำสั่งนี้ใช้ได้เฉพาะแอดมิน");
      }

      const botMember = await message.guild.members.fetchMe();
      const needPerms = [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.ManageRoles,
      ];

      const missing = needPerms.filter((perm) => !botMember.permissions.has(perm));
      if (missing.length) {
        return message.reply(
          "บอทยังมีสิทธิ์ไม่ครบ ต้องมี: View Channels, Send Messages, Read Message History, Manage Channels, Manage Roles"
        );
      }

      await message.reply("กำลังซิงก์ห้อง ยศ และระบบทั้งหมด...");

      await ensureAllRoles(message.guild);
      const managedIds = await ensureFullStructure(message.guild);
      await updateStatsForGuild(message.guild);
      await sendOrRefreshVerifyPanel(message.guild);

      await message.channel.send(
        `ซิงก์ระบบเสร็จแล้ว ✅\nจัดการห้องหลักครบแล้ว\nถ้าต้องการย้ายห้องเก่าไปเก็บ ใช้ \`!cleanupold\``
      );
    } catch (error) {
      console.error("setupfull error:", error);
      await message.reply("เกิดข้อผิดพลาดระหว่างซิงก์ระบบ");
    }
  }

  if (command === "sendroles") {
    try {
      const ok = await sendOrRefreshVerifyPanel(message.guild);
      if (!ok) return message.reply("ยังไม่พบห้อง 🎭│รับยศ");
      await message.reply("ส่งแผงรับยศใหม่แล้ว");
    } catch (error) {
      console.error(error);
      await message.reply("ส่งแผงรับยศไม่สำเร็จ");
    }
  }

  if (command === "setupstats") {
    try {
      await updateStatsForGuild(message.guild);
      await message.reply("อัปเดตห้องสถิติเรียบร้อยแล้ว");
    } catch (error) {
      console.error(error);
      await message.reply("อัปเดตห้องสถิติไม่สำเร็จ");
    }
  }

  if (command === "cleanupold") {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply("คำสั่งนี้ใช้ได้เฉพาะแอดมิน");
      }

      await message.reply("กำลังสแกนและย้ายห้องเก่าไป archive...");

      await ensureAllRoles(message.guild);
      const managedIds = await ensureFullStructure(message.guild);
      const moved = await archiveOldChannels(message.guild, managedIds);

      await message.channel.send(`ย้ายห้องเก่าไป archive แล้ว ${moved} ห้อง ✅`);
    } catch (error) {
      console.error("cleanupold error:", error);
      await message.reply("เกิดข้อผิดพลาดระหว่าง cleanup ห้องเก่า");
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.guild) return;

  if (interaction.isButton() && interaction.customId === CONFIG.ids.verifyButton) {
    try {
      const guild = interaction.guild;
      const member = await guild.members.fetch(interaction.user.id);
      const role = getRole(guild, CONFIG.verifyRole);
      const botMember = await guild.members.fetchMe();

      if (!role) {
        return interaction.reply({
          content: `ไม่พบ role ${CONFIG.verifyRole}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (role.position >= botMember.roles.highest.position) {
        return interaction.reply({
          content: `บอทไม่สามารถให้ยศ ${CONFIG.verifyRole} ได้ เพราะ role ของบอทต้องอยู่สูงกว่า`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (!member.roles.cache.has(role.id)) {
        await member.roles.add(role);
      }

      const memberRole = getRole(guild, "🌿 Member");
      if (
        memberRole &&
        !member.roles.cache.has(memberRole.id) &&
        memberRole.position < botMember.roles.highest.position
      ) {
        await member.roles.add(memberRole).catch(() => {});
      }

      return interaction.reply({
        content: `รับยศ ${CONFIG.verifyRole} เรียบร้อยแล้ว 🎉`,
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

  if (interaction.isStringSelectMenu() && interaction.customId === CONFIG.ids.businessSelect) {
    try {
      const guild = interaction.guild;
      const member = await guild.members.fetch(interaction.user.id);
      const selected = interaction.values;
      const botMember = await guild.members.fetchMe();

      const businessRoles = CONFIG.selfAssignBusinessRoles
        .map((name) => getRole(guild, name))
        .filter(Boolean);

      for (const role of businessRoles) {
        if (role.position >= botMember.roles.highest.position) continue;

        if (selected.includes(role.name)) {
          if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role).catch(() => {});
          }
        } else {
          if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role).catch(() => {});
          }
        }
      }

      return interaction.reply({
        content:
          selected.length > 0
            ? `อัปเดตยศสายธุรกิจแล้ว: ${selected.join(", ")}`
            : "ล้างยศสายธุรกิจทั้งหมดแล้ว",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("select menu error:", error);
      return interaction.reply({
        content: "เกิดข้อผิดพลาด",
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  }
});

client.on("guildMemberAdd", async (member) => {
  await updateStatsForGuild(member.guild);
});

client.on("guildMemberRemove", async (member) => {
  await updateStatsForGuild(member.guild);
});

client.on("presenceUpdate", async (oldPresence, newPresence) => {
  const guild = newPresence?.guild || oldPresence?.guild;
  if (!guild) return;
  await updateStatsForGuild(guild);
});

client.on("error", console.error);
process.on("unhandledRejection", console.error);

client.login(TOKEN);
