const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    // Participants in the conversation (required minimum: 2)
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    // Flag to check if it's a group chat
    isGroup: {
      type: Boolean,
      default: false,
    },

    // Optional name (for group chats)
    name: {
      type: String,
      default: "",
      trim: true,
    },

    // Reference to the last message (used in previews)
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    // Typing indicator for group chats (optional)
    isTyping: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Optional group name
    groupName: {
      type: String,
      trim: true,
    },

    // Reference to the group admin
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Create indexes
conversationSchema.index({ participants: 1 });

// Check if the model already exists before creating it
const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
