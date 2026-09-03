export const serviceCategories = [
  { slug: "auto-moto", label: "Auto-moto" }, { slug: "cestovani", label: "Cestování" },
  { slug: "chemie", label: "Chemie" }, { slug: "elektricke-spotrebice", label: "Elektrické spotřebiče" },
  { slug: "doprava", label: "Doprava" }, { slug: "drevo", label: "Dřevo" },
  { slug: "elektronika", label: "Elektronika" }, { slug: "it-telekomunikace", label: "IT, telekomunikace" },
  { slug: "nabytek", label: "Nábytek" }, { slug: "odevy-a-obuv", label: "Oděvy a obuv" },
  { slug: "papir-a-kancelar", label: "Papír a kancelář" }, { slug: "plasty", label: "Plasty" },
  { slug: "poradenstvi", label: "Poradenství" }, { slug: "potravinarstvi", label: "Potravinářství" },
  { slug: "prumysl", label: "Průmysl" }, { slug: "reality", label: "Reality" },
  { slug: "reklama", label: "Reklama" }, { slug: "sklo", label: "Sklo" },
  { slug: "sluzby", label: "Služby" }, { slug: "sport", label: "Sport" },
  { slug: "stavebni-material", label: "Stavební materiál" }, { slug: "stavebnictvi", label: "Stavebnictví" },
  { slug: "stroje", label: "Stroje" }, { slug: "strojirenstvi", label: "Strojírenství" },
  { slug: "textil", label: "Textil" }, { slug: "tisk", label: "Tisk" },
  { slug: "vyrobky", label: "Výrobky" }, { slug: "zdravotnictvi", label: "Zdravotnictví" },
  { slug: "zemedelstvi", label: "Zemědělství" },
] as const;

export type ServiceCategorySlug = (typeof serviceCategories)[number]["slug"];

export const serviceCategoriesBySlug = new Map(serviceCategories.map((category) => [category.slug, category]));
