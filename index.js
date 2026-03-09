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

// =========================
// CONFIG
// =========================
const CONFIG = {
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

  verifyRole: "✅ Verified",

  structure: [
    {
      category: "📌 START HERE",
      channels: [
        { type: "text", name: "📜│กฎ", everyoneView: true, everyoneSend: false },
        { type: "text", name: "📢│ประกาศ", everyoneView: true, everyoneSend: false },
        { type: "text", name: "👋│welcome-chat", everyoneView: true, everyoneSend: false },
        { type: "text", name: "🎭│รับยศ", everyoneView: true, everyoneSend: false },
        { type: "text", name: "🔗│ลิงก์เชิญเพื่อน", everyoneView: true, everyoneSend: false },
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
        { type: "text", name: "💬│พูดคุย", verifiedOnly: true },
        { type: "text", name: "📷│แชร์ผลงาน", verifiedOnly: true },
        { type: "text", name: "❓│ถามตอบ", verifiedOnly: true },
        { type: "text", name: "📊│result-ผลลัพธ์", verifiedOnly: true },
      ],
    },
    {
      category: "💰 BUSINESS ZONE",
      channels: [
        { type: "text", name: "💸│affiliate", verifiedOnly: true },
        { type: "text", name: "🧡│etsy", verifiedOnly: true },
        { type: "text", name: "💰│amazon", verifiedOnly: true },
        { type: "text", name: "📦│dropshipping", verifiedOnly: true },
        { type: "text", name: "👕│amazon-merch", verifiedOnly: true },
        { type: "text", name: "🧠│แชร์ไอเดีย", verifiedOnly: true },
      ],
    },
    {
      category: "🧠 TALK ZONE",
      channels: [
        { type: "voice", name: "💬 พูดคุย", verifiedOnly: true },
        { type: "voice", name: "💼 ธุรกิจ", verifiedOnly: true },
        { type: "voice", name: "💵 การเงิน", verifiedOnly: true },
        { type: "voice", name: "📚 อ่านหนังสือ", verifiedOnly: true },
        { type: "voice", name: "🛠 ทำงาน", verifiedOnly: true },
      ],
    },
    {
      category: "🎓 CLASS / VIP",
      channels: [
        { type: "text", name: "💎│premium-student", roleView: "💎 Premium Student" },
        { type: "text", name: "🟣│rank-b", roleView: "🟣 Rank B" },
        { type: "text", name: "🛒│etsy-student", roleView: "🛒 Etsy Student" },
        { type: "text", name: "📦│amazon-student", roleView: "📦 Amazon Student" },
        { type: "text", name: "🚀│vip-class", roleView: "🚀 VIP" },
      ],
    },
    {
      category: "🛠 SUPPORT",
      channels: [
        { type: "text", name: "🎫│เปิดตั๋ว", verifiedOnly: true },
        { type: "text", name: "🆘│แจ้งปัญหา", verifiedOnly: true },
      ],
    },
    {
      category: "🎵 MUSIC",
      channels: [
        { type: "text", name: "🎵│music", verifiedOnly: true },
        { type: "voice", name: "🎶 Music Room 1", verifiedOnly: true },
        { type: "voice", name: "🎶 Music Room 2", verifiedOnly: true },
      ],
    },
    {
      category: "👨‍💻 ADMIN",
      channels: [
        { type: "text", name: "📁│รายงานปัญหา", staffOnly: true },
        { type: "voice", name: "🎓 ทีมงาน", staffOnly: true },
        { type: "voice", name: "🛡 ผู้ดูแลระบบ", adminOnly: true },
      ],
    },
  ],

  ids: {
    verifyButton: "btn_verify_main",
    businessSelect: "select_business_roles",
  },
};

// =========================
// CLIENT
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ],
});

// =========================
// HELPERS
// =========================
function getRole(guild, name) {
  return guild.roles.cache.find((r) => r.name === name) || null;
}

function getChannel(guild, name, type = null) {
  return guild.channels.cache.find((c) => {
    if (type) return c.name === name && c.type === type;
    return c.name === name;
  }) || null;
}

async function ensureRole(guild, roleConfig) {
  let role = getRole(guild, roleConfig.name);
  if (!role) {
    role = await guild.roles.create({
      name: roleConfig.name,
      color: roleConfig.color,
      hoist: roleConfig.hoist,
      mentionable: false,
      reason: "สร้าง role อัตโนมัติจากระบบ setup",
    });
  }
  return role;
}

