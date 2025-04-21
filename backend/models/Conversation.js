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
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Export the model
const Conversation = mongoose.model("Conversation", conversationSchema);
module.exports = Conversation;
