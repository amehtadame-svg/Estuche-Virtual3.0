const productImagesByName: Record<string, string> = {
  "Cuaderno cosido 100 hojas cuadriculado":
    "https://i.postimg.cc/G2MxjsGC/cuaderno-cosido-100-hojas-cuadriculado.webp",
  "Cuaderno argollado 80 hojas rayado":
    "https://i.postimg.cc/6Q5QsHy3/cuaderno-argollado-80-hojas-rayado.webp",
  "Cuaderno de dibujo 30 hojas":
    "https://i.postimg.cc/BQ049hVR/cuaderno-de-dibujo-3o-hojas.webp",
  "Lápiz negro HB No. 2": "https://i.postimg.cc/nhSyzT3L/lapiz-HB-No-27.webp",
  "Lapicero azul punta fina":
    "https://i.postimg.cc/fRyP6mMS/lapicero-azul-punta-fina.webp",
  "Corrector líquido 7 ml":
    "https://i.postimg.cc/Qt30xTZQ/corector-liquido-7-ml.webp",
  "Marcadores punta fina x12":
    "https://i.postimg.cc/G2Dtz44F/marcadores-punta-fina-x12.webp",
  "Colores largos x12": "https://i.postimg.cc/fRkwBVFk/colores-por-12.webp",
  "Temperas escolares x6":
    "https://i.postimg.cc/GpGn5GjR/temperas-escolares-x6.webp",
  "Resma papel carta x500 hojas":
    "https://i.postimg.cc/N0wzLV1c/resma-papel-carta-x500-hojas.webp",
  "Cartulina plana tamaño pliego":
    "https://i.postimg.cc/85YdfJqt/pliego-de-carulina.webp",
  "Pegante líquido escolar 125 g":
    "https://i.postimg.cc/vTQ1BQmP/pegamento-escolar.webp",
  "Tijeras escolares punta roma":
    "https://i.postimg.cc/Wby3Rm0G/tijeras-punta-roma.webp",
  "Grapadora metálica pequeña":
    "https://i.postimg.cc/zGBqfyFq/grapadora-pequena.jpg",
  "Notas adhesivas 76 x 76 mm":
    "https://i.postimg.cc/7ZPpNj5c/notas-adhesivas.webp",
  "Morral escolar básico azul":
    "https://i.postimg.cc/2S5KWvJk/morral-escolar-basico-azul.webp",
  "Cartuchera doble compartimento":
    "https://i.postimg.cc/D02gT3kY/cartuchera-dos-compartimentos.webp",
  "Memoria USB 32 GB": "https://i.postimg.cc/50pz8HT5/memoria-usb-32-GB.webp",
  "Calculadora científica básica":
    "https://i.postimg.cc/HLYsXSgh/calculadora-cientifica-basica.webp",
};

const FALLBACK_IMG: Record<string, string> = {
  Cuadernos:
    "https://images.pexels.com/photos/5208300/pexels-photo-5208300.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Escritura:
    "https://images.pexels.com/photos/34199486/pexels-photo-34199486.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Arte: "https://images.pexels.com/photos/33889910/pexels-photo-33889910.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Mochilas:
    "https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Oficina:
    "https://images.pexels.com/photos/8099500/pexels-photo-8099500.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Papeleria:
    "https://images.pexels.com/photos/19797277/pexels-photo-19797277.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
  Tecnologia:
    "https://images.pexels.com/photos/8099491/pexels-photo-8099491.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=800",
};

export function productImage(item: { name: string; category?: { name?: string } | null; images?: { url: string; isPrimary?: boolean }[]; imageUrl?: string | null }) {
  return item.images?.find(image => image.isPrimary)?.url || item.images?.[0]?.url || item.imageUrl || productImagesByName[item.name] || FALLBACK_IMG[item.category?.name ?? ''] || null;
}
