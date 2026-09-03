import { PrismaClient, Role, PromotionalCodeType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const categoriesData = [
  { name: 'Cuadernos', description: 'Cuadernos y libretas' },
  { name: 'Escritura', description: 'Lápices, lapiceros y marcadores' },
  { name: 'Arte', description: 'Materiales de dibujo y pintura' },
  { name: 'Oficina', description: 'Artículos de organización y escritorio' },
  { name: 'Mochilas', description: 'Mochilas, loncheras y cartucheras' },
  { name: 'Papeleria', description: 'Artículos generales de papelería' },
  { name: 'Tecnologia', description: 'Accesorios tecnológicos' },
];

const productsData = [
  // Cuadernos
  {
    name: 'Cuaderno cosido 100 hojas cuadriculado',
    description: 'Cuaderno tamaño carta, 100 hojas cuadriculadas, portada resistente.',
    price: 12500,
    stock: 40,
    stockMin: 8,
    categoryName: 'Cuadernos',
    imageUrl: 'https://i.postimg.cc/G2MxjsGC/cuaderno-cosido-100-hojas-cuadriculado.webp',
  },
  {
    name: 'Cuaderno argollado 80 hojas rayado',
    description: 'Cuaderno universitario argollado con 80 hojas rayadas.',
    price: 10900,
    stock: 35,
    stockMin: 8,
    categoryName: 'Cuadernos',
    imageUrl: 'https://i.postimg.cc/6Q5QsHy3/cuaderno-argollado-80-hojas-rayado.webp',
  },
  {
    name: 'Cuaderno de dibujo 30 hojas',
    description: 'Block de dibujo tamaño carta con hojas blancas.',
    price: 8900,
    stock: 25,
    stockMin: 5,
    categoryName: 'Cuadernos',
    imageUrl: 'https://i.postimg.cc/BQ049hVR/cuaderno-de-dibujo-3o-hojas.webp',
  },

  // Escritura
  {
    name: 'Lápiz negro HB No. 2',
    description: 'Lápiz de grafito HB para escritura y dibujo.',
    price: 1200,
    stock: 150,
    stockMin: 30,
    categoryName: 'Escritura',
    imageUrl: 'https://i.postimg.cc/nhSyzT3L/lapiz-HB-No-27.webp',
  },
  {
    name: 'Lapicero azul punta fina',
    description: 'Lapicero de tinta azul con punta fina de 0.7 mm.',
    price: 2500,
    stock: 100,
    stockMin: 20,
    categoryName: 'Escritura',
    imageUrl: 'https://i.postimg.cc/fRyP6mMS/lapicero-azul-punta-fina.webp',
  },
  {
    name: 'Corrector líquido 7 ml',
    description: 'Corrector líquido de secado rápido.',
    price: 4500,
    stock: 40,
    stockMin: 8,
    categoryName: 'Escritura',
    imageUrl: 'https://i.postimg.cc/Qt30xTZQ/corector-liquido-7-ml.webp',
  },
  {
    name: 'Marcadores punta fina x12',
    description: 'Set de 12 marcadores de colores surtidos.',
    price: 14900,
    stock: 28,
    stockMin: 5,
    categoryName: 'Escritura',
    imageUrl: 'https://i.postimg.cc/G2Dtz44F/marcadores-punta-fina-x12.webp',
  },

  // Arte
  {
    name: 'Colores largos x12',
    description: 'Caja de 12 colores de madera, punta resistente.',
    price: 8500,
    stock: 45,
    stockMin: 8,
    categoryName: 'Arte',
    imageUrl: 'https://i.postimg.cc/fRkwBVFk/colores-por-12.webp',
  },
  {
    name: 'Temperas escolares x6',
    description: 'Set de 6 témperas de colores básicos.',
    price: 12500,
    stock: 25,
    stockMin: 5,
    categoryName: 'Arte',
    imageUrl: 'https://i.postimg.cc/GpGn5GjR/temperas-escolares-x6.webp',
  },

  // Oficina
  {
    name: 'Resma papel carta x500 hojas',
    description: 'Papel bond blanco tamaño carta de 75 gramos.',
    price: 24900,
    stock: 20,
    stockMin: 4,
    categoryName: 'Oficina',
    imageUrl: 'https://i.postimg.cc/N0wzLV1c/resma-papel-carta-x500-hojas.webp',
  },
  {
    name: 'Grapadora metálica pequeña',
    description: 'Grapadora para oficina con capacidad de 20 hojas.',
    price: 13900,
    stock: 18,
    stockMin: 4,
    categoryName: 'Oficina',
    imageUrl: 'https://i.postimg.cc/zGBqfyFq/grapadora-pequena.jpg',
  },
  {
    name: 'Notas adhesivas 76 x 76 mm',
    description: 'Bloc de notas adhesivas color amarillo.',
    price: 5900,
    stock: 40,
    stockMin: 8,
    categoryName: 'Oficina',
    imageUrl: 'https://i.postimg.cc/7ZPpNj5c/notas-adhesivas.webp',
  },

  // Mochilas
  {
    name: 'Morral escolar básico azul',
    description: 'Morral escolar con compartimento principal y bolsillo frontal.',
    price: 59900,
    stock: 15,
    stockMin: 3,
    categoryName: 'Mochilas',
    imageUrl: 'https://i.postimg.cc/2S5KWvJk/morral-escolar-basico-azul.webp',
  },
  {
    name: 'Cartuchera doble compartimento',
    description: 'Cartuchera con dos compartimentos y cierre reforzado.',
    price: 21900,
    stock: 25,
    stockMin: 5,
    categoryName: 'Mochilas',
    imageUrl: 'https://i.postimg.cc/D02gT3kY/cartuchera-dos-compartimentos.webp',
  },

  // Papelería
  {
    name: 'Cartulina plana tamaño pliego',
    description: 'Cartulina de color para trabajos escolares.',
    price: 1800,
    stock: 100,
    stockMin: 20,
    categoryName: 'Papeleria',
    imageUrl: 'https://i.postimg.cc/85YdfJqt/pliego-de-carulina.webp',
  },
  {
    name: 'Pegante líquido escolar 125 g',
    description: 'Pegante blanco escolar lavable y no tóxico.',
    price: 4900,
    stock: 45,
    stockMin: 8,
    categoryName: 'Papeleria',
    imageUrl: 'https://i.postimg.cc/vTQ1BQmP/pegamento-escolar.webp',
  },
  {
    name: 'Tijeras escolares punta roma',
    description: 'Tijeras escolares con punta redonda y mango plástico.',
    price: 5900,
    stock: 35,
    stockMin: 7,
    categoryName: 'Papeleria',
    imageUrl: 'https://i.postimg.cc/Wby3Rm0G/tijeras-punta-roma.webp',
  },

  // Tecnología
  {
    name: 'Memoria USB 32 GB',
    description: 'Memoria USB para documentos escolares y de oficina.',
    price: 28900,
    stock: 20,
    stockMin: 4,
    categoryName: 'Tecnologia',
    imageUrl: 'https://i.postimg.cc/50pz8HT5/memoria-usb-32-GB.webp',
  },
  {
    name: 'Calculadora científica básica',
    description: 'Calculadora científica para estudiantes.',
    price: 49900,
    stock: 18,
    stockMin: 4,
    categoryName: 'Tecnologia',
    imageUrl: 'https://i.postimg.cc/HLYsXSgh/calculadora-cientifica-basica.webp',
  },
];

const usersData = [
  {
    email: 'superadmin@estuche.com',
    fullName: 'Super Administrador',
    password: 'SuperAdmin123!',
    role: Role.superadmin,
    phone: '+57 300 000 0001',
    address: 'Sede Principal',
  },
  {
    email: 'admin@estuche.com',
    fullName: 'Administrador Estuche',
    password: 'Admin123!',
    role: Role.admin,
    phone: '+57 300 000 0002',
    address: 'Oficina Central',
  },
  {
    email: 'empleado@estuche.com',
    fullName: 'Empleado Demo',
    password: 'Empleado123!',
    role: Role.employee,
    phone: '+57 300 000 0003',
    address: 'Punto de Venta 1',
  },
  {
    email: 'domiciliario@estuche.com',
    fullName: 'Domiciliario Express',
    password: 'Delivery123!',
    role: Role.delivery,
    phone: '+57 300 000 0004',
    address: 'Zona Norte',
  },
  {
    email: 'cliente@estuche.com',
    fullName: 'Cliente Registrado',
    password: 'Cliente123!',
    role: Role.client,
    phone: '+57 300 000 0005',
    address: 'Calle 100 # 15-20, Bogotá',
  },
];

const promoCodesData = [
  {
    code: 'ESTUCHE10',
    description: '10% de descuento en tu compra',
    type: PromotionalCodeType.percentage,
    value: 10,
    minPurchase: 20000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2030-12-31'),
    maxUses: 1000,
    active: true,
  },
  {
    code: 'BIENVENIDA20',
    description: '$20.000 COP de descuento por bienvenida',
    type: PromotionalCodeType.fixed,
    value: 20000,
    minPurchase: 50000,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2030-12-31'),
    maxUses: 500,
    active: true,
  },
];

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Categorías
  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    let category = await prisma.category.findFirst({ where: { name: cat.name } });
    if (!category) {
      category = await prisma.category.create({
        data: { name: cat.name, description: cat.description },
      });
      console.log(`  + Categoría creada: ${cat.name}`);
    } else {
      console.log(`  = Categoría ya existe: ${cat.name}`);
    }
    categoryMap.set(cat.name, category.id);
  }

  // 2. Productos e Imágenes
  for (const prod of productsData) {
    const categoryId = categoryMap.get(prod.categoryName);
    let product = await prisma.product.findFirst({ where: { name: prod.name } });

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          stock: prod.stock,
          stockMin: prod.stockMin,
          categoryId: categoryId ?? null,
        },
      });
      console.log(`  + Producto creado: ${prod.name}`);
    } else {
      console.log(`  = Producto ya existe: ${prod.name}`);
    }

    if (prod.imageUrl) {
      const existingImg = await prisma.productImage.findFirst({
        where: { productId: product.id, url: prod.imageUrl },
      });
      if (!existingImg) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: prod.imageUrl,
            isPrimary: true,
            sortOrder: 1,
            name: prod.name,
          },
        });
      }
    }
  }

  // 3. Usuarios iniciales
  for (const usr of usersData) {
    const existing = await prisma.user.findUnique({ where: { email: usr.email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(usr.password, 10);
      await prisma.user.create({
        data: {
          email: usr.email,
          fullName: usr.fullName,
          hashedPassword,
          role: usr.role,
          phone: usr.phone,
          address: usr.address,
          isActive: true,
          isEmailVerified: true,
          dataConsentAt: new Date(),
        },
      });
      console.log(`  + Usuario creado [${usr.role}]: ${usr.email} (Clave: ${usr.password})`);
    } else {
      console.log(`  = Usuario ya existe: ${usr.email}`);
    }
  }

  // 4. Códigos promocionales
  for (const promo of promoCodesData) {
    const existing = await prisma.promotionalCode.findUnique({ where: { code: promo.code } });
    if (!existing) {
      await prisma.promotionalCode.create({
        data: promo,
      });
      console.log(`  + Cupón creado: ${promo.code}`);
    } else {
      console.log(`  = Cupón ya existe: ${promo.code}`);
    }
  }

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });