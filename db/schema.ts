import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  date,
  customType,
} from "drizzle-orm/pg-core";

// ─────────────────────────────────────────────────────────────
// VECTOR TYPE (AI RAG Embeddings için pgvector eklentisi)
// ─────────────────────────────────────────────────────────────
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// ─────────────────────────────────────────────────────────────
// ENUMS (PostgreSQL Enum Tipleri)
// ─────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusEnum = pgEnum("status", ["draft", "active", "archived"]);
export const ruleTypeEnum = pgEnum("rule_type", ["requires", "excludes", "recommends"]);
export const severityEnum = pgEnum("severity", ["hard_block", "soft_warning"]);
export const conditionTypeEnum = pgEnum("condition_type", ["model", "package", "scenario"]);
export const docTypeEnum = pgEnum("doc_type", ["manual", "datasheet", "rulebook"]);
export const parsingStatusEnum = pgEnum("parsing_status", ["pending", "processing", "completed", "failed"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "converted", "lost"]);
export const offerStatusEnum = pgEnum("offer_status", ["draft", "sent", "accepted", "rejected", "expired"]);
export const productionStatusEnum = pgEnum("production_status", ["pending", "chassis", "insulation", "furniture", "systems", "testing", "completed"]);
export const publishStatusEnum = pgEnum("publish_status", ["draft", "published", "rolled_back"]);
export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete"]);

// ─────────────────────────────────────────────────────────────
// 1. AUTH / USERS
// ─────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  openId: text("open_id").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("login_method"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// 2. ENGINEERING CORE
// ─────────────────────────────────────────────────────────────
export const models = pgTable(
  "models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    baseWeightKg: numeric("base_weight_kg", { precision: 7, scale: 2 }).notNull(),
    maxPayloadKg: numeric("max_payload_kg", { precision: 7, scale: 2 }).notNull(),
    wheelbaseMm: integer("wheelbase_mm").notNull(),
    roofLengthMm: integer("roof_length_mm"),
    roofWidthMm: integer("roof_width_mm"),
    status: statusEnum("status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_models_status").on(table.status)]
);

export const packages = pgTable(
  "packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    modelId: uuid("model_id").references(() => models.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    tierLevel: integer("tier_level").default(0),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("idx_packages_model_id").on(table.modelId)]
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentId: uuid("parent_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    icon: text("icon").default("folder"),
    status: statusEnum("status").default("draft").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idx_categories_parent_id").on(table.parentId)]
);

export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  densityKgM3: numeric("density_kg_m3", { precision: 7, scale: 2 }),
  isLightweight: boolean("is_lightweight").notNull().default(true),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),

    materialId: uuid("material_id").references(() => materials.id, {
      onDelete: "set null",
    }),

    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    sku: text("sku").notNull().unique(),

    shortDescription: text("short_description"),
    description: text("description"),

    weightKg: numeric("weight_kg", { precision: 10, scale: 3 })
      .notNull()
      .default("0.000"),

    powerDrawWatts: numeric("power_draw_watts", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),

    powerSupplyWatts: numeric("power_supply_watts", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),

    imageUrl: text("image_url"),
    datasheetUrl: text("datasheet_url"),

    basePrice: numeric("base_price", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),

    status: statusEnum("status").default("draft").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_products_category_id").on(table.categoryId),
    index("idx_products_status").on(table.status),
    index("idx_products_name").on(table.name),
    uniqueIndex("uq_products_slug").on(table.slug),
    uniqueIndex("uq_products_sku").on(table.sku),
  ]
);

export const productDocuments = pgTable(
  "product_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    type: text("type").notNull(),

    title: text("title").notNull(),

    url: text("url").notNull(),

    note: text("note"),

    sortOrder: integer("sort_order").notNull().default(0),

    status: statusEnum("status").default("active").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_product_documents_product_id").on(table.productId),
    index("idx_product_documents_status").on(table.status),
    index("idx_product_documents_type").on(table.type),
    uniqueIndex("uq_product_documents_product_type_url").on(
      table.productId,
      table.type,
      table.url
    ),
  ]
);

// ─────────────────────────────────────────────────────────────
// 3. RULE ENGINE (AI & Uyumluluk Fiziği)
// ─────────────────────────────────────────────────────────────
export const compatibilityRules = pgTable(
  "compatibility_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceProductId: uuid("source_product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    targetProductId: uuid("target_product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    ruleType: ruleTypeEnum("rule_type").notNull(),
    severity: severityEnum("severity").notNull(),
    priority: integer("priority").notNull().default(10),
    message: text("message"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_compat_rule").on(table.sourceProductId, table.targetProductId, table.ruleType),
  ]
);

export const productSpecs = pgTable("product_specs", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  specKey: text("spec_key").notNull(),
  specValue: numeric("spec_value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit"),
});

export const ruleConditions = pgTable("rule_conditions", {
  id: uuid("id").defaultRandom().primaryKey(),
  ruleId: uuid("rule_id")
    .notNull()
    .references(() => compatibilityRules.id, { onDelete: "cascade" }),
  conditionType: conditionTypeEnum("condition_type").notNull(),
  targetId: text("target_id").notNull(),
});



export const ruleTemplates = pgTable(
  "rule_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    sourceHint: text("source_hint"),
    targetHint: text("target_hint"),
    defaultRuleType: ruleTypeEnum("default_rule_type").notNull(),
    defaultSeverity: severityEnum("default_severity").notNull(),
    defaultPriority: integer("default_priority").notNull().default(10),
    defaultMessage: text("default_message").notNull(),
    status: statusEnum("status").default("draft").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_rule_templates_status").on(table.status),
    index("idx_rule_templates_sort_order").on(table.sortOrder),
    uniqueIndex("uq_rule_templates_slug").on(table.slug),
  ]
);

