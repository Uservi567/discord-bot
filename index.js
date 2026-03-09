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
  PermissionFlagsBits,
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
  archiveCategoryName: "🗃️ ห้องเก่า",
  statsCategoryName: "📊 SERVER STATUS",

  managedRoles: [
    { name: "👑 เจ้าของธุรกิจ", color: 0xe91e63, hoist: true, aliases: ["founder"] },
    { name: "🛡 แอดมิน สรุปผล", color: 0xf44336, hoist: true, aliases: ["admin"] },
    { name: "🎓 ทีมงาน", color: 0x2196f3, hoist: true, aliases: ["staff", "team"] },
    { name: "🤖 RoleBot", color: 0x95a5a6, hoist: true, aliases: ["bot", "rolebot"] },

    { name: "💎 นักเรียนพิเศษ", color: 0xf1c40f, hoist: true, aliases: ["premium", "premium student"] },
    { name: "🟣 นักเรียน RANK B", color: 0x8e44ad, hoist: true, aliases: ["rank b", "rank-b"] },
    { name: "🧡 ESTY Student", color: 0xe67e22, hoist: true, aliases: ["etsy student", "esty"] },
    { name: "📦 amazon.Student", color: 0x3498db, hoist: true, aliases: ["amazon student", "amazon.student"] },
    { name: "🚀 VIP", color: 0xff9800, hoist: true, aliases: ["vip class", "vip"] },

    { name: "🎵 Music", color: 0x607d8b, hoist: false, aliases: ["music"] },
  ],

  layout: [
    {
      category: "✨ START HERE",
      channels: [
        {
          type: "text",
          name: "📜│กฎ",
          aliases: ["กฎ", "rules"],
          everyoneView: true,
          everyoneSend: false,
          seed: [
            "# 📜 กฎของเซิร์ฟเวอร์",
            "1. เคารพกันและกัน",
            "2. ห้ามสแปมหรือปั่น",
            "3. ใช้ห้องให้ตรงประเภท",
            "4. ห้ามโฆษณาโดยไม่ได้รับอนุญาต"
          ]
        },
        {
          type: "text",
          name: "📢│ประกาศ",
          aliases: ["ประกาศ", "announcements"],
          everyoneView: true,
          everyoneSend: false,
          seed: [
            "# 📢 ประกาศ",
            "ห้องนี้ใช้สำหรับประกาศสำคัญจากทีมงาน"
          ]
        },
        {
          type: "text",
          name: "👋│welcome",
          aliases: ["welcome", "ยินดีต้อนรับ", "welcome-chat"],
          everyoneView: true,
          everyoneSend: false,
          seed: [
            "# 👋 ยินดีต้อนรับ",
            "เริ่มต้นที่ห้อง `🎭│รับยศ` เพื่อเปิดห้องทั้งหมดของเซิร์ฟเวอร์"
          ]
        },
        {
          type: "text",
          name: "🎭│รับยศ",
          aliases: ["รับยศ", "verify", "roles"],
          everyoneView: true,
          everyoneSend: false,
          seed: []
        },
        {
          type: "text",
          name: "🔗│เชิญเพื่อน",
          aliases: ["invite", "ลิงก์เชิญ", "ลิงก์เชิญเพื่อน"],
          everyoneView: true,
          everyoneSend: false,
          seed: [
            "# 🔗 เชิญเพื่อน",
            "แชร์ลิงก์เชิญเซิร์ฟเวอร์นี้ให้เพื่อนของคุณได้ที่นี่"
          ]
        }
      ]
    },
    {
      category: "📊 SERVER STATUS",
      channels: [
        { type: "voice", name: "👥 สมาชิกทั้งหมด: 0", stat: "total" },
        { type: "voice", name: "🟢 ออนไลน์: 0", stat: "online" },
        { type: "voice", name: "🤖 บอท: 0", stat: "bots" }
      ]
    },
    {
      category: "💬 COMMUNITY",
      channels: [
        { type: "text", name: "💬│พูดคุย", aliases: ["พูดคุย", "chat"], memberOnly: true, seed: ["# 💬 พูดคุย", "ห้องพูดคุยทั่วไปของคอมมูนิตี้"] },
        { type: "text", name: "📷│แชร์ผลงาน", aliases: ["แชร์ผลงาน", "ผลงาน", "showcase", "ช่องส่งผลงาน"], memberOnly: true, seed: ["# 📷 แชร์ผลงาน", "อัปเดตผลงานหรือสิ่งที่คุณกำลังทำอยู่ได้ที่นี่"] },
        { type: "text", name: "❓│ถามตอบ", aliases: ["ถามตอบ", "qna"], memberOnly: true, seed: ["# ❓ ถามตอบ", "ถามคำถามเกี่ยวกับธุรกิจ การทำงาน หรือการใช้งานเซิร์ฟเวอร์"] },
        { type: "text", name: "📈│ผลลัพธ์", aliases: ["result", "ผลลัพธ์", "result-ผลลัพธ์"], memberOnly: true, seed: ["# 📈 ผลลัพธ์", "แชร์ผลลัพธ์ ความคืบหน้า และชัยชนะของคุณ"] }
      ]
    },
    {
      category: "💼 BUSINESS ZONE",
      channels: [
        { type: "text", name: "💸│affiliate", aliases: ["affiliate"], memberOnly: true, seed: ["# 💸 Affiliate"] },
        { type: "text", name: "🧡│etsy", aliases: ["etsy"], memberOnly: true, seed: ["# 🧡 Etsy"] },
        { type: "text", name: "💰│amazon", aliases: ["amazon"], memberOnly: true, seed: ["# 💰 Amazon"] },
        { type: "text", name: "📦│dropshipping", aliases: ["dropshipping", "dropship"], memberOnly: true, seed: ["# 📦 Dropshipping"] },
        { type: "text", name: "👕│amazon-merch", aliases: ["amazon merch", "merch", "amazon-merch"], memberOnly: true, seed: ["# 👕 Amazon Merch"] },
        { type: "text", name: "🧠│แชร์ไอเดีย", aliases: ["แชร์ไอเดีย", "ideas"], memberOnly: true, seed: ["# 🧠 แชร์ไอเดีย"] }
      ]
    },
    {
      category: "🗣 TALK ZONE",
      channels: [
        { type: "voice", name: "💬 พูดคุย", aliases: ["พูดคุย voice"], memberOnly: true },
        { type: "voice", name: "💼 ธุรกิจ", aliases: ["ธุรกิจ"], memberOnly: true },
        { type: "voice", name: "💵 การเงิน", aliases: ["การเงิน"], memberOnly: true },
        { type: "voice", name: "📚 อ่านหนังสือ", aliases: ["อ่านหนังสือ"], memberOnly: true },
        { type: "voice", name: "🛠 ทำงาน", aliases: ["ทำงาน"], memberOnly: true }
      ]
    },
    {
      category: "🎓 CLASS / VIP",
      channels: [
        { type: "text", name: "💎│นักเรียนพิเศษ", aliases: ["นักเรียนพิเศษ", "premium", "premium-student"], roleView: "💎 นักเรียนพิเศษ", seed: ["# 💎 นักเรียนพิเศษ"] },
        { type: "text", name: "🟣│rank-b", aliases: ["นักเรียน rank b", "rank b", "rank-b"], roleView: "🟣 นักเรียน RANK B", seed: ["# 🟣 Rank B"] },
        { type: "text", name: "🧡│etsy-student", aliases: ["esty student", "etsy student"], roleView: "🧡 ESTY Student", seed: ["# 🧡 Etsy Student"] },
        { type: "text", name: "📦│amazon-student", aliases: ["amazon student", "amazon.student"], roleView: "📦 amazon.Student", seed: ["# 📦 Amazon Student"] },
        { type: "text", name: "🚀│vip-class", aliases: ["vip", "vip class", "vip-class"], roleView: "🚀 VIP", seed: ["# 🚀 VIP Class"] }
      ]
    },
    {
      category: "🎵 MUSIC",
      channels: [
        { type: "text", name: "🎵│music", aliases: ["music"], memberOnly: true, seed: ["# 🎵 Music"] },
        { type: "voice", name: "🎶 Music Room 1", aliases: ["music room", "music room 1"], memberOnly: true }
      ]
    },
    {
      category: "🛠 SUPPORT",
      channels: [
        { type: "text", name: "🎫│เปิดตั๋ว", aliases: ["ticket", "เปิดตั๋ว"], memberOnly: true, seed: ["# 🎫 Support Ticket"] },
        { type: "text", name: "🆘│แจ้งปัญหา", aliases: ["support", "แจ้งปัญหา"], memberOnly: true, seed: ["# 🆘 แจ้งปัญหา"] }
      ]
    },
    {
      category: "👨‍💻 ADMIN",
      channels: [
        { type: "text", name: "📁│หลังบ้าน", aliases: ["รายงานปัญหา", "หลังบ้าน", "admin"], staffOnly: true, seed: ["# 📁 หลังบ้านทีมงาน"] },
        { type: "voice", name: "🛡 Staff Room", aliases: ["ทีมงาน", "ผู้ดูแลระบบ", "admin voice"], staffOnly: true }
      ]
    }
  ]
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

