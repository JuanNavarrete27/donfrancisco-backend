const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const soloAdmin = require("../middlewares/soloAdmin");
const ctrl = require("../controllers/noticiasController");

// público
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);

// admin
router.post("/", auth, soloAdmin, ctrl.create);
router.put("/:id", auth, soloAdmin, ctrl.update);
router.delete("/:id", auth, soloAdmin, ctrl.remove);

module.exports = router;
