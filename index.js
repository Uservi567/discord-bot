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

// ==================================================
// CLIENT
// ==================================================
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

// ==================================================
// CONFIG
// ==================================================
const TOKEN = process.env.TOKEN;
const PREFIX = "!";

// ยศกดรับเอง
const TARGET_ROLE_ID = "1347851123364593753";

// ยศหลักจากการซื้อ
const PURCHASE_ROLE_ID = "";

// ทีมงาน
const STAFF_ALERT_ROLE_ID = "";
const REVIEWER_ROLE_ID = "";

// รูป
const ROLE_PANEL_GIF =
  "https://i.postimg.cc/BvgsywmH/snaptik-7505147525616176389-hd.gif";
const SHOP_BANNER = "";

// ปุ่ม
const ROLE_PANEL_BUTTON_ID = "toggle_self_role";

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

// Discord limits
const EMBED_DESC_LIMIT = 4096;
const EMBED_FIELD_LIMIT = 1024;
const EMBED_TITLE_LIMIT = 256;
const EMBED_AUTHOR_LIMIT = 256;
const EMBED_TOTAL_LIMIT = 6000;
const MAX_EMBEDS_PER_MESSAGE = 10;
const SAFE_FIELD_CHUNK = 950;

// ==================================================
// FILE HELPERS
// ==================================================
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

function normalizeProduct(product = {}) {
  return {
    id: product.id || "",
    name: String(product.name || "ไม่มีชื่อสินค้า"),
    price: String(product.price || "-"),
    category: String(product.category || "ทั่วไป"),
    description: String(product.description || ""),
    deliveryText: String(product.deliveryText || ""),
    autoOpenText: String(product.autoOpenText || ""),
    stocks: Array.isArray(product.stocks) ? product.stocks : [],
    active: product.active !== false,
    image: String(product.image || ""),
    createdBy: product.createdBy || null,
    createdAt: product.createdAt || Date.now(),
  };
}

function normalizeAllProducts() {
  const products = readJsonArray(PRODUCTS_FILE).map(normalizeProduct);
  writeJsonArray(PRODUCTS_FILE, products);
  return products;
}

function loadProducts() {
  return normalizeAllProducts();
}

function saveProducts(products) {
  writeJsonArray(PRODUCTS_FILE, products.map(normalizeProduct));
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

// ==================================================
// GENERAL HELPERS
// ==================================================
function clampText(text, max, fallback = "ไม่มีข้อมูล") {
  const value = String(text || "").trim();
  if (!value) return fallback;
  if (value.length <= max) return value;
  return `${value.slice(0, max - 30)}\n\n...ข้อความถูกตัดอัตโนมัติ`;
}

function splitLongText(text, chunkSize = SAFE_FIELD_CHUNK) {
  const value = String(text || "").trim();
  if (!value) return [];

  const lines = value.split("\n");
  const chunks = [];
  let current = "";

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;

    if (candidate.length <= chunkSize) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (line.length <= chunkSize) {
      current = line;
      continue;
    }

    let remaining = line;
    while (remaining.length > chunkSize) {
      chunks.push(remaining.slice(0, chunkSize));
      remaining = remaining.slice(chunkSize);
    }
    if (remaining) current = remaining;
  }

  if (current) chunks.push(current);
  return chunks;
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function sendEmbedsSmart(target, embeds, payload = {}) {
  const safeEmbeds = Array.isArray(embeds) ? embeds.filter(Boolean) : [];
  if (!safeEmbeds.length) {
    return target.send?.(payload) || target.reply?.(payload);
  }

  const groups = chunkArray(safeEmbeds, MAX_EMBEDS_PER_MESSAGE);
  let first = true;

  for (const group of groups) {
    if (first) {
      if (typeof target.reply === "function") {
        await target.reply({ ...payload, embeds: group });
      } else if (typeof target.send === "function") {
        await target.send({ ...payload, embeds: group });
      } else if (typeof target.update === "function") {
        await target.update({ ...payload, embeds: group });
      } else if (typeof target.followUp === "function") {
        await target.followUp({ ...payload, embeds: group });
      }
      first = false;
    } else if (typeof target.followUp === "function") {
      await target.followUp({ embeds: group, ephemeral: payload.ephemeral }).catch(() => {});
    } else if (typeof target.send === "function") {
      await target.send({ embeds: group }).catch(() => {});
    }
  }
}

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
    member?.permissions?.has(PermissionsBitField.Flags.Administrator) ||
    member?.permissions?.has(PermissionsBitField.Flags.ManageChannels)
  );
}

function canReviewPayments(member) {
  if (isAdmin(member)) return true;
  if (REVIEWER_ROLE_ID && member?.roles?.cache?.has(REVIEWER_ROLE_ID)) return true;
  return false;
}

function sanitizeChannelName(text, fallback = "ticket") {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || fallback;
}

