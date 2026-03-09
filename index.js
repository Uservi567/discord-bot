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
  // ใช้ ROLE เดิมของคุณตาม ID
  verifyRoleId: "1347851123364593753",
  verifyButtonId: "main_verify_button",

  archiveCategoryName: "🗃️ ห้องเก่า",
  statsCategoryName: "📊 SERVER STATUS",

  // ยศอื่น ๆ ถ้ายังไม่มีค่อยสร้าง
  // แต่จะไม่สร้าง Member ใหม่
  roles: [
    { name: "👑 เจ้าของธุรกิจ", color: 0xe91e63, hoist: true },
    { name: "🛡 แอดมิน สรุปผล", color: 0xf44336, hoist: true },
    { name: "🎓 ทีมงาน", color: 0x2196f3, hoist: true },
    { name: "🤖 RoleBot", color: 0x95a5a6, hoist: true },

    { name: "💎 นักเรียนพิเศษ", color: 0xf1c40f, hoist: true },
    { name: "🟣 นักเรียน RANK B", color: 0x8e44ad, hoist: true },
    { name: "🧡 ESTY Student", color: 0xe67e22, hoist: true },
    { name: "📦 amazon.Student", color: 0x3498db, hoist: true },
    { name: "🚀 VIP", color: 0xff9800, hoist: true },

    { name: "🎵 Music", color: 0x607d8b, hoist: false },
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
        },
        {
          type: "text",
          name: "📢│ประกาศ",
          aliases: ["ประกาศ", "announcements"],
          everyoneView: true,
          everyoneSend: false,
        },
        {
          type: "text",
          name: "👋│welcome",
          aliases: ["welcome", "ยินดีต้อนรับ", "welcome-chat"],
          everyoneView: true,
          everyoneSend: false,
        },
        {
          type: "text",
          name: "🎭│รับยศ",
          aliases: ["รับยศ", "verify", "roles"],
          everyoneView: true,
          everyoneSend: false,
        },
        {
          type: "text",
          name: "🔗│เชิญเพื่อน",
          aliases: ["ลิงก์เชิญ", "invite", "ลิงก์เชิญเพื่อน"],
          everyoneView: true,
          everyoneSend: false,
        },
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
        {
          type: "text",
          name: "💬│พูดคุย",
          aliases: ["พูดคุย", "chat"],
          memberOnly: true,
        },
        {
          type: "text",
          name: "📷│แชร์ผลงาน",
          aliases: ["แชร์ผลงาน", "ผลงาน", "showcase", "ช่องส่งผลงาน"],
          memberOnly: true,
        },
        {
          type: "text",
          name: "❓│ถามตอบ",
          aliases: ["ถามตอบ", "qna"],
          memberOnly: true,
        },
        {
          type: "text",
          name: "📈│ผลลัพธ์",
          aliases: ["result", "ผลลัพธ์", "result-ผลลัพธ์"],
          memberOnly: true,
        },
      ],
    },
    {
      category: "💼 BUSINESS ZONE",
      channels: [
        {
          type: "text",
          name: "💸│affiliate",
          aliases: ["affiliate"],
          memberOnly: true,
        },
        {
          type: "text",
          name: "🧡│etsy",
          aliases: ["etsy"],
          memberOnly: true,
        },
        {
          type: "text",
          name: "💰│amazon",
          aliases: ["amazon"],
          memberOnly: true,
        },
        {
          type: "text",
          name: "📦│dropshipping",
          aliases: ["dropshipping", "dropship"],
          memberOnly: true,
        },
        {
          type: "text",
          name: "👕│amazon-merch",
          aliases: ["amazon merch", "merch", "amazon-merch"],
          memberOnly: true,
        },
        {
          type: "text",
          name: "🧠│แชร์ไอเดีย",
          aliases: ["แชร์ไอเดีย", "ideas"],
          memberOnly: true,
        },
      ],
    },
    {
      category: "🗣 TALK ZONE",
      channels: [
        {
          type: "voice",
          name: "💬 พูดคุย",
          aliases: ["พูดคุย voice"],
          memberOnly: true,
        },
        {
          type: "voice",
          name: "💼 ธุรกิจ",
          aliases: ["ธุรกิจ"],
          memberOnly: true,
        },
        {
          type: "voice",
          name: "💵 การเงิน",
          aliases: ["การเงิน"],
          memberOnly: true,
        },
        {
          type: "voice",
          name: "📚 อ่านหนังสือ",
          aliases: ["อ่านหนังสือ"],
          memberOnly: true,
        },
        {
          type: "voice",
          name: "🛠 ทำงาน",
          aliases: ["ทำงาน"],
          memberOnly: true,
        },
      ],
    },
    {
      category: "🎓 CLASS / VIP",
      channels: [
        {
          type: "text",
          name: "💎│นักเรียนพิเศษ",
          aliases: ["นักเรียนพิเศษ", "premium", "premium-student"],
          roleView: "💎 นักเรียนพิเศษ",
        },
        {
          type: "text",
          name: "🟣│rank-b",
          aliases: ["นักเรียน rank b", "rank b", "rank-b"],
          roleView: "🟣 นักเรียน RANK B",
        },
        {
          type: "text",
          name: "🧡│etsy-student",
          aliases: ["esty student", "etsy student"],
          roleView: "🧡 ESTY Student",
        },
        {
          type: "text",
          name: "📦│amazon-student",
          aliases: ["amazon student", "amazon.student"],
          roleView: "📦 amazon.Student",
        },
        {
          type: "text",
          name: "🚀│vip-class",
          aliases: ["vip", "vip class", "vip-class"],
          roleView: "🚀 VIP",
        },
      ],
    },
    {
      category: "🎵 MUSIC",
      channels: [
        {
          type: "text",
          name: "🎵│music",
          aliases: ["music"],
          memberOnly: true,
        },
        {
          type: "voice",
          name: "🎶 Music Room 1",
          aliases: ["music room", "music room 1"],
          memberOnly: true,
        },
      ],
    },
    {
      category: "🛠 SUPPORT",
      channels: [
        {
          type: "text",
          name: "🎫│เปิดตั๋ว",
          aliases: ["ticket", "เปิดตั๋ว"],
          memberOnly: true,
        },
        {
          type: "text",
          name: "🆘│แจ้งปัญหา",
          aliases: ["support", "แจ้งปัญหา"],
          memberOnly: true,
        },
      ],
    },
    {
      category: "👨‍💻 ADMIN",
      channels: [
        {
          type: "text",
          name: "📁│หลังบ้าน",
          aliases: ["รายงานปัญหา", "หลังบ้าน", "admin"],
          staffOnly: true,
        },
        {
          type: "voice",
          name: "🛡 Staff Room",
          aliases: ["ทีมงาน", "ผู้ดูแลระบบ", "admin voice"],
          staffOnly: true,
        },
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

function simplifiedName(name = "") {
  return normalizeName(name).replace(/\|/g, " ");
}

function getChannelType(kind) {
  return kind === "voice" ? ChannelType.GuildVoice : ChannelType.GuildText;
}

function getRole(guild, name) {
  return guild.roles.cache.find((r) => r.name === name) || null;
}

function getVerifyRole(guild) {
  return guild.roles.cache.get(CONFIG.verifyRoleId) || null;
}

function getExactChannel(guild, name, type = null) {
  return (
    guild.channels.cache.find((c) => {
      if (type !== null) return c.name === name && c.type === type;
      return c.name === name;
    }) || null
  );
}

async function ensureRole(guild, cfg) {
  let role = getRole(guild, cfg.name);
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

async function ensureAllRolesExceptMember(guild) {
  for (const roleCfg of CONFIG.roles) {
    await ensureRole(guild, roleCfg);
  }
}

async function ensureCategory(guild, name) {
  let category = getExactChannel(guild, name, ChannelType.GuildCategory);

  if (!category) {
    const target = simplifiedName(name);
    category =
      guild.channels.cache.find(
        (c) =>
          c.type === ChannelType.GuildCategory &&
          simplifiedName(c.name) === target
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

  const memberRole = getVerifyRole(guild);
  const staffRole = getRole(guild, "🎓 ทีมงาน");
  const adminRole = getRole(guild, "🛡 แอดมิน สรุปผล");
  const founderRole = getRole(guild, "👑 เจ้าของธุรกิจ");

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
    const role = getRole(guild, channelRule.roleView);
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

function findMatchingOldChannel(guild, channelCfg) {
  const targetType = getChannelType(channelCfg.type);

  const exact = getExactChannel(guild, channelCfg.name, targetType);
  if (exact) return exact;

  const acceptableNames = [simplifiedName(channelCfg.name)];
  for (const alias of channelCfg.aliases || []) {
    acceptableNames.push(simplifiedName(alias));
  }

  return (
    guild.channels.cache.find((c) => {
      if (c.type !== targetType) return false;
      const current = simplifiedName(c.name);
      return acceptableNames.includes(current);
    }) || null
  );
}

async function ensureChannel(guild, category, botMember, channelCfg, managedIds) {
  const type = getChannelType(channelCfg.type);
  let channel = findMatchingOldChannel(guild, channelCfg);
  const overwrites = buildPermissionOverwrites(guild, botMember, channelCfg);

  if (!channel) {
    channel = await guild.channels.create({
      name: channelCfg.name,
      type,
      parent: category.id,
      permissionOverwrites: overwrites,
      reason: "สร้างห้องใหม่จากระบบ beautify",
    });
  } else {
    if (channel.name !== channelCfg.name) {
      await channel.setName(channelCfg.name, "เปลี่ยนชื่อห้องเก่าให้เข้าธีมใหม่");
    }

    if (channel.parentId !== category.id) {
      await channel.setParent(category.id, { lockPermissions: false });
    }

    await channel.permissionOverwrites.set(overwrites);
  }

  managedIds.add(channel.id);
  return channel;
}

async function syncFullLayout(guild) {
  const botMember = await guild.members.fetchMe();
  const managedIds = new Set();

  for (const section of CONFIG.layout) {
    const category = await ensureCategory(guild, section.category);
    managedIds.add(category.id);

    for (const channelCfg of section.channels) {
      await ensureChannel(guild, category, botMember, channelCfg, managedIds);
    }
  }

  return managedIds;
}

function buildVerifyPanel(guild) {
  const role = getVerifyRole(guild);
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

function findStatChannel(guild, prefix) {
  return (
    guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildVoice && c.name.startsWith(prefix)
    ) || null
  );
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

async function archiveOldChannels(guild, managedIds) {
  const archiveCategory = await ensureCategory(guild, CONFIG.archiveCategoryName);

  let moved = 0;
  for (const channel of guild.channels.cache.values()) {
    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildVoice
    ) {
      continue;
    }

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

client.once("clientReady", async () => {
  console.log(`บอทออนไลน์แล้ว ${client.user.tag}`);
  console.log("ใช้ !beautify เพื่อจัดห้องโดยใช้ Member เดิม");
  console.log("ใช้ !archiveold เพื่อย้ายห้องเก่าไป archive");
  console.log("ใช้ !sendverify เพื่อรีเฟรชปุ่มรับยศ");

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
  if (!message.content.startsWith(PREFIX)) return;

  const cmd = message.content.slice(PREFIX.length).trim().toLowerCase();

  if (cmd === "testbot") {
    return message.reply("บอทอ่านคำสั่งได้แล้ว");
  }

  if (cmd === "beautify") {
    try {
      if (
        !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
        !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
      ) {
        return message.reply("คำสั่งนี้ใช้ได้เฉพาะแอดมิน");
      }

      const verifyRole = getVerifyRole(message.guild);
      if (!verifyRole) {
        return message.reply(
          `ไม่พบ role Member ตาม ID นี้: ${CONFIG.verifyRoleId}`
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

      await message.reply(
        `กำลังจัดระเบียบห้องโดยใช้ยศเดิม **${verifyRole.name}** และจะไม่สร้าง Member ใหม่...`
      );

      await ensureAllRolesExceptMember(message.guild);
      await syncFullLayout(message.guild);
      await updateStats(message.guild);
      await refreshVerifyPanel(message.guild);

      await message.channel.send(
        "จัดระเบียบเสร็จแล้ว ✅\nตอนนี้ห้องทั่วไปทั้งหมดจะอ้างอิง Member เดิมของคุณ"
      );
    } catch (error) {
      console.error("beautify error:", error);
      await message.reply("เกิดข้อผิดพลาดระหว่างจัดระเบียบเซิร์ฟเวอร์");
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

      await message.reply("กำลังย้ายห้องเก่าที่ไม่อยู่ในโครงสร้างหลักไป archive...");

      await ensureAllRolesExceptMember(message.guild);
      const managedIds = await syncFullLayout(message.guild);
      const moved = await archiveOldChannels(message.guild, managedIds);

      await message.channel.send(`ย้ายห้องเก่าไป archive แล้ว ${moved} ห้อง ✅`);
    } catch (error) {
      console.error("archiveold error:", error);
      await message.reply("เกิดข้อผิดพลาดระหว่างย้ายห้องเก่า");
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
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.guild) return;

  if (interaction.isButton() && interaction.customId === CONFIG.verifyButtonId) {
    try {
      const guild = interaction.guild;
      const member = await guild.members.fetch(interaction.user.id);
      const role = getVerifyRole(guild);
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
      return interaction
        .reply({
          content: "เกิดข้อผิดพลาด",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
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