/* ---------------- helpers ---------------- */

function normalizeName(name = "") {
  return name.toLowerCase().replace(/[^\p{L}\p{N}\s|_-]/gu, "").replace(/\s+/g, " ").trim();
}

function simplifiedName(name = "") {
  return normalizeName(name).replace(/\|/g, " ");
}

function getChannelType(kind) {
  return kind === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText;
}

function getRoleByName(guild, name) {
  return guild.roles.cache.find((r) => r.name === name) || null;
}

function getMemberRole(guild) {
  return guild.roles.cache.get(CONFIG.memberRoleId) || null;
}

function getExactChannel(guild, name, type = null) {
  return guild.channels.cache.find((c) => {
    if (type !== null) return c.name === name && c.type === type;
    return c.name === name;
  }) || null;
}

async function ensureRole(guild, cfg) {
  let role = getRoleByName(guild, cfg.name);
  if (!role) {
    role = await guild.roles.create({
      name: cfg.name,
      color: cfg.color,
      hoist: cfg.hoist,
      mentionable: false,
      reason: "สร้าง role อัตโนมัติ",
    });
  }
  return role;
}

async function ensureRoles(guild) {
  for (const roleCfg of CONFIG.roles) {
    await ensureRole(guild, roleCfg);
  }
}