function applyProductTextVariables(text, data = {}) {
  return String(text || "")
    .replace(/\{user\}/gi, data.userMention || "")
    .replace(/\{username\}/gi, data.username || "")
    .replace(/\{product\}/gi, data.productName || "")
    .replace(/\{price\}/gi, data.price || "")
    .replace(/\{orderId\}/gi, data.orderId || "")
    .replace(/\{ticket\}/gi, data.ticketMention || "")
    .replace(/\{guild\}/gi, data.guildName || "");
}

function parseAutoOpenMessages(rawText) {
  if (!rawText || !String(rawText).trim()) return [];
  return String(rawText)
    .split(/\n\s*---+\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function sendProductAutoMessages(channel, member, product, order) {
  const messages = parseAutoOpenMessages(product.autoOpenText);
  if (!messages.length) return;

  for (const msg of messages) {
    const finalText = applyProductTextVariables(msg, {
      userMention: `${member}`,
      username: member.user.username,
      productName: product.name,
      price: product.price,
      orderId: order.id,
      ticketMention: `${channel}`,
      guildName: channel.guild.name,
    });

    const chunks = splitLongText(finalText, 3900);
    for (const chunk of chunks) {
      await channel
        .send({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.shop)
              .setTitle("📩 ข้อความอัตโนมัติ")
              .setDescription(clampText(chunk, EMBED_DESC_LIMIT, "ไม่มีข้อความ")),
          ],
        })
        .catch(() => {});
    }
  }
}

async function readAttachmentText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("อ่านไฟล์แนบไม่ได้");
  return await response.text();
}

// ==================================================
// ROLE HELPERS
// ==================================================
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

  try {
    await member.roles.add(guildRole, reason);
    return { ok: true, role: guildRole };
  } catch (error) {
    console.error("safelyGiveRole error:", error);
    return { ok: false, message: `ให้ role ${guildRole.name} ไม่สำเร็จ` };
  }
}

// ==================================================
// PERMISSIONS / CHANNEL HELPERS
// ==================================================
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

