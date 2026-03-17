const db = require('../db');

async function seedLocales() {
  try {
    console.log('🌱 Seeding locales data...');
    
    // Insert the 12 initial locales
    const localesData = [
      // Gastronomia locales
      {
        slug: 'sakai-sushi-ramen',
        display_name: 'Sakai Sushi & Ramen',
        category: 'gastronomia',
        short_description: 'Auténtica cocina japonesa con sushi fresco y ramen artesanal',
        long_description: 'Experimenta los sabores de Japón en nuestro restaurante especializado en sushi tradicional y ramen casero. Ingredientes frescos seleccionados diariamente para una experiencia gastronómica única.',
        hero_title: 'Sushi & Ramen Artesanal',
        hero_subtitle: 'El sabor de Japón en Melo',
        address: 'Av. Principal 1234, Melo',
        phone: '+598 1234 5678',
        whatsapp: '+598 1234 5678',
        email: 'info@sakai.com.uy',
        opening_hours: JSON.stringify({
          lunes: { open: '11:00', close: '23:00' },
          martes: { open: '11:00', close: '23:00' },
          miercoles: { open: '11:00', close: '23:00' },
          jueves: { open: '11:00', close: '23:00' },
          viernes: { open: '11:00', close: '00:00' },
          sabado: { open: '11:00', close: '00:00' },
          domingo: { open: '11:00', close: '23:00' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'entre-brasas-parrilla-oriental',
        display_name: 'Entre Brasas Parrilla Oriental',
        category: 'gastronomia',
        short_description: 'La mejor parrilla oriental con cortes premium y fogón tradicional',
        long_description: 'Disfruta de los mejores cortes de carne oriental cocinados a la parrilla tradicional. Nuestro fogón leña realza los sabores auténticos de la región.',
        hero_title: 'Parrilla Tradicional',
        hero_subtitle: 'Sabor oriental en cada bocado',
        address: 'Ruta 8 Km 145, Melo',
        phone: '+598 2345 6789',
        whatsapp: '+598 2345 6789',
        email: 'reservas@entrebrasas.com.uy',
        opening_hours: JSON.stringify({
          miercoles: { open: '19:00', close: '00:00' },
          jueves: { open: '19:00', close: '00:00' },
          viernes: { open: '19:00', close: '01:00' },
          sabado: { open: '19:00', close: '01:00' },
          domingo: { open: '12:00', close: '16:00' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'fornos-pizzeria',
        display_name: 'Fornos Pizzeria',
        category: 'gastronomia',
        short_description: 'Pizza artesanal con masa fermentada y ingredientes seleccionados',
        long_description: 'Pizzas cocinadas en horno de leña con masa de fermentación natural. Ingredientes premium y recetas tradicionales italianas.',
        hero_title: 'Pizza Artesanal',
        hero_subtitle: 'El sabor de Italia en Melo',
        address: 'Calle 25 de Mayo 567, Melo',
        phone: '+598 3456 7890',
        whatsapp: '+598 3456 7890',
        email: 'pedidos@fornos.com.uy',
        opening_hours: JSON.stringify({
          martes: { open: '18:00', close: '23:30' },
          miercoles: { open: '18:00', close: '23:30' },
          jueves: { open: '18:00', close: '23:30' },
          viernes: { open: '18:00', close: '00:30' },
          sabado: { open: '18:00', close: '00:30' },
          domingo: { open: '18:00', close: '23:30' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'fornos-milanesas-chiquitos',
        display_name: 'Fornos Milanesas & Chiquitos',
        category: 'gastronomia',
        short_description: 'Clásicos argentinos: milanesas imperdibles y chiquitos tradicionales',
        long_description: 'Especialistas en milanesas caseras y chiquitos argentinos. Porciones generosas con acompañamientos tradicionales.',
        hero_title: 'Milanesas & Chiquitos',
        hero_subtitle: 'Tradición argentina en cada plato',
        address: 'Av. Artigas 890, Melo',
        phone: '+598 4567 8901',
        whatsapp: '+598 4567 8901',
        email: 'delivery@fornosmilanesas.com.uy',
        opening_hours: JSON.stringify({
          lunes: { open: '11:30', close: '15:00' },
          martes: { open: '11:30', close: '15:00' },
          miercoles: { open: '11:30', close: '15:00' },
          jueves: { open: '11:30', close: '15:00' },
          viernes: { open: '11:30', close: '15:30' },
          sabado: { open: '19:00', close: '23:30' },
          domingo: { open: '19:00', close: '23:30' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'castagnet-vinoteca',
        display_name: 'Castagnet Vinoteca',
        category: 'gastronomia',
        short_description: 'Selección premium de vinos nacionales e internacionales',
        long_description: 'Vinoteca especializada con curated selection de vinos. Catas degustación y maridaje con quesos y embutidos finos.',
        hero_title: 'Vinos Selectos',
        hero_subtitle: 'La mejor selección de vinos',
        address: 'Plaza Constitución 234, Melo',
        phone: '+598 5678 9012',
        whatsapp: '+598 5678 9012',
        email: 'info@castagnet.com.uy',
        opening_hours: JSON.stringify({
          martes: { open: '17:00', close: '23:00' },
          miercoles: { open: '17:00', close: '23:00' },
          jueves: { open: '17:00', close: '23:00' },
          viernes: { open: '17:00', close: '00:00' },
          sabado: { open: '17:00', close: '00:00' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'fish-market-pescados-mariscos',
        display_name: 'Fish Market Pescados & Mariscos',
        category: 'gastronomia',
        short_description: 'Pescados y mariscos frescos del día con preparaciones gourmet',
        long_description: 'Producto fresco del mar con preparaciones tradicionales y gourmet. Pescadería y restaurante en un solo lugar.',
        hero_title: 'Mar Fresco',
        hero_subtitle: 'Pescados y mariscos del día',
        address: 'Puerto de Melo s/n',
        phone: '+598 6789 0123',
        whatsapp: '+598 6789 0123',
        email: 'pedidos@fishmarket.com.uy',
        opening_hours: JSON.stringify({
          miercoles: { open: '11:00', close: '16:00' },
          jueves: { open: '11:00', close: '16:00' },
          viernes: { open: '11:00', close: '16:00' },
          sabado: { open: '11:00', close: '18:00' },
          domingo: { open: '11:00', close: '18:00' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'san-carlos-coffee-cake',
        display_name: 'San Carlos Coffee & Cake',
        category: 'gastronomia',
        short_description: 'Café especial y repostería artesanal en ambiente acogedor',
        long_description: 'Café de especialidad tostado local con pasteles y tortas caseras. Espacio ideal para desayunos y meriendas.',
        hero_title: 'Café & Repostería',
        hero_subtitle: 'El mejor café de Melo',
        address: 'Calle San Carlos 345, Melo',
        phone: '+598 7890 1234',
        whatsapp: '+598 7890 1234',
        email: 'hola@sancarlos.com.uy',
        opening_hours: JSON.stringify({
          lunes: { open: '07:00', close: '20:00' },
          martes: { open: '07:00', close: '20:00' },
          miercoles: { open: '07:00', close: '20:00' },
          jueves: { open: '07:00', close: '20:00' },
          viernes: { open: '07:00', close: '21:00' },
          sabado: { open: '08:00', close: '21:00' },
          domingo: { open: '08:00', close: '20:00' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'mister-grill-hamburguesas-gourmet',
        display_name: 'Mister Grill Hamburguesas Gourmet',
        category: 'gastronomia',
        short_description: 'Hamburguesas gourmet con carne premium y ingredientes únicos',
        long_description: 'Hamburguesas artesanales con cortes premium, pan casero y salsas exclusivas. Combinaciones innovadoras y clásicos perfectos.',
        hero_title: 'Hamburguesas Gourmet',
        hero_subtitle: 'Sabor incomparable',
        address: 'Av. Roosevelt 678, Melo',
        phone: '+598 8901 2345',
        whatsapp: '+598 8901 2345',
        email: 'pedidos@mistergrill.com.uy',
        opening_hours: JSON.stringify({
          martes: { open: '18:00', close: '23:00' },
          miercoles: { open: '18:00', close: '23:00' },
          jueves: { open: '18:00', close: '23:00' },
          viernes: { open: '18:00', close: '00:00' },
          sabado: { open: '18:00', close: '00:00' },
          domingo: { open: '18:00', close: '23:00' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'cremino-gelatto-fatto-con-amore',
        display_name: 'Cremino Gelatto Fatto con Amore',
        category: 'gastronomia',
        short_description: 'Helados artesanales italianos con ingredientes naturales',
        long_description: 'Gelateria tradicional italiana con helados hechos diariamente. Ingredientes naturales y recetas auténticas italianas.',
        hero_title: 'Gelato Artesanal',
        hero_subtitle: 'El verdadero sabor italiano',
        address: 'Calle Italia 123, Melo',
        phone: '+598 9012 3456',
        whatsapp: '+598 9012 3456',
        email: 'info@cremino.com.uy',
        opening_hours: JSON.stringify({
          lunes: { open: '14:00', close: '23:00' },
          martes: { open: '14:00', close: '23:00' },
          miercoles: { open: '14:00', close: '23:00' },
          jueves: { open: '14:00', close: '23:00' },
          viernes: { open: '14:00', close: '00:00' },
          sabado: { open: '14:00', close: '00:00' },
          domingo: { open: '14:00', close: '23:00' }
        }),
        featured: true,
        active: true
      },
      // Compras/Tiendas locales
      {
        slug: 'la-familia-autoservice',
        display_name: 'La Familia Autoservice',
        category: 'compras',
        short_description: 'Autoservice completo con productos de primera necesidad y ferretería',
        long_description: 'Amplia selección de productos de limpieza, alimentos, bebidas y artículos de ferretería. Atención personalizada y calidad garantizada.',
        hero_title: 'Todo en un lugar',
        hero_subtitle: 'Tu autoservice de confianza',
        address: 'Av. Treinta y Tres 456, Melo',
        phone: '+598 2345 6789',
        whatsapp: '+598 2345 6789',
        email: 'contacto@lafamilia.com.uy',
        opening_hours: JSON.stringify({
          lunes: { open: '08:00', close: '21:00' },
          martes: { open: '08:00', close: '21:00' },
          miercoles: { open: '08:00', close: '21:00' },
          jueves: { open: '08:00', close: '21:00' },
          viernes: { open: '08:00', close: '21:00' },
          sabado: { open: '08:30', close: '20:30' },
          domingo: { open: '09:00', close: '20:00' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'etiqueta-negra-carnes-seleccion-gourmet',
        display_name: 'Etiqueta Negra Carnes Selección Gourmet',
        category: 'compras',
        short_description: 'Carnes premium de primera calidad con cortes gourmet',
        long_description: 'Carnicería gourmet especializada en cortes premium de primera calidad. Asesoramiento experto y productos seleccionados.',
        hero_title: 'Carnes Premium',
        hero_subtitle: 'Selección gourmet exclusiva',
        address: 'Ruta 7 Km 234, Melo',
        phone: '+598 3456 7890',
        whatsapp: '+598 3456 7890',
        email: 'pedidos@etiquetanegra.com.uy',
        opening_hours: JSON.stringify({
          martes: { open: '09:00', close: '13:00' },
          miercoles: { open: '09:00', close: '13:00' },
          jueves: { open: '09:00', close: '13:00' },
          viernes: { open: '09:00', close: '13:00' },
          sabado: { open: '09:00', close: '14:00' }
        }),
        featured: true,
        active: true
      },
      {
        slug: 'producto-de-cerro-largo',
        display_name: 'Producto de Cerro Largo',
        category: 'compras',
        short_description: 'Productos regionales de Cerro Largo y artesanías locales',
        long_description: 'Exhibición y venta de productos típicos de Cerro Largo: alimentos, artesanías, textiles y souvenirs regionales.',
        hero_title: 'Productos Regionales',
        hero_subtitle: 'Lo mejor de nuestra tierra',
        address: 'Plaza Independencia 123, Melo',
        phone: '+598 4567 8901',
        whatsapp: '+598 4567 8901',
        email: 'info@productocerrilargo.com.uy',
        opening_hours: JSON.stringify({
          lunes: { open: '09:00', close: '18:00' },
          martes: { open: '09:00', close: '18:00' },
          miercoles: { open: '09:00', close: '18:00' },
          jueves: { open: '09:00', close: '18:00' },
          viernes: { open: '09:00', close: '18:00' },
          sabado: { open: '10:00', close: '13:00' }
        }),
        featured: true,
        active: true
      }
    ];

    for (const locale of localesData) {
      const [result] = await db.query(`
        INSERT INTO locales (
          slug, display_name, category, short_description, long_description,
          hero_title, hero_subtitle, address, phone, whatsapp, email,
          opening_hours, featured, active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        locale.slug, locale.display_name, locale.category, 
        locale.short_description, locale.long_description,
        locale.hero_title, locale.hero_subtitle, locale.address,
        locale.phone, locale.whatsapp, locale.email,
        locale.opening_hours, locale.featured, locale.active
      ]);
      console.log(`✅ Created locale: ${locale.display_name} (ID: ${result.insertId})`);
    }

    console.log('🎉 All locales seeded successfully!');
    
    // Add sample details for some locales
    console.log('🌱 Adding sample details...');
    
    const detailsData = [
      // Sakai details
      {
        local_id: 1,
        section_key: 'highlights',
        section_type: 'json',
        content: JSON.stringify(['Sushi fresco diario', 'Ramen casero', 'Ingredientes importados', 'Chef japonés'])
      },
      {
        local_id: 1,
        section_key: 'services',
        section_type: 'json',
        content: JSON.stringify(['Delivery', 'Takeaway', 'Reservas', 'Eventos privados'])
      },
      {
        local_id: 1,
        section_key: 'featured_dishes',
        section_type: 'json',
        content: JSON.stringify([
          { name: 'Roll Sakai', description: 'Salmón, aguacate, philadelphia', price: 450 },
          { name: 'Ramen Tonkotsu', description: 'Caldo de cerdo 12 horas, fideos caseros', price: 380 }
        ])
      },
      // La Familia details
      {
        local_id: 10,
        section_key: 'highlights',
        section_type: 'json',
        content: JSON.stringify(['Productos frescos', 'Atención 24/7', 'Delivery gratis', 'Variedad completa'])
      },
      {
        local_id: 10,
        section_key: 'services',
        section_type: 'json',
        content: JSON.stringify(['Delivery', 'Pedidos por teléfono', 'Crédito', 'Promociones semanales'])
      }
    ];

    for (const detail of detailsData) {
      await db.query(`
        INSERT INTO local_details (local_id, section_key, section_type, content)
        VALUES (?, ?, ?, ?)
      `, [detail.local_id, detail.section_key, detail.section_type, detail.content]);
    }

    console.log('✅ Sample details added');
    
    // Verify the data
    const [locales] = await db.query('SELECT COUNT(*) as count FROM locales');
    const [details] = await db.query('SELECT COUNT(*) as count FROM local_details');
    
    console.log(`📊 Result: ${locales[0].count} locales created`);
    console.log(`📊 Result: ${details[0].count} detail records created`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedLocales();
