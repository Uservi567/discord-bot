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

const PANEL_GIF =
  "https://i.postimg.cc/BvgsywmH/snaptik-7505147525616176389-hd.gif";

const BUTTON_ID = "toggle_role";

const CATEGORY_ID = ""; // ใส่ category id ถ้าต้องการ

// =========================
// EMBED DESIGN
// =========================

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
        "> ระบบจะจัดการให้โดยอัตโนมัติ",
      ].join("\n")
    )
    .setImage(PANEL_GIF)
    .setThumbnail(guild.iconURL({ dynamic: true }) || null);
}

// =========================
// BUTTON
// =========================

function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BUTTON_ID)
      .setLabel("รับยศ")
      .setEmoji("✦")
      .setStyle(ButtonStyle.Secondary)
  );
}

// =========================
// READY
// =========================

client.once(Events.ClientReady, (bot) => {
  console.log(`✅ Logged in as ${bot.user.tag}`);
});

// =========================
// COMMAND
// =========================

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (message.content !== `${PREFIX}รับยศ`) return;

  if (
    !message.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
    !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)
  ) {
    return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
  }

  const role = await message.guild.roles.fetch(TARGET_ROLE_ID).catch(() => null);

  if (!role) {
    return message.reply("❌ ไม่พบ Role");
  }

  const botMember = message.guild.members.me;

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return message.reply("❌ บอทไม่มีสิทธิ์ Manage Roles");
  }

  if (botMember.roles.highest.position <= role.position) {
    return message.reply("❌ บอทจัดการ role นี้ไม่ได้ เพราะ role บอทต่ำเกินไป");
  }

  // ลบห้องเก่า
  const oldChannel = message.guild.channels.cache.find(
    (c) => c.name === ROLE_CHANNEL_NAME
  );

  if (oldChannel) {
    await oldChannel.delete().catch(() => {});
  }

  // สร้างห้องใหม่
  const channel = await message.guild.channels.create({
    name: ROLE_CHANNEL_NAME,
    type: ChannelType.GuildText,
    parent: CATEGORY_ID || null,
  });

  await channel.send({
    embeds: [buildRolePanelEmbed(message.guild)],
    components: [buildButtons()],
  });

  message.reply(`✅ สร้างห้องรับยศใหม่แล้ว ${channel}`);
});

// =========================
// BUTTON INTERACTION
// =========================

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== BUTTON_ID) return;

  const member = await interaction.guild.members.fetch(interaction.user.id);

  const role = await interaction.guild.roles.fetch(TARGET_ROLE_ID);

  if (member.roles.cache.has(TARGET_ROLE_ID)) {
    await member.roles.remove(role);

    const embed = new EmbedBuilder()
      .setColor(0xff0033)
      .setTitle("✦ ถอดยศเรียบร้อย")
      .setDescription(`ยศ <@&${TARGET_ROLE_ID}> ถูกเอาออกแล้ว`);

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }

  await member.roles.add(role);

  const embed = new EmbedBuilder()
    .setColor(0x00ff9d)
    .setTitle("✦ รับยศสำเร็จ")
    .setDescription(`คุณได้รับยศ <@&${TARGET_ROLE_ID}> แล้ว`);

  interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
});

// =========================
// LOGIN
// =========================

client.login(TOKEN);