async function dedupeRoles(guild) {
  const memberRole = getMemberRole(guild);
  const members = await guild.members.fetch();

  const canonicalRoles = [];

  if (memberRole) {
    canonicalRoles.push({
      role: memberRole,
      aliases: ["member", "✅ member", "verified", "✅ verified"],
      skipDeleteId: memberRole.id,
    });
  }

  for (const cfg of CONFIG.managedRoles) {
    const role = getRoleByName(guild, cfg.name);
    if (role) {
      canonicalRoles.push({
        role,
        aliases: cfg.aliases || [],
        skipDeleteId: role.id,
      });
    }
  }

  let deduped = 0;

  for (const entry of canonicalRoles) {
    const canonical = entry.role;
    const names = new Set([simplifiedName(canonical.name), ...entry.aliases.map(simplifiedName)]);

    const dupes = guild.roles.cache.filter((r) => {
      if (r.id === entry.skipDeleteId) return false;
      return names.has(simplifiedName(r.name));
    });

    for (const dup of dupes.values()) {
      for (const member of members.values()) {
        if (member.roles.cache.has(dup.id) && !member.roles.cache.has(canonical.id)) {
          await member.roles.add(canonical).catch(() => {});
        }
        if (member.roles.cache.has(dup.id)) {
          await member.roles.remove(dup).catch(() => {});
        }
      }

      for (const channel of guild.channels.cache.values()) {
        const overwrite = channel.permissionOverwrites.cache.get(dup.id);
        if (overwrite) {
          await channel.permissionOverwrites.edit(canonical.id, {
            ViewChannel: overwrite.allow.has(PermissionFlagsBits.ViewChannel)
              ? true
              : overwrite.deny.has(PermissionFlagsBits.ViewChannel)
              ? false
              : null,
            SendMessages: overwrite.allow.has(PermissionFlagsBits.SendMessages)
              ? true
              : overwrite.deny.has(PermissionFlagsBits.SendMessages)
              ? false
              : null,
            ReadMessageHistory: overwrite.allow.has(PermissionFlagsBits.ReadMessageHistory)
              ? true
              : overwrite.deny.has(PermissionFlagsBits.ReadMessageHistory)
              ? false
              : null,
            Connect: overwrite.allow.has(PermissionFlagsBits.Connect)
              ? true
              : overwrite.deny.has(PermissionFlagsBits.Connect)
              ? false
              : null,
            Speak: overwrite.allow.has(PermissionFlagsBits.Speak)
              ? true
              : overwrite.deny.has(PermissionFlagsBits.Speak)
              ? false
              : null,
          }).catch(() => {});
          await channel.permissionOverwrites.delete(dup.id).catch(() => {});
        }
      }

      await dup.delete("ลบ role ซ้ำหลังรวมเข้ายศหลัก").catch(() => {});
      deduped++;
    }
  }

  return deduped;
}

