const db = require("../db");

/* ============================================================
   Helpers
============================================================ */
function sanitizeLocaleData(data) {
  const sanitized = { ...data };
  
  // Remove sensitive or auto-managed fields
  delete sanitized.id;
  delete sanitized.created_at;
  delete sanitized.updated_at;
  
  // Remove owner_user_id from active use - keep for admin only
  // delete sanitized.owner_user_id;
  
  // Ensure valid category
  const validCategories = ['gastronomia', 'compras', 'otros'];
  if (sanitized.category && !validCategories.includes(sanitized.category)) {
    sanitized.category = 'gastronomia';
  }
  
  // Convert boolean fields
  if (sanitized.featured !== undefined) {
    sanitized.featured = Boolean(sanitized.featured);
  }
  if (sanitized.active !== undefined) {
    sanitized.active = Boolean(sanitized.active);
  }
  
  return sanitized;
}

/**
 * Shared helper: Attach normalized details to locale records
 * Used by all read endpoints for consistent response shape
 */
async function attachLocaleDetails(locales) {
  // Handle single locale or array
  const localeArray = Array.isArray(locales) ? locales : [locales];
  
  // Get all details for these locales in one query
  const localIds = localeArray.map(l => l.id).filter(id => id);
  
  if (localIds.length === 0) {
    return locales;
  }
  
  const [detailsRows] = await db.query(`
    SELECT local_id, section_key, section_type, content
    FROM local_details 
    WHERE local_id IN (${localIds.map(() => '?').join(',')})
    ORDER BY local_id, section_key
  `, localIds);
  
  // Group details by local_id
  const detailsMap = {};
  detailsRows.forEach(row => {
    if (!detailsMap[row.local_id]) {
      detailsMap[row.local_id] = [];
    }
    detailsMap[row.local_id].push(row);
  });
  
  // Attach normalized details to each locale
  localeArray.forEach(locale => {
    const localeDetails = detailsMap[locale.id] || [];
    locale.details = normalizeLocalDetails(localeDetails);
    
    // Normalize opening_hours for frontend consumption (always process)
    locale.opening_hours = normalizeOpeningHoursForResponse(locale.opening_hours);
  });
  
  return locales;
}

/**
 * Normalize locale record for consistent API response
 */
function normalizeLocaleRecord(locale) {
  const normalized = { ...locale };
  
  // Ensure all required fields exist with proper defaults
  const defaults = {
    short_description: null,
    long_description: null,
    hero_title: null,
    hero_subtitle: null,
    address: null,
    phone: null,
    whatsapp: null,
    email: null,
    opening_hours: null,
    website_url: null,
    instagram_url: null,
    facebook_url: null,
    tiktok_url: null,
    logo_url: null,
    cover_image_url: null,
    menu_pdf_url: null,
    featured: false,
    active: true
  };
  
  Object.keys(defaults).forEach(key => {
    if (normalized[key] === undefined) {
      normalized[key] = defaults[key];
    }
  });
  
  return normalized;
}


/**
 * Helper: Normalize opening_hours for API response
 * Ensures frontend receives a plain string value
 */
function normalizeOpeningHoursForResponse(value) {
  if (value === null || value === undefined) return '';
  
  // If it's already a string, clean it up
  if (typeof value === 'string') {
    // Check if it's a JSON string with raw data
    if (value.startsWith('{') && value.includes('"raw"')) {
      try {
        const parsed = JSON.parse(value);
        if (parsed.raw) {
          return parsed.raw;
        }
      } catch (e) {
        // Not valid JSON, continue
      }
    }
    
    // Check if it's a structured JSON string
    if (value.startsWith('{') && !value.includes('[object Object]')) {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) {
          // Format structured opening hours into readable string
          const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
          const hours = [];
          
          days.forEach(day => {
            if (parsed[day] && parsed[day].open && parsed[day].close) {
              hours.push(`${day.charAt(0).toUpperCase() + day.slice(1, 3)} ${parsed[day].open}-${parsed[day].close}`);
            }
          });
          
          if (hours.length > 0) {
            return hours.join(', ');
          }
        }
      } catch (e) {
        // Not valid JSON, return as-is
      }
    }
    
    // Handle corrupted [object Object] strings
    if (value.includes('[object Object]')) {
      return '';
    }
    
    return value;
  }
  
  // Handle corrupted [object Object] objects
  if (typeof value === 'object') {
    const stringified = String(value);
    if (stringified === '[object Object]') {
      return ''; // Return empty string for corrupted data
    }
    
    // Try to extract meaningful data from object
    if (value.raw !== undefined) {
      return typeof value.raw === 'string' ? value.raw : String(value.raw);
    }
    
    // Last resort: return empty string instead of [object Object]
    return '';
  }
  
  // Fallback
  return String(value);
}