async function ensureCategory(guild, name) {
  let category = getChannel(guild, name, ChannelType.GuildCategory);
  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      reason: "สร้างหมวดอัตโนมัติจากระบบ setup",
    });
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
    everyone.deny.push(PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.Connect);
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

  if (rule.staffOnly && teamRole && modRole && adminRole) {
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

  if (rule.adminOnly && adminRole) {
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

async function ensureChannel(guild, category, botMember, channelConfig) {
  const type =
    channelConfig.type === "voice"
      ? ChannelType.GuildVoice
      : ChannelType.GuildText;

  let channel = getChannel(guild, channelConfig.name, type);

  const permissionOverwrites = buildPermissionOverwrites(guild, botMember, channelConfig);

  if (!channel) {
    channel = await guild.channels.create({
      name: channelConfig.name,
      type,
      parent: category.id,
      permissionOverwrites,
      reason: "สร้างห้องอัตโนมัติจากระบบ setup",
    });
  } else {
    if (channel.parentId !== category.id) {
      await channel.setParent(category.id);
    }
    await channel.permissionOverwrites.set(permissionOverwrites);
  }

  return channel;
}

async function ensureAllRoles(guild) {
  for (const roleConfig of CONFIG.roles) {
    await ensureRole(guild, roleConfig);
  }
}

async function ensureFullStructure(guild) {
  const botMember = await guild.members.fetchMe();

  for (const section of CONFIG.structure) {
    const category = await ensureCategory(guild, section.category);
    for (const channelConfig of section.channels) {
      await ensureChannel(guild, category, botMember, channelConfig);
    }
  }
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
      "2. เลือกยศสายธุรกิจที่คุณสนใจจากเมนูด้านล่าง\n" +
      "3. หลังรับยศแล้ว ห้องต่าง ๆ จะเปิดอัตโนมัติ",
    components: [row1, row2],
  };
}

async function sendOrRefreshVerifyPanel(guild) {
  const channel = getChannel(guild, "🎭│รับยศ", ChannelType.GuildText);
  if (!channel) return false;

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

    const statsCategory = getChannel(guild, "📊 SERVER STATUS", ChannelType.GuildCategory);
    if (!statsCategory) return;

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
      } else if (ch.name !== newName) {
        await ch.setName(newName);
      }

      if (ch.parentId !== statsCategory.id) {
        await ch.setParent(statsCategory.id);
      }
    }
  } catch (error) {
    console.error("Stats update error:", error);
  }
}

async function memberHasAnyRole(member, roleNames) {
  return roleNames.some((name) => {
    const role = getRole(member.guild, name);
    return role ? member.roles.cache.has(role.id) : false;
  });
}

// =========================
// COMMANDS
// =========================
client.once("clientReady", async () => {
  console.log(`บอทออนไลน์แล้ว ${client.user.tag}`);
  console.log("ใช้ !setupfull เพื่อสร้างห้อง ยศ สถิติ และระบบรับยศทั้งหมด");

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

      await message.reply("กำลังสร้างยศ ห้อง และระบบทั้งหมด...");

      await ensureAllRoles(message.guild);
      await ensureFullStructure(message.guild);
      await updateStatsForGuild(message.guild);
      await sendOrRefreshVerifyPanel(message.guild);

      await message.channel.send("ตั้งค่าทุกอย่างเรียบร้อยแล้ว ✅");
    } catch (error) {
      console.error("setupfull error:", error);
      await message.reply("เกิดข้อผิดพลาดระหว่างตั้งค่าระบบ");
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

  if (command === "sendroles") {
    try {
      const ok = await sendOrRefreshVerifyPanel(message.guild);
      if (!ok) return message.reply("ยังไม่พบห้อง 🎭│รับยศ");
      await message.reply("ส่งแผงรับยศแล้ว");
    } catch (error) {
      console.error(error);
      await message.reply("ส่งแผงรับยศไม่สำเร็จ");
    }
  }
});

// =========================
// INTERACTIONS
// =========================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.guild) return;

  if (interaction.isButton()) {
    if (interaction.customId === CONFIG.ids.verifyButton) {
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

        if (member.roles.cache.has(role.id)) {
          return interaction.reply({
            content: `คุณมียศ ${CONFIG.verifyRole} อยู่แล้ว`,
            flags: MessageFlags.Ephemeral,
          });
        }

        await member.roles.add(role);

        const memberRole = getRole(guild, "🌿 Member");
        if (memberRole && !member.roles.cache.has(memberRole.id)) {
          if (memberRole.position < botMember.roles.highest.position) {
            await member.roles.add(memberRole).catch(() => {});
          }
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
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === CONFIG.ids.businessSelect) {
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
  }
});

// =========================
// REALTIME STATS
// =========================
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

// =========================
// SAFETY
// =========================
client.on("error", console.error);
process.on("unhandledRejection", console.error);

client.login(TOKEN);
