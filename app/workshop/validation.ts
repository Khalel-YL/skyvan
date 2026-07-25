import { validate as validateUuid } from "uuid";

export type WorkshopBuildCartItemInput = {
  productId: string;
  quantity: number;
};

export type SaveEngineeringBuildInput = {
  vehicleId: string;
  cart: WorkshopBuildCartItemInput[];
};

export type NormalizedWorkshopBuildCartItem = {
  productId: string;
  quantity: number;
};

export type ParsedWorkshopBuildInput = {
  vehicleId: string;
  cart: NormalizedWorkshopBuildCartItem[];
  productIds: string[];
};

type WorkshopBuildValidationResult =
  | { ok: true; input: ParsedWorkshopBuildInput }
  | { ok: false; error: string };

const MAX_ITEM_QUANTITY = 100;
const MAX_DISTINCT_PRODUCTS = 100;
const MAX_TOTAL_QUANTITY = 500;
const MAX_RAW_CART_ROWS = 500;

function isUuid(value: string) {
  return validateUuid(value);
}

function normalizeQuantity(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return null;
  }

  return value;
}

export function parseSaveEngineeringBuildInput(
  data: SaveEngineeringBuildInput,
): WorkshopBuildValidationResult {
  const submittedVehicleId = String(data?.vehicleId ?? "").trim();

  if (!submittedVehicleId || !isUuid(submittedVehicleId)) {
    return {
      ok: false,
      error: "Geçersiz araç modeli bilgisi.",
    };
  }

  const vehicleId = submittedVehicleId.toLowerCase();

  if (!Array.isArray(data?.cart)) {
    return {
      ok: false,
      error: "Geçersiz ürün seçimi.",
    };
  }

  if (data.cart.length > MAX_RAW_CART_ROWS) {
    return {
      ok: false,
      error: "Bir projede toplam ürün miktarı 500 değerini aşamaz.",
    };
  }

  const quantitiesByProductId = new Map<string, number>();
  let totalQuantity = 0;

  for (const item of data.cart) {
    const submittedProductId = String(item?.productId ?? "").trim();
    const quantity = normalizeQuantity(item?.quantity);

    if (!submittedProductId || !isUuid(submittedProductId) || quantity === null) {
      return {
        ok: false,
        error: "Geçersiz ürün seçimi.",
      };
    }

    const productId = submittedProductId.toLowerCase();

    if (quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      return {
        ok: false,
        error: "Ürün miktarı 1 ile 100 arasında olmalıdır.",
      };
    }

    const mergedQuantity = (quantitiesByProductId.get(productId) ?? 0) + quantity;
    quantitiesByProductId.set(productId, mergedQuantity);
    totalQuantity += quantity;

    if (quantitiesByProductId.size > MAX_DISTINCT_PRODUCTS) {
      return {
        ok: false,
        error: "Bir projede en fazla 100 farklı ürün seçilebilir.",
      };
    }

    if (mergedQuantity > MAX_ITEM_QUANTITY) {
      return {
        ok: false,
        error: "Bir ürün için toplam miktar 100 değerini aşamaz.",
      };
    }

    if (totalQuantity > MAX_TOTAL_QUANTITY) {
      return {
        ok: false,
        error: "Bir projede toplam ürün miktarı 500 değerini aşamaz.",
      };
    }
  }

  const cart = Array.from(quantitiesByProductId.entries()).map(
    ([productId, quantity]) => ({
      productId,
      quantity,
    }),
  );

  return {
    ok: true,
    input: {
      vehicleId,
      cart,
      productIds: cart.map((item) => item.productId),
    },
  };
}
