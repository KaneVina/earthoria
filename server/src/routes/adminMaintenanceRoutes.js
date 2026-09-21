const express = require("express");
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  toggleTaskDone,
  moveTask,
  deleteTask,
} = require("../controllers/adminMaintenanceController");

router.get("/tasks", getTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.patch("/tasks/:id/confirm", toggleTaskDone);
router.patch("/tasks/:id/move", moveTask);
router.delete("/tasks/:id", deleteTask);

module.exports = router;