async function getOrCreateTextChannel(
  guild,
  categoryName,
  channelName,
  topic = "",
  permissionOverwrites = null
) {
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

// ==================================================
// STATUS
// ==================================================
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

// ==================================================
// ROLE PANEL
// ==================================================
function buildRolePanelEmbed(guild) {
  return new EmbedBuilder()
    .setColor(COLORS.dark)
    .setAuthor({
      name: clampText(guild.name, EMBED_AUTHOR_LIMIT, "Server"),
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

// ==================================================
// SHOP UI
// ==================================================
function buildShopHeaderEmbed(guild) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: clampText(`${guild.name} • Official Store`, EMBED_AUTHOR_LIMIT, "Store"),
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
  const lines = items.map((p, i) => {
    const shortDesc = p.description
      ? `\n${clampText(p.description, 120, "")}`
      : "";
    return `**${i + 1}. ${clampText(p.name, 100)}** — ${clampText(p.price, 80)}${
      p.stockCount !== undefined ? ` • คงเหลือ ${p.stockCount}` : ""
    }\nหมวด: ${clampText(p.category || "ทั่วไป", 60)} • \`${p.id}\`${shortDesc}`;
  });

  return new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: clampText(`${guild.name} • Product Selection`, EMBED_AUTHOR_LIMIT, "Products"),
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle("✦ เลือกสินค้า")
    .setDescription(clampText(lines.join("\n\n") || "ยังไม่มีสินค้า", EMBED_DESC_LIMIT))
    .setFooter({ text: `หน้า ${page + 1}/${totalPages}` });
}

function buildSectionEmbeds({ guild, product, title, rawText, color, prefix }) {
  const chunks = splitLongText(rawText, SAFE_FIELD_CHUNK);
  if (!chunks.length) return [];

  const pages = [];
  const grouped = chunkArray(chunks, 4);

  grouped.forEach((group, groupIndex) => {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({
        name: clampText(`${guild.name} • Product Details`, EMBED_AUTHOR_LIMIT, "Product Details"),
        iconURL: guild.iconURL({ dynamic: true }) || undefined,
      })
      .setTitle(
        clampText(
          `✦ ${product.name} • ${title}${grouped.length > 1 ? ` (${groupIndex + 1}/${grouped.length})` : ""}`,
          EMBED_TITLE_LIMIT
        )
      );

    if (product.image && groupIndex === 0) embed.setImage(product.image);
    if (guild.iconURL()) embed.setThumbnail(guild.iconURL({ dynamic: true }));

    group.forEach((chunk, i) => {
      embed.addFields({
        name: `${prefix} ${groupIndex * 4 + i + 1}`,
        value: clampText(chunk, EMBED_FIELD_LIMIT, "ไม่มีข้อมูล"),
      });
    });

    pages.push(embed);
  });

  return pages;
}

function buildProductDetailsEmbeds(guild, rawProduct) {
  const product = normalizeProduct(rawProduct);

  const summary = new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: clampText(`${guild.name} • Product Details`, EMBED_AUTHOR_LIMIT, "Product Details"),
      iconURL: guild.iconURL({ dynamic: true }) || undefined,
    })
    .setTitle(clampText(`✦ ${product.name}`, EMBED_TITLE_LIMIT))
    .addFields(
      { name: "ราคา", value: clampText(product.price, 100), inline: true },
      { name: "รหัสสินค้า", value: clampText(product.id, 100), inline: true },
      { name: "หมวด", value: clampText(product.category || "ทั่วไป", 100), inline: true },
      {
        name: "สรุปรายละเอียด",
        value: product.description
          ? `มีรายละเอียด ${product.description.length.toLocaleString("th-TH")} ตัวอักษร`
          : "ไม่มีรายละเอียด",
        inline: true,
      },
      {
        name: "ข้อความหลังซื้อ",
        value: product.deliveryText
          ? `มีข้อความ ${product.deliveryText.length.toLocaleString("th-TH")} ตัวอักษร`
          : "ไม่มี",
        inline: true,
      },
      {
        name: "ข้อความเด้ง",
        value: product.autoOpenText
          ? `มีข้อความ ${product.autoOpenText.length.toLocaleString("th-TH")} ตัวอักษร`
          : "ไม่มี",
        inline: true,
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

  if (product.image) summary.setImage(product.image);
  if (guild.iconURL()) summary.setThumbnail(guild.iconURL({ dynamic: true }));

  const embeds = [summary];

  embeds.push(
    ...buildSectionEmbeds({
      guild,
      product,
      title: "รายละเอียดสินค้า",
      rawText: product.description,
      color: COLORS.blue,
      prefix: "รายละเอียดส่วนที่",
    })
  );

  embeds.push(
    ...buildSectionEmbeds({
      guild,
      product,
      title: "ตัวสินค้า / ข้อความหลังซื้อ",
      rawText: product.deliveryText,
      color: COLORS.green,
      prefix: "ข้อความส่วนที่",
    })
  );

  embeds.push(
    ...buildSectionEmbeds({
      guild,
      product,
      title: "ข้อความเด้งอัตโนมัติ",
      rawText: product.autoOpenText,
      color: COLORS.orange,
      prefix: "ข้อความเด้งส่วนที่",
    })
  );

  return embeds;
}

function buildAdminPanelEmbed(guild) {
  return new EmbedBuilder()
    .setColor(COLORS.shop)
    .setAuthor({
      name: clampText(`${guild.name} • Product Control`, EMBED_AUTHOR_LIMIT, "Product Control"),
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
        "",
        `คำสั่งเสริม: \`${PREFIX}importdesc P001\` + แนบไฟล์ txt`,
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
      new ButtonBuilder().setCustomId(`manage_toggle_${productId}`).setLabel("เปิด/ปิดขาย").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`manage_delete_${productId}`).setLabel("ลบสินค้า").setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`manage_desc_${productId}`).setLabel("แทนรายละเอียด").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`manage_descappend_${productId}`).setLabel("ต่อท้ายรายละเอียด").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`manage_descclear_${productId}`).setLabel("ล้างรายละเอียด").setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`manage_delivery_${productId}`).setLabel("แทนข้อความหลังซื้อ").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`manage_deliveryappend_${productId}`).setLabel("ต่อท้ายข้อความหลังซื้อ").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`manage_deliveryclear_${productId}`).setLabel("ล้างข้อความหลังซื้อ").setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`manage_autoreply_${productId}`).setLabel("แทนข้อความเด้ง").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`manage_autoreplyappend_${productId}`).setLabel("ต่อท้ายข้อความเด้ง").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`manage_autoreplyclear_${productId}`).setLabel("ล้างข้อความเด้ง").setStyle(ButtonStyle.Danger)
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`manage_stock_${productId}`).setLabel("เพิ่มสต็อก").setStyle(ButtonStyle.Secondary)
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
            label: clampText(p.name, 100),
            description: clampText(
              `${p.price}${p.stockCount !== undefined ? ` | คงเหลือ ${p.stockCount}` : ""}`,
              100,
              "-"
            ),
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
    label: clampText(`${p.id} • ${p.name}`, 100),
    description: clampText(
      `${p.price} • ${p.active === false ? "ปิดขาย" : "เปิดขาย"}`,
      100,
      "-"
    ),
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

  await productsChannel.send({
    embeds: [buildProductSelectEmbed(guild, 0, pages.length, firstPageItems)],
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

// ==================================================
// ORDER / DELIVERY
// ==================================================
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
        `> **สินค้า:** ${clampText(product.name, 150)}`,
        `> **ราคา:** ${clampText(product.price, 100)}`,
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

  await sendProductAutoMessages(channel, member, product, {
    ...order,
    status: "waiting_slip",
  });

  return channel;
}

function getDuplicateSlipWarning(currentOrderId, slipUrl) {
  const orders = loadOrders();
  return orders.find((o) => o.id !== currentOrderId && o.slipUrl && o.slipUrl === slipUrl) || null;
}

// stock 1 ชิ้น = 1 แพ็ก เช่น role:111||link:abc
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
        ? `<div class="attach">${[...m.attachments.values()]
            .map((a) => `<a href="${a.url}">${a.url}</a>`)
            .join("<br>")}</div>`
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

        await channel
          .send("⚠ กรุณาส่งสลิปภายในเวลาที่กำหนด ไม่เช่นนั้น ticket นี้จะถูกปิดอัตโนมัติ")
          .catch(() => {});
      }
    }
  }
}