/**
 * Normalizes row-based local_details into a clean object format
 * Backward-compatible: handles both JSON-stringified and legacy plain text
 * Also normalizes legacy keys to modern equivalents
 */
function normalizeLocalDetails(detailsArray) {
  if (!Array.isArray(detailsArray) || detailsArray.length === 0) {
    return {
      headline: null,
      subheadline: null,
      description: null,
      highlights: [],
      services: [],
      cta_label: null,
      cta_url: null,
      map_url: null,
      promotion_text: null,
      featured_products: [],
      business_tags: []
    };
  }

  const result = {
    headline: null,
    subheadline: null,
    description: null,
    highlights: [],
    services: [],
    cta_label: null,
    cta_url: null,
    map_url: null,
    promotion_text: null,
    featured_products: [],
    business_tags: []
  };

  for (const detail of detailsArray) {
    if (!detail || !detail.section_key) continue;
    
    const key = detail.section_key;
    let content = detail.content;
    
    // Parse JSON content (handles both properly stored JSON and legacy data)
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch {
        // Not valid JSON - use raw string (backward compatibility for legacy data)
        // No warning spam - this is expected for some legacy records
      }
    }
    
    // Legacy key normalization: featured_dishes → featured_products
    const normalizedKey = key === 'featured_dishes' ? 'featured_products' : key;
    
    // Map known keys to normalized structure
    if (result.hasOwnProperty(normalizedKey)) {
      // If we already have featured_products from another source, merge arrays
      if (normalizedKey === 'featured_products' && result.featured_products.length > 0 && Array.isArray(content)) {
        result.featured_products = [...result.featured_products, ...content];
      } else {
        result[normalizedKey] = content;
      }
    } else {
      // For any unknown keys, include them as-is for extensibility
      result[normalizedKey] = content;
    }
  }

  return result;
}

/* ============================================================
   PUBLIC ENDPOINTS
============================================================ */

