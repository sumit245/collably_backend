const Product = require("../models/productModel");
const mongoose = require("mongoose");

exports.createProduct = async (req, res) => {
  try {
    const { brandId, productname, description, price, quantity, category } = req.body;

    if (!mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ error: "Invalid brand ID" });
    }

    const productData = {
      brandId,
      productname,
      description,
      price,
      quantity,
      category,
    };

    // Handle multiple product photos
    if (req.files && req.files.productPhoto && Array.isArray(req.files.productPhoto)) {
      productData.productPhotos = req.files.productPhoto.map(file => file.location);
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { brandId, productname, description, price, quantity, category } = req.body;

    if (brandId && !mongoose.Types.ObjectId.isValid(brandId)) {
      return res.status(400).json({ error: "Invalid brand ID" });
    }

    const updateData = {
      ...(brandId && { brandId }),
      ...(productname && { productname }),
      ...(description && { description }),
      ...(price && { price }),
      ...(quantity && { quantity }),
      ...(category && { category }),
    };

    // Handle multiple product photos
    if (req.files && req.files.productPhoto && Array.isArray(req.files.productPhoto)) {
      updateData.productPhotos = req.files.productPhoto.map(file => file.location);
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", updatedProduct });
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

   
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

 
    console.log('Page:', page);
    console.log('Limit:', limit);

   
    const products = await Product.find({ brandId })
      .skip((page - 1) * limit)
      .limit(limit);

   
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
