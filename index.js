require("dotenv").config();

const fs = require("fs");
const path = require("path");

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
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// =========================
// CONFIG
// =========================
const TOKEN = process.env.TOKEN;
const PREFIX = "!";

// ยศ
const TARGET_ROLE_ID = "1347851123364593753";
const PURCHASE_ROLE_ID = TARGET_ROLE_ID; // ถ้ามียศลูกค้าแยก เปลี่ยนตรงนี้
const ROLE_PANEL_BUTTON_ID = "toggle_role_1347851123364593753";

// ถ้ามียศแอดมินสำหรับแจ้งเตือนตอนมีสลิปใหม่ ใส่ได้
const STAFF_ALERT_ROLE_ID = ""; // เช่น "1234567890"

// รูป
const ROLE_PANEL_GIF = "https://i.postimg.cc/BvgsywmH/snaptik-7505147525616176389-hd.gif";
const SHOP_BANNER = ""; // ถ้ามีรูปปกร้านค้า ใส่ลิงก์ได้ ถ้าไม่มีก็ปล่อยว่าง

// สี
const COLORS = {
  dark: 0x0b0b10,
  green: 0x00ff9d,
  red: 0xff0033,
  blue: 0x3399ff,
  yellow: 0xffcc00,
  shop: 0x111827,
  gray: 0x374151,
};

// หมวด
const STATUS_CATEGORY_NAME = "📊 SERVER STATUS";
const STORE_CATEGORY_NAME = "🛒 STORE CENTER";
const CUSTOMER_CATEGORY_NAME = "🎟 CUSTOMER AREA";
const ROLE_CATEGORY_NAME = "🎭 ROLE SYSTEM";
const LOG_CATEGORY_NAME = "📁 SERVER LOGS";

// ห้องในหมวดต่าง ๆ
const STATUS_TOTAL_NAME = "👥 สมาชิกทั้งหมด";
const STATUS_ONLINE_NAME = "🟢 ออนไลน์";
const STATUS_BOT_NAME = "🤖 บอท";

const SHOP_CHANNEL_NAME = "🏪│หน้าร้าน";
const PRODUCTS_CHANNEL_NAME = "📦│สินค้าทั้งหมด";
const PAYMENT_CHANNEL_NAME = "💳│แจ้งชำระเงิน";
const VERIFY_CHANNEL_NAME = "🔍│ตรวจสลิป";

const ROLE_CHANNEL_NAME = "🎭│รับยศ";

const LOG_JOIN_LEAVE_NAME = "📝│member-logs";
const LOG_MESSAGE_NAME = "💬│message-logs";
const LOG_MOD_NAME = "🛡│mod-logs";
const LOG_VOICE_NAME = "🔊│voice-logs";
const LOG_PAYMENT_NAME = "💸│payment-logs";

// ไฟล์สินค้า
const PRODUCTS_FILE = path.join(__dirname, "products.json");

// อัปเดตสถานะ
const STATUS_UPDATE_INTERVAL = 60 * 1000;

// เก็บสินค้าที่ลูกค้าเลือกก่อนส่งสลิป
const pendingOrders = new Map(); // userId -> { productId, createdAt }

// =========================
// FILE HELPERS
// =========================
function ensureProductsFile() {
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, "[]", "utf8");
  }
}

function loadProducts() {
  ensureProductsFile();

  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("loadProducts error:", error);
    return [];
  }
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf8");
}

function generateProductId(products) {
  if (!products.length) return "P001";

  const nums = products
    .map((p) => Number(String(p.id).replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));

  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `P${String(next).padStart(3, "0")}`;
}

// =========================
// COMMON HELPERS
// =========================
function isAdmin(member) {
  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.permissions.has(PermissionsBitField.Flags.ManageChannels)
  );
}

async function validateRoleSetup(guild, roleId = TARGET_ROLE_ID) {
  const role = await guild.roles.fetch(roleId).catch(() => null);

  if (!role) {
    return {
      ok: false,
      message: `❌ ไม่พบ role ID: ${roleId}`,
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
      message: "❌ ยศของบอทต้องอยู่สูงกว่ายศเป้าหมาย",
    };
  }

  return { ok: true, role };
}

function buildAdminOnlyOverwrites(guild) {
  return [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel],
    },
    {
      id: guild.members.me.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.AttachFiles,
      ],
    },
  ];
}

