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
  StringSelectMenuBuilder,
  Events,
  ChannelType,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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

// ยศกดรับเอง
const TARGET_ROLE_ID = "1347851123364593753";

// ยศหลักจากการซื้อ
// ถ้าไม่ต้องการให้ยศหลักตอนซื้อ ให้ปล่อยเป็น ""
const PURCHASE_ROLE_ID = "";

// ปุ่มรับยศ
const ROLE_PANEL_BUTTON_ID = "toggle_role_1347851123364593753";

// ทีมงาน
const STAFF_ALERT_ROLE_ID = "";
const REVIEWER_ROLE_ID = "";

// รูป
const ROLE_PANEL_GIF = "https://i.postimg.cc/BvgsywmH/snaptik-7505147525616176389-hd.gif";
const SHOP_BANNER = "";

// สี
const COLORS = {
  dark: 0x0b0b10,
  green: 0x00ff9d,
  red: 0xff0033,
  blue: 0x3399ff,
  yellow: 0xffcc00,
  shop: 0x111827,
  gray: 0x374151,
  orange: 0xff9900,
};

// หมวด
const STATUS_CATEGORY_NAME = "📊 SERVER STATUS";
const STORE_CATEGORY_NAME = "🛒 STORE CENTER";
const CUSTOMER_CATEGORY_NAME = "🎟 CUSTOMER AREA";
const ROLE_CATEGORY_NAME = "🎭 ROLE SYSTEM";
const LOG_CATEGORY_NAME = "📁 SERVER LOGS";
const ADMIN_CATEGORY_NAME = "🛠 ADMIN PANEL";

// ห้อง
const STATUS_TOTAL_NAME = "👥 สมาชิกทั้งหมด";
const STATUS_ONLINE_NAME = "🟢 ออนไลน์";
const STATUS_BOT_NAME = "🤖 บอท";

const SHOP_CHANNEL_NAME = "🏪│หน้าร้าน";
const PRODUCTS_CHANNEL_NAME = "📦│เลือกสินค้า";
const VERIFY_CHANNEL_NAME = "🔍│ตรวจสลิป";

const ROLE_CHANNEL_NAME = "🎭│รับยศ";

const ADMIN_PANEL_CHANNEL_NAME = "🛠│product-control";

const LOG_JOIN_LEAVE_NAME = "📝│member-logs";
const LOG_MESSAGE_NAME = "💬│message-logs";
const LOG_MOD_NAME = "🛡│mod-logs";
const LOG_VOICE_NAME = "🔊│voice-logs";
const LOG_PAYMENT_NAME = "💸│payment-logs";

// ไฟล์
const PRODUCTS_FILE = path.join(__dirname, "products.json");
const ORDERS_FILE = path.join(__dirname, "orders.json");

// ตั้งค่าอื่น ๆ
const STATUS_UPDATE_INTERVAL = 60 * 1000;
const PRODUCTS_PER_PAGE = 10;
const TRANSCRIPT_MESSAGE_LIMIT = 300;

const TICKET_WARN_AFTER_MS = 30 * 60 * 1000;
const TICKET_CLOSE_AFTER_MS = 2 * 60 * 60 * 1000;

// =========================
// FILE HELPERS
// =========================
function ensureJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8");
  }
}

function readJsonArray(filePath) {
  ensureJsonFile(filePath);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`readJsonArray error (${filePath}):`, error);
    return [];
  }
}

