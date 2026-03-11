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

const TOKEN = process.env.TOKEN;
const PREFIX = "!";
const TARGET_ROLE_ID = "1347851123364593753";
const ROLE_CHANNEL_NAME = "รับยศ";
const PANEL_GIF =
  "https://i.postimg.cc/BvgsywmH/snaptik-7505147525616176389-hd.gif";
const BUTTON_ID = "toggle_role_panel";

// ถ้ามีหมวดหมู่ค่อยใส่ ID ถ้าไม่มีให้ปล่อย ""
const CATEGORY_ID = "";

function buildRolePanelEmbed(guild) {
  return new EmbedBuilder()
    .setColor(0x0a0b10)
    .setAuthor({
      name: guild.name,
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle("✦ ระบบรับยศ")
    .setDescription(
      [
        "ยินดีต้อนรับสู่ระบบรับยศอัตโนมัติ",
        "",
        "กดปุ่มด้านล่างเพื่อรับยศหรือเอายศออกได้ทันที",
        "",
        `> **ยศ:** <@&${TARGET_ROLE_ID}>`,
      ].join("\n")
    )
    .setImage(PANEL_GIF)
    .setThumbnail(guild.iconURL({ dynamic: true }) || null);
}

function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_ID)
      .setLabel("รับยศ")
      .setEmoji("✦")
      .setStyle(ButtonStyle.Secondary)
  );
}

async function validateSetup(guild) {
  const botMember = guild.members.me;
  if (!botMember) {
    return { ok: false, message: "❌ ไม่พบบอทในเซิร์ฟเวอร์" };
  }

  const role = await guild.roles.fetch(TARGET_ROLE_ID).catch(() => null);
  if (!role) {
    return { ok: false, message: `❌ ไม่พบยศ ID: ${TARGET_ROLE_ID}` };
  }

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return { ok: false, message: "❌ บอทไม่มีสิทธิ์ Manage Roles" };
  }

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
    return { ok: false, message: "❌ บอทไม่มีสิทธิ์ Manage Channels" };
  }

  if (botMember.roles.highest.position <= role.position) {
    return {
      ok: false,
      message: "❌ ยศบอทต้องอยู่สูงกว่ายศที่จะแจก",
    };
  }

  return { ok: true, role, botMember };
}

client.once(Events.ClientReady, (bot) => {
  console.log(`✅ Logged in as ${bot.user.tag}`);
});

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

    const validation = await validateSetup(message.guild);
    if (!validation.ok) {
      return message.reply(validation.message);
    }

    const oldChannel = message.guild.channels.cache.find(
      (c) =>
        c.type === ChannelType.GuildText &&
        c.name === ROLE_CHANNEL_NAME
    );

    if (oldChannel) {
      await oldChannel.delete().catch((err) => {
        console.error("ลบห้องเก่าไม่ได้:", err);
      });
    }

    const channel = await message.guild.channels.create({
      name: ROLE_CHANNEL_NAME,
      type: ChannelType.GuildText,
      parent: CATEGORY_ID || null,
      reason: "สร้างห้องรับยศใหม่",
      permissionOverwrites: [
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
          id: validation.botMember.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ManageMessages,
          ],
        },
      ],
    });

    console.log(`✅ สร้างห้องแล้ว: ${channel.name}`);

    await channel.send({
      embeds: [buildRolePanelEmbed(message.guild)],
      components: [buildButtons()],
    });

    console.log("✅ ส่งแผงรับยศสำเร็จ");

    await message.reply(`✅ สร้างห้องรับยศใหม่แล้ว ${channel}`);
  } catch (error) {
    console.error("❌ Create panel error:", error);
    await message.reply("❌ เกิดข้อผิดพลาดตอนสร้างห้องหรือส่งแผงรับยศ").catch(() => {});
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (interaction.customId !== BUTTON_ID) return;
    if (!interaction.guild) return;

    const validation = await validateSetup(interaction.guild);
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
      await member.roles.remove(role, "Self role remove");
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0033)
            .setTitle("✦ ถอดยศเรียบร้อย")
            .setDescription(`ยศ <@&${TARGET_ROLE_ID}> ถูกเอาออกแล้ว`),
        ],
        ephemeral: true,
      });
    }

    await member.roles.add(role, "Self role add");
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00ff9d)
          .setTitle("✦ รับยศสำเร็จ")
          .setDescription(`คุณได้รับยศ <@&${TARGET_ROLE_ID}> แล้ว`),
      ],
      ephemeral: true,
    });
  } catch (error) {
    console.error("❌ Interaction error:", error);

    if (interaction.replied || interaction.deferred) {
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

if (!TOKEN) {
  console.error("❌ ไม่พบ TOKEN ในไฟล์ .env");
  process.exit(1);
}

client.login(TOKEN);
