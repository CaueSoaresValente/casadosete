"use client";

import { useState, useEffect, useMemo } from "react";
import { ShoppingBag, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCart, type BoxCustomization } from "@/contexts/CartContext";
import { toast } from "react-toastify";

// ─── Types ────────────────────────────────────────────────────────────────────

type Orixa = { id: string; name: string; colorHex: string };

type BoxItem = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  maxQuantity: number | null;
};

type BoxImageOption = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
};

type ObjectOption = { id: string; name: string; price: string };

type BoxConfig = {
  minItems: number | null;
  basePrice: string;
  boxImageUrl: string | null;
};

type BoxData = {
  config: BoxConfig | null;
  orixas: Orixa[];
  items: BoxItem[];
  objectOptions: ObjectOption[];
  imageOptions: BoxImageOption[];
};

// ─── Quantity stepper ─────────────────────────────────────────────────────────

function QuantityStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center border border-night-200 rounded-lg overflow-hidden">
      <button
        type="button"
        className="px-2 py-1 text-night-500 hover:text-night-800 disabled:opacity-40"
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value <= 0}
      >
        −
      </button>
      <span className="px-3 text-sm font-medium text-night-800 min-w-[2rem] text-center">
        {value}
      </span>
      <button
        type="button"
        className="px-2 py-1 text-night-500 hover:text-night-800 disabled:opacity-40"
        onClick={() => onChange(max != null ? Math.min(max, value + 1) : value + 1)}
        disabled={max != null && value >= max}
      >
        +
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BoxAssembler({
  productId,
  productName,
  productSlug,
  productImageUrl,
}: {
  productId: string;
  productName: string;
  productSlug: string;
  productImageUrl: string | null;
}) {
  const { addItem } = useCart();

  const [data, setData] = useState<BoxData | null>(null);
  const [loading, setLoading] = useState(true);

  // Selections
  const [primaryOrixa, setPrimaryOrixa] = useState<Orixa | null>(null);
  const [primaryImage, setPrimaryImage] = useState<BoxImageOption | null>(null);

  // Imagem secundária
  const [secondaryOrixa, setSecondaryOrixa] = useState<Orixa | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<BoxImageOption | null>(null);

  const [itemQtys, setItemQtys] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<ObjectOption | null>(null);
  const [note, setNote] = useState("");

  // UI accordion state
  const [showItems, setShowItems] = useState(true);
  const [showOptions, setShowOptions] = useState(true);

  // Fetch box data
  useEffect(() => {
    fetch("/api/public/box")
      .then((r) => r.json())
      .then((d: BoxData) => {
        setData(d);
        // init quantities to 0
        const init: Record<string, number> = {};
        for (const item of d.items) {
          init[item.id] = 0;
        }
        setItemQtys(init);
      })
      .catch(() => toast.error("Erro ao carregar dados da box."))
      .finally(() => setLoading(false));
  }, []);

  // ─── Price rule (Soma direta, sem caixa completa) ─────────────────────────────
  const total = useMemo(() => {
    if (!data) return 0;

    let sum = 0;

    // Itens da box
    for (const item of data.items) {
      const qty = itemQtys[item.id] ?? 0;
      if (qty > 0) {
        sum += parseFloat(item.price) * qty;
      }
    }

    // Imagem principal
    if (primaryImage) {
      sum += parseFloat(primaryImage.price);
    }

    // Imagem secundária (somente se material e entidade selecionados)
    if (secondaryImage && secondaryOrixa) {
      sum += parseFloat(secondaryImage.price);
    }

    // Opção de objeto
    if (selectedOption) {
      sum += parseFloat(selectedOption.price);
    }

    return sum;
  }, [data, itemQtys, primaryImage, secondaryImage, secondaryOrixa, selectedOption]);

  // ─── Validation ─────────────────────────────────────────────────────────────
  const hasItems = Object.values(itemQtys).some((q) => q > 0);
  const canAdd = !!primaryOrixa && hasItems;

  // ─── Add to cart ─────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    if (!primaryOrixa || !data) return;

    const chosenItems = data.items
      .filter((i) => (itemQtys[i.id] ?? 0) > 0)
      .map((i) => ({
        id: i.id,
        name: i.name,
        price: parseFloat(i.price),
        quantity: itemQtys[i.id]!,
      }));

    const customization: BoxCustomization = {
      primaryOrixa,
      primaryImage: primaryImage
        ? {
            id: primaryImage.id,
            material: primaryImage.name,
            name: `${primaryImage.name} de ${primaryOrixa.name}`,
            price: parseFloat(primaryImage.price),
          }
        : undefined,
      secondaryImage:
        secondaryImage && secondaryOrixa
          ? {
              orixa: secondaryOrixa,
              id: secondaryImage.id,
              material: secondaryImage.name,
              name: `${secondaryImage.name} de ${secondaryOrixa.name}`,
              price: parseFloat(secondaryImage.price),
            }
          : undefined,
      items: chosenItems,
      objectOption: selectedOption
        ? {
            id: selectedOption.id,
            name: selectedOption.name,
            price: parseFloat(selectedOption.price),
          }
        : undefined,
      note: note.trim() || undefined,
      total,
    };

    addItem({
      productId,
      variantId: null,
      name: productName,
      variantName: null,
      slug: productSlug,
      price: total,
      imageUrl: productImageUrl,
      stock: 99,
      isBackorder: false,
      boxCustomization: customization,
    });
  };

  // ─── Loading / error ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-8 text-center text-night-400 text-sm">
        Carregando montador de box…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-8 text-center text-ruby-500 text-sm">
        Não foi possível carregar o montador. Tente recarregar a página.
      </div>
    );
  }

  // Prévia da caixa: tint e sombra com orixá principal e/ou secundário
  const boxImageUrl = data.config?.boxImageUrl;
  const primaryColor = primaryOrixa?.colorHex;
  const secondaryColor =
    secondaryImage && secondaryOrixa ? secondaryOrixa.colorHex : null;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Box preview */}
      {boxImageUrl && (
        <div className="relative flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={boxImageUrl}
            alt="Box axe"
            className="w-40 h-40 object-contain rounded-xl"
            style={
              primaryColor
                ? {
                    filter: secondaryColor
                      ? `drop-shadow(-8px 0 16px ${primaryColor}99) drop-shadow(8px 0 16px ${secondaryColor}99)`
                      : `drop-shadow(0 0 18px ${primaryColor}99)`,
                  }
                : undefined
            }
          />
          {primaryColor && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none mix-blend-color"
              style={{
                background: secondaryColor
                  ? `linear-gradient(135deg, ${primaryColor}66 0%, ${secondaryColor}66 100%)`
                  : primaryColor + "66",
              }}
            />
          )}
        </div>
      )}

      {/* 1. Orixá principal */}
      <div>
        <label className="block text-sm font-semibold text-night-700 mb-2">
          Orixá principal <span className="text-ruby-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {data.orixas.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setPrimaryOrixa(o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                primaryOrixa?.id === o.id
                  ? "border-gold-500 bg-gold-50 text-gold-800 shadow-sm"
                  : "border-night-200 text-night-600 hover:border-gold-300 hover:bg-gold-50"
              }`}
            >
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0 border border-white shadow-sm"
                style={{ backgroundColor: o.colorHex }}
              />
              {o.name}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Imagem principal (opcional) */}
      {data.imageOptions.length > 0 && (
        <div className="bg-cream-50/60 border border-border-light rounded-xl p-3.5 space-y-2.5">
          <label className="block text-sm font-semibold text-night-700">
            Imagem principal{" "}
            <span className="text-night-400 font-normal">(opcional)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPrimaryImage(null)}
              className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs transition-all ${
                primaryImage === null
                  ? "border-gold-500 bg-gold-50/70 text-gold-900 font-medium shadow-xs"
                  : "border-night-200 bg-white text-night-600 hover:border-night-300"
              }`}
            >
              <div className="w-8 h-8 rounded bg-night-100 flex items-center justify-center text-night-400 shrink-0">
                <span className="text-sm">✕</span>
              </div>
              <span className="flex-1">Nenhuma imagem</span>
            </button>

            {data.imageOptions.map((opt) => {
              const displayName = primaryOrixa
                ? `${opt.name} de ${primaryOrixa.name}`
                : opt.name;
              const isSelected = primaryImage?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPrimaryImage(opt)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs transition-all ${
                    isSelected
                      ? "border-gold-500 bg-gold-50/70 text-gold-900 font-medium shadow-xs"
                      : "border-night-200 bg-white text-night-700 hover:border-gold-300 hover:bg-gold-50/40"
                  }`}
                >
                  {opt.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={opt.imageUrl}
                      alt={opt.name}
                      className="w-8 h-8 rounded object-cover border border-night-200 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-cream-100 flex items-center justify-center text-gold-600 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="block truncate font-medium">
                      {displayName}
                    </span>
                    <span className="text-[11px] text-night-400">
                      +{formatPrice(parseFloat(opt.price) * 100)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Imagem secundária (opcional) */}
      <div className="border border-border-light rounded-xl p-3.5 space-y-3 bg-cream-50/40">
        <div>
          <label className="block text-sm font-semibold text-night-700">
            Imagem secundária{" "}
            <span className="text-night-400 font-normal">(opcional)</span>
          </label>
          <p className="text-xs text-night-400 mt-0.5">
            Deseja incluir uma segunda imagem na sua box? Escolha a entidade e o material.
          </p>
        </div>

        {/* Pergunta (a): Entidade da imagem secundária */}
        <div className="space-y-1.5">
          <span className="block text-xs font-medium text-night-600">
            (a) De qual entidade é essa imagem?
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSecondaryOrixa(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                secondaryOrixa === null
                  ? "border-night-400 bg-night-100 text-night-700"
                  : "border-night-200 text-night-400 hover:border-night-300"
              }`}
            >
              Nenhuma
            </button>
            {data.orixas.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSecondaryOrixa(o)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  secondaryOrixa?.id === o.id
                    ? "border-gold-500 bg-gold-50 text-gold-800 shadow-xs"
                    : "border-night-200 text-night-600 hover:border-gold-300 hover:bg-gold-50"
                }`}
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full shrink-0 border border-white shadow-xs"
                  style={{ backgroundColor: o.colorHex }}
                />
                {o.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pergunta (b): Material da imagem secundária */}
        {data.imageOptions.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-border-light">
            <span className="block text-xs font-medium text-night-600">
              (b) Material da imagem
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSecondaryImage(null)}
                className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs transition-all ${
                  secondaryImage === null
                    ? "border-gold-500 bg-gold-50/70 text-gold-900 font-medium shadow-xs"
                    : "border-night-200 bg-white text-night-600 hover:border-night-300"
                }`}
              >
                <div className="w-8 h-8 rounded bg-night-100 flex items-center justify-center text-night-400 shrink-0">
                  <span className="text-sm">✕</span>
                </div>
                <span className="flex-1">Nenhuma imagem</span>
              </button>

              {data.imageOptions.map((opt) => {
                const displayName = secondaryOrixa
                  ? `${opt.name} de ${secondaryOrixa.name}`
                  : opt.name;
                const isSelected = secondaryImage?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSecondaryImage(opt)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? "border-gold-500 bg-gold-50/70 text-gold-900 font-medium shadow-xs"
                        : "border-night-200 bg-white text-night-700 hover:border-gold-300 hover:bg-gold-50/40"
                    }`}
                  >
                    {opt.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={opt.imageUrl}
                        alt={opt.name}
                        className="w-8 h-8 rounded object-cover border border-night-200 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-cream-100 flex items-center justify-center text-gold-600 shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="block truncate font-medium">
                        {displayName}
                      </span>
                      <span className="text-[11px] text-night-400">
                        +{formatPrice(parseFloat(opt.price) * 100)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Itens da box */}
      <div className="border border-border-light rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowItems((s) => !s)}
          className="w-full flex items-center justify-between px-4 py-3 bg-cream-50 text-sm font-semibold text-night-700 hover:bg-cream-100 transition-colors"
        >
          <span>Itens da box <span className="text-ruby-500">*</span></span>
          {showItems ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {showItems && (
          <div className="divide-y divide-border-light">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                {item.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-cream-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-night-800 block truncate">
                    {item.name}
                  </span>
                  <span className="text-xs text-night-400">
                    {formatPrice(parseFloat(item.price) * 100)}
                  </span>
                </div>
                <QuantityStepper
                  value={itemQtys[item.id] ?? 0}
                  max={item.maxQuantity}
                  onChange={(v) =>
                    setItemQtys((prev) => ({ ...prev, [item.id]: v }))
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Opções de objeto */}
      {data.objectOptions.length > 0 && (
        <div className="border border-border-light rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptions((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3 bg-cream-50 text-sm font-semibold text-night-700 hover:bg-cream-100 transition-colors"
          >
            <span>
              Opção de objeto{" "}
              <span className="text-night-400 font-normal">(opcional)</span>
            </span>
            {showOptions ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {showOptions && (
            <div className="divide-y divide-border-light">
              <div className="flex items-center gap-3 px-4 py-3">
                <input
                  id="option-none"
                  type="radio"
                  name="objectOption"
                  checked={selectedOption === null}
                  onChange={() => setSelectedOption(null)}
                  className="accent-gold-500"
                />
                <label
                  htmlFor="option-none"
                  className="text-sm text-night-500 cursor-pointer"
                >
                  Nenhum objeto
                </label>
              </div>
              {data.objectOptions.map((opt) => (
                <div key={opt.id} className="flex items-center gap-3 px-4 py-3">
                  <input
                    id={`option-${opt.id}`}
                    type="radio"
                    name="objectOption"
                    checked={selectedOption?.id === opt.id}
                    onChange={() => setSelectedOption(opt)}
                    className="accent-gold-500"
                  />
                  <label
                    htmlFor={`option-${opt.id}`}
                    className="flex-1 text-sm text-night-700 cursor-pointer"
                  >
                    {opt.name}
                  </label>
                  <span className="text-xs text-night-400">
                    +{formatPrice(parseFloat(opt.price) * 100)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Observação */}
      <div>
        <label
          htmlFor="box-note"
          className="block text-sm font-semibold text-night-700 mb-1"
        >
          Observação{" "}
          <span className="text-night-400 font-normal">(opcional)</span>
        </label>
        <textarea
          id="box-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Alguma observação especial para sua box?"
          className="w-full border border-border-light rounded-lg px-3 py-2 text-sm text-night-700 placeholder:text-night-300 focus:outline-none focus:ring-1 focus:ring-gold-400 resize-none"
        />
      </div>

      {/* 7. Total + Botão */}
      <div className="border-t border-border-light pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-night-600">Total estimado</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-night-900">
              {formatPrice(total * 100)}
            </span>
          </div>
        </div>

        {!primaryOrixa && (
          <p className="text-xs text-ruby-500">
            ⚠ Escolha um Orixá principal para continuar.
          </p>
        )}
        {primaryOrixa && !hasItems && (
          <p className="text-xs text-ruby-500">
            ⚠ Selecione ao menos um item da box.
          </p>
        )}

        <button
          type="button"
          disabled={!canAdd}
          onClick={handleAddToCart}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-gold hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: "var(--color-gold-500)" }}
        >
          <ShoppingBag className="w-4 h-4" />
          Adicionar box ao carrinho
        </button>
      </div>
    </div>
  );
}