// ==================================================
// DIAGNOSTIC
// ==================================================
async function checkSystem(guild) {
  const results = [];
  const push = (ok, label, detail = "") => results.push({ ok, label, detail });

  try {
    ensureJsonFile(PRODUCTS_FILE);
    const products = loadProducts();
    push(Array.isArray(products), "products.json", Array.isArray(products) ? "อ่านได้" : "อ่านไม่ได้");
  } catch {
    push(false, "products.json", "อ่านไม่ได้");
  }

  try {
    ensureJsonFile(ORDERS_FILE);
    const orders = loadOrders();
    push(Array.isArray(orders), "orders.json", Array.isArray(orders) ? "อ่านได้" : "อ่านไม่ได้");
  } catch {
    push(false, "orders.json", "อ่านไม่ได้");
  }

  const me = guild.members.me;
  push(!!me, "พบตัวบอทในเซิร์ฟ", me ? me.user.tag : "ไม่พบ");

  if (me) {
    push(me.permissions.has(PermissionsBitField.Flags.ManageChannels), "Manage Channels", me.permissions.has(PermissionsBitField.Flags.ManageChannels) ? "มี" : "ไม่มี");
    push(me.permissions.has(PermissionsBitField.Flags.ManageRoles), "Manage Roles", me.permissions.has(PermissionsBitField.Flags.ManageRoles) ? "มี" : "ไม่มี");
    push(me.permissions.has(PermissionsBitField.Flags.SendMessages), "Send Messages", me.permissions.has(PermissionsBitField.Flags.SendMessages) ? "มี" : "ไม่มี");
    push(me.permissions.has(PermissionsBitField.Flags.EmbedLinks), "Embed Links", me.permissions.has(PermissionsBitField.Flags.EmbedLinks) ? "มี" : "ไม่มี");
    push(me.permissions.has(PermissionsBitField.Flags.AttachFiles), "Attach Files", me.permissions.has(PermissionsBitField.Flags.AttachFiles) ? "มี" : "ไม่มี");
  }

  const targetRole = await guild.roles.fetch(TARGET_ROLE_ID).catch(() => null);
  push(!!targetRole, "TARGET_ROLE_ID", targetRole ? targetRole.name : "ไม่พบ");

  if (targetRole && me) {
    push(
      me.roles.highest.position > targetRole.position,
      "ลำดับ role บอท > role รับยศ",
      me.roles.highest.position > targetRole.position ? "ถูกต้อง" : "บอทต่ำกว่า"
    );
  }

  if (PURCHASE_ROLE_ID) {
    const purchaseRole = await guild.roles.fetch(PURCHASE_ROLE_ID).catch(() => null);
    push(!!purchaseRole, "PURCHASE_ROLE_ID", purchaseRole ? purchaseRole.name : "ไม่พบ");
    if (purchaseRole && me) {
      push(
        me.roles.highest.position > purchaseRole.position,
        "ลำดับ role บอท > role หลักตอนซื้อ",
        me.roles.highest.position > purchaseRole.position ? "ถูกต้อง" : "บอทต่ำกว่า"
      );
    }
  } else {
    push(true, "PURCHASE_ROLE_ID", "ปิดการใช้งาน");
  }

  const roleCh = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name === ROLE_CHANNEL_NAME);
  const productCh = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name === PRODUCTS_CHANNEL_NAME);
  const verifyCh = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name === VERIFY_CHANNEL_NAME);
  const adminCh = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name === ADMIN_PANEL_CHANNEL_NAME);

  push(!!roleCh, ROLE_CHANNEL_NAME, roleCh ? "พบ" : "ไม่พบ");
  push(!!productCh, PRODUCTS_CHANNEL_NAME, productCh ? "พบ" : "ไม่พบ");
  push(!!verifyCh, VERIFY_CHANNEL_NAME, verifyCh ? "พบ" : "ไม่พบ");
  push(!!adminCh, ADMIN_PANEL_CHANNEL_NAME, adminCh ? "พบ" : "ไม่พบ");

  return results;
}