async function ensureCategory(guild, name) {
  let category = getExactChannel(guild, name, ChannelType.GuildCategory);

  if (!category) {
    const target = simplifiedName(name);
    category =
      guild.channels.cache.find(
        (c) => c.type === ChannelType.GuildCategory && simplifiedName(c.name) === target
      ) || null;
  }

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      reason: "สร้าง category อัตโนมัติ",
    });
  } else if (category.name !== name) {
    await category.setName(name, "ปรับชื่อ category");
  }

  return category;
}

function buildPermissionOverwrites(guild, botMember, channelRule = {}) {
  const overwrites = [];

  const everyone = {
    id: guild.roles.everyone.id,
    allow: [],
    deny: [],
  };

  const memberRole = getMemberRole(guild);
  const staffRole = getRoleByName(guild, "🎓 ทีมงาน");
  const adminRole = getRoleByName(guild, "🛡 แอดมิน สรุปผล");
  const founderRole = getRoleByName(guild, "👑 เจ้าของธุรกิจ");

  if (channelRule.everyoneView) {
    everyone.allow.push(PermissionsBitField.Flags.ViewChannel);
  } else {
    everyone.deny.push(PermissionsBitField.Flags.ViewChannel);
  }

  if (channelRule.everyoneSend === false) {
    everyone.deny.push(
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.Connect
    );
  }

  overwrites.push(everyone);

  if (channelRule.memberOnly && memberRole) {
    overwrites.push({
      id: memberRole.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.Speak,
      ],
    });
  }

  if (channelRule.roleView) {
    const role = getRoleByName(guild, channelRule.roleView);
    if (role) {
      overwrites.push({
        id: role.id,
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

  if (channelRule.staffOnly) {
    [staffRole, adminRole, founderRole].filter(Boolean).forEach((role) => {
      overwrites.push({
        id: role.id,
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

function findMatchingChannels(guild, channelCfg) {
  const targetType = getChannelType(channelCfg.type);
  const acceptableNames = [simplifiedName(channelCfg.name)];
  for (const alias of channelCfg.aliases || []) {
    acceptableNames.push(simplifiedName(alias));
  }

  return guild.channels.cache
    .filter((c) => c.type === targetType)
    .filter((c) => acceptableNames.includes(simplifiedName(c.name)))
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

async function ensureChannel(guild, category, botMember, channelCfg, managedIds, archiveCategory) {
  const matches = findMatchingChannels(guild, channelCfg);

  let channel = matches.first() || null;
  const duplicates = matches.size > 1 ? [...matches.values()].slice(1) : [];
  const overwrites = buildPermissionOverwrites(guild, botMember, channelCfg);

  if (!channel) {
    channel = await guild.channels.create({
      name: channelCfg.name,
      type: getChannelType(channelCfg.type),
      parent: category.id,
      permissionOverwrites: overwrites,
      reason: "สร้างห้องใหม่จากระบบ smartfix",
    });
  } else {
    if (channel.name !== channelCfg.name) {
      await channel.setName(channelCfg.name, "เปลี่ยนชื่อห้องหลัก");
    }
    if (channel.parentId !== category.id) {
      await channel.setParent(category.id, { lockPermissions: false });
    }
    await channel.permissionOverwrites.set(overwrites);
  }

  for (const dup of duplicates) {
    if (archiveCategory && dup.id !== channel.id) {
      await dup.setParent(archiveCategory.id, { lockPermissions: false }).catch(() => {});
      if (!dup.name.startsWith("old-")) {
        await dup.setName(`old-${dup.name}`).catch(() => {});
      }
    }
  }

  managedIds.add(channel.id);
  return channel;
}

async function syncFullLayout(guild) {
  const botMember = await guild.members.fetchMe();
  const managedIds = new Set();
  const archiveCategory = await ensureCategory(guild, CONFIG.archiveCategoryName);

  for (const section of CONFIG.layout) {
    const category = await ensureCategory(guild, section.category);
    managedIds.add(category.id);

    for (const channelCfg of section.channels) {
      await ensureChannel(guild, category, botMember, channelCfg, managedIds, archiveCategory);
    }
  }

  return managedIds;
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
      "## 🎭 ศูนย์รับยศ\n" +
      `กดปุ่มด้านล่างเพื่อรับยศ **${roleName}**\n` +
      "เมื่อรับยศแล้ว ห้องทั่วไปทั้งหมดจะเปิดให้ใช้งานทันที",
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

  const hasNonBotContent = messages.some((m) => !m.author.bot && m.content.trim() !== "");
  if (hasNonBotContent) return false;

  const hasBotContent = messages.some((m) => m.author.id === client.user.id);
  if (hasBotContent) return false;

  await channel.send(seedLines.join("\n")).catch(() => {});
  return true;
}

async function seedAllRooms(guild) {
  let seeded = 0;

  for (const section of CONFIG.layout) {
    for (const channelCfg of section.channels) {
      if (!channelCfg.seed || channelCfg.seed.length === 0) continue;
      const ch = getExactChannel(guild, channelCfg.name, ChannelType.GuildText);
      if (!ch) continue;

      const didSeed = await seedRoomIfEmpty(ch, channelCfg.seed);
      if (didSeed) seeded++;
    }
  }

  return seeded;
}

function findStatChannel(guild, prefix) {
  return guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildVoice && c.name.startsWith(prefix)
  ) || null;
}

async function updateStats(guild) {
  try {
    await guild.members.fetch();

    const total = guild.memberCount;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const online = guild.members.cache.filter(
      (m) => !m.user.bot && m.presence && m.presence.status !== "offline"
    ).size;

    const category = await ensureCategory(guild, CONFIG.statsCategoryName);

    const stats = [
      { prefix: "👥 สมาชิกทั้งหมด: ", value: total },
      { prefix: "🟢 ออนไลน์: ", value: online },
      { prefix: "🤖 บอท: ", value: bots },
    ];

    for (const item of stats) {
      let channel = findStatChannel(guild, item.prefix);
      const newName = `${item.prefix}${item.value}`;

      if (!channel) {
        channel = await guild.channels.create({
          name: newName,
          type: ChannelType.GuildVoice,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionsBitField.Flags.ViewChannel],
              deny: [PermissionsBitField.Flags.Connect],
            },
          ],
          reason: "สร้างห้องสถิติ",
        });
      } else {
        if (channel.name !== newName) {
          await channel.setName(newName, "อัปเดตสถิติแบบเรียลไทม์");
        }
        if (channel.parentId !== category.id) {
          await channel.setParent(category.id, { lockPermissions: false });
        }
      }
    }
  } catch (error) {
    console.error("updateStats error:", error);
  }
}

async function archiveUnmanagedChannels(guild, managedIds) {
  const archiveCategory = await ensureCategory(guild, CONFIG.archiveCategoryName);
  let moved = 0;

  for (const channel of guild.channels.cache.values()) {
    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildVoice
    ) continue;

    if (managedIds.has(channel.id)) continue;
    if (channel.parentId === archiveCategory.id) continue;

    try {
      await channel.setParent(archiveCategory.id, { lockPermissions: false });
      moved++;
    } catch (error) {
      console.error(`ย้ายห้อง ${channel.name} ไม่สำเร็จ:`, error.message);
    }
  }

  return moved;
}

async function auditServer(guild) {
  const memberRole = getMemberRole(guild);

  let duplicateRoleGroups = 0;
  let duplicateChannelGroups = 0;
  let missingManagedRoles = 0;
  let memberProtectedBroken = 0;

  for (const roleCfg of CONFIG.managedRoles) {
    const role = getRoleByName(guild, roleCfg.name);
    if (!role) missingManagedRoles++;
  }

  const roleBuckets = new Map();
  for (const role of guild.roles.cache.values()) {
    const key = simplifiedName(role.name);
    if (!roleBuckets.has(key)) roleBuckets.set(key, []);
    roleBuckets.get(key).push(role);
  }
  for (const group of roleBuckets.values()) {
    if (group.length > 1) duplicateRoleGroups++;
  }

  const channelBuckets = new Map();
  for (const channel of guild.channels.cache.values()) {
    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildVoice
    ) continue;

    const key = `${channel.type}:${simplifiedName(channel.name)}`;
    if (!channelBuckets.has(key)) channelBuckets.set(key, []);
    channelBuckets.get(key).push(channel);
  }
  for (const group of channelBuckets.values()) {
    if (group.length > 1) duplicateChannelGroups++;
  }

  if (memberRole) {
    for (const section of CONFIG.layout) {
      for (const channelCfg of section.channels) {
        if (!channelCfg.memberOnly) continue;
        const ch = getExactChannel(guild, channelCfg.name, getChannelType(channelCfg.type));
        if (!ch) continue;

        const ow = ch.permissionOverwrites.cache.get(memberRole.id);
        if (!ow) memberProtectedBroken++;
      }
    }
  }

  return {
    memberRoleFound: !!memberRole,
    duplicateRoleGroups,
    duplicateChannelGroups,
    missingManagedRoles,
    memberProtectedBroken,
  };
}

/* events */

client.once("clientReady", async () => {
  console.log(`บอทออนไลน์แล้ว ${client.user.tag}`);
  console.log("ใช้ !smartfix เพื่อจัดระเบียบเซิร์ฟเวอร์แบบอัจฉริยะ");
  console.log("ใช้ !deduperoles เพื่อรวม role ซ้ำ");
  console.log("ใช้ !archiveold เพื่อย้ายห้องเก่าไปเก็บ");
  console.log("ใช้ !seedrooms เพื่อเติมข้อความห้องใหม่");
  console.log("ใช้ !sendverify เพื่อรีเฟรชปุ่มรับยศ");
  console.log("ใช้ !audit เพื่อวิเคราะห์เซิร์ฟเวอร์");

  for (const guild of client.guilds.cache.values()) {
    await updateStats(guild).catch(() => {});
  }

  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await updateStats(guild).catch(() => {});
    }
  }, 5 * 60 * 1000);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  console.log("MESSAGE:", message.content);

  if (message.content === "!testbot") {
    return message.reply("บอทอ่านคำสั่งได้แล้ว");
  }

  if (!message.content.startsWith(PREFIX)) return;

  const cmd = message.content.slice(PREFIX.length).trim().toLowerCase();

  if (cmd === "smartfix") {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply("คำสั่งนี้ใช้ได้เฉพาะแอดมิน");
      }

      const memberRole = getMemberRole(message.guild);
      if (!memberRole) {
        return message.reply(`ไม่พบ role Member ตาม ID นี้: ${CONFIG.memberRoleId}`);
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

      const status = await message.reply(`เริ่มจัดระเบียบโดยใช้ยศเดิม **${memberRole.name}**...`);

      await status.edit("1/5 กำลังเช็กและสร้าง role ที่จำเป็น...");
      await ensureRoles(message.guild);

      await status.edit("2/5 กำลังซิงก์ห้องเก่าเข้ากับโครงสร้างใหม่...");
      await syncFullLayout(message.guild);

      await status.edit("3/5 กำลังอัปเดตห้องสถิติ...");
      await updateStats(message.guild);

      await status.edit("4/5 กำลังรีเฟรชปุ่มรับยศ...");
      await refreshVerifyPanel(message.guild);

      await status.edit("5/5 กำลังเติมข้อความให้ห้องว่าง...");
      const seeded = await seedAllRooms(message.guild);

      await status.edit(`เสร็จแล้ว ✅ เติมข้อความห้องใหม่ ${seeded} ห้อง`);
      await message.channel.send("ถ้าต้องการรวม role ซ้ำด้วย ให้ใช้ `!deduperoles`");
    } catch (error) {
      console.error("smartfix error:", error);
      await message.reply("เกิดข้อผิดพลาดระหว่างจัดระเบียบเซิร์ฟเวอร์");
    }
  }

  if (cmd === "deduperoles") {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply("คำสั่งนี้ใช้ได้เฉพาะแอดมิน");
      }

      const status = await message.reply("กำลังรวม role ซ้ำ...");
      await ensureRoles(message.guild);
      const deduped = await dedupeRoles(message.guild);
      await status.edit(`รวม role ซ้ำแล้ว ${deduped} อัน ✅`);
    } catch (error) {
      console.error("deduperoles error:", error);
      await message.reply("เกิดข้อผิดพลาดระหว่างรวม role ซ้ำ");
    }
  }

  if (cmd === "archiveold") {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply("คำสั่งนี้ใช้ได้เฉพาะแอดมิน");
      }

      const status = await message.reply("กำลังสแกนห้องที่ไม่อยู่ในโครงสร้างหลัก...");
      const managedIds = await syncFullLayout(message.guild);
      const moved = await archiveUnmanagedChannels(message.guild, managedIds);
      await status.edit(`ย้ายห้องไป archive แล้ว ${moved} ห้อง ✅`);
    } catch (error) {
      console.error("archiveold error:", error);
      await message.reply("เกิดข้อผิดพลาดระหว่างย้ายห้องเก่า");
    }
  }

  if (cmd === "seedrooms") {
    try {
      const seeded = await seedAllRooms(message.guild);
      await message.reply(`เติมข้อความห้องใหม่แล้ว ${seeded} ห้อง ✅`);
    } catch (error) {
      console.error("seedrooms error:", error);
      await message.reply("เติมข้อความห้องไม่สำเร็จ");
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

  if (cmd === "setupstats") {
    try {
      await updateStats(message.guild);
      await message.reply("อัปเดตห้องสถิติเรียบร้อยแล้ว");
    } catch (error) {
      console.error("setupstats error:", error);
      await message.reply("อัปเดตห้องสถิติไม่สำเร็จ");
    }
  }

  if (cmd === "audit") {
    try {
      const report = await auditServer(message.guild);
      await message.reply(
        `## Audit Report\n` +
        `Member role found: ${report.memberRoleFound ? "yes" : "no"}\n` +
        `Duplicate role groups: ${report.duplicateRoleGroups}\n` +
        `Duplicate channel groups: ${report.duplicateChannelGroups}\n` +
        `Missing managed roles: ${report.missingManagedRoles}\n` +
        `Member permission issues: ${report.memberProtectedBroken}`
      );
    } catch (error) {
      console.error("audit error:", error);
      await message.reply("วิเคราะห์เซิร์ฟเวอร์ไม่สำเร็จ");
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
          content: "ไม่พบ role Member เดิมของเซิร์ฟ",
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

client.on("guildMemberAdd", async (member) => {
  await updateStats(member.guild).catch(() => {});
});

client.on("guildMemberRemove", async (member) => {
  await updateStats(member.guild).catch(() => {});
});

client.on("presenceUpdate", async (oldPresence, newPresence) => {
  const guild = newPresence?.guild || oldPresence?.guild;
  if (!guild) return;
  await updateStats(guild).catch(() => {});
});

client.on("error", console.error);
process.on("unhandledRejection", console.error);

client.login(TOKEN);