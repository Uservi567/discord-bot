require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField,
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.GuildMember],
});

// =========================
// CONFIG
// =========================
const TOKEN = process.env.TOKEN;

// ยศที่ต้องการให้รับ
const TARGET_ROLE_ID = "1347851123364593753";

// รูปที่ใช้
const PANEL_GIF = "https://i.postimg.cc/TPV1g79z/82bf7149e3ad23ab30c551ab4a84b742.gif";

// ปุ่ม
const BUTTON_GET_ROLE = "get_role_1347851123364593753";

// สีธีม
const COLORS = {
  primary: 0x0b0f1a,
  accent: 0x5865f2,
  success: 0x57f287,
  danger: 0xed4245,
};

// =========================
// READY
// =========================
client.once(Events.ClientReady, async (bot) => {
  console.log(`✅ Logged in as ${bot.user.tag}`);
  console.log(`✅ Role panel bot is ready.`);
});

// =========================
// MESSAGE COMMAND
// ใช้คำสั่ง !รับยศ เพื่อส่งแผงรับยศ
// =========================
client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.content !== "!รับยศ") return;

    // ให้เฉพาะแอดมิน/คนที่มี Manage Roles ใช้คำสั่งสร้างแผงได้
    const memberPerms = message.member.permissions;
    if (
      !memberPerms.has(PermissionsBitField.Flags.Administrator) &&
      !memberPerms.has(PermissionsBitField.Flags.ManageRoles)
    ) {
      return message.reply({
        content: "❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้",
      });
    }

    const targetRole = await message.guild.roles.fetch(TARGET_ROLE_ID).catch(() => null);
    if (!targetRole) {
      return message.reply({
        content: `❌ ไม่พบยศนี้: \`${TARGET_ROLE_ID}\``,
      });
    }

    const me = message.guild.members.me;
    if (!me) {
      return message.reply({
        content: "❌ บอทไม่สามารถตรวจสอบตัวเองในเซิร์ฟเวอร์นี้ได้",
      });
    }

    if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply({
        content: "❌ บอทไม่มีสิทธิ์ Manage Roles",
      });
    }

    if (me.roles.highest.position <= targetRole.position) {
      return message.reply({
        content:
          "❌ บอทไม่สามารถให้ยศนี้ได้ เพราะยศของบอทอยู่ต่ำกว่าหรือเท่ากับยศเป้าหมาย\nกรุณาลากยศของบอทให้อยู่สูงกว่ายศนี้ใน Role Settings",
      });
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.primary)
      .setAuthor({
        name: `${message.guild.name} • Role Access`,
        iconURL: message.guild.iconURL({ dynamic: true }) || undefined,
      })
      .setTitle("✦ รับยศอัตโนมัติ")
      .setDescription(
        [
          "กดปุ่มด้านล่างเพื่อรับหรือถอดยศได้ทันที",
          "",
          `> **ยศที่เชื่อมไว้:** <@&${TARGET_ROLE_ID}>`,
          "> ระบบทำงานอัตโนมัติ ปลอดภัย และรวดเร็ว",
          "",
          "```fix",
          "CLICK THE BUTTON TO TOGGLE YOUR ROLE",
          "```",
        ].join("\n")
      )
      .setImage(PANEL_GIF)
      .setFooter({
        text: "Professional Role Panel",
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_GET_ROLE)
        .setLabel("รับยศ / เอายศออก")
        .setEmoji("✨")
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row],
    });

    await message.reply({
      content: "✅ ส่งแผงรับยศเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Message command error:", error);
    if (message?.reply) {
      await message.reply({
        content: "❌ เกิดข้อผิดพลาดขณะสร้างแผงรับยศ",
      }).catch(() => {});
    }
  }
});

// =========================
// BUTTON INTERACTION
// =========================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (interaction.customId !== BUTTON_GET_ROLE) return;
    if (!interaction.guild) {
      return interaction.reply({
        content: "❌ คำสั่งนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์เท่านั้น",
        ephemeral: true,
      });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        content: "❌ ไม่พบข้อมูลสมาชิก",
        ephemeral: true,
      });
    }

    const role = await interaction.guild.roles.fetch(TARGET_ROLE_ID).catch(() => null);
    if (!role) {
      return interaction.reply({
        content: "❌ ไม่พบยศที่ตั้งค่าไว้",
        ephemeral: true,
      });
    }

    const me = interaction.guild.members.me;
    if (!me) {
      return interaction.reply({
        content: "❌ บอทไม่สามารถตรวจสอบตัวเองได้",
        ephemeral: true,
      });
    }

    if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({
        content: "❌ บอทไม่มีสิทธิ์ Manage Roles",
        ephemeral: true,
      });
    }

    if (me.roles.highest.position <= role.position) {
      return interaction.reply({
        content:
          "❌ บอทไม่สามารถจัดการยศนี้ได้ เพราะตำแหน่งยศของบอทต่ำกว่าหรือเท่ากับยศเป้าหมาย",
        ephemeral: true,
      });
    }

    const hasRole = member.roles.cache.has(TARGET_ROLE_ID);

    if (hasRole) {
      await member.roles.remove(role, "User removed self role from role panel");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.danger)
            .setTitle("ยกเลิกยศแล้ว")
            .setDescription(`เอายศ <@&${TARGET_ROLE_ID}> ออกจากคุณเรียบร้อยแล้ว`)
            .setFooter({ text: "Role Removed" })
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    } else {
      await member.roles.add(role, "User claimed self role from role panel");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle("รับยศสำเร็จ")
            .setDescription(`คุณได้รับยศ <@&${TARGET_ROLE_ID}> เรียบร้อยแล้ว`)
            .setFooter({ text: "Role Added" })
            .setTimestamp(),
        ],
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("Interaction error:", error);

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: "❌ เกิดข้อผิดพลาดระหว่างจัดการยศ",
        ephemeral: true,
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: "❌ เกิดข้อผิดพลาดระหว่างจัดการยศ",
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

client.login(TOKEN);
