import express from "express";
import { Subject, Topic, Block } from "../models/Notes";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = express.Router();

router.use(requireAuth);

// Subjects
router.get("/subjects", async (req: AuthRequest, res) => {
  try {
    const subjects = await Subject.find({ userId: req.userId });
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: "Error fetching subjects" });
  }
});

router.post("/subjects", async (req: AuthRequest, res) => {
  try {
    const subject = new Subject({ ...req.body, userId: req.userId });
    await subject.save();
    res.status(201).json(subject);
  } catch (error) {
    res.status(500).json({ error: "Error creating subject" });
  }
});

router.delete("/subjects/:id", async (req: AuthRequest, res) => {
  try {
    await Subject.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    await Topic.deleteMany({ subjectId: req.params.id, userId: req.userId });
    res.json({ message: "Subject deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting subject" });
  }
});

// Topics
router.get("/topics", async (req: AuthRequest, res) => {
  try {
    const topics = await Topic.find({ userId: req.userId }).sort({ order: 1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: "Error fetching topics" });
  }
});

router.post("/topics", async (req: AuthRequest, res) => {
  try {
    const topic = new Topic({ ...req.body, userId: req.userId });
    await topic.save();
    
    // Create an initial empty block for the new topic
    const initialBlock = new Block({
      topicId: topic._id,
      userId: req.userId,
      type: "text",
      content: "",
      order: 0
    });
    await initialBlock.save();

    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ error: "Error creating topic" });
  }
});

router.put("/topics/reorder", async (req: AuthRequest, res) => {
  try {
    const { updates } = req.body; // Array of { id, order }
    const bulkOps = updates.map((update: any) => ({
      updateOne: {
        filter: { _id: update.id, userId: req.userId },
        update: { order: update.order },
      },
    }));
    await Topic.bulkWrite(bulkOps);
    res.json({ message: "Topics reordered" });
  } catch (error) {
    res.status(500).json({ error: "Error reordering topics" });
  }
});

router.delete("/topics/:id", async (req: AuthRequest, res) => {
  try {
    await Topic.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    await Block.deleteMany({ topicId: req.params.id, userId: req.userId });
    res.json({ message: "Topic deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting topic" });
  }
});

// Blocks
router.get("/blocks/:topicId", async (req: AuthRequest, res) => {
  try {
    const blocks = await Block.find({ topicId: req.params.topicId, userId: req.userId }).sort({ order: 1 });
    res.json(blocks);
  } catch (error) {
    res.status(500).json({ error: "Error fetching blocks" });
  }
});

router.post("/blocks", async (req: AuthRequest, res) => {
  try {
    const block = new Block({ ...req.body, userId: req.userId });
    await block.save();
    res.status(201).json(block);
  } catch (error) {
    res.status(500).json({ error: "Error creating block" });
  }
});

router.put("/blocks/:id", async (req: AuthRequest, res) => {
  try {
    const block = await Block.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    res.json(block);
  } catch (error) {
    res.status(500).json({ error: "Error updating block" });
  }
});

router.delete("/blocks/:id", async (req: AuthRequest, res) => {
  try {
    await Block.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Block deleted" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting block" });
  }
});

export default router;
