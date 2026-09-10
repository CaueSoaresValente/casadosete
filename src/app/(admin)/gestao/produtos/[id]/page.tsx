"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  ImageIcon,
  Star,
  PackageCheck,
  AlertTriangle,
} from "lucide-react";
import { slugify } from "@/lib/utils";
import { toast } from "react-toastify";

type Category = {
  id: string;
  name: string;
  children?: Category[];
};

type VariantForm = {
  sku: string;
  name: string;
  attributes: Record<string, string>;
  price: string;
  stock: number;
  weight: string;
  isActive: boolean;
};

type ImageForm = {
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

const emptyVariant: VariantForm = {
  sku: "",
  name: "",
  attributes: {},
  price: "",
  stock: 0,
  weight: "",
  isActive: true,
};

const emptyImage: ImageForm = {
  url: "",
  altText: "",
  sortOrder: 0,
  isPrimary: false,
};

export default function ProductFormPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const isNew = productId === "novo";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [stock, setStock] = useState(0);
  const [stockUnit, setStockUnit] = useState<"unit" | "kg">("unit");
  const [lowStockThreshold, setLowStockThreshold] = useState(2);
  const [orixa, setOrixa] = useState("");
  const [entidade, setEntidade] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [images, setImages] = useState<ImageForm[]>([]);

  useEffect(() => {
    paramsPromise.then((p) => setProductId(p.id));
  }, [paramsPromise]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) setCategories(await res.json());
    } catch {
      console.error("Failed to fetch categories");
    }
  }, []);

  const fetchProduct = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      if (res.ok) {
        const p = await res.json();
        setName(p.name);
        setSlug(p.slug);
        setDescription(p.description || "");
        setShortDescription(p.shortDescription || "");
        setBasePrice(p.basePrice?.toString() || "");
        setCompareAtPrice(p.compareAtPrice?.toString() || "");
        setCostPrice(p.costPrice?.toString() || "");
        setMetaTitle(p.metaTitle || "");
        setMetaDescription(p.metaDescription || "");
        setIsActive(p.isActive);
        setIsFeatured(p.isFeatured);
        setStock(p.stock ?? 0);
        setStockUnit(p.stockUnit || "unit");
        setLowStockThreshold(p.lowStockThreshold ?? 2);
        setOrixa(p.orixa || "");
        setEntidade(p.entidade || "");
        setFinalidade(p.finalidade || "");
        setSelectedCategories(p.categories.map((c: { category: { id: string } }) => c.category.id));
        setVariants(
          p.variants.map((v: { sku: string; name: string; attributes: Record<string, string>; price: string | null; stock: number; weight: string | null; isActive: boolean }) => ({
            sku: v.sku,
            name: v.name,
            attributes: v.attributes || {},
            price: v.price?.toString() || "",
            stock: v.stock,
            weight: v.weight?.toString() || "",
            isActive: v.isActive,
          }))
        );
        setImages(
          p.images.map((img: { url: string; altText: string | null; sortOrder: number; isPrimary: boolean }) => ({
            url: img.url,
            altText: img.altText || "",
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          }))
        );
      }
    } catch {
      console.error("Failed to fetch product");
    }
  }, []);

  useEffect(() => {
    if (!productId) return;
    
    const init = async () => {
      await fetchCategories();
      if (productId !== "novo") {
        await fetchProduct(productId);
      }
      setLoading(false);
    };
    init();
  }, [productId, fetchCategories, fetchProduct]);

  const [uploading, setUploading] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`A imagem "${file.name}" excede o limite de 5MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setImages((prev) => [
              ...prev,
              {
                url: data.url,
                altText: name || file.name.replace(/\.[^/.]+$/, ""),
                sortOrder: prev.length,
                isPrimary: prev.length === 0,
              },
            ]);
            toast.success(`Foto "${file.name}" carregada com sucesso!`);
          } else {
            toast.error("Resposta inválida do servidor ao carregar imagem.");
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || `Erro ao enviar "${file.name}".`);
        }
      }
    } catch (err) {
      console.error("Upload error", err);
      toast.error("Erro de conexão ao enviar imagem.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const addVariant = () => setVariants([...variants, { ...emptyVariant }]);
  const removeVariant = (index: number) =>
    setVariants(variants.filter((_, i) => i !== index));
  const updateVariant = (index: number, field: string, value: string | number | boolean) =>
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );

  const addImage = () => setImages([...images, { ...emptyImage, sortOrder: images.length }]);
  const removeImage = (index: number) =>
    setImages(images.filter((_, i) => i !== index));
  const updateImage = (index: number, field: string, value: string | number | boolean) =>
    setImages(
      images.map((img, i) => (i === index ? { ...img, [field]: value } : img))
    );
  const setPrimaryImage = (index: number) =>
    setImages(images.map((img, i) => ({ ...img, isPrimary: i === index })));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name,
      slug,
      description: description || null,
      shortDescription: shortDescription || null,
      basePrice: parseFloat(basePrice),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      costPrice: costPrice ? parseFloat(costPrice) : null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      isActive,
      isFeatured,
      stock,
      stockUnit,
      lowStockThreshold,
      orixa: orixa || null,
      entidade: entidade || null,
      finalidade: finalidade || null,
      categoryIds: selectedCategories,
      variants: variants.map((v) => ({
        sku: v.sku,
        name: v.name,
        attributes: v.attributes,
        price: v.price ? parseFloat(v.price) : null,
        stock: v.stock,
        weight: v.weight ? parseFloat(v.weight) : null,
        isActive: v.isActive,
      })),
      images: (() => {
        const validImages = images.filter((img) => img && typeof img.url === "string" && img.url.trim());
        const hasPrimary = validImages.some((img) => img.isPrimary);
        return validImages.map((img, idx) => ({
          url: img.url.trim(),
          altText: img.altText?.trim() || null,
          sortOrder: typeof img.sortOrder === "number" ? img.sortOrder : idx,
          isPrimary: hasPrimary ? !!img.isPrimary : idx === 0,
        }));
      })(),
    };

    try {
      const url = isNew
        ? "/api/admin/products"
        : `/api/admin/products/${productId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        const msg = data.error || "Erro ao salvar produto";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(
        isNew
          ? `Produto "${payload.name}" cadastrado com sucesso!`
          : `Produto "${payload.name}" atualizado com sucesso!`
      );
      router.push("/gestao/produtos");
    } catch {
      setError("Erro de conexão");
      toast.error("Erro de conexão ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  // Flatten categories for checkbox list
  const flatCats: { id: string; name: string; depth: number }[] = [];
  const flatten = (cats: Category[], depth = 0) => {
    for (const cat of cats) {
      flatCats.push({ id: cat.id, name: cat.name, depth });
      if (cat.children) flatten(cat.children, depth + 1);
    }
  };
  flatten(categories);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push("/gestao/produtos")}
          className="p-2 rounded-lg hover:bg-night-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-night-600" />
        </button>
        <div>
          <h1
            className="text-2xl font-bold text-night-900"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {isNew ? "Novo produto" : "Editar produto"}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-ruby-50 border border-ruby-200 text-ruby-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <section className="bg-white rounded-xl border border-night-100 p-5">
          <h2 className="text-base font-semibold text-night-800 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Informações básicas
          </h2>
          <p className="text-xs text-night-400 mb-4">
            Dados principais do produto que aparecem na loja para os clientes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-night-700 mb-1">Nome do produto *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Vela 7 Dias Branca, Saia de Iansã, Guia de Ogum..."
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                required
              />
              <p className="text-xs text-night-400 mt-1">
                💡 O nome comercial como ele aparecerá no cabeçalho e na busca do site.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-night-700 mb-1">Slug (Link Amigável)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm font-mono text-night-500 bg-night-50 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                required
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Slug é apenas o link do produto no site (ex: /produtos/vela-7-dias). Ele é gerado <strong>automaticamente</strong> pelo sistema ao digitar o nome do produto — você não precisa se preocupar em preencher!
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-night-700 mb-1">Descrição curta</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Ex: Vela 100% parafina pura para altares e firmeza espiritual."
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Resumo rápido de 1 frase que aparece logo abaixo do nome na página do produto.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-night-700 mb-1">Descrição completa</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Detalhes de fabricação, materiais, instruções de uso no terreiro, dimensões e cuidados..."
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Texto detalhado sobre a história, material, peso e modo de uso do item.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white rounded-xl border border-night-100 p-5">
          <h2 className="text-base font-semibold text-night-800 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Preços
          </h2>
          <p className="text-xs text-night-400 mb-4">
            Defina o preço de venda, promoções e custo do produto.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Preço base (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="Ex: 29.90"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                required
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Valor real pelo qual o cliente vai comprar.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Preço comparativo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Ex: 39.90 (Preço original)"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Preço antigo "De: R$" que ficará riscado para mostrar desconto.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Custo do item (R$)</label>
              <input
                type="number"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="Ex: 12.00 (Uso interno)"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Quanto você pagou ao fornecedor (apenas você vê, o cliente não).
              </p>
            </div>
          </div>
        </section>

        {/* Estoque */}
        <section className="bg-white rounded-xl border border-night-100 p-5">
          <h2 className="text-base font-semibold text-night-800 mb-1 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <PackageCheck className="w-4 h-4 text-gold-500" />
            Gestão de Estoque
          </h2>
          <p className="text-xs text-night-400 mb-4">
            Controle a quantidade disponível deste produto. O sistema alerta você quando o estoque estiver baixo.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Tipo de medida</label>
              <div className="flex rounded-lg border border-night-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setStockUnit("unit")}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                    stockUnit === "unit"
                      ? "bg-gold-500 text-white"
                      : "bg-white text-night-600 hover:bg-gold-50"
                  }`}
                >
                  📦 Unidade
                </button>
                <button
                  type="button"
                  onClick={() => setStockUnit("kg")}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-night-200 ${
                    stockUnit === "kg"
                      ? "bg-gold-500 text-white"
                      : "bg-white text-night-600 hover:bg-gold-50"
                  }`}
                >
                  ⚖️ Quilograma (kg)
                </button>
              </div>
              <p className="text-xs text-night-400 mt-1">
                💡 Escolha se este produto é vendido por unidade ou por peso.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">
                Estoque atual ({stockUnit === "kg" ? "kg" : "unidades"}) *
              </label>
              <input
                type="number"
                step={stockUnit === "kg" ? "0.1" : "1"}
                min="0"
                value={stock}
                onChange={(e) => setStock(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
                required
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Quantidade disponível para venda agora.
              </p>
              {stock === 0 && (
                <p className="text-xs text-ruby-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Produto será exibido como indisponível na loja.
                </p>
              )}
              {stock > 0 && stock <= lowStockThreshold && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Estoque baixo! Reposição recomendada.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">
                Alerta de estoque baixo
              </label>
              <input
                type="number"
                step={stockUnit === "kg" ? "0.5" : "1"}
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Quando o estoque atingir este número, você receberá um alerta por e-mail.
              </p>
            </div>
          </div>
        </section>

        {/* Umbanda-specific fields */}
        <section className="bg-white rounded-xl border border-night-100 p-5">
          <h2 className="text-base font-semibold text-night-800 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Classificação espiritual
          </h2>
          <p className="text-xs text-night-400 mb-4">
            Tags específicas para facilitar que o cliente encontre itens por Orixá, Entidade ou Trabalho.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Orixá</label>
              <input
                type="text"
                value={orixa}
                onChange={(e) => setOrixa(e.target.value)}
                placeholder="Ex: Ogum, Oxum, Iemanjá, Iansã"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Orixá ao qual este produto é consagrado ou dedicado.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Entidade / Linha</label>
              <input
                type="text"
                value={entidade}
                onChange={(e) => setEntidade(e.target.value)}
                placeholder="Ex: Preto Velho, Zé Pilintra, Caboclo"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Linha ou falange de trabalho espiritual relacionada ao item.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Finalidade / Uso</label>
              <input
                type="text"
                value={finalidade}
                onChange={(e) => setFinalidade(e.target.value)}
                placeholder="Ex: Proteção, Limpeza, Abertura de Caminhos"
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 Objetivo ritualístico do item para filtros de busca.
              </p>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-white rounded-xl border border-night-100 p-5">
          <h2 className="text-base font-semibold text-night-800 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Categorias da Loja
          </h2>
          <p className="text-xs text-night-400 mb-4">
            Selecione em quais seções da loja este produto deve aparecer.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {flatCats.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer text-sm py-1.5 px-2 rounded hover:bg-gold-50/50 transition-colors"
                style={{ paddingLeft: `${cat.depth * 1 + 0.5}rem` }}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-4 h-4 rounded accent-gold-500"
                />
                <span className="text-night-700 font-medium">{cat.name}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Images */}
        <section className="bg-white rounded-xl border border-night-100 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
            <h2 className="text-base font-semibold text-night-800" style={{ fontFamily: "var(--font-heading)" }}>
              Imagens do Produto
            </h2>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold-400 bg-gold-50 text-gold-700 text-xs font-semibold hover:bg-gold-100 transition-colors">
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5" />
                )}
                {uploading ? "Enviando..." : "📁 Escolher foto do computador"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={addImage}
                className="inline-flex items-center gap-1 text-xs text-night-500 hover:text-night-700 border border-night-200 px-2.5 py-1.5 rounded-lg"
              >
                <Plus className="w-3 h-3" /> Link externo
              </button>
            </div>
          </div>
          <p className="text-xs text-night-400 mb-4">
            Envie fotos do seu computador ou cole o link da imagem. Clique na estrela (⭐) para escolher a capa principal.
          </p>
          {images.length === 0 ? (
            <p className="text-sm text-night-400 text-center py-4 bg-night-50/50 rounded-lg border border-dashed border-night-200">
              Nenhuma imagem adicionada. Clique em "+ Adicionar foto" acima.
            </p>
          ) : (
            <div className="space-y-3">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg border border-night-100"
                >
                  <div className="w-16 h-16 rounded-lg bg-night-50 flex items-center justify-center shrink-0 overflow-hidden">
                    {img.url ? (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-night-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={img.url}
                      onChange={(e) => updateImage(i, "url", e.target.value)}
                      placeholder="Link da foto (ex: /assets/imgvelas.jpg ou https://...)"
                      className="w-full px-2 py-1.5 text-sm rounded border border-night-200 focus:outline-none focus:border-gold-400"
                    />
                    <input
                      type="text"
                      value={img.altText}
                      onChange={(e) => updateImage(i, "altText", e.target.value)}
                      placeholder="Descrição da imagem para leitores e Google (ex: Vela 7 Dias Vermelha)"
                      className="w-full px-2 py-1.5 text-sm rounded border border-night-200 focus:outline-none focus:border-gold-400"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(i)}
                      className={`p-1.5 rounded ${img.isPrimary ? "text-gold-500" : "text-night-300 hover:text-gold-400"}`}
                      title="Definir como foto da capa"
                    >
                      <Star className={`w-4 h-4 ${img.isPrimary ? "fill-gold-500" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="p-1.5 rounded text-night-300 hover:text-ruby-500"
                      title="Remover foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Variants */}
        <section className="bg-white rounded-xl border border-night-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-night-800" style={{ fontFamily: "var(--font-heading)" }}>
              Variações de Produto
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar variação
            </button>
          </div>
          <p className="text-xs text-night-400 mb-4">
            Cadastre modelos, cores ou tamanhos (P, M, G). Se for um produto de tamanho e modelo único, pode deixar vazio.
          </p>
          {variants.length === 0 ? (
            <p className="text-sm text-night-400 text-center py-4 bg-night-50/50 rounded-lg border border-dashed border-night-200">
              Produto sem variações (tamanho/modelo único).
            </p>
          ) : (
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-night-100 space-y-3"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-night-500 mb-1">SKU (Código) *</label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => updateVariant(i, "sku", e.target.value)}
                        placeholder="Ex: VEL-7D-BR"
                        className="w-full px-2 py-1.5 text-sm rounded border border-night-200 focus:outline-none focus:border-gold-400 font-mono"
                        required
                      />
                      <p className="text-[0.65rem] text-night-400 mt-0.5">
                        💡 Código único de estoque.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-night-500 mb-1">Nome da variação *</label>
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => updateVariant(i, "name", e.target.value)}
                        placeholder="Ex: Tamanho M, Vermelha"
                        className="w-full px-2 py-1.5 text-sm rounded border border-night-200 focus:outline-none focus:border-gold-400"
                        required
                      />
                      <p className="text-[0.65rem] text-night-400 mt-0.5">
                        💡 Tamanho, cor ou peso.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-night-500 mb-1">Preço específico (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => updateVariant(i, "price", e.target.value)}
                        placeholder="Usa Preço Base se vazio"
                        className="w-full px-2 py-1.5 text-sm rounded border border-night-200 focus:outline-none focus:border-gold-400"
                      />
                      <p className="text-[0.65rem] text-night-400 mt-0.5">
                        💡 Opcional (se preço diferir).
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-night-500 mb-1">Estoque (Qtd) *</label>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => updateVariant(i, "stock", parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm rounded border border-night-200 focus:outline-none focus:border-gold-400"
                        required
                      />
                      <p className="text-[0.65rem] text-night-400 mt-0.5">
                        💡 Unidades disponíveis.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="inline-flex items-center gap-1 text-xs text-ruby-500 hover:text-ruby-600"
                    >
                      <Trash2 className="w-3 h-3" /> Remover variação
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SEO */}
        <section className="bg-white rounded-xl border border-night-100 p-5">
          <h2 className="text-base font-semibold text-night-800 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Otimização para o Google (SEO)
          </h2>
          <p className="text-xs text-night-400 mb-4">
            Melhore o posicionamento deste produto nas pesquisas do Google (opcional).
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Meta Título (Título no Google)</label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={name || "Ex: Vela 7 Dias Branca 100% Parafina Pura | Casa do 7"}
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 O título azul que aparece nos resultados de busca do Google.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-night-700 mb-1">Meta Descrição (Resumo no Google)</label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={2}
                placeholder="Ex: Compre Velas de 7 Dias com a melhor qualidade para seu terreiro de Umbanda. Entrega rápida para todo o Brasil na Casa do 7."
                className="w-full px-3 py-2 rounded-lg border border-night-200 text-sm focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-200"
              />
              <p className="text-xs text-night-400 mt-1">
                💡 O texto explicativo cinza que aparece logo abaixo do link no Google.
              </p>
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="bg-white rounded-xl border border-night-100 p-5">
          <h2 className="text-base font-semibold text-night-800 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Visibilidade e Destaques
          </h2>
          <p className="text-xs text-night-400 mb-4">
            Controle se o produto estará publicado no site e se aparecerá na vitrine inicial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded accent-gold-500 mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-night-800 block">Produto Ativo (Publicado)</span>
                <span className="text-xs text-night-400 block">
                  Se desmarcado, o produto fica oculto na loja e não pode ser comprado pelos clientes.
                </span>
              </div>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded accent-gold-500 mt-0.5"
              />
              <div>
                <span className="text-sm font-medium text-night-800 block">Produto em Destaque</span>
                <span className="text-xs text-night-400 block">
                  Se marcado, o produto aparece na seção "Destaques" da página inicial.
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.push("/gestao/produtos")}
            className="px-4 py-2 text-sm text-night-600 border border-night-200 rounded-lg hover:bg-night-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--color-gold-500)" }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isNew ? "Criar produto" : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
