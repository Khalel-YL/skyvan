import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  manufacturerSourceRegistries,
  products,
  statusEnum,
} from "@/db/schema";

export const productSourceBindings = pgTable(
  "product_source_bindings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    manufacturerSourceRegistryId: uuid("manufacturer_source_registry_id")
      .notNull()
      .references(() => manufacturerSourceRegistries.id, {
        onDelete: "restrict",
      }),
    pathHint: text("path_hint").notNull().default(""),
    bindingNotes: text("binding_notes"),
    priority: integer("priority").notNull().default(100),
    status: statusEnum("status").default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_product_source_bindings_product_id").on(table.productId),
    index("idx_product_source_bindings_source_id").on(
      table.manufacturerSourceRegistryId,
    ),
    index("idx_product_source_bindings_status").on(table.status),
    index("idx_product_source_bindings_priority").on(table.priority),
    uniqueIndex("uq_product_source_bindings_product_source_path").on(
      table.productId,
      table.manufacturerSourceRegistryId,
      table.pathHint,
    ),
  ],
);