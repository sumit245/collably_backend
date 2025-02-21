const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the schema
const BrandSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: false,
    },
    brandLogo: {
      type: String,
      required: false,
    },
    brandDescription: {
      type: String,
      required: false,
    },
    brandCategory: {
      type: String,
      required: false,
    },
    contactEmail: {
      type: String,
      required: true,
      unique: true,
    },
    brandWebsite: {
      type: String,
      required: false,
    },
    brandPhoneNumber: {
      type: String,
      required: false,
    },
    socialMediaLinks: {
      type: Map,
      of: String,
      default: {},
    },
    gstNumber: {
      type: String,
      required: false,
      unique: false,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Pre-save hook to hash password if it's modified
BrandSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords during login
BrandSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Check if model is already defined and use it if so
const Brand = mongoose.models.Brand || mongoose.model("Brand", BrandSchema);

module.exports = Brand;