function buildReadOnlyPublicOverwrites(guild) {
  return [
    {
      id: guild.roles.everyone.id,
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
      id: guild.members.me.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.EmbedLinks,
        PermissionsBitField.Flags.ManageMessages,
      ],
    },
  ];
}

// =========================
// CATEGORY / CHANNEL HELPERS
// =========================
async function getOrCreateCategory(guild, name) {
  let category = guild.channels.cache.find(
    (ch) => ch.type === ChannelType.GuildCategory && ch.name === name
  );

  if (category) return category;

  category = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
  });

  return category;
}

async function getOrCreateTextChannel(guild, categoryName, channelName, topic = "", permissionOverwrites = null) {
  const category = await getOrCreateCategory(guild, categoryName);

  let channel = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildText &&
      ch.parentId === category.id &&
      ch.name === channelName
  );

  if (channel) return channel;

  channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic,
    permissionOverwrites: permissionOverwrites || undefined,
  });

  return channel;
}

async function getOrCreateVoiceChannel(guild, categoryName, channelBaseName) {
  const category = await getOrCreateCategory(guild, categoryName);

  let channel = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildVoice &&
      ch.parentId === category.id &&
      ch.name.startsWith(channelBaseName)
  );

  if (channel) return channel;

  channel = await guild.channels.create({
    name: `${channelBaseName}: 0`,
    type: ChannelType.GuildVoice,
    parent: category.id,
  });

  return channel;
}

async function getRolePanelChannel(guild) {
  return getOrCreateTextChannel(
    guild,
    ROLE_CATEGORY_NAME,
    ROLE_CHANNEL_NAME,
    "ห้องรับยศอัตโนมัติ",
    buildReadOnlyPublicOverwrites(guild)
  );
}

async function getShopHeaderChannel(guild) {
  return getOrCreateTextChannel(
    guild,
    STORE_CATEGORY_NAME,
    SHOP_CHANNEL_NAME,
    "ห้องแนะนำหน้าร้าน",
    buildReadOnlyPublicOverwrites(guild)
  );
}

async function getProductsChannel(guild) {
  return getOrCreateTextChannel(
    guild,
    STORE_CATEGORY_NAME,
    PRODUCTS_CHANNEL_NAME,
    "ห้องแสดงสินค้าทั้งหมด",
    buildReadOnlyPublicOverwrites(guild)
  );
}

async function getPaymentChannel(guild) {
  return getOrCreateTextChannel(
    guild,
    STORE_CATEGORY_NAME,
    PAYMENT_CHANNEL_NAME,
    "ห้องสำหรับลูกค้าส่งสลิปชำระเงิน"
  );
}

async function getVerifyChannel(guild) {
  return getOrCreateTextChannel(
    guild,
    STORE_CATEGORY_NAME,
    VERIFY_CHANNEL_NAME,
    "ห้องสำหรับทีมงานตรวจสลิป",
    buildAdminOnlyOverwrites(guild)
  );
}

async function getLogChannel(guild, channelName, topic = "") {
  return getOrCreateTextChannel(
    guild,
    LOG_CATEGORY_NAME,
    channelName,
    topic,
    buildAdminOnlyOverwrites(guild)
  );
}

async function sendLog(guild, channelName, embed) {
  const channel = await getLogChannel(guild, channelName);
  await channel.send({ embeds: [embed] }).catch(() => {});
}

// =========================
// STATUS SYSTEM
// =========================
async function ensureStatusChannels(guild) {
  await getOrCreateVoiceChannel(guild, STATUS_CATEGORY_NAME, STATUS_TOTAL_NAME);
  await getOrCreateVoiceChannel(guild, STATUS_CATEGORY_NAME, STATUS_ONLINE_NAME);
  await getOrCreateVoiceChannel(guild, STATUS_CATEGORY_NAME, STATUS_BOT_NAME);
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

    const totalChannel = await getOrCreateVoiceChannel(guild, STATUS_CATEGORY_NAME, STATUS_TOTAL_NAME);
    const onlineChannel = await getOrCreateVoiceChannel(guild, STATUS_CATEGORY_NAME, STATUS_ONLINE_NAME);
    const botChannel = await getOrCreateVoiceChannel(guild, STATUS_CATEGORY_NAME, STATUS_BOT_NAME);

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

// =========================
// ROLE PANEL
// =========================
function buildRolePanelEmbed(guild) {
  return new EmbedBuilder()
    .setColor(COLORS.dark)
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
    .setImage(ROLE_PANEL_GIF)
    .setThumbnail(guild.iconURL({ dynamic: true }) || null);
}

function buildRolePanelButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(ROLE_PANEL_BUTTON_ID)
      .setLabel("รับยศ / เอายศออก")
      .setEmoji("⚡")
      .setStyle(ButtonStyle.Danger)
  );
}

