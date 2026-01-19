const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const soloAdmin = require("../middlewares/soloAdmin");
const ctrl = require("../controllers/noticiasController");

// ✅ NUEVO: Admin o Marketing
function soloAdminOrMarketing(req, res, next) {
  try {
    const raw =
      (req.user?.rol || req.user?.role || req.user?.perfil || "").toString().toLowerCase().trim();

    // ✅ permitidos
    if (raw === "admin" || raw === "administrador" || raw === "marketing") {
      return next();
    }

    return res.status(403).json({ error: "Acceso denegado: se requiere Admin o Marketing" });
  } catch (e) {
    return res.status(403).json({ error: "Acceso denegado" });
  }
}

// público
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);

// ✅ admin + marketing
router.post("/", auth, soloAdminOrMarketing, ctrl.create);
router.put("/:id", auth, soloAdminOrMarketing, ctrl.update);
router.delete("/:id", auth, soloAdminOrMarketing, ctrl.remove);

module.exports = router;