// ==================================================
// SETUP
// ==================================================
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
  const done = [];

  await getOrCreateCategory(guild, STATUS_CATEGORY_NAME); done.push(STATUS_CATEGORY_NAME);
  await getOrCreateCategory(guild, STORE_CATEGORY_NAME); done.push(STORE_CATEGORY_NAME);
  await getOrCreateCategory(guild, CUSTOMER_CATEGORY_NAME); done.push(CUSTOMER_CATEGORY_NAME);
  await getOrCreateCategory(guild, ROLE_CATEGORY_NAME); done.push(ROLE_CATEGORY_NAME);
  await getOrCreateCategory(guild, LOG_CATEGORY_NAME); done.push(LOG_CATEGORY_NAME);
  await getOrCreateCategory(guild, ADMIN_CATEGORY_NAME); done.push(ADMIN_CATEGORY_NAME);

  await ensureStatusChannels(guild); done.push("status-channels");
  await updateServerStatusChannels(guild); done.push("status-update");
  await setupLogs(guild); done.push("logs");
  await setupStore(guild); done.push("store");
  await setupRolePanel(guild); done.push("role-panel");
  await setupAdminPanel(guild); done.push("admin-panel");

  return done;
}

// ==================================================
// READY
// ==================================================
client.once(Events.ClientReady, async (bot) => {
  ensureJsonFile(PRODUCTS_FILE);
  ensureJsonFile(ORDERS_FILE);
  normalizeAllProducts();

  console.log(`✅ Logged in as ${bot.user.tag}`);

  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await updateServerStatusChannels(guild).catch(() => {});
    }
    await checkTicketTimeouts().catch(() => {});
  }, STATUS_UPDATE_INTERVAL);
});

