const Product = require("../models/productModel");
const mongoose = require("mongoose");

exports.createProduct = async (req, res) => {
  try {
    const { brandid, productname, description, price, quantity, category } =
      req.body;

    // Validate that brand is an ObjectId
    if (!mongoose.Types.ObjectId.isValid(brandid)) {
      return res.status(400).json({ error: "Invalid brand ID" });
    }

    const product = new Product({
      brandid,
      productname,
      description,
      price,
      quantity,
      category,
    });

    await product.save();
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { search, sortBy, filterBy, limit = 10, page = 1 } = req.query;
    const query = {};

    // Handle category or brand filter
    if (filterBy) {
      if (mongoose.Types.ObjectId.isValid(filterBy)) {
        query.brand = filterBy; // Filtering by brand ID (ObjectId)
      } else {
        query.category = filterBy; // Filtering by category name (string)
      }
    }

    let productsQuery = Product.find(query);

    // Handle search query (case-insensitive search on product name)
    if (search) {
      productsQuery = productsQuery.find({
        name: { $regex: search, $options: "i" },
      });
    }

    // Handle sorting
    if (sortBy) {
      productsQuery = productsQuery.sort({ [sortBy]: 1 }); // Sorting by specified field
    }

    // Pagination
    productsQuery = productsQuery
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const products = await productsQuery;
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getBrandProducts = async (req, res) => {
  try {
    const { brandId } = req.query;
    if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ error: "Invalid or missing brand ID" });
    }
    const products = await Product.find({ brandId })
      .skip((req.query.page - 1) * req.query.limit)
      .limit(parseInt(req.query.limit));

    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "brand",
      null,
      null,
      { strictPopulate: false }
    ); 
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { brand, name, description, price, quantity, category } = req.body;

    // Validate that brand is an ObjectId
    if (brand && !mongoose.Types.ObjectId.isValid(brand)) {
      return res.status(400).json({ error: "Invalid brand ID" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { brand, name, description, price, quantity, category },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
