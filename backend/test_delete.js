const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testDelete() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZDQwMmRkY2IwOTEyYTMxOWYxNDI2ZCIsInR5cGUiOiJlbXBsb3llZSIsImlhdCI6MTc1ODc3MzA4MCwiZXhwIjoxNzU5Mzc3ODgwfQ.sZhQk6m94fqgJODsFdB9aMhBvU8C3MCDRh4rZwGOE2U';

  // First create a product
  const createOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/inventory',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  };

  const product = {
    name: 'Delete Test Product',
    sku: 'DELETE001',
    category: 'Groceries',
    brand: 'Test Brand',
    basePrice: 50,
    sellingPrice: 60,
    costPrice: 40,
    stockQuantity: 25,
    unit: 'piece',
    taxCategory: 'GST_18'
  };

  console.log('Creating test product...');
  const createResponse = await makeRequest(createOptions, product);
  console.log('Create response:', createResponse.status, createResponse.data.message);

  if (createResponse.status === 201) {
    const productId = createResponse.data.data.product._id;
    console.log('Product created with ID:', productId);

    // Now delete the product
    const deleteOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inventory/' + productId,
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    };

    console.log('Deleting product...');
    const deleteResponse = await makeRequest(deleteOptions);
    console.log('Delete response:', deleteResponse.status, deleteResponse.data.message);

    // Check if product is gone from list
    const getOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inventory',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token
      }
    };

    console.log('Checking if product is removed from list...');
    const getResponse = await makeRequest(getOptions);
    const products = getResponse.data.data.products;
    const deletedProduct = products.find(p => p._id === productId);
    console.log('Product still in list?', !!deletedProduct);
    console.log('Total products in list:', products.length);
  }
}

testDelete().catch(console.error);