// ==================================================
// MESSAGE COMMANDS
// ==================================================
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
            `> **สินค้า:** ${clampText(product.name, 120)}`,
            `> **ราคา:** ${clampText(product.price, 80)}`,
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
            .setDescription("ระบบส่งสลิปของคุณไปให้ทีมงานตรวจแล้ว กรุณารอการยืนยัน"),
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
              `> **สินค้า:** ${clampText(product.name, 120)}`,
              `> **ราคา:** ${clampText(product.price, 80)}`,
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

    // setup
    if (message.content === `${PREFIX}setupall` || message.content === `${PREFIX}setup`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      const done = await setupAll(message.guild);
      return message.reply(
        ["✅ สร้างระบบทั้งหมดเรียบร้อยแล้ว", `สำเร็จ: ${done.join(", ")}`].join("\n")
      );
    }

    if (message.content === `${PREFIX}refreshshop`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      await renderShopPanel(message.guild);
      await setupAdminPanel(message.guild);
      return message.reply("✅ รีเฟรชหน้าร้านและแผงแอดมินแล้ว");
    }

    if (message.content === `${PREFIX}fixpanels`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      await setupRolePanel(message.guild);
      await renderShopPanel(message.guild);
      await setupAdminPanel(message.guild);
      return message.reply("✅ ซ่อม panel หลักให้แล้ว");
    }

    if (message.content === `${PREFIX}รับยศ`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      await setupRolePanel(message.guild);
      return message.reply("✅ สร้างแผงรับยศแล้ว");
    }

    if (message.content === `${PREFIX}checksystem`) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const results = await checkSystem(message.guild);
      const okCount = results.filter((r) => r.ok).length;
      const lines = results.map(
        (r) => `${r.ok ? "✅" : "❌"} ${r.label}${r.detail ? ` — ${r.detail}` : ""}`
      );

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(okCount === results.length ? COLORS.green : COLORS.yellow)
            .setTitle("System Check")
            .setDescription(clampText(lines.join("\n"), EMBED_DESC_LIMIT)),
        ],
      });
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
          `**${p.id}** • ${clampText(p.name, 80)} • ${clampText(p.price, 50)} • ${clampText(
            p.category || "ทั่วไป",
            50
          )} • ${p.active === false ? "ปิดขาย" : "เปิดขาย"} • stock:${
            Array.isArray(p.stocks) ? p.stocks.length : 0
          } • desc:${p.description.length} • delivery:${p.deliveryText.length} • auto:${p.autoOpenText.length}`
      );

      const embedGroups = splitLongText(lines.join("\n"), 3900).map((chunk, i, arr) =>
        new EmbedBuilder()
          .setColor(COLORS.blue)
          .setTitle(`รายการสินค้า${arr.length > 1 ? ` (${i + 1}/${arr.length})` : ""}`)
          .setDescription(chunk)
      );

      return sendEmbedsSmart(message, embedGroups);
    }

    if (message.content.startsWith(`${PREFIX}viewproduct`)) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const productId = message.content.split(" ")[1]?.trim();
      if (!productId) return message.reply(`❌ ใช้แบบนี้: \`${PREFIX}viewproduct P001\``);

      const products = loadProducts();
      const product = products.find((p) => p.id === productId);
      if (!product) return message.reply("❌ ไม่พบสินค้า");

      return sendEmbedsSmart(message, buildProductDetailsEmbeds(message.guild, product));
    }

    if (message.content.startsWith(`${PREFIX}stockinfo`)) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const productId = message.content.split(" ")[1]?.trim();
      if (!productId) return message.reply(`❌ ใช้แบบนี้: \`${PREFIX}stockinfo P001\``);

      const products = loadProducts();
      const product = products.find((p) => p.id === productId);
      if (!product) return message.reply("❌ ไม่พบสินค้า");

      const stocks = Array.isArray(product.stocks) ? product.stocks : [];
      const preview = stocks.slice(0, 10).map((s, i) => `#${i + 1} ${String(s).slice(0, 300)}`);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.blue)
            .setTitle(`Stock Info • ${clampText(product.name, 120)}`)
            .setDescription(
              clampText(
                [`> จำนวน stock: ${stocks.length}`, "", preview.length ? preview.join("\n\n") : "ยังไม่มี stock"].join(
                  "\n"
                ),
                EMBED_DESC_LIMIT
              )
            ),
        ],
      });
    }

    if (message.content.startsWith(`${PREFIX}clearstock`)) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const productId = message.content.split(" ")[1]?.trim();
      if (!productId) return message.reply(`❌ ใช้แบบนี้: \`${PREFIX}clearstock P001\``);

      const products = loadProducts();
      const index = products.findIndex((p) => p.id === productId);
      if (index === -1) return message.reply("❌ ไม่พบสินค้า");

      products[index].stocks = [];
      saveProducts(products);

      return message.reply(`✅ ล้าง stock ของ ${products[index].name} แล้ว`);
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
            .setDescription(clampText(lines.join("\n"), EMBED_DESC_LIMIT)),
        ],
      });
    }

    // import detail from txt / md
    if (message.content.startsWith(`${PREFIX}importdesc`)) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const productId = message.content.split(" ")[1]?.trim();
      if (!productId) {
        return message.reply(`❌ ใช้แบบนี้: \`${PREFIX}importdesc P001\` แล้วแนบไฟล์ .txt หรือ .md`);
      }

      const attachment = message.attachments.first();
      if (!attachment) {
        return message.reply("❌ กรุณาแนบไฟล์ .txt หรือ .md");
      }

      const isTextLike =
        attachment.name?.endsWith(".txt") ||
        attachment.name?.endsWith(".md") ||
        attachment.contentType?.includes("text");

      if (!isTextLike) {
        return message.reply("❌ รองรับเฉพาะไฟล์ .txt หรือ .md");
      }

      const products = loadProducts();
      const index = products.findIndex((p) => p.id === productId);
      if (index === -1) return message.reply("❌ ไม่พบสินค้า");

      const text = await readAttachmentText(attachment.url);
      products[index].description = text;
      saveProducts(products);

      return message.reply(
        `✅ นำเข้ารายละเอียดสินค้า ${products[index].name} สำเร็จ (${text.length.toLocaleString("th-TH")} ตัวอักษร)`
      );
    }

    if (message.content.startsWith(`${PREFIX}appenddesc`)) {
      if (!admin) return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");

      const parts = message.content.split(" ");
      const productId = parts[1]?.trim();
      const appendText = parts.slice(2).join(" ").trim();

      if (!productId || !appendText) {
        return message.reply(`❌ ใช้แบบนี้: \`${PREFIX}appenddesc P001 ข้อความที่ต้องการต่อท้าย\``);
      }

      const products = loadProducts();
      const index = products.findIndex((p) => p.id === productId);
      if (index === -1) return message.reply("❌ ไม่พบสินค้า");

      products[index].description = [products[index].description, appendText].filter(Boolean).join("\n");
      saveProducts(products);

      return message.reply(
        `✅ ต่อท้ายรายละเอียดสินค้า ${products[index].name} แล้ว (รวม ${products[index].description.length.toLocaleString(
          "th-TH"
        )} ตัวอักษร)`
      );
    }
  } catch (error) {
    console.error("MessageCreate error:", error);
    await message.reply("❌ เกิดข้อผิดพลาดขณะทำงาน").catch(() => {});
  }
});

