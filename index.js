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
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// =========================
// CONFIG
// =========================
const TOKEN = process.env.TOKEN;
const PREFIX = "!";
const TARGET_ROLE_ID = "1347851123364593753";
const ROLE_CHANNEL_NAME = "🎭│รับยศ";
const PANEL_GIF = "https://i.postimg.cc/TPV1g79z/82bf7149e3ad23ab30c551ab4a84b742.gif";
const BUTTON_ID = "toggle_role_1347851123364593753";

// ถ้าอยากให้สร้างไว้ในหมวด ให้ใส่ category id ตรงนี้ ถ้าไม่มีก็ปล่อยว่าง
const CATEGORY_ID = "";

// =========================
// HELPER
// =========================
function buildRolePanelEmbed(guild) {
  return new EmbedBuilder()
    .setColor(0x0b0b10)
    .setAuthor({
      name: `${guild.name} • Role Access`,
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle("✦ ระบบรับยศอัตโนมัติ")
    .setDescription(
      [
        "กดปุ่มด้านล่างเพื่อ **รับยศ** หรือ **เอายศออก** ได้ทันที",
        "",
        `> **Role:** <@&${TARGET_ROLE_ID}>`,
        "> ระบบจะสลับยศให้อัตโนมัติ",
        "",
        "```fix",
        "CLICK THE BUTTON TO TOGGLE YOUR ROLE",
        "```",
      ].join("\n")
    )
    .setImage(PANEL_GIF)
    .setThumbnail(guild.iconURL({ dynamic: true }) || null)
    .setFooter({ text: "Professional Role Panel • Dark Edition" })
    .setTimestamp();
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
    (ch) => ch.type === ChannelType.GuildText && ch.name === ROLE_CHANNEL_NAME
  );
}

// =========================
// READY
// =========================
client.once(Events.ClientReady, (bot) => {
  console.log(`✅ Logged in as ${bot.user.tag}`);
});

// =========================
// COMMAND: !รับยศ
// =========================
client.on(Events.MessageCreate, async (message) => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;
    if (message.content !== `${PREFIX}รับยศ`) return;

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

    // ลบห้องเก่าถ้ามี
    const oldChannel = await findExistingRoleChannel(message.guild);
    if (oldChannel) {
      await oldChannel.delete("Refreshing role panel channel").catch((err) => {
        console.error("Delete old role channel error:", err);
      });
    }

    // permission ของห้อง
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
  } catch (error) {
    console.error("Create role channel error:", error);
    await message.reply("❌ เกิดข้อผิดพลาดขณะสร้างห้องรับยศ").catch(() => {});
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
        .setDescription(`ระบบได้เอายศ <@&${TARGET_ROLE_ID}> ออกจากคุณแล้ว`)
        .setFooter({ text: "Role Removed" })
        .setTimestamp();

      return interaction.reply({
        embeds: [removeEmbed],
        ephemeral: true,
      });
    }

    await member.roles.add(role, "Self-role add by panel button");

    const addEmbed = new EmbedBuilder()
      .setColor(0x00ff9d)
      .setTitle("✦ รับยศสำเร็จ")
      .setDescription(`ระบบได้มอบยศ <@&${TARGET_ROLE_ID}> ให้คุณแล้ว`)
      .setFooter({ text: "Role Added" })
      .setTimestamp();

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
// LOGIN
// =========================
if (!TOKEN) {
  console.error("❌ ไม่พบ TOKEN ในไฟล์ .env");
  process.exit(1);
}

client.login(TOKEN);