function writeJsonArray(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function loadProducts() {
  return readJsonArray(PRODUCTS_FILE);
}

function saveProducts(products) {
  writeJsonArray(PRODUCTS_FILE, products);
}

function loadOrders() {
  return readJsonArray(ORDERS_FILE);
}

function saveOrders(orders) {
  writeJsonArray(ORDERS_FILE, orders);
}

function generateProductId(products) {
  if (!products.length) return "P001";
  const nums = products
    .map((p) => Number(String(p.id).replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `P${String(next).padStart(3, "0")}`;
}

function generateOrderId(orders) {
  if (!orders.length) return "O001";
  const nums = orders
    .map((o) => Number(String(o.id).replace(/\D/g, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `O${String(next).padStart(3, "0")}`;
}

// =========================
// TEXT / STATUS HELPERS
// =========================
function getOrderStatusText(status) {
  const map = {
    pending: "เริ่มคำสั่งซื้อ",
    waiting_slip: "รอสลิป",
    reviewing: "กำลังตรวจสลิป",
    approved: "อนุมัติแล้ว",
    rejected: "ปฏิเสธแล้ว",
    cancelled: "ยกเลิกแล้ว",
    closed: "ปิดงานแล้ว",
    timeout_closed: "ปิดอัตโนมัติ",
  };
  return map[status] || status;
}

function isActiveOrderStatus(status) {
  return ["pending", "waiting_slip", "reviewing", "approved"].includes(status);
}

function isAdmin(member) {
  return (
    member.permissions.has(PermissionsBitField.Flags.Administrator) ||
    member.permissions.has(PermissionsBitField.Flags.ManageChannels)
  );
}

function canReviewPayments(member) {
  if (isAdmin(member)) return true;
  if (REVIEWER_ROLE_ID && member.roles?.cache?.has(REVIEWER_ROLE_ID)) return true;
  return false;
}

function sanitizeChannelName(text, fallback = "ticket") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || fallback;
}

// =========================
// ROLE HELPERS
// =========================
async function validateRoleSetup(guild, roleId) {
  const role = await guild.roles.fetch(roleId).catch(() => null);
  if (!role) {
    return { ok: false, message: `❌ ไม่พบ role ID: ${roleId}` };
  }

  const botMember = guild.members.me;
  if (!botMember) {
    return { ok: false, message: "❌ ไม่พบบอทในเซิร์ฟเวอร์นี้" };
  }

  if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
    return { ok: false, message: "❌ บอทไม่มีสิทธิ์ Manage Roles" };
  }

  if (botMember.roles.highest.position <= role.position) {
    return { ok: false, message: "❌ ยศของบอทต้องอยู่สูงกว่ายศเป้าหมาย" };
  }

  return { ok: true, role };
}

async function safelyGiveRole(guild, member, roleId, reason = "Role delivery") {
  const guildRole = await guild.roles.fetch(roleId).catch(() => null);
  if (!guildRole) {
    return { ok: false, message: `ไม่พบ role ${roleId}` };
  }

  const botMember = guild.members.me;
  if (!botMember || botMember.roles.highest.position <= guildRole.position) {
    return { ok: false, message: `ให้ role ${guildRole.name} ไม่ได้ เพราะ role บอทต่ำกว่า` };
  }

  await member.roles.add(guildRole, reason).catch(() => null);
  return { ok: true, role: guildRole };
}

// =========================
// PERMISSION HELPERS
// =========================
function buildAdminOnlyOverwrites(guild) {
  const overwrites = [
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

  if (REVIEWER_ROLE_ID) {
    overwrites.push({
      id: REVIEWER_ROLE_ID,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
      ],
    });
  }

  return overwrites;
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

  return guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
  });
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

  return guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic,
    permissionOverwrites: permissionOverwrites || undefined,
  });
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

  return guild.channels.create({
    name: `${channelBaseName}: 0`,
    type: ChannelType.GuildVoice,
    parent: category.id,
  });
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
    "ห้องเลือกสินค้า",
    buildReadOnlyPublicOverwrites(guild)
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

async function getAdminPanelChannel(guild) {
  return getOrCreateTextChannel(
    guild,
    ADMIN_CATEGORY_NAME,
    ADMIN_PANEL_CHANNEL_NAME,
    "ห้องควบคุมสินค้าและระบบ",
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

async function getCustomerCategory(guild) {
  return getOrCreateCategory(guild, CUSTOMER_CATEGORY_NAME);
}

async function sendLog(guild, channelName, embed, files = []) {
  const channel = await getLogChannel(guild, channelName);
  await channel.send({ embeds: [embed], files }).catch(() => {});
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

    if (totalChannel.name !== totalName) await totalChannel.setName(totalName).catch(() => {});
    if (onlineChannel.name !== onlineName) await onlineChannel.setName(onlineName).catch(() => {});
    if (botChannel.name !== botName) await botChannel.setName(botName).catch(() => {});
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
  const validation = await validateRoleSetup(guild, TARGET_ROLE_ID);
  if (!validation.ok) throw new Error(validation.message);

  const roleChannel = await getRolePanelChannel(guild);
  const messages = await roleChannel.messages.fetch({ limit: 50 }).catch(() => null);

  if (messages) {
    const oldPanels = messages.filter(
      (m) =>
        m.author.id === client.user.id &&
        m.components?.length &&
        m.components[0].components.some((c) => c.customId === ROLE_PANEL_BUTTON_ID)
    );
    for (const msg of oldPanels.values()) {
      await msg.delete().catch(() => {});
    }
  }

  await roleChannel.send({
    embeds: [buildRolePanelEmbed(guild)],
    components: [buildRolePanelButtons()],
  });
}

// =========================
// SHOP UI
// =========================
function buildShopHeaderEmbed(guild) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: `${guild.name} • Official Store`,
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle("✦ ร้านค้า")
    .setDescription(
      [
        "เลือกรายการจากเมนูในห้องเลือกสินค้าได้ทันที",
        "",
        "เมื่อเลือกสินค้าแล้ว ระบบจะเปิดห้อง ticket ส่วนตัวให้คุณอัตโนมัติ",
        "> ใน ticket คุณจะเห็นรายละเอียดสินค้าและส่งสลิปได้แบบส่วนตัว",
      ].join("\n")
    );

  if (SHOP_BANNER) embed.setImage(SHOP_BANNER);
  return embed;
}

function buildProductSelectEmbed(guild, page, totalPages, items) {
  const lines = items.map(
    (p, i) =>
      `**${i + 1}. ${p.name}** — ${p.price}${p.stockCount !== undefined ? ` • คงเหลือ ${p.stockCount}` : ""}\nหมวด: ${p.category || "ทั่วไป"} • \`${p.id}\``
  );

  return new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: `${guild.name} • Product Selection`,
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle("✦ เลือกสินค้า")
    .setDescription(lines.join("\n\n") || "ยังไม่มีสินค้า")
    .setFooter({ text: `หน้า ${page + 1}/${totalPages}` });
}

function buildProductDetailsEmbed(guild, product) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: `${guild.name} • Product Details`,
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle(`✦ ${product.name}`)
    .addFields(
      { name: "ราคา", value: product.price, inline: true },
      { name: "รหัสสินค้า", value: product.id, inline: true },
      { name: "หมวด", value: product.category || "ทั่วไป", inline: true },
      { name: "รายละเอียด", value: product.description || "ไม่มีรายละเอียดสินค้า" },
      {
        name: "การจัดส่ง",
        value: product.deliveryText
          ? "มีข้อความ/ข้อมูลส่งให้อัตโนมัติหลังอนุมัติ"
          : "ไม่มีข้อความจัดส่งอัตโนมัติ",
      },
      {
        name: "สต็อก",
        value: Array.isArray(product.stocks) ? `เหลือ ${product.stocks.length} ชิ้น` : "ไม่มีระบบสต็อก",
        inline: true,
      },
      {
        name: "สถานะขาย",
        value: product.active === false ? "ปิดการขาย" : "เปิดขาย",
        inline: true,
      }
    );

  if (product.image) embed.setImage(product.image);
  if (guild.iconURL()) embed.setThumbnail(guild.iconURL({ dynamic: true }));

  return embed;
}

function buildAdminPanelEmbed(guild) {
  return new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: `${guild.name} • Product Control`,
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle("✦ PRODUCT CONTROL PANEL")
    .setDescription(
      [
        "ใช้ปุ่มด้านล่างเพื่อจัดการสินค้า",
        "",
        "➕ เพิ่มสินค้า = ใช้ฟอร์ม",
        "🧩 จัดการสินค้า = เลือกสินค้าแล้วแก้ไข",
        "🔄 รีเฟรชร้าน = อัปเดตหน้าร้าน",
      ].join("\n")
    );
}

function buildAdminPanelButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("admin_add_product")
        .setLabel("เพิ่มสินค้า")
        .setEmoji("➕")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("admin_manage_product")
        .setLabel("จัดการสินค้า")
        .setEmoji("🧩")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("admin_refresh_shop")
        .setLabel("รีเฟรชร้าน")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Secondary)
    ),
  ];
}

function buildProductManageButtons(productId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`manage_name_${productId}`).setLabel("แก้ชื่อ").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`manage_price_${productId}`).setLabel("แก้ราคา").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`manage_category_${productId}`).setLabel("แก้หมวด").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`manage_desc_${productId}`).setLabel("แก้รายละเอียด").setStyle(ButtonStyle.Primary)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`manage_delivery_${productId}`).setLabel("แก้ตัวสินค้า").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`manage_stock_${productId}`).setLabel("เพิ่มสต็อก").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`manage_toggle_${productId}`).setLabel("เปิด/ปิดขาย").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`manage_delete_${productId}`).setLabel("ลบสินค้า").setStyle(ButtonStyle.Danger)
    ),
  ];
}

function getVisibleProducts(products) {
  return products
    .filter((p) => p.active !== false)
    .map((p) => ({
      ...p,
      stockCount: Array.isArray(p.stocks) ? p.stocks.length : undefined,
    }));
}

function getProductPages(products) {
  const visible = getVisibleProducts(products);
  const pages = [];
  for (let i = 0; i < visible.length; i += PRODUCTS_PER_PAGE) {
    pages.push(visible.slice(i, i + PRODUCTS_PER_PAGE));
  }
  return pages.length ? pages : [[]];
}

async function clearBotMessages(channel, limit = 100) {
  const messages = await channel.messages.fetch({ limit }).catch(() => null);
  if (!messages) return;

  const botMessages = messages.filter((m) => m.author.id === client.user.id);
  for (const msg of botMessages.values()) {
    await msg.delete().catch(() => {});
  }
}

