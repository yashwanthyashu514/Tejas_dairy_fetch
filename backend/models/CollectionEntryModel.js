import mongoose from "mongoose";

const collectionEntrySchema = new mongoose.Schema(
  {
    // Relational link to the Client document
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    // Optional: Storing the string ID (e.g., TJD-001) makes frontend mapping easier
    clientSerialId: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      // Enforces the YYYY-MM-DD format you are using in the frontend
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
      index: true,
    },
    shift: {
      type: String,
      required: true,
      enum: ["AM", "PM"], // Restricts input to only these two values
    },
    kgs: {
      type: Number,
      min: 0,
      default: 0,
    },
    ltrs: {
      type: Number,
      required: true,
      min: 0,
    },
    fat: {
      type: Number,
      required: true,
      min: 0,
    },
    snf: {
      type: Number,
      required: true,
      min: 0,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paid: {
      type: Boolean,
      default: false,
      index: true, // Speeds up queries when searching for unpaid bills
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to prevent duplicate entries for the same client, on the same date, in the same shift
collectionEntrySchema.index(
  { clientId: 1, date: 1, shift: 1 },
  { unique: true },
);

const CollectionEntry = mongoose.model(
  "CollectionEntry",
  collectionEntrySchema,
);

export default CollectionEntry;
