const Product = require("../models/productModel");


exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
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


    if (filterBy) {
      query.category = filterBy;
    }

    let products = Product.find(query);

 
    if (search) {
      products = products.find({ name: { $regex: search, $options: "i" } });
    }


    if (sortBy) {
      products = products.sort({ [sortBy]: 1 });
    }

 
    products = products.skip((page - 1) * limit).limit(parseInt(limit));

    const result = await products;
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
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
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
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