async function setupRolePanel(guild) {
  const validation = await validateRoleSetup(guild);
  if (!validation.ok) {
    console.error(validation.message);
    return;
  }

  const roleChannel = await getRolePanelChannel(guild);

  const messages = await roleChannel.messages.fetch({ limit: 30 }).catch(() => null);
  if (messages) {
    const botMessages = messages.filter((m) => m.author.id === client.user.id);
    for (const msg of botMessages.values()) {
      await msg.delete().catch(() => {});
    }
  }

  await roleChannel.send({
    embeds: [buildRolePanelEmbed(guild)],
    components: [buildRolePanelButtons()],
  }).catch((err) => console.error("setupRolePanel send error:", err));
}

// =========================
// SHOP SYSTEM
// =========================
function buildShopHeaderEmbed(guild, paymentChannel) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: `${guild.name} • Official Store`,
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle("✦ ร้านค้า")
    .setDescription(
      [
        "ยินดีต้อนรับสู่หน้าร้านอย่างเป็นทางการ",
        "",
        "เลือกสินค้าที่ต้องการในห้องสินค้าด้านล่าง",
        `เมื่อเลือกสินค้าแล้ว ให้ส่งสลิปในห้อง ${paymentChannel}`,
        "",
        "> ทีมงานจะตรวจและอนุมัติรายการให้หลังยืนยันการชำระเงิน",
      ].join("\n")
    );

  if (SHOP_BANNER) embed.setImage(SHOP_BANNER);
  return embed;
}

function buildProductEmbed(guild, product) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: `${guild.name} • Product Showcase`,
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle(`✦ ${product.name}`)
    .addFields(
      { name: "ราคา", value: product.price, inline: true },
      { name: "รหัสสินค้า", value: product.id, inline: true },
      {
        name: "รายละเอียด",
        value: product.description || "ไม่มีรายละเอียดสินค้า",
      }
    );

  if (product.image) embed.setImage(product.image);
  if (guild.iconURL()) embed.setThumbnail(guild.iconURL({ dynamic: true }));

  return embed;
}

function buildProductButtons(productId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`buy_${productId}`)
      .setLabel("สั่งซื้อสินค้า")
      .setEmoji("🛒")
      .setStyle(ButtonStyle.Success)
  );
}

async function clearBotMessages(channel, limit = 100) {
  const messages = await channel.messages.fetch({ limit }).catch(() => null);
  if (!messages) return;

  const botMessages = messages.filter((m) => m.author.id === client.user.id);
  for (const msg of botMessages.values()) {
    await msg.delete().catch(() => {});
  }
}

async function renderShopPanel(guild) {
  const headerChannel = await getShopHeaderChannel(guild);
  const productsChannel = await getProductsChannel(guild);
  const paymentChannel = await getPaymentChannel(guild);
  const products = loadProducts();

  await clearBotMessages(headerChannel, 50);
  await clearBotMessages(productsChannel, 100);

  await headerChannel.send({
    embeds: [buildShopHeaderEmbed(guild, paymentChannel)],
  }).catch(() => {});

  if (!products.length) {
    const emptyEmbed = new EmbedBuilder()
      .setColor(COLORS.gray)
      .setTitle("ยังไม่มีสินค้า")
      .setDescription("ขณะนี้ยังไม่มีสินค้าแสดงในร้านค้า");

    await productsChannel.send({ embeds: [emptyEmbed] }).catch(() => {});
    return;
  }

  for (const product of products) {
    await productsChannel.send({
      embeds: [buildProductEmbed(guild, product)],
      components: [buildProductButtons(product.id)],
    }).catch((err) => {
      console.error("renderShopPanel send error:", err);
    });
  }
}