function buildStoreComponents(products, page = 0) {
  const pages = getProductPages(products);
  const current = pages[page] || [];

  const select = new StringSelectMenuBuilder()
    .setCustomId(`store_select_${page}`)
    .setPlaceholder(current.length ? "เลือกสินค้าที่ต้องการ" : "ยังไม่มีสินค้า")
    .setDisabled(current.length === 0)
    .addOptions(
      current.length
        ? current.map((p) => ({
            label: p.name.slice(0, 100),
            description: `${p.price}${p.stockCount !== undefined ? ` | คงเหลือ ${p.stockCount}` : ""}`.slice(0, 100),
            value: p.id,
          }))
        : [{ label: "ยังไม่มีสินค้า", value: "empty", description: "ไม่มีสินค้าในตอนนี้" }]
    );

  const row1 = new ActionRowBuilder().addComponents(select);

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`store_prev_${page}`)
      .setLabel("ก่อนหน้า")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`store_next_${page}`)
      .setLabel("ถัดไป")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= pages.length - 1),
    new ButtonBuilder()
      .setCustomId("store_refresh")
      .setLabel("รีเฟรช")
      .setStyle(ButtonStyle.Primary)
  );

  return [row1, row2];
}

function buildManageSelect(products) {
  const options = products.slice(0, 25).map((p) => ({
    label: `${p.id} • ${p.name}`.slice(0, 100),
    description: `${p.price} • ${p.active === false ? "ปิดขาย" : "เปิดขาย"}`.slice(0, 100),
    value: p.id,
  }));

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("admin_select_product")
      .setPlaceholder(products.length ? "เลือกสินค้าเพื่อจัดการ" : "ยังไม่มีสินค้า")
      .setDisabled(!products.length)
      .addOptions(
        products.length
          ? options
          : [{ label: "ยังไม่มีสินค้า", value: "empty", description: "ไม่มีสินค้าในตอนนี้" }]
      )
  );
}

async function renderShopPanel(guild) {
  const headerChannel = await getShopHeaderChannel(guild);
  const productsChannel = await getProductsChannel(guild);
  const products = loadProducts();

  await clearBotMessages(headerChannel, 20);
  await clearBotMessages(productsChannel, 50);

  await headerChannel.send({ embeds: [buildShopHeaderEmbed(guild)] });

  const pages = getProductPages(products);
  const firstPageItems = pages[0];
  const embed = buildProductSelectEmbed(guild, 0, pages.length, firstPageItems);

  await productsChannel.send({
    embeds: [embed],
    components: buildStoreComponents(products, 0),
  });
}

async function setupAdminPanel(guild) {
  const channel = await getAdminPanelChannel(guild);
  await clearBotMessages(channel, 30);
  await channel.send({
    embeds: [buildAdminPanelEmbed(guild)],
    components: buildAdminPanelButtons(),
  });
}

// =========================
// ORDER / DELIVERY HELPERS
// =========================
function findOpenOrderByUser(userId) {
  const orders = loadOrders();
  return orders.find((o) => o.userId === userId && isActiveOrderStatus(o.status));
}

function findOrderById(orderId) {
  const orders = loadOrders();
  return orders.find((o) => o.id === orderId) || null;
}

function updateOrder(orderId, updater) {
  const orders = loadOrders();
  const index = orders.findIndex((o) => o.id === orderId);
  if (index === -1) return null;

  const updated =
    typeof updater === "function" ? updater(orders[index]) : { ...orders[index], ...updater };

  orders[index] = updated;
  saveOrders(orders);
  return updated;
}

function createOrder(userId, productId) {
  const orders = loadOrders();
  const id = generateOrderId(orders);

  const order = {
    id,
    userId,
    productId,
    status: "pending",
    ticketChannelId: null,
    verifyMessageId: null,
    slipUrl: null,
    deliveredItems: [],
    warnedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  orders.push(order);
  saveOrders(orders);
  return order;
}

function buildOrderTicketEmbed(order, product, user) {
  return new EmbedBuilder()
    .setColor(COLORS.blue)
    .setTitle("✦ Ticket คำสั่งซื้อ")
    .setDescription(
      [
        `${user}`,
        "",
        `> **เลขออเดอร์:** ${order.id}`,
        `> **สินค้า:** ${product.name}`,
        `> **ราคา:** ${product.price}`,
        `> **สถานะ:** ${getOrderStatusText(order.status)}`,
        "",
        "กรุณาส่งสลิปในห้องนี้ได้เลย",
      ].join("\n")
    )
    .setImage(product.image || null);
}

function buildTicketButtons(orderId, hasSlip = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`ticket_info_${orderId}`).setLabel("ข้อมูลออเดอร์").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`ticket_close_${orderId}`).setLabel("ปิด Ticket").setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ticket_ready_${orderId}`)
      .setLabel(hasSlip ? "ส่งสลิปแล้ว" : "รอสลิป")
      .setStyle(hasSlip ? ButtonStyle.Success : ButtonStyle.Primary)
      .setDisabled(true)
  );
}

async function createPrivateOrderTicket(guild, member, product, order) {
  const existingChannel = order.ticketChannelId
    ? guild.channels.cache.get(order.ticketChannelId)
    : null;
  if (existingChannel) return existingChannel;

  const category = await getCustomerCategory(guild);
  const safeName = sanitizeChannelName(member.user.username, member.id);
  const channelName = `🎫│${safeName}-${order.id.toLowerCase()}`;

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: category.id,
    topic: `Ticket คำสั่งซื้อ ${order.id} ของ ${member.user.tag}`,
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
          PermissionsBitField.Flags.AttachFiles,
        ],
      },
      ...(REVIEWER_ROLE_ID
        ? [
            {
              id: REVIEWER_ROLE_ID,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ]
        : []),
    ],
  });

  updateOrder(order.id, {
    ...order,
    ticketChannelId: channel.id,
    status: "waiting_slip",
    updatedAt: Date.now(),
  });

  await channel.send({
    content: `${member}`,
    embeds: [buildOrderTicketEmbed({ ...order, status: "waiting_slip" }, product, member)],
    components: [buildTicketButtons(order.id, false)],
  });

  return channel;
}

function getDuplicateSlipWarning(currentOrderId, slipUrl) {
  const orders = loadOrders();
  return orders.find((o) => o.id !== currentOrderId && o.slipUrl && o.slipUrl === slipUrl) || null;
}

function deliverProductContent(product) {
  const outputs = [];

  if (Array.isArray(product.stocks) && product.stocks.length > 0) {
    const item = product.stocks.shift();

    const parts = String(item)
      .split("||")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const part of parts) {
      if (part.toLowerCase().startsWith("role:")) {
        outputs.push({
          type: "role",
          value: part.replace(/^role:/i, "").trim(),
          raw: part,
        });
      } else {
        outputs.push({
          type: "text",
          value: part,
          raw: part,
        });
      }
    }
  }

  if (product.deliveryText) {
    outputs.push({
      type: "text",
      value: product.deliveryText,
      raw: product.deliveryText,
    });
  }

  return outputs;
}

async function createTranscriptAttachment(channel) {
  const fetched = await channel.messages.fetch({ limit: TRANSCRIPT_MESSAGE_LIMIT }).catch(() => null);
  if (!fetched) return null;

  const rows = [...fetched.values()]
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((m) => {
      const time = new Date(m.createdTimestamp).toLocaleString("th-TH");
      const author = m.author?.tag || "Unknown";
      const content = (m.content || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const attachments = m.attachments.size
        ? `<div class="attach">${[...m.attachments.values()].map((a) => `<a href="${a.url}">${a.url}</a>`).join("<br>")}</div>`
        : "";
      return `
        <div class="msg">
          <div class="meta">${time} • ${author}</div>
          <div class="content">${content || "<i>(ไม่มีข้อความ)</i>"}</div>
          ${attachments}
        </div>
      `;
    })
    .join("\n");

  const html = `