export const scenarioMappings = pgTable(
  "scenario_mappings",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    scenarioSlug: text("scenario_slug").notNull(),
    suitabilityScore: integer("suitability_score").notNull(),
  },
  (table) => [uniqueIndex("pk_scenario_mappings").on(table.productId, table.scenarioSlug)]
);

// ─────────────────────────────────────────────────────────────
// 4. CONFIGURATOR & BUILDS
// ─────────────────────────────────────────────────────────────
export const builds = pgTable("builds", {
  id: uuid("id").defaultRandom().primaryKey(),
  shortCode: text("short_code").notNull().unique(),
  userId: uuid("user_id"),
  sessionId: text("session_id").notNull(),
  modelId: uuid("model_id")
    .notNull()
    .references(() => models.id, { onDelete: "restrict" }),
  currentVersionId: uuid("current_version_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const buildVersions = pgTable(
  "build_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    buildId: uuid("build_id").references(() => builds.id),
    packageId: uuid("package_id").references(() => packages.id),
    versionNumber: integer("version_number").notNull(),
    totalWeightKg: text("total_weight_kg"),
    totalPrice: text("total_price"),
    stateSnapshot: jsonb("state_snapshot"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("uq_build_version").on(table.buildId, table.versionNumber)]
);

export const buildSelectedProducts = pgTable(
  "build_selected_products",
  {
    buildVersionId: uuid("build_version_id")
      .notNull()
      .references(() => buildVersions.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    isUserOverridden: boolean("is_user_overridden").notNull().default(false),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [uniqueIndex("pk_build_sel_prod").on(table.buildVersionId, table.productId)]
);

// ─────────────────────────────────────────────────────────────
// 5. AI LAYER (RAG Knowledge & Vector Embeddings)
// ─────────────────────────────────────────────────────────────
export const aiKnowledgeDocuments = pgTable("ai_knowledge_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  docType: docTypeEnum("doc_type").notNull(),
  s3Key: text("s3_key").notNull(),
  parsingStatus: parsingStatusEnum("parsing_status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiDocumentChunks = pgTable("ai_document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => aiKnowledgeDocuments.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  contentText: text("content_text").notNull(),
  pageNumber: integer("page_number"),
  tokenCount: integer("token_count").notNull().default(0),
});

export const aiEmbeddings = pgTable("ai_embeddings", {
  chunkId: uuid("chunk_id")
    .primaryKey()
    .references(() => aiDocumentChunks.id, { onDelete: "cascade" }),
  modelVersion: text("model_version").notNull(),
});

// ─────────────────────────────────────────────────────────────
// 6. CONTENT / SEO / MULTILINGUAL
// ─────────────────────────────────────────────────────────────
export const localizedContent = pgTable(
  "localized_content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    slug: text("slug"),
    description: text("description"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    contentJson: jsonb("content_json"),
  },
  (table) => [
    uniqueIndex("uq_loc_content_entity_locale").on(
      table.entityType,
      table.entityId,
      table.locale
    ),
  ]
);

// ─────────────────────────────────────────────────────────────
// 7. 2.5D / HOTSPOT SYSTEM
// ─────────────────────────────────────────────────────────────
export const visualAssets2d = pgTable("visual_assets_2d", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  modelId: uuid("model_id")
    .notNull()
    .references(() => models.id, { onDelete: "cascade" }),
  cameraView: text("camera_view").notNull(),
  zIndexLayer: integer("z_index_layer").notNull(),
  assetUrl: text("asset_url").notNull(),
  fallbackUrl: text("fallback_url"),
});

export const hotspotMappings = pgTable("hotspot_mappings", {
  id: uuid("id").defaultRandom().primaryKey(),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => visualAssets2d.id, { onDelete: "cascade" }),
  targetProductId: uuid("target_product_id").references(() => products.id, {
    onDelete: "cascade",
  }),
  coordXPercent: numeric("coord_x_percent", { precision: 5, scale: 2 }).notNull(),
  coordYPercent: numeric("coord_y_percent", { precision: 5, scale: 2 }).notNull(),
  actionType: text("action_type").notNull().default("tooltip"),
});

// ─────────────────────────────────────────────────────────────
// 8. CRM / SALES / PRODUCTION
// ─────────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  buildVersionId: uuid("build_version_id")
    .notNull()
    .references(() => buildVersions.id, { onDelete: "restrict" }),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(false),
  status: leadStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  offerReference: text("offer_reference").notNull().unique(),
  validUntil: timestamp("valid_until").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: offerStatusEnum("status").default("sent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  offerId: uuid("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "restrict" }),
  productionStatus: productionStatusEnum("production_status").default("pending").notNull(),
  estimatedDeliveryDate: date("estimated_delivery_date"),
  vinNumber: text("vin_number").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productionUpdates = pgTable("production_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─────────────────────────────────────────────────────────────
// 9. ADMIN / VERSIONING
// ─────────────────────────────────────────────────────────────
export const publishRevisions = pgTable("publish_revisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  revisionName: text("revision_name").notNull(),
  publishedBy: uuid("published_by").notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  status: publishStatusEnum("status").default("draft").notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  adminUserId: uuid("admin_user_id").notNull(),
  action: auditActionEnum("action").notNull(),
  previousState: jsonb("previous_state"),
  newState: jsonb("new_state"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});