async function createPrivateCustomerChannel(guild, member, product) {
  const category = await getOrCreateCategory(guild, CUSTOMER_CATEGORY_NAME);

  const safeName = member.user.username
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙-]/gi, "-")
    .replace(/-+/g, "-")
    .slice(0, 20);

  const channelName = `🧾│${safeName || member.id}`;

  let channel = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildText &&
      ch.parentId === category.id &&
      ch.name === channelName
  );

  if (channel) return channel;

  channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `ห้องลูกค้าส่วนตัวของ ${member.user.tag}`,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: member.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
        ],
      },
      {
        id: guild.members.me.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.ManageMessages,
          PermissionsBitField.Flags.EmbedLinks,
        ],
      },
    ],
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.green)
    .setTitle("ยืนยันคำสั่งซื้อแล้ว")
    .setDescription(
      [
        `${member}, ระบบเปิดห้องส่วนตัวให้คุณแล้ว`,
        "",
        product
          ? `> **สินค้า:** ${product.name}\n> **ราคา:** ${product.price}`
          : "> ระบบยืนยันการชำระเงินเรียบร้อยแล้ว",
      ].join("\n")
    );

  await channel.send({ embeds: [embed] }).catch(() => {});
  return channel;
}

// =========================
// SETUP SYSTEM
// =========================
async function setupLogs(guild) {
  await getLogChannel(guild, LOG_JOIN_LEAVE_NAME, "บันทึกสมาชิกเข้าออก");
  await getLogChannel(guild, LOG_MESSAGE_NAME, "บันทึกข้อความที่ลบหรือแก้ไข");
  await getLogChannel(guild, LOG_MOD_NAME, "บันทึกการจัดการต่าง ๆ");
  await getLogChannel(guild, LOG_VOICE_NAME, "บันทึกการเข้าออกห้องเสียง");
  await getLogChannel(guild, LOG_PAYMENT_NAME, "บันทึกการซื้อและการตรวจสลิป");
}

async function setupStore(guild) {
  await getShopHeaderChannel(guild);
  await getProductsChannel(guild);
  await getPaymentChannel(guild);
  await getVerifyChannel(guild);
  await renderShopPanel(guild);
}

async function setupAll(guild) {
  await getOrCreateCategory(guild, STATUS_CATEGORY_NAME);
  await getOrCreateCategory(guild, STORE_CATEGORY_NAME);
  await getOrCreateCategory(guild, CUSTOMER_CATEGORY_NAME);
  await getOrCreateCategory(guild, ROLE_CATEGORY_NAME);
  await getOrCreateCategory(guild, LOG_CATEGORY_NAME);

  await ensureStatusChannels(guild);
  await updateServerStatusChannels(guild);
  await setupLogs(guild);
  await setupStore(guild);
  await setupRolePanel(guild);
}