// GET /api/public/locales - Public list of active locales
exports.getPublicLocales = async (req, res) => {
  try {
    const { category, featured, search, limit = 20, offset = 0 } = req.query;
    
    // Build WHERE conditions
    const conditions = ['l.active = true'];
    const params = [];
    
    if (category) {
      conditions.push('l.category = ?');
      params.push(category);
    }
    
    if (featured !== undefined) {
      conditions.push('l.featured = ?');
      params.push(featured === 'true' ? 1 : 0);
    }
    
    if (search) {
      conditions.push('(l.display_name LIKE ? OR l.short_description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const whereClause = conditions.join(' AND ');
    
    // Get locales without GROUP_CONCAT
    const [locales] = await db.query(`
      SELECT l.*
      FROM locales l
      WHERE ${whereClause}
      ORDER BY l.display_name
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit, 10), parseInt(offset, 10)]);
    
    // Attach details using shared helper
    await attachLocaleDetails(locales);
    
    res.json({
      ok: true,
      data: locales
    });
    
  } catch (error) {
    console.error("Error in getPublicLocales:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// GET /api/public/locales/:slug - Public locale detail by slug
exports.getPublicLocaleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ ok: false, error: "Slug requerido" });
    }
    
    // Query 1: Get locale base record
    const [locales] = await db.query(
      'SELECT * FROM locales WHERE slug = ? AND active = true',
      [slug]
    );
    
    if (locales.length === 0) {
      return res.status(404).json({ ok: false, error: "Local no encontrado" });
    }
    
    const locale = locales[0];
    
    // Attach details using shared helper
    await attachLocaleDetails(locale);
    
    res.json({ ok: true, data: locale });
    
  } catch (error) {
    console.error("Error in getPublicLocaleBySlug:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// GET /api/public/locales/id/:id - Public locale detail by ID
exports.getPublicLocaleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }
    
    // Query 1: Get locale base record
    const [locales] = await db.query(
      'SELECT * FROM locales WHERE id = ? AND active = true',
      [parseInt(id, 10)]
    );
    
    if (locales.length === 0) {
      return res.status(404).json({ ok: false, error: "Local no encontrado" });
    }
    
    const locale = locales[0];
    
    // Attach details using shared helper
    await attachLocaleDetails(locale);
    
    res.json({ ok: true, data: locale });
    
  } catch (error) {
    console.error("Error in getPublicLocaleById:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// GET /api/public/locales/category/:category - Public locales by category
exports.getPublicLocalesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    if (!category) {
      return res.status(400).json({ ok: false, error: "Categoría requerida" });
    }
    
    // Build WHERE conditions
    const conditions = ['l.active = true', 'l.category = ?'];
    const params = [category];
    
    const whereClause = conditions.join(' AND ');
    
    // Get locales without GROUP_CONCAT
    const [locales] = await db.query(`
      SELECT l.*
      FROM locales l
      WHERE ${whereClause}
      ORDER BY l.display_name
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit, 10), parseInt(offset, 10)]);
    
    // Attach details using shared helper
    await attachLocaleDetails(locales);
    
    res.json({
      ok: true,
      data: locales,
      category
    });
    
  } catch (error) {
    console.error("Error in getPublicLocalesByCategory:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

/* ============================================================
   ADMIN ENDPOINTS
============================================================ */

// GET /api/admin/locales - Admin full listing
exports.getAdminLocales = async (req, res) => {
  try {
    const { category, active, featured, search, limit = 50, offset = 0 } = req.query;
    
    // Build WHERE conditions
    const conditions = [];
    const params = [];
    
    if (category) {
      conditions.push('l.category = ?');
      params.push(category);
    }
    
    if (active !== undefined) {
      conditions.push('l.active = ?');
      params.push(active === 'true' ? 1 : 0);
    }
    
    if (featured !== undefined) {
      conditions.push('l.featured = ?');
      params.push(featured === 'true' ? 1 : 0);
    }
    
    if (search) {
      conditions.push('(l.display_name LIKE ? OR l.short_description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    
    // Get locales without GROUP_CONCAT
    const [locales] = await db.query(`
      SELECT l.*
      FROM locales l
      ${whereClause}
      ORDER BY l.display_name
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit, 10), parseInt(offset, 10)]);
    
    // Attach details using shared helper
    await attachLocaleDetails(locales);
    
    // Get user assignments for each locale
    if (locales.length > 0) {
      const localeIds = locales.map(l => l.id);
      const [userRows] = await db.query(
        `SELECT u.id, u.nombre, u.apellido, u.email, u.rol, u.local_id 
         FROM usuarios u 
         WHERE u.local_id IN (?) AND u.rol = 'local'`,
        [localeIds]
      );
      
      // Group users by local_id
      const usersByLocale = {};
      for (const user of userRows) {
        if (!usersByLocale[user.local_id]) {
          usersByLocale[user.local_id] = [];
        }
        usersByLocale[user.local_id].push(user);
      }
      
      // Attach users to each locale
      for (const locale of locales) {
        locale.assigned_users = usersByLocale[locale.id] || [];
      }
    }
    
    res.json({
      ok: true,
      data: locales
    });
    
  } catch (error) {
    console.error("Error in getAdminLocales:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// POST /api/admin/locales - Create locale (admin only)
exports.createLocale = async (req, res) => {
  try {
    const localeData = sanitizeLocaleData(req.body);
    
    if (!localeData.slug || !localeData.display_name) {
      return res.status(400).json({ 
        ok: false, 
        error: "Slug y display_name son requeridos" 
      });
    }
    
    // Check if slug already exists
    const [existing] = await db.query(
      "SELECT id FROM locales WHERE slug = ?",
      [localeData.slug]
    );
    
    if (existing.length > 0) {
      return res.status(409).json({ 
        ok: false, 
        error: "Slug ya existe" 
      });
    }
    
    // Note: owner_user_id is deprecated for active use
    // Admin can still set it manually via direct DB if needed
    const ownerUserId = null; // Force null to remove ownership model
    
    // Handle opening_hours as plain string
    const openingHours = localeData.opening_hours;
    const normalizedOpeningHours = typeof openingHours === 'string' ? openingHours.trim() : '';
    
    const [result] = await db.query(`
      INSERT INTO locales (
        slug, display_name, category, short_description, long_description,
        hero_title, hero_subtitle, address, phone, whatsapp, email,
        opening_hours, website_url, instagram_url, facebook_url, tiktok_url,
        logo_url, cover_image_url, menu_pdf_url,
        featured, active, owner_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      localeData.slug, localeData.display_name, localeData.category,
      localeData.short_description, localeData.long_description,
      localeData.hero_title, localeData.hero_subtitle, localeData.address,
      localeData.phone, localeData.whatsapp, localeData.email,
      normalizedOpeningHours, localeData.website_url, localeData.instagram_url,
      localeData.facebook_url, localeData.tiktok_url, localeData.logo_url,
      localeData.cover_image_url, localeData.menu_pdf_url,
      localeData.featured, localeData.active, ownerUserId
    ]);
    
    res.status(201).json({
      ok: true,
      message: "Local creado exitosamente",
      data: { id: result.insertId, ...localeData }
    });
    
  } catch (error) {
    console.error("Error in createLocale:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// PATCH /api/admin/locales/:id - Update locale (admin only)
exports.updateLocale = async (req, res) => {
  try {
    const { id } = req.params;
    const localeData = sanitizeLocaleData(req.body);
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }
    
    // Check if locale exists
    const [existing] = await db.query(
      "SELECT id FROM locales WHERE id = ?",
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ ok: false, error: "Local no encontrado" });
    }
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(localeData).forEach(key => {
      if (localeData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        
        // Special handling for opening_hours - store as plain string
        if (key === 'opening_hours') {
          const val = localeData[key];
          if (typeof val === 'string') {
            updateValues.push(val.trim());
          } else if (val === null || val === undefined) {
            updateValues.push('');
          } else {
            // Convert non-string to empty string
            updateValues.push('');
          }
        } else {
          updateValues.push(localeData[key]);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ ok: false, error: "No hay campos para actualizar" });
    }
    
    updateValues.push(id);
    
    await db.query(`
      UPDATE locales SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues);
    
    res.json({
      ok: true,
      message: "Local actualizado exitosamente"
    });
    
  } catch (error) {
    console.error("Error in updateLocale:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// DELETE /api/admin/locales/:id - Soft delete locale (admin only)
exports.deleteLocale = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }
    
    const [result] = await db.query(
      "UPDATE locales SET active = false WHERE id = ?",
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Local no encontrado" });
    }
    
    res.json({
      ok: true,
      message: "Local desactivado exitosamente"
    });
    
  } catch (error) {
    console.error("Error in deleteLocale:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

/* ============================================================
   LOCAL USER SELF-MANAGEMENT ENDPOINTS
============================================================ */

// GET /api/me/local - Get authenticated local user's assigned local
exports.getMyLocal = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's local_id first
    const [userRows] = await db.query(
      'SELECT id, rol, local_id FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "USER_NOT_FOUND"
      });
    }
    
    const user = userRows[0];
    
    // Validate user role and local_id assignment
    if (user.rol !== 'local') {
      return res.status(403).json({ 
        ok: false, 
        error: "ROLE_NOT_LOCAL",
        message: "Acceso denegado. Se requiere rol local."
      });
    }
    
    if (!user.local_id) {
      return res.status(404).json({ 
        ok: false, 
        error: "NO_LOCALE_ASSIGNED",
        message: "No tienes un local asignado. Contacta al administrador."
      });
    }
    
    // Find locale by local_id (authoritative binding)
    const [locales] = await db.query(
      'SELECT * FROM locales WHERE id = ?',
      [user.local_id]
    );
    
    if (locales.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "LOCALE_NOT_FOUND",
        message: "El local asignado no existe en el sistema."
      });
    }
    
    const locale = locales[0];
    
    // Attach details using shared helper
    await attachLocaleDetails(locale);
    
    res.json({ ok: true, data: locale });
    
  } catch (error) {
    console.error("Error in getMyLocal:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// PATCH /api/me/local - Update own local core fields
exports.updateMyLocal = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's local_id first
    const [userRows] = await db.query(
      'SELECT id, rol, local_id FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "USER_NOT_FOUND"
      });
    }
    
    const user = userRows[0];
    
    // Validate user role and local_id assignment
    if (user.rol !== 'local') {
      return res.status(403).json({ 
        ok: false, 
        error: "ROLE_NOT_LOCAL"
      });
    }
    
    if (!user.local_id) {
      return res.status(404).json({ 
        ok: false, 
        error: "NO_LOCALE_ASSIGNED"
      });
    }
    
    const localId = user.local_id;
    
    // WHITELIST: Only these fields can be updated by local users
    const ALLOWED_FIELDS = [
      'short_description',
      'long_description',
      'hero_title',
      'hero_subtitle',
      'address',
      'phone',
      'whatsapp',
      'email',
      'opening_hours',
      'website_url',
      'instagram_url',
      'facebook_url',
      'tiktok_url',
      'logo_url',
      'cover_image_url',
      'menu_pdf_url'
    ];
    
    // Build update query using whitelist only
    const updateFields = [];
    const updateValues = [];
    
    ALLOWED_FIELDS.forEach(key => {
      if (req.body[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        
        // Special handling for opening_hours - store as plain string
        if (key === 'opening_hours') {
          const val = req.body[key];
          if (typeof val === 'string') {
            updateValues.push(val.trim());
          } else if (val === null || val === undefined) {
            updateValues.push('');
          } else {
            // Convert non-string to empty string
            updateValues.push('');
          }
        } else {
          updateValues.push(req.body[key]);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ ok: false, error: "No hay campos válidos para actualizar" });
    }
    
    updateValues.push(localId);
    
    await db.query(`
      UPDATE locales SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues);
    
    res.json({
      ok: true,
      message: "Información general actualizada exitosamente"
    });
    
  } catch (error) {
    console.error("Error in updateMyLocal:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// GET /api/me/local/details - Get own extended details
exports.getMyLocalDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's local_id first
    const [userRows] = await db.query(
      'SELECT id, rol, local_id FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "USER_NOT_FOUND"
      });
    }
    
    const user = userRows[0];
    
    // Validate user role and local_id assignment
    if (user.rol !== 'local') {
      return res.status(403).json({ 
        ok: false, 
        error: "ROLE_NOT_LOCAL"
      });
    }
    
    if (!user.local_id) {
      return res.status(404).json({ 
        ok: false, 
        error: "NO_LOCALE_ASSIGNED"
      });
    }
    
    // Find locale by local_id (authoritative binding)
    const [locales] = await db.query(
      'SELECT * FROM locales WHERE id = ?',
      [user.local_id]
    );
    
    if (locales.length === 0) {
      return res.status(404).json({ ok: false, error: "Local no encontrado" });
    }
    
    const locale = locales[0];
    
    // Attach details using shared helper
    await attachLocaleDetails(locale);
    
    // Return the full locale object with details
    res.json({ ok: true, data: locale });
    
  } catch (error) {
    console.error("Error in getMyLocalDetails:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// PATCH /api/me/local/details - Update own extended details
exports.updateMyLocalDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's local_id first
    const [userRows] = await db.query(
      'SELECT id, rol, local_id FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "USER_NOT_FOUND"
      });
    }
    
    const user = userRows[0];
    
    // Validate user role and local_id assignment
    if (user.rol !== 'local') {
      return res.status(403).json({ 
        ok: false, 
        error: "ROLE_NOT_LOCAL"
      });
    }
    
    if (!user.local_id) {
      return res.status(404).json({ 
        ok: false, 
        error: "NO_LOCALE_ASSIGNED"
      });
    }
    
    const localId = user.local_id;
    
    // DETECT FORMAT: If section_key exists, use OLD single-section format
    if (req.body.hasOwnProperty('section_key')) {
      return await handleSingleSectionUpdate(localId, req.body, res);
    }
    
    // NEW FORMAT: Bulk object save
    return await handleBulkDetailsUpdate(localId, req.body, res);
    
  } catch (error) {
    console.error("Error in updateMyLocalDetails:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};

// OLD FORMAT: Single section update (backward compatibility)
async function handleSingleSectionUpdate(localId, body, res) {
  const { section_key, content, section_type = 'json' } = body;
  
  if (!section_key || content === undefined) {
    return res.status(400).json({ 
      ok: false, 
      error: "section_key y content son requeridos" 
    });
  }
  
  await upsertLocalDetail(localId, section_key, content, section_type);
  
  res.json({
    ok: true,
    message: "Detalle actualizado exitosamente"
  });
}

// NEW FORMAT: Bulk object save
async function handleBulkDetailsUpdate(localId, body, res) {
  // Supported fields mapping: key -> section_type
  const FIELD_CONFIG = {
    headline: 'text',
    subheadline: 'text',
    description: 'text',
    highlights: 'array',
    services: 'array',
    cta_label: 'text',
    cta_url: 'text',
    map_url: 'text',
    promotion_text: 'text',
    featured_products: 'array',
    business_tags: 'array'
  };
  
  const ARRAY_FIELDS = ['highlights', 'services', 'featured_products', 'business_tags'];
  
  let updatedCount = 0;
  
  for (const [key, value] of Object.entries(body)) {
    if (!FIELD_CONFIG.hasOwnProperty(key)) continue;
    if (value === undefined || value === null) continue;
    
    let processedValue = value;
    let sectionType = FIELD_CONFIG[key];
    
    // Convert comma-separated strings to arrays for array fields
    if (ARRAY_FIELDS.includes(key) && typeof value === 'string') {
      processedValue = value
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    await upsertLocalDetail(localId, key, processedValue, sectionType);
    updatedCount++;
  }
  
  res.json({
    ok: true,
    message: `Detalles actualizados exitosamente (${updatedCount} campos)`,
    updated: updatedCount
  });
}

// Helper: Upsert a single local detail row
async function upsertLocalDetail(localId, section_key, content, section_type) {
  const [existing] = await db.query(
    "SELECT id FROM local_details WHERE local_id = ? AND section_key = ?",
    [localId, section_key]
  );
  
  // Fix JSON storage: ensure content is properly stringified
  let contentJson;
  if (typeof content === 'string') {
    // If it's already a string, check if it's valid JSON
    try {
      JSON.parse(content);
      contentJson = content; // Already valid JSON string
    } catch {
      // Not valid JSON, wrap as JSON string
      contentJson = JSON.stringify(content);
    }
  } else {
    // If it's an object/array, stringify it
    contentJson = JSON.stringify(content);
  }
  
  if (existing.length > 0) {
    // Update existing
    await db.query(`
      UPDATE local_details 
      SET content = ?, section_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE local_id = ? AND section_key = ?
    `, [contentJson, section_type, localId, section_key]);
  } else {
    // Create new
    await db.query(`
      INSERT INTO local_details (local_id, section_key, section_type, content)
      VALUES (?, ?, ?, ?)
    `, [localId, section_key, section_type, contentJson]);
  }
}

// PATCH /api/me/local/media - Update media URLs
exports.updateMyLocalMedia = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's local_id first
    const [userRows] = await db.query(
      'SELECT id, rol, local_id FROM usuarios WHERE id = ?',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: "USER_NOT_FOUND"
      });
    }
    
    const user = userRows[0];
    
    // Validate user role and local_id assignment
    if (user.rol !== 'local') {
      return res.status(403).json({ 
        ok: false, 
        error: "ROLE_NOT_LOCAL"
      });
    }
    
    if (!user.local_id) {
      return res.status(404).json({ 
        ok: false, 
        error: "NO_LOCALE_ASSIGNED"
      });
    }
    
    const localId = user.local_id;
    const { 
      // Social links - user editable
      instagram_url, 
      facebook_url, 
      tiktok_url, 
      website_url,
      // logo_url and cover_image_url are no longer user-editable
      // These fields are ignored if sent in payload
    } = req.body;
    
    const updateFields = [];
    const updateValues = [];
    
    // Social links - user editable
    if (instagram_url !== undefined) {
      updateFields.push("instagram_url = ?");
      updateValues.push(instagram_url);
    }
    
    if (facebook_url !== undefined) {
      updateFields.push("facebook_url = ?");
      updateValues.push(facebook_url);
    }
    
    if (tiktok_url !== undefined) {
      updateFields.push("tiktok_url = ?");
      updateValues.push(tiktok_url);
    }
    
    if (website_url !== undefined) {
      updateFields.push("website_url = ?");
      updateValues.push(website_url);
    }
    
    // Note: logo_url and cover_image_url are no longer user-editable
    // These fields are intentionally ignored even if sent in payload
    
    if (updateFields.length === 0) {
      return res.status(400).json({ ok: false, error: "No hay campos para actualizar" });
    }
    
    updateValues.push(localId);
    
    await db.query(`
      UPDATE locales SET ${updateFields.join(', ')} WHERE id = ?
    `, updateValues);
    
    res.json({
      ok: true,
      message: "Social links actualizados exitosamente"
    });
    
  } catch (error) {
    console.error("Error in updateMyLocalMedia:", error);
    res.status(500).json({ ok: false, error: "Error del servidor" });
  }
};
