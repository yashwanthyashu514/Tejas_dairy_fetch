import mongoose from "mongoose"; // Changed from require

const clientSchema = new mongoose.Schema(
  {
    serialId: {
      type: String,
      required: [true, "Serial ID is required"],
      unique: true,
      trim: true,
      uppercase: true, // e.g., converts "tjd-001" to "TJD-001"
      index: true, // Makes searching by ID much faster
    },
    name: {
      type: String,
      required: [true, "Client name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    whatsapp: {
      type: String,
      match: [/^\d{10}$/, "Please enter a valid 10-digit WhatsApp number"],
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    bankAccount: {
      type: String,
      trim: true,
      default: "",
    },
    ifsc: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  },
);

// Changed from module.exports to export default
const ClientModel = mongoose.model("Client", clientSchema);
export default ClientModel;