<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>Transcript ${channel.name}</title>
<style>
body { font-family: Arial, sans-serif; background:#111827; color:#f3f4f6; padding:24px; }
h1 { font-size:22px; }
.msg { background:#1f2937; padding:12px; border-radius:12px; margin-bottom:12px; }
.meta { color:#9ca3af; font-size:12px; margin-bottom:8px; }
.content { white-space:pre-wrap; }
.attach a { color:#60a5fa; }
</style>
</head>
<body>
<h1>Transcript: ${channel.name}</h1>
${rows}
</body>
</html>`.trim();

  return new AttachmentBuilder(Buffer.from(html, "utf8"), {
    name: `transcript-${channel.id}.html`,
  });
}

async function checkTicketTimeouts() {
  const orders = loadOrders();

  for (const guild of client.guilds.cache.values()) {
    const guildOrders = orders.filter((o) => o.ticketChannelId && o.status === "waiting_slip");

    for (const order of guildOrders) {
      const channel = guild.channels.cache.get(order.ticketChannelId);
      if (!channel) continue;

      const age = Date.now() - order.updatedAt;

      if (age >= TICKET_CLOSE_AFTER_MS) {
        const transcript = await createTranscriptAttachment(channel).catch(() => null);

        updateOrder(order.id, (old) => ({
          ...old,
          status: "timeout_closed",
          updatedAt: Date.now(),
        }));

        await sendLog(
          guild,
          LOG_PAYMENT_NAME,
          new EmbedBuilder()
            .setColor(COLORS.red)
            .setTitle("ปิด Ticket อัตโนมัติ")
            .setDescription(
              [
                `> **เลขออเดอร์:** ${order.id}`,
                `> **เหตุผล:** ไม่ส่งสลิปภายในเวลาที่กำหนด`,
              ].join("\n")
            )
            .setTimestamp(),
          transcript ? [transcript] : []
        );

        await channel.send("⏰ ระบบปิด ticket นี้อัตโนมัติเนื่องจากหมดเวลา").catch(() => {});
        setTimeout(async () => {
          await channel.delete().catch(() => {});
        }, 3000);
        continue;
      }

      if (age >= TICKET_WARN_AFTER_MS && !order.warnedAt) {
        updateOrder(order.id, (old) => ({
          ...old,
          warnedAt: Date.now(),
        }));

        await channel.send("⚠ กรุณาส่งสลิปภายในเวลาที่กำหนด ไม่เช่นนั้น ticket นี้จะถูกปิดอัตโนมัติ").catch(() => {});
      }
    }
  }
}

// =========================
// SETUP
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
  await getVerifyChannel(guild);
  await renderShopPanel(guild);
}

async function setupAll(guild) {
  await getOrCreateCategory(guild, STATUS_CATEGORY_NAME);
  await getOrCreateCategory(guild, STORE_CATEGORY_NAME);
  await getOrCreateCategory(guild, CUSTOMER_CATEGORY_NAME);
  await getOrCreateCategory(guild, ROLE_CATEGORY_NAME);
  await getOrCreateCategory(guild, LOG_CATEGORY_NAME);
  await getOrCreateCategory(guild, ADMIN_CATEGORY_NAME);

  await ensureStatusChannels(guild);
  await updateServerStatusChannels(guild);
  await setupLogs(guild);
  await setupStore(guild);
  await setupRolePanel(guild);
  await setupAdminPanel(guild);
}

// =========================
// READY
// =========================
client.once(Events.ClientReady, async (bot) => {
  ensureJsonFile(PRODUCTS_FILE);
  ensureJsonFile(ORDERS_FILE);
  console.log(`✅ Logged in as ${bot.user.tag}`);

  // ไม่ auto setup
  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await updateServerStatusChannels(guild).catch(() => {});
    }
    await checkTicketTimeouts().catch(() => {});
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

    // ฟังสลิปใน ticket
    const orders = loadOrders();
    const orderByChannel = orders.find(
      (o) => o.ticketChannelId === message.channel.id && isActiveOrderStatus(o.status)
    );

    if (orderByChannel) {
      if (message.attachments.size === 0) return;

      const attachment = message.attachments.first();
      const verifyChannel = await getVerifyChannel(message.guild);
      const products = loadProducts();
      const product = products.find((p) => p.id === orderByChannel.productId);

      if (!product) {
        return message.reply("❌ ไม่พบสินค้าที่เชื่อมกับออเดอร์นี้แล้ว");
      }

      const duplicate = getDuplicateSlipWarning(orderByChannel.id, attachment.url);

      const updatedOrder = updateOrder(orderByChannel.id, (old) => ({
        ...old,
        status: "reviewing",
        updatedAt: Date.now(),
        slipUrl: attachment.url,
      }));

      const verifyEmbed = new EmbedBuilder()
        .setColor(COLORS.yellow)
        .setTitle("มีสลิปใหม่รอการตรวจ")
        .setDescription(
          [
            `> **เลขออเดอร์:** ${updatedOrder.id}`,
            `> **ลูกค้า:** ${message.author} (${message.author.tag})`,
            `> **สินค้า:** ${product.name}`,
            `> **ราคา:** ${product.price}`,
            `> **Ticket:** <#${message.channel.id}>`,
            duplicate ? `> **คำเตือน:** สลิปนี้เคยใช้กับออเดอร์ ${duplicate.id}` : null,
          ]
            .filter(Boolean)
            .join("\n")
        )
        .setImage(attachment.url)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`approve_${updatedOrder.id}`).setLabel("อนุมัติ").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`reject_${updatedOrder.id}`).setLabel("ปฏิเสธ").setStyle(ButtonStyle.Danger)
      );

      const mentionText = STAFF_ALERT_ROLE_ID
        ? `<@&${STAFF_ALERT_ROLE_ID}> มีสลิปใหม่`
        : "มีสลิปใหม่รอการตรวจ";

      const verifyMsg = await verifyChannel.send({
        content: mentionText,
        embeds: [verifyEmbed],
        components: [row],
      }).catch(() => null);

      if (verifyMsg) {
        updateOrder(updatedOrder.id, (old) => ({
          ...old,
          verifyMessageId: verifyMsg.id,
          updatedAt: Date.now(),
        }));
      }

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.blue)
            .setTitle("ส่งสลิปเรียบร้อย")
            .setDescription("ระบบส่งสลิปของคุณไปให้ทีมงานตรวจแล้ว กรุณารอการยืนยัน")
        ],
      }).catch(() => {});

      await sendLog(
        message.guild,
        LOG_PAYMENT_NAME,
        new EmbedBuilder()
          .setColor(COLORS.yellow)
          .setTitle("ลูกค้าส่งสลิป")
          .setDescription(
            [
              `> **เลขออเดอร์:** ${updatedOrder.id}`,
              `> **ลูกค้า:** ${message.author.tag}`,
              `> **สินค้า:** ${product.name}`,
              `> **ราคา:** ${product.price}`,
              duplicate ? `> **หมายเหตุ:** สลิปซ้ำกับ ${duplicate.id}` : null,
            ]
              .filter(Boolean)
              .join("\n")
          )
          .setImage(attachment.url)
          .setTimestamp()
      );

      return;
    }

    if (message.content === `${PREFIX}setupall` || message.content === `${PREFIX}setup`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      await setupAll(message.guild);
      return message.reply("✅ สร้างระบบทั้งหมดเรียบร้อยแล้ว");
    }

    if (message.content === `${PREFIX}refreshshop`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      await renderShopPanel(message.guild);
      await setupAdminPanel(message.guild);
      return message.reply("✅ รีเฟรชหน้าร้านและแผงแอดมินแล้ว");
    }

    if (message.content === `${PREFIX}รับยศ`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      await setupRolePanel(message.guild);
      return message.reply("✅ สร้างแผงรับยศแล้ว");
    }

    if (message.content.startsWith(`${PREFIX}setimage`)) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const productId = message.content.split(" ")[1]?.trim();
      if (!productId) return message.reply(`❌ ใช้แบบนี้: \`${PREFIX}setimage P001\` แล้วแนบรูป`);

      const attachment = message.attachments.first();
      if (!attachment) return message.reply("❌ กรุณาแนบรูป");

      const products = loadProducts();
      const index = products.findIndex((p) => p.id === productId);
      if (index === -1) return message.reply("❌ ไม่พบสินค้า");

      products[index].image = attachment.url;
      saveProducts(products);

      return message.reply(`✅ เปลี่ยนรูปสินค้า ${products[index].name} แล้ว`);
    }

    if (message.content === `${PREFIX}listproducts`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const products = loadProducts();
      if (!products.length) return message.reply("ยังไม่มีสินค้า");

      const lines = products.map(
        (p) =>
          `**${p.id}** • ${p.name} • ${p.price} • ${p.category || "ทั่วไป"} • ${p.active === false ? "ปิดขาย" : "เปิดขาย"} • stock:${Array.isArray(p.stocks) ? p.stocks.length : 0}`
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.blue)
            .setTitle("รายการสินค้า")
            .setDescription(lines.join("\n").slice(0, 4000)),
        ],
      });
    }

    if (message.content.startsWith(`${PREFIX}viewproduct`)) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const productId = message.content.split(" ")[1]?.trim();
      if (!productId) return message.reply(`❌ ใช้แบบนี้: \`${PREFIX}viewproduct P001\``);

      const products = loadProducts();
      const product = products.find((p) => p.id === productId);
      if (!product) return message.reply("❌ ไม่พบสินค้า");

      return message.reply({ embeds: [buildProductDetailsEmbed(message.guild, product)] });
    }

    if (message.content === `${PREFIX}listorders`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const ordersList = loadOrders().slice(-20).reverse();
      if (!ordersList.length) return message.reply("ยังไม่มีออเดอร์");

      const lines = ordersList.map(
        (o) => `**${o.id}** • user:${o.userId} • product:${o.productId} • status:${getOrderStatusText(o.status)}`
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.blue)
            .setTitle("รายการออเดอร์ล่าสุด")
            .setDescription(lines.join("\n").slice(0, 4000)),
        ],
      });
    }
  } catch (error) {
    console.error("MessageCreate error:", error);
    await message.reply("❌ เกิดข้อผิดพลาดขณะทำงาน").catch(() => {});
  }
});

