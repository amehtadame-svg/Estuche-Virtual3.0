BEGIN;

-- =====================================================
-- CATEGORÍAS
-- =====================================================

INSERT INTO categories (name, description)
SELECT 'Cuadernos', 'Cuadernos y libretas'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'Cuadernos'
);

INSERT INTO categories (name, description)
SELECT 'Escritura', 'Lápices, lapiceros y marcadores'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'Escritura'
);

INSERT INTO categories (name, description)
SELECT 'Arte', 'Materiales de dibujo y pintura'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'Arte'
);

INSERT INTO categories (name, description)
SELECT 'Oficina', 'Artículos de organización y escritorio'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'Oficina'
);

INSERT INTO categories (name, description)
SELECT 'Mochilas', 'Mochilas, loncheras y cartucheras'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'Mochilas'
);

INSERT INTO categories (name, description)
SELECT 'Papeleria', 'Artículos generales de papelería'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'Papeleria'
);

INSERT INTO categories (name, description)
SELECT 'Tecnologia', 'Accesorios tecnológicos'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'Tecnologia'
);

-- =====================================================
-- PRODUCTOS: CUADERNOS
-- =====================================================

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Cuaderno cosido 100 hojas cuadriculado',
  'Cuaderno tamaño carta, 100 hojas cuadriculadas, portada resistente.',
  12500,
  40,
  8,
  id
FROM categories
WHERE name = 'Cuadernos'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Cuaderno cosido 100 hojas cuadriculado'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Cuaderno argollado 80 hojas rayado',
  'Cuaderno universitario argollado con 80 hojas rayadas.',
  10900,
  35,
  8,
  id
FROM categories
WHERE name = 'Cuadernos'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Cuaderno argollado 80 hojas rayado'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Cuaderno de dibujo 30 hojas',
  'Block de dibujo tamaño carta con hojas blancas.',
  8900,
  25,
  5,
  id
FROM categories
WHERE name = 'Cuadernos'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Cuaderno de dibujo 30 hojas'
  );

-- =====================================================
-- PRODUCTOS: ESCRITURA
-- =====================================================

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Lápiz negro HB No. 2',
  'Lápiz de grafito HB para escritura y dibujo.',
  1200,
  150,
  30,
  id
FROM categories
WHERE name = 'Escritura'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Lápiz negro HB No. 2'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Lapicero azul punta fina',
  'Lapicero de tinta azul con punta fina de 0.7 mm.',
  2500,
  100,
  20,
  id
FROM categories
WHERE name = 'Escritura'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Lapicero azul punta fina'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Corrector líquido 7 ml',
  'Corrector líquido de secado rápido.',
  4500,
  40,
  8,
  id
FROM categories
WHERE name = 'Escritura'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Corrector líquido 7 ml'
  );

-- =====================================================
-- PRODUCTOS: ARTE
-- =====================================================

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Colores largos x12',
  'Caja de 12 colores de madera, punta resistente.',
  8500,
  45,
  8,
  id
FROM categories
WHERE name = 'Arte'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Colores largos x12'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Marcadores punta fina x12',
  'Set de 12 marcadores de colores surtidos.',
  14900,
  28,
  5,
  id
FROM categories
WHERE name = 'Arte'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Marcadores punta fina x12'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Temperas escolares x6',
  'Set de 6 témperas de colores básicos.',
  12500,
  25,
  5,
  id
FROM categories
WHERE name = 'Arte'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Temperas escolares x6'
  );

-- =====================================================
-- PRODUCTOS: OFICINA
-- =====================================================

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Resma papel carta x500 hojas',
  'Papel bond blanco tamaño carta de 75 gramos.',
  24900,
  20,
  4,
  id
FROM categories
WHERE name = 'Oficina'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Resma papel carta x500 hojas'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Grapadora metálica pequeña',
  'Grapadora para oficina con capacidad de 20 hojas.',
  13900,
  18,
  4,
  id
FROM categories
WHERE name = 'Oficina'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Grapadora metálica pequeña'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Notas adhesivas 76 x 76 mm',
  'Bloc de notas adhesivas color amarillo.',
  5900,
  40,
  8,
  id
FROM categories
WHERE name = 'Oficina'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Notas adhesivas 76 x 76 mm'
  );

-- =====================================================
-- PRODUCTOS: MOCHILAS
-- =====================================================

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Morral escolar básico azul',
  'Morral escolar con compartimento principal y bolsillo frontal.',
  59900,
  15,
  3,
  id
FROM categories
WHERE name = 'Mochilas'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Morral escolar básico azul'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Cartuchera doble compartimento',
  'Cartuchera con dos compartimentos y cierre reforzado.',
  21900,
  25,
  5,
  id
FROM categories
WHERE name = 'Mochilas'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Cartuchera doble compartimento'
  );

-- =====================================================
-- PRODUCTOS: PAPELERÍA
-- =====================================================

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Cartulina plana tamaño pliego',
  'Cartulina de color para trabajos escolares.',
  1800,
  100,
  20,
  id
FROM categories
WHERE name = 'Papeleria'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Cartulina plana tamaño pliego'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Pegante líquido escolar 125 g',
  'Pegante blanco escolar lavable y no tóxico.',
  4900,
  45,
  8,
  id
FROM categories
WHERE name = 'Papeleria'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Pegante líquido escolar 125 g'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Tijeras escolares punta roma',
  'Tijeras escolares con punta redonda y mango plástico.',
  5900,
  35,
  7,
  id
FROM categories
WHERE name = 'Papeleria'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Tijeras escolares punta roma'
  );

-- =====================================================
-- PRODUCTOS: TECNOLOGÍA
-- =====================================================

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Memoria USB 32 GB',
  'Memoria USB para documentos escolares y de oficina.',
  28900,
  20,
  4,
  id
FROM categories
WHERE name = 'Tecnologia'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Memoria USB 32 GB'
  );

INSERT INTO products (
  name,
  description,
  price,
  stock,
  stock_min,
  category_id
)
SELECT
  'Calculadora científica básica',
  'Calculadora científica para estudiantes.',
  49900,
  18,
  4,
  id
FROM categories
WHERE name = 'Tecnologia'
  AND NOT EXISTS (
    SELECT 1
    FROM products
    WHERE name = 'Calculadora científica básica'
  );

COMMIT;