// =========================
// READY
// =========================
client.once(Events.ClientReady, async (bot) => {
  ensureProductsFile();
  console.log(`✅ Logged in as ${bot.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    await setupAll(guild);
  }

  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await updateServerStatusChannels(guild);
    }
  }, STATUS_UPDATE_INTERVAL);
});

// =========================
// MESSAGE COMMANDS
// =========================
client.on(Events.MessageCreate, async (message) => {
  try {
    if (!message.guild) return;
    if (message.author.bot) return;

    const admin = isAdmin(message.member);

    // =========================
    // PAYMENT SLIP LISTENER
    // =========================
    const paymentChannel = await getPaymentChannel(message.guild);

    if (message.channel.id === paymentChannel.id) {
      if (message.attachments.size === 0) {
        return message.reply("กรุณาแนบรูปสลิปด้วย");
      }

      const pending = pendingOrders.get(message.author.id);
      if (!pending) {
        return message.reply("กรุณาไปกดปุ่มซื้อสินค้าก่อน แล้วค่อยส่งสลิปที่นี่");
      }

      const products = loadProducts();
      const product = products.find((p) => p.id === pending.productId);

      if (!product) {
        pendingOrders.delete(message.author.id);
        return message.reply("ไม่พบสินค้าที่เลือกไว้ กรุณากดซื้อใหม่อีกครั้ง");
      }

      const attachment = message.attachments.first();
      const verifyChannel = await getVerifyChannel(message.guild);

      const verifyEmbed = new EmbedBuilder()
        .setColor(COLORS.yellow)
        .setTitle("มีสลิปใหม่รอการตรวจ")
        .setDescription(
          [
            `> **ลูกค้า:** ${message.author} (${message.author.tag})`,
            `> **สินค้า:** ${product.name}`,
            `> **ราคา:** ${product.price}`,
            `> **รหัสสินค้า:** ${product.id}`,
            "",
            "กดปุ่มด้านล่างเพื่ออนุมัติหรือปฏิเสธ",
          ].join("\n")
        )
        .setImage(attachment.url)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`approve_${message.author.id}_${product.id}`)
          .setLabel("อนุมัติ")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject_${message.author.id}_${product.id}`)
          .setLabel("ปฏิเสธ")
          .setStyle(ButtonStyle.Danger)
      );

      const mentionText = STAFF_ALERT_ROLE_ID
        ? `<@&${STAFF_ALERT_ROLE_ID}> มีสลิปใหม่`
        : "มีสลิปใหม่รอการตรวจ";

      await verifyChannel.send({
        content: mentionText,
        embeds: [verifyEmbed],
        components: [row],
      });

      const replyEmbed = new EmbedBuilder()
        .setColor(COLORS.blue)
        .setTitle("ส่งสลิปเรียบร้อย")
        .setDescription("ระบบส่งสลิปของคุณไปให้ทีมงานตรวจแล้ว กรุณารอการยืนยัน");

      await message.reply({ embeds: [replyEmbed] }).catch(() => {});

      const logEmbed = new EmbedBuilder()
        .setColor(COLORS.yellow)
        .setTitle("ลูกค้าส่งสลิป")
        .setDescription(
          [
            `> **ลูกค้า:** ${message.author.tag}`,
            `> **สินค้า:** ${product.name}`,
            `> **ราคา:** ${product.price}`,
          ].join("\n")
        )
        .setImage(attachment.url)
        .setTimestamp();

      await sendLog(message.guild, LOG_PAYMENT_NAME, logEmbed);
      return;
    }

    // =========================
    // !setupall
    // =========================
    if (message.content === `${PREFIX}setupall`) {
      if (!admin) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      await setupAll(message.guild);
      return message.reply("✅ สร้างหมวดและระบบทั้งหมดให้เรียบร้อยแล้ว");
    }

    // =========================
    // !setup
    // =========================
    if (message.content === `${PREFIX}setup`) {
      if (!admin) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      await setupAll(message.guild);
      return message.reply("✅ ตั้งค่าระบบทั้งหมดให้แล้ว");
    }

    // =========================
    // !รับยศ
    // =========================
    if (message.content === `${PREFIX}รับยศ`) {
      if (!admin) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      await setupRolePanel(message.guild);
      return message.reply("✅ สร้างห้องรับยศและแผงรับยศเรียบร้อยแล้ว");
    }

    // =========================
    // !refreshshop
    // =========================
    if (message.content === `${PREFIX}refreshshop`) {
      if (!admin) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      await renderShopPanel(message.guild);
      return message.reply("✅ รีเฟรชหน้าร้านแล้ว");
    }

    // =========================
    // !addproduct | ชื่อ | ราคา | รายละเอียด
    // แนบรูปมาด้วย
    // =========================
    if (message.content.startsWith(`${PREFIX}addproduct`)) {
      if (!admin) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      const payload = message.content
        .slice(`${PREFIX}addproduct`.length)
        .trim();

      const parts = payload.split("|").map((s) => s.trim()).filter(Boolean);

      if (parts.length < 3) {
        return message.reply(
          [
            "❌ ใช้คำสั่งแบบนี้",
            `\`${PREFIX}addproduct | ชื่อสินค้า | ราคา | รายละเอียด\``,
            "และต้องแนบรูปสินค้ามาด้วย",
          ].join("\n")
        );
      }

      const attachment = message.attachments.first();
      if (!attachment) {
        return message.reply("❌ กรุณาแนบรูปสินค้ามาด้วย");
      }

      const [name, price, description] = parts;
      const products = loadProducts();
      const id = generateProductId(products);

      products.push({
        id,
        name,
        price,
        description,
        image: attachment.url,
        createdBy: message.author.id,
        createdAt: Date.now(),
      });

      saveProducts(products);

      const embed = new EmbedBuilder()
        .setColor(COLORS.green)
        .setTitle("เพิ่มสินค้าแล้ว")
        .setDescription(
          [
            `> **รหัสสินค้า:** ${id}`,
            `> **ชื่อ:** ${name}`,
            `> **ราคา:** ${price}`,
          ].join("\n")
        )
        .setImage(attachment.url);

      await message.reply({ embeds: [embed] });
      return;
    }

    // =========================
    // !listproducts
    // =========================
    if (message.content === `${PREFIX}listproducts`) {
      if (!admin) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      const products = loadProducts();
      if (!products.length) {
        return message.reply("ยังไม่มีสินค้า");
      }

      const lines = products.map((p) => `**${p.id}** • ${p.name} • ${p.price}`);

      const embed = new EmbedBuilder()
        .setColor(COLORS.blue)
        .setTitle("รายการสินค้า")
        .setDescription(lines.join("\n").slice(0, 4000));

      return message.reply({ embeds: [embed] });
    }

    // =========================
    // !deleteproduct P001
    // =========================
    if (message.content.startsWith(`${PREFIX}deleteproduct`)) {
      if (!admin) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      const productId = message.content.split(" ")[1]?.trim();
      if (!productId) {
        return message.reply(`❌ ใช้แบบนี้: \`${PREFIX}deleteproduct P001\``);
      }

      const products = loadProducts();
      const product = products.find((p) => p.id === productId);

      if (!product) {
        return message.reply("❌ ไม่พบรหัสสินค้านี้");
      }

      const filtered = products.filter((p) => p.id !== productId);
      saveProducts(filtered);

      return message.reply(`✅ ลบสินค้า ${product.name} (${product.id}) แล้ว`);
    }
  } catch (error) {
    console.error("MessageCreate error:", error);
    await message.reply("❌ เกิดข้อผิดพลาดขณะทำงาน").catch(() => {});
  }
});