// =========================
// INTERACTION HANDLERS
// =========================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.guild) return;

    if (interaction.isButton()) {
      // ปุ่มรับยศ
      if (interaction.customId === ROLE_PANEL_BUTTON_ID) {
        const validation = await validateRoleSetup(interaction.guild, TARGET_ROLE_ID);
        if (!validation.ok) {
          return interaction.reply({ content: validation.message, ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) {
          return interaction.reply({ content: "❌ ไม่พบข้อมูลสมาชิก", ephemeral: true });
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

      // ร้านค้าเปลี่ยนหน้า
      if (interaction.customId.startsWith("store_prev_") || interaction.customId.startsWith("store_next_")) {
        const products = loadProducts();
        const pages = getProductPages(products);
        const currentPage = Number(interaction.customId.split("_").pop()) || 0;
        const nextPage = interaction.customId.startsWith("store_prev_")
          ? Math.max(0, currentPage - 1)
          : Math.min(pages.length - 1, currentPage + 1);

        return interaction.update({
          embeds: [buildProductSelectEmbed(interaction.guild, nextPage, pages.length, pages[nextPage])],
          components: buildStoreComponents(products, nextPage),
        });
      }

      if (interaction.customId === "store_refresh") {
        const products = loadProducts();
        const pages = getProductPages(products);
        return interaction.update({
          embeds: [buildProductSelectEmbed(interaction.guild, 0, pages.length, pages[0])],
          components: buildStoreComponents(products, 0),
        });
      }

      // แผงแอดมิน
      if (interaction.customId === "admin_add_product") {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์", ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId("modal_add_product")
          .setTitle("เพิ่มสินค้า");

        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("name").setLabel("ชื่อสินค้า").setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("price").setLabel("ราคา").setStyle(TextInputStyle.Short).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("category").setLabel("หมวดสินค้า").setStyle(TextInputStyle.Short).setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("description").setLabel("รายละเอียดสินค้า").setStyle(TextInputStyle.Paragraph).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("delivery").setLabel("ตัวสินค้า / ข้อความหลังซื้อ").setStyle(TextInputStyle.Paragraph).setRequired(false)
          )
        );

        return interaction.showModal(modal);
      }

      if (interaction.customId === "admin_manage_product") {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์", ephemeral: true });
        }

        const products = loadProducts();
        if (!products.length) {
          return interaction.reply({ content: "ยังไม่มีสินค้า", ephemeral: true });
        }

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.shop)
              .setTitle("เลือกสินค้าเพื่อจัดการ")
              .setDescription("เลือกจากเมนูด้านล่าง"),
          ],
          components: [buildManageSelect(products)],
          ephemeral: true,
        });
      }

      if (interaction.customId === "admin_refresh_shop") {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์", ephemeral: true });
        }

        await renderShopPanel(interaction.guild);
        await setupAdminPanel(interaction.guild);

        return interaction.reply({
          content: "✅ รีเฟรชหน้าร้านและแผงแอดมินแล้ว",
          ephemeral: true,
        });
      }

      // ปุ่มจัดการสินค้า
      if (interaction.customId.startsWith("manage_")) {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์", ephemeral: true });
        }

        const [, action, productId] = interaction.customId.split("_");
        const products = loadProducts();
        const product = products.find((p) => p.id === productId);

        if (!product) {
          return interaction.reply({ content: "❌ ไม่พบสินค้า", ephemeral: true });
        }

        if (action === "toggle") {
          product.active = !(product.active !== false);
          saveProducts(products);

          return interaction.reply({
            content: `✅ ${product.name} ตอนนี้เป็นสถานะ: ${product.active === false ? "ปิดการขาย" : "เปิดขาย"}`,
            ephemeral: true,
          });
        }

        if (action === "delete") {
          saveProducts(products.filter((p) => p.id !== productId));
          return interaction.reply({
            content: `✅ ลบสินค้า ${product.name} แล้ว`,
            ephemeral: true,
          });
        }

        const modal = new ModalBuilder();
        let title = "";
        let label = "";
        let style = TextInputStyle.Short;
        let value = "";

        if (action === "name") {
          title = `แก้ชื่อสินค้า ${productId}`;
          label = "ชื่อสินค้าใหม่";
          value = product.name || "";
        } else if (action === "price") {
          title = `แก้ราคา ${productId}`;
          label = "ราคาใหม่";
          value = product.price || "";
        } else if (action === "category") {
          title = `แก้หมวดสินค้า ${productId}`;
          label = "หมวดใหม่";
          value = product.category || "";
        } else if (action === "desc") {
          title = `แก้รายละเอียด ${productId}`;
          label = "รายละเอียดใหม่";
          style = TextInputStyle.Paragraph;
          value = product.description || "";
        } else if (action === "delivery") {
          title = `แก้ตัวสินค้า ${productId}`;
          label = "ตัวสินค้า / ข้อความหลังซื้อ";
          style = TextInputStyle.Paragraph;
          value = product.deliveryText || "";
        } else if (action === "stock") {
          title = `เพิ่มสต็อก ${productId}`;
          label = "คั่นแต่ละชิ้นด้วย || เช่น role:123 || key:abc";
          style = TextInputStyle.Paragraph;
          value = "";
        }

        modal
          .setCustomId(`modal_manage_${action}_${productId}`)
          .setTitle(title)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("value")
                .setLabel(label)
                .setStyle(style)
                .setRequired(true)
                .setValue(value.slice(0, 4000))
            )
          );

        return interaction.showModal(modal);
      }

      // ปุ่มข้อมูลออเดอร์
      if (interaction.customId.startsWith("ticket_info_")) {
        const orderId = interaction.customId.replace("ticket_info_", "");
        const order = findOrderById(orderId);
        if (!order) {
          return interaction.reply({ content: "❌ ไม่พบออเดอร์นี้", ephemeral: true });
        }

        const products = loadProducts();
        const product = products.find((p) => p.id === order.productId);

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.blue)
              .setTitle("ข้อมูลออเดอร์")
              .setDescription(
                [
                  `> **เลขออเดอร์:** ${order.id}`,
                  `> **สถานะ:** ${getOrderStatusText(order.status)}`,
                  `> **สินค้า:** ${product?.name || order.productId}`,
                  `> **ราคา:** ${product?.price || "-"}`,
                ].join("\n")
              )
          ],
          ephemeral: true,
        });
      }

      // ปุ่มปิด ticket
      if (interaction.customId.startsWith("ticket_close_")) {
        const orderId = interaction.customId.replace("ticket_close_", "");
        const order = findOrderById(orderId);

        if (!order) {
          return interaction.reply({ content: "❌ ไม่พบออเดอร์นี้", ephemeral: true });
        }

        const isOwner = order.userId === interaction.user.id;
        const admin = isAdmin(interaction.member);

        if (!isOwner && !admin) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์ปิด ticket นี้", ephemeral: true });
        }

        const transcript = await createTranscriptAttachment(interaction.channel).catch(() => null);

        const updated = updateOrder(orderId, (old) => ({
          ...old,
          status: old.status === "approved" ? "closed" : "cancelled",
          updatedAt: Date.now(),
        }));

        await sendLog(
          interaction.guild,
          LOG_PAYMENT_NAME,
          new EmbedBuilder()
            .setColor(COLORS.gray)
            .setTitle("ปิด Ticket")
            .setDescription(
              [
                `> **เลขออเดอร์:** ${updated.id}`,
                `> **สถานะสุดท้าย:** ${getOrderStatusText(updated.status)}`,
                `> **ปิดโดย:** ${interaction.user.tag}`,
              ].join("\n")
            )
            .setTimestamp(),
          transcript ? [transcript] : []
        );

        await interaction.reply({
          content: "✅ ระบบจะปิด ticket นี้ในอีก 3 วินาที",
          ephemeral: true,
        });

        setTimeout(async () => {
          await interaction.channel.delete().catch(() => {});
        }, 3000);

        return;
      }

      // ปุ่มอนุมัติสลิป
      if (interaction.customId.startsWith("approve_")) {
        if (!canReviewPayments(interaction.member)) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์อนุมัติรายการนี้", ephemeral: true });
        }

        const orderId = interaction.customId.replace("approve_", "");
        const order = findOrderById(orderId);
        if (!order) {
          return interaction.reply({ content: "❌ ไม่พบออเดอร์นี้แล้ว", ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(order.userId).catch(() => null);
        if (!member) {
          return interaction.reply({ content: "❌ ไม่พบสมาชิกคนนี้แล้ว", ephemeral: true });
        }

        const products = loadProducts();
        const productIndex = products.findIndex((p) => p.id === order.productId);
        const product = productIndex !== -1 ? products[productIndex] : null;

        let baseRole = null;
        if (PURCHASE_ROLE_ID) {
          const baseRoleResult = await safelyGiveRole(
            interaction.guild,
            member,
            PURCHASE_ROLE_ID,
            `Approved payment by admin for ${orderId}`
          );

          if (!baseRoleResult.ok) {
            return interaction.reply({
              content: `❌ ให้ยศหลักไม่สำเร็จ: ${baseRoleResult.message}`,
              ephemeral: true,
            });
          }

          baseRole = baseRoleResult.role;
        }

        let deliveries = [];
        if (product) {
          deliveries = deliverProductContent(product);
          saveProducts(products);
        }

        const grantedRoles = [];
        const failedRoles = [];
        const textDeliveries = [];

        for (const item of deliveries) {
          if (item.type === "role") {
            const roleResult = await safelyGiveRole(
              interaction.guild,
              member,
              item.value,
              `Stock role delivery for order ${orderId}`
            );

            if (roleResult.ok) {
              grantedRoles.push(roleResult.role);
            } else {
              failedRoles.push(roleResult.message);
            }
          } else {
            textDeliveries.push(item.value);
          }
        }

        const updated = updateOrder(orderId, (old) => ({
          ...old,
          status: "approved",
          updatedAt: Date.now(),
          deliveredItems: deliveries,
          grantedRoleIds: grantedRoles.map((r) => r.id),
        }));

        const ticketChannel = updated.ticketChannelId
          ? interaction.guild.channels.cache.get(updated.ticketChannelId)
          : null;

        if (ticketChannel) {
          await ticketChannel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.green)
                .setTitle("ชำระเงินสำเร็จ")
                .setDescription(
                  [
                    `${member}`,
                    "",
                    product ? `> **สินค้า:** ${product.name}` : null,
                    baseRole ? `> **ยศหลักที่ได้รับ:** <@&${baseRole.id}>` : null,
                    grantedRoles.length
                      ? `> **ยศจาก stock:** ${grantedRoles.map((r) => `<@&${r.id}>`).join(", ")}`
                      : null,
                    "",
                    "ทีมงานอนุมัติรายการของคุณเรียบร้อยแล้ว",
                  ]
                    .filter(Boolean)
                    .join("\n")
                ),
            ],
            components: [buildTicketButtons(orderId, true)],
          }).catch(() => {});

          if (textDeliveries.length) {
            await ticketChannel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(COLORS.blue)
                  .setTitle("✦ ตัวสินค้า / รายละเอียดหลังซื้อ")
                  .setDescription(textDeliveries.join("\n").slice(0, 4000)),
              ],
            }).catch(() => {});
          }

          if (failedRoles.length) {
            await ticketChannel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(COLORS.orange)
                  .setTitle("⚠ มีบาง role ที่แจกไม่สำเร็จ")
                  .setDescription(failedRoles.join("\n").slice(0, 4000)),
              ],
            }).catch(() => {});
          }

          if (!baseRole && !textDeliveries.length && !grantedRoles.length) {
            await ticketChannel.send("ℹ️ สินค้านี้ยังไม่มีตัวสินค้าอัตโนมัติ กรุณารอทีมงาน").catch(() => {});
          }
        }

        await sendLog(
          interaction.guild,
          LOG_PAYMENT_NAME,
          new EmbedBuilder()
            .setColor(COLORS.green)
            .setTitle("อนุมัติสลิปแล้ว")
            .setDescription(
              [
                `> **เลขออเดอร์:** ${updated.id}`,
                `> **ลูกค้า:** ${member.user.tag}`,
                product ? `> **สินค้า:** ${product.name}` : null,
                baseRole ? `> **ยศหลัก:** <@&${baseRole.id}>` : null,
                grantedRoles.length
                  ? `> **ยศจาก stock:** ${grantedRoles.map((r) => `<@&${r.id}>`).join(", ")}`
                  : null,
                textDeliveries.length ? `> **มีข้อความจัดส่ง:** ใช่` : null,
                failedRoles.length ? `> **role ที่แจกไม่สำเร็จ:** ${failedRoles.length}` : null,
              ]
                .filter(Boolean)
                .join("\n")
            )
            .setTimestamp()
        );

        try {
          const dmLines = [
            "✅ การชำระเงินของคุณได้รับการอนุมัติแล้ว",
            product ? `สินค้า: ${product.name}` : null,
            baseRole ? `ยศหลักที่ได้รับ: ${baseRole.name}` : null,
            grantedRoles.length ? `ยศจาก stock: ${grantedRoles.map((r) => r.name).join(", ")}` : null,
            textDeliveries.length ? "\nตัวสินค้า / รายละเอียด:" : null,
            ...textDeliveries.map((d) => `- ${d}`),
            failedRoles.length ? `\nหมายเหตุ: มีบาง role ที่ระบบแจกไม่สำเร็จ กรุณาติดต่อแอดมิน` : null,
          ].filter(Boolean);

          await member.send(dmLines.join("\n"));
        } catch {}

        return interaction.update({
          content: `✅ อนุมัติ ${member.user.tag} แล้ว`,
          embeds: interaction.message.embeds,
          components: [],
        });
      }

      // ปุ่มปฏิเสธ
      if (interaction.customId.startsWith("reject_")) {
        if (!canReviewPayments(interaction.member)) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์ปฏิเสธรายการนี้", ephemeral: true });
        }

        const orderId = interaction.customId.replace("reject_", "");
        const order = findOrderById(orderId);
        if (!order) {
          return interaction.reply({ content: "❌ ไม่พบออเดอร์นี้แล้ว", ephemeral: true });
        }

        const member = await interaction.guild.members.fetch(order.userId).catch(() => null);
        const products = loadProducts();
        const product = products.find((p) => p.id === order.productId) || null;

        const updated = updateOrder(orderId, (old) => ({
          ...old,
          status: "waiting_slip",
          updatedAt: Date.now(),
        }));

        const ticketChannel = updated.ticketChannelId
          ? interaction.guild.channels.cache.get(updated.ticketChannelId)
          : null;

        if (ticketChannel) {
          await ticketChannel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.red)
                .setTitle("สลิปยังไม่ผ่าน")
                .setDescription("กรุณาส่งสลิปใหม่อีกครั้งในห้องนี้"),
            ],
            components: [buildTicketButtons(orderId, false)],
          }).catch(() => {});
        }

        await sendLog(
          interaction.guild,
          LOG_PAYMENT_NAME,
          new EmbedBuilder()
            .setColor(COLORS.red)
            .setTitle("ปฏิเสธสลิป")
            .setDescription(
              [
                member ? `> **ลูกค้า:** ${member.user.tag}` : null,
                `> **เลขออเดอร์:** ${updated.id}`,
                product ? `> **สินค้า:** ${product.name}` : null,
              ]
                .filter(Boolean)
                .join("\n")
            )
            .setTimestamp()
        );

        try {
          if (member) {
            await member.send(
              `❌ การชำระเงินของคุณยังไม่ผ่านการตรวจสอบ${product ? `\nสินค้า: ${product.name}` : ""}\nกรุณาส่งสลิปใหม่อีกครั้ง`
            );
          }
        } catch {}

        return interaction.update({
          content: `❌ ปฏิเสธรายการแล้ว${member ? ` (${member.user.tag})` : ""}`,
          embeds: interaction.message.embeds,
          components: [],
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      if (interaction.customId.startsWith("store_select_")) {
        const productId = interaction.values[0];
        if (productId === "empty") {
          return interaction.reply({ content: "ยังไม่มีสินค้าในตอนนี้", ephemeral: true });
        }

        const products = loadProducts();
        const product = products.find((p) => p.id === productId && p.active !== false);
        if (!product) {
          return interaction.reply({ content: "❌ ไม่พบสินค้านี้แล้ว", ephemeral: true });
        }

        const existingOrder = findOpenOrderByUser(interaction.user.id);
        if (existingOrder) {
          const existingChannel = existingOrder.ticketChannelId
            ? interaction.guild.channels.cache.get(existingOrder.ticketChannelId)
            : null;

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.yellow)
                .setTitle("คุณมีออเดอร์ที่กำลังดำเนินการอยู่")
                .setDescription(
                  [
                    `> **เลขออเดอร์:** ${existingOrder.id}`,
                    `> **สถานะ:** ${getOrderStatusText(existingOrder.status)}`,
                    existingChannel ? `> **Ticket:** ${existingChannel}` : null,
                    "",
                    "กรุณาจัดการออเดอร์เดิมให้เสร็จก่อน",
                  ]
                    .filter(Boolean)
                    .join("\n")
                ),
            ],
            ephemeral: true,
          });
        }

        const order = createOrder(interaction.user.id, product.id);
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!member) {
          return interaction.reply({ content: "❌ ไม่พบข้อมูลสมาชิก", ephemeral: true });
        }

        const ticket = await createPrivateOrderTicket(interaction.guild, member, product, order);

        await sendLog(
          interaction.guild,
          LOG_PAYMENT_NAME,
          new EmbedBuilder()
            .setColor(COLORS.blue)
            .setTitle("สร้างออเดอร์ใหม่")
            .setDescription(
              [
                `> **เลขออเดอร์:** ${order.id}`,
                `> **ลูกค้า:** ${member.user.tag}`,
                `> **สินค้า:** ${product.name}`,
                `> **ราคา:** ${product.price}`,
                `> **Ticket:** ${ticket}`,
              ].join("\n")
            )
            .setTimestamp()
        );

        return interaction.reply({
          embeds: [
            buildProductDetailsEmbed(interaction.guild, product).setDescription(
              [
                `> **เลขออเดอร์:** ${order.id}`,
                `> **สินค้า:** ${product.name}`,
                `> **ราคา:** ${product.price}`,
                "",
                `ระบบเปิด ticket ส่วนตัวให้คุณแล้วที่ ${ticket}`,
              ].join("\n")
            ),
          ],
          ephemeral: true,
        });
      }

      if (interaction.customId === "admin_select_product") {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์", ephemeral: true });
        }

        const productId = interaction.values[0];
        if (productId === "empty") {
          return interaction.reply({ content: "ยังไม่มีสินค้า", ephemeral: true });
        }

        const products = loadProducts();
        const product = products.find((p) => p.id === productId);
        if (!product) {
          return interaction.reply({ content: "❌ ไม่พบสินค้า", ephemeral: true });
        }

        return interaction.reply({
          embeds: [buildProductDetailsEmbed(interaction.guild, product)],
          components: buildProductManageButtons(product.id),
          ephemeral: true,
        });
      }
    }

    if (interaction.isModalSubmit()) {
      if (!isAdmin(interaction.member)) {
        return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์", ephemeral: true });
      }

      if (interaction.customId === "modal_add_product") {
        const name = interaction.fields.getTextInputValue("name").trim();
        const price = interaction.fields.getTextInputValue("price").trim();
        const category = interaction.fields.getTextInputValue("category").trim();
        const description = interaction.fields.getTextInputValue("description").trim();
        const delivery = interaction.fields.getTextInputValue("delivery").trim();

        const products = loadProducts();
        const id = generateProductId(products);

        products.push({
          id,
          name,
          price,
          category: category || "ทั่วไป",
          description,
          deliveryText: delivery || "",
          stocks: [],
          active: true,
          image: "",
          createdBy: interaction.user.id,
          createdAt: Date.now(),
        });

        saveProducts(products);

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.green)
              .setTitle("เพิ่มสินค้าแล้ว")
              .setDescription(
                [
                  `> **รหัสสินค้า:** ${id}`,
                  `> **ชื่อ:** ${name}`,
                  `> **ราคา:** ${price}`,
                  `> **หมวด:** ${category || "ทั่วไป"}`,
                  "",
                  `ใช้ \`${PREFIX}setimage ${id}\` แล้วแนบรูป เพื่อใส่รูปสินค้า`,
                ].join("\n")
              ),
          ],
          ephemeral: true,
        });
      }

      if (interaction.customId.startsWith("modal_manage_")) {
        const [, , action, productId] = interaction.customId.split("_");
        const value = interaction.fields.getTextInputValue("value").trim();

        const products = loadProducts();
        const index = products.findIndex((p) => p.id === productId);
        if (index === -1) {
          return interaction.reply({ content: "❌ ไม่พบสินค้า", ephemeral: true });
        }

        if (action === "name") products[index].name = value;
        if (action === "price") products[index].price = value;
        if (action === "category") products[index].category = value || "ทั่วไป";
        if (action === "desc") products[index].description = value;
        if (action === "delivery") products[index].deliveryText = value;
        if (action === "stock") {
          const items = value.split("||").map((s) => s.trim()).filter(Boolean);
          if (!Array.isArray(products[index].stocks)) products[index].stocks = [];
          products[index].stocks.push(...items);
        }

        saveProducts(products);

        return interaction.reply({
          content: `✅ อัปเดตสินค้า ${products[index].id} เรียบร้อยแล้ว`,
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error("Interaction error:", error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ เกิดข้อผิดพลาดระหว่างจัดการคำสั่ง",
        ephemeral: true,
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: "❌ เกิดข้อผิดพลาดระหว่างจัดการคำสั่ง",
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

// =========================
// LOG EVENTS
// =========================
client.on(Events.GuildMemberAdd, async (member) => {
  await updateServerStatusChannels(member.guild);

  await sendLog(
    member.guild,
    LOG_JOIN_LEAVE_NAME,
    new EmbedBuilder()
      .setColor(COLORS.green)
      .setTitle("สมาชิกเข้าใหม่")
      .setDescription(`${member.user} เข้าร่วมเซิร์ฟเวอร์แล้ว`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "ชื่อ", value: `${member.user.tag}`, inline: true },
        { name: "ไอดี", value: `${member.id}`, inline: true }
      )
      .setTimestamp()
  );
});

client.on(Events.GuildMemberRemove, async (member) => {
  await updateServerStatusChannels(member.guild);

  await sendLog(
    member.guild,
    LOG_JOIN_LEAVE_NAME,
    new EmbedBuilder()
      .setColor(COLORS.red)
      .setTitle("สมาชิกออก")
      .setDescription(`${member.user.tag} ออกจากเซิร์ฟเวอร์แล้ว`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields({ name: "ไอดี", value: `${member.id}`, inline: true })
      .setTimestamp()
  );
});

client.on(Events.MessageDelete, async (message) => {
  if (!message.guild) return;
  if (message.author?.bot) return;

  await sendLog(
    message.guild,
    LOG_MESSAGE_NAME,
    new EmbedBuilder()
      .setColor(COLORS.orange)
      .setTitle("ลบข้อความ")
      .addFields(
        { name: "ผู้ใช้", value: `${message.author?.tag || "ไม่ทราบ"}`, inline: true },
        { name: "ห้อง", value: `${message.channel}`, inline: true },
        { name: "ข้อความ", value: message.content?.slice(0, 1000) || "ไม่มีข้อความ" }
      )
      .setTimestamp()
  );
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (!newMessage.guild) return;
  if (newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  await sendLog(
    newMessage.guild,
    LOG_MESSAGE_NAME,
    new EmbedBuilder()
      .setColor(COLORS.blue)
      .setTitle("แก้ไขข้อความ")
      .addFields(
        { name: "ผู้ใช้", value: `${newMessage.author?.tag || "ไม่ทราบ"}`, inline: true },
        { name: "ห้อง", value: `${newMessage.channel}`, inline: true },
        { name: "ก่อนแก้", value: oldMessage.content?.slice(0, 1000) || "ไม่มีข้อความ" },
        { name: "หลังแก้", value: newMessage.content?.slice(0, 1000) || "ไม่มีข้อความ" }
      )
      .setTimestamp()
  );
});

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
  } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    action = {
      title: "ย้ายห้องเสียง",
      desc: `${member.user.tag} ย้ายจาก ${oldState.channel} ไป ${newState.channel}`,
      color: COLORS.blue,
    };
  }

  if (!action) return;

  await sendLog(
    guild,
    LOG_VOICE_NAME,
    new EmbedBuilder()
      .setColor(action.color)
      .setTitle(action.title)
      .setDescription(action.desc)
      .setTimestamp()
  );
});

client.on(Events.GuildBanAdd, async (ban) => {
  await sendLog(
    ban.guild,
    LOG_MOD_NAME,
    new EmbedBuilder()
      .setColor(COLORS.red)
      .setTitle("แบนสมาชิก")
      .setDescription(`${ban.user.tag} ถูกแบน`)
      .setTimestamp()
  );
});

client.on(Events.GuildBanRemove, async (ban) => {
  await sendLog(
    ban.guild,
    LOG_MOD_NAME,
    new EmbedBuilder()
      .setColor(COLORS.green)
      .setTitle("ปลดแบนสมาชิก")
      .setDescription(`${ban.user.tag} ถูกปลดแบน`)
      .setTimestamp()
  );
});

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

ensureJsonFile(PRODUCTS_FILE);
ensureJsonFile(ORDERS_FILE);
client.login(TOKEN);