// ==================================================
// INTERACTIONS
// ==================================================
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.guild) return;

    if (interaction.isButton()) {
      // รับยศ
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
                .setDescription(`ระบบได้เอายศ <@&${TARGET_ROLE_ID}> ออกจากคุณแล้ว`),
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
              .setDescription(`ระบบได้มอบยศ <@&${TARGET_ROLE_ID}> ให้คุณแล้ว`),
          ],
          ephemeral: true,
        });
      }

      // เปลี่ยนหน้าร้าน
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

      // admin
      if (interaction.customId === "admin_add_product") {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์", ephemeral: true });
        }

        const modal = new ModalBuilder().setCustomId("modal_add_product").setTitle("เพิ่มสินค้า");

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
            new TextInputBuilder()
              .setCustomId("description")
              .setLabel("รายละเอียดสินค้า (รอบแรก)")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("delivery")
              .setLabel("ตัวสินค้า / ข้อความหลังซื้อ (รอบแรก)")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
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

      // จัดการสินค้า
      if (interaction.customId.startsWith("manage_")) {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: "❌ คุณไม่มีสิทธิ์", ephemeral: true });
        }

        const parts = interaction.customId.split("_");
        const action = parts[1];
        const productId = parts.slice(2).join("_");

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

        if (action === "descclear") {
          product.description = "";
          saveProducts(products);
          return interaction.reply({
            content: `✅ ล้างรายละเอียดสินค้า ${product.name} แล้ว`,
            ephemeral: true,
          });
        }

        if (action === "deliveryclear") {
          product.deliveryText = "";
          saveProducts(products);
          return interaction.reply({
            content: `✅ ล้างข้อความหลังซื้อ ${product.name} แล้ว`,
            ephemeral: true,
          });
        }

        if (action === "autoreplyclear") {
          product.autoOpenText = "";
          saveProducts(products);
          return interaction.reply({
            content: `✅ ล้างข้อความเด้งของ ${product.name} แล้ว`,
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
          title = `แทนรายละเอียด ${productId}`;
          label = "รายละเอียดใหม่ (แทนของเดิม)";
          style = TextInputStyle.Paragraph;
          value = clampText(product.description || "", 4000, "");
        } else if (action === "descappend") {
          title = `ต่อท้ายรายละเอียด ${productId}`;
          label = "ข้อความที่จะต่อท้าย";
          style = TextInputStyle.Paragraph;
          value = "";
        } else if (action === "delivery") {
          title = `แทนข้อความหลังซื้อ ${productId}`;
          label = "ตัวสินค้า / ข้อความหลังซื้อใหม่";
          style = TextInputStyle.Paragraph;
          value = clampText(product.deliveryText || "", 4000, "");
        } else if (action === "deliveryappend") {
          title = `ต่อท้ายข้อความหลังซื้อ ${productId}`;
          label = "ข้อความที่จะต่อท้าย";
          style = TextInputStyle.Paragraph;
          value = "";
        } else if (action === "autoreply") {
          title = `แทนข้อความเด้ง ${productId}`;
          label = "ข้อความเด้งใหม่";
          style = TextInputStyle.Paragraph;
          value = clampText(product.autoOpenText || "", 4000, "");
        } else if (action === "autoreplyappend") {
          title = `ต่อท้ายข้อความเด้ง ${productId}`;
          label = "ข้อความที่จะต่อท้าย";
          style = TextInputStyle.Paragraph;
          value = "";
        } else if (action === "stock") {
          title = `เพิ่มสต็อก ${productId}`;
          label = "1 ครั้ง = 1 stock เช่น role:123||link:abc";
          style = TextInputStyle.Paragraph;
          value = "";
        } else {
          return interaction.reply({ content: "❌ action ไม่ถูกต้อง", ephemeral: true });
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
                .setValue(value)
            )
          );

        return interaction.showModal(modal);
      }

      // ticket info
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
                  `> **สินค้า:** ${clampText(product?.name || order.productId, 120)}`,
                  `> **ราคา:** ${clampText(product?.price || "-", 80)}`,
                ].join("\n")
              ),
          ],
          ephemeral: true,
        });
      }

      // close ticket
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

      // approve
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
          await ticketChannel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(COLORS.green)
                  .setTitle("ชำระเงินสำเร็จ")
                  .setDescription(
                    [
                      `${member}`,
                      "",
                      product ? `> **สินค้า:** ${clampText(product.name, 120)}` : null,
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
            })
            .catch(() => {});

          if (textDeliveries.length) {
            const deliveryEmbeds = buildSectionEmbeds({
              guild: interaction.guild,
              product: normalizeProduct(product || {}),
              title: "ตัวสินค้า / รายละเอียดหลังซื้อ",
              rawText: textDeliveries.join("\n"),
              color: COLORS.blue,
              prefix: "ข้อมูลส่วนที่",
            });

            for (const embedsPart of chunkArray(deliveryEmbeds, MAX_EMBEDS_PER_MESSAGE)) {
              await ticketChannel.send({ embeds: embedsPart }).catch(() => {});
            }
          }

          if (failedRoles.length) {
            await ticketChannel
              .send({
                embeds: [
                  new EmbedBuilder()
                    .setColor(COLORS.orange)
                    .setTitle("⚠ มีบาง role ที่แจกไม่สำเร็จ")
                    .setDescription(clampText(failedRoles.join("\n"), EMBED_DESC_LIMIT)),
                ],
              })
              .catch(() => {});
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
                product ? `> **สินค้า:** ${clampText(product.name, 120)}` : null,
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

          const dmChunks = splitLongText(dmLines.join("\n"), 1900);
          for (const dmChunk of dmChunks) {
            await member.send(dmChunk).catch(() => {});
          }
        } catch {}

        return interaction.update({
          content: `✅ อนุมัติ ${member.user.tag} แล้ว`,
          embeds: interaction.message.embeds,
          components: [],
        });
      }

      // reject
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
          await ticketChannel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(COLORS.red)
                  .setTitle("สลิปยังไม่ผ่าน")
                  .setDescription("กรุณาส่งสลิปใหม่อีกครั้งในห้องนี้"),
              ],
              components: [buildTicketButtons(orderId, false)],
            })
            .catch(() => {});
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
                product ? `> **สินค้า:** ${clampText(product.name, 120)}` : null,
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

        const quickEmbeds = buildProductDetailsEmbeds(interaction.guild, product).slice(0, 3);
        if (quickEmbeds[0]) {
          quickEmbeds[0].setDescription(
            [
              `> **เลขออเดอร์:** ${order.id}`,
              `> **สินค้า:** ${clampText(product.name, 120)}`,
              `> **ราคา:** ${clampText(product.price, 80)}`,
              "",
              `ระบบเปิด ticket ส่วนตัวให้คุณแล้วที่ ${ticket}`,
            ].join("\n")
          );
        }

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
                `> **สินค้า:** ${clampText(product.name, 120)}`,
                `> **ราคา:** ${clampText(product.price, 80)}`,
                `> **Ticket:** ${ticket}`,
              ].join("\n")
            )
            .setTimestamp()
        );

        return sendEmbedsSmart(interaction, quickEmbeds, { ephemeral: true });
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
          embeds: buildProductDetailsEmbeds(interaction.guild, product).slice(0, 10),
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
          autoOpenText: "",
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
                  `> **ชื่อ:** ${clampText(name, 120)}`,
                  `> **ราคา:** ${clampText(price, 80)}`,
                  `> **หมวด:** ${clampText(category || "ทั่วไป", 80)}`,
                  `> **รายละเอียดเริ่มต้น:** ${description.length.toLocaleString("th-TH")} ตัวอักษร`,
                  `> **ข้อความหลังซื้อเริ่มต้น:** ${delivery.length.toLocaleString("th-TH")} ตัวอักษร`,
                  "",
                  `ใช้ \`${PREFIX}setimage ${id}\` แล้วแนบรูป เพื่อใส่รูปสินค้า`,
                  `ถ้าข้อความยาวมาก ใช้ \`${PREFIX}importdesc ${id}\` แล้วแนบไฟล์ .txt`,
                ].join("\n")
              ),
          ],
          ephemeral: true,
        });
      }

      if (interaction.customId.startsWith("modal_manage_")) {
        const parts = interaction.customId.split("_");
        const action = parts[2];
        const productId = parts.slice(3).join("_");
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
        if (action === "descappend") {
          products[index].description = [products[index].description, value].filter(Boolean).join("\n");
        }
        if (action === "delivery") products[index].deliveryText = value;
        if (action === "deliveryappend") {
          products[index].deliveryText = [products[index].deliveryText, value].filter(Boolean).join("\n");
        }
        if (action === "autoreply") products[index].autoOpenText = value;
        if (action === "autoreplyappend") {
          products[index].autoOpenText = [products[index].autoOpenText, value].filter(Boolean).join("\n");
        }
        if (action === "stock") {
          if (!Array.isArray(products[index].stocks)) {
            products[index].stocks = [];
          }
          products[index].stocks.push(value);
        }

        saveProducts(products);

        return interaction.reply({
          content: `✅ อัปเดตสินค้า ${products[index].id} เรียบร้อยแล้ว
รายละเอียด: ${products[index].description.length.toLocaleString("th-TH")} ตัวอักษร
ข้อความหลังซื้อ: ${products[index].deliveryText.length.toLocaleString("th-TH")} ตัวอักษร
ข้อความเด้ง: ${products[index].autoOpenText.length.toLocaleString("th-TH")} ตัวอักษร`,
          ephemeral: true,
        });
      }
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

// ==================================================
// LOG EVENTS
// ==================================================
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
        { name: "ข้อความ", value: clampText(message.content?.slice(0, 1000) || "ไม่มีข้อความ", 1000) }
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
        { name: "ก่อนแก้", value: clampText(oldMessage.content?.slice(0, 1000) || "ไม่มีข้อความ", 1000) },
        { name: "หลังแก้", value: clampText(newMessage.content?.slice(0, 1000) || "ไม่มีข้อความ", 1000) }
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
    new EmbedBuilder().setColor(action.color).setTitle(action.title).setDescription(action.desc).setTimestamp()
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

// ==================================================
// LOGIN
// ==================================================
if (!TOKEN) {
  console.error("❌ ไม่พบ TOKEN ในไฟล์ .env");
  process.exit(1);
}

ensureJsonFile(PRODUCTS_FILE);
ensureJsonFile(ORDERS_FILE);
normalizeAllProducts();
client.login(TOKEN);