// =========================
// BUTTON INTERACTION
// =========================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (!interaction.guild) return;

    // =========================
    // ROLE TOGGLE
    // =========================
    if (interaction.customId === ROLE_PANEL_BUTTON_ID) {
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

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.red)
              .setTitle("✦ ถอดยศเรียบร้อย")
              .setDescription(`ระบบได้เอายศ <@&${TARGET_ROLE_ID}> ออกจากคุณแล้ว`)
          ],
          ephemeral: true,
        });
      }

      await member.roles.add(role, "Self-role add by panel button");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.green)
            .setTitle("✦ รับยศสำเร็จ")
            .setDescription(`ระบบได้มอบยศ <@&${TARGET_ROLE_ID}> ให้คุณแล้ว`)
        ],
        ephemeral: true,
      });
    }

    // =========================
    // BUY PRODUCT
    // =========================
    if (interaction.customId.startsWith("buy_")) {
      const productId = interaction.customId.replace("buy_", "");
      const products = loadProducts();
      const product = products.find((p) => p.id === productId);

      if (!product) {
        return interaction.reply({
          content: "❌ ไม่พบสินค้านี้แล้ว",
          ephemeral: true,
        });
      }

      pendingOrders.set(interaction.user.id, {
        productId,
        createdAt: Date.now(),
      });

      const paymentChannel = await getPaymentChannel(interaction.guild);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.blue)
            .setTitle("เลือกสินค้าแล้ว")
            .setDescription(
              [
                `> **สินค้า:** ${product.name}`,
                `> **ราคา:** ${product.price}`,
                "",
                `กรุณาส่งสลิปในห้อง ${paymentChannel}`,
                "ระบบจะส่งให้ทีมงานตรวจและอนุมัติให้",
              ].join("\n")
            )
        ],
        ephemeral: true,
      });
    }

    // =========================
    // APPROVE PAYMENT
    // =========================
    if (interaction.customId.startsWith("approve_")) {
      if (!isAdmin(interaction.member)) {
        return interaction.reply({
          content: "❌ คุณไม่มีสิทธิ์อนุมัติรายการนี้",
          ephemeral: true,
        });
      }

      const [, userId, productId] = interaction.customId.split("_");
      const member = await interaction.guild.members.fetch(userId).catch(() => null);

      if (!member) {
        return interaction.reply({
          content: "❌ ไม่พบสมาชิกคนนี้แล้ว",
          ephemeral: true,
        });
      }

      const roleValidation = await validateRoleSetup(interaction.guild, PURCHASE_ROLE_ID);
      if (!roleValidation.ok) {
        return interaction.reply({
          content: roleValidation.message,
          ephemeral: true,
        });
      }

      const products = loadProducts();
      const product = products.find((p) => p.id === productId) || null;

      await member.roles.add(roleValidation.role, "Approved payment by admin");
      pendingOrders.delete(userId);

      const privateChannel = await createPrivateCustomerChannel(interaction.guild, member, product);

      const approvedEmbed = new EmbedBuilder()
        .setColor(COLORS.green)
        .setTitle("อนุมัติสลิปแล้ว")
        .setDescription(
          [
            `> **ลูกค้า:** ${member.user.tag}`,
            product ? `> **สินค้า:** ${product.name}` : null,
            `> **ยศที่ให้:** <@&${PURCHASE_ROLE_ID}>`,
            privateChannel ? `> **ห้องลูกค้า:** ${privateChannel}` : null,
          ]
            .filter(Boolean)
            .join("\n")
        )
        .setTimestamp();

      await sendLog(interaction.guild, LOG_PAYMENT_NAME, approvedEmbed);

      try {
        await member.send(
          `✅ การชำระเงินของคุณได้รับการอนุมัติแล้ว${product ? `\nสินค้า: ${product.name}` : ""}`
        );
      } catch {}

      await interaction.update({
        content: `✅ อนุมัติ ${member.user.tag} แล้ว`,
        embeds: interaction.message.embeds,
        components: [],
      });

      return;
    }

    // =========================
    // REJECT PAYMENT
    // =========================
    if (interaction.customId.startsWith("reject_")) {
      if (!isAdmin(interaction.member)) {
        return interaction.reply({
          content: "❌ คุณไม่มีสิทธิ์ปฏิเสธรายการนี้",
          ephemeral: true,
        });
      }

      const [, userId, productId] = interaction.customId.split("_");
      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      const products = loadProducts();
      const product = products.find((p) => p.id === productId) || null;

      pendingOrders.delete(userId);

      const rejectEmbed = new EmbedBuilder()
        .setColor(COLORS.red)
        .setTitle("ปฏิเสธสลิป")
        .setDescription(
          [
            member ? `> **ลูกค้า:** ${member.user.tag}` : null,
            product ? `> **สินค้า:** ${product.name}` : null,
            "> กรุณาให้ลูกค้าส่งสลิปใหม่",
          ]
            .filter(Boolean)
            .join("\n")
        )
        .setTimestamp();

      await sendLog(interaction.guild, LOG_PAYMENT_NAME, rejectEmbed);

      try {
        if (member) {
          await member.send(
            `❌ การชำระเงินของคุณยังไม่ผ่านการตรวจสอบ${product ? `\nสินค้า: ${product.name}` : ""}\nกรุณาส่งสลิปใหม่อีกครั้ง`
          );
        }
      } catch {}

      await interaction.update({
        content: `❌ ปฏิเสธรายการแล้ว${member ? ` (${member.user.tag})` : ""}`,
        embeds: interaction.message.embeds,
        components: [],
      });

      return;
    }
  } catch (error) {
    console.error("Interaction error:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction
        .followUp({
          content: "❌ เกิดข้อผิดพลาดระหว่างจัดการคำสั่ง",
          ephemeral: true,
        })
        .catch(() => {});
    } else {
      await interaction
        .reply({
          content: "❌ เกิดข้อผิดพลาดระหว่างจัดการคำสั่ง",
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
    .setColor(COLORS.green)
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
    .setColor(COLORS.red)
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
    .setColor(COLORS.blue)
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
      color: COLORS.green,
    };
  } else if (oldState.channelId && !newState.channelId) {
    action = {
      title: "ออกห้องเสียง",
      desc: `${member.user.tag} ออกจากห้อง ${oldState.channel}`,
      color: COLORS.red,
    };
  } else if (
    oldState.channelId &&
    newState.channelId &&
    oldState.channelId !== newState.channelId
  ) {
    action = {
      title: "ย้ายห้องเสียง",
      desc: `${member.user.tag} ย้ายจาก ${oldState.channel} ไป ${newState.channel}`,
      color: COLORS.blue,
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
    .setColor(COLORS.red)
    .setTitle("แบนสมาชิก")
    .setDescription(`${ban.user.tag} ถูกแบน`)
    .setTimestamp();

  await sendLog(ban.guild, LOG_MOD_NAME, embed);
});

client.on(Events.GuildBanRemove, async (ban) => {
  const embed = new EmbedBuilder()
    .setColor(COLORS.green)
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

ensureProductsFile();
client.login(TOKEN);
